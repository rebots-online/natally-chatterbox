import { validToolCall } from './astrology-tools.mjs';

export async function readEventStream(response, onEvent, signal) {
  signal?.throwIfAborted();
  if (!response.body) throw new Error('The response stream is missing.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const abort = () => { void reader.cancel(signal.reason).catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      signal?.throwIfAborted();
      const { value, done } = await reader.read();
      signal?.throwIfAborted();
      buffer += decoder.decode(value, { stream: !done });
      let boundary;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        if (frame.length > 262144) throw new Error('An event-stream frame exceeded the limit.');
        const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (data === '[DONE]') return;
        if (data) await onEvent(JSON.parse(data));
      }
      if (buffer.length > 262144) throw new Error('An event-stream frame exceeded the limit.');
      if (done) {
        if (buffer.trim()) throw new Error('The response stream ended inside an event.');
        return;
      }
    }
  } finally { signal?.removeEventListener('abort', abort); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export function streamCompletion(upstream, headers, model, signal, toolBudget = 6) {
  const abort = new AbortController();
  const combined = signal ? AbortSignal.any([signal, abort.signal]) : abort.signal;
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    async start(controller) {
      const emit = event => controller.enqueue(encoder.encode('data: ' + JSON.stringify(event) + '\n\n'));
      let text = ''; let finishReason = null;
      const calls = new Map();
      try {
        await readEventStream(upstream, data => {
          if (data.error) throw new Error('The hosted model reported a streaming error.');
          const choice = data.choices?.[0];
          if (!choice) return;
          if (typeof data.model === 'string') model = data.model;
          if (finishReason !== null && (choice.delta?.content || choice.delta?.tool_calls?.length)) throw new Error('The model appended content after completion.');
          if (typeof choice.delta?.content === 'string' && choice.delta.content) {
            text += choice.delta.content;
            if (text.length > 48000) throw new Error('The streamed answer exceeded the limit.');
            emit({ type: 'text', text: choice.delta.content });
          }
          for (const part of choice.delta?.tool_calls || []) {
            if (!Number.isInteger(part.index) || part.index < 0 || part.index >= toolBudget) throw new Error('Invalid calculation stream index.');
            const call = calls.get(part.index) || { id: '', type: 'function', function: { name: '', arguments: '' } };
            if (typeof part.id === 'string') call.id += part.id;
            if (part.type && part.type !== 'function') throw new Error('Invalid streamed calculation type.');
            if (typeof part.function?.name === 'string') call.function.name += part.function.name;
            if (typeof part.function?.arguments === 'string') call.function.arguments += part.function.arguments;
            if (call.id.length > 128 || call.function.name.length > 128 || call.function.arguments.length > 4000) throw new Error('Streamed calculation exceeded its limit.');
            calls.set(part.index, call);
          }
          if (choice.finish_reason !== undefined && choice.finish_reason !== null) finishReason = choice.finish_reason;
        }, combined);
        combined.throwIfAborted();
        const toolCalls = [...calls.entries()].sort((a, b) => a[0] - b[0]).map(([, call]) => call);
        if (toolCalls.length) {
          if (finishReason !== 'tool_calls' || !toolCalls.every(validToolCall) || new Set(toolCalls.map(call => call.id)).size !== toolCalls.length) throw new Error('The model returned an incomplete calculation stream.');
          emit({ type: 'tools', toolCalls, text, model, source: 'hosted' });
        } else {
          if (finishReason !== 'stop' || !text.trim()) throw new Error('The hosted model returned an empty or incomplete answer stream.');
          emit({ type: 'done', text, model, source: 'hosted' });
        }
      } catch (error) {
        if (!combined.aborted) emit({ type: 'error', error: error instanceof Error ? error.message : 'Hosted response stream failed.' });
      } finally { try { controller.close(); } catch {} }
    },
    cancel(reason) { abort.abort(reason); },
  }), { headers: { ...headers, 'Content-Type': 'text/event-stream; charset=utf-8', 'X-Accel-Buffering': 'no' } });
}

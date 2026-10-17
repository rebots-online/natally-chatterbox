import { readEventStream } from '../../netlify/lib/event-stream.mjs';

export interface HostedPayload {
  prompt: string;
  systemInstruction: string;
  history?: Array<{ role: string; content: string }>;
  image?: { data: string; mimeType: string };
  temperature?: number;
}

export class HostedAuthenticationError extends Error {
  readonly code = 'auth_required';
  constructor(message = 'Sign in to receive your hosted reading. Your question is kept here.') {
    super(message);
    this.name = 'HostedAuthenticationError';
  }
}

export type CalculationExecutor = (name: string, args: string) => Promise<string>;

export async function completeHosted(payload: HostedPayload, token: string, endpoint: string, execute?: CalculationExecutor, isCurrentSession: () => boolean = () => true,
  onText?: (text: string) => void, signal?: AbortSignal) {
  if (!isCurrentSession()) throw new HostedAuthenticationError('The account session changed.');
  if (!token) throw new HostedAuthenticationError();
  if (!endpoint) throw new Error('Hosted chat endpoint is not configured.');
  const toolMessages: any[] = [];
  let preface = '';
  for (let round = 0; round <= 6; round++) {
    if (!isCurrentSession()) throw new HostedAuthenticationError('The account session changed.');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ ...payload, ...(onText ? { stream: true } : {}), ...(execute ? { enableCalculations: true, toolMessages } : {}) }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(65000)]) : AbortSignal.timeout(65000),
    });
    let result: { text?: string; model?: string; source?: string; error?: string; toolCalls?: any[] } = {};
    if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
      let streamedText = ''; let terminal = false;
      await readEventStream(response, (event: { type: string; text?: string; error?: string; model?: string; source?: string; toolCalls?: any[] }) => {
        if (!isCurrentSession()) throw new DOMException('The conversation turn changed.', 'AbortError');
        signal?.throwIfAborted();
        if (terminal) throw new Error('Hosted chat appended data after completion.');
        if (event.type === 'error') throw new Error(event.error || 'Hosted chat stream failed.');
        if (event.type === 'text' && typeof event.text === 'string') {
          streamedText += event.text;
          if (streamedText.length + preface.length > 48000) throw new Error('Hosted chat returned too much text.');
          onText?.(preface + streamedText);
        } else if (['done', 'tools'].includes(event.type) && event.text === streamedText) { result = event; terminal = true; }
        else throw new Error('Hosted chat returned an invalid streaming event.');
      }, signal);
      if (!terminal) throw new Error('Hosted chat ended before confirming a complete answer.');
    } else {
      try { result = await response.json(); }
      catch { throw new Error('Hosted chat returned an invalid response. Please retry.'); }
    }
    if (!isCurrentSession()) throw new HostedAuthenticationError('The account session changed.');
    if (response.status === 401) throw new HostedAuthenticationError(result.error || 'Your session expired. Sign in again to continue.');
    if (!response.ok) throw new Error(result.error || 'Hosted chat failed (HTTP ' + response.status + ').');
    if (result.source === 'hosted' && result.model && result.toolCalls?.length) {
      const { validToolCall } = await import('../../netlify/lib/astrology-tools.mjs');
      const calls = result.toolCalls;
      const completed = toolMessages.filter(message => message.role === 'tool').length;
      if (!execute || round >= 6 || !Array.isArray(calls) || completed + calls.length > 6 || !calls.every(validToolCall) ||
          new Set(calls.map(call => call.id)).size !== calls.length || calls.some(call => toolMessages.some(message => message.tool_call_id === call.id))) throw new Error('Invalid calculation request or calculation limit reached.');
      const results = [];
      for (const call of calls) {
        if (!isCurrentSession()) throw new HostedAuthenticationError('The account session changed.');
        const content = await execute(call.function.name, call.function.arguments);
        if (typeof content !== 'string' || content.length > 24000) throw new Error('Calculation result is too large.');
        results.push({ role: 'tool', tool_call_id: call.id, content });
      }
      toolMessages.push({ role: 'assistant', content: result.text || null, tool_calls: calls }, ...results);
      if (result.text?.trim()) preface += result.text + '\n\n';
      continue;
    }
    if (result.source !== 'hosted' || !result.text?.trim() || !result.model) {
      throw new Error('Hosted chat returned no verified model response. Please retry.');
    }
    return { text: preface + result.text, model: result.model };
  }
  throw new Error('Calculation limit reached. Please narrow the request.');
}

export async function requestHostedInference(payload: HostedPayload, execute?: CalculationExecutor, isCurrentSession: () => boolean = () => true,
  onText?: (text: string) => void, signal?: AbortSignal) {
  if (!isCurrentSession()) throw new HostedAuthenticationError('The account session changed.');
  const { auth } = await import('./firebase');
  await auth.authStateReady();
  if (!isCurrentSession()) throw new HostedAuthenticationError('The account session changed.');
  const owner = auth.currentUser;
  const token = await owner?.getIdToken();
  if (!isCurrentSession() || auth.currentUser !== owner) throw new HostedAuthenticationError('The account session changed.');
  return completeHosted(payload, token || '', import.meta.env.VITE_CHAT_API_URL || '', execute, () => isCurrentSession() && auth.currentUser === owner, onText, signal);
}

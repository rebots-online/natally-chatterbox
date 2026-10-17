import { ASTROLOGY_TOOLS, validToolCall, validToolMessages, toolCallCount } from '../lib/astrology-tools.mjs';
import { streamCompletion } from '../lib/event-stream.mjs';

const windows = new Map();

export async function handleChat(request, { env = process.env, fetchImpl = fetch, now = Date.now } = {}) {
  const origin = request.headers.get('origin');
  const allowedOrigin = env.FRONTEND_ORIGIN || 'https://natally.surge.sh';
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
    ...(origin === allowedOrigin ? {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    } : {}),
  };
  const respond = (status, body) => new Response(JSON.stringify(body), { status, headers });
  if (origin && origin !== allowedOrigin) return respond(403, { error: 'Origin is not permitted.' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return respond(405, { error: 'Use POST.' });
  const bearer = request.headers.get('authorization');
  if (!bearer?.startsWith('Bearer ') || bearer.length > 8192) return respond(401, { error: 'Sign in to use hosted chat.' });
  if (!env.ZAI_API_KEY || !env.FIREBASE_API_KEY) return respond(503, { error: 'Hosted chat is not configured.' });
  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 131072) return respond(413, { error: 'Conversation is too large.' });
    body = JSON.parse(raw);
  } catch {
    return respond(400, { error: 'Invalid JSON request.' });
  }
  if (!body || typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 12000 ||
      typeof body.systemInstruction !== 'string' || body.systemInstruction.length > 32000 ||
      (body.history !== undefined && (!Array.isArray(body.history) || body.history.length > 100 ||
        body.history.some(turn => !turn || !['user', 'assistant', 'model'].includes(turn.role) ||
          typeof turn.content !== 'string' || turn.content.length > 20000)))) {
    return respond(400, { error: 'Invalid chat input.' });
  }
  if (body.image) return respond(400, { error: 'Image inference is not enabled for this model.' });
  if (body.stream !== undefined && typeof body.stream !== 'boolean') return respond(400, { error: 'Invalid stream option.' });
  if ((body.enableCalculations !== undefined && typeof body.enableCalculations !== 'boolean') ||
      (body.toolMessages !== undefined && (!body.enableCalculations || !validToolMessages(body.toolMessages)))) {
    return respond(400, { error: 'Invalid calculation continuation.' });
  }
  try {
    const identity = await fetchImpl('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(env.FIREBASE_API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: bearer.slice(7) }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(8000)]),
    });
    if (!identity.ok) return respond(identity.status >= 500 ? 503 : 401, { error: 'Unable to verify your session. Sign in again or retry.' });
    const account = await identity.json();
    const user = account.users?.[0];
    if (!user?.localId || user.disabled) return respond(401, { error: 'Your session is not valid.' });
    const timestamp = now();
    for (const [key, value] of windows) if (value.until <= timestamp) windows.delete(key);
    const window = windows.get(user.localId) || { count: 0, until: timestamp + 60000 };
    if (window.count >= 12) return respond(429, { error: 'Too many messages. Please wait a minute.' });
    window.count += 1;
    windows.set(user.localId, window);
    const model = env.ZAI_MODEL || 'glm-5.3-flash';
    const messages = [
      { role: 'system', content: body.systemInstruction },
      ...(body.history || []).slice(-20).map(turn => ({ role: turn.role === 'model' ? 'assistant' : turn.role, content: turn.content })),
      { role: 'user', content: body.prompt },
      ...(body.toolMessages || []).map(turn => turn.role === 'assistant'
        ? { role: 'assistant', content: typeof turn.content === 'string' && turn.content.length <= 20000 ? turn.content : null, tool_calls: turn.tool_calls.map(call => ({ id: call.id, type: 'function', function: { name: call.function.name, arguments: call.function.arguments } })) }
        : { role: 'tool', tool_call_id: turn.tool_call_id, content: turn.content }),
    ];
    const upstream = await fetchImpl('https://api.z.ai/api/coding/paas/v4/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.ZAI_API_KEY },
      body: JSON.stringify({
        model, messages, thinking: { type: 'disabled' }, max_tokens: 2048,
        ...(body.stream ? { stream: true } : {}),
        ...(body.enableCalculations ? { tools: ASTROLOGY_TOOLS, tool_choice: toolCallCount(body.toolMessages) >= 6 ? 'none' : 'auto', parallel_tool_calls: false } : {}),
        temperature: typeof body.temperature === 'number' && Number.isFinite(body.temperature)
          ? Math.max(0, Math.min(1.5, body.temperature)) : 1.18,
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(45000)]),
    });
    if (!upstream.ok) return respond(upstream.status === 429 ? 429 : 502, {
      error: upstream.status === 429 ? 'The hosted model is rate limited. Please retry shortly.' : 'The hosted model rejected the request (HTTP ' + upstream.status + ').',
    });
    if (body.stream) return streamCompletion(upstream, headers, model, request.signal, body.enableCalculations ? 6 - toolCallCount(body.toolMessages) : 0);
    const completion = await upstream.json();
    const toolCalls = completion.choices?.[0]?.message?.tool_calls;
    if (toolCalls?.length) {
      if (!body.enableCalculations || !Array.isArray(toolCalls) || toolCallCount(body.toolMessages) + toolCalls.length > 6 || !toolCalls.every(validToolCall) || new Set(toolCalls.map(call => call.id)).size !== toolCalls.length || completion.choices?.[0]?.finish_reason === 'length') {
        return respond(502, { error: 'The model returned an invalid calculation request.', calculationDiagnostic: {
          count: toolCalls.length, firstCallValid: !!validToolCall(toolCalls[0]), truncated: completion.choices?.[0]?.finish_reason === 'length',
          limitReached: toolCallCount(body.toolMessages) + toolCalls.length > 6,
        } });
      }
      return respond(200, { toolCalls, text: typeof completion.choices?.[0]?.message?.content === 'string' ? completion.choices[0].message.content : '', model: completion.model || model, source: 'hosted' });
    }
    const text = completion.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim() || completion.choices?.[0]?.finish_reason === 'length') {
      return respond(502, { error: 'The hosted model returned an empty or incomplete answer. Please retry.' });
    }
    return respond(200, { text, model: completion.model || model, source: 'hosted' });
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return respond(timeout ? 504 : 502, { error: timeout ? 'Hosted chat timed out. Please retry.' : 'Hosted chat could not reach its provider. Please retry.' });
  }
}

export default request => handleChat(request);

export const config = { rateLimit: { action: 'rate_limit', aggregateBy: ['domain', 'ip'], windowSize: 60, windowLimit: 30 } };

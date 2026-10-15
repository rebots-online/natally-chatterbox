export const ASTROLOGY_TOOLS = [{
  type: 'function',
  function: {
    name: 'calculate_astrology',
    description: 'Execute Swiss Ephemeris calculations. lookup_place finds exact birthplace IDs. natal creates a chart from supplied birth details; transits calculates sky at an ISO UTC instant or now against a stored chart; synastry compares two stored natal charts. Never invent missing birth details. Results are numerical facts, not predictions.',
    parameters: {
      type: 'object', additionalProperties: false, required: ['operation'],
      properties: {
        operation: { type: 'string', enum: ['lookup_place', 'natal', 'transits', 'synastry'] },
        query: { type: 'string', description: 'Birthplace search text for lookup_place.' },
        name: { type: 'string', description: 'Person label for natal.' },
        date: { type: 'string', description: 'User-supplied birth date YYYY-MM-DD for natal.' },
        time: { type: 'string', description: 'User-supplied birth time HH:mm; use unknown only when the user says it is unknown.' },
        placeId: { type: 'string', description: 'Exact ID returned by lookup_place, never guessed.' },
        chartId: { type: 'string', description: 'primary, partner, or a chart ID returned by natal.' },
        otherChartId: { type: 'string', description: 'Second stored chart ID for synastry.' },
        at: { type: 'string', description: 'now or explicit UTC ISO timestamp ending Z for transits. Resolve dates using current UTC supplied in system context.' },
      },
    },
  },
}];

export function validToolCall(call) {
  return call && typeof call.id === 'string' && /^[\w-]{1,128}$/.test(call.id) && call.type === 'function' &&
    call.function?.name === 'calculate_astrology' && typeof call.function.arguments === 'string' && call.function.arguments.length <= 4000;
}

export function validToolMessages(messages) {
  if (!Array.isArray(messages) || messages.length > 12) return false;
  const ids = new Set();
  for (let index = 0; index < messages.length;) {
    const assistant = messages[index++];
    if (assistant?.role !== 'assistant' || !Array.isArray(assistant.tool_calls) || !assistant.tool_calls.length || assistant.tool_calls.length > 6) return false;
    for (const call of assistant.tool_calls) {
      const result = messages[index++];
      if (!validToolCall(call) || ids.has(call.id) || result?.role !== 'tool' || result.tool_call_id !== call.id ||
          typeof result.content !== 'string' || result.content.length > 24000) return false;
      ids.add(call.id);
      if (ids.size > 6) return false;
    }
  }
  return true;
}

export const toolCallCount = messages => (messages || []).filter(message => message.role === 'tool').length;

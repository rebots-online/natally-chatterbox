export const START_SPEECH_TOKEN = 6561;
export const STOP_SPEECH_TOKEN = 6562;
export const SILENCE_TOKEN = 4299;

export function assertFinishedGeneration(tokens: readonly number[], reachedEos: boolean): void {
  if (!reachedEos) throw new Error('Incomplete speech generation: the output token budget was exhausted. No partial audio was accepted.');
  if (!tokens.length) throw new Error('The local voice generated empty speech.');
}

/** Same temperature/top-k/top-p/repetition policy as the pinned conversion runner. */
export function chooseSpeechToken(logits: Float32Array, generated: readonly number[], random = Math.random, greedy = false): number {
  if (!logits.length || !logits.every(Number.isFinite)) throw new Error('Invalid speech logits.');
  const repeated = new Set(generated);
  const candidates = Array.from(logits, (score, token) => ({ token,
    score: (repeated.has(token) ? score < 0 ? score * 1.2 : score / 1.2 : score) / 0.8,
  })).sort((a, b) => b.score - a.score).slice(0, 1000);
  if (greedy) return candidates[0].token;
  const max = candidates[0].score;
  const weights = candidates.map(item => Math.exp(item.score - max));
  const total = weights.reduce((a, b) => a + b, 0);
  let kept = 0; let cumulative = 0;
  while (kept < candidates.length && cumulative < total * 0.95) cumulative += weights[kept++];
  let threshold = random() * cumulative;
  for (let i = 0; i < kept; i++) { threshold -= weights[i]; if (threshold <= 0) return candidates[i].token; }
  return candidates[kept - 1].token;
}

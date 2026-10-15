/** A budget groups complete utterance units; it never cuts a unit to size. */
export function planSpeechChunks(text: string, countTokens: (text: string) => number, maxTokens: number): string[] {
  if (!Number.isInteger(maxTokens) || maxTokens < 1) throw new Error('Invalid speech token budget.');
  const normalize = (value: string) => value.trim().replace(/\s+/gu, ' ');
  const whole = normalize(text);
  if (!whole) return [];
  if (countTokens(whole) <= maxTokens) return [whole];
  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const units: string[] = [];
  for (const line of text.split(/\r?\n/u).map(normalize).filter(Boolean)) {
    for (const part of segmenter.segment(line)) {
      const sentence = normalize(part.segment);
      if (!sentence) continue;
      const previous = units.at(-1);
      if (previous && /\b(?:Dr|Mr|Mrs|Ms|Prof|St|vs|e\.g|i\.e)\.$/iu.test(previous)) units[units.length - 1] += ' ' + sentence;
      else units.push(sentence);
    }
  }
  const chunks: string[] = [];
  let current = '';
  for (const unit of units) {
    if (countTokens(unit) > maxTokens) throw new Error('A complete sentence or equivalent exceeds the local voice model limit. No text was truncated.');
    const joined = current ? current + ' ' + unit : unit;
    if (current && countTokens(joined) > maxTokens) { chunks.push(current); current = unit; }
    else current = joined;
  }
  if (current) chunks.push(current);
  if (chunks.join(' ') !== whole) throw new Error('Speech unit planning did not preserve the complete text.');
  return chunks;
}

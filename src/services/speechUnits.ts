import type { SpeechUnit } from './chatterboxTypes';

export function planSpeechUnits(text: string, countTokens: (value: string) => number, maxTokens: number): SpeechUnit[] {
  if (!text.trim()) throw new Error('No text to speak.');
  if (!Number.isInteger(maxTokens) || maxTokens < 1) throw new Error('Invalid speech token capacity.');
  const units: SpeechUnit[] = [];
  const boundaries: number[] = [];
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('en', { granularity: 'sentence' }) : null;
  let start = 0;
  let end = 0;
  let candidate = text;
  let tokenCount = countTokens(text);
  if (tokenCount <= maxTokens) return [{ text, start: 0, end: text.length, tokenCount }];
  for (const paragraph of text.matchAll(/[^\r\n]+(?:\r?\n|$)/gu)) {
    if (!segmenter || /^\s*(?:[-•]|\d+[.)])\s/u.test(paragraph[0])) boundaries.push(paragraph.index! + paragraph[0].length);
    else for (const segment of segmenter.segment(paragraph[0])) boundaries.push(paragraph.index! + segment.index + segment.segment.length);
  }
  if (boundaries.at(-1) !== text.length) boundaries.push(text.length);
  for (const boundary of boundaries) {
    candidate = text.slice(start, boundary);
    tokenCount = countTokens(candidate);
    if (tokenCount > maxTokens) {
      if (end <= start) throw new Error('A complete sentence or logical unit exceeds the model capacity. No speech was truncated.');
      units.push({ text: text.slice(start, end), start, end, tokenCount: countTokens(text.slice(start, end)) });
      start = end;
      candidate = text.slice(start, boundary);
      tokenCount = countTokens(candidate);
      if (tokenCount > maxTokens) throw new Error('A complete sentence or logical unit exceeds the model capacity. No speech was truncated.');
    }
    end = boundary;
  }
  if (end > start) units.push({ text: text.slice(start, end), start, end, tokenCount: countTokens(text.slice(start, end)) });
  for (let index = 0; index < units.length; index++) if ((index === 0 ? units[index].start !== 0 : units[index - 1].end !== units[index].start) || units[index].text !== text.slice(units[index].start, units[index].end)) throw new Error('Speech planning lost source text.');
  return units;
}

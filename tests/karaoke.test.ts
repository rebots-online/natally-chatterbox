import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RichText } from '../src/components/RichText';
import { prepareSpeechWithOffsets } from '../src/services/voiceService';
import { keepKaraokeVisible } from '../src/services/karaokeScroll';

test('speech cleanup retains raw offsets through markup, whitespace, links and glyphs', () => {
  const raw = '  ## **Moon** ☽\n\nYour [chart](https://example.test) is here.\n---ASTROLOGICAL PROVENANCE---\nNot spoken';
  const prepared = prepareSpeechWithOffsets(raw);
  assert.equal(prepared.text, 'Moon Your chart is here.');
  for (const word of ['Moon', 'Your', 'chart', 'here.']) {
    assert.equal(prepared.sourceOffsets[prepared.text.indexOf(word)], raw.indexOf(word));
  }
  assert.equal(prepared.sourceOffsets.length, prepared.text.length);
});

test('rich text marks exactly the spoken word, including indented headings and adjacent tags', () => {
  const content = '  ## **Moon** and Sun\n\nMercury meets Venus.';
  for (const word of ['Moon', 'and', 'Sun', 'Mercury', 'meets', 'Venus']) {
    const html = renderToStaticMarkup(React.createElement(RichText, { content, isCurrentlySpeaking: true, highlightCharIndex: content.indexOf(word) }));
    assert.equal((html.match(/data-karaoke-active="true"/g) || []).length, 1, word);
    assert.match(html, new RegExp('data-karaoke-active="true"[^>]*>' + word));
  }
});

test('karaoke follows only offscreen text within its own scroll container', () => {
  const calls: ScrollToOptions[] = [];
  const container = { clientHeight: 200, clientTop: 0, scrollHeight: 1000, scrollTop: 200,
    getBoundingClientRect: () => ({ top: 100 }), scrollTo: (value: ScrollToOptions) => calls.push(value) } as unknown as HTMLElement;
  const word = (top: number) => ({ getBoundingClientRect: () => ({ top, bottom: top + 20, height: 20 }) }) as HTMLElement;
  assert.equal(keepKaraokeVisible(container, word(150)), false);
  assert.equal(calls.length, 0);
  assert.equal(keepKaraokeVisible(container, word(350)), true);
  assert.deepEqual(calls.pop(), { top: 380, behavior: 'smooth' });
  assert.equal(keepKaraokeVisible(container, word(50), true), true);
  assert.deepEqual(calls.pop(), { top: 80, behavior: 'instant' });
  keepKaraokeVisible(container, word(-900), true);
  assert.equal(calls.pop()?.top, 0);
});

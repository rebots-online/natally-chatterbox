# Karaoke visibility repair — Robin 03:16

| Entity | Target | Contract |
| --- | --- | --- |
| prepareSpeechWithOffsets | src/services/voiceService.ts:80 | (rawText:string)=>{text:string,sourceOffsets:number[]}; preserve existing speech cleanup with a UTF-16 source offset for every clean character; strip provenance, Markdown, link destinations, glyphs, collapse whitespace. prepareSpeechText delegates. |
| speakNatallyText | src/services/voiceService.ts:126 | Send raw-text offsets to onWordBoundary; emit first word on playback start, then approximate evenly spaced words. No claim of model-supplied timing. |
| RichText | src/components/RichText.tsx:11 | Mark the exact active word/tag data-karaoke-active=true; no proximity-based multiple highlights. Correct heading and leading-space offsets. |
| keepKaraokeVisible | src/services/karaokeScroll.ts:1 | (container:HTMLElement,active:HTMLElement,reducedMotion:boolean)=>boolean; move only container scrollTop via scrollTo when word is outside padded viewport, place near upper third, clamp to content; no document scroll. Instant for reduced motion. |
| NatallyChatbot effects | src/components/NatallyChatbot.tsx:205 | Follow active marker on word change/open within currently speaking message. Suppress unconditional bottom scrolling while reading. Stop previous speech before assigning a new active message to avoid stale onEnd clearing it. |
| tests | tests/karaoke.test.ts:1 | Raw/clean index mapping, exact marker render, scroller mock offscreen up/down/clamp/no-op/reduced-motion behavior. |

Verify all tests, TypeScript, build and diff check; publish and byte-match.
Actual mobile scrolling/listening is a separate runtime observation, not a claim
from mocks. No novel UI, no scrollIntoView on document, no global auto-scroll.

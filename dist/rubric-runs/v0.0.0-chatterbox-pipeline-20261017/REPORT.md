# Natally conversational speech — production-view run, 17 October 2026

**Verdict: DEFECTIVE on zero incremental latency; implementation and publication
are complete, acceptance is not.** No tolerance was substituted, no model
alternative was considered, and no claim of fundamental unavoidability is made.
The measured residual waits require an operator discussion of the pipeline.

## Build and method

- Actual app: https://natally-chatterbox.surge.sh/, native Windows Chrome with
  the existing real signed-in profile. F4 voice and saved settings retained.
- Initial reviewed implementation: source `3e9d455`, bundle `54e3f53`, Surge
  `1792258664014`. All 40 served payload files matched local SHA-256.
- Timing amendment/source/bundle: `66422549e7b4007f03bf651c9c3f8a1fd9ef0e06`,
  Surge `1792259067502`. All 48 served payload files matched local SHA-256.
  CNAME is hosting configuration rather than a served payload. Historical
  evidence is preserved locally/Git; raw historical frames/runtime folders were
  excluded from the deployed payload.
- Existing backend alias retained:
  `natally-chatterbox--natally-hosted-chat.netlify.app`, Netlify deploy
  `6ad3b228c6ce2c3e210cd8c0`. Same provider/model/auth/rate/tool configuration;
  exact-origin preflight succeeded. Existing host CLI login was used after the
  app connector reported expired authentication. Branch context was preserved.
  Backend-only staging used syntax validation as its build command, because
  the stage intentionally did not install the frontend Vite dependency tree.
- Normal root-dist Vite production build, TypeScript, changed-server syntax
  and diff checks passed. Existing Swiss externalization, bundle-size and
  ineffective dynamic-import warnings remain. Independent whole-change review
  found four Important defects, all repaired and re-reviewed. The subsequent
  timestamp-only amendment also passed independent source review.
- No unit suite, coded browser harness, synthetic identity/provider/audio or
  model replacement was used. Every prompt went through normal chat controls.
  Debug panels stayed closed; the inherited voice test page was not used here.

## Measurement boundary

`observations.json` contains read-only observations of the normal status element,
including its numeric data attributes. Those attributes mirror the actual
SpeechProgress state: submission handler, source.start calls, playback settlement,
complete-unit text availability and completed/ready counts. Timestamps are browser
wall-clock milliseconds; they are **not acoustic onset or microphone recordings**.
First-unit text means the first complete eligible speech unit, not first token.

The screen evidence consists of indexed stills, not a continuous recording. No
audio capture capability was available in this browser surface. A screenshot
attempt at 17:38:59 timed out and produced no image; it is not treated as playback
evidence. Full authenticated captures and DOM observations contain private profile
and conversation data and remain local outside Git. Public stills show only the
ordinary-chat status region. Listening/prosody/completeness remain unverified.

## Native six-sentence timing sample

Ordinary Send at `submittedAt=1792259133009`, with the restored 6/6 palette:

| Native boundary | Raw timestamp | Difference |
|---|---:|---:|
| Receipt source scheduled | 1792259133018 | 9 ms after submission handler |
| Receipt settled | 1792259134383 | 1,365 ms receipt interval |
| First complete answer unit available | 1792259140232 | 7,223 ms after submission |
| Post-inference bridge source scheduled | 1792259140233 | 1 ms after eligible text |
| Bridge settled | 1792259141727 | 1,494 ms bridge interval |
| First answer source scheduled | 1792259144496 | 11,487 ms after submission; 4,264 ms after eligible text |
| Last answer playback settled | 1792259164721 | All 6/6 units completed |
| Maximum answer-to-answer gap | — | 1,006 ms |

There was a **5,850 ms** interval from receipt settlement to bridge scheduling,
then **2,769 ms** from bridge settlement to first answer scheduling. Prepared
acknowledgement selection works promptly, but these positive residual intervals
and answer queue starvation fail LAT-ZERO. Filling part of a wait does not pass it.
The automation observed this Send 816 ms after initiating its click; that driver
observation bound and the 9 ms native handler-to-source interval are distinct.

## Indexed ordinary-app observations

Times are UTC on 17 October. The JSON preserves more individual observations.

| Time / evidence | Direct observation |
|---|---|
| 17:38 opening | No bottom diagnostic panel. Ordinary chat showed saved greeting speech and 0/6 idle acknowledgements. Before the first submitted check, the palette had reached 3/6; this was **not** an empty-pool Send. |
| 17:38:59 | Two-sentence hosted reply visible; normal status still Preparing sentence 1 at 7.1 s. |
| 17:39:09; [still 01](01-completed-status.jpg) | Native path completed 2/2 ready and 2/2 played. Idle pool reached 6/6. |
| 17:39:55; [still 02](02-long-turn-status.jpg) | Six-sentence garden reply: Preparing sentence 1 at 8.5 s; later Speaking sentence 3, 3/6 ready and 2/6 played. |
| 17:40:35 | Garden reply finished 6/6 played. |
| 17:40:49–52; [still 03](03-interruption-status.jpg) | During rain reply Speaking sentence 2 (1/3 played), submitted read-ahead/redirection. Normal status changed to Interruption received. New reply concerned a sunny morning; old displayed text remained available. |
| 17:41:29–30 | Submitted a change of subject while Preparing sentence 1, 0/4 ready. Replacement status observed 322 ms after click; subsequent ordinary inference/playback remained usable with no visible model reload. |
| 17:41:40 | Submitted a second correction 432 ms after the preceding submission. Replacement UI observed after 296 ms. Latest answer concerned a green kite and completed 1/1; no obsolete blue-kite playback state resumed in later observations. The overlap with actual cue sound was not acoustically recorded. |
| 17:45 reload | Existing profile restored and acknowledgement pool returned 6/6 saved locally. No voice choice change or cache clearing was performed. |
| 17:45:33–17:46:07; [still 04](04-measured-long-status.jpg) | Six-unit bookshop sample above. All 6/6 completed, with native positive gaps. |
| 17:46:42; [still 05](05-reply-still-arriving.jpg) | Longer real chart-aware answer: 4 received sentences while final=false; later Speaking sentence 1 with 12 received sentences while inference was still open. Validated chart-highlight controls appeared. |
| 17:47:12 | Chart reply final total 16; Speaking sentence 5 with 4/16 played. |
| 17:47:53 | Preparing sentence 13, 12/16 played; mascot/karaoke no longer falsely presented active answer playback while waiting. Native maximum gap had already reached 2,673 ms. |
| 17:48:51; [still 06](06-long-chart-complete.jpg), [normal card still 07](07-normal-card-final.jpg) | Longer chart reply finished 16/16. Native Send-to-first-answer scheduling 11,232 ms; final playback settlement 104,079 ms after submission. Largest answer-to-answer gap was **4,061 ms**. |

## Rubric disposition

| Row | Result and evidence boundary |
|---|---|
| LAT-RECEIPT | Native scheduling observed in 9 ms and 7 ms samples, from ready local palette. Source orders it before prompt processing; no missing-clip generation on Send. Acoustic immediacy is unverified. |
| LAT-BRIDGE | Separate native bridge boundaries observed after first eligible answer unit. Semantic/prosody listening and an acoustically observed early cutoff remain unverified. |
| LAT-PALETTE | Idle 0→3→6 and reload 6/6 observed. Source review covers priority, bounded PCM, quiet-time checks and healthy-session retention. Empty-pool Send, changed voice, exhaustion and induced storage faults remain unexercised. |
| LAT-SENTENCE | Ordered one-unit generation/playback with later work behind playback observed; six-unit completion and longer streamed received/final totals recorded. Audible first-word completeness remains unverified. |
| LAT-ZERO | **FAIL.** Positive post-cue waits and answer-to-answer gaps, including 11.487 s Send-to-first-answer scheduling in the six-unit sample. No latency exemption. |
| LAT-INTERRUPT | Inference, active synthesis and playback accepted replacement submissions. Rapid 432 ms correction attempted during the cue interval. Prompt stop/ack heard through speakers, physical click-to-silence and cue overlap were not recorded. |
| LAT-CONTEXT | Real redirected sunny-morning/green-kite replies addressed new messages, retained displayed history and did not invent an interruption reason. Delivery listening remains unverified. |
| LAT-COMPLETE | Ready/played counts complete on six-unit runs, chart-cue and karaoke transitions observed. No prefix-rewrite failure in the chart stream. Acoustic first/final words and oversized-unit runtime rejection remain unverified. |
| LAT-PRODUCTION | Preparing, speaking, interrupted, complete, unknown length and received/final totals directly observed outside debug. Fault feedback is source-reviewed, not runtime-induced. |
| LAT-LISTEN | **UNVERIFIED:** no audio-track listening or subjective prosody certification. |
| LAT-DEVICE | **UNVERIFIED:** Windows Chrome only; target physical phones and first-use empty-pool submission remain open. |

## Required next discussion

Do not accept this as zero latency. The evidence separates a fast ready-cue path
from the remaining inference/first-unit and later-unit waits. It does not prove
those waits fundamentally unavoidable. The same-model pipeline discussion should
address how to emit usable answer audio earlier and keep subsequent PCM ahead of
playback, while preserving complete meaning, natural prosody and the three cue
semantics. A true incremental decoder path would need its own closed graph/PCM
conservation contract and actual listening evidence; it is not part of this
release or an assumed remedy. No model alternative is part of this proposal.

Payload receipts: [initial](live-payload-54e3f53.json),
[current](live-payload-manifest.json). The [24 sanitized observations](observations.json)
retain raw boundaries. [Still index](stills.json) records actual file capture
times/hashes; the observation times above and a later still of the same case are
distinct. The repository checklist keeps zero-latency and physical/listening
acceptance open after publication.

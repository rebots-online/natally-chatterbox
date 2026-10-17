# Continuation cues — production observations, 17 October 2026

**Zero incremental latency remains unpassed.** Prepared continuation cues are now
observed in later sentence-generation gaps. They cover part of the waits, but the
eight-sentence run still has a maximum finalized uncovered interval of **4,610 ms**.
No generation cost was treated as a failure when a cue actually covered it. No
animation, model change, tolerance or claim of fundamental unavoidability replaces
the zero incremental conversational latency requirement.

The deployed source/build is `ce6c2bf46566cba40adbf1d557ef09d0fdb1e040`, pushed and
verified at origin. Surge release `1792260505489` serves the existing domain,
https://natally-chatterbox.surge.sh/. All **57 served payload files** match the local
production build by SHA-256; see [receipt](live-payload-manifest.json). No backend,
provider, model, immutable model revision, graph, voice reference or sampling
configuration changed for this run. TypeScript, diff checks, normal production
build and independent source review passed before deployment.

## Eight-sentence atelier run

This ordinary chat request asked for eight short sentences about a candle-lit
atelier, without personal/chart details. It completed **8/8 ready and played**.
The normal status showed the palette restored at 6/8, progressed to 7/8 and then
8/8 through silent idle preparation. No missing cue was generated on Send.

| Actual native scheduling boundary | Timestamp | Relative to submission |
|---|---:|---:|
| Submission handler | 1792260685011 | 0 ms |
| Receipt source scheduled | 1792260685022 | 11 ms |
| Receipt settled | 1792260686069 | 1,058 ms |
| First complete eligible unit / bridge scheduled | 1792260692948 | 7,937 ms |
| Bridge settled | 1792260694169 | 9,158 ms |
| First answer source scheduled | 1792260697221 | 12,210 ms |
| Final answer settled | 1792260741799 | 56,788 ms |
| Continuation cues scheduled | 7 | Once per later answer gap |
| Maximum raw answer gap | 5,355 ms | Before subtracting cue coverage |
| Maximum finalized uncovered answer gap | 4,610 ms | After native cue coverage |

Initial uncovered intervals were **6,879 ms** after receipt settlement and
**3,052 ms** after bridge settlement. The first later gap ran from
1792260700114 to 1792260705469: 5,355 ms raw, with a 745 ms scheduled continuation
interval, leaving 4,610 ms uncovered. This is a concrete remaining pipeline
failure, not proof that it is unavoidable.

The normal production view displayed received counts while the answer was still
arriving, then its final 8-sentence denominator. It showed “A moment with that
thought…” during actual continuation playback and returned to preparation after
the cue ended. [Continuation still](01-continuation-status.jpg) and
[completion still](02-eight-complete.jpg) are actual status-region captures.

## Earlier six-sentence request in this run

The same bookshop prompt as the preceding report produced seven units in the
new conversation context. An active replay was redirected by this submission,
so its initial cue was the interruption variant, scheduled 15 ms after the native
submission handler. First answer scheduling was 9,642 ms after submission.
Continuation playback was observed at multiple later gaps. One finalized gap was
2,813 ms raw, with 1,559 ms covered and 1,254 ms uncovered.

It stopped at 5/7 ready/played without a rubric-issued Stop action. The cancellation
caller was not recorded. Independent source review found no continuation-settlement
path explaining those particular counters. It identified existing non-Stop
cancellation callers, including unconditional settings-panel cleanup, but there
is no evidence that one fired here. Do not attribute this interruption to the
operator, settings, or a continuation race. The following eight-sentence run
completed normally. The exact reply/unit count is not an identical-workload speed
benchmark, and no before/after percentage improvement is claimed.

## Observation boundary and operator feedback

[observations.json](observations.json) contains periodic read-only observations of
the ordinary status element and its native numeric attributes. It is not a full
event trace. The visible text and dataset were read sequentially and can straddle
a state transition; native fields are the timing source. No private profile,
birth data or full transcript is published in this run folder.

These are source scheduling/settlement intervals, **not acoustic recordings**.
Silence within a PCM buffer, audible word completeness and cue prosody are not
certified. `maxUncoveredAnswerGapMs` covers finalized inter-answer gaps only; it
excludes the initial wait and a currently open wait. Zero before the next answer
starts is not a PASS. Target physical phones remain unverified.

Robin reports background generation is much better, and requests device-strength
informed pacing plus variation after two or three similar Hmm cues. The Open Design
human factors update includes that feedback, large front-facing Natally peering
into/caressing her ball, a warm candle-lit atelier, organized magical shelves,
constellation sky, free scene framing and context-sensitive gaze. This report
does not claim the new scene is already implemented in the production app.

The accompanying [animated waterfall report](../natally-animated-report-20261017/index.html)
replays known native boundaries and marks unknown spans. Its graphics are a silent
evidence visualization, not a recording or listening result.

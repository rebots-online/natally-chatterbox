# Canonical cue diversity verification — 17 October 2026

Source01eca4f12011bd12185e783bff588a00d42f947f; bundle06190908f2bfe8bd4355e88de5b95d2feb82e106. Both pushed and remotely verified. Surge1792263255485 at https://natally.surge.sh.76/76 served payload files matched SHA256; receipt is live-payload-manifest.json. Same model, graphs, runtime, references and production sampling. No provider change.

## Actual ordinary production view

After reload and idle, the normal status displayed16/16prepared and saved locally. No debug query or bottom diagnostics panel. Submitted one neutral verification prompt requesting exactly two short sentences about candles and stars. Both answer units completed2/2ready/played; one continuation cue was scheduled.

| Native source boundary | Milliseconds |
|---|---:|
| Send to receipt source | 8 |
| Send to first eligible complete speech unit | 6440 |
| Send to first answer source | 8176 |
| Receipt end to bridge start, uncovered | 5134 |
| Bridge end to first answer, uncovered | 418 |
| Largest finalized later-answer raw gap | 429 |
| Largest finalized later-answer uncovered gap | 0 |
| Send to final source settlement | 11538 |

![Actual ordinary production status](production-status.jpg)

The one429ms later gap was covered by its continuation source, preempted when the next answer became ready. This narrow observation is not a blanket zero latency PASS: the initial5134ms and418ms uncovered waits remain. Initial empty-pool failure from the canonical promotion is also unresolved. Compare no timing percentages: this is different content/context from prior runs.

## Variation boundary

Independent source review found no Critical/Important defect. Four ready clips per stage avoid the two recent exact keys where possible and prefer non-hum after two consecutive hum selections. Earlier cache indices/text are unchanged. Partial pools retain a ready voiced fallback and can have weaker variety. No blanket silence after the third cue, no foreground cue generation, no palette download. Selection history is not an acoustic history; actual heard variety/prosody, cancelled clips and perceived fatigue remain listening checks.

TypeScript, normal production build and diff checks passed. Native metadata establishes scheduling/settlement, not acoustic onset, internal PCM silence, complete pronunciation or phone acceptance. Only start/final observations were collected in this short run; no continuous intermediate trace was fabricated.

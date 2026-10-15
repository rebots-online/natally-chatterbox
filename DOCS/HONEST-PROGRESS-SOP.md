# Honest process progress and voluntary measurement SOP

Robin's specification, 2026-10-13: every process that can hang or crash needs visible,
meaningful progress. Progress must describe real work. This applies to local memory
loading as well as downloads. Natally's short ONNX load is the first implementation.

## Required instrumentation

1. Identify the source boundaries of the actual work: file response selection,
   byte reads, deserialization, session/graph initialization, execution and disposal.
2. Emit start immediately before each operation. Emit completion only after its
   native result or promise succeeds. Emit failure with the current operation;
   preserve the original rejection. Never let an observer change runtime behavior.
3. Record monotonic elapsed time, actual file/component, backend, workload and
   source (cache/network/unknown). Byte counters count bytes actually read. Label
   cache reads accurately; never infer a download from the library's event name.
4. Show elapsed time and time since the last work measurement. A separate worker
   heartbeat acknowledges event-loop responsiveness. It cannot certify that a
   blocked native operation is making progress. Animate acknowledgments on actual
   events; advance bars on measured bytes or completed units only. Respect reduced
   motion. Keep the last confirmed operation visible on failure.
5. Runtime initialization and graph execution are distinct. Show real graph names
   and pass counts. Do not label a graph as a neural layer. Add finer layer or node
   boundaries when the runtime source provides them; this pilot observes native
   session creation and run boundaries, not individual ONNX nodes.
6. Report measured timing observations with sample counts and their context.
   Separate success/failure, first engine/reuse, cached audio/new generation,
   backend, model revision, speed and workload. Show observed ranges and sample
   standard-deviation spreads where calculable. Four devices and voluntary reports
   are not a population sample; 2σ/3σ spreads are not coverage guarantees or ETAs.

## Natally source landmarks and pipeline input

`scripts/onnx-progress-plugin.ts` instruments the pinned Transformers.js 4.3.1
browser runtime at build time. It keeps installed dependencies intact and fails
the build if either unique source anchor changes:

- `var InferenceSession = ONNX.InferenceSession;`: wrap native session creation and
  its bound `run`, preserving receiver, options, result and rejection identity.
- The file-read `status: "download"` callback in `loadResourceFile`: expose its
  actual `cacheHit` result as cache/network source before reading the response.
- Existing response byte callbacks supply the byte measurements. The worker
  supplies request boundaries and speaker-embedding read boundaries.
- File completion preserves the last measured stream byte count. Neither a
  manifest nor an allocated/padded buffer length certifies bytes actually read.
- Supertonic's source `models/supertonic/modeling_supertonic.js` performs one text
  encoder call, five configured denoising passes, and one voice decoder call.

Run `node --import tsx scripts/voice-instrumentation-landmarks.ts` to produce
verified line numbers, verbatim source context, source SHA-256 and a single prompt
for an instrumentation agent. This is the pipeline's local input generator; no
remote model invocation or automatic source rewrite is provisioned. Each adapter
must have pending-promise, native-result, error-preservation and source-drift
checks before release. Reuse this contract for each subsequent process.

## Voluntary participant data

Open `/tests/voice-browser.html`, expand **Participate in accurate voice-load
measurements**, enable recording before starting the test, and optionally answer
the coarse device/OS/browser/RAM/power/connection/experience survey. Keep the page
visible. Recording is off by default and is kept only in this tab's memory.
The same panel is available in voice settings.

The schema `natally-voice-measurements/v1` contains a random report identifier,
runtime version, pinned revision, raw operation events, observed summary timings,
survey answers and any omitted-event count. It contains no spoken text, error
messages, account data, URLs, IP addresses or hardware identifiers. Text length is
bucketed. Recording is bounded at 10,000 events and shows omissions. Turning
recording off stops collection; Clear removes the recorded data. Reloading closes
the session record. Partial captures retain raw completions with
`capturedStart: false` and are excluded from timing summaries. Worker interruptions
with unavailable relative timing omit it rather than fabricate a duration.

Participants can review the exact JSON and download it to share voluntarily.
Nothing is uploaded automatically. There is currently no submission server or
population estimate. The analyst deliberately supplies shared reports to
`node --import tsx scripts/summarize-voice-measurements.ts report1.json report2.json`.
The output separates survey cohorts and timing contexts, failures and omissions.
Report counts do not identify unique people or unique devices. Repeated exports
of the same report are deduplicated; prefer the largest snapshot.

Release evidence must distinguish source checks, synthetic tests, desktop live
runtime measurements, physical-device observations and publication/deployment.

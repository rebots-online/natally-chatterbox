# Android Chrome Chatterbox investigation and decision matrix

18 October 2026. Investigation baseline: `c3513bc`, branch
`codex/conversation-voice-pipeline`. This is an evidence and decision report,
not a released implementation contract. No application, runtime, model,
provider or deployment configuration was changed for this investigation.

## Recommendation

Preserve the working Windows Chatterbox experience. First address repeated
engine initialization and capability reporting, then evaluate a narrowly scoped
Chatterbox export that replaces **all three** `GatherBlockQuantized` nodes with
ordinary `Gather` nodes over offline-dequantized embedding tables. This is the
most promising next experiment when preserving Natally's current voice and
reference conditioning matters. It is not yet an Android fix or performance pass.

The existing WASM fallback cannot run the tested quantized gathers. Making
downloads resumable alone will not repair that. Conversely, replacing a missing
operator will not establish acceptable phone latency, memory use or listening
quality. Keep those gates separate.

If the compatible Chatterbox export cannot meet phone resource and latency
requirements, the next product decision is an explicitly selected smaller
Android voice, rather than silently changing the voice. A non-FP16 Kokoro INT8
export is a concrete candidate to benchmark. Hosted synthesis and a native
Android client remain alternatives with different operational and distribution
costs; neither is authorized by this investigation.

## Evidence and boundaries

| Evidence | Finding | Boundary |
|---|---|---|
| User report | Windows Chrome works well; Z Fold5 repeatedly returns to about 87 MB. | Linux, other phones, Android version and Chrome version were not supplied. |
| Supplied screenshot | Canonical `natally.surge.sh`; network error reading `speech_encoder_q4f16.onnx_data`; 264.8 / 573.4 MB read; 0 / 16 cues; retained idle-cue `GatherBlockQuantized` CPU kernel error. | The two messages can represent different attempts. The screenshot has no attempt chronology or network/cache trace. Its private conversation content is not copied into this report. |
| CodeGraph | Sync/status current: 93 files, 1,694 nodes, 3,862 edges; SQLite quick check `ok`. | Static source evidence, not device execution. |
| Canonical deployment | Entry `app-D8VC2Pee.js`, its imported `src-Bi7Wih0q.js`, and active worker `chatterbox.worker-CzBCh5tb.js` exactly match local build bytes. | Relevant live bundles were checked; this was not a new full-site verification or deployment. |
| Pinned runtime | `onnxruntime-web` `1.31.0-dev.20260914-8d85527a0`; WebGPU/JSEP import; WASM threads set to one. | Diagnostic execution used that installed package on native Windows Node, forced to WASM. |
| Model | All four small ONNX graph definitions downloaded without external weights and verified against the pinned manifest SHA-256 values. | Graph inspection and small operator probes; no complete alternate model was built or synthesized. |
| Device access | `adb devices -l` returned no attached devices. | No remote-debugging reproduction on the actual Z Fold5. |

Authority was refreshed from live KStore: `SPEC_CONVENTIONS.md` architecture-law
topic and the current README conventions. Architecture/checklist release remains
necessary before implementation entities are added. This report is diagnostic
evidence, not a substitute architecture or coder recipe.

## What the code explains

### The fallback is not compatible with the current graphs

`src/services/chatterbox.worker.ts:95` selects WebGPU only if an adapter exists
and advertises `shader-f16`. Otherwise it selects WASM. The CPU provider in the
error can therefore be the WASM fallback. A WebGPU session can also contain CPU
fallback nodes, so the error's provider name alone does not prove that the whole
session was configured for WASM.

`src/services/chatterboxTts.ts:55` sets `forceWasm` after a reported WebGPU runtime
failure. That flag survives worker resets for the lifetime of the page. The next
attempt can consequently use WASM even if the adapter was originally available.
We still need the phone's actual adapter features, requested backend, failed
graph, runtime error and fallback reason to identify which path happened there.

The pinned runtime's upstream native CPU source includes this operator, but that
does not establish that a distributed browser WASM artifact includes the needed
kernel and type combination. A generic recommendation to update past ORT 1.20
does not fit a checkout already pinned to a 1.31 development build.

### There is an application-level repeated initialization path

The downloader's `while` loop retries a corrupt saved cache entry from the
network once; an unsuccessful network response is thrown. It is not an
unbounded network-retry loop (`chatterbox.worker.ts:55`).

However, `BackchannelPool.replenish` calls `initChatterbox`, records a failed cue
candidate and schedules another candidate in `finally`
(`speechBackchannels.ts:105-148`). There are six candidates in each of four
stages. With a broken engine, up to 24 idle candidates in a configuration epoch
can each attempt initialization, in addition to other callers. Initial startup
also invokes both `initChatterbox` and the pool configuration (`main.tsx:10`).

`resetWorker` terminates the worker and clears pending/preload state
(`chatterboxTts.ts:26`). A new worker reconstructs its per-file progress map from
zero and rereads the first 87.3 MB tensor. Completed valid files should be read
from Cache Storage. Without the phone trace, repeated progress is not proof of
repeated network transfer. The finite candidate set also means this is not proof
of an infinite loop, although it explains a long sequence of apparent restarts.

### 264.8 MB exactly identifies a loading boundary

The worker loads graphs in this order: embedding, reference encoder, language
model, acoustic decoder. Before creating the reference-encoder session it reads:

| File | Bytes |
|---|---:|
| Embedding graph | 1,520 |
| Embedding external data | 87,304,704 |
| Speech-encoder graph | 1,219,352 |
| Speech-encoder external data | 176,273,652 |
| **Total** | **264,799,228 = 264.799228 MB** |

That rounds to the screenshot's 264.8 MB. The counter sums per-file bytes read,
including cache and network, within the current worker. It is not a durable
resume offset or a cumulative count of network bytes across attempts. Byte
progress is reported before final digest/cache/session completion, so the number
alone does not prove that each file was committed successfully to storage.

### Download resilience still needs work

`loadBytes` allocates the full file buffer, reads into it, computes SHA-256, and
only then calls `cache.put`. Partial data is lost if reading or the worker fails.
There is no Range resume or persistent chunk store. Cache errors are explicit.

A live request to the pinned embedding-weight URL with `Range: bytes=0-31`
returned HTTP 206, `Content-Range: bytes 0-31/87304704`, `Accept-Ranges: bytes`,
an ETag, and permissive CORS/exposed response headers. That establishes Range
support for this request, not every redirected asset or Android fetch. Browser
preflight for any additional request headers was not tested.

Any future resumable implementation needs revision/URL/validator-bound durable
chunks, validated 206/Content-Range handling, safe treatment of a 200 response,
bounded retries and the existing final full-file SHA-256 check. Locally hashing a
chunk does not establish publisher authenticity without an authoritative chunk
manifest. Resumption also does not remove whole-buffer ORT initialization memory
or guarantee that browser storage will persist. Measure storage quota and peak
memory separately; no evidence here establishes an 87 MB Android memory ceiling.

## Exact-runtime operator probes

Small ONNX graphs were constructed in memory and executed through the installed
`onnxruntime-web/webgpu` package with `executionProviders: ['wasm']` and one
thread. No unit suite, browser harness or application module was added.

| Probe | Result |
|---|---|
| Ordinary Gather, FP32 | Session creation and inference PASS |
| GatherBlockQuantized, packed UINT8 weights and FP32 scales | Session creation FAIL: no implementation |
| GatherBlockQuantized, packed UINT8 weights and FP16 scales | Session creation FAIL: exact CPU kernel-not-found wording |
| GatherBlockQuantized, UINT4 weights/zero points and FP16 scales, matching speech/LM types | Session creation FAIL: exact `/speech_emb/Gather_Q4` CPU kernel-not-found wording |
| Ordinary Gather, FP16 | Session creation and inference PASS |
| MatMulNBits, FP32 | Session creation and inference PASS |
| MatMulNBits, FP16 | Session creation and inference PASS |

The FLOAT16 quantized-gather error was:

```text
Can't create a session. ERROR_CODE: 9, ERROR_MESSAGE: Failed to find kernel for
com.microsoft.GatherBlockQuantized(1) (node:'/speech_emb/Gather_Q4'
ep:'CPUExecutionProvider'). Kernel not found
```

These are seven narrow probes, not a complete graph-compatibility, numerical
equivalence, browser or Android acceptance test. In particular, passing one
MatMulNBits shape does not establish every shape or operator configuration.

## All three problematic embeddings, not just the speech encoder

The hash-verified graph definitions contain:

| Stage | Quantized gather node | Weight / scale types |
|---|---|---|
| Speech encoder | `/speech_emb/Gather_Q4` | UINT4 / FP16 |
| Language model | `/backbone/wpe/Gather_Q4` | UINT4 / FP16 |
| Acoustic decoder | `/input_embedding/Gather_Quant` | packed UINT8 / FP32 |

Precomputing the seven fixed reference voices could avoid the encoder's
177,493,004 bytes and its execution, but leaves the other two quantized gathers.
It is an optimization, not a standalone compatibility solution. It also ties
conditioning artifacts to model, graph and voice-reference identities; future
custom reference imports would need matching conditioning generation.

A targeted export could offline-dequantize only these three constant tables,
retain the other quantized weights and use ordinary Gather. Estimated external
tensor changes, before alignment/graph metadata, are:

| Stage | Existing table/scales/zero points | Expanded table | Increase |
|---|---:|---:|---:|
| Speech encoder, FP16 | 2,913,972 B | 10,080,768 B | 7,166,796 B |
| Language model, FP16 | 3,639,024 B | 12,589,056 B | 8,950,032 B |
| Decoder, FP32 | 2,152,008 B | 13,436,928 B | 11,284,920 B |
| **Total** | **8,705,004 B** | **36,106,752 B** | **27,401,748 B** |

The current 573,393,649-byte package would therefore become approximately
600,795,397 bytes, a 4.8% increase, if the old tensors are removed. This is an
estimate, not a produced export. Dequantization must preserve the actual
per-block scale/zero-point semantics, packing, axis and FP16 rounding; it cannot
be implemented as a blind operator rename. Validate numerical results and
listening before claiming equivalent voice output.

As a later optimization, skipping the fixed reference encoder and repairing the
remaining two gathers would leave roughly 416,135,597 bytes plus prepared
conditioning and metadata. That is still a substantial mobile payload. Neither
optimization makes this whole-unit model a streaming acoustic decoder.

## Multicriteria decision matrix

Scores are engineering judgments from 1 (poor) to 5 (strong), not measured phone
benchmarks or success probabilities. The default weights explicitly favor
Android usefulness and preserving the current Natally voice:

| Criterion | Weight | Meaning |
|---|---:|---|
| A: Android robustness | 30% | Expected reach, compatibility and recovery |
| V: Voice continuity | 25% | Current Chatterbox voice, reference conditioning and consumer contract |
| L: Latency | 10% | Expected first-use and ongoing conversational response |
| F: Phone footprint | 10% | Download, memory, battery and thermal burden |
| P: Local/privacy/offline | 10% | Keeping text/audio processing local and offline availability |
| E: Ease of implementation | 10% | Higher means less implementation/maintenance effort |
| O: Operations/cost | 5% | Higher means less infrastructure, service and provider burden |

Weighted score = sum(weight * score) / 100. Hard feasibility gates take precedence
over arithmetic. Small differences such as 3.9 versus 3.8 are not decisive proof.

| Alternative | A | V | L | F | P | E | O | /5 | Feasibility and confidence |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **C: Same Chatterbox, portable Gather export for mobile/WASM** | 4 | 5 | 3 | 2 | 5 | 2 | 5 | **3.90** | Preferred next experiment for voice continuity; operator controls pass, full pipeline/device performance unknown. |
| B: Repair WebGPU selection and gate current graphs to compatible adapters | 3 | 5 | 3 | 2 | 5 | 4 | 5 | **3.80** | Lowest-change path if Fold5 GPU features/limits pass; does not cover unsupported devices. |
| J: Custom ORT Web WASM build including the missing kernels | 4 | 5 | 3 | 2 | 5 | 1 | 4 | **3.75** | Retains exact graph package; kernel build/type coverage, browser artifact distribution and long-term maintenance unproven. |
| G: Native Android client with native ORT | 4 | 5 | 3 | 2 | 5 | 1 | 3 | **3.70** | Native CPU source contains kernel, but exact mobile build/full graph/speed require proof; does not fix Android Chrome. |
| D: Chatterbox desktop plus smaller local Android engine | 4 | 2 | 4 | 4 | 5 | 3 | 5 | **3.55** | Best resource-oriented local fallback; requires different voice/reference behavior and Android benchmark. |
| E: Self-hosted Chatterbox synthesis | 4 | 5 | 2 | 5 | 1 | 2 | 1 | **3.50** | Preserves model/voice, removes phone inference; network and server queue latency remain. Approved Oracle capacity/GPU/performance not established. |
| H: Managed TTS API on Android | 5 | 2 | 4 | 5 | 1 | 3 | 1 | **3.35** | Potential broad reach; provider/voice/privacy/cost approval and actual service measurements required. |
| F: Android/system speech through Web Speech API | 4 | 1 | 4 | 5 | 2 | 5 | 5 | **3.30** | Useful explicit accessibility fallback; installed voice/remote service/offline availability vary; no cloned-voice or PCM/cue parity. |
| A: Downloader/cache repair only, same forced WASM graphs | 1 | 5 | 1 | 1 | 5 | 4 | 5 | **2.90** | **Fails known compatibility gate.** Useful shared resilience work, not a working voice solution. |

For D, the ONNX Community Kokoro listing offers a non-FP16
`model_quantized.onnx` at approximately 92.4 MB, before phonemizer, voice and
supporting assets. Its FP16/q4f16 variants should not be treated as a CPU-safe
choice just because their filenames suggest smaller weights. Kokoro's fixed
voice/style interface does not carry Chatterbox reference-WAV identity over.
This is a candidate, not a claim of tested Android compatibility. The upstream
weights are Apache-2.0; an integration also needs its actual dependency/asset
licenses reviewed.

If small downloads and broad phone reach take precedence, weights
`A35/V10/L15/F20/P10/E5/O5` change the ranking: D 3.90, H 3.85, F 3.80,
C 3.60, J 3.50, E/G 3.45, B 3.35, A 2.15. The preferred solution therefore
depends on whether current voice identity is a hard requirement. Native Android
does not qualify if browser access is a hard requirement; hosted/API options do
not qualify if no new operational dependency is a hard requirement. Text-only
operation is a useful temporary degradation but is not ranked as a voice solution.

## Proposed next investigation and release gates

1. Capture a Z Fold5 run with attempt IDs, app/worker generation IDs, actual
   backend and fallback reason, `shader-f16`, adapter limits/device loss, per-file
   cache/network source, cache completion/error and storage quota. Obtain Android
   and Chrome versions. Preserve the existing cache while collecting evidence.
2. Release a bounded architecture amendment for initialization failure handling:
   stop idle cue replenishment after engine incompatibility, share that terminal
   capability result across callers, allow deliberate recovery, and keep text
   chat usable. Distinguish saved/read/verified/preparing states. This is separate
   from download resumption and from a different voice engine.
3. If Fold5 WebGPU can initialize and run the exact graphs, evaluate B first on
   that device. If it cannot, evaluate C with all three gathers repaired. This
   keeps the working desktop path pinned and limits the mobile export experiment.
4. Require every graph session, selected-reference preparation and complete
   synthesis to succeed. Compare numerical outputs, reference identity, audible
   first/final words, prosody, Stop/replay/interruption and chart/karaoke callbacks.
   Measure cold/cache startup, actual network bytes, peak memory, time to first
   audible answer, real-time factor, sentence gaps and sustained thermal behavior.
5. Evaluate durable downloads with real interruption/resume and validated final
   hashes, separately from inference acceptance. A successful resume is not an
   inference pass; an initialized session is not conversational-latency acceptance.
6. If C remains too heavy or slow, compare a specifically pinned non-FP16 smaller
   engine on the same real phone, with an explicit voice choice. Existing zero
   incremental latency requirements remain unmet until actual observations prove
   them. A native shell or PWA installation alone does not add WASM kernels.

No duration estimates or phone performance numbers are asserted. Provider
provisioning, spending, Oracle migration, changes to the working Windows path and
new model/runtime publication require the appropriate subsequent released scope.

## Sources

- Local source: `src/services/chatterbox.worker.ts:55`, `:95`, `:207`;
  `src/services/chatterboxTts.ts:26`, `:55`, `:80`;
  `src/services/speechBackchannels.ts:105`; `src/services/chatterboxModel.ts:3`;
  `src/main.tsx:10`; `src/components/VoiceDownloadStatus.tsx:50`.
- [Pinned Chatterbox conversion](https://huggingface.co/owensong/chatterbox-nano-ONNX/tree/4a66d7dab72a9e98f24b515d49a1d7a81632df2e).
- [Native CPU gather implementation at the pinned runtime commit](https://github.com/microsoft/onnxruntime/blob/8d85527a0/onnxruntime/contrib_ops/cpu/quantization/gather_block_quantized.cc).
- [ORT WebGPU operator table](https://github.com/microsoft/onnxruntime/blob/main/js/web/docs/webgpu-operators.md) and [WebGPU browser setup](https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html). Operator-list presence does not establish every dtype/device combination.
- [Chrome Android WebGPU rollout and device constraints](https://developer.chrome.com/blog/new-in-webgpu-121).
- [ORT Web large-model and external-data restrictions](https://onnxruntime.ai/docs/tutorials/web/large-models.html).
- [Kokoro ONNX profiles and actual listed sizes](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/tree/main/onnx), [upstream model/interface/license](https://huggingface.co/hexgrad/Kokoro-82M).
- [Speech synthesis local versus remote voice service](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService).

Machine-readable observations and decision inputs:
`DOCS/verification/android-chatterbox-20261018.json`.

# Natally Chatterbox architecture

Status: DRAFT — awaiting Robin's sign-off. No implementation is released.
Date: 15 October 2026.

Repository: `rebots-online/natally-chatterbox`.
Checkout: `E:/devProjects/natally-chatterbox`, an independent repository created
from the `natally-ai-studio` template. Baseline: initial commit `f190a5f`.
Proposed deployment: `https://natally-chatterbox.surge.sh`.

## Authority and release boundary

Robin requested restoration to the initial template and preparation of only this
architecture document for sign-off. All tracked files other than this document
must match that baseline at this handoff. Earlier implementation commits remain
in Git history; they are not the approved implementation or design authority.

The governing sequence is:

1. Robin approves this architecture, including any requested corrections.
2. Translate the approved architecture into an explicit, ordered recipe in root
   `CHECKLIST.md`. Do not invent implementation scope while deriving that recipe.
3. Implement only released checklist steps. Resolve necessary changes outside
   that contract in the architecture before coding them.

Until sign-off, do not implement the replacement, create the checklist recipe,
build, run tests, or deploy. The existing deployed site is a prior build; this
repository rollback does not publish a replacement site.

## Purpose and fixed scope

Natally is a marketplace product. Preserve the template's marketplace purpose,
application behavior, screens, accounts, charts, conversation flow, hosted
inference, billing prototype and infrastructure boundaries.

Substitute browser-local Chatterbox Nano ONNX for Supertonic, with only the
speech-unit and immediate-start amendments below. Do not add a separate product,
preview page, benchmark project, streaming chat interface or new application
workflow. Completed replies are suitable speech inputs.

The purpose is for Robin to find out firsthand whether the replacement improves
speech on the device browser. Pauses are acceptable; lost portions of phrases
are not. Ordinary lower-resource phones are the target. Desktop performance,
parameter counts, download sizes or the presence of a GPU API do not establish
phone suitability.

## Existing application boundary

Preserve this service relationship:

```text
Existing chat / reading / replay / mascot callers
    -> voiceService.ts (existing settings, stop and playback callbacks)
    -> shared local TTS client and browser worker
    -> Chatterbox Nano ONNX sessions
    -> complete PCM output
    -> existing Web Audio playback and chart/text callbacks
```

Do not change authored wording, persona, account/history ownership, inference
transport or calculation tools. Retain existing voice controls and progress UI;
only engine-specific information and wiring may change as required by the
approved model contract. Existing template preview/measurement surfaces are not
new work or an acceptance requirement for this substitution. Do not extend or
run them.

## Immediate background readiness

Begin engine loading at application entry, as soon as the application module
runs, before rendering. It must not depend on sign-in, onboarding, opening
settings, selecting Preview, receiving a reply or requesting speech.

- Start the shared worker immediately. No idle callback or timer delay. Robin's
  instruction supersedes the older Save-Data skip and onboarding-only trigger.
- Fetch missing pinned model/tokenizer files into the browser cache and reuse
  cached files on later loads. Keep inference local and off the UI thread.
- Create the actual runtime sessions and prepare the selected saved/default
  voice reference during that same background operation. Download completion
  alone is not readiness. Do not synthesize demonstration audio as a warm-up.
- Coalesce startup and speech requests onto the same worker and initialization;
  do not start a second engine when speech arrives during loading.
- Retain measured byte progress and a distinct preparation stage in the existing
  strip. Report ready only when the engine and selected reference are usable.
  Keep loading failures visible and retryable through existing status handling.
- Speech arriving before background work completes awaits that work. Starting
  early cannot guarantee a cold download finishes before an immediate request.
  Do not conceal the outstanding work or promise otherwise.

Preserve stop and account/session invalidation: obsolete speech must never play
later. The approved checklist must specify cancellation and recovery details,
including whether a worker restart requires loading cached files again.

## Speech completeness and splitting

Use the complete cleaned speech turn whenever the model can accept it. For long
turns, group complete sentences within the model's verified input capacity.
For material that is not sentence prose, use appropriate whole logical units,
such as complete list items or headings. Preserve their order and wording.

Never cut at clauses, spaces, fixed character counts or 15–20 character chunks.
When capacity is reached, choose the preceding complete sentence/logical-unit
boundary. Keep the remainder for subsequent synthesis; never drop a tail.
If one complete unit exceeds supported capacity, fail explicitly rather than
cutting it arbitrarily or silently returning incomplete speech.

Accept a generated unit only after generation completes. Budget exhaustion must
not pass as complete audio. Valid PCM and a model end token cannot prove that
every word was pronounced; Robin's listening remains the deciding evidence.
Preserve existing source-offset and playback callbacks without adding forced
alignment or another playback system.

## Model and runtime contract

The requested engine is Chatterbox Nano ONNX (110M). It must run in the browser;
no hosted TTS or automatic substitution of another model is authorized.

Before releasing implementation steps, identify the exact model repository,
immutable revision, graph and external-tensor files, tokenizer, supported
operators and reference inputs. Record actual asset sizes and runtime needs.
Browser-local loading and a practical execution path for the intended
lower-resource phones are prerequisites to adopting a conversion. Report any
mismatch before coding rather than adding a backend to accommodate it.

The prior attempt used `owensong/chatterbox-nano-ONNX`, revision
`4a66d7dab72a9e98f24b515d49a1d7a81632df2e`. It is a candidate to assess against
this contract, not a conversion declared suitable by this draft.

Use WebGPU where the actual graphs/runtime/browser support it. A WASM path must
also be supported by those actual graphs and runtime; do not assume the previous
Supertonic fallback transfers. Resolve external tensor files explicitly.

Preserve existing preferences/defaults where supported. Reference assets,
mapping existing voice IDs and any rate/pitch semantic differences must be
specified and approved before becoming checklist steps. This draft does not
authorize generating reference voices or adding DSP to approximate incompatible
controls. Do not reuse Supertonic embeddings without confirmed compatibility.

## Later implementation recipe

The recipe may target application entry, the local voice client/worker,
`voiceService.ts`, existing configuration/progress components, model asset
configuration and required package/lockfile changes. Before coding, it must name
exact entities and signatures, initialization ownership, input/output contracts,
asset/reference decisions, error behavior and ordered edits. No opportunistic
refactoring of unrelated template code.

The inherited `DOCS/ARCHITECTURE/local-supertonic-voice.md` describes the template
voice implementation. The Chatterbox, whole-unit and immediate-loading rules
above are proposed amendments. Historical scheduling and test clauses cannot
override Robin's current instructions.

## Evaluation, build and publication

No unit tests, automated browser tests, benchmark harnesses, new test pages or
controlled comparison protocol are authorized. Robin evaluates the ordinary app
on the device browser. Do not claim improved speed, memory use, spoken
completeness or phone suitability before that evaluation.

After design approval and a released implementation recipe, build directly into
this dedicated repository's root `dist/` with the normal build command. Do not
create temporary output folders or nested active deployment folders. Separate
build folders are allowed only for semantically versioned historical artifacts.
Configure the ignored local `.env` for `natally-chatterbox.surge.sh` and deploy
there only at the later authorized implementation/deployment step.

Commit and push completed authorized work to this repository's GitHub origin;
verify the remote commit. Keep publication, build, deployment and Robin's device
acceptance distinct. No provider migration, payment integration, Tauri/native
packaging or deferred SOUL/two-lore work belongs to this substitution.

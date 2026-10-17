## Streamed conversational speech — 17 October 2026



Closed architecture CB-ARCH-2 and checklist CL01–CL09 implemented and published.

Current code/bundle `66422549e7b4007f03bf651c9c3f8a1fd9ef0e06`, Surge release

`1792259067502` at https://natally-chatterbox.surge.sh. All 48 served payload

files fetched and SHA-256 matched. Existing backend alias updated at Netlify

deploy `6ad3b228c6ce2c3e210cd8c0`, with the same model/provider/settings/origin

context. No new infrastructure. Historical raw frames were excluded from deploy.



Sentence/minimum-unit streaming, one-ahead generation, idle-only local receipt/

interruption/answer palettes, cooperative cancellation retaining sessions and

normal-chat progress are implemented. Four Important review findings were fixed

and independently re-reviewed; TypeScript, changed-server syntax, normal root-dist

production build and diff checks pass. No unit suite or coded browser harness.



**Production-view verdict: DEFECTIVE on zero incremental latency.** Existing

signed-in Windows Chrome, F4, with debug closed: a six-unit run scheduled a ready

receipt 9 ms after the submission handler, but first answer audio at 11.487 s.

There were 5.850 s between receipt settlement and bridge start, then 2.769 s to

answer start; maximum answer gap 1.006 s. A longer chart-aware streamed reply

finished 16/16 units, with first answer at 11.232 s and maximum gap 4.061 s.

The pool reached 6/6 during idle and restored 6/6 after reload. Active synthesis

and playback accepted redirections; a rapid second submission 432 ms later

produced the corrected green-kite answer. Displayed history remained available.



These are native source scheduling/settlement and UI observations, not acoustic

onset or listening proof. First/final audible words, natural cue prosody, actual

phones and empty-pool/voice-change/exhaustion/fault paths remain unpassed.

No claim of fundamental unavoidability and no accepted latency compromise.

Model alternatives are excluded unless Robin introduces them.



Full report, 24 sanitized observations, indexed stills and payload receipts:

`dist/rubric-runs/v0.0.0-chatterbox-pipeline-20261017/REPORT.md`. Authenticated

full captures remain local outside Git. Robin subsequently requested cues during

later generation pauses and an immersive animated conversational Natally design;

that is the next amendment, not an implemented feature of this deployed build.



## Chatterbox conversational latency baseline — 17 October 2026



Robin reports smoother voice with unacceptable first-speech delay, apparent

missing beginnings and misleading production feedback. Current requirements:

zero incremental conversational latency; sentence/minimum-logical-unit generation

with the remaining queue behind playback; distinct pre-inference, interruption

and post-inference palettes generated silently during idle time and reused

locally; immediate contextual interruption without stale output or engine reload;

useful ordinary-chat status outside the debug-only panel. Interruption cues are

mostly settled/realizatory grunts, `Mm.` and `Hmm.`, not wonderment or a claim to

have understood the incoming message. No extra palette download or generation

on Send; residual latency requires operator discussion of pipeline remedies,

not a relaxed success claim. Model alternatives are excluded unless Robin

introduces them.



On the unchanged published source `062eb59`, actual native Windows Chrome/F4

WebGPU measurements showed cached-weight engine preparation 17.254 s, fresh

three-sentence generation 11.269 s and subsequent warm-engine single-sentence

generations 6.0146 s and 6.8474 s. Cached replay generation completed in 0.4 ms;

the real playback page already reported playback at the first UI observation,

287 ms after the automated click. UI observation time is not exact acoustic

onset. A later attempt to time transient playback missed the state and produced

null timestamps; no playback-duration or real-time-factor claim is made.



Indexed stills, synthetic samples, native run IDs, cumulative exports and limits:

`dist/rubric-runs/v0.0.0-chatterbox-latency-20261017/REPORT.md`.

The current build fails the new latency requirement. Improved-pipeline,

interruption, semantic listening, audible completeness and target-phone

acceptance remain open. DOCS/ARCHITECTURE.md §9 is an operator-review proposal;

no product code, model/provider, hosted service or deployment changed. No unit

suite, synthetic identity/provider/audio or new coded browser harness was used.



## Chatterbox substitution — 15 October 2026



Independent template-derived repository: `rebots-online/natally-chatterbox`,

native checkout `E:\devProjects\natally-chatterbox`. Source

`4f6530c1d5729e957f82e42e7a4c857f3f49f03f` was committed/pushed and the remote

SHA verified before the normal root `dist/` build and deployment to

https://natally-chatterbox.surge.sh, Surge release `1792103121721`.

All 30 served payload files were fetched and SHA-256 matched to the local build;

the versioned browser-run folder retains the per-file receipt.

The original marketplace application and its providers remain the inherited

product; this repository substitutes the local voice engine and whole-unit

speech planning under DOCS/ARCHITECTURE.md CB-ARCH-1, then CHECKLIST CB01–CB09.



Actual browser use: the normal entry started loading before login or speech.

The pinned 87,304,704-byte embedding tensor was read successfully from saved

cache; all 13 model/tokenizer files showed saved-cache reads. Decoder/session

and selected-reference preparation completed, then the loading strip cleared.

The inherited voice page, using the real application speech service, reached

"Playing locally generated audio" and "Local playback completed successfully".

Cached replay began playback; Stop interrupted it. Cancelling active generation

reinitialized from cache and reached WebGPU readiness; the following replay

completed successfully. There was no observed automatic 87 MB download loop in

this run. The older deployment did show one concrete network error on the

language-model tensor before an explicit reload; that is not proof of the

cause of Robin's phone report.



An existing signed-in Chrome session loaded its real saved profile and three

stored conversation turns without injected identity or application state.

The saved welcome and longer reading were replayed through ordinary chat

controls. Speaking/Karaoke Active and subsequent Replay states were observed;

Stop removed the speaking state immediately. Generation was slow: one welcome

observation remained in the language-model stage at 106 seconds with current

work measurements, before playback became available. No new hosted answer or

fresh authentication transaction was claimed from replaying stored messages.



TypeScript checking, normal production build and independent source review

completed. No unit suite or coded browser harness was run. The browser run

does not certify subjective audible word completeness, long-reading ending

intelligibility, WASM compatibility, injected cache/quota failures or target

phone performance. These remain explicit acceptance limits for Robin's device

evaluation, rather than a full rubric PASS.



Public supporting recording, indexed observations and stills:

`dist/rubric-runs/v0.0.0-chatterbox-4f6530c-20261015/REPORT.md`.

The MP4 is a timestamped screen-observation sequence, without an audio track;

gaps hold the preceding image and are disclosed in the report. Authenticated

captures contain personal profile/conversation details and remain local only.



## Isolated public test deployment — 15 October 2026



Test URL: https://natally-test.surge.sh, Surge release `1792089428952`, built

from published/pulled source `e314a4b` in Vite `test` mode. The sole frontend

configuration change is `.env.test`'s hosted API URL. Test backend alias:

`https://natally-test--natally-hosted-chat.netlify.app`, deploy

`6ad11d1918b73dbc427a9cd6`. Its exact-origin configuration is restricted to

the `natally-test` branch; production deploy `6acc88fa1511aaad9589ba97` and

production origin remain unchanged. Firebase gained the exact test domain,

preserving the previous 22 domains. No application-source or provider change.



The published rubric in `DOCS/TEST_RUBRIC.md` was driven in real browsers.

Recorded sign-up/login transitions and indexed Google-chooser/production stills

are in `dist/rubric-runs/v0.0.0-windows-iab-20261015T183827Z/REPORT.md` and its

media ZIP. Overall verdict is INCOMPLETE—pending-operator: Google account

selection, completed email login and actual hosted replies remain DEP-5/6.

No unit-test suite was run as acceptance. Exact site ZIP/manifest and service

configuration receipt are under root `dist/`. Production was not promoted.



## Chart presentation deployment — 15 October 2026



Published/pulled source `3269589c806c24494e9354acbdfef44b5eb9cec3`, including

chart implementation `6c624a0`, deployed through the existing msi4090 checkout,

configuration and `scripts/deploy-surge.sh`. TypeScript and production build

passed. Surge accepted release `1792070740988-natally.surge.sh`; production is

https://natally.surge.sh. Existing hosted API and provider configuration retained.



All 22 deployed files (35,142,036 bytes) were fetched from production and compared

by SHA-256 with the exact deployment build, including HTML/JS/CSS, fonts, both

Swiss assets, voice runtime WASM, worker and mascot. The deployed app includes

the chart-presentation prompt. Fresh native Windows Chrome rendered Google/email

sign-in with zero page errors. This does not certify authenticated model cue

adherence, real-audio alignment or physical Android.



The exact site payload is in repository-root `dist/`; the stamped

`natally-chart-presentation-3269589-20261015T132915Z.zip` contains exactly those

22 files. Its adjacent manifest records the archive and per-file hashes.

`dist/verification/surge-chart-presentation-1792070740988.json` and `.png` record

the live check. The chart fixture's screenshot/report also live under

`dist/verification/`; it uses real chart geometry with controlled hosted replies

and speech callbacks. Earlier local build files are preserved separately under

`dist/previous-native-build-20261015/` and are not the production release.

Release artifacts are versioned with text conversion disabled for exact bytes.



Refresh existing tabs to receive the highlighting feature; retain site data and

the saved voice model. Git publication of these release artifacts is verified at

handback separately from the Surge deployment.



## Adaptive speech candidate — 14 October 2026



Source implementation: adaptive chunk ceilings of 180 or 240 characters (not

minimum lengths), conservative

serial startup and measured one-ahead inference only with sufficient capability

hints and a fresh synthesis/playback ratio below 0.35. At ratio >=0.7, subsequent

the chunk ceiling shrinks to 180. Gentle always generates after prior playback ends. Cached

clips never calibrate CPU speed. One WASM thread and five denoiser passes remain.

The pinned model and first-use download size are unchanged.



Speech stays busy during preparation as well as playback, protecting readings

from incidental mascot speech. Token-count overflow is an explicit failure before

upstream truncation. Playback requests a latency buffer, resumes per chunk and

checks cancellation after asynchronous boundaries. This addresses verified risks;

the exact cause of Robin's physical-device missing words is not established.



Candidate default: F4, pitch 1.15, synthesis speed 0.90, soft tone. Public .env

voice values and .env.example match; other deployment configuration is preserved.

Natural/soft/warm tone uses lightweight shelf EQ, with output headroom for warm

bass gain; it is not learned acting or a new speaker. Existing speaker and pitch

controls remain. Prompt and mascot language now use short, conversational phrases.



89/89 Node tests, TypeScript and production build pass. Browser protocol:

`node tests/voice-adaptive-browser.mjs` against the built preview, or set

`VOICE_URL` to the deployed `/tests/voice-browser.html`. The script uses real

model inference and playback, and writes `DOCS/verification/adaptive-speech-browser.json`.

It verifies text/chunk conservation, finite PCM, all playback completions and

no gentle-mode inference/playback overlap. No speech or model API is stubbed.

Physical Galaxy S9/Fold5 listening, naturalness, and audible word-for-word

completeness remain unverified; there are no attached ADB devices in this run.



Published source `44c6709d4a09c3448947a4267cc892f329c036d5` to GitHub main,

verified remote SHA, then pulled before the existing Surge deployment script.

Production release `1791953583439-natally.surge.sh` succeeded. All 15 checked

HTML/JS/CSS assets (including app, shared voice and worker) byte-match dist:

`DOCS/verification/adaptive-speech-production.json`. Sanitized deployment log:

`DOCS/verification/adaptive-speech-deploy.log`.



Final production real-browser run on msi4090 passed both gentle/soft and

adaptive/warm playback with zero page or worker errors. Gentle chunks contain

148/173 characters; measured synthesis took 2004.1/2398.6 ms. Each full buffer

played and the second inference began after the first playback ended. Auto

selected one-ahead preparation after measured headroom; all test text reached

the worker in order and every buffer ended. Actual backend: WASM, 44.1 kHz.

This is neither a before/after total CPU/RAM benchmark nor word-level listening

acceptance. A shared DevTools tab disappeared before the first attempt could

start playback; the dedicated Playwright run provided the observed evidence.



Refresh existing tabs to load the new code; do not clear site data. Voice settings

now contain Speech resource use (Auto/Gentle), Voice tone (Natural/Soft/Warm),

and Use configured youthful preset. The public comparison page exercises them

without signing in. Existing hosted API and Oracle deferral remain unchanged.



### Review evidence reconciliation — 14 October 2026



KStore review 5266787f-ab0b-4205-8f51-75f4a3b4e0ac returned ERROR and

`invalid_json` during finding reconciliation. Its missing-tests/publication

findings described earlier activity, despite later checks and publication.

Fresh observed acceptance against published afe83d6:



- `node --import tsx --test tests/*.test.* tests/natally-regression-suite.ts`:

  exit 0; tests 89, pass 89, fail 0, cancelled 0, skipped 0.

- `npm run lint`: invokes `tsc --noEmit`; exit 0, no diagnostics.

- `npm run build`: exit 0; production output generated. Existing browser-module,

  dynamic-import and bundle-size warnings remain.

- `git diff --check`: exit 0, no output.

- Local HEAD and GitHub refs/heads/main both equalled

  afe83d6d5f4652b7346638099a287ae757c03a72. Its committed tree includes the

  deployment log, production asset hashes, final browser report and this record.



Wording correction: 180 and 240 are maximum chunk sizes selected by policy.

Actual chunks may be shorter at sentence/word boundaries, as with the observed

148/173-character gentle chunks. There is no 180-character minimum.



Product listening acceptance remains INCOMPLETE—pending-operator:

ADAPTIVE-SPEECH-MSI4090, ADAPTIVE-SPEECH-S9 and ADAPTIVE-SPEECH-FOLD5 each need

real-device listening for audible word completeness and acceptable timbre/diction.

No SHIP-READY or resolved-missing-words verdict is asserted. This reconciliation

records observed evidence; it does not claim the review service returned PASS.



## Account history isolation — 13 October 2026, evening EDT



User reported signing out as Robin and signing in as his mother exposed Robin's

history. Source inspection confirmed browser-wide chat/lore/location storage;

backend chat consumes supplied context and does not fetch a shared archive.

Source `260770d7a8cfc0ca41b137e614be62f271368748` was pushed to GitHub main,

remote ancestry verified, then pulled before deployment through the existing

Surge script. No backend, provider, Firebase rules or personal records changed.



Production https://natally.surge.sh; preview

https://1791945552584-natally.surge.sh. Live HTML, app JS/CSS and hosted-inference

chunk exactly match the tested build. Evidence:

`DOCS/verification/account-isolation-production.json` and sanitized deploy log.

Live Chromium rendered Google login with no page errors. Initial network-idle

navigation timed out; actual DOM/login-render acceptance subsequently passed.



86/86 Node tests, TypeScript and production build passed. Real React chat browser

regression uses synthetic A/B identities, real storage and only stubbed inference:

sign-out/switch, search isolation, reload restoration, stale reply/speech-callback

suppression, account-local clear and preservation of legacy/other-account bytes.

Command: `node tests/account-isolation-browser.mjs`.



Existing browser tabs must refresh to load this code. Unowned legacy chat/lore/

location keys remain untouched and are deliberately not shown or auto-adopted by

any account. Owner-confirmed history recovery remains separate; do not clear site

data. Real mother/Robin sign-in journeys on their device, historical exposure

extent, and cross-device history sync are not certified by these checks.



# Hosted chat deployment



## Honest voice progress and voluntary measurements — 13 October 2026



Published source `1c4b142d502c25ecc8eda2826c7d93b9c7b14242`; remote main SHA

matched. Surge production release `1791869821804-natally.surge.sh` succeeded.

Production index, measurement HTML, app JS/CSS, shared voice JS/CSS, voice entry

and `supertonic.worker-C3y_Y_7U.js` byte-matched the built files (eight checks).

The existing hosted chat endpoint was retained. Automated: 79/79 tests,

TypeScript, production build and diff check passed; existing build warnings remain.



Live desktop Chrome verification selected local CPU/WASM in a temporary wrapper

around the exact deployed worker. Worker fetch calls were recorded and made to

throw. The fresh engine loaded all nine model files and F4 from saved cache,

initialized three native ONNX graphs, executed encoder + five denoising passes +

decoder, and produced actual 44.1kHz PCM playback. Zero fetch attempts occurred.

Model-load-only duration was 2648.70ms; first full generation request 7400.50ms.

These are one-device observations, not estimates for other devices.



The same worker then replayed saved audio (explicit `clipReuse: true`, measured

duration below the available clock resolution) and generated a different short

sentence in 2473.10ms. Across the three requests: one model load, ten file reads,

fourteen actual graph runs and zero fetch attempts. New generation and replay

remained distinct. Playback completed successfully. Temporary hooks and the test

tab were removed after verification.



The actual participant UI was tested with opt-in recording and optional

desktop/Windows/Chrome survey answers. JSON preview excluded speech text, account

fields and native error strings. The Download button created the real

`natally-voice-measurements.json` file (46 events for the first generation and

replay); the local aggregation CLI read it successfully as one report/cohort with

zero failed requests. The browser automation download-event wait timed out, but

the actual file was independently verified in the configured Downloads folder.

Partial captures, failure exclusion, source byte accuracy, latest-survey exports

and backend changes are covered by regression tests. No automatic upload exists.



Global SOP is published in Admin-Manual as

`1a8f104b87d7b1dc1c90ac0252a11dcffc9ad86d` (remote master SHA matched), linked

from global-agent-rules. Source-landmark/prompt generation is implemented locally;

automatic code rewriting is a subsequent pipeline stage. Publication is not proof

of adoption by every agent. Physical Android and the other baseline devices still

require real measurements; no claim of individual-node/layer instrumentation.



## Saved voice model startup repair — 2026-10-13



Published source `90d0b08947161accce7f074567aaeab143da1d95`; GitHub main SHA

matched after push. Surge production publication succeeded as

`1791866960572-natally.surge.sh`. Production index, voice test HTML, voice worker,

voice service, hosted inference chunk, app JS/CSS and mascot byte-matched dist.

The existing hosted chat endpoint is retained.



Root cause reproduced in desktop Chrome: Transformers.js 4.3.1 pipeline and

tokenizer preflight metadata checks omit the supplied model revision. They

request `/resolve/main/` with a no-store byte-range request, while the complete

installed model is cached under its immutable revision. These preflight cache

misses make startup depend on the network unnecessarily. Pinning the worker's

`env.remotePathTemplate` makes discovery and model loading share the saved URLs.

Complete cached model startup now reports local preparation without byte progress.



Regression uses the actual upstream metadata lookup and a complete pinned cache

with an unavailable network: failed before the repair, passes after it. 70/70

tests, TypeScript, build and diff check pass; existing Swiss WASM/module and

bundle-size warnings remain.



Live production worker verified in desktop Chrome using a temporary diagnostic

wrapper: CPU/WASM selected, every voice fetch throws and is recorded. Fresh saved

model startup completed real playback with zero attempted fetches; a different

multi-chunk reading also completed with zero fetches, reusing one worker. Status

sequence began with `Loading saved voice model on this device`, without byte

fields, followed by local synthesis/readiness. Temporary instrumentation is

removed on closing the test tab. This verifies this network-dependency repair,

not physical Android GPU stability or listening-quality acceptance.



## Cloud-session mobile momentum and voice recovery — 2026-10-13



Code verified locally; this entry is not production-deployment evidence. The

source repair is published as GitHub main commit

`01e322d85d67769732955d577dc784a9a910a488`; `git ls-remote` matched the local

commit after push. No Surge deployment was performed in this cloud session. The

Android touch-end callback formerly called endDrag (which computes release

velocity) then zeroed both axes unconditionally. Normal one-finger rotations

now retain that velocity; interrupted/pinch/cancel gestures still stop it.

Compatibility mouse handlers ignore recent touch events so synthetic mouse

down/move/hover cannot restart or freeze the release.



A returned speech-worker error previously rejected only one request and left

the same model/runtime and completed preload available. The next replay now

gets a fresh worker; all pending work on the failed runtime is rejected. A

reported WebGPU synthesis failure selects WASM on retry for the rest of this

page session. Stale messages from terminated workers cannot change the new

runtime's status. This addresses recoverability; the original phone-side

`Cannot read properties of undefined (reading 'destroy')` fault has not been

reproduced on a physical Z Fold5. No claim that the upstream GPU defect is fixed.



64/64 Node tests, TypeScript, production build and diff check pass. Browser

verification command (with existing Vite server running):

`node tests/torus-browser.mjs`. Standalone test page uses synthetic birth details,

actual Astrolabe3D, native Chromium touch injection, and observes rendered scene

transforms. Mobile rotation continues after release, pinch changes camera

distance and stops rotation on release, and desktop drag inertia is preserved.

No account login bypass is added to the production application. Physical Android

and real phone voice recovery remain pending.



Browser/share title now reads PSYCHICK NATALLY. Wooden-sign loading animation,

presentation commands and original mascot restoration are recorded separately

in DOCS/BASELINE-AND-PRESENTATION-FOLLOWUPS.md; not shipped as part of this repair.

Existing Swiss WASM external-module and bundle-size build warnings remain.

No product dependencies changed. Dependency setup used `npm ci --ignore-scripts`

because the native ONNX installer attempted a direct blocked download; this

browser application and its tests do not require that native Node runtime.



## Mobile layout and pinch repair — 2026-10-12



Published source commit `6883b755b865ff1dae391f8a4d09ea180376b218` to GitHub main

and verified the remote SHA before deployment. Surge deployment succeeded:

`1791814839886-natally.surge.sh`, production `natally.surge.sh`. At 14:21:37 UTC,

production index, app JavaScript and app CSS each returned HTTP 200 and byte-matched

the built assets. Evidence: `DOCS/verification/surge-mobile-1791814839886.json`.

This verifies publication, not physical Android behaviour.



Implementation: chat rectangle follows visualViewport resize/scroll, keeps header

and composer outside the message scroller and compacts secondary chrome when the

keyboard leaves less than 500px height. Phone panels stack and use a .78-alpha

blurred background; chat uses .92. Desktop card placement remains available.

Main mobile minimum-height and footer wrapping no longer force the old overflow.



Root cause of Android pinch: the existing canvas disabled browser touch actions

but only implemented one-finger rotation; wheel zoom was mouse-only. Canvas-local

touch binding now uses the two-finger separation ratio to adjust camera distance,

with shared wheel bounds, no panel-touch leakage, reset baselines after finger

count changes and post-gesture click suppression. Page zoom is not globally banned.



Observed automated verification: 48 tests pass, including 9 new viewport/gesture

regressions; TypeScript, Vite build and diff check pass. Existing Swiss WASM

external-module and bundle-size build warnings remain. No new dependencies.

CUA reports no browsers; explicit iab creation returns Browser is not available.

These are synthetic event/geometry tests, not observed Android keyboard/pinch or

visual acceptance. Device verification stays open in CHECKLIST.md.



## Infrastructure correction — Robin 2026-10-12 03:32



**03:33 update: migration deferred explicitly — NOT NOW.** Preserve the existing

task order in CHECKLIST.md, with login-before-onboarding next. The Oracle

requirement is retained for later; no migration, provisioning or cutover now.



**Approved destination: Oracle Cloud Always Free infrastructure, not Netlify.**

Netlify currently serves production requests but is temporary migration debt.

Its introduction was not appropriately surfaced as a material infrastructure

decision. No further provider additions or paid-resource provisioning are

authorized by this correction. Firebase authentication and hosted model selection

are separate dependencies; this directive addresses the API hosting location.



Discovery observed: OCI CLI installed; `oci iam region list` could not run because

`/home/robin/.oci/config` is absent. No target Oracle VM/tenancy or SSH alias was

identified in the checked local inventory. Oracle deployment, cost eligibility,

capacity, DNS/TLS and cutover remain unverified. The operator has been asked for

the target or access-document location. Do not represent a migration as complete.



Migration must preserve authentication, provider-secret isolation, calculation

continuations, CORS, input bounds, timeouts and rate limits. Netlify's platform IP

limiter does not automatically transfer to a VM. Establish the Oracle service's

supervision, TLS, access controls, logs, resource bounds and rollback before

changing `VITE_CHAT_API_URL`. Verify real hosted replies and tool chains on the

replacement before retiring the existing deployment.



Oracle's current [Always Free documentation](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)

requires eligible resources in the tenancy home region and documents idle-instance

reclamation. Actual tenancy usage/eligibility must be checked; do not assume old

quota figures, available capacity or a zero-cost guarantee for arbitrary resources.



## On-demand calculations and karaoke — 2026-10-12



Frontend publication: `1791789600884-natally.surge.sh` deployed with 39 passing

tests, TypeScript and production build. Artifact readback evidence is recorded

in `DOCS/verification/surge-karaoke-1791789600884.json` when comparison completes.

Phone scrolling remains unobserved, not certified by that asset check.



Login order checked at 03:19: the historical onboarding-first bypass remains in

App.tsx. No saved chart means FirstLight renders before AuthModal; after chart

creation the first hosted reading opens sign-in if needed. Working Firebase does

not imply login-first onboarding. Restoring a login-first gate is not implemented.



The new calculation-tool API is documented in `DOCS/CALCULATION-API.md`, including

schemas, examples, errors, limits, authentication, session lifetime and precision

boundaries. The model requests birthplace lookup, natal chart creation, arbitrary

dated transits and synastry as needed. It is no longer limited to a fixed today

context attachment. The existing Swiss Ephemeris engine executes calculations.



Observed real hosted verification (GLM-5.3-Flash, ordinary disposable Firebase

session): lookup_place twice, natal, synastry, transits. Returned interpretation

cited Mercury/Node conjunction 0.04 degrees and Mars/Sun square 2.39 degrees;

April 10 2027 12:00 UTC transits cited Pluto/Moon square 0.30 degrees and

Uranus/Neptune trine 0.04 degrees, matching returned calculation context.

The test history intentionally included an obsolete assistant claim of no

ephemeris; fresh tool results replaced that limitation. Synthetic account deleted.

Evidence: `DOCS/verification/hosted-calculation-chain-1791789395370.json`.



An earlier failed attempt is retained in

`DOCS/verification/hosted-calculation-chain-1791789224144.json`: the provider

returned two valid calls despite parallel requests being disabled. The bridge

now accepts bounded batches and executes them sequentially, with matched result

IDs and a six-calculation total limit. Backend production deployment:

`6acc88fa1511aaad9589ba97`. No unauthenticated bypass or exposed provider key.



Voice playback now generates the next sentence-preserving chunk during playback.

Karaoke maps cleaned speech back to original Markdown offsets and follows the

active word inside the chat scroller only. Reduced motion uses instant scrolling;

words already visible do not trigger recentering. Word timing remains an even

duration-based estimate, not model-supplied alignment. Thirty-nine automated tests

and TypeScript passed; actual phone scrolling, low-resource browser/WASM speech,

Google popup and complete cross-device sync remain unverified.



Onboarding adds separately requested present location (manual/device/skip), and

the initial hosted reading asks for natal foundations followed by calculated

current transits. Device permission is only requested on explicit action. The

manual horoscope date/time controls explicitly use the device timezone, including

the selected date's DST offset, not an estimated city standard offset.



## Local voice replacement



Speech is now independent of hosted chat authentication. The active voice path

uses Supertonic ONNX with Transformers.js 4.3.1 in a browser worker; it does not

call Gemini, `/api/tts`, or the browser's system-speech fallback. Onboarding

idle-loads the model unless Save-Data is enabled. The thin bottom strip measures

model download bytes (262.8 MB); runtime preparation is a separate phase.



The signed-out production verification page is

`https://natally.surge.sh/tests/voice-browser.html`. Its real WASM synthesis,

playback completion and Stop path were observed. Mobile/WebGPU performance and

expressive-quality listening acceptance are not yet verified. See

`DOCS/ARCHITECTURE/local-supertonic-voice.md` for the USP and exact boundaries.



## Hosted text chat



### Production sign-in repair — 2026-10-12



Firebase project `gen-lang-client-0714568880` now includes `natally.surge.sh`

in authorizedDomains; all pre-existing entries were retained. Google sign-in

was already enabled. Email/password registration and login are now enabled in

the same project, with passwords required. No anonymous or unauthenticated model

access was enabled. These are normal user accounts, not a tester-only allowlist.



Users and offsite testers: refresh `https://natally.surge.sh`, choose Sign In

or the reading's Sign in to get your reading action, then Continue with Google

or Email Sign Up. Existing email users choose Email Log In. Retry the retained

question after signing in. Authentication overlays now appear above chat and

reading surfaces; reading failures are shown rather than silently discarded.



Observed live using the public Firebase API with the Surge origin: disposable

email signup returned a session; a separate password login returned the same

account; that session received HTTP 200, source hosted, model glm-5.3-flash and

a substantive interpretation of synthetic chart placements from the production

Netlify function. The disposable user was deleted. An earlier administrative

test also returned a hosted reading; its temporary signing key and user were

deleted, with key material held in process memory only. IAM and IAM Credentials

APIs were enabled during verification; no IAM role grants were added.



Deployment `1791786386526-natally.surge.sh`: main HTML, app bundle and hosted

transport bundle byte-matched production; 24 automated tests and lint/build

passed. The browser tool was unavailable, so Google popup completion, an offsite

device session and full cross-device data sync remain separately unverified.

Phone sign-in has not been configured or verified; use Google or email.



This verifies hosted access, not accurate current-transit calculations. The

reading service's missing computed transit context remains the next quality task.



The Surge frontend calls `https://natally-hosted-chat.netlify.app/.netlify/functions/chat`.

It never calls the model provider directly. Chat and generated readings require an

existing Firebase sign-in. There is no offline inference or canned-answer fallback.

Failures show an error and allow retry; they do not create a model reply.



## Runtime configuration



Netlify project: `natally-hosted-chat` (`f48513f6-0319-4672-8959-4d3f4c7fd1b5`).



Set these environment variables in Netlify, not in the frontend build:



- `ZAI_API_KEY`: provider credential.

- `ZAI_MODEL`: `glm-5.3-flash`.

- `FIREBASE_API_KEY`: the existing Firebase project's web API key.

- `FRONTEND_ORIGIN`: `https://natally.surge.sh`.



The function validates Firebase sessions through Identity Toolkit before sending

requests to `https://api.z.ai/api/coding/paas/v4/chat/completions`.

It restricts cross-origin requests, limits input size, applies rate limits, and

returns sanitized errors. Its per-user limiter is instance-local, not a global

spending ledger. Image inference is not supported by this endpoint.



Deploy with an authenticated Netlify CLI:



```sh

npx netlify-cli deploy --site f48513f6-0319-4672-8959-4d3f4c7fd1b5 --dir netlify/public --functions netlify/functions --no-build --prod

```



Set `SURGE_LOGIN` and `SURGE_TOKEN` from the operator's documented credentials,

then deploy the frontend:



```sh

VITE_CHAT_API_URL=https://natally-hosted-chat.netlify.app/.netlify/functions/chat bash scripts/deploy-surge.sh natally.surge.sh

```



Never set `VITE_LLM_API_KEY` or `VITE_GEMINI_API_KEY`: Vite-prefixed values are

public browser configuration. Previously published provider credentials require

operator rotation; removing them from a new build does not revoke old copies.



## Verification



```sh

node --test tests/hosted-chat.test.mjs

node --import tsx --test tests/natally-regression-suite.ts

npm run lint

```



The 16 tests cover hosted transport, authentication rejection, provider errors,

CORS, malformed replies, and the absence of fabricated responses. Provider and

identity calls are mocked in unit tests, so passing them is not production proof.



Observed on the deployed services during this repair:



- Surge serves the new `index-CHCKNzHE.js` build.

- Netlify preflight returns 204 with the exact Surge origin allowed.

- An invalid session returns 401 with no model reply.

- A direct credentialed GLM-5.3-Flash request returns HTTP 200 and answers `41`

  to `17 plus 24`.



Remaining operator verification: refresh Surge, use the existing Google sign-in,

and send a chat message. Verify an actual hosted answer arrives. This signed-in

browser-to-proxy-to-model path was not verified by the observations above.

The historical `scripts/verify-live.mjs` is only a UI diagnostic and does not

assert successful authenticated inference.



Saved historical messages marked `isOfflineMode` retain explicit legacy labels;

they are excluded from hosted conversation history rather than silently

reclassified as model-generated replies.

# Birth-date entry repair — 2026-10-12 16:02 EDT



Source `54647c9394695d276585cd7a63acd9dc1ed76a7d` was pushed to GitHub main,

remote-verified and pulled before deploying through `scripts/deploy-surge.sh`.

Production: https://natally.surge.sh; preview: https://1791835298684-natally.surge.sh.

Production index, app JS and CSS returned HTTP 200 and exactly matched the local

deployment build; hashes: `DOCS/verification/surge-birth-date-1791835298684.json`.



Birth-date step now mounts immediately during the prior Next/Back gesture and

auto-focuses a numeric-keyboard text input. Display is YYYY/MM/DD with automatic

slashes and calendar-aware month/day restrictions. An inline calendar is already

visible: tap its year for a year grid/direct year entry, choose month and day.

No hidden browser date popup or keyboard opening is necessary for calendar taps.

Both paths submit validated ISO dates to existing chart code. Global suppression

of native calendar/clock indicators was removed for other date/time controls.



55 tests passed (7 new date tests), TypeScript/build/diff checks passed. Existing

Swiss externalization and bundle-size warnings remain. CUA browser creation

failed with `Browser is not available: iab`; physical Android automatic keyboard,

calendar interaction and Next/Back verification remain outstanding, not inferred

from build or asset publication. No backend, identity, billing or hosting changes.



# Login-first and owner profile rules — 2026-10-12 16:25 EDT



Source `5e9d2e4`, deployment revision `564a602`, pushed/pulled before publication.

Production https://natally.surge.sh and preview

https://1791836717418-natally.surge.sh. Production index/app JS/CSS exactly match

the deployment build; `DOCS/verification/login-first-publication-20261012.json`.



Signed-out visitors now see the existing login/signup dialog before onboarding.

Returning sessions wait for their own profile; absent profile starts FirstLight,

lookup failure shows retry/sign-out rather than pretending no profile exists.

Profile caches are uid-scoped; unowned legacy device intake is preserved but not

silently uploaded to the next account. Late profile/chart completions are guarded

after account changes. Signup is described as free, with optional purchases kept

separate. Planned local-only versus local-plus-Firebase lore/credit choices are

explicitly labelled unfinished, not advertised as working sync or credit packs.



Live inspection found the configured named Firestore database had deny-all rules.

Published owner-only bounded intake rules from `firebase/intake.rules` after 13

Firebase Rules API evaluations passed; release and source were read back, and

other database releases remain unchanged. Prior source/ruleset rollback is in

`DOCS/verification/firestore-intake-before-login-first.json`. No auth provider

configuration, anonymous sign-in enablement or billing grant was changed.

Rules test reference: https://firebase.google.com/docs/reference/rules/rest/v1/projects/test.



61 Node tests, TypeScript, build and diff check passed. CUA again reported

`Browser is not available: iab`; real browser authentication and two-device profile

use are unverified. Full lore sync, device-only hosted access, local/account credit

enforcement and turn-pack billing remain pending. This publication does not claim

those features or complete cross-account isolation of existing local reading/lore.



# F4 Kawaii voice configuration



The browser-local voice defaults are configured in the deployment's `.env`:



```dotenv

VITE_NATALLY_VOICE=F4

VITE_NATALLY_VOICE_PITCH=1.30

VITE_NATALLY_VOICE_RATE=0.85

```



These are public build-time Vite values, not secrets. Rebuild and redeploy after

changing them. Supported speakers are F1–F5, M1 and M2; pitch and synthesis rate

accept 0.8–1.4. Invalid values fall back to the F4 Kawaii defaults. Playback pitch

also changes speed; the slower synthesis rate approximately compensates.



A changed preset signature applies the new audio defaults on the next reload,

including migration from the previous F1 release, without resetting mute, avatar

or sprite preferences. User adjustments saved under the current signature remain

until the configured preset changes. The existing voice panel can reapply the

configured Kawaii preset. No subjective audition is required for this release;

further expressive tuning is deferred, not claimed verified.





## 17 October 2026 — continuation cues



Source/build ce6c2bf pushed and origin verified. Surge 1792260505489; all57 served

payload files match SHA-256. Eight-unit ordinary-view run completed8/8 with seven

continuation cues, receipt source scheduled11ms after native Send handler. Maximum

raw answer gap5.355s, uncovered finalized gap4.610s. Initial receipt/bridge uncovered

waits6.879s/3.052s. Zero incremental latency remains unpassed; native scheduling is

not acoustic listening. One preceding7-unit run stopped5/7 with cancellation caller

unrecorded; do not attribute it. Report and sanitized observations:

`dist/rubric-runs/v0.0.0-chatterbox-continuation-20261017/REPORT.md`. Interactive

waterfalls/before-afters: `dist/rubric-runs/natally-animated-report-20261017/index.html`.

Open Design scene inspection and live device/listening acceptance remain separate.





## Canonical production replacement —17October2026



At Robin's explicit request, https://natally.surge.sh now serves this checkout,

replacing the former natally-ai-studio deployment as of publication bundle commit

7378d5caba9bc20e73019a228e64e22ac1f81fbe (configuration record7301a71).

Surge1792261498437. All67 served files matched SHA-256. Existing production

Netlify backend deploy6ad3bcda0aefe97aace3e3a6 retains the exact frontend origin;

OPTIONS204 with Access-Control-Allow-Origin https://natally.surge.sh observed.

A real signed-in ordinary-chat prompt received a fresh hosted one-sentence reply

and completed1/1 ready/played. Status subsequently reached8/8 local cues. Initial

Send at this separate origin had0/8 cues and explicitly displayed that no prepared

submission cue played. This first-use case is now observed and fails immediacy;

it is not a deployment or latency exception. No acoustic recording/phone PASS.

Evidence: dist/rubric-runs/natally-canonical-promotion-20261017.

Natally stays in this repository; only the independent voice-editor project

lives in C:/Users/Admin/Desktop/DevProjects/vociferous-cloner-studio.



## Canonical ready-pool diversity — 17 October 2026

Source01eca4f, canonical bundle0619090, Surge1792263255485.76/76 served files match SHA256. Prepared palette target is now4per stage/16total, with recent-key/hum variation when ready alternatives permit. Same model/runtime/reference/sampling; old cache indices preserved.

Actual normal production view reached16/16saved locally; a requested two-sentence hosted reply completed2/2. Receipt source8ms after submission; first answer8.176s. The one429ms later gap was covered; initial5.134s and0.418s remained uncovered. Zero incremental latency remains FAIL. No listening/device guarantee. Evidence: dist/rubric-runs/natally-cue-variation-20261017/REPORT.md.

The measured animated report now includes its portable GIF, interactive waterfall, ordinary-view before/after stills and the actual refined Open Design GPT-6-Astra atelier. Scene remains a silent design prototype with illustrative chart data. Its third-cue silence proposal is explicitly unaccepted. Large-scene production integration remains CHECKLIST G05.

The private voice editor is separately established at C:/Users/Admin/Desktop/DevProjects/vociferous-cloner-studio, origin https://github.com/rebots-online/vociferous-cloner-studio . Natally was not moved. Only a generated finalized reference and safe provenance can be staged into the existing F4 consumer path; no editor or private source is publicly deployed.

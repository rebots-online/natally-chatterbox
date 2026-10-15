# Chatterbox standalone evaluation deployment — 15 October 2026

- 🟪 Replace Supertonic with browser-local Chatterbox Nano ONNX. Complete replies
  first; split only at preceding whole sentence/logical-unit ends when necessary.
  Missing phrases fail acceptance; pauses are acceptable.
- 🟫 Independent template-derived repo `rebots-online/natally-chatterbox`, own
  checkout `E:/devProjects/natally-chatterbox`; `.env` targets
  `https://natally-chatterbox.surge.sh`. Deploy the built app there for Robin.
- 🟪 Physical phone performance, working memory and audible completeness are
  pending Robin's evaluation. See `DOCS/CHATTERBOX.md`.
- 🟨 Marketplace architecture and existing Stitch billing screens are carried
  forward unchanged. The screens remain a prototype, not integrated payments.
- 🟫 Surge accepted release `1792091868387` from root `dist/`; source `2adb96d` was pushed and the remote SHA matched. No automated tests are authorized; Robin performs device evaluation.
- ⬜ Deferred SOUL/two-lore remains unauthorized.
# IMPLEMENTATION CHECKLIST & TASK RECIPE

## Public test deployment — 15 October 2026

- 🟫 Published `https://natally-test.surge.sh` from `e314a4b` using the one-line
  `.env.test` backend override. Test API origin is branch-scoped; production is
  retained. Firebase recognizes the test hostname and retains existing domains.
- Rubric `DOCS/TEST_RUBRIC.md`: DEP-1..4 observed with recorded login transitions
  and indexed stills. Overall INCOMPLETE—pending-operator for real Google/email
  sign-in and hosted replies (DEP-5/6). Evidence ZIP/report and exact built site
  ZIP/manifest are in `dist/`. No unit-suite substitute or full acceptance claim.

## CHART-PRESENTATION — released by Robin, 15 October 2026

- [X] 🟦 Natally can highlight the displayed natal chart through prompt-defined
  `[[chart:TARGET;TARGET]]` cues and `[[chart:clear]]`. Targets are validated
  against actual planets, signs, houses and calculated aspect names. Strip cues
  from displayed/spoken/exported text; retain clean-text offsets and chart-bound
  metadata for saved replay. Unknown birth time excludes houses and angle aspects.
- [X] 🟦 Highlight house sectors and their actual natal occupants, planets/signs
  and exact aspect chords. Preserve independent manual selection. Add reply
  controls and a visible focus/clear action; advance cues through existing speech
  boundary callbacks. Clear/cancel on speech completion, chart/account change.
  No arbitrary HTML/scripts/DOM selectors, provider or infrastructure changes.
- Verification: `tests/chart-presentation.test.ts` and
  `node tests/chart-presentation-browser.mjs`; native Windows Chrome, real
  React/Swiss/WebGL, controlled model replies and speech-boundary callbacks.
  Saved replay, generated-reading transfer, House 4 occupants Sun/Mercury, exact
  Sun-Saturn trine, manual selection, invalid input and stale callbacks observed.
  Screenshot: `dist/verification/chart-presentation-desktop.png`.
- Runtime limits: live-provider cue adherence, real-audio synchronization and
  physical Android remain unverified. Speech offsets use the existing estimated
  word boundaries, not forced audio alignment. Live authenticated cue adherence,
  real audio and physical Android remain separate acceptance checks.
- ✅ 94/94 Node tests, TypeScript, production build and diff check pass. Native
  Chrome chart-presentation browser checks and the existing account-isolation
  browser test pass. The build retains existing vendor/chunk-size warnings.
  GitHub publication is verified separately at handback. Text annotations,
  camera orientation and narrated exports remain separate presentation work.
- ✅ Surge release `1792070740988` deployed from published/pulled source
  `3269589`. All 22 live files / 35,142,036 bytes match the deployment build.
  Fresh Chrome renders Google/email sign-in without page errors. Exact build,
  stamped ZIP/manifest, local chart browser report/screenshot and live verification
  report/screenshot are in root `dist/`; `.gitattributes` preserves their bytes.
  Prior native build is preserved separately inside `dist/`, not designated live.

## Prepaid upsell and funnel screens — exported 15 October 2026

Robin's scope correction: **screens only**, designed in Google Stitch and
exported as a clickable visual prototype. Do not implement payment processing,
wallets, accounts, PDF/chart generation, inference or SPA product functionality.

- [X] 🟨 Define the three offers: natal chart PDF only, PDF + SPA, and
  Bring Natally home. Preserve separate Alby marketplace, x402 and direct-entry
  interfaces; do not invent final prices, recurring terms or unlimited access.
- [X] 🟫 Write the Stitch design brief at `LIBS/UI/STITCH/DESIGN.md` and submit
  the five-screen upsell/channel design request in existing Stitch project
  `8460014353109836944`. KStore TC12 v1.2 is the governing retrieved convention.
- [X] 🟨 Complete offer selection, optional upgrade/decline, channel entry,
  details/review, delivery and recovery screen journeys, including mobile views.
- [X] 🟫 Export original Stitch screen code and images, assemble/verify clickable
  screen navigation, and record the source project and artifact paths.
- ✅ Eight desktop screens and six mobile counterparts exported as editable HTML
  and PNG previews. Browser checks cover all fourteen layouts, plus responsive
  review/recovery at phone width; no horizontal overflow at desktop, 390px mode
  or 360px browser width. Visible narrow-screen buttons meet 44px height.
- ✅ Both decline paths, PDF-to-SPA/home upgrades, separate Alby/x402 quote
  concepts, review labels, delivery and expired/resume paths observed in Chrome.
  Syntax, manifest hashes and handoff ZIP integrity pass. Evidence:
  `LIBS/UI/STITCH/verification.json`; launch instructions in its README.
- 🟫 Handoff: `LIBS/UI/STITCH/exports/natally-prepaid-funnel-prototype.zip`.
  Original source archive and original personal-input review PNG stay local;
  published HTML uses fictional details. This is a visual prototype, with no
  product services or production deployment. Physical-device acceptance is separate.
- [X] 🟫 Export source published to GitHub main as `81f7be4`; remote SHA matched.
  Final formatting/evidence publication is verified separately at handback.

## ADAPTIVE-SPEECH — released by Robin, 2026-10-14

- [X] Implement the adaptive speech amendment in
  DOCS/ARCHITECTURE/local-supertonic-voice.md. Exact files:
  src/services/{voiceService,supertonicTts,supertonic.worker,natallyChat}.ts,
  src/components/{NatallyConfigModal,NatallySprite}.tsx,
  tests/{supertonic.test.ts,voice-browser.html,voice-adaptive-browser.mjs}, .env.example.
  Do: implement `getSpeechPolicy`, `isSpeechBusy`, hard bounded lossless
  `splitSpeechText`, measured `LocalSpeech` metadata, serial/one-ahead adaptive
  playback, validated resource/tone settings and light tone EQ; protect active
  readings from mascot interruption. Retain five passes and local model. Apply
  F4/1.15/0.90 candidate preset and relaxed Gen-Z diction under the amendment.
- Verify/Accept: Node suite (`node --import tsx --test tests/*.test.*
  tests/natally-regression-suite.ts`), npm run lint, npm run build and
  git diff --check pass. Regression tests assert chunk conservation/bounds,
  gentle ordering, capability calibration, cancellation and preference migration.
- Operator protocol: real browser multi-chunk playback; msi4090, Galaxy S9 and
  Fold5 listening, text/audio completeness, inter-phrase gaps, warmth/diction.
  Record actual devices separately; tests are not listening acceptance.
- ✅ 89/89 Node tests, TypeScript, production build and diff check pass.
  Real msi4090 Chromium/WASM generated and played two chunks in gentle mode
  (148/173 chars) without inference/playback overlap; auto mode used measured
  headroom to prefetch. Text conservation, finite PCM and completion observed.
  Final production Chromium/WASM playback passed in gentle/soft and auto/warm;
  all requested text reached the worker and all real audio buffers completed.
  Physical-device listening and audible word-for-word completeness remain open.
- Publication: source 44c6709 pushed, remote verified and pulled. Surge release
  1791953583439 deployed; 15 HTML/JS/CSS assets match. Evidence and limitations in
  HOSTED_CHAT.md and DOCS/verification/adaptive-speech-{browser,production}.json.

## ACCOUNT-HISTORY-ISOLATION — immediate privacy repair, 2026-10-13

- [X] Implement the entity contract in DOCS/ARCHITECTURE/account-history-isolation.md.
  Do: add accountStorageKey/loadAccountValue/saveAccountValue in
  src/services/accountStorage.ts; bind App lore and NatallyChatbot messages to
  authenticated UID; key children and invalidate pending inference, media,
  recognition, speech and reading callbacks on account changes. Preserve legacy
  unowned keys without reading/importing them. Pass isCurrentSession through
  src/services/{natallyChat,readings,hostedInference}.ts; guard all asynchronous
  transport boundaries and tool rounds. Scope location persistence in
  src/services/locations.ts and src/components/{NatalInputForm,ReadingsModal}.tsx.
  App and NatallyChatbot paths: src/App.tsx, src/components/NatallyChatbot.tsx.
- Verify/Accept: tests/account-isolation.test.ts plus existing Node suite,
  npm run lint, npm run build and git diff --check succeed. Regression covers
  A→signed-out→B→A storage and legacy preservation, invalidated inference rounds.
- ✅ 86/86 Node tests, TypeScript, production build and diff check passed.
  `node tests/account-isolation-browser.mjs` passed using real chat/React/storage
  with synthetic A/B identities and only model replies stubbed: sign-out/switch,
  restore/reload, search, late reply/speech suppression, account-local clear and
  byte-identical preservation of the other account and unowned legacy archive.
- Operator/browser protocol: actual React components with synthetic identities,
  A/B history/search isolation, reload restoration, pending response after switch;
  real mother/Robin accounts and physical device remain separately observed.
- Published source `260770d` to GitHub main; verified remote and pulled before
  Surge release `1791945552584`. Live HTML/app JS/CSS/inference chunk match build;
  production login rendered without page errors. Initial network-idle wait timed
  out; direct login-render check passed. HOSTED_CHAT.md records evidence.
  Real mother/Robin device journey and owner-confirmed legacy recovery remain
  unverified/separate; old browser tabs must refresh. No backend/rules changes.

## Clone/build verification — 13 October 2026

- 🟫 Clean GitHub clone of `4026caf`: native Windows Node 24.19.0/npm 11.17.0,
  `npm ci`, TypeScript, production build and 79/79 tests passed without copying
  local credentials, models or dependencies. Local checkout fast-forwarded from
  `f6326b9`; Google/email login controls match the Surge reference.
- `npm start` reproduced `ERR_MODULE_NOT_FOUND` for the TypeScript inference
  imports; the startup command now uses the existing `tsx` loader and explicitly
  selects production mode. Production startup and browser Google/email login UI
  passed; TypeScript and 79/79 tests passed again. Voice worker, both CSS files
  and both WASM files byte-match Surge; main app JS matches after generated chunk
  filenames are normalized. Shared runtime JS is not asserted byte-identical.
- README documents public build configuration and Firebase/hosted-origin
  requirements. Live preflight allows Surge (204) and rejects localhost (403).
  This verifies clone/build/startup, not an authenticated hosted reading or Android
  use. Publication is verified separately at handback; existing service retained.

## Honest voice progress and participant measurements — 13 October 2026

- 🟪 Native ONNX session creation and graph execution emit actual start,
  completion and failure boundaries. The pinned-runtime build adapter fails on
  changed source anchors and preserves native receiver, results and rejections.
- Actual file-read bytes and cache/network source are visible by file. Graph
  initialization and encoder/five-denoiser-pass/decoder execution are distinct.
  Work acknowledgments animate on measured events; elapsed time and a separate
  worker heartbeat expose waiting. Errors retain the last confirmed operation.
- Opt-in tab-local recording and optional coarse device survey are available in
  voice settings and the public measurement page. Exact JSON review/download,
  partial-capture marking, sample counts, observed timing spreads, export privacy
  and duplicate-report aggregation are tested. Cached audio is separated from new
  generation. No submission service or automatic telemetry upload added.
- `DOCS/HONEST-PROGRESS-SOP.md` defines the global contract and pilot boundaries.
  `scripts/voice-instrumentation-landmarks.ts` generates verified source context
  and an instrumentation prompt; automatic editing remains a later pipeline step.
- Automated: 79/79 tests, TypeScript, production build and diff check pass.
  Source 1c4b142 published; release 1791869821804 deployed and eight assets matched.
  Desktop Chrome cached CPU model load, generation, saved replay and new generation
  completed with zero worker fetch attempts. Actual participant download and local
  aggregation verified; detailed timing and scope evidence are in HOSTED_CHAT.
  Physical Android and the four-device cohort require real participant reports.

## Saved voice model startup repair — 2026-10-13

- 🟪 Fixed Transformers.js 4.3.1 startup metadata probes using `main` despite
  the supplied revision, missing the pinned browser cache and requesting the
  network on each new engine. The worker now pins `remotePathTemplate` too.
- Saved files show measured bytes loaded into memory, explicitly labeled local
  loading. Animated activity continues through cache checks, loading, preparation
  and synthesis; errors stop it. The existing model and local-only voice remain.
- Regression reproduces offline startup failure using the actual upstream
  metadata lookup; the repair passes. 70/70 tests, TypeScript and build pass.
- Desktop Chrome: fresh CPU/WASM worker completed real playback with voice fetches
  forbidden and zero attempted fetches. Physical Android verification remains open.
- Published source `90d0b08` to GitHub main; remote SHA verified. Production
  `1791866960572-natally.surge.sh` deployed and key assets byte-matched. Exact live
  worker completed a fresh CPU playback and a different multi-chunk reading with
  zero voice fetches; one worker reused. Details in HOSTED_CHAT.md.

## Mobile momentum and voice retry repair — 2026-10-13

- 🔴 Mobile: implemented normal one-finger release inertia using the existing
  desktop physics. Pinch/finger-count transitions, tap, cancel and disposal stop
  momentum; compatibility mouse events cannot overwrite a touch release.
- 🟪 Voice: returned worker errors now terminate the failed runtime, reject all
  outstanding requests and invalidate preload. Replay/preview creates a fresh
  worker; a reported WebGPU synthesis failure switches the next runtime to local
  WASM for this page session. No hosted/system voice fallback added. The physical
  Z Fold5 `destroy` failure has not been reproduced; recovery is regression-tested
  with the observed error text, not claimed as a certified device fix.
- 🟫 Browser/share title changed from Remix AstroSphere 3D to PSYCHICK NATALLY.
- Automated: 64/64 Node tests, TypeScript, production build and diff check pass.
  Chromium native touch injection into the real Astrolabe3D test page verifies
  rotation after release, pinch zoom and stopped pinch release; desktop inertia
  also passes. These checks do not certify a physical Android device.
- ⬜ Follow-up requests recorded in DOCS/BASELINE-AND-PRESENTATION-FOLLOWUPS.md:
  baseline/billing gates unique USPs; later highlights, presentation commands,
  narrated recording upsells and wooden-sign/bike-pump setup scene.
- 🔴 Original animated mascot supplied and restored by MASCOT-PRESENCE below.
- Publication/deployment remain separate evidence gates; no production deploy
  has occurred in this cloud session. `/home/robin/Admin-Manual` is unavailable
  here; only the checkout's available instructions could be read.
- GitHub publication observed: repair `01e322d85d67769732955d577dc784a9a910a488`
  pushed to main and remote SHA matched. Live-site/device gates remain open.

## MASCOT-PRESENCE — released 2026-10-13

- [X] Preserve Robin's supplied 400x400, 124-frame WebP byte-for-byte as
  `public/natally-mascot.webp`. Update `NatallyAvatar` in
  `src/components/NatallyAvatar.tsx` to default to that asset, preserve custom
  portraits, and use its existing static SVG for reduced motion/disabled animation
  or asset failure. Configure URL through `VITE_NATALLY_MASCOT_URL`.
- [X] Add a `header` size to `NatallyIcon` (`src/components/NatallyIcon.tsx`),
  configurable with `VITE_NATALLY_HEADER_SIZE` (default 72, bounded 48..112).
  Use it at the left of `src/App.tsx` workspace header, AuthModal header and
  NatallyChatbot header; compact to 48px in the mobile chat layout, including keyboard use.
- [X] Keep `NatallySprite` as the single front-facing companion; straighten its
  cursor tilt while speaking and enlarge to env-configured
  `VITE_NATALLY_SPEAKING_SIZE` (default 112, bounded 80..160), only when chat
  is closed. Existing voice settings, bubble text, click and mute behavior remain.
  Styles in `src/index.css`; configuration examples in `.env.example`.
- [X] Link the supplied WebP as favicon in `index.html`; browsers control favicon
  animation. No timed favicon rewriting or synthetic lip-sync claims.
- Verify: Node regression tests including `tests/mascot.test.tsx`, TypeScript,
  production build, git diff check, attachment/public SHA comparison.
  Tests assert default portrait, disabled-animation fallback, header sizing and
  favicon reference. Browser layout/animation and Android remain separate checks.
- Map evidence: CodeGraph locates NatallyAvatar, NatallyIcon, NatallySprite and
  NatallyChatbot; CSS/HTML/env are parser gaps requiring these named reads.
- Design reference: Robin's supplied 37035.webp and existing avatar/header/sprite
  positions. This changes existing surfaces, not a new screen or companion model.
- ✅ 66 Node tests, TypeScript and production build passed before integration;
  attachment SHA256 a40780bad977525afdd6c7f92ed47a4b0ba090b1453921a0ad4248208301f873.
  Browser visual acceptance and favicon animation remain unverified.
- Publication: integrated concurrent touch/voice fixes without reverting them;
  69/69 Node tests and TypeScript passed. Source `899e516` pushed to GitHub main,
  remote SHA verified and pulled before a successful production build/deploy.
  Surge preview: https://1791864414430-natally.surge.sh (2026-10-13).
  Production HTML, app JS/CSS, runtime and voice-service chunks, and mascot all
  matched local dist bytes. HTML SHA256:
  502220ae9c9d608489f9276e5cdde18b2bb0dbfd5c0f176034bc5ca0dc853f88.
  Original mascot remains 1,777,004 bytes with the attachment hash above.

## LOGIN-BEFORE-ONBOARDING — released 2026-10-12 16:13 EDT

- Live-config repair: named Firestore database currently denies all operations.
  Add `firebase/intake.rules` and `scripts/verify-intake-rules.py` per architecture
  amendment. 13 rule evaluations must pass before publishing owner-only intake
  access; capture prior release and verify only the named release changes.
- 16:19 privacy distinction: device-only lore + device-only purchased credits;
  account mode = device storage AND Firebase propagation, account-wide credits.
  Device storage survives sessions but not storage clearing/device loss. Credit
  authorization stays server-side. Lore sync/device credit implementation is
  pending; do not advertise the choice as fully available before it works.

- [X] Implement `DOCS/ARCHITECTURE/login-before-onboarding.md` using
  `SessionProfileState`, `createSessionProfileLoader`, `getEntryStage` in
  `src/services/sessionProfile.ts`; wire `src/App.tsx` Firebase session observer,
  pending/error/retry states and required login before any FirstLight render.
  Initial chart is null; await signed-in profile, guard stale async profile/chart
  work after uid changes; new user alone goes to FirstLight. Scope local intake
  load/save/clear to uid in `src/services/onboarding.ts`; preserve unowned legacy
  data without assigning it to new accounts. Fetch failures throw, never mean absent.
  `src/components/AuthModal.tsx` accepts optional required prop, hides dismiss
  while signed out, explains ordering, scrolls on short/keyboard viewports.
- Verify/Accept: `tests/session-profile.test.ts` tests actual routing and profile
  loader lifecycle for pending/new/returning/error/retry/account-switch/sign-out;
  `node --import tsx --test tests/*.test.* tests/natally-regression-suite.ts`,
  `npm run lint`, `npm run build`, `git diff --check` succeed.
- ✅ 61 Node tests passed, including 6 session/profile lifecycle cases; TypeScript,
  build and diff check passed. 13 Firebase rules evaluations passed (owner access,
  other-account/signed-out denial, data validation and no credit-field writes).
  Browser login and physical device acceptance remain separately unverified.
- Published: `5e9d2e4` source + `564a602` rollback record pushed and pulled;
  Surge `1791836717418-natally.surge.sh`, production bytes matched. Named Firestore
  release now uses tested owner-only intake rules; other releases unchanged.
  Evidence: `DOCS/verification/login-first-publication-20261012.json`.
  Device-only hosted access, full Firebase lore sync and credits are not shipped.
- Operator verification: signed-out fresh/saved-device sessions show login before
  onboarding; returning cloud profile skips onboarding; new account onboards;
  retry and sign-out recover from profile errors; physical provider login and
  full cross-device/account-isolation acceptance remain separately observed.
- 16:15–16:17 product clarification: signup is free with no purchase/subscription;
  account may also own separately purchased prepaid conversation-turn packs.
  Add packs to billing design, not this routing implementation. Device-only lore
  privacy should preserve same-browser sessions, without cross-device continuity;
  Firebase sync is the account-backed choice. Clarify whether device-only skips
  identity or signs in without sync; never bypass hosted API auth ad hoc.

## Immediate priority — BIRTH-DATE-ENTRY, Robin 2026-10-12 15:50 EDT

- [X] Implement `DOCS/ARCHITECTURE/onboarding-birth-date.md`: `BirthDateParts`,
  `getBirthDateParts`, `validateBirthDate` in `src/services/birthDate.ts`;
  controlled `BirthDateFields` in `src/components/onboarding/BirthDateFields.tsx`.
  Robin's 15:53–15:56 amendment: continuous YYYYMMDD numeric-keyboard text input
  using `formatBirthDateInput` and `getBirthMonthDays`; automatic separators,
  valid month/day prefixes, backspace support. Always-open inline calendar with
  tappable year grid/direct year entry, named month select and correct day grid.
  No separate opener and no native popup dependency. Calendar buttons never submit.
  Final 15:58–15:59 amendment: displayed YYYY/MM/DD with automatic slashes;
  native numeric keyboard requested through autoFocus on an immediately mounted
  date form, flushSync inside forward/back user gesture. Calendar remains visible.
  Canonical ISO only at validated submission. Browser/OS keyboard opening needs
  device observation; do not claim a universal forced-keyboard guarantee.
  Wire `FirstLight` validation, guidance and canonical ISO submission; preserve
  Back state, all other onboarding steps and inclusive 1925..one-year-ahead range.
  Remove unused SelectPicker/DAY_OPTIONS/daysInMonth and native date-only entry.
  Add responsive labelled control styles in `src/components/onboarding/first-light.css`;
  remove global native date/time indicator hiding from `src/index.css`.
- Verify/Accept: `node --import tsx --test tests/*.test.* tests/natally-regression-suite.ts`,
  `npm run lint`, `npm run build`, `git diff --check` all succeed;
  `tests/birth-date.test.ts` exercises validator, typing sequences/deletion,
  serialization, rendered calendar/month lengths, keyboard hints and disabled state.
- Operator verification: Android keyboard/dropdown/Next/Back, as in contract;
  keep actual device evidence separate from tests and deployment evidence.
- ✅ 55/55 tests passed (7 birth-date cases), TypeScript, production build and
  diff check passed. CUA browser creation failed: Browser is not available: iab.
  Actual Android automatic-keyboard opening and Next/Back remain unverified.
- Publication: source `54647c9` pushed and GitHub main SHA matched; pulled before
  deployment. Surge `1791835298684-natally.surge.sh` and production published.
  Production index/app JS/CSS match local build bytes; evidence in
  `DOCS/verification/surge-birth-date-1791835298684.json`. No device pass claimed.

## Current colour key — divisions, NOT phases (Robin 15:50 correction)

This key supersedes stage-based colours anywhere in older entries below.
Keep the divisions at the top of every turn; state status and urgency in words.

- 🔴 **Onboarding & mobile UI:** birth-date keyboard/picker is highest priority;
  keyboard-safe chat, translucent readable panels, pinch and device verification.
- 🟦 **Readings & inference:** hosted reliability, natal/current/synastry tools,
  prompt quality, injection-moulting screening and enforced security boundaries.
- 🟪 **Voice:** Supertonic F4 Kawaii, smooth buffered playback, byte progress,
  cache reuse and karaoke; further subjective tuning deferred.
- 🟩 **Accounts & sync:** login before onboarding, offsite access, returning
  profiles, multi-device sync, isolation and recovery verification.
- 🟨 **Billing & Alby:** offer/authority decisions, customer payments, verified
  delivery/retry/refund, Venice/OpenRouter admin controls, marketplace acceptance.
- 🟫 **Launch & infrastructure:** SEO, privacy/trust, accessibility, deployment,
  operations and end-to-end launch checks. Oracle migration remains deferred.
- ⬜ **Character continuity:** DEFERRED-SOUL-TWO-LORE, notes only; no implementation.

## Overall grouped launch queue — Robin 2026-10-12 15:38–15:41 EDT

Product: **Natally**. "Studio" means Gemini AI Studio only, not an edition.
Current source baseline: `f6326b9`; mobile implementation source `6883b75` is
published, with production asset hashes recorded. Keep this grouped list at the
top of every turn; the detailed ordered repair queue below is preserved.
Colours categorize work, never imply completion. Full scope, dependencies and
verification evidence: `DOCS/ALBY-LAUNCH-ROADMAP.md`. These are planning rows,
not newly released implementation tasks. Earlier product-split terminology is
historical and superseded by Robin's correction.

- ⚪ **Natally / Alby-first launch:** one coherent launch, using the working app
  and prior planning as evidence; no silent rewrite or repository merge.
- 🟨 **Offer and contract:** prefer one paid, bounded reading; separately priced
  turns considered next. Freeze included reading types, price, retry/refund terms,
  guest/account boundary and entitlement authority before billing code.
- 🟩 **Accounts and sync:** login before onboarding; verify Google/email signup,
  offsite tester, returning profile, account isolation and multi-device sync.
- 🟨 **Customer billing:** Alby-compatible Lightning/NWC payment, merchant-side
  verification, exact purchase binding, replay/idempotency, recovery/refund.
  x402 is a distinct optional adapter, not a synonym for WebLN or Lightning.
- 🟨 **Provider billing:** Venice ADMIN and OpenRouter Management API provisioning,
  server-only limited inference keys, shared purchase spend ceiling, usage and
  balance reconciliation. Both admin integrations are reserved, NOT implemented.
- 🟦 **Injection moulting:** pre-model screening plus server-owned system prompt,
  trusted tool results, strict scoped tools, durable rate/concurrency/spend limits,
  no wallet/admin powers available to the reading model; adversarial verification.
- 🟦 **Reading and prompt quality:** natal-first/current-date grounding, on-demand
  synastry/transits, unknown-time honesty, respectful kawaii/Gen-Z persona without
  contempt/slang spam, evaluated complete readings and exact saved/PDF output.
- 🔴 **Mobile / 🟪 voice:** actual Android pinch/keyboard/panel/karaoke verification;
  low-resource browser synthesis/buffering/cache tests; preserve F4 env config.
- 🟫 **SEO and trust:** indexable public landing/offer pages, canonical URLs,
  metadata/social previews, sitemap, private-data exclusion, privacy/refunds,
  seller/support contact, accessibility and dependency/calculation licensing.
- 🟫 **Operations and listing:** explicitly approved hosting, production secrets,
  durable purchase storage, spend/error alerts and rollback; Alby connection
  guide/listing assets and maintainer submission. Oracle migration stays deferred.
- 🟫 **Release:** externally observed paid purchase through correct reading,
  replay/retry/recovery/export, account isolation, adversarial and device checks;
  listing actually visible after acceptance, not merely submitted.
- ⬜ **Deferred:** Oracle migration (NOT NOW), SOUL/two-lore, further subjective
  F4 tuning. Extra payment rails/native packaging are not first-launch prerequisites
  by recommendation; preserve earlier scope proposals until explicitly reconciled.

## Current ordered remaining work — Robin 03:33

Keep this list at the start of every turn. New discoveries amend this list; they
do not replace it or silently preempt authorized work.

0. 🔴 MOBILE-VIEWPORT-GESTURES — implementation and 48-test suite pass; verify real Android keyboard/pinch, panel readability and desktop regression after deployment. Preserve remaining priorities.
1. 🟩 Login before onboarding — implemented; verify physical new/returning-user flows after publication. Full privacy/lore-sync/credit modes remain separate pending work.
2. 🟩 Verify new/returning-user routing, saved-profile loading, initial reading and offsite access.
3. 🟪 Verify deployed karaoke scroll-follow on mobile.
4. 🟪 ADAPTIVE-SPEECH implemented/published; desktop real playback passes. Verify audible completeness and timbre on msi4090, Galaxy S9 and Z Fold5; no total CPU/RAM savings claim.
5. 🟩 Complete multi-device data sync; verify real-device account isolation after ACCOUNT-HISTORY-ISOLATION deployment. Legacy unowned history needs explicit owner-confirmed recovery, never automatic adoption.
6. 🟨 Implement billing after identity/sync.
7. 🟫 Deferred: Oracle hosting migration — Robin explicitly said NOT NOW at 03:33. Oracle remains the intended API host; do not provision, migrate, change DNS or dismantle Netlify now. Resume only when Robin releases this item.
8. ⬜ Deferred: SOUL/two-lore implementation. Voice tuning released under ADAPTIVE-SPEECH.

Every completed task must be committed, pushed and remote-verified before turn
end. Implementation, automated tests, runtime observation and deployment remain
separate evidence gates. This ordered list takes precedence over earlier task
headings and migration-discovery instructions below.

## MOBILE-VIEWPORT-GESTURES — released 2026-10-12 10:09 EDT

- [X] Implement contract `DOCS/ARCHITECTURE/mobile-viewport-and-gestures.md`.
- ✅ Automated verification observed: 48/48 tests (9 new viewport/gesture cases),
  TypeScript, Vite production build and diff check pass. CUA createBrowserTab(iab)
  failed with Browser is not available; actual Android remains unverified.
- 🔵 Published to GitHub main (`6883b75`, remote SHA matched) and Surge
  (`1791814839886-natally.surge.sh`). Production index/app JS/CSS byte-matched;
  `DOCS/verification/surge-mobile-1791814839886.json` records hashes. Physical
  keyboard, gesture and visual verification remain on the list, not marked done.
- Do: add `ViewportBounds`, `getChatViewportLayout` to `src/services/chatViewport.ts`
  and `useVisualViewport` to `src/hooks/useVisualViewport.ts`. Return measured
  visual viewport bounds with window fallback; subscribe resize/scroll, clean up.
  Clamp chat with 8px phone/12px desktop inset, phone <=767px fills bounds;
  desktop preserves saved size/position, expanded fills bounds; sanitize numbers.
  Compact = viewport height<500. `src/components/NatallyChatbot.tsx`: fixed measured
  bounds; shrink-0 header/composer, min-h-0 scrollable messages; compact secondary
  chrome, search still available, mobile 16px min-width-zero inputs; no mobile
  dragging/resizing; bounded scrollable error banner and internal safe areas.
- Do: `src/components/DraggableCard.tsx` marks collapsed state, prevents mobile
  drag and preserves desktop placement. `src/index.css` defines natally-chat,
  natally-info-card, natally-workspace rules: expanded panel alpha .78 vs chat .92,
  blur, mobile normal-flow cards. `src/App.tsx` removes mobile fixed main minimum,
  wraps footer controls, uses 100dvh and touch-through blank space. `index.html`
  adds viewport-fit=cover, interactive-widget=resizes-content; no page zoom ban.
- Do: add `bindTorusTouch(element, {start,move,end,zoom})` and
  `getTorusZoomDistance(distance,factor)` in `src/services/torusGestures.ts`.
  Canvas-only touches: one rotates, two use previous/current separation ratio;
  suspend three-plus, restart baseline after lift, end/cancel/dispose clear state;
  suppress post-gesture click, retain tap. Distance clamps 4..13 with validated
  finite positive inputs. `src/components/Astrolabe3D.tsx` replaces window touch
  listeners with binding; same zoom for wheel/pinch, stop momentum on pinch.
- Verify: `node --import tsx --test tests/*.test.* tests/natally-regression-suite.ts`,
  `npm run lint`, `npm run build`, `git diff --check`.
- Accept: tests in `tests/mobile-layout.test.ts` pass for viewport keyboard,
  offsets, resize, invalid saved coordinates; actual event binding pinch direction,
  bounds, one-two-one transitions, cancellation, cleanup, tap vs gesture; lint
  and build pass. Record publication in `HOSTED_CHAT.md`. No dependency changes.
- Operator verification: Android keyboard, typing, rotation, expanded panels,
  pinch and desktop wheel/drag/reset as documented in architecture. CUA currently
  has no browser surfaces; deterministic tests do not certify real device use.

## Publication and immediate handoff — Robin 03:24

- Oracle migration directive 03:31–03:32: hosted API must run on Oracle Cloud
  Always Free infrastructure. Netlify was introduced without clearly obtaining
  infrastructure approval; treat it as temporary migration debt. Do not add more
  providers, provision paid resources, or change DNS/delete the working backend
  ad hoc. Oracle CLI exists but `oci iam region list` failed because
  `/home/robin/.oci/config` is absent. No Oracle target was found in the checked
  Admin-Manual server inventory or local SSH aliases. Operator asked for target
  host/tenancy or credential-document path. No Oracle deployment/cutover has
  happened. Resolve target, record migration architecture and cost boundaries,
  validate replacement, then switch frontend and retire Netlify deliberately.

- Commit and push every completed task before ending the turn, then verify the
  remote commit. Deployments alone do not make work available to other agents.
- Historical 03:24 handoff (superseded by published LOGIN-BEFORE-ONBOARDING above): Restore/check
  the Firebase session first, show sign-in for signed-out visitors, await saved
  profile retrieval before deciding whether onboarding is required. Guard stale
  async account loads. The current code still uses onboarding-first ordering;
  investigation started, but this routing change is not implemented in this handoff.
- Mobile karaoke scrolling and low-resource browser speech remain unverified.
  Data sync/billing follow; character lore remains deferred.

## Active: KARAOKE-FOLLOW

- [X] Source implementation complete: raw-offset mapping, exact active markers, panel-only scroll follow, reduced-motion behavior and old-playback cancellation ordering. ✅ Automated checks: 39 tests and TypeScript passed. Mobile visual/scroll runtime observation remains unverified; deployment recorded separately in HOSTED_CHAT.md.

- [ ] Execute DOCS/DRAFT-karaoke-follow.md in src/services/voiceService.ts, src/services/karaokeScroll.ts, src/components/RichText.tsx, src/components/NatallyChatbot.tsx and tests/karaoke.test.ts. Preserve raw-text offsets through speech cleanup; mark one active word and keep it visible within chat only. Stop old playback before new active state. Respect reduced motion, avoid word-by-word recentering when already visible. Verify full tests, lint/build/diff; browser scrolling remains separate observation.

## Active: NATAL-AND-TODAY

- [X] On-demand tool loop, natal/current-location onboarding, two-chart context and speech lookahead implemented. ✅ Automated suite now 39 tests; TypeScript passed. Real authenticated provider chain executed lookup/natal/synastry/future transits and returned correct cited orbs; evidence and earlier failure retained in HOSTED_CHAT.md. This does not imply browser/phone or multi-device sync acceptance.

- [ ] CALCULATION-TOOLS supersedes fixed today-only context (Robin 03:03): execute all entity contracts in DOCS/DRAFT-calculation-tools.md using exactly the named files. Model-triggered lookup, natal, arbitrary-date transit and synastry requests must actually execute Swiss Ephemeris, validate arguments, return matching tool results and continue hosted inference. Up to six single-tool rounds, eight memory-only charts; no arbitrary code/URLs or guessed birth data. Retain earlier reading/onboarding fixes; remove mandatory auto-sky injection from ordinary askNatally. Verify tool chaining/rejection with tests plus live synthetic hosted chain; deploy compatible backend before frontend.
- Provider compatibility correction: the live provider returned two valid calls despite parallel_tool_calls false. Batches now execute sequentially, bounded to six total calculations per question with one matching result per ID; this supersedes single-call-only language. API reference: DOCS/CALCULATION-API.md. Initial live failure is preserved in DOCS/verification, not recorded as a pass.

- [ ] SYN-ASTRY-CONTEXT (Robin 03:01): execute synastry amendment in DOCS/DRAFT-natal-and-today.md. Add buildSynastryContext in src/services/natallyChat.ts; full two-chart numerics and cross-aspects, no fabricated foe/romance certainty. Extend askNatally options and NatallyChatbot prop with partnerChart; App synastryChart state receives ReadingsModal.onPartnerChart callback and resets on primary calculation. readings.ts rejects missing second chart and sends computed synastry context. ReadingsModal requires selected partner location instead of user's location fallback. Add actual two-chart tests in tests/transits.test.ts. Verify same test/lint/build commands below. No free-text calculation-tool capability claim.

- Screenshot repair amendment (03:00): NATALLY_SYSTEM_PROMPT must treat newly supplied calculated observation sky as authoritative over earlier assistant claims of missing ephemeris, use it immediately, and never blame repeated user requests. ReadingsModal observation date/time uses explicitly labelled device timezone, with offset calculated for the selected date (including DST), not a selected city's approximate standard offset. readings.ts manual observation display uses that same device zone. Verify calculated context reaches a real hosted response before publication.

- Low-resource runtime protocol: use CPU/WASM with one inference thread and no WebGPU as the required performance path; proposed representative floor is a 4 GB entry-level device, not a claim about statistically average hardware. Exercise a complete reading, whole-sentence chunking and overlapping synthesis/playback. Record cold versus warm model loading, first-audio latency, synthesis time, actual playback duration at configured pitch, memory and every underrun. A constrained desktop diagnostic cannot close the real-browser/device gate. Slow generation must lead to sufficient startup buffering rather than repeated mid-reading stalls; this adaptive-buffer behavior is not yet verified or claimed implemented.
- Native diagnostic observed 2026-10-12: `taskset -c 31 node scripts/benchmark-supertonic.mjs`, one efficiency core, one native ONNX inference thread, no GPU. Three chunks synthesized in 2.90/4.35/3.89 seconds for 10.88/16.53/14.73 seconds of pitch-adjusted audio; peak process RSS 858.4 MiB. Report: `DOCS/verification/supertonic-native-cpu-diagnostic.json`. Host RAM was not capped; cache state was not independently established. This is not WASM, mobile, cold-load or gapless-playback acceptance. Browser discovery returned no available browsers.

- Resource acceptance (Robin, 02:46): test typical low-resource conditions, not GPU desktop success. Required release-performance evidence is CPU/WASM with one thread, cold/warm load timing, per-chunk synthesis/audio duration ratio, startup buffer time, underruns and memory. Browser tooling is currently unavailable, so no browser/mobile performance pass may be claimed. `scripts/benchmark-supertonic.mjs` may provide an explicitly labelled native-CPU, one-thread/one-core diagnostic using the same pinned model/F4/speed/steps; this is not a substitute for browser-WASM acceptance. Preserve report provenance and never equate the 4090 host with a low-end device.
- Voice interruption repair while completing this task: `speakNatallyText` in `src/services/voiceService.ts` synthesizes one next chunk while the current buffer plays, captures lookahead errors without unhandled rejections, and retains cancellation generation checks. `VITE_NATALLY_SPEECH_CHUNK_CHARS` configures 100–800 characters, default 450; document in `.env.example` and set local `.env`. Worker status and VoiceDownloadStatus must describe cache-or-network loading, not claim every byte was downloaded. Cache pinned voice embeddings in Cache API too. Extend voice test with proof that next synthesis begins before the current buffer ends; no browser-reload cache-hit or gapless-device claim without observation.
- [ ] Execute `DOCS/DRAFT-natal-and-today.md` entity contract: `src/services/transits.ts` owns CurrentLocation, requestCurrentLocation, calculateTransitAspects, buildCurrentSkyContext. Calculate actual UTC sky with existing Swiss Ephemeris, circular transit-to-natal major aspects within 3 degrees. No fabricated date ranges, current houses or location; mark unknown birth-time limitations.
- [ ] Extend IntakeDraft/intakeToChartInput in `src/services/onboarding.ts` and NatalChartInput in `src/services/ephemeris.ts` with distinct present location/timezone and unknown birth-time flag. Preserve midnight zero hour. Append current-location step in existing FirstLight layout with manual city/device permission/skip choices and date/time disclosure.
- [ ] Replace canned onboarding commentary in App.runCalculation with initial_reading request. NatallyChatbot waits for sign-in and dispatches once, retaining ordinary failure/retry behavior. askNatally includes computed present sky; initial request demands natal-first then today. readings.ts calculates horoscope/full_natal transit facts, validates explicit observation dates; ReadingsModal supplies selected timezone offset.
- Verify: `node --import tsx --test tests/*.test.* tests/natally-regression-suite.ts`; `npm run lint`; `npm run build`; `git diff --check`. Accept: deterministic tests and build pass, including actual ephemeris evidence at a fixed instant. Record hosted response, deployment and browser/device observations separately.

## Priority repair: HOSTED-READING-AUTH

- ✅ Production email/password signup and independent login verified through the public Firebase API with Surge origin; both returned the same account. That ordinary session received HTTP 200/source hosted/model glm-5.3-flash and a synthetic reading from the deployed function. Disposable account deleted. Google provider is configured; browser popup/offsite device use and cross-device sync remain unverified. See HOSTED_CHAT.md.
- [X] Authorized-domain repair and actionable sign-in controls deployed. 24 tests, TypeScript and build passed; live frontend assets byte-matched. An actual Firebase test session reached the production proxy and GLM-5.3-Flash returned a hosted synthetic reading; temporary account/key deleted. Browser Google OAuth remains unobserved (browser tool unavailable).
- Offsite tester amendment: enable Firebase email/password through scoped `signIn.email.enabled` and `signIn.email.passwordRequired` settings, preserving all other auth configuration; existing AuthModal already implements email registration/login. Verify new-account signup, sign-out-independent password login and authenticated production reading using a disposable synthetic account; delete only that account afterward. No shared credentials, anonymous access or special user whitelist. This enables public email registration, not a closed tester allowlist; billing remains a separate task.
- [ ] Release contract: `DOCS/DRAFT-hosted-reading-auth-repair.md`. Append `natally.surge.sh` to the existing Firebase authorizedDomains via scoped update; preserve all existing entries and verify readback. Google provider is already enabled; do not enable other providers or weaken authentication.
- [ ] In `src/services/hostedInference.ts`, export `HostedAuthenticationError` with code `auth_required`; use for missing token and 401 responses. Add `onSignIn: () => void` and `isSignedIn: boolean` props to `NatallyChatbot` and `ReadingsModal`, pass from `src/App.tsx`. Show Sign in for auth failures and retain retry/generation controls once signed in. Add caught/displayed `readingError` for all three ReadingsModal generation handlers. Raise AuthModal overlay above chat to z-[90].
- Verify: `node --import tsx --test tests/*.test.* tests/natally-regression-suite.ts`; `npm run lint`; `npm run build`; `git diff --check`. Accept: typed auth tests and existing tests pass; build succeeds. Record cloud/runtime observations separately; do not mark OAuth/device sync or numerical transits complete from mocks.
- [ ] Next reading-quality gap: compute real observation-date transits for horoscope requests; current readings.ts includes natal positions and date text only. This is not fixed by successful authentication.

## Current product priorities — Robin, 2026-10-12

Every-turn presentation requirement (Robin, 2026-10-12 02:10 EDT): begin every
assistant turn on this project with the current colour-coded remaining-work
list, before commentary or tools, including status-only and discussion turns.
Keep it current; colours classify work, not completion: ⚪ project, 🟣 planning,
🟠 implementation, 🔵 deployment, 🟢 verification. Show unfinished voice work,
core app reliability, multi-device sign-in/sync, billing, and the explicitly
deferred SOUL/two-lore item. Remove completed work from the remaining-work list
only when its appropriate evidence gate is met; never imply listening acceptance
from a build or successful playback.

This ordered queue takes precedence over character expansion and the historical
completion claims below. Planning priorities are not released implementation
recipes or claims of completed work. Surface these in the recurring colour-coded
task list whenever working on Natally Studio.

1. ⚪ Natally Studio — working product first.
2. 🟣 [ ] App reliability: make onboarding, hosted chat/readings, error recovery and local voice work well as a coherent experience. No canned offline answer substitution. Voice quality remains subject to listening acceptance; character expansion must not delay core repairs.
3. 🟣 [ ] Restore multi-device sign-in and data sync with Firebase or a suitable equivalent. Prefer repairing the existing integration before replacing it; evaluate actual configuration and ownership. Resolve the current sign-in/API authentication mismatch. Define synced data, migration of device-local data, conflict handling, account isolation, sign-out and deletion before releasing implementation tasks.
4. 🟣 [ ] Working billing after identity/sync: define the Studio paid product and limits, implement checkout/payment confirmation and RevenueCat-backed entitlements through one controller, and restore access across devices. Use a production EntitlementSyncBridge when integrating a direct processor. No client-granted access or project-owned magic-link flow; do not infer pricing or processor choice from this priority request.
5. 🟣 [ ] Only after those priorities: revisit DEFERRED-SOUL-TWO-LORE with Robin. It remains explicitly not authorized for implementation.

🔵 Deployment and 🟢 verification are separate gates for each released repair.
Runtime evidence must cover real hosted replies, the same account's data on two
devices with account isolation, and payment-to-entitlement/access restoration;
builds or mocked tests alone do not establish those outcomes. Record runtime
checks as operator verification protocols, not side-effecting checklist Accept
clauses. This queue belongs to Studio/full companion, not the separate Alby kit.

## Recurring colour-coded task list — deferred character continuity

- ⚪ Natally Studio / full companion: carry this item in the colour-coded remaining-work list whenever working on this project, until Robin changes or releases it.
- 🟣 [ ] `DEFERRED-SOUL-TWO-LORE`: one shared `SOUL.md`, two logical lore stores. **Notes only; Robin explicitly said not to implement yet (2026-10-12).** This is not a released coder task, database migration, or deployment authorization.
- Shared soul: cartoony robo-psychic mascot; high-pitched kawaii voice direction; relatable Gen-Z diction and gentle ennui; new graduate from psychic school struggling to establish her own practice, who quit the psychic hotline after one hour. Occasional fourth-wall breaks, socially mistimed harmless oversharing, warmth and approachability are intentional character traits.
- Natally lore: each user's individual Natally has a seeded fictional backstory, classmates, incidents and ambitions. PRNG selects initial variation; the LLM can flesh it out over time. Persist established facts and developments rather than rerolling her past. A seed does not reproduce generated prose by itself.
- Shared/user lore: user-disclosed facts, conversation history, shared jokes and which Natally anecdotes have already been revealed. Keep fictional character facts separate from factual claims about the user.
- Product analogy: Cabbage Patch Kids individuality, Tamagotchi continuity, Furby personality; everyone gets a different character history with the same soul. Encourage voluntary return through familiarity and humour, not guilt or dependence.
- Keep this small: two logical stores, not necessarily two database servers or a new agent framework. Storage schema, persistence lifecycle and implementation paths remain unreleased. Voice configuration is separate from `SOUL.md`; prompting alone does not change TTS timbre.
- Scope: Studio/full companion only. Do not silently add ongoing lore/dialogue to the separate bounded, one-off Natally-Alby reading edition in `Kintsugi-alby`.
- 🟠 Implementation, 🔵 deployment and 🟢 verification of this feature are not started and must not be implied by saving these notes.

## Active repair: LOCAL-SUPERTONIC-VOICE

- [X] F4-KAWAII implementation complete: environment-configured preset, saved-setting migration and reapply control. No lore implementation. Further voice tuning is deferred by Robin, not a release gate.
- ✅ F4-KAWAII automated verification: 23 tests passed (7 voice + 16 hosted), TypeScript and Vite build succeeded, diff check passed. Deployment observed at `natally.surge.sh` (preview `1791785678774-natally.surge.sh`); production index and voice-service bundle byte-matched local output; all three configured values confirmed in the bundle. No new subjective listening, phone or WebGPU claim.
- F4-KAWAII amendment, 02:12 EDT: no audition or listening gate before moving on. Best-guess preset is F4/pitch 1.30/rate 0.85. Add `getVoicePreset(env)` in `voiceService.ts` with validated `VITE_NATALLY_VOICE`, `VITE_NATALLY_VOICE_PITCH`, `VITE_NATALLY_VOICE_RATE`; document in `.env.example` and `HOSTED_CHAT.md`. Build-time environment controls defaults. Save `voicePresetVersion` derived from those three values; on missing/changed version apply the current voice preset while retaining unrelated preferences, so existing installs receive F4 and future environment adjustments. Within the same version preserve valid custom voice settings. Test configuration validation and migration. This supersedes preserving unversioned voice choices and the prior listening gate for this bounded release; subjective tuning is deferred, not claimed verified.
- [ ] `F4-KAWAII`: Robin released this bounded implementation on 2026-10-12. In `src/services/voiceService.ts`, set `DEFAULT_VOICE_SETTINGS` to F4, pitch 1.30, synthesis rate 0.85, kawaii_chibi; update `NATALLY_VOICE_SAMPLE` to a short mascot audition. `loadVoiceSettings` preserves valid existing local voices/pitch/rate, falls back to new defaults for absent/invalid values and legacy unsupported speakers; validate finite numeric ranges. In `src/components/NatallyConfigModal.tsx`, add an explicit Use F4 Kawaii button applying only preset voice/rate/pitch/personality fields while preserving mute/avatar/sprite; label F4. In `tests/voice-browser.html`, default to the same F4 preset and offer a natural-reference checkbox. Extend `tests/supertonic.test.ts` for defaults, preference preservation, invalid settings and F4/pitch playback wiring. Verify voice and hosted tests, lint/build, diff check. Accept: those deterministic checks pass; deployment and signed-out runtime playback are separately recorded. No lore or chat-persona expansion in this task.
- [X] Replace the disconnected `supertonicSpeak` stub with the browser-local ONNX runtime, per `DOCS/ARCHITECTURE/local-supertonic-voice.md`.
- ✅ Automated acceptance observed: 5 local-voice tests, 16 existing hosted tests, TypeScript, Vite production build, and `git diff --check` pass. This does not certify expressive quality.
- Runtime observation: deployed signed-out WASM speech reached playback completion; Stop ended playback; onboarding remained usable at 55.4 / 262.8 MB, transitioned to preparation, then cleared the strip.
- [ ] Listening acceptance for Gen-Z ennui, relatable warmth, approachability, and emotional nuance; phone performance and WebGPU runtime acceptance remain unverified.
- Operator rejection: the deployed voice sounds much older in timbre and diction. Do not claim expressive acceptance. Expose F1–F5 comparisons at natural pitch/speed in `tests/voice-browser.html`; extend the worker/settings/selector allowlist consistently. Add shared `NATALLY_VOICE_SAMPLE` in `voiceService.ts`, use in config preview and comparison page. Refine `NATALLY_SYSTEM_PROMPT` speech register toward understated conversational Gen-Z language without slang spam; verify tests/build, retain user listening as the deciding gate.
- Do: implement `supertonicSpeak`, `splitSpeechText`, `subscribeVoiceStatus` in `src/services/supertonicTts.ts`; add serialized `src/services/supertonic.worker.ts` using pinned Transformers.js and model revision; lazy WebGPU/WASM, model cache, bounded PCM reuse, retryable failures.
- Do: replace speech generation in `src/services/voiceService.ts` with local PCM playback; preserve its exported API; migrate saved engine/voice preferences; chunk all text; invalidate late work after stop; remove Gemini, `/api/tts`, and system-speech fallback from the active voice path.
- Do: update the existing engine controls in `src/components/NatallyConfigModal.tsx` to local voice selection and subscribed status, retain preview, accurately disclose English voice and download. Update `package.json` and lockfile for runtime dependency. Add `tests/supertonic.test.ts` and update `HOSTED_CHAT.md` with the separate local-voice status.
- Verify: `node --import tsx --test tests/supertonic.test.ts`; `npm run lint`; `npm run build`; existing hosted tests.
- Accept: tests pass and build succeeds; tests assert bounded lossless chunking, old preference migration, cancellation, and no hosted speech fallback. Implementation and runtime verification remain separate.
- Runtime protocol: signed-out voice preview, real local PCM and playback, stop/retry, backend/device observations recorded separately in architecture.
- Verification surface: `tests/voice-browser.html` exercises the same `speakNatallyText` in a signed-out page; `vite.config.ts` builds this entry for deployment parity. No test-only inference bypass or substitute audio.
- Onboarding addition authorized by Robin: `scheduleSupertonicPreload` and `initSupertonic` in `src/services/supertonicTts.ts`; mount from `src/components/onboarding/FirstLight.tsx` using an effect. Idle-schedule the shared worker's preload operation, no audio and no blocking modal. Respect Save-Data; when preload fails, speech can retry. Verify duplicate preload coalescing and retry in `tests/supertonic.test.ts`.
- Byte-progress addition authorized by Robin: `SupertonicDownloadProgress` and pinned `SUPERTONIC_MODEL_FILES` in `src/services/supertonicDownload.ts`; track actual loaded/done callbacks per file with a fixed summed byte denominator. Extend `VoiceStatus` with `loadedBytes`, `totalBytes`, and `preparing`. Add `src/components/VoiceDownloadStatus.tsx`, mount alongside App in `src/main.tsx`; thin bottom strip, accessible native progress, downloaded/total MB and explicit preparing stage, never a fabricated 99%. Test aggregation/cache/repeated callbacks in `tests/supertonic.test.ts`.

## Master Tracking Header
- Project: AstroSphere 3D
- Scope: Conversational Intelligence, Contextual Continuity, Interpretive Depth, Personality Restoration
- Status: Completed (10/10 Tests Passed, 100%)
- Target Model: gemini-3.8-flash for Chat & Readings; gemini-3.8-flash-lite-tts for Voice

---

### Task 1: Backend Model Endpoint Correction & Hyperparameter Audit
- **Task ID**: `TASK-001-SERVER-MODELS`
- **Objective**: Fix dead model identifier in `server.ts` from deprecated `gemini-2.5-flash` to active `gemini-3.8-flash`, add configurable generation parameters, and sanitize multi-turn history.
- **Files in Scope**: `server.ts`
- **Preconditions**: Verified that `curl -X POST http://localhost:3000/api/chat` fails with 404 on `gemini-2.5-flash`.
- **Required Changes**:
  - Update `POST /api/chat` model to `'gemini-3.8-flash'`.
  - Update `POST /api/readings` model to `'gemini-3.8-flash'`.
  - Sanitize incoming `history` array to enforce alternating roles (`user` followed by `model`), removing leading `model` turns if unneeded or normalizing to valid Gemini contents structure.
  - Support configurable generation parameters: `temperature` (default 1.18 for chat, 1.25 for readings), `topP`, `topK`, `thinkingConfig`, `maxOutputTokens`.
  - Standardize error handling and HTTP status codes (distinguish 401/403 auth, 429 quota, 503 unavailable).
- **Explicit Non-Goals**: Do not alter static file serving or TTS endpoints.
- **Tests**:
  - Execute curl test against `/api/chat` and `/api/readings` and verify HTTP 200 with non-empty generated text.
- **Acceptance Criteria**: Backend successfully returns valid Gemini 3.8 Flash responses.
- **Evidence to Record**: Curl response payloads and timestamps.
- **Dependencies**: None.

---

### Task 2: Epistemology & Aspect Configuration Logic Correction
- **Task ID**: `TASK-002-ASTRO-CONFIG-LOGIC`
- **Objective**: Eliminate spurious T-square and Grand Trine pattern detection in `src/services/astrowisdom.ts`.
- **Files in Scope**: `src/services/astrowisdom.ts`
- **Preconditions**: Inspection shows `if (hasOpposition && hasSquare)` and `if (hasTrine)` triggering false configuration claims.
- **Required Changes**:
  - Implement genuine T-Square detector: search for 3 bodies $A, B, C$ where $A \mathrel{☍} B$ ($180^\circ \pm 8^\circ$) and $A \mathrel{□} C$ and $B \mathrel{□} C$ ($90^\circ \pm 7^\circ$), identifying apex $C$ and modality.
  - Implement genuine Grand Trine detector: search for 3 distinct bodies $A, B, C$ in mutual trines ($120^\circ \pm 8^\circ$) in the same element triplicity.
  - Implement genuine Grand Cross detector: 4 bodies forming 2 oppositions and 4 connecting squares.
  - Only output aspect configuration themes when geometrically verified.
- **Explicit Non-Goals**: Do not alter numerology / life path calculation.
- **Tests**:
  - Test calculation on Robin L. M. Cheung's chart (10 Nov 1975) and other presets, asserting no spurious Grand Trine is falsely diagnosed from a single trine.
- **Acceptance Criteria**: Accurate configuration themes based strictly on geometric chords.
- **Evidence to Record**: Unit output comparison before and after.
- **Dependencies**: None.

---

### Task 3: Natally System Prompt & Persona Restoration
- **Task ID**: `TASK-003-PERSONA-PROMPT`
- **Objective**: Restore Natally's authentic Moldavian-inspired cosmic confidante voice in `src/services/natallyChat.ts` and eliminate robotic catchphrase instructions and compulsory brackets.
- **Files in Scope**: `src/services/natallyChat.ts`
- **Preconditions**: Current system prompt commands catchphrase spam ("Beep-boop", "Nya~", "UwU") and rigid brackets `[Verified geometry]`, etc.
- **Required Changes**:
  - Rewrite `NATALLY_SYSTEM_PROMPT` to establish her authentic personality: young-adult Moldavian cosmic confidante with warmth, wit, philosophical depth, emotional sensitivity, and sharp psychological perception.
  - Enforce natural conversation rules: answer specific questions directly; resolve references to previous turns; acknowledge vulnerable disclosures with genuine empathy without therapeutic cliches or conversational resets.
  - Strictly forbid mechanical bracket insertions like `[Verified geometry]` or `[Traditional doctrine]` in natural dialogue. Support an optional designated evidence section if requested or structured.
  - Structure prompt into clear sections: Core Identity & Voice, Conversational Rules & Context Continuity, Astrological Method & Epistemology, Boundaries.
- **Explicit Non-Goals**: Do not turn Natally into a generic clinical AI assistant.
- **Tests**:
  - Model prompt evaluation for tone, absence of catchphrase spam, and natural flow.
- **Acceptance Criteria**: Responses are lively, warm, nuanced, and free of forced boilerplate.
- **Dependencies**: `TASK-001-SERVER-MODELS`.

---

### Task 4: Context Assembly & Referential Continuity
- **Task ID**: `TASK-004-CONTEXT-ASSEMBLY`
- **Objective**: Implement clean context separation among system instructions, live chart facts, persistent lore, and conversational turns in `src/services/natallyChat.ts`.
- **Files in Scope**: `src/services/natallyChat.ts`
- **Preconditions**: Current implementation dumped the entire chart and lore string as a prefix to `User says:` on every turn.
- **Required Changes**:
  - Structure context cleanly: pass natal chart coordinates, dignities, house cusps, and aspects as structured context.
  - Inject persistent user lore separately as biographical background rather than colliding it with active dialogue.
  - Ensure conversation history preserves past user and assistant messages in correct chronological sequence without duplication.
  - Ensure pronouns and references to earlier statements (e.g. "What do you mean 'no games'?") are resolved naturally.
- **Explicit Non-Goals**: Do not truncate conversation history below reasonable context size (allow at least 20 recent turns).
- **Tests**:
  - Multi-turn conversation testing verifying referential recall across consecutive turns.
- **Acceptance Criteria**: Follow-up questions resolve prior context effortlessly.
- **Dependencies**: `TASK-001-SERVER-MODELS`, `TASK-003-PERSONA-PROMPT`.

---

### Task 5: Eliminate Silent Impersonation & Establish Transparent Error Recovery
- **Task ID**: `TASK-005-ERROR-HANDLING-RETRY`
- **Objective**: Remove deceptive keyword fallback in `src/services/natallyChat.ts` and `src/components/NatallyChatbot.tsx`. Surface honest error states with retry mechanisms and preserve draft messages.
- **Files in Scope**: `src/services/natallyChat.ts`, `src/components/NatallyChatbot.tsx`
- **Preconditions**: `getNatallyFallbackReply()` silently masked API failures with canned horoscope snippets.
- **Required Changes**:
  - In `natallyChat.ts`, throw or return typed failure states (e.g., `{ success: false, errorType: 'quota' | 'network' | 'offline' | 'auth', message: string }`) instead of silently fabricating canned astrological interpretations.
  - In `NatallyChatbot.tsx`, if inference fails:
    - Display an in-chat status banner with error explanation.
    - Provide a "Retry" button to re-attempt inference.
    - Preserve the user's input text in case they wish to edit or re-send.
    - Provide an explicit "Offline Local Oracle" mode ONLY when intentionally chosen or flagged, clearly marked with `[Offline Local Mode]`.
- **Explicit Non-Goals**: Do not leave the user stranded with a broken UI.
- **Tests**:
  - Test simulated network/API failure (Test G) and verify explicit error status + retry capability.
- **Acceptance Criteria**: No silent impersonation of live inference; clear error feedback.
- **Dependencies**: `TASK-001-SERVER-MODELS`.

---

### Task 6: Optional On-Demand Technical Evidence & Provenance View
- **Task ID**: `TASK-006-EVIDENCE-INSPECTOR`
- **Objective**: Provide an optional, user-accessible evidence and provenance view for astrological coordinates and doctrines without forcing brackets into ordinary conversation.
- **Files in Scope**: `src/components/NatallyChatbot.tsx`, `src/services/natallyChat.ts`
- **Preconditions**: Users and astrologers need to verify mathematical geometry and doctrine without seeing clumsy brackets in chat.
- **Required Changes**:
  - Allow Natally to output technical reasoning in a discrete, machine-parsable footer or structured field when prompted or for astrological readings.
  - In `NatallyChatbot.tsx`, add an optional "Astrological Provenance & Geometry" disclosure button on turns containing technical analysis.
  - Clicking the toggle displays exact coordinates, classical dignities, and psychological archetypes in a neat, collapsible card.
- **Explicit Non-Goals**: Do not clutter conversational bubbles.
- **Tests**:
  - Verify that ordinary dialogue has no brackets and clicking the toggle displays clean provenance metadata.
- **Acceptance Criteria**: Seamless balance between natural conversation and rigorous analytical verification.
- **Dependencies**: `TASK-003-PERSONA-PROMPT`, `TASK-004-CONTEXT-ASSEMBLY`.

---

### Task 7: Comprehensive Regression Test Suite Execution (Tests A through J)
- **Task ID**: `TASK-007-REGRESSION-SUITE`
- **Objective**: Implement and execute the complete regression test suite covering Tests A through J described in Section 10 of the brief.
- **Files in Scope**: Test script / verification runner (`test-natally-regression.ts` or executable runner)
- **Preconditions**: Tasks 1 through 6 completed.
- **Required Changes**:
  - Run Test A (Referential continuity: "What do you mean by games?")
  - Run Test B (Personal disclosure: trauma influencing sexuality)
  - Run Test C (Sequential topics: "Lovers first. Then career.")
  - Run Test D (Interpretive continuity: Sun-Moon tension connecting to Moon)
  - Run Test E (Honest ambiguity: former lover return claim)
  - Run Test F (Broad interpretive synthesis: Scorpio Sun, Aquarius Moon, Taurus Ascendant)
  - Run Test G (Deliberate inference failure: API down simulation)
  - Run Test H (Repetition resistance: 3 consecutive related follow-ups)
  - Run Test I (Lore isolation: with vs without stored lore)
  - Run Test J (Traditional vs modern doctrine distinction: Hellenistic vs psychological)
- **Acceptance Criteria**: All 10 tests pass with recorded outputs, settings, and verification notes.
- **Evidence to Record**: Complete input/output transcript logs for all 10 tests.
- **Dependencies**: Tasks 1-6.

---

### Task 8: Voice, Mascot, and UI Integrity Verification
- **Task ID**: `TASK-008-VOICE-MASCOT-INTEGRITY`
- **Objective**: Ensure audio synthesis, karaoke tracking, draggable card, 3D astrolabe interactions, and export remain fully functional.
- **Files in Scope**: `src/services/voiceService.ts`, `src/components/NatallyChatbot.tsx`, `src/App.tsx`
- **Preconditions**: Chat output formatting modified.
- **Required Changes**:
  - Verify `prepareSpeechText` strips any evidence markers or markdown before TTS synthesis.
  - Verify audio playback continues smoothly without truncation or stutter.
  - Verify karaoke tracking syncs with spoken words.
  - Verify conversation export includes accurate timestamps and clean text.
- **Acceptance Criteria**: Zero regressions in voice, mascot, or 3D astrolabe interactions.
- **Dependencies**: Tasks 1-7.

---

### Task 8: First-Light Onboarding Flow (ported from natally)
- **Task ID**: `TASK-008-FIRST-LIGHT-ONBOARDING`
- **Objective**: Port natally's first-light intake (apps/local/src/screens/first-light) into AstroSphere as the sole entry path. Remove FAMOUS_PRESETS entirely — the user's own intake is the only preset.
- **Files Created**:
  - `src/components/onboarding/FirstLight.tsx` (near-verbatim port; IntakeDraft moved to services/onboarding.ts)
  - `src/components/onboarding/first-light.css` (verbatim)
  - `src/services/gazetteer.ts` + `src/services/gazetteer.json` (108 entries incl. user:alexandria-on; tzOffsetHours resolves DST-aware historical offsets via Intl)
  - `src/services/onboarding.ts` (intakeToChartInput, loadNatalIntake/saveNatalIntake under `astrosphere_natal_intake_v1`)
  - `public/fonts/playfair-display-latin.woff2` + OFL license
- **Files Modified**: `src/App.tsx` (onboarding gate via early return; boot recasts persisted intake once; runCalculation returns success; seeded personal lore removed), `src/components/NatalInputForm.tsx` (FAMOUS_PRESETS + picker UI + applyPreset removed; PRESET_CITIES city suggestions untouched), `tests/natally-regression-suite.ts` (baseline fixture inlined). Backups: `src/App.tsx.bak`, `src/components/NatalInputForm.tsx.bak`.
- **Behavior**: Fresh visitor → full-screen FirstLight questionnaire (name → date → place from gazetteer datalist → time, "I don't know my birth time" → 12:00 + Whole Sign). On Begin: draft → NatalChartInput (tz from tzid at the birth moment), persisted to localStorage, chart cast, Natally greeting injected. Returning visitor → persisted intake recast automatically.
- **Verification**: `tsc --noEmit` clean; `vite build` succeeds; dev server serves font 200/38404B; tzOffsetHours checked against known historical offsets (Toronto EST/EDT, London 1815, Zurich 1875, Kolkata +5.5); intakeToChartInput exercised for Alexandria ON and unknown-time paths.
- **Dependencies**: None.

---

### Task 9: Modular Hosted Inference Engines (OpenRouter free live; Venice/admin/local reserved)
- **Task ID**: `TASK-009-INFERENCE-ENGINES`
- **Objective**: Replace the Gemini-only /api/chat & /api/readings cores with an env-selected engine seam. OpenRouter free tier works now; no billing. Architecture anticipates modular billing (Alby marketplace primary, x402/WebLN rails) and a later local llama.cpp/wllama3 engine with no spend limit.
- **Files Created**:
  - `server/inference/types.ts` — InferenceEngine interface; CompletionRequest.subject is the billing seam; UsageReport feeds metering
  - `server/inference/registry.ts` — registerEngine/resolveEngine; INFERENCE_ENGINE env; reserved ids venice/openrouter-admin/local fall back with a logged warning
  - `server/inference/engines/gemini.ts` — legacy Gemini engine (contents sanitization preserved)
  - `server/inference/engines/openrouter.ts` — free-tier default chain (deepseek-chat-v3-0324:free → llama-3.3-70b:free → gemma-3-27b:free), 404/429 chain-walking, usage+cost reporting, 401/403/402/429 error mapping
  - `server/inference/metering.ts` — recordUsage() choke point where the top-up ledger subscribes later
- **Files Modified**: `server.ts` (both proxy routes → resolveEngine().complete(); TTS unchanged), `.env.example` (INFERENCE_ENGINE / OPENROUTER_API_KEY / OPENROUTER_MODEL). Backup: `server.ts.bak`.
- **Verification**: tsc clean; live run: engine resolved `openrouter (auto)`, request reached OpenRouter edge, provider 401 ("User not found." — shell key stale, confirmed against OpenRouter directly) mapped to AUTH_FAILED/401. Happy path awaits a current key in .env.
- **Reserved-engine contracts**: venice = ADMIN key + POST /api_keys {consumptionLimit.usd, limitPeriod} per user on top-up; openrouter-admin = Provisioning API per-user key spend-limited to 40% of top-up, stored on user's Firebase doc; local = atomic-chat llama.cpp/wllama3, available() true offline, no metering.
- **Dependencies**: None.

---

### Task 10: Generic OpenAI-Compatible Engine + Live Free-Tier Rescue
- **Task ID**: `TASK-010-OPENAI-COMPATIBLE-ENGINE`
- **Objective**: Use the z.ai GLM Coding Plan (glm-5.3-flash) or Ollama via a generic OpenAI-shaped endpoint; make Venice usable now as direct inference; survive OpenRouter free-tier model churn.
- **Files Created**: `server/inference/engines/openai-compatible.ts` — factory + `customOpenAIEngine` (CUSTOM_LLM_BASE_URL/KEY/MODEL/MODELS; Ollama needs no key) + `veniceEngine` (VENICE_BASE_URL/API_KEY/MODEL, default venice-uncensored-1-2).
- **Files Modified**: `server/inference/engines/openrouter.ts` (chain → nvidia/nemotron-3.5-lightning:free, thinkingmachines/inkling:free, poolside/laguna-s-2.1:free; OPENROUTER_BASE_URL honored; "unavailable for free" mapped to MODEL_NOT_FOUND; discoverLiveFreeModel() queries /models when the chain dies and retries once), `server/inference/registry.ts` (registers openai-compatible + venice; reserved ids now venice-admin/openrouter-admin/local), `.env.example` (user-populated dummies preserved; CUSTOM_LLM_* and VENICE_MODEL documented).
- **Verification (live)**: openrouter → `nvidia/nemotron-3.5-lightning:free` HTTP 200 "stellar"; venice → `venice-uncensored-1-2` HTTP 200. z.ai path = same code path as venice (factory), awaits CUSTOM_LLM_* population. TTS remains Gemini-key-only as planned.
- **Dependencies**: Task 9.

---

### Task 11: Surge Deploy Prep + KStore Workstation Wiring
- **Task ID**: `TASK-011-SURGE-PREP-KSTORE`
- **Objective**: Static deploy to natally.surge.sh on z.ai glm-5.3-flash (Coding Plan); wire this host's KStore pre/post hooks.
- **Delivered**: client browser-direct seams (`askNatallyDirect` VITE_LLM_*, `synthesizeGeminiTtsDirect` VITE_GEMINI_API_KEY, thinking-model content/reasoning fallback); scripts/deploy-surge.sh; dist/ built with ZAI_API_KEY from KStore GET /config (coding base live-verified 200 + CORS open to surge origin; general base 429). Gemini .env key INVALID → excluded; TTS rides fallback ladder. KStore diagnosis: real port 8788 (8878 was transposition); workstation client deployed (release 2ca3e93) incl. Claude hooks; TAB-through-ssh pg-channel root cause found and fixed config-side; capture verified (archive + PG readback + native record). Admin-Manual session log pushed (5fe6632 + hook-repair addendum).
- **Blocked**: surge auth (not in KStore — /search hangs server-side; no ~/.surge). Awaiting `! npx surge login`.
- **Dependencies**: Task 10.

---

### Task 12: Onboarding UX Fixes (Android/desktop live findings)
- **Task ID**: `TASK-012-ONBOARDING-PICKERS-V2`
- **Fixes**: (1) native date input presented no picker anywhere → hybrid typed field (inputMode numeric, Android keyboard, YYYY-MM-DD ours — never locale-reversed) + 🗓️ CalendarPicker popover (new component, 1800–2400 clamp); time likewise typed HH:MM. (2) Sign-in now precedes onboarding (AuthModal gate; authResolved loading state). (3) Geo combobox confirmed reaching the live bundle. Deployed bundle index-DtYeFI3j verified.
- **Dependencies**: Tasks 8, 11.

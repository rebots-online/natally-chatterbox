# Login before onboarding

## Live configuration repair amendment

Live inspection found the configured named Firestore database denies every read
and write. Add `firebase/intake.rules`, owner-only get/create/update/delete at
users/{uid}/private/intake, validated bounded fields, no credits or unrelated
paths. Evaluate with `scripts/verify-intake-rules.py` (13 synthetic owner,
cross-account, signed-out, invalid-data and out-of-scope cases) against Firebase
Rules API before release. No test database reads/functions or document mutations.
Capture old ruleset/release; publish source then patch ONLY that named database
release and read it back. No other databases/providers/auth configuration changes.
The script consumes existing gcloud credentials without logging them.

16:19 privacy/credits contract: local mode stores lore only on device, credits
usable only on that device. Account sync keeps local data AND propagates via
Firebase; account credits follow the account. Local mode still needs server-
verified device-bound purchase authority; browser balances never grant credit.
This distinction belongs in product copy and next implementation contracts, not
a claim that lore/credit sync has already been built.

Released by Robin 2026-10-12 16:13. Existing Firebase login modal must precede
FirstLight; this is routing repair, not new identity/billing infrastructure.
16:15–16:17 clarification: account creation is free, for profile/continuity and
optionally purchased readings/prepaid conversation packs. No signup payment or
subscription obligation. Turn packs are a billing follow-up, not implemented here.
Device-only privacy storage is also requested: persists across browser sessions,
not across devices or after storage deletion. Account/Firebase sync is the
cross-device choice; hosted model disclosure remains necessary in either mode.
Whether device-only skips identity or signs in with sync disabled is being
clarified; do not silently weaken hosted API authentication to implement privacy.
CodeGraph verified App/AuthModal/onboarding sources; Markdown contract reads
use the established parser gap. Existing bypass comment is obsolete.

| Entity | Target | Contract |
| --- | --- | --- |
| SessionProfileState | src/services/sessionProfile.ts:1 | generic uid,status loading/ready/error,profile,error; no successful missing profile on fetch failure |
| createSessionProfileLoader | src/services/sessionProfile.ts:9 | generic injected fetchProfile and onState; load(uid or null) immediately emits loading/ready; generation invalidates prior success/failure; dispose invalidates pending work |
| getEntryStage | src/services/sessionProfile.ts:40 | authResolved,uid,profileState,hasChart -> session-loading/login/profile-loading/profile-error/onboarding/workspace in that order |
| App | src/App.tsx:53 | chartInput initially null; auth observer resets chart/session transient state, invokes loader; waits for profile resolution before FirstLight; loading/error screen with retry/sign-out; non-dismissible login for signed-out users; re-check uid/generation around async chart/onboarding work |
| AuthModal | src/components/AuthModal.tsx:16 | optional required boolean defaults false; hides close when required; accessible scrollable dialog and login-before-onboarding explanation; existing providers unchanged |
| loadNatalIntake/saveNatalIntake/clearNatalIntake | src/services/onboarding.ts:49 | optional uid selects user-scoped local cache key; no uid preserves legacy key for compatibility; App always passes authenticated uid, no automatic cross-account import or upload |
| fetchUserIntake | src/services/onboarding.ts:113 | absent document returns null; retrieval failure throws (billing wrapper preserved), never silently mistaken for new user |

No deletion/migration of unowned legacy intake; no changes to provider config,
identity methods, entitlements, paid guest contracts or hosting. Error is retryable,
not permission to skip sign-in or fabricate profile success. Device-scoped reading
history/lore and complete multi-device sync are separate remaining tasks.

Tests in tests/session-profile.test.ts exercise routing matrix, pending profile,
returning/new accounts, stale success/error after account switch/sign-out/dispose,
retry after rejection. Run full Node suite, tsc, build, diff check. Physical login,
new/returning browser sessions and two-account device behavior remain operator
verification protocols, not inferred from tests or production asset hashes.

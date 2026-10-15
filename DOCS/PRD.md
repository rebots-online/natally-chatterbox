# PRD — `natally` (natally-ai-studio)

**Inception date:** 2026-10-10 (re-baselined to Admin-Manual minimum; original product PRD preserved at `DOCS/PRD.md.bak.20261010-pre-minimum`)
**Owner:** Robin L. M. Cheung, MBA
**Status:** `active`
**Reference conversation:** `/home/robin/.claude/plans/can-you-take-a-foamy-oasis.md` (2026-10-10 session — login-first, First-Light onboarding, account-scoped cloud, license keys)

**Project name:** **natally** — The Natal Astrology Companion & 3D Astrolabe Engine
**Theme:** Celestial Brass & Starlight (`#120C1C` / `#D4AF37`), dark-only

---

## 0. Inception Gate — product-or-gtfo

- [x] **Business case for existence.** Commercial natal-astrology product: per-reading monetization over a self-hosted commerce stack, with paid unlock (heirloom license codes) — the 3D astrolabe + conversational companion is the differentiator that earns the price, not a hobby artifact.
- [x] **Alternative use of the same time/attention.** The alternative was extending the donor Tauri app (`forgejo/natally`); rejected because the 3D astrolabe engine, chat companion, and Firebase account substrate here are a stronger commercial base than the donor's local-only SQLite lane. Donor contributes the onboarding sequence only.
- [x] **Deployment vector.** `dogfood-then-product`. Dogfood now (owner is first user); promote to product when the triggers in §12 fire.
- [x] **Sunset criteria.** Kill if: (a) the WooCommerce license bridge has not shipped a paid reading by 2027-04-30; (b) monthly active conversations (owner included) fall to zero for 60 consecutive days; (c) the account-scoped architecture is superseded by another natally-family project that absorbs this codebase.

## 1. Project metadata

- **Stack:** Vite 8 + React 19 + TypeScript + Tailwind CSS 4; Three.js 3D astrolabe; Swiss Ephemeris (WASM, vendored); Firebase (Google Auth + Firestore); Express 5 (`server.ts`) proxying Gemini LLM + TTS.
- **Target platforms:** web/PWA (priority 1), desktop Tauri (priority 2, later), mobile wrap (priority 3).
- **Bundle ID family:** `mba.robin.natally` (web app id pending final packaging; `metadata.json` currently carries the Remix-capsule name "Remix AstroSphere 3D" — to be stamped at first product release).
- **Versioning:** MAJOR.MINOR.BUILD per `~/.claude/BUILD_CONVENTIONS.md`.
- **Repo location:** `/mnt/f/DevProjects-2026/forgejo/natally-ai-studio` (Forgejo `git.robin.mba` spine, SSH).
- **Predecessor donor projects:** `forgejo/natally` (GitHub `rebots-online/natally`) — **spec donor + onboarding-sequence donor only**; the First Light typewriter onboarding is the only code ported. Everything else authored fresh here.

## 2. Threat model — solopreneur, not corporate

**Project-specific decisions:**

- **Credentials handled:** `GEMINI_API_KEY` (server env), Firebase web config (public by design, project locked to authorized domains + Firestore owner-only rules), Stitch MCP API key (user-scope Claude config, never committed).
- **Anti-loss hardenings applied:** `.bak` backup-before-modify for every doc/code change; git commit per checklist item; Postgres task-ledger entries per house SOP; `dist/` artifacts tracked (BUILD rule) so no rebuild-orphaned releases.
- **Attacker-model hardenings opted into:** none default. One deliberate addition when billing ships: Ed25519 signature verification on license codes (cryptographic, not ceremony) — reason: entitlement forgery is a direct revenue loss with a cheap mitigation.
- **Out-of-scope-by-design:** no payment-card storage → no PCI scope (all purchases flow through the self-hosted WooCommerce bridge). Birth data (date/time/place) is sensitive-adjacent PII stored in the user's own Firebase account under owner-only Firestore rules; no third-party analytics or ad SDKs, so no surveillance-surface regulations.

## 3. Architectural posture — refuse manufactured asymmetry

**Project-specific decisions:**

- **Components / vendors + swap seams:**
  - Firebase Auth/Identity — seam: all calls behind `src/services/firebase.ts`; swapping = one file + rules export.
  - Firestore (persistence) — seam: repository functions in `services/`; documents follow a published data model (`DOCS/ARCHITECTURE-MERGED-10oct2026-15h00.md`), exportable as JSON.
  - Gemini LLM/TTS — seam: only `server.ts` `/api/*` routes touch it; any OpenAI-compatible endpoint substitutes.
  - Commerce: self-hosted WooCommerce + org-wide custom plugin as license issuer — seam: the license-bridge URL is the only integration point; verification is offline (baked pubkey), so the bridge being down never revokes a sold key.
- **Anti-bundle-lock check:** distribution: self (web/PWA + later Tauri) — owner. payment: WooCommerce (self-hosted) — owner. identity/auth: Google Firebase — Google. entitlement: natally's own Ed25519 license system — owner. hosting: owner's infrastructure. **No party owns more than one.**
- **Earned asymmetry:** per-user substrate — the user's chart, conversation history, and lore embeddings accumulate value in their own account; the 3D astrolabe craft is the owner's domain-expertise asymmetry.

## 4. Identity / per-user artifact strategy

- **Strategy:** `substrate-accretion`. The binary is uniform; per-user value accrues in Firestore (`users/{uid}`): natal chart(s), conversation history, lore/semantic memory (vector embeddings), license entitlement.
- **Substrates creating the binding:** natal input + computed charts (`users/{uid}/charts`), conversation stream (`users/{uid}/conversations`), lore embeddings (`users/{uid}/lore`), license tier.
- No woven download-time identity (nothing user-identity-bearing ships in the artifact itself).

## 5. Entitlement / payment architecture

- **Will this project gate features behind entitlement?** `not-now-but-seam-must-support-it` → per-reading billing is the committed next milestone after the three migration tasks land.
- **Backends in scope:** self-hosted WooCommerce license bridge (issuer: the planned organization-ecosystem-wide WooCommerce plugin). **No RevenueCat, no third-party purchase SDKs** — the entitlement core is natally's own: Ed25519-signed license codes/tokens (`{tier, exp}`, `exp: null` = lifetime) verified client-side against a build-baked public key; Firestore holds a per-user *mirror* only (tampering fails verification). Trial metering (count/time/rate modes) at the reading-call boundary.
- **Trait/seam location:** `EntitlementService` seam specified in `DOCS/ARCHITECTURE-MERGED-10oct2026-15h00.md` § License & Entitlement; code location fixed by that document's entity table (`src/services/entitlement.ts`).
- **Per-channel default backend:** all channels → WooCommerce license bridge (offline verification fallback when unreachable: last-verified entitlement + trial gate).

## 6. Build / CI / release

- [ ] CI on self-hosted Forgejo runner — **not yet configured**; builds are manual per BUILD SOP (deliberate until first public release). Workflow file location when enabled: `.forgejo/workflows/build.yml`, `runs-on: [linux-amd64]`.
- [x] Build gate commands (documented here, mirrored to project `CLAUDE.md` when created): `npm ci && npm run lint && npm run build`.
- [x] Reproducible: `bun.lock`/`package.json` committed; vendored Swiss Ephemeris WASM pinned in-repo.
- [x] Per-task gate exits 0 before any checklist item is marked complete.
- Release artifacts in tracked `dist/` per BUILD rule; slug-first filenames; `v{VERSION}: ` commit prefix; one version per handback.

**Build commands:** `npm run dev` (tsx server.ts, Express on high port), `npm run build` (vite build → `dist/`), `npm run lint` (tsc --noEmit), `npm start` (node server.ts).

## 7. Distribution

- **Channels in scope at v1:** web/PWA (self-hosted).
- **Channels in scope at v2+:** Tauri desktop (direct download), Android (sideload APK; store only if a store channel ever passes NPV).
- **Per-channel differences (v2):** desktop/sideload = same WooCommerce license bridge; store builds (if ever) revert to most-baked-in tier per store policy.
- Update channel: web = deploy; desktop = per-release signed artifacts in tracked `dist/`.

## 8. File / artifact discipline

- [x] `.tmp/` at repo root, gitignored, sole scratch location (global I-8).
- [x] `.gitignore` covers `.env`/`.env.local` (committed `*.example` only), `node_modules/`, build output, `dist/` **un-ignored** per BUILD rule (tracked release artifacts).
- [x] State-changing operations log via git commits per checklist item + Postgres task-ledger (house SOP).
- [x] No credential patterns committed (`.env` ignored; pre-commit check when CI lands).
- Design artifacts frozen under `LIBS/UI/STITCH/` (screen complement) — the architect phase reads these, not mental pictures.

## 9. Documentation / decision discipline

- [x] Global `CLAUDE.md` discipline spine active; project-level `CLAUDE.md` to be written from visible facts at implementation kickoff.
- [x] `codegraph` index (`.codegraph/`) maintained; agents query, never rebuild as a side effect.
- [x] `DOCS/ARCHITECTURE.md` (baseline) + `DOCS/ARCHITECTURE-MERGED-10oct2026-15h00.md` (end-state, entity-tabled).
- [x] `CHECKLIST.md` as coder contract; migration plan `DOCS/MIGRATION-PLAN-10oct2026-15h00.md` feeds it.
- [x] Phase separation MAP → ARCHITECT → PLAN → CODE; this re-baseline sits in ARCHITECT.
- Decision logs: DL-N entries in the ARCHITECTURE files record *why*.

## 10. Session continuity / orchestration

- [x] Project memory + `context-mcp` session summaries supported (cwd-keyed memory active).
- [x] Role separation: architect authored these documents; coders execute CHECKLIST items only; escalation over self-rescue (I-6).
- [x] State markers `[ ] → [/] → [X] → ✅` are the coordination protocol.
- [x] Dispatch logs under `<repo>/.tmp/dispatch-<task-id>.log`.

## 11. Communication style

Terse, direct, trade-offs named; recommendations state the rejected alternative. No marketing prose in docs (this PRD's product sections describe, they don't sell). No emoji unless requested. Code comments only for non-obvious WHY.

## 12. Deployment vector decision

- [x] **Dogfood-then-product.** Justified: owner is the first daily user today (positive utility now); commercial intent is real but unproven. **Promotion triggers:** (1) WooCommerce license-bridge plugin issues its first real key, (2) first paid reading redeemed, (3) 30-day retention on ≥10 external users. All three → full product posture (§5 activates per-reading gating). If triggers unmet by 2027-04-30 → §0 sunset applies.

## 13. Reboot / sunset policy

Reboot (clean rewrite, stack migration, consolidation, fork-with-legacy-drop, audience-changing repackage) re-applies §0. The current Firebase + login-first migration is a **continuation** (architecture revision within premise), not a reboot. Sunset criteria live in §0 and §12; sunk-cost is not a counterargument.

## 14. Reference conversations & documents

- **Inception conversation:** `/home/robin/.claude/plans/can-you-take-a-foamy-oasis.md` (this re-baseline) + original product PRD backup `DOCS/PRD.md.bak.20261010-pre-minimum`.
- **Global rules spine:** `~/.claude/CLAUDE.md` (+ `/mnt/f/.claude/CLAUDE.md`).
- **Routed conventions:** `BUILD_CONVENTIONS.md` (manual builds until public release), Admin-Manual `PRD_TEMPLATE.md`, `DOCS/TOOLING_CONVENTIONS/task-ledger-postgres.md`.
- **Related projects:** `forgejo/natally` (donor: onboarding sequence + spec reference), `forgejo/Kintsugi-Unbroken` (sibling product; ruled out as onboarding source).

## 15. Open questions / explicit gaps

- **WooCommerce bridge plugin design** — the org-wide plugin does not exist yet; blocks only the *issuance* side of entitlement (verification is fully specified). Close before the billing milestone.
- **Embedding model + dimension** for lore/conversation vectors — constrained to ≤2048 dims by Firestore; model choice (Gemini embedding via `server.ts`) fixed at implementation of the lore milestone.
- **Desktop (Tauri) packaging timing** — after web v1 product signal; affects bundle-id stamping.
- **Trial policy parameters** (mode + counts/days) — set at billing milestone; the seam supports all three modes.
- **Birth-time repair flow** (PRD product inventory Screen "Birth-Time Repair") — scope decision at post-migration roadmap planning.

---

# Product Baseline (carried forward from v1.0.0 PRD, unchanged)

## P1. Executive Summary & Vision

**natally** is an intimate, high-fidelity natal astrology companion and interactive celestial engine. Departing from generic horoscope apps and flat two-dimensional charts, natally marries modern psychological astrology with a tactile, antique-inspired 3D astrolabe interface.

Core product thesis:
1. **Continuous Presence**: Natally is not a hidden chatbot or a distant menu; she is an ever-present, conversational companion who inhabits the user's chart space with time-of-day mirroring and subtle presence.
2. **Astrological Precision**: Exact Placidus house semi-arcs, geocentric ecliptic coordinates, and geometric aspect mechanics calculated with mathematical rigor (Swiss Ephemeris).
3. **Tactile 3D Astrolabe**: A slowly rotating 3D astrolabe wheel in Three.js/WebGL featuring a velvet-plum torus with markings superimposed on its surface, unoccluded celestial bodies, harmonic aspect chords, and interactive 3D raycasting tooltips.
4. **Art Direction & Tone**: Dark-only (`#120C1C`), warm celestial brass (`#D4AF37`), starlight typography (Cinzel, Nunito Sans, IBM Plex Mono, Fraunces), zero cheap AI mascot illustrations.

## P2. Core User Personas

| Persona | Archetype | Needs & Pain Points |
| :--- | :--- | :--- |
| **The Inquiring Seeker** | Modern Astrology Enthusiast | Emotional resonance, real daily transits, a supportive non-dogmatic sounding board. Frustrated by superficial sun-sign horoscopes. |
| **The Traditionalist / Student** | Ephemeris & Chart Practitioner | Astronomical accuracy, exact degrees/minutes, Placidus verification, aspect orb transparency, clear cardo angles (ASC, MC, DSC, IC). |
| **The Design Connoisseur** | Aesthetics-Driven User | Museum-grade UI craft, calm kinetic pacing, tactile depth, distraction-free nocturnal palette. |

## P3. Screen Inventory (end-state; Stitch artifacts under `LIBS/UI/STITCH/`)

0. **Login** (mandatory Google sign-in gate — precedes everything).
1. **First Light Onboarding** — typewriter-question natal intake: name → birth date → birth place → birth time (+ unknown-time path), run-once-successfully per account.
2. **Birth-Time Repair** — calibration for approximate/unknown birth times (rectification + rising-sign boundaries).
3. **Conversation (Main)** — Natally's stream docked with the rotating 3D natal wheel, transit badges, natural-language composer; dawn/evening mirroring variants; trial-state variant.
4. **Atlas (Natal / Synastry / Today)** — deep-dive planetary positions, dual-chart synastry overlay, daily transit telemetry.
5. **People** — relational directory of profiles, charts, synastry links.
6. **Glossary Callout** — contextual astrological-mechanics popovers.
7. **Settings** — house system, notification cadence, timezone anchoring, privacy.
8. **About** — lineage, methodology, manifesto.
9. **Profile / Paywall** — account chip; "Unlock natally" patron tier + "Enter an heirloom code" (license redeem).

## P4. Engineering Specifications (summary)

- **Design tokens**: surface deep velvet plum `#161021/#120C1C`; primary celestial brass `#D4AF37/#F2CA50`; secondary rose-coral tension `#FF5252/#E28B9F`; tertiary starlight blue `#38BDF8/#93C5FD/#818CF8`; fonts Cinzel (headline), Nunito Sans (body), IBM Plex Mono (ephemeris data), Fraunces (onboarding display).
- **3D engine**: geocentric ecliptic longitude → canvas radians anchored ASC at 9 o'clock; torus R=1.95/r=0.22 with surface-superimposed markings; interior rings (zodiac 1.75, houses 1.48, aspects 1.05–1.15); open reticle R=0.16; T-square tension chords coral, trines/sextiles blue; raycasting tooltips with contemplative drift (`0.0001–0.0003` rad/frame) and hover micro-pause.
- **Design laws**: no mascot illustrations; contemplative drift only; true Placidus (never equal houses unless unknown-time → Whole Sign, honestly labeled); dark-only; verbatim astronomical values across HUD, matrices, tooltips.

## P5. Success Metrics

- Telemetry readability: 100% legibility of degrees/houses across viewports.
- Engagement: daily active conversation rate via transits + time-of-day mirroring.
- Conversion: trial → patron via single gold CTA + heirloom code redeem.
- Multi-device coherence: onboarding once per account, never per device.

# Natally: Alby-first launch roadmap

Status: planning and evidence inventory, 2026-10-12. Not a released architecture,
coder checklist, purchase authorization, hosting migration or listing submission.
Source baseline: f6326b9 in rebots-online/natally-ai-studio. CodeGraph inspected;
Markdown coverage gap allows direct contract reads. No runtime changes this turn.

## Product and evidence boundaries

Robin 2026-10-12 16:15–16:19: account creation is free, for continuity AND optional
purchases. Prepaid conversation-turn packs are a billing work item; signup must
not itself charge or subscribe. Required storage/credit distinction:
- Device-only: profile/lore on this browser/device, persistent across its sessions
  but no Firebase lore sync or cross-device continuity; credits usable only on
  that device. Explain storage-clearing/device-loss risk before purchase.
- Account sync: device storage plus Firebase propagation to signed-in devices;
  credits attached to the account, available across those devices.
Neither is a client-authoritative credit ledger. Paid balances must be enforced
server-side, bound to device purchase capability or account as appropriate.
Migration/recovery rules require explicit contract; never auto-upload private
lore after login or silently convert device credits to account credits.
The complete lore-sync/device-only access/credit implementation is pending;
login-first/profile repair must not be described as completing these features.

Robin clarified that "studio" means Gemini AI Studio, not a Natally edition.
Use Natally for the product; retain repository names only to identify checkouts.
Kintsugi-alby contains earlier bounded-reading plans, not a separately authorized
product split. Its uncommitted contracts were read but not modified or imported.
No automatic merge/rewrite follows from this roadmap.

Colours identify divisions, NOT work phases (Robin's 15:50 correction):
🔴 onboarding/mobile UI; 🟦 readings/inference/security; 🟪 voice;
🟩 accounts/sync; 🟨 billing/Alby; 🟫 launch/infrastructure;
⬜ deferred character continuity. Status and urgency are stated in words.
The birth-date keyboard/picker repair is the immediate highest priority.

Verified source findings this turn:
- `server/inference/registry.ts:14`: venice-admin/openrouter-admin are reserved;
  only direct inference engines are registered. Selecting a reserved name falls
  back to another engine. This is not safe evidence of an enforced paid budget.
- `server/inference/metering.ts:11`: recordUsage is development logging, not a
  durable debit/reservation/reconciliation mechanism.
- `netlify/functions/chat.mjs:24`: the deployed-route source uses ZAI_API_KEY;
  the Express engine registry is a different execution path. Merely implementing
  an admin adapter there will not wire it into the public Surge app.
- `netlify/functions/chat.mjs:34,64`: systemInstruction arrives from the client
  and is used as a system message. Public commercial authority must move server-side.
  Tool continuation syntax validation is not proof that browser-supplied facts
  were actually calculated by the trusted service.
- `netlify/functions/chat.mjs:3,58`: per-user counters are process-local; not a
  durable cross-instance spend limit. CORS is not authentication or bot prevention.
- `src/services/x402Access.ts:36`: legacy guest flow/local expiry is not proof
  of a deployed, merchant-verified x402/Lightning fulfillment system.
- `src/services/onboarding.ts:113`: cloud profile functions exist; fallback and
  error handling do not demonstrate two-device/account-isolation acceptance.
- Mobile repair 6883b75 was deployed and byte-verified; 48 tests passed. Android
  physical verification remains unobserved. No new live provider or payment test
  was performed during this roadmap pass.

## Recommended commercial and security boundary

One payment authorizes one quoted reading: selected products, input snapshot,
observation date, price/asset/network, output, deadline and total compute budget.
Internal calculation/tool turns belong to that reading, not extra charges.
An optional paid follow-up is a new bounded operation, not unlimited permission
to reuse the payment. Scope and pricing need explicit contract release.

Alby-compatible Lightning/NWC is the recommended first customer rail. Per-turn
pricing does not require x402. A genuine x402 adapter must advertise and verify
its supported scheme/asset/network/facilitator; WebLN payment alone is not x402.
No additional payment vendor is authorized here.

Paywalls increase attack cost; they do not establish trustworthy instructions.
Fresh bounded context, minimal data, narrow tools, limited spend and no permanent
agent-written lore reduce opportunity and blast radius. A single paid malicious
request can still inject instructions. Successful payment never grants admin power.

## Ordered work packages

### 1. 🟨 Offer, access and authority — decision required
- Freeze the sellable unit: single reading first by recommendation; define natal,
  horoscope, synastry and tarot availability rather than advertise unverified types.
- Define full-reading length, valid follow-up scope, explicit price and all fees,
  quote expiry, provider-cost ceiling, failure/retry/refund and delivery retention.
- Preserve the authorized login-first work. A guest paid-order capability is a
  separate design decision; Alby payment does not itself require a Natally account.
- Resolve contradictions: repo PRD specifies WooCommerce/Ed25519 and no RevenueCat;
  current checklist/global billing specifies RevenueCat. Earlier Alby plans exclude
  accounts, while Robin subsequently requested accounts/sync. Freeze one coherent
  authority and guest/account journey before coder release, not two competing gates.
- Do not silently discard the earlier five-reading/three-rail completion proposal:
  distinguish first marketplace release from eventual scope and obtain scope release.

### 2. 🟩 User accounts and data — partial
- Finish login-before-onboarding; signup, password recovery, Google login, session
  expiry and returning-profile loading. Previously observed API auth is not every
  browser journey. Verify offsite access without owner credentials.
- Implement and test per-user profile/reading sync, cloud authorization rules,
  local-data migration, sign-out clearing/switching, conflict policy, export/deletion.
- Keep wallet connection, application identity, payment receipt and purchased
  access distinct. Never put provider/admin keys in browser-readable user records.

### 3. 🟨 Customer billing — not production-complete
- Merchant receiving connection with least required invoice/lookup permissions;
  no arbitrary send permissions in the reading runtime. Confirm receiving capacity.
- NWC/Bitcoin Connect or WebLN UX plus invoice QR/deep-link fallback for mobile;
  clear wallet permissions/revocation, no hidden recurring spend authorization.
- Server quotes and creates invoice/order; verifies settlement, amount, recipient,
  network and exact purchase. Never trust browser success or localStorage access.
- Durable state machine: quoted, awaiting payment, paid, generating, delivered,
  expired, failed/refund due, refunded. Atomic claims and idempotency prevent
  replay, double-clicks and worker retries from creating duplicate charges/readings.
- Resume paid delivery after reload/network loss without repaying. Reconcile
  invoices whose notification was missed, late payment and failed generation.
- Implement x402 as a separately verified adapter when released; bind authorization
  to request/body/order and define settlement-failure handling for its chosen scheme.

### 4. 🟨 Venice/OpenRouter administration and funding — reserved, not wired
- Venice: ADMIN credential manages restricted INFERENCE keys; creation, lookup,
  limits, usage/balance, expiry, rotation and revocation. Validate limit-period
  semantics and all enabled spend units, not just USD.
- OpenRouter: Management credential manages inference keys, caps, usage and
  lifecycle. Management credentials do not belong in completion requests.
- Keep management credentials isolated from inference and all client/model context.
  Provisioning APIs allocate access; they do not automatically fund supplier credit.
- One shared purchase budget covers pre-model guard, main model, retries and all
  providers. Switching provider must not create a second full allowance.
- Reserve worst-case cost before dispatch, reconcile reported usage afterward,
  preserve reservations on uncertain outcomes, cap concurrency and total exposure.
- Do not blindly create a permanent key per purchase: Venice currently documents
  500 active keys/user and 20 creations/minute. Choose bounded key lifecycle or
  service keys plus authoritative purchase accounting; test exhaustion explicitly.
- Confirm exact production models, tool-call support, commercial terms, capacity,
  funded balances, pricing/margin and low-balance alerts. Owner coding-plan quotas
  are not proof of a public-serving budget. The old 40% allowance is a proposal,
  not measured net margin or a newly approved price.
- Wire these into the actual public request path, not only the Express registry.
  No silent unlimited fallback when an admin adapter/key/balance is unavailable.
  Build both requested adapters; qualify one complete production path first.

### 5. 🟦 Injection moulting — new launch security workstream
- Cheap byte/type/schema checks, authenticated purchase/capability verification
  and distributed rate limits before any paid guard-model call. Bound attachment
  extraction, nesting, total context and processing time; unsupported media fails
  explicitly rather than claiming it was inspected.
- Pre-model classifier with structured verdict/reasons and bounded cost/latency;
  choose model/provider through approved configuration. Inputs cannot replace its
  instructions. Test false positives on astrology, slang and quoted hostile text.
- Server owns system prompt/tool definitions and trusted context assembly. Treat
  user text, imported readings, URLs and tool responses as data, never authority.
- Only allow listed calculation tools with validated arguments and session-owned
  charts; bind continuation IDs/results to server state or independently recalculate.
  No shell, unrestricted URL retrieval, wallet send, key provisioning or admin API
  tools available to Natally or the screening model.
- Rendering/export sanitization; no hidden markup/image URL exfiltration; no prompt
  content in analytics. No automatic persistent memory writes from paid turns.
- Per-order/user/global request, token, cost, concurrency and tool-loop limits.
  Guard failure rejects/defer with explicit recovery/refund policy, not silent bypass.
- Adversarial release protocol: paying attacker, forged system prompt/results,
  cross-account chart IDs, encoded/multilingual/indirect injection, invoice replay,
  parallel requests, retry abuse and supplier exhaustion. Screening is one layer,
  not a promise of perfect injection resistance. Do not reject benign agents merely
  for being automated; enforce the same capabilities and limits for every caller.

### 6. 🟦 Reading, prompt and output quality — partial
- Natal-first initial reading, then timestamped current transits; timezone/location
  supplied explicitly. On-demand dates and friend/foe synastry use calculation tools.
- Unknown birth time/DST/polar edge cases cannot invent accurate houses or angles;
  verify independent numerical fixtures and actual model/tool conversations.
- Character: warm, approachable, cartoony new psychic graduate; understated Gen-Z
  ennui and harmless oversharing. No hostility for repeat questions, compulsory
  catchphrases, fabricated life events or precise predictions presented as fact.
- Version prompts and run an evaluation set: cold first reading, date changes,
  synastry, follow-up references, missing data, distress and adversarial instructions.
- Define complete paid output and enforce it: no canned fallback, no truncation
  disguised as fulfillment, no claim of calculations that did not run.
- Persist the delivered result; PDF/export must reproduce it, not regenerate a
  different reading. Long reading pagination, Unicode, charts, offline reopen and
  export/storage failure all need acceptance evidence. Retention policy explicit.

### 7. 🔴 Mobile / 🟪 voice — implemented pieces, runtime gaps
- Physical Android pinch, keyboard-visible composer/header, panel readability,
  selection/scroll, safe areas, landscape and actual karaoke follow; desktop reset.
- Low-resource browser cold/cached Supertonic, byte progress, synthesis lookahead,
  full-reading pauses, cancellation, memory and storage-eviction recovery.
- Preserve F4/pitch/rate .env configuration and prior no-audition direction; do not
  turn subjective tuning into a launch gate. Reading text/payment must work if
  voice download fails, is declined by Save-Data or audio needs a user gesture.
- Keyboard navigation, labels/focus, contrast, reduced motion and readable static
  result; chart motion/WebGL cannot prevent delivery or access to purchased text.

### 8. 🟫 SEO, trust and marketplace package — not audited complete
- Public indexable landing, offer/pricing, how-it-works, sample reading and FAQ;
  server-delivered/prerendered content rather than only a canvas or login wall.
- Confirm canonical domain; title/description, social previews, favicon, sitemap,
  canonical links, crawl configuration and appropriate truthful structured data.
  Exclude private chats, birth data, order tokens and receipts from indexing/logs.
- Seller/contact/support, privacy/retention/provider disclosure, purchase/refund
  terms, astrology-as-interpretation positioning and account deletion/export.
- Verify Swiss Ephemeris/data/model/font/mascot/library commercial licensing before
  public paid release. Documentation review does not itself establish a licence.
- Alby package: Natally name/icon, short description/category, live HTTPS URL,
  wallet connection guide, permissions, screenshots, support and pricing links.
- Alby Hub App Store and public discovery directory are listing surfaces, not an
  automatic payment processor or fulfillment service. Confirm current maintainer
  submission route/requirements; existing Hub listing PR #2098 provides a precedent,
  not guaranteed acceptance. No submission or acceptance observed this turn.

### 9. 🟫 Hosting and operations — current service exists, launch hardening pending
- Do not add a provider or change hosting ad hoc. Oracle remains the intended
  backend destination but migration was explicitly deferred; resolve hosting
  approval before launch rather than imply Netlify became the approved target.
- Server-only secrets, rotation, restricted production origin, resource limits,
  durable payment/job state, backups and tested restore; health/error/spend alerts.
- Track payment-to-delivery failures without storing sensitive prompt content;
  operational recovery/refund queue and circuit breaker when provider funds run low.
- Separate preview/production credentials, reproducible deployment, rollback and
  versioned release. Commit/push/verify remote before every completed handback.

### 10. 🟨 Launch acceptance and actual listing — not done
- External tester: discover offer, onboard/sign in or approved guest path, connect
  wallet, see exact quote, pay, receive authentic complete reading, save/export,
  reopen without repaying; verify purchased access on supported devices.
- Test unpaid/expired/wrong-value/replayed payments, duplicate notification, two
  simultaneous requests, provider timeout, guard rejection, disconnect and recovery.
- Observe merchant receipt, order transition, supplier cost and delivered result
  together. Mocks, builds and invoice creation alone cannot pass this gate.
- Complete mobile/accessibility/security protocols; publish approved listing
  submission and verify it is actually visible after acceptance. No guarantees
  about external review timing. Monitor first real purchases and support outcomes.

## Execution order and preserved backlog

Close offer/authority decisions; finish login/sync and device reliability already
authorized. Then deliver one vertical paid flow: quote -> verified payment ->
cost reservation -> injection guard -> calculated reading -> immutable delivery
-> usage reconciliation -> recovery/export. Evaluate prompts/security alongside
that flow. Finish SEO/trust/operations and listing package, run external purchase
acceptance, submit and verify visibility. Documentation work can run in parallel.

Deferred and not lost: SOUL.md/two-lore, additional subjective F4 tuning, Oracle
migration until explicitly released. Additional processors, subscription/top-up
ecosystem, native packages and elaborate marketing are not recommended first-listing
prerequisites. This recommendation is not silent deletion of previous requirements.

## Primary references checked 2026-10-12

- [Alby Hub App Store](https://guides.getalby.com/user-guide/alby-hub/app-store)
- [Alby discovery](https://getalby.com/discover) redirects to bitcoinapps.info.
- [Hub listing precedent](https://github.com/getAlby/hub/pull/2098): GitHub API
  returned merged=true; SuggestedAppData.tsx exists at its current contents endpoint.
- [Alby payment protocol distinctions](https://getalby.com/blog/402-charted-tracking-the-rise-of-l402-x402-and-mpp)
- [x402 handshake](https://docs.cdp.coinbase.com/x402/how-it-works)
- [Venice key creation](https://docs.venice.ai/api-reference/endpoint/api_keys/create)
- [OpenRouter management keys](https://openrouter.ai/docs/guides/overview/auth/management-api-keys)
- [OWASP prompt-injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)

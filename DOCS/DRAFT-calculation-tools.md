# On-demand astrology tools — released by Robin 03:03

The hosted model requests calculations as needed; the browser executes the existing
Swiss Ephemeris engine and returns tool results to the authenticated hosted model.
No assertion of available tools without an actual executable tool loop. No code
evaluation, arbitrary network URLs, implicit birth data or model-computed planets.

Live-provider amendment: provider returns batched tool_calls even with parallel
disabled. Supersedes single-call-only clauses below: at most six calculations
total per question, batches executed sequentially with one assistant request and
one result per matching ID; maximum seven model requests. Shared toolCallCount
counts completed tool results; validators enforce total bounds and unique IDs.
Observed failure had two valid calls, no truncation and no exhausted limit.

| Entity | Exact target | Contract |
| --- | --- | --- |
| ASTROLOGY_TOOLS | netlify/lib/astrology-tools.mjs:1 | Fixed OpenAI-compatible calculate_astrology function schema: operation lookup_place/natal/transits/synastry, optional query/name/date/time/placeId/chartId/otherChartId/at; additionalProperties false. Shared module outside deployable function directory. |
| validToolMessages | netlify/lib/astrology-tools.mjs:1 | Validate alternating assistant tool call and matching tool result, unique bounded IDs, known tool, bounded arguments/content; maximum six pairs. |
| handleChat | netlify/functions/chat.mjs:1 | Advertise fixed tools only for enableCalculations true; validate continuation messages, append after original user prompt; return validated tool call or ordinary hosted text. Preserve Firebase validation, limits and server-only credentials. |
| completeHosted | src/services/hostedInference.ts:1 | Optional tool executor callback; up to six single-call rounds, execute sequentially, return results with matching call IDs, stop on limit; return final text only, never display tool JSON as prose. |
| createCalculationSession | src/services/calculationTools.ts:1 | (primary:NatalChartResult, partner?:NatalChartResult|null) returns context():string, execute(name,args):Promise<string>. Memory-only maximum eight charts, primary and optional partner IDs. Gazetteer lookup resolves exact place IDs. Natal uses date/time validation and existing tzOffsetHours; missing time explicitly approximate noon with no reliable houses/angles/Moon. Transits accepts explicit ISO UTC or now; synastry uses stored chart IDs and cross-aspects. JSON parsing guarded, execution failures returned as structured error for model correction. |
| askNatally | src/services/natallyChat.ts:1 | No automatic sky injection. System prompt advertises genuine tools and current UTC, active chart IDs; calls executor through requestHostedInference. Optional session in options preserves generated charts between turns. |
| NatallyChatbot calculationSession | src/components/NatallyChatbot.tsx:1 | useMemo keyed by primary and optional partner chart, forwarded to askNatally. No new persistent personal-data store. |
| generateAstrologicalReading | src/services/readings.ts:1 | Retain calculated explicit-reading facts and enable same executor for requested extra calculations. |
| tests | tests/calculation-tools.test.ts:1 and tests/hosted-chat.test.mjs:1 | Real lookup/natal/transit/synastry chain, invalid args, missing IDs/time, exact matching results, bounds, proxy rejects forged message roles; mocked loop plus real authenticated hosted chain recorded separately. |

Verification: node --import tsx --test tests/*.test.* tests/natally-regression-suite.ts;
npm run lint; npm run build; git diff --check. Runtime publication is separate:
Netlify backend first (old client compatible), Surge frontend second, exact asset
verification and a synthetic authenticated tool chain. Browser/mobile unverified
unless directly observed. Session charts are lost on reload, not synced.

Runtime verification utility: `scripts/verify-calculation-api.mjs` creates one
disposable synthetic Firebase user, executes the real hosted tool chain using
the same completeHosted/session functions, saves sanitized success/failure evidence
to DOCS/verification/hosted-calculation-chain-<timestamp>.json and deletes the user
in finally. Never save token/password/key. Run with node --import tsx.

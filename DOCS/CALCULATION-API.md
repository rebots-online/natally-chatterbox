# Natally calculation API

Implemented contract, 2026-10-12. Production evidence is recorded separately in
HOSTED_CHAT.md; this reference does not itself certify deployment or browser UX.

## Architecture and authority

Natally's hosted model selects a calculation using standard function calling.
The browser executes the existing Swiss Ephemeris WASM engine, then sends the
result back through the authenticated hosted proxy. The model interprets returned
facts; it does not calculate planetary positions from language-model memory.
This is not a public unauthenticated astrology REST service.

Sources of truth:
- Tool schema: `netlify/lib/astrology-tools.mjs`, `ASTROLOGY_TOOLS`.
- Dispatcher and session: `src/services/calculationTools.ts`, `createCalculationSession`.
- Hosted transport loop: `src/services/hostedInference.ts`, `completeHosted`.
- Model instructions: `src/services/natallyChat.ts`, `NATALLY_SYSTEM_PROMPT`.
- Numerical engines: `src/services/ephemeris.ts` and `src/services/transits.ts`.

## Model-facing function: calculate_astrology

Arguments are one JSON object. Every supplied value is a string; unknown fields
are rejected. `operation` is required. A field may contain at most 200 characters.
Call only with known user details, existing chart IDs or returned place IDs.

| Operation | Required additional fields | Result |
| --- | --- | --- |
| `lookup_place` | `query` | Up to eight local gazetteer entries with `id`, `name`, `countryCode`, `lat`, `lon`, `tzid`; resolve ambiguity with user |
| `natal` | `name`, `date`, `time`, `placeId` | New `chartId`, calculated natal `facts` |
| `transits` | `chartId`, `at` | Calculated sky and aspects to that stored natal chart in `facts` |
| `synastry` | `chartId`, `otherChartId` | Both named natal charts and inter-chart aspects in `facts` |

`date`: YYYY-MM-DD, valid calendar date, years 1800–2399.
`time`: HH:mm, or `unknown` only when the user explicitly reports unknown time.
`placeId`: exact ID returned by lookup; coordinates/offsets cannot be invented.
`at`: `now`, or ISO UTC `YYYY-MM-DDTHH:mm:ss[.sss]Z`, years 1800–2399.
Local user dates must be resolved to UTC before a transit request; ask when ambiguous.

Success is JSON `{ "ok": true, "operation": "...", ... }`.
Failure is JSON `{ "ok": false, "error": "specific explanation" }`.
Failure does not create a chart or authorize fabricated prose. The model may
correct arguments, perform a prerequisite lookup, or ask for missing data.

## Example multi-step interaction

User: “Compare my chart with my friend Alex, born May 15, 1992 in Toronto.
They don't know their birth time. Then check our situation on April 10, 2027.”

1. `{"operation":"lookup_place","query":"Toronto"}`
2. After resolving the returned match, call `natal` with name `Alex`, date
   `1992-05-15`, time `unknown` and that exact returned `placeId`.
3. Use the returned chart ID, not a guessed ID:
   `{"operation":"synastry","chartId":"primary","otherChartId":"<returned chartId>"}`.
4. For a specified UTC observation instant:
   `{"operation":"transits","chartId":"primary","at":"2027-04-10T12:00:00Z"}`.
   Noon UTC in this example is an explicit example instant, not a default for
   ambiguous user dates. Ask or clearly establish the intended observation time.
5. Interpret the returned facts with unknown-birth-time limitations. Additional
   calls can examine the other chart at the same instant. Friend/foe specifies
   relationship context; it does not establish malicious intent or guarantee outcomes.

For “today's horoscope,” call
`{"operation":"transits","chartId":"primary","at":"now"}`.
For ordinary explanations of already-supplied natal placements, no extra call is needed.

## Numerical behavior and limitations

- Natal calculations reuse the application's Swiss Ephemeris implementation.
  Gazetteer IANA timezone and birth date determine the historical UTC offset.
- Unknown time uses approximate noon and Whole Sign internally, but supplied
  interpretation context suppresses unreliable houses/angles and Moon aspects.
- Transit positions use Swiss Ephemeris/Moshier, geocentric tropical coordinates;
  retrograde is derived from computed speed. Current location is not birthplace.
- Cross-aspects use circular separation: conjunction, sextile, square, trine,
  opposition, maximum 3-degree orb, ordered by orb. Synastry is natal-to-natal,
  not a dated transit. Unknown-time Moon aspects are excluded on either side.
- No current local houses, house overlays, transit peak search, continuous-event
  search or exact duration API is implemented. A point calculation cannot certify
  exact event windows. Interpretive claims must not masquerade as numerical facts.
- Gazetteer coverage is finite. No web geocoder is exposed by this tool. An
  unmatched place returns no matches; never substitute an unrelated city silently.
- The device clock supplies `now`; this is not a server-clock synchronization service.
- Ambiguous repeated local times around DST changes are not explicitly disambiguated
  by the current natal API. Do not promise fold-aware precision for those cases.

## Session lifecycle

`primary` is the user's active calculated chart. `partner` exists when a second
chart was explicitly supplied from the structured synastry flow. Newly calculated
charts receive returned session IDs and are listed in each request's inventory.
Up to eight charts are retained in memory. They survive follow-up messages within
the same mounted chat session, but not reload or replacement of the primary/partner
chart. This does not add a cloud chart archive or cross-device sync. Existing saved
chat history can still contain birth details the user typed and facts quoted in
the final response; ephemeral chart objects do not make that history ephemeral.
Calculated facts are sent to the hosted model and are
subject to the model provider's processing policies.

## Hosted HTTP continuation contract

POST `https://natally-hosted-chat.netlify.app/.netlify/functions/chat`
with `Authorization: Bearer <Firebase ID token>` and JSON content type.
Existing `prompt`, `systemInstruction`, `history` and optional `temperature` remain.
Set `enableCalculations: true` to enable the fixed server-owned tool schema.
Optional `toolMessages` starts empty and accumulates paired messages:

```json
[
  {"role":"assistant","content":null,"tool_calls":[
    {"id":"call_1","type":"function","function":{
      "name":"calculate_astrology",
      "arguments":"{\"operation\":\"transits\",\"chartId\":\"primary\",\"at\":\"now\"}"
    }}
  ]},
  {"role":"tool","tool_call_id":"call_1","content":"{\"ok\":true,\"facts\":\"...computed facts...\"}"}
]
```

Intermediate HTTP 200 response:
`{"source":"hosted","model":"...","toolCalls":[<one or more valid function calls>]}`.
Final HTTP 200 response:
`{"source":"hosted","model":"...","text":"...interpretation..."}`.
Never render intermediate tool calls as Natally's final answer.

The client preserves the original question/history, appends each result and calls
the proxy again. Six calculations maximum across the entire question; once used,
the next model request must answer without further calls. The provider may return
multiple calls despite parallel_tool_calls false: execute them sequentially and
append one assistant message followed by every matching tool result in order.
IDs are unique within a chain. No more than seven model requests per question.
Arguments are limited to 4,000 characters, each result to 24,000; total HTTP body
is limited to 131,072 bytes. Existing prompt (12,000), system (32,000) and history
limits still apply. Oversized chains fail explicitly rather than silently truncate.

Every continuation revalidates Firebase and counts toward existing rate limits
(12 requests per user/minute per function instance; platform IP limit also applies).
Each model round has a 45-second provider timeout and a 65-second client timeout.
Tool work is local and does not spend provider tokens, but each subsequent model
round does. No unbounded autonomous loop is permitted.

Errors: 400 malformed input/continuation, 401 invalid session, 403 disallowed
origin, 413 body too large, 429 rate limit, 502 invalid/provider failure, 503 missing
configuration/identity service issue, 504 provider timeout. Error bodies have
`error`, never invented reading text. Provider credentials stay server-only.

Browser-computed tool results are conversational data, not signed server-side
attestations or authorization inputs. They must never grant billing entitlements.

## Verification and remaining gates

Run `node --import tsx --test tests/*.test.* tests/natally-regression-suite.ts`,
`npm run lint`, `npm run build`, `git diff --check`.
Tests cover actual Swiss calculations, input failures, matching call IDs and
the hosted continuation protocol. Real provider tool selection/consumption and
production publication require separate evidence in HOSTED_CHAT.md. Phone/browser
UX and constrained-device voice performance remain independent gates.

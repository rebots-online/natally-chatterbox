# Natal first, today's sky second — 2026-10-12

Released by Robin: request present location during onboarding, capture current
date/time and deliver an initial reading explaining the natal chart before
examining today's calculated transits. Reuse the existing FirstLight question
layout and city datalist; no new visual system. No character-lore expansion.

## Entity contract

| Entity | Target | Contract |
| --- | --- | --- |
| CurrentLocation | src/services/transits.ts:1 | name:string, latitude:number, longitude:number, timeZone:string; coarse device coordinates or chosen city |
| calculateTransitAspects | src/services/transits.ts:1 | (natal: {name:string,lon:number}[], current: same) => sorted {transit,natal,type,orb}[]; major aspects 0/60/90/120/180, maximum 3-degree orb, circular separation |
| buildCurrentSkyContext | src/services/transits.ts:1 | async (chart:NatalChartResult, now?:Date) => string; Swiss Ephemeris geocentric tropical positions at actual UTC, retrograde from speed, transit-to-natal aspects. Unknown birth time omits Moon aspects and all precise natal houses/angles. No invented time windows. Location is independently labelled and not confused with birthplace. |
| requestCurrentLocation | src/services/transits.ts:1 | () => Promise<CurrentLocation>; one browser geolocation request, 10s timeout, no high accuracy, coordinates rounded to 0.01 degrees; no background tracking |
| NatalChartInput | src/services/ephemeris.ts:80 | add currentTimezoneId?:string and birthTimeUnknown?:boolean, use existing current location fields; fix midnight parsing to preserve zero hour |
| IntakeDraft / intakeToChartInput | src/services/onboarding.ts:12 | optional currentLocation:CurrentLocation; persist current coordinates/zone separately from birth data; preserve unknown-time flag |
| FirstLight | src/components/onboarding/FirstLight.tsx:16 | append currentPlace question. City datalist, Use device location action, Skip action; denied/timeout errors permit manual selection; disclose location storage/model use and show device date/time. No geolocation until button click. |
| runCalculation | src/App.tsx:172 | replace canned initial commentary with initial_reading request asking for natal explanation then today's transits |
| NatallyChatbot external effect | src/components/NatallyChatbot.tsx:368 | initial_reading waits for sign-in, then sends one hosted request; consume each injected object once, no auto-loop on failure |
| askNatally / buildStructuredNatalContext | src/services/natallyChat.ts:87 | append calculated current sky for hosted requests; label unknown birth-time constraints instead of presenting noon angles as known |
| generateAstrologicalReading | src/services/readings.ts:23 | add calculated current sky to full_natal/horoscope requests. Explicit manual date/time must resolve to a real instant using supplied offset; reject incomplete/invalid dates rather than label today's sky with another date. |
| ReadingRequest | src/services/readings.ts:3 | transitTimezoneOffset?:number; ReadingsModal supplies chosen city's offset; automatic current readings use actual Date |
| transit tests | tests/transits.test.ts:1 | wrap-around aspects, orb cutoff, no invented aspects, current timestamp and known computed positions, midnight preservation, permission denial/success |

## Verification

Tests, TypeScript, build and diff check. Exercise real Swiss WASM calculation at a
fixed instant separately from model prose; inspect hosted response against supplied
facts. Deployment byte-match separately. Browser permission/mobile flow remains
unverified when browser tools are unavailable. Skip location never fabricates a
city: planetary longitudes are geocentric; no current local-house claims are made.
Device time is the stated clock source, not a server-synchronized clock guarantee.

03:00 repair: `NATALLY_SYSTEM_PROMPT` at src/services/natallyChat.ts:47 must
prefer newly calculated observation facts over stale conversation claims of
unavailable ephemeris, and answer without chastising the user for repeats.
`ReadingsModal` date/time controls use explicitly labelled device timezone and
the offset at the selected date; city selection does not reinterpret those
controls using estimated standard offsets. `generateAstrologicalReading` uses
device-zone display for these manual observations, matching the controls.

## Synastry context amendment — Robin, 03:01

| Entity | Target | Contract |
| --- | --- | --- |
| buildSynastryContext | src/services/natallyChat.ts:119 | (chart:NatalChartResult, partnerChart?:NatalChartResult|null)=>string. Two explicitly named natal blueprints plus cross-chart major aspects using calculateTransitAspects circular arithmetic and 3-degree orb. Label these inter-chart, not transits; omit unknown-time Moon targets from either chart; never infer hostility from a chart. Missing second chart requests birth details via existing Readings/Synastry form. |
| askNatally options | src/services/natallyChat.ts:150 | add partnerChart?:NatalChartResult|null to existing options; append buildSynastryContext only when partner supplied, otherwise explicit missing-chart instruction |
| generateAstrologicalReading | src/services/readings.ts:25 | synastry requires partnerChart, sends full buildSynastryContext instead of Sun/Moon/Ascendant summary |
| App synastryChart | src/App.tsx:75 | NatalChartResult|null session state, reset when primary chart recalculated; pass into chatbot and retain callback result from ReadingsModal; no new persistent third-party data store |
| ReadingsModal onPartnerChart | src/components/ReadingsModal.tsx:28 | optional (chart:NatalChartResult)=>void called when explicit partner form calculates chart, retaining numerical context for subsequent chat. Require selected location rather than silently using user's birth coordinates. |
| NatallyChatbot partnerChart | src/components/NatallyChatbot.tsx:49 | optional NatalChartResult|null prop forwarded through askNatally options |
| synastry regression | tests/transits.test.ts:1 | real two-chart calculations, named cross-aspect context, unknown-time omissions and missing-chart instruction |

This bounded repair uses the existing structured birth-data form. Automatic
free-text birth-data extraction and calculation tool calls are not implemented.

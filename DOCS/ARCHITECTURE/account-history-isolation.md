# Account history isolation — 2026-10-13

Incident: switching from Robin to his mother exposes Robin's history. CodeGraph
verified shared chat and lore keys, no lore reset, and unguarded asynchronous
reading callbacks. Birth-profile isolation already exists and stays intact.

| Entity | Target | Contract |
| --- | --- | --- |
| accountStorageKey | src/services/accountStorage.ts:1 | (base:string, uid:string or null):string or null; require nonempty UID; append encoded UID; never use legacy key |
| loadAccountValue | src/services/accountStorage.ts:7 | generic base,uid,fallback; guarded JSON parse; no legacy fallback |
| saveAccountValue | src/services/accountStorage.ts:17 | generic base,uid,value; no signed-out write; storage failure tolerated |
| App | src/App.tsx:54 | auth change resets lore and speech, loads UID lore, persists only matching current UID; session generation guards reading callbacks; key account-owned children by UID |
| NatallyChatbot | src/components/NatallyChatbot.tsx:82 | required accountUid and isCurrentSession; UID-scoped messages; unmount invalidates late replies/media/recognition/audio; guard inference and callbacks |
| requestHostedInference / completeHosted | src/services/hostedInference.ts:19 | optional isCurrentSession predicate checked before token access, after awaits and before each tool round; fail closed with HostedAuthenticationError on obsolete session |
| askNatally | src/services/natallyChat.ts:172 | options.isCurrentSession forwarded to transport |
| ReadingRequest / generateAstrologicalReading | src/services/readings.ts:6 | isCurrentSession forwarded to transport |
| ReadingsModal | src/components/ReadingsModal.tsx:39 | accountUid and isCurrentSession; guard late calculation and reading callbacks |
| getPersistedVantageLocation / savePersistedVantageLocation | src/services/locations.ts:364 | require UID for persisted personal location; no legacy adoption |
| NatalInputForm | src/components/NatalInputForm.tsx:31 | accountUid passed to location persistence |

Flow: auth observer increments session generation, stops speech, clears transient
state, replaces lore with the authenticated UID's saved value. Each render's
callbacks retain UID plus generation, and validate both against live auth. A
keyed chatbot owns one account's history, draft, search and calculation session.
Transport never changes identity halfway through assembling or sending a reading.

Legacy unowned data remains byte-for-byte in the original keys, hidden from all
accounts until an explicit owner-confirmed recovery. No cloud history migration,
new providers or deferred character lore. Device-local isolation is distinct from
cross-device sync. Prioritize preventing disclosure, preserving data, then UX.
An empty account archive is safer than guessing ownership in every time horizon.

Verification: Node regressions for A/B isolation, signed-out fail-closed storage,
malformed storage, legacy preservation and invalidated multi-round inference.
`node tests/account-isolation-browser.mjs`: browser synthetic A/B identities exercise actual React chat remount, restored
history and delayed reply suppression without reading real private history.
Production assets and Git publication verified separately; physical-device and
real-account acceptance remain separately observed. Markdown/env/deployment-script
reads are known graph parser gaps. No new screen design is introduced.

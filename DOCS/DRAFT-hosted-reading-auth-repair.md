# Hosted reading authentication repair — released 2026-10-12

Evidence: production Firebase project gen-lang-client-0714568880 has Google
sign-in enabled but excludes natally.surge.sh from authorizedDomains. Existing
frontend deliberately bypasses mandatory login while hostedInference requires a
Firebase ID token. ReadingsModal has finally blocks but no error handling.

## Entity contract

| Entity | Target | Change |
| --- | --- | --- |
| authorizedDomains | Firebase project configuration | Append only natally.surge.sh; preserve existing domains; back up domain list only and read back. No provider enablement or auth bypass. |
| HostedAuthenticationError | src/services/hostedInference.ts:9 | Export Error subclass with name HostedAuthenticationError and code auth_required; thrown for missing token and HTTP 401. |
| NatallyChatbotProps | src/components/NatallyChatbot.tsx:49 | Add onSignIn: () => void and isSignedIn: boolean; auth failures show actionable sign-in, then existing retry after login; preserve failed prompt. |
| ReadingsModalProps | src/components/ReadingsModal.tsx:28 | Add onSignIn: () => void and isSignedIn: boolean; all generation handlers catch errors into visible readingError state; auth failures offer sign-in; never manufacture a reading. |
| App | src/App.tsx:805 | Pass onSignIn and isSignedIn into both reading surfaces. Keep entered chart and open reading surface. |
| AuthModal | src/components/AuthModal.tsx:102 | Raise overlay to z-[90] so actionable login appears above chat/reading surfaces. |
| auth tests | tests/natally-regression-suite.ts:27 | Assert typed missing/expired session errors and no model answer on auth failure. |

Technical acceptance: existing voice/backend/client tests, TypeScript build and
diff check pass. Runtime protocol: verify authorized domain retained, Google
sign-in can reach provider, authenticated production function returns actual
hosted reading for synthetic input. Google UI completion is a separate gate;
do not label an admin-issued verification session as a user OAuth test.

Reading-fact limitation discovered: readings.ts supplies natal facts but does not
calculate current transit positions. Auth repair restores hosted access, not
verified transit calculation; retain this as the next reading-quality task.

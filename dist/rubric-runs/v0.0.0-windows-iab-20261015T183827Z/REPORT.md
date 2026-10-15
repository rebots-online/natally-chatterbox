# Natally public test deployment — 15 October 2026

**Verdict: INCOMPLETE—pending-operator (DEP-5 and DEP-6).**

Public build: https://natally-test.surge.sh

Source: `e314a4bf9c5ad42d98daff6a7c22562147dffb0f`; Vite mode `test`;
Surge release `1792089428952`. The exact 22-file payload is archived in
`dist/natally-test-e314a4b-20261015T1837Z.zip` with an adjacent hash manifest.
No application source code was changed for this deployment. `.env.test` contains
the single public backend URL override. Existing production configuration and
deployment are retained. Test backend deploy: `6ad11d1918b73dbc427a9cd6`.

Driver: Codex through native Windows Chrome; anonymous production observation
through the Codex in-app browser. The subject was the published built app.
Rubric: `DOCS/TEST_RUBRIC.md`, committed before the deployment changes.

| ID | Verdict | Direct observation | Indexed evidence |
|---|---|---|---|
| DEP-1 | PASS | Public test page renders Natally's mascot, readable sign-in dialog, Google and email controls. | [00:00 — test page](01-DEP-1-2-public-login-flow.mp4#t=0), [still](01-DEP-1-test-login.png) |
| DEP-2 | PASS | Sign Up changes the action to Create Account; Email Log In restores Log In. Onboarding is absent while signed out. | [00:02 — Sign Up](01-DEP-1-2-public-login-flow.mp4#t=2), [00:04 — Email Log In](01-DEP-1-2-public-login-flow.mp4#t=4), [signup still](02-DEP-2-email-signup.png) |
| DEP-3 | PASS | Clicking Google opens the actual Google account chooser for this Firebase application, rather than an unauthorized-domain error. No account was selected. | [Google authorization header](03-DEP-3-google-authorization-header.png) |
| DEP-4 | PASS | The anonymous production page still renders its existing Google/email sign-in dialog. | [Production still](04-DEP-4-production-login.png) |
| DEP-5 | Pending operator | Complete Google account selection and observe an actual hosted reading on the test site. | No PASS or completed-authentication evidence claimed. |
| DEP-6 | Pending operator | Use an existing email account and observe its returning profile and actual hosted answer on the test site. | No PASS or completed-authentication evidence claimed. |

The recording preserves the login-mode sequence. Browser recording was interrupted
as Google opened its separate authorization document; the account chooser and
production page are indexed stills under TC11's alternate evidence form. The
chooser image is cropped above private account identities. Earlier in-app capture
attempts were incomplete and do not grant a verdict. No mocked identity, account,
model response, stored-token injection or unit-test suite was used in this run.

Service configuration receipt: `dist/natally-test-configuration-receipt.json`.
Production's published backend deploy remains `6acc88fa1511aaad9589ba97`.
The origin override is restricted to branch `natally-test`; production and other
contexts retain `https://natally.surge.sh`. Firebase's existing 22 authorized
domains were retained and the exact test domain was added. These receipts support
deployment provenance; UI verdicts above come from the named visible artifacts.

## Attestation

I, Codex, drove this rubric on 15 October 2026 against the published source/build
identified above. Each PASS records direct observation of the cited UI and media,
not an inference from test counts, logs, source matches or build success. I do not
attest completed Google/email login, a real hosted reply, physical Android
behavior, audio alignment or full product acceptance. Overall acceptance remains
INCOMPLETE—pending-operator until DEP-5 and DEP-6 are observed and recorded.

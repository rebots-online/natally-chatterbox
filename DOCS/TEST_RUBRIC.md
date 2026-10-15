# Chatterbox device-evaluation deployment rubric

Current target: `https://natally-chatterbox.surge.sh`, standalone repository
`rebots-online/natally-chatterbox`, cloned from the full Natally template to
`E:/devProjects/natally-chatterbox`. The only product changes are the local TTS
engine replacement and whole-turn/sentence/logical-unit splitting. Existing
marketplace and billing prototype assets are retained without integration changes.

| ID | Requirement | Driver | Steps / PASS criteria | Severity |
|---|---|---|---|---|
| CB-1 | New public site renders the existing Natally entry | AUTO | Open the deployed HTTPS site; observe the normal Google/email entry and Natally branding. | BLOCKER |
| CB-2 | Real local voice path works in the built site | AUTO | Open `/tests/voice-browser.html`, use the existing sample, press Speak, observe actual model/cache/session/run stages followed by playback and completion. No replacement audio or provider stubs. | BLOCKER |
| CB-3 | Stop cancels preparation and permits retry | AUTO | While real inference is running press Stop. Observe stopped state; retry and observe fresh measured work, then Stop again. No late playback may start. | HIGH |
| CB-4 | Complete turns or whole units are the only split boundaries | AUTO + OPERATOR | Read the exact source planning path; operator listens to a full turn and a longer reading on the actual device. No skipped words, phrase tails or units. Pauses are acceptable. | BLOCKER |
| CB-5 | Ordinary phone browser performs acceptably | OPERATOR | Robin evaluates initial load, cached replay, complete audio, interruptions, and responsiveness on the intended lower-resource phone. Desktop results do not certify this. | BLOCKER |
| CB-6 | Existing authentication and hosted flow remain usable | AUTO + OPERATOR | Observe the real Google chooser on the new hostname without entering credentials; Robin completes sign-in and obtains an actual hosted reading. | BLOCKER |

Record agent-driven UI checks under `dist/rubric-runs/`, with a report and indexed
recording. Robin explicitly owns device/listening evaluation. Until CB-4/5/6's
operator portions are observed, report INCOMPLETE—pending-operator, not SHIP-READY.
Compilation and file hashes support deployment reproducibility; they do not
substitute for listening or device acceptance. Do not run a unit suite as this
deployment's acceptance protocol.

The historical template deployment rubric follows for provenance.

# Historical public test deployment rubric

Scope: publish the existing built Natally web app at
`https://natally-test.surge.sh` while retaining the working production site.
This is a test-deployment acceptance run, not whole-product release certification.
Build/source and device are pinned in the run report before recording.

Follow Admin-Manual SC4 and TC11. Drive the published built app in a real browser,
without mocked identity, provider replies or application state. Record the whole
driven session. Store the MP4, indexed report and media ZIP under
`dist/rubric-runs/`. Every PASS requires direct observation and a named recording
timecode/seek link. A pending operator row prevents a complete acceptance verdict.
Do not run a unit-test suite or substitute build output, logs or asset hashes for
the recorded observations. Credentials are entered by the operator outside the
public recording; do not commit account secrets or private sessions.

| ID | Requirement | Driver | Steps / PASS criteria | Severity |
|---|---|---|---|---|
| DEP-1 | Public test URL serves Natally | AUTO | Open the HTTPS test URL. Observe Natally branding, mascot and the sign-in dialog, with readable controls. | BLOCKER |
| DEP-2 | Google and email entry points precede onboarding | AUTO | Observe Continue with Google and email/password Log In. Switch to Sign Up and back to Email Log In. The selected form changes; onboarding does not appear while signed out. | HIGH |
| DEP-3 | Google sign-in can begin from the test domain | AUTO | Click Continue with Google. Observe the actual Google authorization/sign-in window; an unauthorized-domain error or blocked OAuth flow is a failure. Do not enter credentials. | HIGH |
| DEP-4 | Production remains available | AUTO | Open https://natally.surge.sh in a separate fresh tab. Observe the existing Natally sign-in dialog with Google/email entry points. | BLOCKER |
| DEP-5 | Real Google sign-in and hosted reading | OPERATOR | Sign in with an authorized account on the test URL. Complete or load the profile, send a question and observe an actual hosted answer. Record the post-authenticated sequence without showing credentials. | BLOCKER |
| DEP-6 | Real email sign-in and returning profile | OPERATOR | Sign in with an existing email account on the test URL. Observe its own saved profile and a hosted answer. No synthetic account/session or stored-token injection. | BLOCKER |

The backend-origin configuration is isolated to the test deploy context. The
frontend selects that backend using `.env.test`; deploy with Vite `--mode test`.
Firebase must include the exact test domain while preserving existing domains.
Configuration receipts support these requirements but do not grant UI PASS.

Attestation in the run report names the driver, build, device, date and overall
verdict, and states which observations support each PASS. Until DEP-5/6 are
observed, the verdict is INCOMPLETE—pending-operator. Failed automated rows are
reported as DEFECTIVE and retain their recording evidence.

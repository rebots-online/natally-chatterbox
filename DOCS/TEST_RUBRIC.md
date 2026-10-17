# Conversational latency acceptance — 17 October 2026

Latest actual production-view run: **DEFECTIVE on latency**.
[Report, native boundaries, 24 observations and stills](../dist/rubric-runs/v0.0.0-chatterbox-pipeline-20261017/REPORT.md).
CB-ARCH-2 is implemented/deployed; the table's original baseline descriptions
below are retained as acceptance requirements, not current implementation claims.
Ready receipt scheduled in 9 ms; fresh six-unit first answer in 11.487 s;
16-unit chart reply completed but largest inter-sentence gap was 4.061 s.
Listening, phones and unexercised cache/failure cases remain explicitly unpassed.

Robin requires zero incremental conversational latency, preservation of the smoother
voice, contextually appropriate backchannels and immediate interruption. This is
the released amendment rubric for DOCS/ARCHITECTURE.md §9–10. It does not
retroactively PASS the published build or relax the target. Robin's subsequent
instruction excludes considering model alternatives unless Robin introduces that
possibility in operator discussion.

Drive the ordinary production interface with debug panels closed. The inherited
voice page may isolate native generation/cache behavior, but cannot pass ordinary
conversation, semantic, interruption or physical-listening requirements. Keep raw
send-to-ack, eligible-answer-to-audio, inter-unit-gap and interrupt-to-stop/ack
measurements separate. Actual acoustic onset, not a mascot, button or counter,
establishes audible output. State the recording's audio/timestamp limitations.

| ID | Required observation | Failure / current status |
|---|---|---|
| LAT-RECEIPT | A real submission immediately selects prepared audio before prompt processing; no foreground synthesis or extra palette download. | Not implemented. Separate receipt palette; no claim to understand the new message. |
| LAT-BRIDGE | After inference, a different appropriate prepared bridge may play while response audio is prepared; it yields when the answer is ready. | Not implemented. Reusing pre-understanding semantics, invented findings or delaying ready speech fails. |
| LAT-PALETTE | Silent selected-voice pool creation occurs during actual idle time, is locally reused, varied and bounded, and foreground work pre-empts it without engine reload. | Not implemented. First-ever empty pool, reload, changed voice and exhausted pool must be exercised explicitly. |
| LAT-SENTENCE | A long response starts at its actual beginning with one complete sentence/minimum logical unit; remaining generation runs behind playback. | Current planner packs whole turns and sentences: source-confirmed defect. Single-sentence native generation still took 6.0146 s / 6.8474 s on the observed desktop. |
| LAT-ZERO | Revised ordinary conversation meets Robin's zero incremental latency requirement on fresh and long turns. Record raw timing and queue starvation; do not reinterpret filler or silence avoidance as proof of zero generation cost. | Baseline fails. The amended pipeline must be observed; no assertion that latency is fundamentally unavoidable. Discuss measured residual pipeline failures with Robin before accepting any compromise. Do not consider a model alternative unless Robin raises it. |
| LAT-INTERRUPT | Submit a new turn during generation, answer playback and a backchannel, for read-ahead, redirection and another reason. Old output stops promptly, no obsolete job/callback resumes, and loaded sessions survive normal interruption. | Not implemented. Receipt is usually a short settled/realizatory grunt, `Mm.` or `Hmm.`, not wonderment or presumed understanding. |
| LAT-CONTEXT | The redirected answer addresses the new message with displayed conversation context, without assuming all prior audio was heard or guessing why the user interrupted. | Pending real inference and listening observation. |
| LAT-COMPLETE | First and final words, every planned logical unit and original offsets remain in order; new-turn karaoke/chart focus starts correctly; oversized units fail explicitly. | Audible completeness and reported missing beginnings remain unverified. |
| LAT-PRODUCTION | Useful preparing/speaking/interrupted/error feedback and known ready/played totals are visible in ordinary chat with debug details closed. Unknown final response length is disclosed explicitly; received-unit denominators are labelled as such. | Current production indicator conflates pending speech with playback. A debug-panel observation cannot PASS this row. |
| LAT-LISTEN | Distinct receipt/interruption/post-inference palettes sound natural in the selected voice; interruption delivery is settled/realizatory. | Pending operator listening; punctuation or text alone cannot certify prosody. |
| LAT-DEVICE | The complete journey passes on the target physical phones and desktop, including early submission before the initial pool is populated. | Pending. Desktop native timings are not phone acceptance. |

Baseline evidence:
[indexed observations and native events](../dist/rubric-runs/v0.0.0-chatterbox-latency-20261017/REPORT.md).
No unit suite, fake identity/provider/audio, new harness or model substitution is
an alternative to the observed journey. No extra model/provider/cost/host is
authorized by a failed row.

---

# Natally Chatterbox browser-use acceptance — 15 October 2026

Released by Robin's instruction to complete the actual browser-use gauntlet.
Run the published normal application at `https://natally-chatterbox.surge.sh`;
no injected identity/state, unit suite, coded browser harness or substitute audio.
Record source/deployment/browser and actual results before making a completion
claim. Inherited signed-out voice page may provide supporting engine evidence;
it does not replace authenticated ordinary-app acceptance.

| ID | Direct observation required | Result rule |
|---|---|---|
| CB-UI | Normal app loads with readable sign-in and existing controls; Google/email forms switch normally. | Any blocked normal entry is a defect. |
| CB-READY | On opening the app, before login or a speech action, actual model loading starts and reaches readiness only after sessions/tokenizer/selected voice preparation. | Loading/restarting around 87 MB, silent failure, or ready before reference preparation fails. |
| CB-CACHE | Reload after successful loading; existing file panel identifies cache reads; readiness returns without repeating model-file network downloads. | Missing cache persistence or hidden storage failure fails. |
| CB-SPEAK | Existing authorized account: completed reply and existing saved replay produce audible complete speech through the real UI. Whole long reply uses complete sentences/logical units and retains its ending. | PCM generation alone is not audible completeness. Login-required steps are pending operator until a real account is used. |
| CB-STOP | Stop actual synthesis/playback, observe no obsolete speech; replay completes, with explicit loading state if sessions restart. | Stale audio, hanging busy state or silent repeated model download fails. |
| CB-ERROR | Existing UI preserves concrete download/cache/session failure and last operation; retry is explicit and does not conceal a loop. | Generic failure without the failing stage is insufficient. |
| CB-DEVICE | Robin's target phone/browser completes the ordinary-app journey. | Desktop evidence is not phone acceptance. |

Overall verdict remains DEFECTIVE on any observed failing row; required
unobserved account/device rows remain explicitly pending, never inferred PASS.
The inherited deployment rubric follows as historical scope, not a claim that
its login-only rows prove Chatterbox voice readiness or speech.

---

# Public test deployment rubric

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

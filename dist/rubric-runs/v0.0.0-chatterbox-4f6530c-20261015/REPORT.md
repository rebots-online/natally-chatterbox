# Chatterbox implementation browser run — 15 October 2026

Driver: Codex through actual browser controls. Native Windows, Chrome with the
existing signed-in account, plus Codex in-app browser. Source: `4f6530c1d5729e957f82e42e7a4c857f3f49f03f`.
URL: https://natally-chatterbox.surge.sh. Surge release: `1792103121721`.
Build: normal production command, root `dist/`, published source. No unit tests,
coded browser harness, injected auth/state, fabricated model replies or audio.

**Verdict: implementation/deployment and desktop browser run completed; full
voice acceptance remains INCOMPLETE.** Screen observations cannot establish
audible word completeness or target-phone performance. No blanket PASS.

| Rubric | Direct observation | Result and evidence |
|---|---|---|
| CB-UI | Normal sign-in/branding; Sign Up and Email Log In switch. Existing signed-in Chrome profile loads into actual chart/chat. | Observed desktop entry. [Normal entry still](02-main-after-background-ready.png). Fresh Google OAuth was not established in the embedded browser; existing Chrome auth was used. |
| CB-READY | Startup begins before login/speech. Sessions/tokenizer/reference finish; strip clears. | Observed. Normal entry still; public recording shows actual decoder initialization at [00:10](public-voice-observation.mp4#t=10), and readiness after generation. |
| CB-CACHE | File panel lists all 13 model/tokenizer files as saved cache, including the 87.3 MB tensor; loading proceeds beyond it. | Observed saved-cache reads, [00:46](public-voice-observation.mp4#t=46). No observed repeating-download loop. This is not a packet capture of every request. |
| CB-SPEAK | Real service enters Playing locally generated audio, then Local playback completed successfully. Actual signed-in chat welcome and long saved reading enter speaking and later return to Replay; cached long replay enters speaking immediately. | Runtime playback observed; audible word/ending completeness remains unverified. [Playing still](04-real-audio-playback.png), recording [01:12](public-voice-observation.mp4#t=72) completed state. Account captures local only. |
| CB-STOP | Playback Stop; separate active-generation Stop followed by cache initialization and readiness; subsequent replay completes. Actual chat Stop removes speaking immediately. | Observed. [Stopped](05-playback-stop.png), [recovery](06-stop-inference-and-recover.png), recording [02:17](public-voice-observation.mp4#t=137), [following replay completed](07-recovered-playback-completed.png). |
| CB-ERROR | Older deployment showed a concrete network error and failing language-model tensor. Corrected deployment preserves explicit stage/error paths in source. | No induced quota/corruption/session failure on current deployment; acceptance unverified. Older network error is not identified as the cause of the phone report. |
| CB-DEVICE | Target lower-resource phone/browser and human listening. | Pending Robin's device evaluation, as requested. Desktop success does not establish this. |

One actual-chat welcome generation was still performing measured language-model
work at 106 seconds before playback became available. This is a material speed
observation; no real-time or lower-resource-phone performance claim is made.
Existing stored replies were used, so this run makes no fresh hosted-answer or
new-login claim. No new voice page or product feature was introduced for this run.

## Recording scope

[Public browser observation MP4](public-voice-observation.mp4) is approximately
173 seconds. It contains 108 selected screenshots at about one per observed
second, encoded with their original observation intervals. Between 00:19–00:35,
00:58–01:05 and other uncaptured intervals it holds the preceding observation;
it is not a continuous audiovisual recording. It has no audio track. It shows
the inherited signed-out voice page executing the actual application service.
The complete whole-session recording requirement is consequently not claimed
satisfied, and this MP4 does not substitute for ordinary-app or listening proof.
Later recovery completion is the separately linked still. Normal application
and authenticated observations were driven separately. Private account captures
remain local and are excluded from Git publication.

Source review checked the pinned upstream four-graph runner, tensor shapes,
sampling, cache lifecycle, sentence-unit planning and blueprint declarations.
Two review findings were repaired before the published source: an obsolete
preload rejection could clear a replacement promise; an oversized cached body
could throw before the shared cache-repair path. TypeScript and production
build were repeated after those repairs. No unit suite was used.

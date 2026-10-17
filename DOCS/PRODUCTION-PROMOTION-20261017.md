# Natally production replacement — 17 October 2026

Robin explicitly requested publishing this checkout to `https://natally.surge.sh`
and noting that it replaces the deployment formerly built from `natally-ai-studio`.
The product remains **Natally**. This repository remains `natally-chatterbox`.

The promoted voice pipeline source is
`ce6c2bf46566cba40adbf1d557ef09d0fdb1e040`. Subsequent report/operational commits do
not change that pipeline. The replacement publication commit and actual host
release are recorded in HOSTED_CHAT after deployment and served-payload checks.

The production build profile `.env.production` names the existing production
hosted API at `https://natally-hosted-chat.netlify.app/.netlify/functions/chat`.
The Chatterbox branch alias retains its own exact-origin environment and remains
available for the separate variant. No broad origin allowlist or authentication
weakening is introduced. The production API's existing `FRONTEND_ORIGIN` is
`https://natally.surge.sh` and is retained.

The current backward-compatible streaming backend is deployed to that existing
Netlify production site as `6ad3bcda0aefe97aace3e3a6`. The provider, application
model, authentication and rate/tool limits remain unchanged. Existing Netlify
hosting remains migration debt; no new provider or Oracle cutover is implied.

Only the normal built application payload is promoted. The local operator voice
editor, source recordings, private presets, Open Design working files and raw
authenticated observations are excluded from hosting. Public diagnostic test
assets already part of the existing payload remain distinct from the private
operator workbench being developed.

Production promotion is not a latency PASS. The latest completed native eight-unit
run still recorded 4.610 seconds maximum finalized uncovered answer gap. Actual
listening and target-device acceptance remain open. See the versioned production
rubric and animated report for measured boundaries.

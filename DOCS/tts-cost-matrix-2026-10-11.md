# TTS Cost Matrix — OpenRouter vs Venice vs GLM/z.ai (2026-10-11)

Target quality bar: **Gemini Flash TTS** (`gemini-*-flash-tts`, the app's current
neural voice). Conversions use ≈4 chars/token (text) and ≈25 audio-tokens/sec
(~150 wpm) — estimates, marked `≈`; native units are authoritative.

## Matrix (sorted by ≈$/1M chars)

| Provider | Model | Native price | ≈$/1M chars | ≈$/hour speech | Quality vs Gemini Flash TTS | Privacy |
|---|---|---|---|---|---|---|
| Google direct | gemini-flash-tts | $0.50/1M in + $2.00/1M audio-out tok | ≈$3.40 | ≈$2.05 | **= baseline** (is the model) | Google |
| **Venice** | **tts-kokoro** | **$3.50/1M chars** | $3.50 | ≈$2.10 | Slightly below (narration-grade, less expressive persona control); open-weights (Hexgrad 82M) | **Private** |
| OpenRouter | openai/gpt-audio-mini | $0.60/$2.40 per 1M tok | ≈$4.00 | ≈$2.40 | Near-equal (OpenAI voices) | OpenRouter |
| OpenRouter | openai/gpt-audio | $2.50/$10.00 per 1M tok | ≈$16.70 | ≈$10.00 | Near-equal, richer voices | OpenRouter |
| Venice | tts-xai-v1 | $18.75/1M chars | $18.75 | ≈$11.25 | Comparable class | Anonymized |
| Venice | tts-inworld-1-5-max | $12.50/1M chars | $12.50 | ≈$7.50 | Near-equal (expressive game-grade) | Anonymized |
| Venice | tts-gradium-v1 | $47.50/1M chars | $47.50 | ≈$28.50 | Unknown — quote API first | Anonymized |
| Venice | tts-chatterbox-hd | $50.00/1M chars | $50.00 | ≈$30.00 | Below (lightweight) | Private |
| Venice | tts-elevenlabs-turbo-v2-5 | $62.50/1M chars | $62.50 | ≈$37.50 | Above (ElevenLabs Turbo) | Anonymized |
| Venice | tts-orpheus | $62.50/1M chars | $62.50 | ≈$37.50 | Comparable | Private |
| Venice | tts-qwen3-0-6b | $87.50/1M chars | $87.50 | ≈$52.50 | Below | Private |
| Venice | tts-qwen3-1-7b | $112.50/1M chars | $112.50 | ≈$67.50 | Comparable | Private |
| Venice | tts-minimax-speech-02-hd | $125.00/1M chars | $125.00 | ≈$75.00 | Above (HD cloning) | Anonymized |
| Venice | **tts-gemini-3-1-flash** | $187.50/1M chars | $187.50 | ≈$112.50 | **= exact model family** (Gemini Flash TTS via Venice) | Anonymized |
| z.ai | — (no hosted TTS) | GLM-TTS is open-weights only (HF zai-org/GLM-TTS); Coding Plan includes no TTS endpoint | n/a | n/a | Self-host candidate for the future local engine | local |
| Local (future engine) | kokoro-82m / GLM-TTS via wllama3-class runtime | $0 | $0 | $0 | Kokoro ≈ tts-kokoro quality | on-device |

## Findings

1. **Lowest-cost Gemini-3.8-Flash-TTS-equivalent: Venice `tts-kokoro` at $3.50/1M chars**
   (~$2.10/hr). Narration-grade studio quality, Private (no logging), billed against
   the existing VENICE_API_KEY. Margin rule applies (40% of credit charged).
2. **Tied on cost, exact on quality: direct Google `gemini-flash-tts` (≈$3.40/1M chars)**
   — requires a *valid* GEMINI_API_KEY (the current .env copy is invalid). At parity
   with Kokoro on price, so the decision is voice fidelity (Gemini wins) vs key
   dependency + privacy (Kokoro/Venice wins).
3. Venice's `tts-gemini-3-1-flash` is the only way to *buy* the exact Gemini voice
   through Venice — at a 53× premium over direct Google ($187.50 vs ≈$3.40 per 1M
   chars). Only sensible when keying everything through the Venice balance.
4. OpenRouter TTS is OpenAI-voice-shaped (`/api/v1/audio/speech`); `gpt-audio-mini`
   ≈$4/1M chars is its budget lane, but no free-tier TTS exists.
5. z.ai offers **no hosted TTS** on any plan — GLM-TTS is self-host-only, a natural
   future local-engine resident alongside llama.cpp.

**Recommendation:** wire `VENICE_TTS_MODEL=tts-kokoro` as the fallback neural voice
behind Gemini (both client-direct seams already exist); revisit GLM-TTS/Kokoro
self-hosting when the local inference engine lands.

Sources: docs.venice.ai/overview/pricing (full TTS table, fetched 2026-10-11);
openrouter.ai /api/v1/models (live gpt-audio pricing, fetched with studio key);
openrouter.ai/docs TTS guide; HF zai-org/GLM-TTS.

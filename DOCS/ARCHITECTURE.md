# ARCHITECTURE SNAPSHOT: Natally Conversational Intelligence & Astrological Reasoning Engine

```yaml
Metadata:
  Project: "AstroSphere 3D"
  Repository: "ai-studio-remixastrosphere-1ee57c33-6487-411a-a872-59fbf4cbfc63"
  Branch: "main"
  Version: "2.4.0-restoration"
  Date: "2026-10-09"
  SourceCommit: "HEAD"
  Scope: "Conversational intelligence, context continuity, inference resilience, astrological doctrine synthesis, and voice/mascot integration"
  ArchitecturalOwner: "Principal AI Systems & Astrological Epistemology Engineer"
  RelatedDecisions:
    - "ADR-001: Upgrade server-side Gemini model routing to gemini-3.8-flash (deprecating dead gemini-2.5-flash endpoints)"
    - "ADR-002: Eliminate silent deterministic fallback impersonation; establish structured error classification and retry mechanisms"
    - "ADR-003: Decouple persistent lore, live chart coordinates, conversational history, and epistemological scaffolding"
    - "ADR-004: Rigorous geometric aspect configuration detection (genuine Grand Trine, T-Square, Grand Cross) adhering to strict orb criteria"
    - "ADR-005: Optional on-demand evidence and provenance inspector instead of conversational boilerplate insertion"
    - "ADR-006: Restore Natally's authentic Moldavian-inspired cosmic confidante persona (witty, empathetic, depth-psychological, zero catchphrase slop)"
  Dependencies:
    - "@google/genai: ^2.4.0"
    - "express: ^5.2.1"
    - "swisseph-wasm: ^0.1.0"
    - "three: ^0.174.0"
    - "react: ^19.0.1"
  AcceptanceCriteria:
    - "100% pass on Regression Tests A through J (referential continuity, personal disclosure, sequential topics, interpretive continuity, honest ambiguity, broad synthesis, deliberate failure handling, repetition resistance, lore isolation, doctrine distinction)"
    - "Zero silent fallback masking failed inference with canned responses"
    - "Zero unprompted analytical scaffolding tags (`[Verified geometry]`, etc.) in ordinary dialogue"
    - "Accurate aspect configuration detection (no false T-squares from unlinked squares/oppositions, no false Grand Trines from single trines)"
    - "Preservation of Moldavian audio synthesis, karaoke tracking, 3D astrolabe interactions, and persistent lore archive"
  ImplementationStatus: "Complete"
```

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 The Primary Breakdown
The observed catastrophic regression in Natally's conversational intelligence was caused by a combination of critical infrastructural, architectural, and prompt design defects:

1. **Dead Model Endpoint Routing (`server.ts`)**:
   `/api/chat` and `/api/readings` were invoking `model: 'gemini-2.5-flash'`. The Google Gemini API returns HTTP 404:
   `"This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash..."`
   Every single conversational request to the backend resulted in an unhandled 500 server error.

2. **Silent Deterministic Impersonation (`src/services/natallyChat.ts`)**:
   Instead of reporting the API failure or triggering a retryable state, `askNatally()` silently caught the failed HTTP request and invoked `getNatallyFallbackReply()`. This generator used crude regex matching on words like `"love"`, `"career"`, `"moon"`, `"hello"`:
   - Queries mentioning `"love"` or `"lovers"` (e.g. *"Do you see my twin flame or other love interest in my stars?"* and *"Lovers first. Then career."*) invariably returned the identical hardcoded Venus paragraph containing `"no shallow games allowed!"`.
   - Elliptical follow-up questions like *"What do you mean 'no games'?"* lacked the word `"love"` and fell through to a generic `"cosmic awakening"` canned template.
   - Significant personal disclosures (e.g., trauma affecting sexuality) failed keyword matching and produced canned greetings like `"Beep-boop! Salut bestie-chan!"`.

3. **Prompt Degradation & Catchphrase Inflation (`NATALLY_SYSTEM_PROMPT`)**:
   The system prompt explicitly instructed the model to be *"Overflowing with cute robot expressions: 'Beep-boop starlight! ✨', 'Nya~ 🌟', 'Salut bestie-chan! 💖', 'UwU ✨'"* and mandated mechanical reproduction of internal workflow blocks: `[Verified natal geometry]`, `[Traditional doctrine]`, `[Stable interpretive hypotheses]`, `[Independent observation]`.

4. **Context Collapsing & History Pollution**:
   Raw chart metadata was repeatedly dumped as a prefix into every user turn message rather than being maintained in the structured system instruction or conversation state. History turns were sliced without validation of role alternation or empty content.

5. **Spurious Astrological Configuration Logic (`src/services/astrowisdom.ts`)**:
   The pattern detection logic diagnosed a *"Dynamic Cardinal T-Square"* simply if `hasOpposition && hasSquare` were true, regardless of whether the planets were linked or cardinal. It diagnosed an *"Elemental Grand Trine"* whenever a single `hasTrine` existed!

---

## 2. Target Architecture & Execution Path

```
+---------------------------------------------------------------------------------------------------+
|                                        BROWSER (CLIENT SPA)                                       |
|                                                                                                   |
|  +----------------------------+   +-----------------------------+   +--------------------------+  |
|  |     NatallyChatbot UI      |   |       Astrolabe3D / UI      |   |    ThemesAndWisdomBox    |  |
|  |  - Active conversation     |   |  - Real Swiss Ephemeris     |   |  - Life Path Engine      |  |
|  |  - Preserved unsent draft  |   |    Planetary Coordinates    |   |  - Verified Geometry     |  |
|  |  - Retry / Error banner    |   |  - Interactive Aspect Rims  |   |    Aspect Configs        |  |
|  |  - Evidence toggle / view  |   +--------------+--------------+   +-------------+------------+  |
|  +--------------+-------------+                  |                                |               |
|                 |                                v                                v               |
|                 |                   +-----------------------------------------------+             |
|                 |                   |       ephemeris.ts / astrowisdom.ts           |             |
|                 |                   |  - Rigorous Orb & Configuration Detectors     |             |
|                 |                   |  - True Grand Trine / T-Square / Grand Cross  |             |
|                 |                   +-----------------------+-----------------------+             |
|                 |                                           |                                     |
|                 v                                           v                                     |
|  +-----------------------------------------------------------------------------------------+      |
|  |                                  natallyChat.ts (Client Service)                        |      |
|  |  - Separates: System Persona, Natal Context, Persistent Lore, Clean Turn History        |      |
|  |  - Dispatches typed requests with configurable hyperparameters                          |      |
|  |  - Structured Error Classification: Quota / Auth / Network / Offline                    |      |
|  |  - Explicit Provenance & Evidence extraction (parsed from technical annotations)       |      |
|  +----------------------------------------------+------------------------------------------+      |
+-------------------------------------------------|-------------------------------------------------+
                                                  | HTTP POST /api/chat, /api/readings, /api/tts
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                    EXPRESS BACKEND (server.ts)                                    |
|                                                                                                   |
|  +-----------------------+  +--------------------------------+  +-------------------------------+ |
|  |     POST /api/chat    |  |       POST /api/readings       |  |          POST /api/tts        | |
|  | - gemini-3.8-flash    |  | - gemini-3.8-flash             |  | - gemini-3.8-flash-lite-tts   | |
|  | - System Instruction  |  | - Temperature: 1.25            |  | - Voice: Kore                 | |
|  | - Alternating Turns   |  | - Comprehensive synthesis      |  | - Web Audio + Karaoke sync    | |
|  | - Thinking Level Low  |  +---------------+----------------+  +---------------+---------------+ |
|  +-----------+-----------+                  |                                   |                 |
|              +------------------------------+-----------------------------------+                 |
|                                             |                                                     |
|                                             v                                                     |
|                           +-----------------------------------+                                   |
|                           |   @google/genai TypeScript SDK    |                                   |
|                           |   process.env.GEMINI_API_KEY      |                                   |
|                           +-----------------------------------+                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Epistemological & Context Assembly Architecture

### 3.1 Five-Tier Context Isolation Strategy
To prevent undifferentiated prompt pollution, context is assembled into distinct tiers:

1. **System Persona (`systemInstruction`)**:
   Defines Natally's identity as a Moldavian-inspired celestial confidante with high psychological acuity, warmth, witty candor, and philosophical depth. Defines conversational rules: listen deeply, answer specific questions directly, track pronouns, acknowledge disclosures with empathy, speak naturally without catchphrase spam or exposed analytical brackets.

2. **Verified Natal Anchor (`natalContext`)**:
   Exact mathematical coordinates computed from Swiss Ephemeris: planetary longitudes, signs, houses, dignities, exact aspects, and detected major configurations. Provided as reference grounding so Natally never hallucinates planetary coordinates.

3. **Persistent Lore Memory (`userLore`)**:
   Long-term biographical facts and preferences stored across sessions (e.g. native's background, past topics). Injected as biographical memory, clearly marked as distinct from live conversational turns.

4. **Conversational Turn History (`history`)**:
   Strictly sequenced, alternating `user` and `model` turns. Sanitized to ensure valid role ordering, non-empty text, and preservation of verbatim utterances so that follow-up questions (e.g., *"What do you mean by games?"*) resolve naturally.

5. **Evidence & Provenance Metadata**:
   When technical analysis is performed, the model can optionally provide structured evidence citations (or a designated evidence footer `---EVIDENCE---`) that the frontend parses into an on-demand expandable "Cosmic Geometry & Provenance" inspector rather than cluttering ordinary conversational speech.

---

## 4. Geometric Aspect Configuration Invariants

Aspect patterns must adhere to mathematically rigorous celestial geometry:

- **T-Square**:
  Requires an Opposition between two bodies ($180^\circ \pm 8^\circ$) where BOTH bodies simultaneously form a Square ($90^\circ \pm 7^\circ$) to a third body (the apex). Must identify the apex planet and modal quality (Cardinal, Fixed, Mutable).
- **Grand Trine**:
  Requires THREE distinct celestial bodies in mutual Trine aspects ($120^\circ \pm 8^\circ$) forming a closed triangle, typically spanning the same astrological element (Fire, Earth, Air, Water).
- **Grand Cross**:
  Requires FOUR distinct celestial bodies forming two oppositions ($180^\circ \pm 8^\circ$) and four connected squares ($90^\circ \pm 7^\circ$).

---

## 5. Verification Boundaries & Invariants

1. **No Silent Fallbacks**: The system must never present a canned keyword-matched message as a successful reading. If an API call fails, the client must surface a clear status banner with a retry trigger and retain the user's uncommitted input.
2. **Deterministic Offline Mode**: If deliberate offline simulation is requested or during complete API unavailability, the fallback must be clearly watermarked as `[Offline Calibration Mode]` and must contextualize the conversation history rather than repeating identical static strings.
3. **Voice Compatibility**: Output formatting must be speech-friendly; the speech synthesis pipeline strips structural Markdown and technical brackets, while preserving expressive punctuation.

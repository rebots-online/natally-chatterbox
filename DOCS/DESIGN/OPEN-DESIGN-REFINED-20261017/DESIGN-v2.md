# Natally — the reading room

Design authority: Robin's approved brief, 17 October 2026. Scope: this separate Open Design prototype only.

## Design intent

An intimate ink-violet observatory, with the original amber-eyed Natally as its conversational centre. Metallic gold and violet belong to the character, crystal ball and chart; calm neutral surfaces carry the conversation. The memorable gesture is her small hand moving across the ball while attention shifts between the person and the spoken chart reference.

This is a responsive product screen, not a landing page. There is no signup funnel, fictitious personal reading, invented progress percentage or model configuration UI.

## Authority and assets

- `assets/natally-mascot.webp` is the supplied original. It is preserved without modification. Intrinsic dimensions: **400 × 400**, 124 frames, approximately 24 fps. It is not a high-resolution character rig.
- `assets/natally-still.webp` is a single-frame derivative of that exact asset. The original emblem remains in the navigation, using the still derivative so animation can actually be paused.
- The stage reuses the same pixels in SVG clipping regions for the cloak, head, eye interiors and caressing hand. No generated replacement face or character was introduced. The image remains square in every SVG image element; clip paths isolate parts deliberately.
- The room, gems, books, armillary sphere, hourglass and candle are original inline SVG environment details. They depict an imaginary room, not real products or places requiring photography.
- No font downloads, remote images, CDNs, paid media, runtime dependencies, videos or rendering libraries are used.
- At large stage sizes the original raster can soften. Production-quality enlargement requires an approved higher-resolution asset or properly separated original character layers. The prototype's small bounded displacements do not substitute for that art deliverable.

## Source palette

The actual original was inspected before choosing tokens. Sampled source pixels included the night surround RGB **0, 8, 21**; turban shadow **55, 31, 62**; cloak **66, 40, 71**; ball highlight **255, 243, 180**; metal face **202, 182, 166**. The semantic palette is a restrained OKLch derivation of that art, not the generic Product defaults.

```css
--bg: oklch(0.17 0.022 294);
--surface: oklch(0.205 0.027 294);
--fg: oklch(0.94 0.014 79);
--muted: oklch(0.74 0.025 294);
--border: oklch(0.35 0.035 294);
--accent: oklch(0.81 0.105 80);
--violet: oklch(0.65 0.16 309);
--violet-light: oklch(0.79 0.105 309);
--deep: oklch(0.12 0.023 294);
--room: oklch(0.205 0.039 294);
--metal: oklch(0.64 0.043 72);
--wood: oklch(0.28 0.035 55);
--error: oklch(0.83 0.10 30);
--success: oklch(0.8 0.065 158);
```

The six semantic base tokens are also recorded in `brand-spec.md`. Violet/gold and magical glow are explicit requirements of this brief. They supersede the older white/blue Product palette and generic prohibitions against violet or glow. Gold has one solid UI action, Send; contextual chart highlighting is its second UI role. The supplied artwork and room materials keep their identity colors. Do not turn every label, border or link gold.

## Typography

```css
--font-display: Georgia, 'Times New Roman', serif;
--font-body: 'Segoe UI', Helvetica, Arial, sans-serif;
--font-mono: Consolas, 'Courier New', monospace;
```

Georgia supplies the warm reading-room voice without a font download. Segoe UI handles dense text and familiar controls. Mono is reserved for integration documentation; it is not a third face on the product screen.

- Main title: 32/1.15 desktop, 26/1.15 phone, 24 at 360px; tracking −.02em.
- Panel titles: 21–22px Georgia, approximately 1.2 leading.
- Transcript: 15px/1.65 Segoe UI; body UI 15px/1.55.
- Captions: 11–12px; uppercase labels 10px with .09–.17em tracking.
- Buttons: .02em tracking; 400 normal and 600 emphasis.
- Keep prose below 65 characters per line. Use real wrapping; never hide text overflow.

## Composition

### Wide desktop, 1101px and up

The main stage and conversation share one bordered workspace. The stage receives roughly 63% of the width; conversation roughly 37%. A 148px companion wheel sits below the room, avoiding the character silhouette. The room's arched window frames Natally, with objects on different depth planes and a dark table grounding her. The transcript scrolls independently; the composer remains visible at the bottom of its panel.

### Tablet / open foldable, 701–1100px

Keep two usable panes, with a 320px minimum conversation column and simplified room labels. The character stays large while the chart shrinks to 110px. Controls wrap in the rehearsal area. This is responsive web, not a native foldable shell: hinge occlusion, physical spanning and device keyboard behaviour remain device acceptance work.

### Narrow phone / closed foldable, 360–700px

Recompose vertically: room first, compact companion chart second, readable conversation third. The room is 310–335px tall. The 66px companion wheel is an overview; Explore and the persistent chart button open a full chart dialog. The input, Send, Stop and mute remain in a fixed bottom composer. Safe-area padding and Visual Viewport offsets accommodate browser keyboards without making the text field unavailable. Body clearance prevents the composer from covering the last content.

No horizontal carousel is used. All grid tracks that hold text use `minmax(0,…)`; controls wrap. The CSS audit covers 360, 390, 430, 600, 768, 820, 1024, 1366, 1440 and 1920px. Static width checks are distinct from browser/device acceptance.

## Components

- **Primary action:** one gold Send button, minimum 44px high. Enter sends; Shift+Enter adds a line; IME composition is respected. Empty submission uses native validation.
- **Stop:** remains next to mute and chart. It cancels the simulated turn and all stale turn timers, then offers a settled interruption cue. Disabled only when nothing is running.
- **Mute:** true toggle with `aria-pressed` and accessible name updates. It cancels cue/answer audio ownership immediately. It does not disable typing or restart skipped audio when unmuted.
- **Normal status:** plain state name plus cumulative received, prepared and played counts. The total stays unknown until completion. Prototype counts describe synthetic events only.
- **Transcript:** semantic log, safe text insertion, visible speaker labels, and a current-unit underline. No typing illusion substitutes for received text.
- **Companion chart:** solid natal geometry and dashed current geometry; Together uses a bounded layer intersection transition. Glowing focus follows unit start, and interruption clears it.
- **Chart dialog:** native modal, named close button, Escape dismissal and focus restoration. No personal data or dates are fabricated.
- **Prototype rehearsal:** explicitly labelled silent event controls. These are design assessment controls and must not ship in the production conversation UI.
- **Error:** visible, persistent until an explicit retry, text fallback or new submission. No endlessly running spinner.

## Motion and accessibility

See `MOTION-CONTRACT.md` for state semantics and budgets. Motion is restrained, independent and bounded; it does not delay text, playback or interruption. A visible Pause motion control is always available. Individual ambient gestures finish, then rest for independently varied intervals; room-light gestures are separated by 6.5–12 seconds. Reduced motion removes gaze, hand and layer travel; static highlights and text still convey state.

All controls use native elements, target at least 44 × 44px, have focus-visible rings, and retain readable text on hover. Body and UI foregrounds use high-contrast light text on dark surfaces. Primary hover lightens the gold fill while retaining dark text. Disabled controls alone reduce contrast.

## Evidence boundary

This project is a runnable local visual and interaction prototype. It does not run inference, TTS, audio playback, Swiss Ephemeris, authentication or personal chart services. Animation measurements, production speech latency and real mobile keyboard behaviour must be measured in the application and on target devices. No latency acceptance PASS is asserted here.

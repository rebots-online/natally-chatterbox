# Mobile viewport and chart gesture repair

Source: Robin's four Android screenshots and explicit torus pinch request,
2026-10-12. Existing visual design repair, not a new design system. Released
scope: responsive layout and touch handling only; no identity, billing, provider,
or lore changes. CodeGraph verified healthy; CSS/HTML/Markdown parser coverage
requires targeted reads of src/index.css, index.html, and this contract.

## Entities

| Exact entity | Target | Contract |
| --- | --- | --- |
| ViewportBounds | src/services/chatViewport.ts:1 | width, height, left, top, layoutWidth numeric viewport bounds |
| getChatViewportLayout | src/services/chatViewport.ts:9 | (bounds, position, size, expanded) returns left/top/width/height/mobile/compact; finite saved values only, clamp to visible bounds |
| useVisualViewport | src/hooks/useVisualViewport.ts:1 | () => ViewportBounds; initial measurement plus window resize and visualViewport resize/scroll subscriptions, cleanup |
| bindTorusTouch | src/services/torusGestures.ts:1 | (element, callbacks) => { dispose, suppressClick }; canvas-only touch ownership; callbacks start(x,y), move(x,y), end(), zoom(factor) |
| getTorusZoomDistance | src/services/torusGestures.ts:1 | (distance, factor) => finite distance clamped 4..13; common wheel/pinch camera limits |
| NatallyChatbot | src/components/NatallyChatbot.tsx:84 | visible viewport bounds; nonshrinking header/composer, min-height-zero scrolling messages, short-height secondary chrome suppression; mobile no dragging/resizing |
| DraggableCard | src/components/DraggableCard.tsx:30 | expanded translucent background, mobile normal-flow layout and native text scrolling; desktop positioning preserved |
| Astrolabe3D | src/components/Astrolabe3D.tsx:15 | bindTorusTouch replaces global single-touch listeners; pinch scales camera distance, not page or text; no selection after gesture |
| App | src/App.tsx:391 | responsive workspace removes mobile hard minimum height and allows blank regions to hit canvas |
| Mobile surface rules | src/index.css:1 | named natally-chat / natally-info-card / natally-workspace selectors; safe areas, compact controls, expanded panel alpha .78 vs chat .92 |
| Viewport declaration | index.html:5 | viewport-fit=cover and interactive-widget=resizes-content; no disabling accessible page zoom outside canvas |
| Regression tests | tests/mobile-layout.test.ts:1 | actual event binding with EventTarget fixtures, pinch directions/limits, drag transitions, cancellation, cleanup; viewport keyboard/offset/rotation/stale saved geometry |

## Behaviour

Phone chat fills the visual viewport with a small inset; keyboard opening shrinks
the message area, not the composer. Desktop remains movable and resizable but
clamps to visible bounds. Below 500 CSS pixels of height, secondary timeline and
identity details yield space; conversation search remains accessible. Inputs use
16px on mobile to avoid automatic input-focus zoom. Safe-area padding stays
inside the measured border box. Expanded cards remain translucent, with stronger
background attenuation and blur separating foreground prose from chart labels.
On small screens cards stack without applying saved desktop translations.

Torus touches originate on the canvas only. One finger rotates; two fingers
spread to enlarge and pinch together to shrink. Pinch cancels rotation momentum;
returning to one finger starts a fresh baseline. Three-plus touches suspend the
gesture. Cancel/end cannot leave dragging active. Touch listeners are local and
removed on disposal; panel scrolling and typing never rotate or zoom the chart.
Mouse wheel uses the same camera distance bounds. Browser page zoom remains
available outside the interactive canvas.

## Verification

Automated: node --import tsx --test tests/mobile-layout.test.ts and full existing
suite, npm run lint, npm run build, git diff --check. Passing commands establish
implementation acceptance, not actual Android keyboard behaviour.

Operator verification protocol: on Android Chrome, open chat, type with keyboard
shown, scroll messages, rotate device, close/reopen keyboard; header and composer
remain visible. Expand each panel and read text without chart-label interference.
On bare chart space, pinch in/out and lift either finger; torus changes size,
page text does not, no accidental selection/jump. Scroll expanded panels without
moving chart. Confirm desktop wheel/drag/reset unchanged. CUA currently reports
no available browser surfaces; physical-device verification remains unobserved.

References: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
and https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent/targetTouches .

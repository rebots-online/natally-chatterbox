# Natally prepaid offer and funnel prototype

This is the screen-only deliverable Robin requested on 15 October 2026.
It contains eight desktop designs and six mobile counterparts authored in
[the existing Natally Google Stitch project](https://stitch.withgoogle.com/projects/8460014353109836944).

The three offers are natal chart PDF only, natal chart PDF + SPA, and Bring
Natally home. Natally direct, Alby marketplace and x402 have separate entry
paths. The prototype covers offer selection, upgrade and decline, review,
example delivery, and pending/expired/resume journeys.

## Open the working screen prototype

From the repository root:

```powershell
python -m http.server 49413 --bind 127.0.0.1 --directory LIBS/UI/STITCH
```

Open <http://127.0.0.1:49413/>. The channel buttons select the acquisition
journey. The mobile toggle loads the six phone designs; review and recovery
use their responsive desktop source. The screen selector allows direct review.
Actual screen actions demonstrate the funnel, including optional upgrades and
declines. Reload preserves only the selected demonstration view in the URL.

`index.html` and `prototype.js` provide the review controls and screen links.
The iframe renders the actual exported Stitch HTML. There is no payment,
wallet, account, entitlement, chart/PDF generation, inference, or SPA product
implementation. Quote/download controls open explanatory prototype annotations
or the next example screen. No payment credentials or real birth details are
collected. The export uses the fonts, Tailwind CDN and sample imagery supplied
by Stitch, so internet access is required for those design assets.

## Source and provenance

- `DESIGN.md`: current scoped design brief; governing TC12 v1.2 was retrieved
  from KStore, rather than relying on the stale local Admin-Manual mirror.
- `screens/*/code.html`: addressable Stitch source, with layouts and component
  structure retained. Copy corrections remove invented page counts, pricing,
  lifetime/hosting/privacy promises, and replace personal example input with
  fictional data. A small responsive rule enforces 44px button heights.
- `screens/*/screen.png`: original Stitch previews. These precede the copy
  corrections. The review screen's original PNG remains local because it
  contains personal example input from the pre-existing canvas.
- `assets/natally-mascot.webp`: byte-identical copy of the supplied mascot
  already used by Natally, referenced locally by the reviewed HTML.
- `manifest.json`: project URL, verified canvas screen IDs, original/reviewed
  HTML hashes and preview paths.
- `exports/prepaid-funnels-20261015.zip`: original fourteen-screen Stitch
  export, retained locally and excluded from Git because of the personal
  example input. SHA-256 is recorded in the manifest.
- `exports/stitch-project-design.md`: original project design-system export,
  retained as provenance; it predates this task's current scoped brief.
- `verification.json`: observed desktop/mobile rendering and navigation checks.

The reusable handoff archive is `exports/natally-prepaid-funnel-prototype.zip`.
It includes the reviewed source and viewer, local mascot, manifest, brief and
shareable original previews. Extract it and run the same HTTP server command
from its extracted root with `--directory .`.

## Verification scope

All fourteen exported layouts rendered in Chrome. Eight desktop views were
checked at 1278px content width; all eight funnel views were checked in phone
mode, including responsive review/recovery, at 388px and again in a 360px browser
viewport with 331px frame content width. No horizontal overflow was observed;
visible buttons met the 44px minimum height in the narrow check.

Observed journeys include PDF-only selection and both declines, PDF-to-SPA and
home upgrades, separate Alby and x402 quote concepts, delivery navigation, and
expired-quote recovery. These observations verify a clickable visual prototype.
They do not verify product services, a physical device or a commercial launch.

# Design System: Natally prepaid offers and funnels

Scope: Google Stitch upsell and funnel screens, exported as a clickable visual
prototype. Robin clarified on 2026-10-15: do not implement product functionality.
No payment, wallet, account, chart, PDF-generation, inference or SPA logic is part
of this deliverable. Screen navigation and opening previews are prototype actions.

Governing convention retrieved from KStore on 2026-10-15:
`TOOLING_CONVENTIONS/stitch-first-ui-elucidation.md`, TC12 version 1.2,
2026-09-13. KStore's current text supersedes the older local mirror used at the
start of this turn. Stitch is explicitly requested for this work. Freeze the
working source export and screen journeys before any architecture or product
implementation; operator review of these screens is a later architecture gate.

## 1. Visual theme and atmosphere

Extend the existing Natally Natal Astrology Companion Stitch project
8460014353109836944. Preserve its celestial brass, dark observatory atmosphere
and supplied Natally mascot. Add the prepaid funnel without replacing existing
screens. Product name: Natally; studio means Gemini AI Studio only.

Use an intimate, precise editorial storefront: density 4/10, variance 6/10,
motion 3/10. A tangible natal-chart folio and the existing companion distinguish
the offers. The design must sell what the customer receives and make upgrades
understandable without implying subscriptions or unlimited usage.

## 2. Color palette and roles

- Observatory charcoal #18161B: page canvas, retaining the existing dark mood.
- Raised charcoal #242127: selected panels and order summaries.
- Starlight #F5F2E9: primary text, approximately white without glare.
- Ash #B8B2BA: secondary descriptions and field hints.
- Hairline #514953: dividers and quiet outlines.
- Celestial brass #C9AA60: the single accent, selected offer, primary action,
  focus and meaningful chart ornament. No neon or outer glows.

The supplied mascot is a brand image, not an additional interface accent.
Payment-provider names are text labels; never invent official approval badges.

## 3. Typography rules

Use Fraunces for storefront display headlines only, preserving Natally's
existing editorial character. Use Nunito Sans for body text, controls and forms;
IBM Plex Mono for order references and technical x402 labels. All software-like
checkout controls use sans-serif. No Inter or generic serif stacks.
Headlines use clamp(2rem, 5vw, 4.25rem), restrained tracking and 1.05 leading.
Body is at least 1rem with 1.55 leading and a 65-character line limit.

## 4. Component stylings

- Offer selector: asymmetric feature panel and stacked comparison rows, rather
  than three equal cards. Clearly mark the selected package and included output.
- Primary actions: one brass-filled action per decision region; 44px minimum
  target; visible focus; tactile 1px press. A quiet decline/back link is always
  available. No preselected paid upgrade or obstructive decline.
- Inputs: label above, helper below, inline errors. Intake is a visual screen
  only. Do not collect or transmit real personal data in the design prototype.
- Order summary: item, included deliverable, one-time/prepaid description,
  separate channel/payment method, and an explicit review before payment.
- Preview: readable sample folio with a sample-data label; no claim that the
  sample is the visitor's computed natal chart.
- Status: composed awaiting/confirmed/delivery/recovery screens with clear next
  actions; prototype annotations distinguish screen states from live settlement.

## 5. Layout principles

Use CSS Grid, maximum width 1320px, generous 24–48px internal gaps and border
dividers. The hero is a left-aligned split: customer promise on the left, chart
folio and supplied mascot on the right. Never overlap text and imagery.
Use one-column layouts below 768px, no horizontal overflow at 360px, 44px touch
targets and readable order summaries. Full-height uses min-height:100dvh.
Show progress as Choose / Details / Review / Receive; do not fabricate loading.

## 6. Motion and interaction

Restrained transform/opacity transitions, approximately 180ms. A quiet idle
mascot is allowed; no motion tied to invented processing progress. Respect
prefers-reduced-motion. Screen links demonstrate the funnel, not real services.

## 7. Anti-patterns

No neon, gradients on headline text, emoji UI, three equal pricing cards,
false scarcity, fabricated testimonials, fake marketplace approval, forced
subscriptions, hidden recurring payments, invented prices represented as final,
or unlimited companion claims. No new lore or voice implementation.

## 8. Offers and channels

Three offer names and boundaries:

1. Natal chart — PDF only: a downloadable natal reading/folio; no SPA access.
2. Natal chart — PDF + SPA: the PDF plus an interactive chart web experience.
3. Bring Natally home: the personal Natally SPA experience as the upsell.
   Do not imply unlimited inference, permanent hosting, or a fixed turn allowance.

Keep channels visibly separate: Alby marketplace / Lightning, x402 request-based
payment, and Natally direct. x402 must never be described as a Lightning wallet.
Use 'Price shown in your quote' until commercial pricing is supplied. Native
amount/asset/network/expiry fields are shown on the appropriate review screen,
with any illustrative value explicitly labelled sample. The prototype takes no
payments and provisions no provider or infrastructure.

## 9. Required screen journeys

- PREPAID-01: Direct offer comparison and entry to the three packages.
- PREPAID-02: PDF preview and optional PDF-to-SPA upgrade, with clear decline.
- PREPAID-03: Bring Natally home upsell and a clear keep-current-package action.
- PREPAID-04: Alby marketplace landing and Lightning-specific order review.
- PREPAID-05: x402 entry/request quote, authorization and response explanation.
- PREPAID-06: Birth-details/review screen, selected offer and correction path.
- PREPAID-07: Delivery/receipt screen for each package, download/open/home actions
  displayed as screen concepts only; no generated products or entitlements.
- PREPAID-08: Pending/expired/retry/resume screens explaining that a paid order
  is recovered rather than purchased twice.
- Mobile counterparts: offer selection, upsell, Alby and x402 review, delivery.

Export the Stitch-generated code and screenshot for each screen beneath
LIBS/UI/STITCH/screens/. Keep original exports and record their Stitch source.
Use Stitch's prototype links or equivalent screen links for the reviewable
funnel. Exported working prototype means navigable screens, not working paid
product functionality.

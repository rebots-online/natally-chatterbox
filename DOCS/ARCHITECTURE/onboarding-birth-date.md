# Onboarding birth-date repair

Released by Robin's 2026-10-12 report: neither keyboard nor picker opens; highest
priority. Repair the existing onboarding, not a new visual design or dependency.

15:53–15:56 amendment supersedes the original triplet proposal: one continuous
YYYYMMDD typing field with automatic separators and valid month/day prefixes;
an always-open inline calendar, tappable year header opening a year grid/direct
numeric year input, month selection and valid day buttons. No opening button or
dependency on native popup activation. This is an inline calendar using ordinary
HTML controls, not a claim that a native browser popup can be embedded. Both
entry paths feed the same strict validation; no keyboard is needed for taps.

15:58–15:59 final amendment: numeric keyboard requested automatically, visible
format YYYY/MM/DD, automatic slashes, inline calendar visible simultaneously.
FirstLight mounts the date form immediately (not after prompt animation), using
React flushSync for forward/back entry from the preceding user gesture; the
typed input autoFocus runs during that mount. Mobile OS/browser retains final
keyboard authority, so an always-visible tap calendar is the independent path.
Only validation output uses canonical YYYY-MM-DD for onCreate/chart calculation.

Observed mechanism: FirstLight renders only type=date; src/index.css globally
sets its calendar indicator to display:none and pointer-events:none !important.
The helper promises typing and a calendar without providing either independent
entry path. Android device behavior is user-reported, not agent-reproduced.
CodeGraph has no CSS/Markdown parser coverage; named CSS and contract reads were
necessary. FirstLight source was read through the verified graph.

## Entity contract

| Entity | Target | Signature and responsibility |
| --- | --- | --- |
| BirthDateParts | src/services/birthDate.ts:1 | string day/month/year fields; partial input is preserved |
| getBirthDateParts | src/services/birthDate.ts:7 | (value:string):BirthDateParts; split internal year-month-day draft |
| validateBirthDate | src/services/birthDate.ts:12 | (value:string,maxDate:string):{isoDate:string|null,message:string,invalid:boolean}; strict Gregorian day/month/leap-year and inclusive 1925-01-01..maxDate bounds; partial input has guidance, no invented date |
| getBirthMonthDays | src/services/birthDate.ts:12 | (year:number,month:number):number; Gregorian month lengths including century leap-year rules |
| formatBirthDateInput | src/services/birthDate.ts:17 | (value:string,previousValue:string):string; automatic year/month separators, reject impossible month/day prefixes; backspace across separators; no tab/focus jump |
| BirthDateFields | src/components/onboarding/BirthDateFields.tsx:4 | Controlled props value,onChange,disabled,describedBy,invalid,maxDate; continuous numeric text entry plus always-open calendar; view/year selection state independent of committed date; month names Jan..Dec; all calendar buttons type=button; emit selected ISO or partial typed draft |
| FirstLight | src/components/onboarding/FirstLight.tsx:82 | Use fields and validator; Next only for valid ISO date; onCreate canonical ISO; preserve partial/full answers on Back; associate validation message with fields; remove misleading calendar hint and date decorative caret |
| first-light__birth-date | src/components/onboarding/first-light.css:1 | Responsive inline calendar, min-width:0, >=16px input type, 44px button heights, visible caret/focus, native month select affordance; no overlay intercepts taps; short viewport scrolls |

Remove the global calendar-indicator hiding rules in src/index.css so other
native date/time inputs retain their intended affordance. Keep unrelated layout,
authentication, inference, voice, time entry, date bounds and typewriter behavior.

## Verification

tests/birth-date.test.ts: Node tests for incomplete drafts, sequential edits,
corrections, leap years, impossible/zero/overflow dates, inclusive bounds,
ISO serialization, controls/labels/keyboard hints, handler preservation and
disabled state. Run all tests, TypeScript, production build and diff check.
Automated assertions do not establish physical keyboard behavior.

## Operator verification protocol

On Android Chrome, entering the birth-date page requests the numeric keyboard
while the inline calendar is already present. Type 19751110: 1975/11/10 appears. Independently,
without a keyboard, tap calendar year, scroll/tap 1975, choose Nov and day 10.
Also type a year in the year panel. Valid date enables Next, moves to birthplace;
Back preserves it. Invalid February 30 stays at date with an explanation; fix it
and continue. Repeat with keyboard open/closed and on desktop. Publication
requires GitHub push verification and production asset-byte verification;
record unavailable browser/device verification honestly.

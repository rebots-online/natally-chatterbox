Refresh and follow all conventions in `/home/robin/Admin-Manual`, the global single source of truth.

# Natally

Robin's terminology correction, 2026-10-12: "studio" refers only to Gemini AI
Studio, not a separate product or edition. The product is Natally; the repository
name remains natally-ai-studio. Kintsugi-alby is a separate checkout containing
planning material, not evidence of a second product. Work state is in CHECKLIST.md;
hosted deployment and observed verification are in HOSTED_CHAT.md. Calculation
tool contracts are documented in DOCS/CALCULATION-API.md.

Robin's standing instruction, 2026-10-12: commit and push every completed task
before ending the turn. Verify the remote commit; a local commit or production
deployment is not Git publication. Preserve concurrent changes, never force-push,
and exclude credentials, downloaded models and local indexing artifacts. If a
push fails, report the exact publication gap rather than imply completion.
The configured GitHub origin is the publication destination for this checkout;
do not probe unavailable Forgejo.

Begin each turn with the colour-coded remaining-work list in CHECKLIST.md.
Colours identify subproject divisions, not phases or urgency (Robin 15:50):
red onboarding/mobile, blue readings/inference, purple voice, green accounts/sync,
yellow billing/Alby, brown launch/infrastructure, white deferred character lore.
Keep implementation, tests, runtime/device verification and publication distinct.
Do not implement deferred SOUL/two-lore work without a new instruction.
The grouped Alby-first launch roadmap is DOCS/ALBY-LAUNCH-ROADMAP.md. It preserves
the existing queue, labels unverified work, and records "injection moulting" as
the pre-model/agent-abuse security workstream. Roadmap rows are not released coder
contracts or authorization to provision providers, spend funds or submit listings.

Infrastructure boundary reaffirmed by Robin 2026-10-12: do not introduce cloud
providers or material external dependencies ad hoc. Obtain explicit approval for
provider, ownership, cost and operational changes. The hosted API belongs on
Oracle Cloud Always Free infrastructure. Existing Netlify deployment is temporary
migration debt, not the approved target. Preserve live service until an approved
Oracle target is configured, verified and cut over; do not silently delete it.

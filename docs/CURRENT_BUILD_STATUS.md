# SATprep.io Current Build Status

Updated: 2026-08-25

## Current state
SATprep.io remains a pre-launch commercial candidate. Public indexing, live payments, first-party measurement, paid media, outbound email, public social publishing, and external campaign activation remain disabled behind explicit launch gates.

## Completed / committed
- Secure server-scored diagnostic and guided-practice architecture is committed, including MCQ and Math SPR handling, durable resume, idempotent response handling, adaptive practice bands, practice rotation, and exact-hash content approval checks.
- Commercial content policy now requires at least 6 approved diagnostic items and 8 approved practice items per skill with required difficulty coverage before launch readiness can be claimed.
- Proprietary-content import rejects duplicate and very-high-similarity items, including cross-use between diagnostic and practice banks.
- Sensitive diagnostic/practice answer material remains server-only; candidate-scoped reads avoid full proprietary-store scans.
- Trusted-learning-authority and marketing-event privilege-lock migrations are staged but must not be applied until the live backend is reconciled and verified.
- A server-mediated parent progress endpoint now aggregates household-scoped learning state and uses only server-scored practice-response accuracy; it does not expose raw answers, explanations, response text, or answer keys.
- Production builds now validate the parent-progress privacy/security contract in addition to existing content, security, privacy, accessibility, adaptive-practice, launch, and regression gates.

## Live backend status
The intended production backend is Supabase project `ataaiocpbjavmdpgmzlv`. Supabase management access is currently intermittent/unavailable to the automation runtime, so no migration is claimed live unless explicitly verified against that exact project. No other Supabase project may be restored, migrated, or modified.

## Immediate next actions
1. Retry Supabase management access to `ataaiocpbjavmdpgmzlv`; reconcile live migration history before applying anything.
2. If available, apply only missing migrations in dependency order, run security/performance advisors, and execute the read-only backend/content verifiers.
3. Complete client adoption of server-mediated parent progress so commercial parent reporting no longer relies on legacy browser-side attempt aggregation.
4. Continue expanding fresh private commercial content toward the 6-diagnostic / 8-practice per-skill policy, with independent review and Math SPR representation where appropriate.
5. Run full end-to-end parent → student → prior assessment → diagnostic → learning path → guided practice → mastery → parent reporting regression with fresh test accounts.
6. Keep public launch, live billing, measurement, advertising, outreach, and external publishing disabled until explicit approval and remaining gates are cleared.

# SATprep.io Current Build Status

Updated: 2026-08-25

## Current state
SATprep.io remains a pre-launch commercial candidate. Public indexing, live payments, first-party measurement, paid media, outbound email, public social publishing, and external campaign activation remain disabled behind explicit launch gates.

## Completed / committed
- Secure server-scored diagnostic and guided-practice architecture is committed, including MCQ and Math SPR handling, durable resume, idempotent response handling, adaptive practice bands, practice rotation, and exact-hash content approval checks.
- Commercial content policy requires at least 6 approved diagnostic items and 8 approved practice items per skill with required difficulty coverage before launch readiness can be claimed.
- Proprietary-content import rejects duplicate and very-high-similarity items, including cross-use between diagnostic and practice banks.
- Commercial review independence is now technically enforced in the private import path: each item requires at least three distinct reviewer labels across accuracy, alignment, editorial, bias/accessibility, and originality, and no reviewer may approve more than two dimensions on the same item. The strict live-content verifier independently checks the same reviewer-diversity rule before launch readiness can pass.
- A metadata-only private content readiness preflight now reports per-exam/per-skill diagnostic and practice depth, difficulty distribution, Math SPR counts, excluded rows, and shortfalls without printing proprietary question text or requiring the content file to enter the public repository.
- Sensitive diagnostic/practice answer material remains server-only; candidate-scoped reads avoid full proprietary-store scans.
- Trusted-learning-authority and marketing-event privilege-lock migrations are staged but must not be applied until the live backend is reconciled and verified.
- Parent reporting is server mediated end to end: the browser requests household-scoped summaries through `/api/parent-progress`, accuracy is based only on server-scored guided-practice responses, and the parent UI no longer directly aggregates legacy `question_attempts`, `skill_mastery`, or `lesson_progress` tables.
- Administrator operations are server mediated through `/api/admin-overview`; broad operational-table reads were removed from the browser, the API requires the administrator role and rate limiting, and the client receives only the presentation data needed for the operations dashboard.
- Production builds validate parent-progress, administrator-operations, private-content workflow, content policy, security, privacy, accessibility, adaptive-practice, launch, and regression contracts.

## Live backend status
The intended production backend is Supabase project `ataaiocpbjavmdpgmzlv`. Supabase management access is currently intermittent/unavailable to the automation runtime, so no migration is claimed live unless explicitly verified against that exact project. No other Supabase project may be restored, migrated, or modified.

## Immediate next actions
1. Retry Supabase management access to `ataaiocpbjavmdpgmzlv`; reconcile live migration history before applying anything.
2. If available, apply only missing migrations in dependency order, run security/performance advisors, and execute the read-only backend/content verifiers.
3. Continue authoring and independently reviewing fresh private commercial content toward the 6-diagnostic / 8-practice per-skill policy, using the private readiness preflight to target exact skill/difficulty gaps and Math SPR representation.
4. Run full end-to-end parent → student → prior assessment → diagnostic → learning path → guided practice → mastery → parent reporting regression with fresh test accounts.
5. Verify the staged trusted-learning-authority lock against live server-scored practice/diagnostic behavior before removing legacy browser write authority.
6. Keep public launch, live billing, measurement, advertising, outreach, and external publishing disabled until explicit approval and remaining gates are cleared.

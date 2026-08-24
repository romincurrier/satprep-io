# SATprep.io Autonomous Build Status

Last updated: 2026-08-24

## Completed in current build cycle
- Reverified the current public College Board Digital SAT Suite structure and skill taxonomy before continuing content work.
- Added `sat-spec.js` with the four Reading & Writing domains, four Math domains, official skill points, SAT/PSAT eligibility differences, domain distributions, and test timing/question counts.
- Added a proprietary diagnostic bank aligned to the official skill taxonomy, with development coverage across every official skill point. All development items remain `internal_review`, not production-approved.
- Added automated content validation to the production build. A build fails for duplicate IDs, broken answer keys, invalid taxonomy, missing explanations, invalid exam eligibility, missing official-skill coverage, invalid diagnostic blueprints, or exact diagnostic/practice duplicates in the staged QA pool.
- Added `diagnostic-blueprint.js`: deterministic, evidence-aware, exam-eligible 20-item diagnostic planning with coverage across all eight major domains and targeted emphasis from prior-assessment evidence.
- Added a secure content-system migration that separates item prompts from answer keys and is designed for server-side diagnostic scoring so correct answers do not need to ship to the browser.
- Added authenticated server-side diagnostic session, item-delivery, and scoring endpoints. The browser receives the prompt and answer choices but not the answer key or explanation during diagnostic assessment.
- Added `diagnostic-router.js`. New diagnostic attempts use the secure v3 engine, while an already-open legacy attempt automatically falls back to the legacy engine so saved progress/question IDs are preserved.
- The secure diagnostic remains assessment-only: no correct/incorrect feedback is returned during the initial diagnostic.
- Added official-taxonomy instruction/practice architecture through `skill-guides.js`, `practice-bank.js`, and `learning-v2.js`. Practice sessions show the correct answer and instructional explanation after every answer, while the diagnostic remains assessment-only.
- Authored 31 additional SATprep.io-original practice items in `practice-bank-extra.js`, bringing the staged development practice pool to 62 items and providing a second authored item for every official skill point.
- Isolated the staged-bank validation failure to one exact overlap: staged item `p-m-118` duplicated the existing diagnostic triangle-angle item. Added an auditable staged override with different values/answer choices. Full staged-bank validation now passes with 62 original practice items and at least two items per official skill point.
- Kept the new 31-item expansion behind the QA gate. The student-facing learning engine continues using the previously validated base practice bank until independent review is completed.
- Added `scripts/content-readiness.mjs` / `npm run content:readiness` to report diagnostic depth, student-facing vs staged practice depth, difficulty coverage, and production-approval depth by official skill.
- Added `scripts/export-content-review.mjs` / `npm run content:review-export` to generate an independent-review CSV covering question text, answers, explanations, taxonomy, difficulty, exam eligibility, and reviewer decision fields for accuracy, alignment, editorial, bias/accessibility, originality, and notes.
- Added `content-approval-registry.json` plus `content:review-apply` and build-time `validate:approvals`. Human approvals are now pinned to the SHA-256 hash of the exact reviewed item; any later edit invalidates the approval and fails the build until the item is re-reviewed or the stale approval is removed.
- Updated the readiness report to count only hash-valid human approvals instead of trusting a source-code status label.
- Added `docs/CONTENT_REVIEW_RUNBOOK.md` with reviewer qualifications, five review dimensions, revision/rejection handling, hash-pinned release behavior, and launch sign-off requirements.
- Added initial SEO crawl infrastructure: `public/sitemap.xml` plus existing robots directives, and created indexable SAT prep, PSAT prep, parent, methodology, content-quality, FAQ, Math, Reading & Writing, study-plan, and SAT-vs-PSAT pages with canonical metadata, search descriptions, Open Graph metadata, structured data, useful educational copy, and clear non-affiliation/trademark language.
- Added automated SEO validation and security-invariant validation to the build pipeline.
- Repeatedly verified Vercel builds during content QA; the latest repository build is green.

## Current infrastructure finding
- The connected Supabase project `nrjqykfrnfrgyuvprwob` currently reports status `INACTIVE`. This explains the recent database-management timeouts and prevents reliable live end-to-end database verification.
- The project was **not** restored automatically because restoring a hosted database can affect billing/operational state and the autonomous build is not authorized to incur cost or make that external decision.
- Repository/database migrations remain prepared and can be verified/applied once the project is intentionally active again.

## Deliberately not changed yet
- An already active legacy diagnostic remains on its saved legacy question plan until it is completed. New attempts route to the secure official-taxonomy engine.
- No question or practice item has been promoted through the new human-approval registry. Commercial launch requires independent accuracy, answer-key, alignment, originality, accessibility/bias, and editorial review.
- The additional 31 practice items pass automated structural/cross-bank validation but remain staged, not student-facing, until independent human content review is complete.
- The secure content-system and marketing-measurement SQL are committed but live application remains unconfirmed while Supabase is inactive.
- Legal/privacy pages have not been published as final policies; minor-data/COPPA and broader privacy terms still require deliberate launch review.
- No live payments, public campaigns, paid media, prospect emails, public-account creation, or irreversible marketing actions have been enabled.

## Highest-priority next actions
1. Once Supabase is intentionally active, run live end-to-end tests of the secure v3 diagnostic with a fresh test student and confirm resume behavior across windows/devices.
2. Apply/verify the content-system and marketing-measurement migrations, then rerun Supabase security/performance advisors.
3. Obtain independent human review on the exported content sheet and apply only hash-valid approvals through the registry workflow.
4. Continue expanding diagnostic and practice depth toward launch targets with multiple difficulties, contexts, and distractor patterns per skill.
5. Add API abuse/rate-limit hardening and verify that answer keys and service-role access cannot be reached from the browser.
6. Complete regression testing across student, parent, admin, onboarding, billing, assessment, learning, and progress flows.
7. Continue SEO architecture with supporting content clusters, internal linking, technical metadata checks, analytics events, conversion funnels, and compliant lifecycle messaging.
8. Continue the campaign operating plan and marketing asset matrix for organic search, content, email, social, partnerships/referrals, paid media, and attribution without activating spend or outbound campaigns.

## Commercial launch gates that remain open
- Independent content review and calibration.
- Adequate question-bank depth and rotation to prevent memorization/reuse.
- Full end-to-end regression across student/parent/admin/billing flows.
- Active/verified production database and applied migrations.
- Minor-data/privacy/legal review and production data-retention policy.
- Final RLS/API authorization/rate-limit review and production smoke test.
- Full SEO, analytics, marketing attribution, lifecycle email, and paid/organic campaign implementation.

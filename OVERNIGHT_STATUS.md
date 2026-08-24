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
- Supabase security and performance advisors currently report no advisory lints. Direct schema/migration queries are intermittently timing out, so the content-system migration's live-database status remains unconfirmed.
- Added initial SEO crawl infrastructure: `public/sitemap.xml` plus existing robots directives, and created indexable SAT prep, PSAT prep, and parent-focused landing pages with canonical metadata, search descriptions, Open Graph metadata, structured data, useful educational copy, and clear non-affiliation/trademark language.
- Repeatedly verified Vercel builds during content QA; the repository was returned to a green deployment after each diagnostic probe.

## Deliberately not changed yet
- An already active legacy diagnostic remains on its saved legacy question plan until it is completed. New attempts route to the secure official-taxonomy engine.
- No question or practice item has been promoted to `production_approved`. Commercial launch requires independent accuracy, answer-key, alignment, originality, accessibility/bias, and editorial review.
- The additional 31 practice items pass automated structural/cross-bank validation but remain staged, not student-facing, until independent human content review is complete.
- The secure content-system SQL is committed but live application remains unconfirmed because Supabase database-management queries are timing out. The secure v3 API can continue using the server-bundled proprietary bank while this is pending.
- Legal/privacy pages have not been published as final policies; minor-data/COPPA and broader privacy terms still require deliberate launch review.
- No live payments, public campaigns, paid media, prospect emails, or irreversible marketing actions have been enabled.

## Highest-priority next actions
1. Run live end-to-end tests of the secure v3 diagnostic with a fresh test student and confirm resume behavior across windows/devices.
2. Continue expanding diagnostic and practice depth toward launch targets with multiple difficulties, contexts, and distractor patterns per skill.
3. Build the independent-review workflow/item QA dashboard so only `production_approved` material can enter public sessions.
4. Apply/verify the content-system migration when Supabase database connectivity is stable, then rerun security and performance advisors.
5. Add API rate limiting/idempotency hardening and verify that answer keys and service-role access cannot be reached from the browser.
6. Complete regression testing across student, parent, admin, onboarding, billing, assessment, learning, and progress flows.
7. Continue SEO architecture with supporting content clusters, internal linking, technical metadata checks, analytics events, conversion funnels, and compliant lifecycle messaging.
8. Build the campaign operating plan and marketing asset matrix for organic search, content, email, social, partnerships/referrals, paid media, and attribution without activating spend or outbound campaigns.

## Commercial launch gates that remain open
- Independent content review and calibration.
- Adequate question-bank depth and rotation to prevent memorization/reuse.
- Full end-to-end regression across student/parent/admin/billing flows.
- Minor-data/privacy/legal review and production data-retention policy.
- Final RLS/API authorization/rate-limit review and production smoke test.
- Full SEO, analytics, marketing attribution, lifecycle email, and paid/organic campaign implementation.

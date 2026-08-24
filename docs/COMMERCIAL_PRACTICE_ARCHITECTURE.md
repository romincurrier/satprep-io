# SATprep.io Commercial Practice Architecture

Status: **IMPLEMENTED IN CODE, DATABASE MIGRATION NOT YET ACTIVATED**

## Purpose
Commercial learning/practice must do more than show explanations. It must preserve reliable progress, keep proprietary scoring material out of browser bundles, survive refreshes/new browser windows, adapt practice difficulty to demonstrated readiness, and prevent a learner from directly writing an inflated mastery score.

The current prelaunch product therefore has two practice paths:

1. **Commercial server practice v3** — the intended launch path. Questions are selected from server-only, independently reviewed `practice` content. One safe question is delivered at a time. The server scores the answer, then returns correctness, the correct answer, and the instructional explanation. Session progress is persisted server-side and resumes at the next unanswered item.
2. **Prelaunch browser QA fallback** — the older practice flow used only while `window.__SATPREP_PRELAUNCH__ === true`. It keeps current internal testing usable while Supabase is inactive. When public/commercial mode is enabled, the UI fails closed instead of falling back to browser-scored questions.

## Server-side data model
Pending migration: `migrations/20260824_practice_sessions.sql`

### `practice_sessions`
Stores the student, official skill, target exam, session status, content version, **trusted mastery baseline before the session, adaptive planning band**, completion score, mastery-after value, and timestamps. Persisting the planning inputs makes a resumed session auditable and prevents the displayed adaptive level from drifting if mastery changes elsewhere while an unfinished session exists.

### `practice_session_items`
Stores the immutable question order for a session. The browser cannot read the whole plan.

### `practice_responses`
Stores only trusted server-scored responses. Browser roles have no table access.

All three tables have RLS enabled and explicit `public`, `anon`, and `authenticated` table privileges revoked. Application access is through authenticated server routes using the service role.

## Content requirements
Commercial practice uses the same server-only content bank foundation as secure diagnostics, but an item must have `content_type='practice'`.

An eligible item must be:
- active;
- `production_approved`;
- MCQ format for the current v3 flow;
- eligible for the learner's target exam;
- assigned to the requested official skill;
- backed by a server-only answer key/explanation; and
- currently approved for accuracy, SAT/PSAT alignment, editorial quality, bias/accessibility, and originality.

Every approval is SHA-256 hash-pinned to the exact current practice prompt, choices, answer, explanation, taxonomy, difficulty, and exam eligibility. If the content changes after review, delivery/scoring fails closed until the new content is reviewed.

## Mastery-adaptive question selection
Commercial practice uses the learner's current trusted `skill_mastery` estimate when building a **new** five-question session. The pure selection logic lives in `practice-selection-core.js` and is covered by a production-build regression test.

The current non-psychometric instructional bands are:
- **Foundation** (`mastery < 40%`): target mix 1, 1, 2, 2, 2;
- **Balanced** (`40%–74%`, or no trusted baseline): target mix 1, 2, 2, 2, 3; and
- **Challenge** (`75%+`): target mix 2, 2, 2, 3, 3.

These bands adjust practice difficulty only. They are not SAT score predictions, do not claim College Board calibration, and must remain subordinate to later empirical item calibration and independent content review.

Selection still prefers questions the learner has not seen in the most recent response history. If the approved fresh pool does not contain the ideal difficulty mix, the selector falls back to the nearest available difficulty without duplicating an item. The selected `mastery_before` and `adaptive_band` are persisted with the session. Existing in-progress sessions remain immutable so a refresh/new browser window resumes the exact saved plan and the original planning provenance rather than regenerating questions from a newer mastery value.

For full coverage of all current five-question bands **without fallback**, each skill should ultimately have at least two approved difficulty-1 items, three approved difficulty-2 items, and two approved difficulty-3 items available for rotation. `npm run content:readiness` now reports this approved adaptive-mix gate separately from simple item-count depth.

## API flow
### Start/resume
`POST /api/practice-session-v3`

Input: `skill_key`.

The server validates the authenticated student, target-exam eligibility, commercial practice schema, reviewed content depth, current trusted mastery, and any existing open session. If an open session exists and its items are still approved, the same session is returned with the saved answered count and the adaptive band originally stored with that plan. New sessions persist both the pre-session mastery and the resulting instructional band. The response includes the instructional adaptive level (`foundation`, `balanced`, or `challenge`) for UI context.

### Deliver question
`GET /api/practice-item-v3?session_id=...&position=...`

The server verifies ownership, active session status, saved question order, current unanswered position, and current content approval. The response includes only the safe question projection. It does **not** include the answer key or explanation.

### Score + teach
`POST /api/practice-answer-v3`

Input: session ID, position, selected answer, response time.

The server verifies the saved plan and current reviewed scoring material, stores a server-scored response, and only then returns:
- correct/incorrect;
- selected answer;
- correct answer index/text;
- explanation;
- saved progress/next position; and
- final session score/mastery when the session completes.

Submissions are idempotent for the same saved answer. A submitted answer cannot later be changed.

## Atomic mastery finalization
`public.finalize_practice_session(uuid)` is a service-role-only database RPC.

It locks the practice session row, verifies that every planned item has a trusted response, computes the session score, updates `skill_mastery`, updates `lesson_progress`, and marks the session complete in one database transaction. If the final answer request is retried, a completed session returns its stored result instead of counting the practice twice.

This replaces the launch-risky pattern where browser JavaScript directly calculates and writes its own mastery value.

## Resume behavior
Because the question plan, planning provenance, and responses are server-side, a learner can:
- refresh the page;
- close the browser;
- open a new browser window; or
- return later on the same account

and the server can resume at the next unanswered practice item without relying on in-memory browser state or silently changing the adaptive plan.

## Prelaunch fallback rule
`prelaunch-guard.js` exposes `window.__SATPREP_PRELAUNCH__` from the same explicit commercial-launch switch currently keeping public billing disabled.

`learning-v2.js` tries server practice first. If the server practice migration/content is not ready:
- **prelaunch:** internal browser-scored QA practice may continue so product testing is not blocked;
- **commercial/public mode:** the learning UI displays an error and does not fall back to browser-scored practice.

This is enforced by `scripts/validate-practice-security.mjs` in every production build. Adaptive selection is independently regression-checked by `scripts/validate-adaptive-practice.mjs`; the practice-security validator also enforces persistence of the mastery/adaptive planning provenance.

## Activation checklist
Do not treat server practice as live merely because the code exists. Before activation:
1. intentionally reactivate the Supabase project;
2. apply and verify the content-system and practice-session migrations;
3. establish the private proprietary-content boundary;
4. import fresh/eligible independently reviewed practice content with hash-matching approval rows and enough difficulty distribution for adaptive selection;
5. test foundation/balanced/challenge selection, stored planning provenance, session start, resume, item delivery, correct and incorrect feedback, idempotent retries, finalization, mastery updates, revoked-review behavior, 429 rate limits, and 503 fail-closed behavior;
6. verify browser roles cannot query practice session/response/content tables directly;
7. verify the public/commercial launch switch disables the browser-scored fallback before launch.

## Remaining content-depth gate
The server currently requires at least five independently reviewed eligible questions to open a practice session. The broader internal commercial-readiness target remains at least eight practice items per official skill, with enough reviewed difficulty distribution to support foundation/balanced/challenge rotation without repeatedly falling back to the same narrow pool.

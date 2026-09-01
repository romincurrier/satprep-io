# SATprep.io Live Family Pilot Runbook

Updated: 2026-09-01

## Purpose

The live family pilot exercises the normal parent and student customer journey while keeping the family unmistakably test-only. It does not enable live billing, public billing, public indexing, marketing measurement, outbound marketing, or production approval/activation of proprietary content.

## Journey under test

1. Parent opens a one-time high-entropy pilot link and creates a normal parent/guardian account.
2. After authentication, the pilot token is claimed and the parent profile plus household are marked test-only.
3. Parent creates the child through the normal family setup UI.
4. The child record is marked `is_test_student=TRUE` with a `live-pilot:<enrollment-id>` label.
5. Parent activates the student's normal login. The subscription prerequisite is bypassed only when parent, household, student, and claimed pilot enrollment all match the live-pilot boundary.
6. Student signs in, completes the normal learner profile and is routed to the internal original QA diagnostic bank because the student is test-only.
7. The diagnostic writes the normal diagnostic attempt/response records, calculates strengths and priorities, and establishes initial mastery.
8. The pilot bridge promotes the diagnostic priority list into the field consumed by the adaptive learning-path UI.
9. Student completes normal teaching material and practice sessions. Question attempts, lesson progress and skill mastery are saved normally.
10. The Journey system computes milestones, XP, levels and achievements from diagnostic completion, lesson completion and mastery.
11. An administrator monitors the run at `/live-pilot-monitor.html`; the page refreshes operational state every five seconds.

## Evidence accounting

- A browser checkpoint may be reported as `PASS` only when that checkpoint was exercised by the current run. Historical evidence from an earlier browser run must not be carried forward as a current-run pass.
- The direct/downstream self-pilot continuation intentionally records `browser_parent_signup_screen=FAIL` when it does not re-exercise the signup screen, and it continues to record `browser_parent_signup_completion=FAIL` while normal signup remains blocked by the email-delivery limiter.
- `downstream_overall` evaluates only the downstream checkpoints actually exercised after the test-only provisioning boundary; it excludes both signup checkpoints rather than converting historical signup evidence into fresh evidence.
- `signup_overall` remains separate and must not be inferred from a downstream pass. A downstream pass therefore proves the executed parent-login-through-parent-progress path, not completion of normal parent signup.
- Administrator monitoring remains a separate authenticated-admin acceptance surface. The self-pilot must not manufacture or elevate a synthetic administrator merely to turn that checkpoint green.
- Administrator monitoring must attribute learner state only to the exact selected `live-pilot:<enrollment-id>` student label. Household membership or a generic `is_test_student=TRUE` marker is not sufficient evidence because a test household can contain more than one student record.
- The commercial-content database checkpoint is a launch-safety check, not an empty-table check. It fails when any commercial `content_items` row is active without `qa_status='production_approved'`. Inactive reviewed/staged rows and inactive approved rows do not by themselves fail the pilot. The pilot still may not create, approve, import, activate, or otherwise mutate commercial content.

## Safety boundary

- `pilot_enrollments` is service-only, RLS-enabled and has no browser policies or anon/authenticated grants.
- Pilot enrollment requires a one-time high-entropy token plus an authenticated parent account.
- The pilot billing bypass applies only when the parent is test-marked, the household is test-marked, the student is test-marked, the student's `test_label` matches the claimed enrollment, and that enrollment is still `claimed`.
- Only a live-pilot test student is routed to the internal QA/legacy assessment path.
- Commercial `content_items`, answer-key review state, `production_approved`, and activation state are never changed by the pilot.
- The monitor is administrator-only and does not return account passwords or answer keys.

## What a successful pilot proves

The run validates only the checkpoints actually exercised in that run: account/linking flow after the applicable entry point, diagnostic persistence, adaptive priority propagation, learning-material experience, practice persistence, mastery changes, Journey progression and parent visibility. Normal signup and administrator monitoring must be evidenced separately when they are not executed in the same run. A pilot does not by itself approve commercial question content, validate final pricing/legal language, enable live billing, or complete the final secure-v3 reviewed-content acceptance gate.

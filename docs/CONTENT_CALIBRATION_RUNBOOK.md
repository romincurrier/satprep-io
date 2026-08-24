# SATprep.io Content Calibration Runbook

Last updated: 2026-08-24

## Purpose
Independent editorial/content review answers whether an item is accurate, aligned, original, accessible, and well written. Operational calibration answers a different question: how does the item behave when real students encounter it under controlled conditions?

SATprep.io should use both. Operational statistics are screening evidence, not an automatic substitute for qualified psychometric judgment.

## Prerequisites
1. `20260824_content_system.sql` is applied.
2. `20260824_content_calibration.sql` is applied.
3. Secure-v3 diagnostic responses are written with `content_item_id` and `scored_by_server=true`.
4. Diagnostic finalization counts only server-scored rows linked to the server-selected item.
5. Only completed secure-v3 attempts enter the calibration views.

## Available server-only metrics
`content_item_calibration_v` contains aggregate item data without student identifiers:
- item ID;
- section, domain, skill, and authored difficulty;
- response count;
- facility (proportion correct);
- mean and median response time;
- correlation between item correctness and the completed section score;
- answer-choice selection counts;
- first and last observed timestamps.

`content_skill_calibration_v` aggregates response count, facility, and response time by section, domain, skill, and authored difficulty.

Both views are revoked from `anon` and `authenticated`; only the service role receives SELECT permission.

## Standard review cadence
### Before public launch
Run a calibration review after each meaningful pilot cohort once enough secure-v3 responses exist. Do not claim calibrated difficulty or score prediction from tiny samples.

### After launch
Review at least monthly during active testing seasons and after any material content-bank change. Immediately review an item after a credible content-error report.

## Screening thresholds
The report command uses conservative screening flags:
- facility below 0.20 or above 0.90 after at least 50 responses;
- section-score correlation below 0.10 after at least 100 responses.

These are **review triggers**, not automatic rejection thresholds. An intentionally easy item may correctly have high facility; a narrowly targeted item can behave differently across populations. Sample composition matters.

Run:

`npm run content:calibration`

The command requires server-side `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables. Never place the service-role key in browser code, public logs, spreadsheets, or reviewer exports.

## Review workflow for a flagged item
1. Confirm the sample size and testing population are sufficient for interpretation.
2. Re-run independent answer-key/accuracy review without showing the operational flag first if feasible.
3. Inspect distractor selection counts. A distractor that no one chooses may be implausible or stylistically weak.
4. Compare response time with the intended task complexity.
5. Inspect whether the item is disproportionately exposed to one proficiency group because of routing.
6. Check for wording ambiguity, hidden assumptions, accessibility barriers, and alternate valid answers.
7. Decide: keep, revise, change authored difficulty, restrict eligibility, collect more data, or retire.
8. Any stem/choice/explanation/taxonomy edit changes the content hash and therefore requires fresh independent approval through the approval registry.

## Difficulty calibration
Authored difficulty labels (1–3) are content-development expectations, not psychometrically calibrated claims. Do not convert facility directly into SAT scaled-score claims.

Before SATprep.io describes an item as empirically easy/medium/hard in production, require:
- sufficient observations across relevant proficiency ranges;
- stable behavior across more than one cohort/time period;
- review of routing/exposure effects;
- qualified psychometric sign-off on the calibration method.

## Score-model guardrail
Diagnostic percent-correct values and mastery estimates are internal learning signals. They are not SAT or PSAT scaled-score predictions unless a separately validated score model has been developed and approved.

Do not market phrases such as “predicted SAT score,” “guaranteed increase,” or “X-point improvement” without appropriate validation and review.

## Data/privacy rule
Calibration views contain aggregate item statistics only. Do not add names, emails, household IDs, raw prior-testing documents, marketing identifiers, or other unnecessary student information to calibration exports.

If subgroup fairness analysis is later introduced, design it through a separate privacy/legal review with minimum-cell-size protections and a documented legitimate purpose.

## Launch gate
Commercial question-bank readiness requires all of the following:
- hash-valid independent content approvals;
- adequate item depth/rotation by official skill and difficulty;
- no unresolved high-severity content-error reports;
- operational monitoring capable of detecting abnormal item behavior;
- a documented retirement/revision process;
- no unsupported psychometric or score-improvement claims.

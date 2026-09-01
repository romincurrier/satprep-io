# SATprep.io Content Staging Runbook

Updated: 2026-09-01

This runbook governs the private SAT/PSAT expansion workbook used for unapproved staging and advisory AI review. It does not authorize commercial approval, import, activation, or publication.

## Hard gates

- Keep every authored or AI-revised item `qa_status='draft_unreviewed'` and `production_approved=FALSE` until independent human review satisfies the commercial reviewer-independence policy.
- Advisory AI review is never a substitute for human approval.
- Do not import or activate staged content during authoring/AI-QA cycles.
- Preserve exact exam eligibility, taxonomy, response format, answer key, explanation, and canonical SHA-256 binding for the version actually reviewed.
- Keep cross-bank duplicate screening open until the separately staged legacy bank is accessible and compared.

## Workbook ownership rules

The current expansion workbook contains `Questions`, `Coverage`, `Instructions`, `Review Guide`, `AI Review`, and `AI Review Summary` tabs.

On `Questions`, authored content and the canonical `content_hash` may be updated for an unapproved item. Do not write approval metadata into the human-review columns during AI QA.

On `AI Review`, **columns A and C:J are formula-owned array outputs sourced from `Questions`**. Column B (`content_hash`) and columns K:Y (AI decision/review fields) are the writable advisory-review fields. Do not paste a full A:Y row into `AI Review`: doing so blocks the array formulas and can blank formula-derived metadata elsewhere in the sheet.

Safe advisory update sequence:

1. Read the current `Questions` row and matching `AI Review` row before changing anything.
2. Revise only the unapproved question fields that require repair.
3. Recompute the canonical SHA-256 hash using `canonicalReviewContent` semantics from `content-integrity.js`.
4. Write the revised question plus `Questions.content_hash`.
5. Write only `AI Review!B` and `AI Review!K:Y` for that row. Leave `AI Review!A` and `AI Review!C:J` untouched so the source array formulas continue to spill.
6. Re-read the complete target row and verify the formula-owned metadata, review hash, and question hash match.

If a formula-owned cell is accidentally overwritten, clear the conflicting user-entered value rather than recreating the derived metadata manually. Confirm the source `ARRAYFORMULA` in row 2 resumes expansion before any further edits.

## Mandatory post-write regression

After every content write:

- Confirm `AI Review Summary` still reports 434 staged rows, 434 AI-reviewed rows, and 0 remaining unless the planned change explicitly changes those counts.
- Confirm `Questions.production_approved` contains no TRUE value for unapproved expansion content.
- Search the workbook for `#REF!` and other spreadsheet error values.
- Verify the edited `Questions.content_hash` exactly matches the matching `AI Review.content_hash`.
- Recompute the canonical hash from the stored/displayed question values, not from a pre-write local draft.
- Verify answer-key uniqueness and ambiguity, section/domain/skill alignment, exam eligibility, editorial/accessibility quality, and advisory difficulty.
- Run exact/near-duplicate screening at the importer threshold (0.96 token Jaccard) within the affected skill and retain the broader within-bank duplicate guard.
- Keep AI difficulty calibration explicitly advisory and escalate stronger/harder items for independent human review rather than treating AI confidence as approval.

## Difficulty and construct QA

Use current College Board SAT Suite specifications to confirm the skill construct and official-style question behavior. Difficulty should arise from the reasoning required, evidence integration, abstraction, distractor quality, or multi-step interpretation—not merely longer wording or more arithmetic. Preserve useful Easy anchors, and rebuild under-difficulty Medium/Hard items rather than relabeling them without substantive change.

For Reading and Writing Inferences, the current official-style stem is `Which choice most logically completes the text?`; items should require a defensible inference from stated and implied evidence. Medium/Hard coverage should include meaningful synthesis and plausible competing interpretations, with causal or chronological claims appropriately hedged when the evidence does not establish certainty.

For Reading and Writing Text Structure and Purpose, the current official-style task asks for the function of a specified/underlined portion in the text as a whole. Medium/Hard items should require the reader to connect the target portion to the passage's larger rhetorical progression—for example, introducing a source limitation or competing mechanism that later evidence addresses, provisionally supporting an interpretation that is subsequently qualified, or supplying evidence that reconciles an apparent contradiction. Do not create difficulty by merely lengthening the passage or by attaching an obvious label such as `provides an example` to a sentence whose role is explicit in isolation.

For Reading and Writing Boundaries, preserve the standard conventions-completion task and make Medium/Hard difficulty come from sentence structure rather than obscure punctuation trivia. Useful higher-difficulty patterns include long clausal subjects that create false pause points, inverted constructions with delayed main verbs, paired boundaries around nested nonessential material, and two-part independent-clause/conjunctive-adverb punctuation decisions. Do not label routine introductory commas, direct list colons, or single semicolon joins as Hard merely because the surrounding prose is longer. Keep every answer uniquely keyed under Standard English conventions.

For Reading and Writing Form, Structure, and Sense, preserve the standard conventions-completion task and make Medium/Hard difficulty come from grammatical relationships that must be tracked across meaningful sentence structure. Useful higher-difficulty patterns include agreement across embedded or interrupting clauses, logical modifier attachment with plausible passive/non-agent distractors, multi-point tense/aspect sequencing, pronoun case inside relative constructions, and verb complementation or parallelism across intervening material. Do not classify one-step singular/plural agreement, obvious pronoun matching, or a locally signaled tense choice as Medium/Hard merely because the sentence is longer. Keep every completion uniquely required by Standard English conventions.

For Math Area and Volume, preserve the Geometry and Trigonometry construct and make Medium/Hard difficulty come from spatial or composite reasoning, unit conversion, missing/dependent dimensions, or relationships among linear, surface-area, and volume scale factors. Do not classify direct formula substitution with all dimensions given, or a one-step calculation from an explicit scale factor, as Medium/Hard merely because the values are larger or the response is student-produced. Keep units, dimensional relationships, and percent-change wording exact, and retain a uniquely keyed numeric result.

For Math Lines, Angles, and Triangles, make Medium/Hard difficulty come from selecting and chaining geometric relationships rather than from a single angle-sum or explicit scale-factor computation. Useful Medium patterns include exterior-angle equations, isosceles structure combined with supplementary angles, parallel-line angle equations, perimeter-derived similarity scale, and similar triangles whose full side must first be assembled from segments. Useful Hard patterns include parallel-segment similarity with multiple missing sides, reverse reasoning from a perimeter difference, chained corresponding-angle/algebra/triangle-sum deductions, or recovery of an outer segment before computing a composite perimeter. Do not rate direct triangle-angle subtraction or one multiplication from a stated integer scale factor as Medium/Hard solely because the response is SPR. Keep diagrams-in-words unambiguous, correspondence exact, and every numeric key uniquely determined.

For Math Equivalent Expressions, make Medium/Hard difficulty come from choosing and executing a useful algebraic rewrite rather than from direct coefficient or constant-term reading after one distributive step. Useful Medium patterns include factoring by grouping, substituting for repeated algebraic structure before factoring, matching parameters across an identity, combining multiple products before extracting a coefficient, completing the square, and matching more than one coefficient in an equivalent-form identity. Do not rate a shared-binomial combination or direct binomial expansion as Medium merely because the values are larger or the response is SPR. Keep every equivalent form valid for all permitted values of the variable and retain a unique answer key.

For Math Nonlinear Equations in One Variable, make Medium/Hard difficulty come from selecting and chaining nonlinear-solving operations rather than reading roots directly from factored form. Useful Medium patterns include expanding and rearranging before factoring, absolute-value case analysis, rational equations that require domain checks, radical equations with extraneous-solution checks, rewriting exponential equations to a common base, and coefficient/root relationships under an added condition. Do not rate roots exposed directly by factors or a single positive-square-root lookup as Medium merely because the item is SPR. Keep domain restrictions and extraneous-solution checks explicit and every answer uniquely keyed.

For Math Systems of Equations in Two Variables under Advanced Math, preserve the nonlinear-system construct rather than drifting into the separate Algebra skill for two linear equations. Make Medium/Hard difficulty come from strategically connecting two representations or constraints: for example, equating a nonlinear and linear relation and then rearranging before solving, using symmetric relationships implied by two simultaneous equations, translating a context into linear and nonlinear constraints, eliminating a variable to obtain a quadratic, or recovering a requested coordinate after solving and filtering an intersection. Do not rate a favorable small-integer sum/product factor pair as Medium merely because two variables are named. Keep solution multiplicity, sign/ordering conditions, and requested coordinates explicit enough to guarantee a unique answer.

For Math Nonlinear Functions, preserve the Advanced Math emphasis on interpreting nonlinear relationships, moving among useful representations, and connecting algebraic form to graph features or domain behavior. Make Medium/Hard difficulty come from deriving parameters or key features from conditions, applying transformations after first determining a feature, using symmetry or function values to recover an equivalent form, or simplifying a rational function while preserving an excluded-domain point. Do not rate direct function substitution or reading a vertex coordinate straight from vertex form as Medium merely because the notation is quadratic or exponential. Keep transformations, domains, and requested features explicit enough to guarantee a unique answer, and maintain variety across quadratic, exponential, rational, and other exam-eligible nonlinear representations rather than concentrating the skill on one template.

## Production separation

Staging edits are not production content changes. They must not change Supabase commercial content tables, Auth, RLS, billing, public indexing, marketing measurement, outbound marketing, or external publication. If the authorized Supabase connection does not expose the SATprep production project, do not use or modify another project as a substitute.
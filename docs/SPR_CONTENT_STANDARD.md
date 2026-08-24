# Math Student-Produced Response (SPR) Content Standard

Last verified against College Board public SAT Suite specifications: 2026-08-24.

## Why this matters
A commercially credible digital SAT/PSAT Math experience cannot be multiple-choice only. College Board currently states that approximately 75% of SAT Math questions are four-option multiple choice and the remainder are student-produced response (SPR) questions. The current SAT Math section has 44 questions across two 35-minute modules, and College Board also states that approximately 30% of Math questions are set in context.

SATprep.io therefore supports both `mcq` and `spr` as first-class secure content formats. The goal is structural fidelity to the public test specification using independently authored SATprep.io content, not reproduction of official questions.

## Secure authoring shape

### MCQ
- `format`: `mcq`
- exactly four non-empty choices
- server-only answer: `{ "answerIndex": 0..3 }`

### SPR
- `format`: `spr`
- section must be `MATH`
- choices must be null/absent
- server-only answer example:

```json
{
  "accepted": ["2/3", ".6666", ".6667", "0.666", "0.667"],
  "display": "2/3"
}
```

The accepted list is deliberately explicit for non-terminating decimal cases. Runtime scoring also treats mathematically exact terminating-decimal/fraction equivalents as the same value, so an item keyed to `3.5` can correctly accept `3.50` or `7/2` when the entry fits the allowed response field.

## Student response rules enforced by SATprep.io
Aligned to the current public digital SAT response directions:
- Positive entry: at most 5 characters.
- Negative entry: at most 6 characters including the minus sign.
- Allow integers, decimals, or fractions.
- Do not allow percent signs, commas, currency symbols, or mixed-number notation.
- Fractions with a zero denominator fail validation.
- If an item has more than one mathematically acceptable response, author the accepted set explicitly.

## Review requirements
An SPR item cannot enter commercial runtime merely because its arithmetic is correct. It requires the same five exact-hash approvals as MCQ content:
1. Accuracy.
2. SAT/PSAT alignment.
3. Editorial quality.
4. Bias/accessibility.
5. Originality.

Reviewers should additionally verify:
- Every accepted response is actually valid for the stated problem.
- The accepted list includes all intended rounded/truncated forms when a non-terminating decimal is expected.
- No invalid approximation is accidentally accepted.
- The displayed feedback answer is clear and pedagogically useful.
- The problem can be solved without relying on inaccessible visual information.

Any change to the prompt, taxonomy, difficulty, accepted responses, display answer, or explanation changes the review hash and requires re-review.

## Blueprint targets
- Full-test/simulation-oriented Math sets should target the public SAT structure of roughly 25% SPR.
- A short diagnostic should include enough SPR to measure independent Math response production without letting format overwhelm domain coverage; for a 20-item diagnostic with roughly half Math, a target of 2–3 SPR Math items is appropriate when approved bank depth permits.
- Five-item guided Math practice can include approximately one SPR where the skill naturally supports it and the approved bank contains a suitable item.
- Reading and Writing remains MCQ only.

These are content-planning targets, not College Board scoring or psychometric claims.

## Practice feedback
SPR feedback belongs in learning/practice, not the initial diagnostic. After a practice answer is securely scored, the student should see:
- correct / incorrect;
- the accepted/display answer;
- their submitted response when incorrect;
- the instructional explanation and solution process.

The diagnostic continues to save and score responses without revealing correctness or explanations while the assessment is in progress.

## Official source record
Recheck before launch:
- Student-Produced Responses: https://satsuite.collegeboard.org/sat/whats-on-the-test/math/student-produced
- SAT Math overview: https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview
- Digital SAT Suite Assessment Framework: https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf
- PSAT/NMSQT Math: https://satsuite.collegeboard.org/in-school-assessments/whats-on-the-test/psat-nmsqt/math

Do not copy official question text into the SATprep.io commercial bank.

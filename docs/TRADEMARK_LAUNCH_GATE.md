# College Board Independence Disclosure and Content Boundary

Last updated: 2026-08-25

## Launch decision

The project owner has determined that College Board trademark review is not a commercial-launch blocker for SATprep.io. The required public-facing control is a clear independence disclosure on the homepage stating that SATprep.io is not sponsored by, endorsed by, or associated with College Board.

The approved homepage disclosure is:

> SATprep.io is an independent test-preparation service and is not sponsored by, endorsed by, or associated with College Board.

This disclosure is implemented by `independence-disclosure.js` and is enforced by `scripts/validate-launch.mjs`. `launch-gates.json` records the disclosure as a required launch control rather than an unresolved legal blocker.

## Product-content boundary

The launch decision does not change the product's content-integrity rules:

- Do not copy or republish official College Board test questions in the commercial question bank.
- Do not use official College Board test items as training data for generative question-authoring systems.
- Proprietary questions must be independently authored and reviewed against public SAT/PSAT specifications without copying protected wording.
- Linking students to official College Board or Bluebook resources is preferable to reproducing official content.
- SATprep.io diagnostics, mastery estimates, readiness indicators, and target-score planning must not be described as official College Board scores or official College Board predictions.

## Launch controls

The College Board independence disclosure must remain visible on the public homepage when public indexing, billing, live payments, marketing measurement, or outbound marketing are later enabled. Removal of the disclosure should fail the production launch validator.

The disclosure requirement is independent from the remaining launch gates for commercial content depth and review, payment activation, privacy/analytics approval, security verification, indexing, and outbound marketing.

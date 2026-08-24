# College Board Trademark Launch Gate

Last reviewed: 2026-08-24

## Purpose
SATprep.io is still pre-launch and globally blocked from search indexing. Before public indexing, advertising, paid acquisition, affiliate promotion, or broad commercial release is enabled, the current brand/domain and all uses of College Board marks need explicit legal/trademark review.

This is a launch-governance control, not a legal conclusion. The repository should not treat trademark clearance as implied merely because the product is technically ready.

## Current risk to resolve
The current product name and domain contain `SAT`. College Board's current published trademark guidance identifies SAT® as a registered trademark and states that third parties should avoid uses that imply affiliation. The guidance also states that College Board marks should not be used in company, product, service, social-page, Internet-domain, website-address, or meta-tag names without permission, and that websites using College Board marks should carry visible attribution/non-affiliation language on pages where the marks appear.

College Board also states that official SAT test materials are not available for commercial test-prep licensing and that reproduction of official test materials in commercial test-prep settings is not allowed. Its published guidance separately states that College Board copyrighted content may not be used to train generative-AI systems or applications.

Because the current SATprep.io brand/domain itself contains the SAT mark, this issue is broader than simply adding a footer disclaimer. It must be resolved before public launch.

## Required decision before public indexing or outbound marketing
Document one of the following before changing `launch-gates.json`:

1. Written permission/approval sufficient for the intended brand/domain, website, advertising, social, and product uses; or
2. A legal review concluding that the planned uses may proceed, with any required changes to naming, marks, symbols, disclaimers, metadata, or campaign creative; or
3. A rebrand/domain transition plan that removes the unresolved issue before indexing and promotion.

Record the decision, reviewer, date, scope, and any restrictions in a non-secret launch record before changing `college_board_trademark_review` from `unresolved`.

## Product-content boundary
Regardless of branding outcome:

- Do not copy or republish official College Board test questions in the commercial question bank.
- Do not use official College Board test items as training data for any generative question-authoring system.
- Proprietary questions must be independently authored and reviewed against public test specifications without copying protected wording.
- Linking students to official College Board/Bluebook resources is preferable to reproducing official content.
- SATprep.io diagnostics and mastery estimates must not be described as official College Board scores, equated scores, or psychometrically validated score predictions unless that claim is independently substantiated.

## Prelaunch technical controls that must remain in place while unresolved

- `launch-gates.json` keeps `college_board_trademark_review` set to `unresolved`.
- Vercel continues sending `X-Robots-Tag: noindex, nofollow, noarchive`.
- Public billing remains disabled.
- Live payments remain disabled.
- Outbound marketing remains disabled.
- No paid ads, affiliate promotion, public search submission, or broad lifecycle marketing should begin.

## Official source record
Reviewed against current College Board pages on 2026-08-24:

- Guidelines for Using College Board Trademarks: https://privacy.collegeboard.org/copyright-trademark/guidelines
- College Board Copyright and Trademark Permission Request Instructions: https://privacy.collegeboard.org/copyright-trademark/request-instructions
- College Board Trademarks: https://privacy.collegeboard.org/copyright-trademark/college-board

Recheck these sources immediately before launch because policies can change.

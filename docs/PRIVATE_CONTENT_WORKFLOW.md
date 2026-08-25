# Private Proprietary Content Workflow

Last updated: 2026-08-25

## Why this boundary exists

The main SATprep.io application repository is currently public. Fresh commercial diagnostic questions, answer keys, explanations, and completed independent review files should therefore **not** be committed to this repository. The secure runtime is designed to read commercial content from server-only Supabase tables, not from browser bundles or a public Git question bank.

The existing committed question banks are development/staging material and must not be treated as secret commercial assessment content merely because the runtime later imports them somewhere else. Anything whose answer key has appeared in public Git history should be considered exposed.

## Safe workflow for new commercial content

1. Author fresh questions in a private working location outside this repository.
2. Maintain the official SAT/PSAT taxonomy metadata required by SATprep.io: content type, section, domain, skill, difficulty, exam eligibility, prompt/stimulus, four choices where applicable, answer, and explanation.
3. Generate or maintain a review CSV using the SATprep.io review format. The current export includes review-decision fields plus `accuracy_reviewer`, `alignment_reviewer`, `editorial_reviewer`, `bias_accessibility_reviewer`, and `originality_reviewer` so reviewer identity can be audited by dimension.
4. Have independent reviewers complete accuracy, alignment, editorial, bias/accessibility, and originality review. Commercial private import now requires **at least three distinct reviewer labels across the five dimensions, with no reviewer approving more than two dimensions on the same item**. This allows sensible specialization while preventing one person from self-approving an item across the full review stack. Do not mark an item production-ready because an automated model or the author alone approved it.
5. Ensure the review file carries the exact SHA-256 `content_hash` for the item version reviewed. Each review dimension may use its own `<dimension>_reviewed_at` value; a shared `reviewed_at` is accepted when all five reviews were recorded from a common audited review session.
6. Keep the completed file outside the public repository. `.gitignore` now excludes `artifacts/`, `private-content/`, `content-review*.csv`, `*.private.csv`, and local environment files as an additional accidental-commit safeguard.
7. With an active reconciled Supabase project and the server-only service-role credential available locally, import the completed review file with:

   `node scripts/import-private-reviewed-content.mjs /absolute/private/path/content-review.csv`

   The importer validates all five approval dimensions, reviewer independence, and the exact content hash before writing anything. It also screens the incoming batch for exact duplicate content and very-high-similarity wording, then compares each incoming item against the existing production-approved commercial bank. The screen deliberately spans **both diagnostic and practice content types**: a practice question cannot be reintroduced as a diagnostic item (or vice versa) merely by assigning another item ID. Duplicate/near-duplicate failures identify item IDs only; proprietary question text is not printed. By default, reviewed items are imported **inactive**, even though their QA status is production-approved.
8. If duplicate screening blocks an item, diversify the item materially, complete a fresh independent review of the revised version, and regenerate its exact content hash before importing again. Do not bypass the screen by assigning a new item ID or moving substantially identical content between the diagnostic and practice banks.
9. Perform content/runtime QA against inactive or controlled test content as appropriate.
10. Only when activation is explicitly approved, run with both the activation flag and deliberate environment confirmation:

   `PRIVATE_CONTENT_IMPORT_CONFIRM=ACTIVATE_REVIEWED_CONTENT node scripts/import-private-reviewed-content.mjs /absolute/private/path/content-review.csv --activate`

11. The importer deactivates any existing item before replacing its prompt/key/reviews and only reactivates after all writes complete. The runtime independently recomputes the content hash and requires current approvals, providing another fail-closed layer.
12. Before claiming launch-ready content, run the live strict readiness check. It independently verifies the exact project reference, answer/explanation integrity, exact-hash approvals, reviewer diversity, response-format eligibility, and required per-skill depth/difficulty distribution:

   `npm run verify:launch-content`

## Security and quality properties

- Proprietary question text is never printed by the import script.
- The import script requires an **absolute path**, making accidental use of a repo-local review artifact less likely.
- The service-role key is read only from server/local environment variables and must never be placed in browser/Vite variables.
- New content lands in server-only `content_items`, `content_answer_keys`, and `content_item_reviews` tables whose browser-role access is explicitly revoked by the content-system migration.
- Incoming batches are screened for duplicate IDs, exact duplicate content, and very-high-similarity wording before any writes occur.
- The importer paginates through existing production-approved content and checks incoming items against that bank, preventing duplicate content from being hidden under a different item ID.
- Duplicate signatures and near-duplicate comparisons span diagnostic and practice content so exposure through guided practice cannot silently compromise a supposedly unseen diagnostic item.
- Similarity screening is a fail-closed editorial safeguard, not a substitute for the required originality review. Reviewers remain responsible for substantive originality, source independence, and avoiding protected third-party test content.
- Commercial reviewer independence is machine-enforced during private import and independently checked again by the live strict readiness verifier.
- An item can be `production_approved` but inactive; runtime delivery additionally requires `active=true`.
- Any content change after review breaks the hash and causes secure diagnostic/practice delivery to fail closed until the changed version is reviewed again.

## Remaining organizational requirement

For a mature commercial operation, use a dedicated private content repository or controlled content-management system with access logging, reviewer roles, version history, backup, and separation between authorship and independent approval. The local/private-file workflow above is a safe bridge and avoids putting fresh proprietary questions into the current public Git repository, but it is not intended to be the final editorial CMS.

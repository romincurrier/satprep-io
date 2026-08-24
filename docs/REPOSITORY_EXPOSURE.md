# SATprep.io Repository Exposure Launch Gate

Status: **BLOCKING BEFORE COMMERCIAL CONTENT LAUNCH**

Verified 2026-08-24: the GitHub repository `romincurrier/satprep-io` is currently public.

## Why this matters
The repository has contained proprietary SATprep.io diagnostic and practice source files, including answer keys and explanations used during development. Even when a file is later deleted from the current branch, public Git history may retain the prior content, and third parties may already have cloned or cached it.

For ordinary public practice examples, disclosure is mainly an intellectual-property concern. For a scored diagnostic, disclosure is also an assessment-integrity concern: a question whose answer key has been publicly available should not be treated as secure commercial diagnostic content.

## Required launch treatment
Before independently reviewed proprietary diagnostic content is activated for paying/public users:

1. Make the application repository private, or move all proprietary assessment authoring and production content to a separate private repository/workflow.
2. Treat diagnostic questions and answer keys that have existed in this public repository as **compromised for secure commercial diagnostic use**.
3. Author or import a fresh production diagnostic pool only after the private-content boundary exists.
4. Put production diagnostic prompts, answer keys, review records, and attempt plans in the server-only content system. Browser clients should receive only the current safe question projection.
5. Require the latest recorded approval in accuracy, SAT/PSAT alignment, editorial quality, and bias/accessibility before an item can become active `production_approved` content.
6. Keep answer keys in the server-only `content_answer_keys` store. Do not commit fresh commercial diagnostic keys to a public client or public repository.
7. Rotate any item if an answer-key or content-exposure incident occurs.

## Current code safeguards
The secure-v3 runtime is being hardened so it does **not** use the committed JavaScript question bank for production scoring. It selects only active `production_approved` database items that have an answer key and the required review approvals. The complete diagnostic plan and answer-key tables are denied to browser roles.

The committed JavaScript diagnostic bank remains an internal development/QA asset only. It can be used to validate taxonomy, blueprint coverage, UI behavior, and authoring workflow, but should not be the source of a secure commercial baseline assessment.

## Owner action that cannot be completed by the automated build
Repository visibility is an account/repository setting. The connected GitHub tooling available to this build does not expose a repository-visibility mutation. An owner must intentionally change that setting or establish a separate private content repository before fresh commercial diagnostic content is created.

## After the repository is private
Making the repository private reduces future exposure but does not make previously public answer keys trustworthy again. The commercial diagnostic bank should therefore use new item IDs and fresh questions authored/imported after the private boundary is established.

This gate does not prevent continued software development, SEO preparation, UI testing, or non-secure internal QA. It prevents us from incorrectly labeling publicly exposed development questions as secure commercial diagnostic content.

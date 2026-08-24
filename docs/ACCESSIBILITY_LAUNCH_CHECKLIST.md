# SATprep.io Accessibility Launch Checklist

Last updated: 2026-08-24

## Purpose

This checklist separates automated accessibility safeguards from the manual usability testing required before SATprep.io is offered broadly to students and families. Automated checks reduce regression risk, but they do **not** establish legal compliance or replace testing with assistive technology and real users.

## Automated build gates

Every production build should fail when the accessibility validator detects any of the following in public static pages or the primary application shell:

- missing document language, responsive viewport, meaningful page title, or main landmark;
- missing or multiple primary H1 headings;
- positive `tabindex` values that override natural keyboard order;
- images without alternative text;
- new-window links without `rel="noopener"`;
- data tables without a caption or scoped header cells;
- static form controls without an accessible name;
- removal of the application skip link or the focusable main application target;
- removal of visible focus indicators; or
- removal of reduced-motion support.

These checks are intentionally conservative and should remain part of `npm run build`.

## Manual launch verification

### Keyboard-only navigation

- [ ] Complete account creation without a mouse.
- [ ] Complete student onboarding without a mouse.
- [ ] Upload prior assessment evidence without a mouse where the platform supports the file type.
- [ ] Start, pause, resume, and finish a diagnostic using only the keyboard.
- [ ] Complete a learning/practice session, including choosing an answer, reading feedback, and continuing, using only the keyboard.
- [ ] Open and close the Progress Roadmap using only the keyboard.
- [ ] Navigate the parent dashboard and student switching controls using only the keyboard.
- [ ] Navigate billing-preview controls using only the keyboard while billing remains in test/pre-launch mode.
- [ ] Verify that focus never becomes trapped or disappears after dynamic page replacement.
- [ ] Verify that modal/overlay experiences return focus to a sensible control when closed.

### Screen-reader testing

Test at minimum with one desktop and one mobile screen reader before launch. Suggested coverage: NVDA + Chrome/Firefox on Windows and VoiceOver + Safari on iOS/macOS.

- [ ] Page title and primary heading identify the current screen.
- [ ] Navigation, buttons, links, inputs, select controls, and answer choices have meaningful accessible names.
- [ ] Validation errors are announced and associated with the affected field.
- [ ] Diagnostic progress (for example, question 7 of 20) is understandable without visual context.
- [ ] Practice correct/incorrect feedback and the instructional explanation are announced after answer submission.
- [ ] Progress bars expose understandable text or equivalent status rather than relying only on visual width.
- [ ] Dashboard metrics are read in a logical order.
- [ ] Tables, including test-date information, announce captions and column headers correctly.
- [ ] Decorative emoji/icons do not obscure or duplicate the meaningful label.

### Zoom, reflow, and mobile

- [ ] Browser zoom at 200% remains usable without loss of controls or text.
- [ ] Test key workflows at 400% zoom/reflow where practical.
- [ ] No essential horizontal scrolling is required for ordinary forms, diagnostics, learning sessions, dashboards, and billing screens.
- [ ] The SAT test-date table remains horizontally scrollable without clipping surrounding content.
- [ ] Touch targets remain comfortably operable on common phone sizes.
- [ ] Content remains usable in portrait and landscape orientations.

### Color and visual presentation

- [ ] Text/background contrast is checked with an accessibility contrast tool for all primary and muted text styles.
- [ ] Buttons, selected states, success states, warnings, and errors do not depend on color alone.
- [ ] Focus indicators remain visible against every background where interactive controls appear.
- [ ] Disabled controls remain distinguishable without becoming unreadable.
- [ ] Practice correct/incorrect states include explicit text in addition to visual styling.

### Motion and timing

- [ ] `prefers-reduced-motion` suppresses nonessential movement and animated emphasis.
- [ ] No instructional or account workflow requires a user to respond before an arbitrary interface timeout.
- [ ] Diagnostic response timing may be measured for analytics/adaptation, but the interface itself does not force a student to answer because of an inaccessible countdown unless a separately designed timed-test mode is intentionally introduced.
- [ ] Session expiration/authentication failures provide a recoverable path and do not silently discard saved work.

### Content accessibility

- [ ] Math notation is understandable with assistive technology for the formats used in production content.
- [ ] Charts, diagrams, and figures introduced into the question bank receive equivalent text descriptions where required to solve the problem.
- [ ] Passages and answer options avoid formatting that creates an artificial screen-reader disadvantage.
- [ ] Explanations teach the solution without relying solely on spatial references such as “the value on the left” when a clearer semantic description is possible.

## Release evidence

Before public launch, preserve a short accessibility verification record containing:

1. date and build/commit tested;
2. browsers and devices used;
3. screen readers and versions used;
4. workflows completed;
5. defects found and remediation commits;
6. any accepted limitations and owner/date for remediation; and
7. final product-owner sign-off after critical issues are resolved.

## Ongoing maintenance

Accessibility is a release discipline rather than a one-time audit. Re-run manual smoke tests after material changes to onboarding, diagnostic delivery, practice feedback, navigation, parent dashboards, billing, or any new interactive component. Keep automated accessibility invariants in the build pipeline so basic regressions fail before deployment.

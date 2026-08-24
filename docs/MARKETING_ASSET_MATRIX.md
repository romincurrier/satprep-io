# SATprep.io Marketing Asset Matrix

Status: pre-launch implementation material only. Nothing in this document authorizes ad spend, outbound email, social publishing, affiliate activation, public-account creation, or use of real student data/testimonials.

## Core message hierarchy
1. **Primary value:** know what to study next.
2. **Mechanism:** prior testing + assessment-only diagnostic + ongoing practice evidence.
3. **Learning benefit:** practice explains the process after each answer.
4. **Parent benefit:** see progress without managing every study session.
5. **Trust:** original SATprep.io content, independent review gate, no score guarantees, no College Board affiliation.

Approved-style language should describe product behavior, not promised outcomes. Avoid “guaranteed score increase,” “ace the SAT,” “National Merit guaranteed,” or unsupported “better than” claims.

## Campaign matrix
| Campaign | Primary audience | Funnel stage | Core problem | Message angle | Primary landing page | CTA | Primary KPI |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sat_stop_guessing` | SAT students + parents | Consideration | Too many topics; unclear priority | Stop guessing what to study next | `/sat-study-plan/` | Start personalized plan | Activated learner rate |
| `sat_math_by_skill` | Math-focused searchers | Awareness → consideration | “SAT Math” feels too broad | Diagnose Algebra, Advanced Math, Data Analysis, Geometry/Trig separately | `/sat-math-prep/` | See personalized Math plan | Diagnostic start rate |
| `sat_rw_by_skill` | Reading/Writing searchers | Awareness → consideration | Grammar/reading treated as one bucket | Inference, evidence, vocabulary, transitions, grammar and synthesis need different methods | `/sat-reading-writing-prep/` | Build Reading & Writing plan | Diagnostic start rate |
| `psat_skill_continuity` | PSAT/NMSQT families | Awareness → consideration | Unsure how PSAT prep connects to SAT | Build shared SAT Suite skills while targeting the student’s selected exam | `/psat-prep/` | Start PSAT plan | Activated learner rate |
| `parent_visibility` | Parents | Consideration | Hard to know whether prep is productive | See what is being worked on and where progress is occurring | `/parents/` | Create family account | Parent signup completion |
| `diagnostic_first` | High-intent prep shoppers | Consideration | Generic prep starts without baseline | Use an assessment-only baseline before teaching | `/how-it-works/` | Find starting point | Diagnostic completion rate |
| `practice_that_teaches` | Students | Consideration | Practice answers without learning process | Correct answer + explanation belongs in practice, not baseline diagnostic | future learning-demo page | See learning flow | First learning-session completion |
| `content_quality` | Parents/counselors | Trust | Unsure whether AI-generated questions are credible | Original bank + independent human review + hash-pinned approvals | `/content-quality/` | Review content standards | Assisted signup rate |

## Paid search build sheet — do not activate without approval

### Campaign: SAT preparation — parent/high intent
Ad group themes:
- adaptive SAT prep
- personalized SAT prep
- SAT study plan
- SAT diagnostic practice
- SAT prep for teens / students

Example headlines for later platform review:
- Personalized SAT Prep by Skill
- Know What to Study Next
- SAT Prep That Adapts as You Learn
- Start With a Real Skill Baseline
- See Progress Beyond Practice Hours

Example descriptions:
- Build a personalized SAT study path from prior testing, a baseline diagnostic, and ongoing practice performance. No score guarantees.
- Learn one skill at a time, practice it, review the correct answer and process, then let the plan update from new evidence.

Landing-page rule: use the page that exactly matches the search intent; do not send every keyword to the homepage.

### Campaign: SAT Math
Ad group themes:
- SAT math prep
- SAT algebra practice
- SAT advanced math practice
- SAT data analysis practice
- SAT geometry/trigonometry practice

Negative-keyword starting review list:
- jobs
- salary
- teacher certification
- answer key
- leaked test
- hacked
- cheating
- free official test download
- PDF official answers

Negative keywords must be reviewed against real query data before activation; do not block legitimate high-intent searches merely because they include “free.”

### Campaign: SAT Reading & Writing
Ad group themes:
- SAT reading writing prep
- SAT grammar practice
- SAT inference questions
- SAT transitions practice
- SAT words in context
- SAT command of evidence

### Campaign: PSAT/NMSQT
Ad group themes:
- PSAT prep
- PSAT/NMSQT study plan
- PSAT practice by skill
- PSAT to SAT prep

National Merit terms require extra claims review. Ads may describe preparation for PSAT/NMSQT skills but must not imply that SATprep.io can guarantee recognition, eligibility, or scholarship awards.

## Organic/social educational series
These are educational content concepts, not posts scheduled for publication.

### Series 1 — One Skill, One Process
Format: 30–75 second video, carousel, or concise article.
Recurring structure:
1. Name one official skill.
2. Show a SATprep.io-original micro-example that is approved for public instruction.
3. Teach one reusable process.
4. Show the common trap.
5. CTA: “See which skills should come first in your plan.”

Topic queue:
- inference: evidence first, conclusion second
- words in context: replace and reread
- transitions: name the logical relationship before choosing the word
- boundaries: determine whether each side is a complete clause
- linear equations: reverse operations in a controlled order
- percentages: identify the original value before applying change
- ratios/rates: solve for the unit rate before scaling
- nonlinear equations: recognize structure before expanding blindly

### Series 2 — Parent Progress Questions
Possible topics:
- “How do I know SAT prep is actually working?”
- “Hours studied vs skills mastered”
- “What should a diagnostic actually tell you?”
- “Why practice explanations matter after the baseline test”
- “When should a student repeat a weak skill?”
- “What parents should see without reading every practice question”

### Series 3 — SAT Suite Planning
Possible topics:
- SAT vs PSAT/NMSQT: what is shared and what is different
- why a study calendar should change after new evidence
- full practice tests vs targeted skill practice
- how to review errors without memorizing one question
- why diagnostic feedback is delayed until the diagnostic ends

## Email lifecycle asset matrix — do not send until consent/provider/legal gates are complete
| Trigger | Audience | Goal | Message | CTA | Suppression rule |
| --- | --- | --- | --- | --- | --- |
| Account created, onboarding incomplete | Account holder | Complete setup | Finish learner profile so the plan can target the correct exam | Continue setup | Suppress after onboarding |
| Onboarding complete, diagnostic not started | Student/authorized parent channel | Activation | Your starting point is ready to measure | Start diagnostic | Suppress once attempt exists |
| Diagnostic started, incomplete | Student/authorized parent channel | Resume | Your progress is saved; continue from the next unanswered question | Resume diagnostic | Suppress after completion |
| Diagnostic complete, no first learning session | Student | Value realization | Start with the highest-priority skill | Start recommended lesson | Suppress after learning session |
| First learning session complete | Student | Reinforcement | Your plan updated from new practice evidence | Continue plan | Frequency cap |
| Weekly parent summary | Parent | Visibility | Sessions, skills, mastery changes, next priorities | View parent dashboard | Only linked/authorized parent |
| Subscription started | Purchaser | Confirmation | Plan, billing cadence, cancellation route | Manage account | Transactional rules |
| Cancellation requested | Purchaser | Clarity | Confirm access end date and billing status | Manage account | No manipulative save flow |

Youth/privacy rule: lifecycle messaging must not expose detailed student performance to an email recipient unless that recipient is the student or an authorized linked parent/guardian under the final privacy model.

## Partnership asset matrix
### Counselor/educator one-pager
Contents:
- what SATprep.io does
- how the baseline diagnostic differs from practice
- official-skill taxonomy coverage
- how parent/student progress is represented
- content-quality review process
- privacy/contact route
- no admission/score guarantees

### Family handout
Contents:
- who the product is for
- supported SAT Suite exams
- what to expect in the first session
- how uploaded prior testing is used
- what parents can see
- pricing only after approved/final
- support/contact details

### Partner referral link structure
Recommended UTM pattern:
`?utm_source=<partner_slug>&utm_medium=partner&utm_campaign=school_partner_2026&utm_content=<asset_slug>`

Do not encode school student IDs, names, class periods, counselor emails, or other personal data in campaign parameters.

## Referral/affiliate launch design
Do not activate until legal/privacy/fraud review.

Preferred first referral model:
- parent-to-parent referral rather than child-targeted rewards;
- fixed referral code or opaque partner slug;
- reward triggered only after a valid paid conversion and refund window;
- no incentives tied to student scores;
- no public leaderboard involving minors;
- clear affiliate disclosure requirements for compensated partners.

Fraud controls to design before launch:
- self-referral detection;
- duplicate payment/customer review;
- refund/chargeback clawback;
- campaign/source rate anomaly monitoring;
- referral-code rotation/revocation.

## Creative asset inventory to prepare
- desktop dashboard screenshot using synthetic student data
- mobile student-plan screenshot using synthetic student data
- parent dashboard screenshot using synthetic family data
- diagnostic flow screenshot with no answer key shown
- practice feedback screenshot showing answer + explanation
- prior-assessment upload screenshot using synthetic report
- 16:9 product overview image
- 1:1 parent-oriented social image
- 9:16 student-learning video template
- neutral brand background/thumbnail kit
- logo variants and favicon/social avatar

Never use a real uploaded score report or identifiable student dashboard in marketing screenshots without explicit documented permission and legal/privacy review.

## UTM naming standard
Use lowercase snake_case. Keep identifiers stable enough for longitudinal reporting.

### Source examples
`google`, `bing`, `youtube`, `instagram`, `facebook`, `reddit`, `newsletter`, `counselor_partner`, `parent_referral`, `creator_<slug>`

### Medium examples
`organic`, `cpc`, `paid_social`, `organic_social`, `email`, `partner`, `referral`, `affiliate`, `pr`

### Campaign examples
`sat_fall_2026_parent_search`
`sat_math_skill_search_2026`
`psat_fall_2026_search`
`parent_visibility_launch_2026`
`counselor_partner_2026`

### Content examples
`headline_stop_guessing_v1`
`math_algebra_v1`
`parent_dashboard_v1`
`video_inference_process_v1`

Do not place names, emails, student IDs, test scores, school names, dates of birth, or free-form notes in UTM values.

## Campaign experiment template
Every paid or conversion experiment should be logged with:
- hypothesis
- audience
- channel
- landing page
- creative/message variant
- primary metric
- guardrail metrics
- start/end dates
- planned budget ceiling
- decision rule
- result
- follow-up action

Recommended early primary metric: **cost per activated learner**, where activation is defined before launch and not changed mid-test. Raw clicks and account creations are diagnostic metrics, not optimization goals.

## Channel launch gates
### Organic search
- technical SEO validation green
- public pages fact/content reviewed
- privacy/terms/support routes present
- sitemap intentionally submitted only after public-launch approval

### Paid search
- conversion measurement approved and tested
- approved budget ceiling
- billing/live checkout verified
- landing-page claims reviewed
- negative-keyword review complete

### Paid social
- youth-targeting/platform-policy review
- no learner-performance audiences
- no prohibited child behavioral targeting
- approved creative and landing pages
- attribution design approved

### Email
- consent/legal basis finalized
- provider configured with authentication
- unsubscribe/suppression working where required
- transactional vs marketing classifications documented
- authorized-recipient logic tested

### Partnerships/affiliates
- approved terms/disclosures
- referral/fraud controls
- partner tracking avoids personal student data
- support/escalation route established

## Initial dashboard views after measurement activation
1. Landing page → CTA click → signup open.
2. Campaign/source → activated learner.
3. Activated learner → diagnostic completion.
4. Diagnostic completion → first learning-session completion.
5. Source/campaign cohort → 7-day learning retention.
6. Paid source → paid conversion, cancellation, refund, and contribution margin once billing data is lawful to join at aggregate/account level.

Public-site acquisition measurement and learner-performance data should remain separate by default. Any future attribution bridge must be narrow, documented, reviewed, and unnecessary fields must not be copied between systems.

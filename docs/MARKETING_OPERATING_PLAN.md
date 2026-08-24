# SATprep.io Marketing Operating Plan

Status: implementation blueprint only. No spend, outbound campaigns, or public-account actions should be activated without explicit approval.

## 1. Commercial positioning
SATprep.io should be positioned as an adaptive SAT/PSAT learning system that decides what a student should study next from evidence: prior testing when available, an assessment-only diagnostic, and ongoing skill performance. The core promise is focus and visibility, not a guaranteed score increase.

Primary differentiators to communicate consistently:
- Skill-level personalization rather than a generic calendar.
- Diagnostic assessment separated from instruction so the baseline is not contaminated by immediate teaching.
- Practice that teaches the process with correct-answer feedback and explanations.
- Parent visibility into progress without requiring the parent to manage each study session.
- Ability to ingest prior score reports and combine them with new evidence.
- A learning model that changes as mastery changes.

Claims guardrail: do not publish guaranteed score increases, scholarship outcomes, admission outcomes, or unsupported comparative superiority claims. Any future quantified performance claim must be backed by documented methodology and sufficient outcome data.

## 2. Audience matrix
| Audience | Primary problem | Message | Primary CTA | Best early channels |
| --- | --- | --- | --- | --- |
| Parents of high-school students | Unsure whether prep time is productive | See what needs work and whether progress is happening | Create family account | Search, parent content, referrals, school/community partnerships |
| SAT-focused students | Too much material; unclear next step | Stop guessing what to study next | Start personalized plan | Search, short-form educational content, student referrals |
| PSAT/NMSQT students/families | Need focused preparation and progress visibility | Build the same core SAT Suite skills with PSAT-specific targeting | Start PSAT plan | Search, counselor/parent content, seasonal content |
| High-school counselors / educators | Need a credible supplemental resource | Skill-level evidence and clear family/student progress | Request information / share resource | Partnerships, educator outreach after approval |
| Multi-student families | Multiple learners make tutoring expensive or hard to coordinate | One family account with separate learning paths | Start family plan | Parent search, referral, email lifecycle |

## 3. Funnel architecture
### Awareness
Goal: attract users with genuinely useful SAT/PSAT information.
Assets: SAT Math guide, Reading & Writing guide, SAT study-plan guide, SAT-vs-PSAT guide, PSAT guide, parent guide, future skill-specific articles.
Primary metrics: nonbranded search impressions, qualified visits, landing-page engagement, branded-search growth.

### Consideration
Goal: explain why SATprep.io is different and reduce uncertainty.
Assets: product homepage, how-it-works explainer, parent dashboard preview, sample learning-flow screenshots, methodology page, question-quality/editorial standards page, FAQ.
Primary metrics: CTA click rate, pricing-section engagement, signup-open rate, return visits.

### Activation
Goal: get an eligible user through account setup to a meaningful first action.
Activation definition should ultimately be: learner profile completed + prior testing decision made + diagnostic started. A stronger activation milestone is diagnostic completed.
Primary metrics: signup completion, onboarding completion, diagnostic-start rate, diagnostic-completion rate.

### Value realization
Goal: get the student to complete the first personalized learning session.
Primary metrics: time to first learning session, first-session completion, first-practice completion, first mastered skill.

### Retention
Goal: establish a sustainable study rhythm.
Primary metrics: weekly active learners, sessions per active learner, 7/30-day return, skill-mastered count, plan adherence, parent dashboard visits.

### Conversion
Goal: convert users only after the product demonstrates value.
Primary metrics: trial-to-paid conversion, conversion by source/campaign, monthly vs annual mix, family-plan mix, cancellation/refund rate.

### Referral
Goal: earn growth through satisfied families/students.
Primary metrics: referral invites, referred signup rate, referred activation rate, referred paid conversion. Do not launch incentives involving minors until privacy/legal review is complete.

## 4. Channel operating matrix
| Channel | Role | Initial assets | Cadence after launch | Primary KPI | Launch gate |
| --- | --- | --- | --- | --- | --- |
| Organic search | Durable demand capture | Core landing pages + topic clusters | 2–4 substantive pieces/month | Qualified organic activations | Technical SEO + content QA |
| Educational content / social | Demonstrate teaching quality | Short skill lessons, worked examples, study tips | 3–5 posts/week once approved | Engaged visits / assisted signups | Brand/content review; youth-marketing rules |
| Email lifecycle | Activation and retention | Welcome, diagnostic reminder, first-session nudge, weekly progress, parent summary | Event-triggered | Activation/retention uplift | Consent, unsubscribe, privacy review, provider setup |
| Referral | Low-cost trusted acquisition | Share link, parent referral, counselor resource | Always-on after approval | Referred activations | Abuse prevention + minor/privacy review |
| School/counselor partnerships | Credibility/distribution | One-page methodology, counselor guide, family handout | Targeted outreach | Qualified partner conversations | Outreach approval and materials review |
| Paid search | Capture high-intent demand | Brand/nonbrand search campaigns to dedicated landing pages | Controlled tests | Cost per activated trial | Approved budget + conversion tracking |
| Paid social | Creative testing / retargeting if lawful | Parent-oriented creatives first | Controlled tests | Cost per activated trial | Privacy/legal review; no behavioral targeting to under-13 users |
| Affiliates / creators | Trusted reach | Parent/education partners, clear disclosure terms | Selective | Activated users per partner | Contract/disclosure/fraud review |
| PR / earned media | Trust | Product story, adaptive-learning methodology, founder narrative | Milestone-based | Qualified coverage/referral traffic | Public-launch readiness |

## 5. Measurement taxonomy
All marketing measurement should use stable names and avoid collecting unnecessary learner data.

Recommended anonymous public-site event names:
- `marketing_page_view`
- `marketing_cta_click`
- `pricing_view`
- `signup_open`
- `login_open`
- `signup_complete` (only after privacy design approves how attribution is joined to an account)
- `onboarding_complete`
- `diagnostic_start`
- `diagnostic_complete`
- `first_learning_session_complete`
- `trial_start`
- `subscription_start`
- `subscription_cancel`

Recommended campaign fields:
- `utm_source`: platform or partner, e.g. google, bing, newsletter, counselor_partner
- `utm_medium`: organic, cpc, email, referral, partner, social
- `utm_campaign`: lowercase descriptive campaign name, e.g. sat_fall_2026_parent_search
- `utm_content`: creative or landing-page variant
- `utm_term`: paid-search keyword only when available

Naming rule: lowercase snake_case; no names, emails, birth dates, school names, test scores, or free-text fields in marketing attribution.

## 6. Core KPI hierarchy
North-star product metric for early commercialization: **weekly learners completing recommended learning work**. This is more meaningful than raw pageviews or account creation.

Commercial funnel KPIs:
1. Qualified landing visits.
2. Signup-start rate.
3. Signup completion.
4. Diagnostic start and completion.
5. First personalized learning-session completion.
6. 7-day learner retention.
7. Trial-to-paid conversion.
8. Paid retention / cancellation.
9. Customer acquisition cost once paid channels begin.
10. Contribution margin / payback period once sufficient billing data exists.

Do not optimize paid media to account creation alone; optimize toward an activation event once volume is sufficient.

## 7. Initial campaign concepts
### Campaign A: Stop Guessing What to Study
Audience: parents and SAT-focused students.
Landing page: homepage or `/sat-study-plan/`.
Message: use diagnostic and ongoing performance to decide the next skill.
Creative themes: generic study calendar vs adaptive plan; broad score vs skill-level priorities; visible progress.

### Campaign B: SAT Math by Skill
Audience: students/parents searching for Math help.
Landing page: `/sat-math-prep/`.
Message: Algebra, Advanced Math, Problem-Solving/Data Analysis, Geometry/Trig should be diagnosed and practiced separately.
Organic targets: SAT math prep, SAT algebra practice, SAT math study plan, SAT data analysis practice.

### Campaign C: Reading & Writing Is Not One Skill
Audience: students/parents searching for reading/grammar improvement.
Landing page: `/sat-reading-writing-prep/`.
Message: inference, evidence, words in context, transitions, punctuation, and rhetorical tasks require different processes.

### Campaign D: PSAT/NMSQT to SAT Skill Continuity
Audience: 10th/11th-grade families.
Landing page: `/sat-vs-psat/` and `/psat-prep/`.
Message: the tests share core SAT Suite skills; preparation can build a durable foundation while respecting different score ranges and purposes.
National Merit claims must be factual and must never imply a scholarship guarantee.

### Campaign E: Parent Visibility
Audience: parents purchasing prep.
Landing page: `/parents/`.
Message: understand whether preparation is happening and which skills need attention without micromanaging every question.

## 8. 90-day launch sequence after approval
### Phase 1: Measurement and message validation
- Complete privacy/legal/content launch gates.
- Enable anonymous aggregate public-site analytics.
- Finalize conversion events and attribution.
- Publish methodology, FAQ, pricing, privacy, terms, and content-quality pages after review.
- Establish Search Console/Bing Webmaster and analytics accounts only after approval.

### Phase 2: Organic launch
- Submit sitemap.
- Publish core search cluster and internal links.
- Produce original worked-example content from the approved practice bank without exposing diagnostic items.
- Begin parent/student educational social content.
- Recruit a small number of approved beta families for structured feedback and outcome measurement.

### Phase 3: Controlled acquisition tests
- Run small paid-search tests against high-intent parent/student terms.
- Test landing-page message variants, not product claims.
- Evaluate cost per activated learner before scaling.
- Add selected parent/education partnerships and referrals.

### Phase 4: Scale only what retains
- Shift spend toward channels producing diagnostic completion, first-learning-session completion, and retention—not cheap clicks.
- Build seasonal PSAT and SAT campaigns around actual test cycles.
- Expand SEO around skills and high-intent planning questions based on Search Console data.

## 9. Required pre-launch assets
- Product homepage and pricing.
- SAT, PSAT, Math, Reading & Writing, study-plan, comparison, and parent landing pages.
- Methodology / how personalization works.
- Content-quality and editorial-review standards.
- FAQ.
- Privacy policy and child/parent privacy disclosures reviewed for COPPA and applicable state law.
- Terms of service and subscription/cancellation terms.
- Contact/support route.
- Parent-facing billing and cancellation flow.
- Brand asset kit.
- Screenshot/demo library using synthetic data only.
- Campaign UTM convention and dashboard specification.
- Email lifecycle copy and provider configuration after legal/privacy approval.
- Paid-search keyword/negative-keyword sheet and creative matrix after budget approval.

## 10. Marketing safeguards for a youth education product
- Do not behavioral-target children under 13.
- Do not combine child learning data with advertising profiles.
- Keep marketing analytics separate from learner performance data unless a reviewed, lawful attribution design explicitly allows a narrow join.
- Do not use test scores, disability/accommodation data, school data, or uploaded assessment records for advertising segmentation.
- Use synthetic student examples in public marketing unless explicit, documented consent authorizes a real testimonial/case study.
- Build retention around educational value, not manipulative engagement patterns.
- Obtain legal review before launching referral incentives, testimonials involving minors, school partnerships, or cross-platform advertising audiences.

## 11. Decision gates requiring explicit approval
- Live Stripe activation or pricing changes.
- Any ad spend.
- Creation/connection of Google Ads, Meta, TikTok, Microsoft Ads, email-provider, affiliate, or social publishing accounts.
- Public outbound email or partnership outreach.
- Retargeting, lookalike audiences, or customer-list matching.
- Referral rewards or affiliate commissions.
- Final privacy/terms publication.
- Use of real student outcomes or testimonials in marketing.

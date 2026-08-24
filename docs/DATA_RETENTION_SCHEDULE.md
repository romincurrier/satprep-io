# SATprep.io Proposed Data Retention and Deletion Schedule

Status: **pre-launch proposal for engineering/privacy/legal review; not yet an activated production policy.** The periods below are conservative starting targets intended to prevent indefinite retention. Qualified counsel and operational owners must approve the final schedule, and the published privacy notice must match the implemented behavior.

## Principles
1. Retain personal data only while it serves a documented product, account, security, support, billing, or legal purpose.
2. Raw/high-detail source data should normally have a shorter life than validated derived learning signals.
3. A canceled subscription is not automatically the same as an account deletion request; the product must clearly distinguish them.
4. Under-13 data should not remain after parental deletion/withdrawal when continued retention is not required or permitted.
5. Backups/logs must have a known expiration lifecycle so deletion is not defeated by indefinite secondary copies.
6. Financial records that must be retained should be separated from unnecessary learning data.

## Proposed schedule for approval
| Category | Proposed operational retention | Trigger | Proposed deletion/anonymization action | Rationale / open review |
| --- | --- | --- | --- | --- |
| Uncompleted under-13 parent setup request | 30 days | Request created without completed parent-controlled setup | Delete request record/contact email | Enough time to finish setup without building a long-lived list of parent emails |
| Expired/unused parent invitation token | 30 days after expiration | Invitation expires/revoked | Delete token; optionally retain minimal non-identifying delivery/audit status if needed | Token is credential-like and should not persist indefinitely |
| Raw uploaded assessment file | 90 days after successful validated processing, or earlier on verified deletion request | Parser successfully creates normalized evidence | Delete private storage object after support/review window | Raw reports can contain more information than SATprep.io needs long term; final duration needs support/legal review |
| Raw extracted assessment text | 30 days after successful validated processing | Parsed/validated | Delete or replace with minimal parser/debug metadata | Extracted text can reproduce sensitive report content and should have a shorter life than normalized scores |
| Parser error/debug text for failed upload | 30 days | Failed/needs-review state | Delete text after resolution window; retain error class only if useful | Avoid retaining an entire failed report indefinitely |
| Normalized prior assessment scores/evidence | While account active; proposed deletion within 30 days after verified account/learner deletion request unless a lawful exception applies | Active learning purpose ends | Delete learner-linked evidence; aggregate only if irreversibly de-identified and approved | Core personalization input; no advertising use |
| Student profile/goals | While account active; proposed deletion within 30 days after verified account deletion request | Account deletion confirmed | Delete learner profile/targets/DOB according to final cascade design | Needed for active service only |
| DOB / age-at-signup | While account active; proposed delete/anonymize with account unless required for a documented compliance record | Account deletion confirmed | Remove learner DOB from active systems; separately retain only minimal consent/age compliance evidence if counsel says required | High sensitivity; do not retain “just in case” |
| Diagnostic attempts/responses | While account active; proposed deletion within 30 days after learner/account deletion request | Active learning purpose ends | Delete learner-linked attempts/responses; calibration use only from approved de-identified aggregates | Required for learning model and resume; not an ad audience |
| Practice/question attempts | While account active; proposed deletion within 30 days after learner/account deletion request | Active learning purpose ends | Delete learner-linked attempts; retain approved de-identified aggregate item statistics if they cannot be reidentified | Supports mastery and item calibration |
| Skill mastery / lesson progress / journey | While account active; proposed deletion within 30 days after learner/account deletion request | Active service ends via deletion | Delete learner-linked records | Core service data |
| Parent-student relationship | While household/learner account exists; delete promptly with household/learner deletion | Relationship/account deleted | Delete linkage | Authorization data should not outlive relationship |
| Account/auth profile | While account active; proposed delete/deactivate promptly after verified closure request, with full operational cleanup within 30 days | Verified closure | Delete Auth/profile subject to fraud/security/legal exceptions defined by counsel | Final Supabase Auth deletion workflow must be tested |
| Subscription entitlement data in SATprep.io | Active subscription plus proposed 24 months after termination unless accounting/legal need requires a different period | Subscription ends | Remove unneeded provider/session details; retain only required financial/accounting linkage | Requires accountant/counsel review before finalizing |
| Stripe financial/payment records | Per Stripe settings and applicable accounting/tax/legal requirements | Transaction/subscription | SATprep.io should request/execute deletion where appropriate but must not promise deletion of records required by Stripe/law | Raw card data is not intended to be stored by SATprep.io |
| Privacy request case | Proposed 3 years after closure, containing only what is needed to prove request handling | Request completed | Delete attachments/excess personal data earlier; keep minimal compliance audit record | Duration requires counsel approval based on applicable law/statute considerations |
| Support ticket | Proposed 12 months after closure; Restricted attachments shorter (90 days after resolution) unless needed for active dispute | Ticket resolved | Delete attachments first; minimize remaining ticket text | Balance recurring support context against sensitivity |
| Security incident record | Proposed 5 years for material incidents; minimize personal data after investigation/notification decisions | Incident closed | Preserve necessary audit/evidence record; delete copied raw customer data when no longer needed | Exact duration requires security/legal/insurance review |
| Marketing anonymous event | Proposed 13 months maximum, preferably shorter if reporting needs allow | Event captured | Delete event row or aggregate irreversibly | Avoid building long-lived visitor histories |
| UTM attribution | Proposed 13 months maximum unless aggregated sooner | Campaign visit | Delete/purge raw attribution; keep non-identifying campaign totals | No score/learner-performance fields permitted |
| Rate-limit counters | Automatically expire/delete shortly after enforcement window; target ≤24 hours | Window closes | Purge expired counters | Operational anti-abuse only; subjects are hashed |
| Server/runtime logs | Proposed 30 days for standard logs, shorter where provider permits; security exceptions documented | Log created | Provider expiration/deletion | Must verify Vercel/Supabase configured retention and log payload minimization |
| Build/deployment logs | Proposed provider minimum practical retention consistent with operations | Build/deploy | Provider lifecycle | Should never contain real student records or secrets |
| Content review/calibration artifacts | Retain while content/version is in service plus audit period; calibration dataset must be aggregate/de-identified | Content lifecycle | Retire item-specific internal records when no longer needed | Primarily proprietary/internal, not learner PI if correctly aggregated |
| Backup copies | Target maximum lifecycle documented from actual Supabase/vendor plan; goal is deletion through normal backup expiry without indefinite archives | Backup created | Automatic expiry; no restoration except operational need | Final privacy notice must explain practical backup deletion behavior accurately |

## Cancellation versus deletion
### Subscription cancellation
Default proposal:
- Stop future billing according to approved terms.
- Keep account/learning data available for a defined grace/inactive period if the customer has not requested deletion.
- Tell the user how to delete the account separately.
- Do not keep raw assessment files longer merely because billing ended.

### Account deletion
Default proposal:
- Verify request authority.
- Freeze new collection/use that is not needed to process deletion/security.
- Remove active authentication/access.
- Delete learner-linked records according to cascade/deletion workflow.
- Delete private storage objects.
- Request/perform downstream processor deletion where applicable.
- Retain only records required for legal, security, fraud, accounting, or compliance purposes, documented by category.
- Communicate that backup copies expire according to the documented backup lifecycle rather than claiming instantaneous removal from every backup.

## Parental consent withdrawal / under-13 deletion
The final workflow must support a parent/guardian's legally reviewed right to:
- review stored child information;
- request deletion;
- refuse further collection/use where applicable;
- revoke consent.

Engineering proposal:
1. verify parent is linked/authorized;
2. set learner account to a restricted/deletion-pending state;
3. prevent new learning collection except what is necessary to finish the request;
4. delete raw uploads immediately or as quickly as operationally safe;
5. delete primary learner records within the approved SLA;
6. initiate processor deletion;
7. retain minimal request/consent audit evidence only if counsel confirms a need;
8. allow backup copies to expire under the approved backup schedule.

## Raw assessment cleanup implementation requirement
Before commercial launch, build a server-controlled cleanup job or operational procedure that can find:
- successfully processed uploads older than the approved raw-file retention period;
- extracted text older than its approved period;
- failed/abandoned uploads older than their resolution period;
- orphaned storage objects with no valid assessment record.

The cleanup must log only assessment/storage identifiers and outcome, not report contents.

## Account deletion implementation requirement
A tested deletion routine should inventory and remove, as applicable:
- Auth account/profile;
- student record;
- parent-student/household links;
- diagnostic attempts, plans, and responses;
- question attempts;
- skill mastery;
- lesson progress;
- journey/achievement records;
- prior assessment metadata/evidence;
- uploaded assessment storage objects;
- invitations/setup requests tied to the account where appropriate;
- marketing-attribution joins if any are ever approved;
- support/private attachments;
- privacy-request artifacts beyond minimal required audit record.

Do not rely on database cascades alone until every table/storage object has been tested.

## Production verification checklist
- [ ] Counsel/privacy owner approves each period or substitutes a documented period.
- [ ] Finance/accounting owner approves financial-record periods.
- [ ] Supabase backup/log/storage lifecycle is documented.
- [ ] Vercel log retention is documented/configured.
- [ ] Stripe retention/deletion limitations are documented in user-facing policy accurately.
- [ ] Automated/manual cleanup jobs are implemented and observable.
- [ ] Deletion is tested with a synthetic household containing uploads, diagnostics, practice, subscriptions, and support records.
- [ ] A restored backup does not silently reactivate a deleted account without a reconciliation control.
- [ ] Privacy notice matches implemented periods and exceptions.
- [ ] Support runbook explains deletion versus cancellation clearly.

## Launch gate
No public policy should promise these proposed periods until engineering verifies they are technically achievable and legal/privacy/finance owners approve them. Once approved, replace “proposed” language with the adopted schedule and version it with an effective date.

import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../migrations/20260828_parental_consents_reader_rls_initplan.sql', import.meta.url), 'utf8');

assert.match(migration, /\(select auth\.uid\(\)\)/i, 'Parental-consents read optimization must cache auth.uid() through an InitPlan.');
assert.equal((migration.match(/alter policy/gi) || []).length, 1, 'Parental-consents tranche must alter exactly one reader policy.');
assert.match(migration, /alter policy ["']?consent_parties_read["']?/i, 'consent_parties_read must remain explicitly covered.');
assert.doesNotMatch(migration, /alter\s+policy\s+["']?admin_consent_all["']?/i, 'Parental-consents read tranche must leave the administrator ALL policy untouched.');
assert.doesNotMatch(migration, /alter\s+policy\s+["']?parent_consent_insert["']?/i, 'Parental-consents read tranche must leave the parent INSERT policy untouched.');
assert.doesNotMatch(migration, /\bto\s+(authenticated|anon|public|service_role)\b/i, 'Parental-consents InitPlan migration must not change policy role targets.');
assert.doesNotMatch(migration, /drop\s+policy|create\s+policy/i, 'Parental-consents InitPlan migration must alter the existing policy rather than replacing it.');
assert.doesNotMatch(migration, /grant\s|revoke\s/i, 'Parental-consents InitPlan migration must not alter privileges.');
assert.doesNotMatch(migration, /\bfor\s+(insert|update|delete)\b|with\s+check/i, 'Parental-consents tranche must remain read-only and must not introduce write predicates.');
assert.match(migration, /student_profile_id\s*=\s*\(select auth\.uid\(\)\)/i, 'Parental-consents reads must preserve student-party scope.');
assert.match(migration, /parent_profile_id\s*=\s*\(select auth\.uid\(\)\)/i, 'Parental-consents reads must preserve parent-party scope.');

console.log('Parental-consents read RLS InitPlan boundary checks passed.');

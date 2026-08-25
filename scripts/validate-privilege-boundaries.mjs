import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),errors=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),fail=m=>errors.push(m);

const migration=read('migrations/20260824_profile_privilege_lock.sql');
if(!/revoke update on table public\.profiles from authenticated/i.test(migration))fail('Profile privilege migration must revoke table-wide authenticated UPDATE.');
if(!/grant update \(first_name, last_name\) on table public\.profiles to authenticated/i.test(migration))fail('Authenticated profile updates must be limited to first_name and last_name.');
if(!/revoke insert, update, delete on table public\.profiles from anon/i.test(migration))fail('Anonymous roles must have no profile mutation grants.');

const learningLock=read('migrations/20260825_trusted_learning_authority.sql');
for(const table of ['skill_mastery','lesson_progress','question_attempts'])if(!new RegExp(`revoke insert, update, delete on table public\\.${table} from anon, authenticated`,'i').test(learningLock))fail(`${table}: trusted-learning migration must revoke browser mutation grants.`);
if(!/drop policy if exists "skill_student_all" on public\.skill_mastery/i.test(learningLock)||!/create policy "skill_student_read" on public\.skill_mastery for select/i.test(learningLock))fail('Trusted-learning migration must replace browser-wide skill mastery authority with read-only student visibility.');
if(!/drop policy if exists "lesson_student_all" on public\.lesson_progress/i.test(learningLock)||!/create policy "lesson_student_read" on public\.lesson_progress for select/i.test(learningLock))fail('Trusted-learning migration must replace browser-wide lesson progress authority with read-only student visibility.');
if(!/drop policy if exists "attempt_student_insert" on public\.question_attempts/i.test(learningLock))fail('Trusted-learning migration must retire legacy browser question-attempt insertion.');
if(!/Apply only after the secure server-scored practice\/diagnostic paths are live and verified/i.test(learningLock))fail('Trusted-learning migration must retain an explicit apply-only-after-server-verification safety instruction.');

const baseSchema=read('schema.sql');
if(!/create policy "profile_self_update"/i.test(baseSchema))fail('Validator expected the legacy self-update policy so the column-grant mitigation remains necessary and explicit.');
if(!/create policy "skill_student_all"/i.test(baseSchema)||!/create policy "lesson_student_all"/i.test(baseSchema)||!/create policy "attempt_student_insert"/i.test(baseSchema))fail('Validator expected legacy browser learning-authority policies so the staged retirement migration remains explicit.');
const adminMigration=read('migrations/20260814_add_names_admin_billing.sql');
if(!/create or replace function public\.is_admin\(\)/i.test(adminMigration)||!/role = 'admin'/i.test(adminMigration))fail('Admin authorization basis changed; re-review the profile privilege lock.');

function walk(dir='.'){
 for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  const rel=path.join(dir,entry.name).replace(/^\.\//,'').replaceAll('\\','/');
  if(['node_modules','.git','dist','api','server','scripts','migrations'].some(x=>rel===x||rel.startsWith(`${x}/`)))continue;
  if(entry.isDirectory()){walk(rel);continue}
  if(!/\.(js|mjs|html)$/.test(entry.name))continue;
  const txt=fs.readFileSync(path.join(root,rel),'utf8');
  const profileUpdates=[...txt.matchAll(/\.from\(["']profiles["']\)\.update\((\{[\s\S]{0,800}?\})\)/g)];
  for(const m of profileUpdates)if(/\b(role|household_id|billing_owner|email|date_of_birth)\s*:/.test(m[1]))fail(`${rel}: browser code must not update profile authority/identity field directly.`);
 }
}
walk();

if(errors.length){for(const e of errors)console.error(`Privilege boundary validation error: ${e}`);process.exit(1)}
console.log('Privilege boundary validation passed: profile self-promotion is blocked and trusted learning-state browser mutations have a staged retirement lock.');

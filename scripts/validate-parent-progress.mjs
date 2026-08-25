import fs from 'node:fs';

const endpoint=fs.readFileSync(new URL('../api/parent-progress.js',import.meta.url),'utf8');
const practiceMigration=fs.readFileSync(new URL('../migrations/20260824_practice_sessions.sql',import.meta.url),'utf8');
const failures=[];
const requireText=(text,label)=>{if(!endpoint.includes(text))failures.push(label)};

requireText("profile?.role==='parent'&&profile.household_id",'Parent progress API must require a parent role with a household.');
requireText("household_id=eq.${encodeURIComponent(ctx.profile.household_id)}",'Parent progress API must scope the requested student to the parent household.');
requireText("enforceRateLimit(ctx.user.id,'parent/progress'",'Parent progress API must retain rate limiting.');
requireText('scored_by_server=eq.true','Parent progress accuracy must use server-scored practice responses only.');
requireText('select=is_correct,created_at','Parent progress must request only aggregate-safe practice-response fields.');
requireText('trustedPracticeReady','Parent progress must disclose when trusted practice reporting is unavailable.');

for(const forbidden of ['content_answer_keys','selected_answer,response_text','correct_answer','explanation']){
 if(endpoint.includes(forbidden))failures.push(`Parent progress API must not expose or request sensitive practice material: ${forbidden}`);
}
for(const table of ['practice_sessions','practice_session_items','practice_responses']){
 const revoke=`revoke all on table public.${table} from public, anon, authenticated;`;
 if(!practiceMigration.includes(revoke))failures.push(`${table} must remain browser-inaccessible while parent reporting is server-mediated.`);
}

if(failures.length){console.error('Parent progress validation failed:');for(const failure of failures)console.error(`- ${failure}`);process.exit(1)}
console.log('Parent progress validation passed.');

import fs from 'node:fs';

const endpoint=fs.readFileSync(new URL('../api/parent-progress.js',import.meta.url),'utf8');
const householdEndpoint=fs.readFileSync(new URL('../api/parent-household-overview.js',import.meta.url),'utf8');
const dashboard=fs.readFileSync(new URL('../parent-dashboard.js',import.meta.url),'utf8');
const practiceMigration=fs.readFileSync(new URL('../migrations/20260824_practice_sessions.sql',import.meta.url),'utf8');
const failures=[];
const requireEndpoint=(text,label)=>{if(!endpoint.includes(text))failures.push(label)};
const requireHousehold=(text,label)=>{if(!householdEndpoint.includes(text))failures.push(label)};
const requireDashboard=(text,label)=>{if(!dashboard.includes(text))failures.push(label)};

requireEndpoint('assertAppRequestOrigin(req);','Parent progress API must require same-application origin.');
requireEndpoint("profile?.role==='parent'&&profile.household_id",'Parent progress API must require a parent role with a household.');
requireEndpoint("household_id=eq.${encodeURIComponent(ctx.profile.household_id)}",'Parent progress API must scope the requested student to the parent household.');
requireEndpoint("enforceRateLimit(ctx.user.id,'parent/progress'",'Parent progress API must retain rate limiting.');
requireEndpoint('scored_by_server=eq.true','Parent progress accuracy must use server-scored practice responses only.');
requireEndpoint('select=is_correct,created_at','Parent progress must request only aggregate-safe practice-response fields.');
requireEndpoint('trustedPracticeReady','Parent progress must disclose when trusted practice reporting is unavailable.');

for(const forbidden of ['content_answer_keys','selected_answer,response_text','correct_answer','explanation']){
 if(endpoint.includes(forbidden))failures.push(`Parent progress API must not expose or request sensitive practice material: ${forbidden}`);
}

requireHousehold('assertAppRequestOrigin(req);','Parent household overview API must require same-application origin.');
requireHousehold("profile?.role==='parent'&&profile.household_id",'Parent household overview must require a parent role with an established household.');
requireHousehold("household_id=eq.${encodeURIComponent(ctx.profile.household_id)}",'Parent household overview must scope student metadata to the authenticated parent household.');
requireHousehold("enforceRateLimit(ctx.user.id,'parent/household-overview'",'Parent household overview must retain rate limiting.');

requireDashboard('/api/parent-household-overview','Parent dashboard must load household metadata through the trusted server API.');
requireDashboard('/api/parent-progress','Parent dashboard must load learning summaries through the server-mediated parent progress API.');
requireDashboard('trustedPracticeReady','Parent dashboard must distinguish trusted guided-practice reporting from unavailable legacy state.');
for(const forbidden of ['.from("profiles")','.from("students")','.from("question_attempts")','.from("skill_mastery")','.from("lesson_progress")']){
 if(dashboard.includes(forbidden))failures.push(`Parent dashboard must not directly read trusted household/learning state in the browser: ${forbidden}`);
}

for(const table of ['practice_sessions','practice_session_items','practice_responses']){
 const revoke=`revoke all on table public.${table} from public, anon, authenticated;`;
 if(!practiceMigration.includes(revoke))failures.push(`${table} must remain browser-inaccessible while parent reporting is server-mediated.`);
}

if(failures.length){
 console.error('Parent progress validation failed:');
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}
console.log('Parent household/progress validation passed.');

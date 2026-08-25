import process from 'node:process';
import {createHash} from 'node:crypto';
import {SKILL_INDEX,skillEligibleForExam} from '../sat-spec.js';
import {COMMERCIAL_CONTENT_POLICY,evaluateSkillCoverage} from '../commercial-content-policy.js';
import {databaseReviewContent} from '../content-integrity.js';
import {answerSpec} from '../server/response-scoring.js';

const REQUIRED_REVIEWS=['accuracy','alignment','editorial','bias_accessibility','originality'];
const EXAMS=['SAT','PSAT/NMSQT','PSAT 10'];
const url=String(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'').replace(/\/$/,'');
const serviceKey=String(process.env.SUPABASE_SERVICE_ROLE_KEY||'');
const expectedProjectRef=String(process.env.SATPREP_EXPECTED_SUPABASE_REF||'ataaiocpbjavmdpgmzlv').trim();
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||!serviceKey){console.error('SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.');process.exit(2)}
const projectRef=new URL(url).hostname.split('.')[0];
if(!expectedProjectRef||projectRef!==expectedProjectRef){console.error(`Refusing live-content verification: configured Supabase project ${projectRef||'(unknown)'} does not match expected SATprep.io project ${expectedProjectRef||'(missing)'}.`);process.exit(3)}

async function get(path){const r=await fetch(`${url}${path}`,{headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,Accept:'application/json'}});if(!r.ok)throw new Error(`${path} failed (${r.status}): ${(await r.text()).slice(0,300)}`);return r.json()}
const [items,keys,reviews]=await Promise.all([
 get('/rest/v1/content_items?qa_status=eq.production_approved&active=eq.true&select=id,content_type,section,domain_key,skill_key,difficulty,format,stimulus,stem,choices,exams,estimated_seconds,origin,qa_status,active&order=id.asc&limit=5000'),
 get('/rest/v1/content_answer_keys?select=item_id,answer,explanation&limit=5000'),
 get('/rest/v1/content_item_reviews?select=id,item_id,review_type,reviewer_label,decision,content_hash,created_at&order=created_at.asc,id.asc&limit=10000')
]);
const keyMap=new Map((keys||[]).map(x=>[x.item_id,x])),reviewMap=new Map();
for(const r of reviews||[]){if(!r.item_id||!REQUIRED_REVIEWS.includes(r.review_type))continue;const byType=reviewMap.get(r.item_id)||new Map();byType.set(r.review_type,r);reviewMap.set(r.item_id,byType)}
function approved(row){
 const key=keyMap.get(row.id),format=row.format||'mcq',spec=answerSpec(format,key?.answer);
 if(!spec||typeof key?.explanation!=='string'||row.origin!=='satprep_original')return false;
 if(format!=='mcq'&&!(format==='spr'&&row.section==='MATH'))return false;
 const hash=createHash('sha256').update(JSON.stringify(databaseReviewContent(row.content_type,row,key))).digest('hex'),byType=reviewMap.get(row.id);
 return REQUIRED_REVIEWS.every(type=>{const r=byType?.get(type);return r?.decision==='approve'&&!!String(r.reviewer_label||'').trim()&&r.content_hash===hash});
}
const approvedItems=(items||[]).filter(approved);
const failures=[],rows=[];
for(const exam of EXAMS){
 for(const [skill,meta] of Object.entries(SKILL_INDEX)){
  if(!skillEligibleForExam(skill,exam))continue;
  for(const type of ['diagnostic','practice']){
   const pool=approvedItems.filter(x=>x.content_type===type&&x.skill_key===skill&&Array.isArray(x.exams)&&x.exams.includes(exam)),coverage=evaluateSkillCoverage(pool,type);
   const mathSpr=meta.section==='MATH'?pool.filter(x=>x.format==='spr').length:null;
   rows.push({exam,section:meta.section,skill,content:type,approved:coverage.depth,d1:coverage.byDifficulty[1],d2:coverage.byDifficulty[2],d3:coverage.byDifficulty[3],spr:mathSpr,ready:coverage.ready});
   if(!coverage.ready)failures.push(`${exam} ${type} ${skill}: ${coverage.shortfalls.join(', ')}`);
  }
 }
}
const invalidProduction=(items||[]).filter(x=>!approved(x));
console.log(`Live SATprep.io content readiness — project ${projectRef}`);
console.log(`Active production_approved rows: ${(items||[]).length}; exact-hash approved and runtime-usable: ${approvedItems.length}; invalid/stale/incomplete approvals: ${invalidProduction.length}.`);
console.log(`Policy: diagnostic ${COMMERCIAL_CONTENT_POLICY.diagnostic.minApprovedPerSkill}/skill with all three difficulty levels; practice ${COMMERCIAL_CONTENT_POLICY.practice.minApprovedPerSkill}/skill with adaptive minimum mix ${COMMERCIAL_CONTENT_POLICY.practice.minByDifficulty[1]}/${COMMERCIAL_CONTENT_POLICY.practice.minByDifficulty[2]}/${COMMERCIAL_CONTENT_POLICY.practice.minByDifficulty[3]} across difficulty 1/2/3.`);
console.table(rows);
if(invalidProduction.length)console.warn(`Production-approved rows that currently fail the exact runtime approval contract: ${invalidProduction.map(x=>x.id).join(', ')}`);
if(failures.length){console.warn(`\nCommercial content gaps (${failures.length} exam/type/skill checks):`);for(const f of failures)console.warn(`- ${f}`)}
if(process.argv.includes('--strict')&&failures.length){console.error('\nLive content readiness FAILED. Do not claim full commercial content readiness.');process.exit(1)}
console.log(failures.length?'\nReport complete. Use --strict for a launch-blocking result.':'\nLive content depth and exact-hash review readiness passed for all eligible exam/skill combinations.');

import path from 'node:path';
import process from 'node:process';
import XLSX from 'xlsx';
import {SKILL_INDEX,skillEligibleForExam} from '../sat-spec.js';
import {COMMERCIAL_CONTENT_POLICY,evaluateSkillCoverage} from '../commercial-content-policy.js';

const REVIEW_TYPES=['accuracy','alignment','editorial','bias_accessibility','originality'];
const MIN_INDEPENDENT_REVIEWERS=3;
const MAX_DIMENSIONS_PER_REVIEWER=2;
const EXAMS=['SAT','PSAT/NMSQT','PSAT 10'];
const file=process.argv[2];
if(!file){console.error('Usage: node scripts/private-content-readiness-report.mjs /absolute/private/content-review.csv [--strict]');process.exit(2)}
if(!path.isAbsolute(file)){console.error('For safety, provide an absolute path to a private review file outside the public repository.');process.exit(2)}
const resolved=path.resolve(file),root=path.resolve(process.cwd());
if(resolved===root||resolved.startsWith(`${root}${path.sep}`)){console.error('Refusing to read proprietary content from inside the public repository.');process.exit(2)}

const workbook=XLSX.readFile(resolved,{cellDates:false});
const sheet=workbook.Sheets[workbook.SheetNames[0]];
const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
if(!rows.length){console.error('Private review file has no rows.');process.exit(2)}
const norm=value=>String(value??'').trim();
const approvedDecision=value=>norm(value).toUpperCase()==='APPROVE';

function independent(row){
 const counts=new Map();
 for(const type of REVIEW_TYPES){
  if(!approvedDecision(row[`${type}_review`]))return false;
  const reviewer=norm(row[`${type}_reviewer`]||row.reviewer).toLowerCase();
  if(!reviewer)return false;
  counts.set(reviewer,(counts.get(reviewer)||0)+1);
 }
 return counts.size>=MIN_INDEPENDENT_REVIEWERS&&Math.max(...counts.values())<=MAX_DIMENSIONS_PER_REVIEWER;
}

const accepted=[],rejected=[];
for(const [index,row] of rows.entries()){
 const kind=norm(row.content_type).toLowerCase(),skill=norm(row.skill_key),section=norm(row.section).toUpperCase(),difficulty=Number(row.difficulty),format=(norm(row.response_format)||'mcq').toLowerCase(),exams=norm(row.exam_eligibility).split('|').map(x=>x.trim()).filter(Boolean);
 const validKind=['diagnostic','practice'].includes(kind),validSkill=!!SKILL_INDEX[skill],validDifficulty=[1,2,3].includes(difficulty),validFormat=format==='mcq'||(format==='spr'&&section==='MATH'),validSection=validSkill&&SKILL_INDEX[skill].section===section;
 if(!validKind||!validSkill||!validDifficulty||!validFormat||!validSection||!independent(row)){
  rejected.push({row:index+2,item_id:norm(row.item_id)||'(missing)',reason:!validKind?'content type':!validSkill?'skill':!validSection?'section':!validDifficulty?'difficulty':!validFormat?'response format':'review independence'});
  continue;
 }
 accepted.push({id:norm(row.item_id),kind,skill,section,difficulty,format,exams:exams.length?exams:EXAMS});
}

const report=[],failures=[];
for(const exam of EXAMS){
 for(const [skill,meta] of Object.entries(SKILL_INDEX)){
  if(!skillEligibleForExam(skill,exam))continue;
  for(const kind of ['diagnostic','practice']){
   const pool=accepted.filter(item=>item.kind===kind&&item.skill===skill&&item.exams.includes(exam));
   const coverage=evaluateSkillCoverage(pool,kind);
   const spr=meta.section==='MATH'?pool.filter(item=>item.format==='spr').length:null;
   report.push({exam,section:meta.section,skill,content:kind,approved:coverage.depth,d1:coverage.byDifficulty[1],d2:coverage.byDifficulty[2],d3:coverage.byDifficulty[3],spr,ready:coverage.ready});
   if(!coverage.ready)failures.push(`${exam} ${kind} ${skill}: ${coverage.shortfalls.join(', ')}`);
  }
 }
}

console.log(`Private commercial content readiness preflight: ${accepted.length} rows satisfy metadata and reviewer-independence requirements; ${rejected.length} rows are excluded.`);
console.log(`Policy: diagnostic ${COMMERCIAL_CONTENT_POLICY.diagnostic.minApprovedPerSkill}/skill; practice ${COMMERCIAL_CONTENT_POLICY.practice.minApprovedPerSkill}/skill. At least ${MIN_INDEPENDENT_REVIEWERS} reviewers are required per item, with no reviewer covering more than ${MAX_DIMENSIONS_PER_REVIEWER} dimensions.`);
console.table(report);
if(rejected.length){
 console.warn('\nRows excluded from readiness counts (question text is intentionally not shown):');
 for(const entry of rejected.slice(0,100))console.warn(`- row ${entry.row}, item ${entry.item_id}: ${entry.reason}`);
 if(rejected.length>100)console.warn(`- plus ${rejected.length-100} additional excluded rows`);
}
if(failures.length){
 console.warn(`\nCommercial coverage gaps (${failures.length} exam/type/skill checks):`);
 for(const failure of failures)console.warn(`- ${failure}`);
}
if(process.argv.includes('--strict')&&(rejected.length||failures.length)){
 console.error('\nPrivate commercial content readiness FAILED. Continue authoring/review before import or launch certification.');
 process.exit(1);
}
console.log(failures.length?'\nPreflight complete. Use --strict to make gaps blocking.':'\nPrivate reviewed content meets the current commercial depth policy for all eligible exam/skill combinations represented by this file.');

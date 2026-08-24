export const ASSESSMENT_PARSER_VERSION='ctp-2.0';

export async function extractPdfLayout(pdfjsLib,blob){
  const data=new Uint8Array(await blob.arrayBuffer());
  const pdf=await pdfjsLib.getDocument({data}).promise;
  const pages=[]; const lines=[];
  for(let n=1;n<=pdf.numPages;n++){
    const page=await pdf.getPage(n);
    const content=await page.getTextContent();
    const items=content.items.map(i=>({text:String(i.str||'').trim(),x:Number(i.transform?.[4]||0),y:Number(i.transform?.[5]||0)})).filter(i=>i.text);
    const rows=[];
    for(const item of items){let row=rows.find(r=>Math.abs(r.y-item.y)<=2.5);if(!row){row={y:item.y,items:[]};rows.push(row)}row.items.push(item)}
    rows.sort((a,b)=>b.y-a.y);
    const pageLines=rows.map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' | ').replace(/\s+/g,' ').trim()).filter(Boolean);
    pages.push(pageLines); lines.push(...pageLines);
  }
  return {text:lines.join('\n'),lines,pages};
}

const CTP_NORMS=[
  {key:'national',label:'National Norm Group'},
  {key:'suburban_public',label:'Suburban Public Schools'},
  {key:'independent',label:'Independent Schools'},
  {key:'fcis',label:'FCIS'}
];

const CTP_MAJOR=[
  'Vocabulary','Reading Comprehension','Writing Mechanics','Writing Concepts & Skills','Mathematics 1&2'
];

const CTP_CONTENT=[
  ['Vocabulary','Vocabulary'],['Word Meanings','Vocabulary'],['Precision','Precision'],['Application','Vocabulary'],
  ['Reading Comprehension','Reading Comprehension'],['Explicit Information','Evidence'],['Inference','Inference'],['Analysis','Analysis'],
  ['Writing Mechanics','Writing Mechanics'],['Spelling','Writing Mechanics'],['Capitalization','Writing Mechanics'],['Punctuation','Writing Mechanics'],['Usage','Writing Mechanics'],
  ['Writing Concepts & Skills','Writing Concepts'],['Organization','Organization'],['Purpose, Audience, Focus','Purpose'],['Supporting Details','Evidence'],['Style and Craft','Style'],
  ['Mathematics 1&2','Math'],['Num. Sense & Oper. w. Whole Num.','Number Sense'],['Num. Sense & Oper. w. Fractions & Dec.','Fractions & Decimals'],
  ['Geometry and Spatial Sense','Geometry'],['Measurement','Measurement'],['Data Analysis, Statistics and Prob.','Data Analysis'],['Patterns, Functions, Pre-Algebra','Pre-Algebra'],
  ['Conceptual Understanding','Math Concepts'],['Procedural Knowledge','Math Procedures'],['Problem Solving','Problem Solving']
];

function escRe(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s*')}
function detectType(text,fileName=''){const s=`${fileName} ${text}`.toLowerCase();if(/\bctp\b|educational records bureau|percent content mastery/.test(s))return'CTP';if(/\berb\b/.test(s))return'ERB';if(/map growth|nwea/.test(s))return'MAP Growth';if(/\bfast\b|florida assessment/.test(s))return'FAST';if(/psat\/nmsqt|nmsqt/.test(s))return'PSAT/NMSQT';if(/\bpsat\b/.test(s))return'PSAT';if(/\bsat\b/.test(s))return'SAT';return'Other'}
function normalize(text){return String(text||'').replace(/\s*\|\s*/g,' ').replace(/\s+/g,' ').trim()}
function yearFromText(text){const years=[...text.matchAll(/\b(20\d{2})\b/g)].map(m=>Number(m[1]));return years.length?Math.max(...years):null}
function testDate(text){const year=yearFromText(text);let m=text.match(/Test Date\s*:\s*(\d{1,2})\/(\d{2})(?:\s*\([^)]*\))?/i);if(m&&year){const month=String(Number(m[1])).padStart(2,'0');return `${year}-${month}-01`}m=text.match(/Test Date\s*:\s*(\d{1,2})\/(\d{1,2})\/(20\d{2})/i);if(m)return `${m[3]}-${String(Number(m[1])).padStart(2,'0')}-${String(Number(m[2])).padStart(2,'0')}`;return null}

function parseCtpMajor(text){
  const sections=[];
  for(const name of CTP_MAJOR){
    const re=new RegExp(`${escRe(name)}\\s+(\\d{3,4})\\s+(\\d{1,3})\\s+(\\d)\\s+(\\d{1,3})\\s+(\\d)\\s+(\\d{1,3})\\s+(\\d)\\s+(\\d{1,3})\\s+(\\d)`,'i');
    const m=text.match(re); if(!m)continue;
    const pairs=[[m[2],m[3]],[m[4],m[5]],[m[6],m[7]],[m[8],m[9]]];
    const norm_results={}; CTP_NORMS.forEach((n,i)=>norm_results[n.key]={label:n.label,percentile:Number(pairs[i][0]),stanine:Number(pairs[i][1])});
    sections.push({name,scale_score:Number(m[1]),norm_results,percentile:norm_results.independent.percentile,stanine:norm_results.independent.stanine,percentile_basis:'Independent Schools'});
  }
  return sections;
}

function masteryRegion(text){const start=text.search(/Tests\s+Content\s+Categories\s+Student\s+Percent\s+Mastery\s+of\s+Content/i);if(start<0)return text;const tail=text.slice(start);const end=tail.search(/Copyright\s+©|All rights reserved/i);return end>0?tail.slice(0,end):tail}
function parseCtpMastery(text){
  const region=masteryRegion(text),rows=[];
  for(const [source,canonical] of CTP_CONTENT){
    const re=new RegExp(`${escRe(source)}\\s+(\\d{1,3})(?=\\s|$)`,'i');
    const m=region.match(re); if(!m)continue;
    const score=Number(m[1]); if(score<0||score>100)continue;
    if(!rows.some(r=>r.source_skill===source))rows.push({source_skill:source,canonical_skill:canonical,mastery:score});
  }
  return rows;
}

function ctpSignals(data){
  const signals=[];
  for(const row of data.content_mastery||[])signals.push({source_skill:row.source_skill,canonical_skill:row.canonical_skill,score_kind:'content_mastery',score_value:row.mastery,norm_group:null,reliability:1.0});
  for(const s of data.sections||[]){for(const [key,n] of Object.entries(s.norm_results||{})){if(n.percentile!=null)signals.push({source_skill:s.name,canonical_skill:canonicalMajor(s.name),score_kind:'percentile',score_value:n.percentile,norm_group:key,reliability:key==='independent'?0.9:0.75})}}
  return signals;
}
function canonicalMajor(name){return ({'Vocabulary':'Vocabulary','Reading Comprehension':'Reading Comprehension','Writing Mechanics':'Writing Mechanics','Writing Concepts & Skills':'Writing Concepts','Mathematics 1&2':'Math'})[name]||name}
function classify(rows){
  const priorities=rows.filter(r=>r.mastery<70).sort((a,b)=>a.mastery-b.mastery);
  const strengths=rows.filter(r=>r.mastery>=80).sort((a,b)=>b.mastery-a.mastery);
  return {priorities,strengths};
}

function parseCtp(text){
  const clean=normalize(text),sections=parseCtpMajor(clean),content_mastery=parseCtpMastery(clean),{priorities,strengths}=classify(content_mastery);
  const requiredMajor=['Vocabulary','Reading Comprehension','Writing Mechanics','Writing Concepts & Skills','Mathematics 1&2'];
  const majorCoverage=requiredMajor.filter(n=>sections.some(s=>s.name===n)).length;
  const criticalContent=['Inference','Analysis','Writing Mechanics','Mathematics 1&2'];
  const contentCoverage=criticalContent.filter(n=>content_mastery.some(s=>s.source_skill===n)).length;
  const verified=majorCoverage===requiredMajor.length&&contentCoverage===criticalContent.length&&content_mastery.length>=15;
  const data={parser_version:ASSESSMENT_PARSER_VERSION,assessment_type:'CTP',assessment_date:testDate(clean),sections,content_mastery,priority_skills:priorities.map(r=>({skill:r.canonical_skill,source_skill:r.source_skill,mastery:r.mastery,source:'CTP'})),strength_skills:strengths.map(r=>({skill:r.canonical_skill,source_skill:r.source_skill,mastery:r.mastery,source:'CTP'})),verification:{verified,major_rows:majorCoverage,expected_major_rows:requiredMajor.length,content_rows:content_mastery.length,critical_content_rows:contentCoverage},confidence:verified?'verified':'needs_review'};
  data.evidence_signals=ctpSignals(data); return data;
}

function parseGeneric(text,fileName){return {parser_version:ASSESSMENT_PARSER_VERSION,assessment_type:detectType(text,fileName),assessment_date:testDate(text),sections:[],content_mastery:[],priority_skills:[],strength_skills:[],evidence_signals:[],verification:{verified:false},confidence:'needs_review'}}

export function parseAssessmentReport(layout,fileName=''){
  const text=layout?.text||''; const type=detectType(text,fileName);
  return type==='CTP'?parseCtp(text):parseGeneric(text,fileName);
}

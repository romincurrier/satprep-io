import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const publicDir=path.join(root,'public');
const errors=[];
const warnings=[];

function collect(dir){
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?collect(full):[full];
  });
}

const files=[
  path.join(root,'index.html'),
  path.join(root,'marketing.js'),
  ...collect(publicDir).filter(file=>/\.html$/i.test(file))
].filter(fs.existsSync);

// Affiliation/ownership representations are hard build failures because they can
// create immediate consumer-confusion risk. Outcome language is surfaced as a
// prelaunch warning until the legacy copy audit is complete; launch-gates.json
// still prevents indexing/outbound marketing in the meantime.
const hardForbidden=[
  {re:/\b(?:College Board|SAT|PSAT)\s+(?:approved|certified|partner|authorized)\b/i,label:'unapproved affiliation/certification claim'},
  {re:/\bofficial\s+SATprep(?:\.io)?\b/i,label:'official-status claim for SATprep.io'},
  {re:/\bCollege Board(?:'s)?\s+SATprep(?:\.io)?\b/i,label:'ownership/affiliation implication'}
];
const claimWatch=[
  {re:/\bguarantee(?:d|s|ing)?\b[^.\n]{0,100}\b(?:SAT|PSAT|score|points?)\b/i,label:'possible score/performance guarantee'},
  {re:/\b(?:SAT|PSAT)\b[^.\n]{0,100}\bguarantee(?:d|s|ing)?\b/i,label:'possible SAT/PSAT guarantee'},
  {re:/\b(?:will|guaranteed to|proven to)\s+(?:raise|increase|improve)\b[^.\n]{0,80}\b(?:SAT|PSAT|score)\b/i,label:'possible unsubstantiated outcome claim'}
];

for(const file of files){
  const text=fs.readFileSync(file,'utf8');
  for(const rule of hardForbidden){
    if(rule.re.test(text)) errors.push(`${path.relative(root,file)} contains ${rule.label}.`);
  }
  for(const rule of claimWatch){
    if(rule.re.test(text)) warnings.push(`${path.relative(root,file)} contains ${rule.label}; review before public launch.`);
  }
  if(/SAT®|PSAT\/NMSQT®|College Board®/i.test(text)){
    const hasNonAffiliation=/not affiliated|does not endorse|does not sponsor/i.test(text);
    if(!hasNonAffiliation) warnings.push(`${path.relative(root,file)} uses a College Board mark without obvious visible non-affiliation language.`);
  }
}

const gatePath=path.join(root,'launch-gates.json');
if(!fs.existsSync(gatePath)) errors.push('launch-gates.json is required.');
else{
  let gates;
  try{gates=JSON.parse(fs.readFileSync(gatePath,'utf8'));}
  catch{errors.push('launch-gates.json must contain valid JSON.');}
  if(gates){
    if(gates.college_board_trademark_review==='unresolved'){
      if(gates.public_indexing!=='disabled') errors.push('Public indexing must remain disabled while College Board trademark review is unresolved.');
      if(gates.outbound_marketing!=='disabled') errors.push('Outbound marketing must remain disabled while College Board trademark review is unresolved.');
    }
    if(gates.live_payments==='disabled'&&gates.public_billing!=='disabled') warnings.push('Public billing is enabled while live payments are still marked disabled.');
  }
}

for(const warning of warnings) console.warn(`Marketing claims warning: ${warning}`);
if(errors.length){
  console.error('Marketing claims validation failed:');
  for(const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Marketing claims validation passed across ${files.length} files (${warnings.length} warning${warnings.length===1?'':'s'}).`);

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const excluded=new Set(['.git','node_modules','dist']);
const allowed=/\.(?:html|js|mjs|json|md|css|xml|txt)$/i;

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(excluded.has(entry.name)) return [];
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}

const files=walk(root).filter(file=>allowed.test(file));
const patterns=[
  {key:'product_name',re:/SATprep\.io/gi},
  {key:'canonical_domain',re:/satprep\.io/gi},
  {key:'sat_mark',re:/\bSAT(?:®)?\b/g},
  {key:'psat_mark',re:/\bPSAT(?:\/NMSQT)?(?:®)?\b/g}
];
const rows=[];
for(const file of files){
  const rel=path.relative(root,file);
  const text=fs.readFileSync(file,'utf8');
  const counts={};let total=0;
  for(const p of patterns){const n=[...text.matchAll(p.re)].length;counts[p.key]=n;total+=n;}
  if(total) rows.push({file:rel,...counts,total});
}
rows.sort((a,b)=>b.total-a.total||a.file.localeCompare(b.file));
const totals=rows.reduce((out,row)=>{for(const p of patterns)out[p.key]=(out[p.key]||0)+row[p.key];out.total=(out.total||0)+row.total;return out},{});

console.log('Brand transition inventory (repository text only; no changes made)');
console.log(JSON.stringify({files_with_matches:rows.length,totals},null,2));
console.log('\nTop files by references:');
for(const row of rows.slice(0,30)) console.log(`${String(row.total).padStart(4)}  ${row.file}`);
console.log('\nUse this as a technical migration inventory only. Trademark/legal clearance is tracked separately in docs/TRADEMARK_LAUNCH_GATE.md.');

export async function extractPdfLayout(pdfjsLib, blob){
  const data=new Uint8Array(await blob.arrayBuffer());
  const pdf=await pdfjsLib.getDocument({data}).promise;
  const pageLines=[];
  for(let n=1;n<=pdf.numPages;n++){
    const page=await pdf.getPage(n);
    const content=await page.getTextContent();
    const items=content.items.map(i=>({text:String(i.str||'').trim(),x:Number(i.transform?.[4]||0),y:Number(i.transform?.[5]||0)})).filter(i=>i.text);
    items.sort((a,b)=>Math.abs(b.y-a.y)>2.5?b.y-a.y:a.x-b.x);
    const rows=[];
    for(const item of items){
      let row=rows.find(r=>Math.abs(r.y-item.y)<=2.5);
      if(!row){row={y:item.y,items:[]};rows.push(row)}
      row.items.push(item);
    }
    rows.sort((a,b)=>b.y-a.y);
    const lines=rows.map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' | ').replace(/\s+/g,' ').trim()).filter(Boolean);
    pageLines.push(...lines,`--- PAGE ${n} ---`);
  }
  return {text:pageLines.join('\n'),lines:pageLines};
}

const SUBTESTS=['Verbal Reasoning','Auditory Comprehension','Vocabulary','Reading Comprehension','Writing Mechanics','Writing Concepts & Skills','Quantitative Reasoning','Mathematics 1 & 2','Mathematics','Math','Algebra 1','Algebra','Science'];
const NORM_PATTERNS=[['National Norm','national'],['National Norm Group','national'],['Suburban Public Schools','suburban_public'],['Suburban/Public Norm','suburban_public'],['Independent Schools','independent'],['Independent Norm','independent'],['Association Norm','association']];
function detectType(text,fileName=''){const s=`${fileName} ${text}`.toLowerCase();if(/\bctp\b|comprehensive testing program/.test(s))return'CTP';if(/\berb\b/.test(s))return'ERB';if(/map growth|nwea/.test(s))return'MAP Growth';if(/\bfast\b|florida assessment/.test(s))return'FAST';if(/psat\/nmsqt|nmsqt/.test(s))return'PSAT/NMSQT';if(/\bpsat\b/.test(s))return'PSAT';if(/\bsat\b/.test(s))return'SAT';return'Other'}
function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
function firstDate(text){const m=text.match(/(?:Test Date|Date Tested|Administration Date)\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);return m?.[1]||null}
function normOrder(text){const lower=text.toLowerCase(),hits=[];for(const [label,key] of NORM_PATTERNS){const i=lower.indexOf(label.toLowerCase());if(i>=0&&!hits.some(h=>h.key===key))hits.push({key,label,index:i})}return hits.sort((a,b)=>a.index-b.index)}
function sequenceAfterLabel(line,label){const i=line.toLowerCase().indexOf(label.toLowerCase());const tail=i>=0?line.slice(i+label.length):line;return [...tail.matchAll(/n\/?a|\d{1,4}/gi)].map(m=>/^n/i.test(m[0])?null:num(m[0]))}
function parseCtp(lines,text){
  const norms=normOrder(text);
  const sections=[];
  for(const label of SUBTESTS){
    const line=lines.find(l=>l.toLowerCase().includes(label.toLowerCase()));
    if(!line||sections.some(s=>s.name===label))continue;
    const vals=sequenceAfterLabel(line,label);
    let scaleIndex=vals.findIndex(v=>v!=null&&v>=100&&v<=1200),scale=scaleIndex>=0?vals[scaleIndex]:null;
    let rest=scaleIndex>=0?vals.slice(scaleIndex+1):vals;
    const norm_results={};let percentile=null,stanine=null,percentile_basis=null;
    if(norms.length){
      const pairLike=rest.length>=norms.length*2;
      let orientation='percentile_stanine';
      if(pairLike){const a=rest.find(v=>v!=null),ai=rest.indexOf(a),b=rest.slice(ai+1).find(v=>v!=null);if(a!=null&&a<=9&&b!=null&&b>9)orientation='stanine_percentile'}
      norms.forEach((n,idx)=>{
        let pr=null,st=null;
        if(pairLike){const a=rest[idx*2],b=rest[idx*2+1];if(orientation==='percentile_stanine'){pr=a;st=b}else{st=a;pr=b}}
        else pr=rest[idx]??null;
        if(pr!=null&&!(pr>=1&&pr<=99))pr=null;if(st!=null&&!(st>=1&&st<=9))st=null;
        norm_results[n.key]={label:n.label,percentile:pr,stanine:st};
      });
      const preferred=norm_results.national||Object.values(norm_results).find(x=>x.percentile!=null)||null;
      percentile=preferred?.percentile??null;stanine=preferred?.stanine??null;percentile_basis=preferred?.label||null;
    }else{
      const possiblePct=rest.find(v=>v!=null&&v>=10&&v<=99),possibleStan=rest.find(v=>v!=null&&v>=1&&v<=9);
      percentile=possiblePct??null;stanine=possibleStan??null;
    }
    sections.push({name:label,scale_score:scale,percentile,stanine,percentile_basis,norm_results,row:line});
  }
  return sections;
}
function parseGeneric(lines){const sections=[];for(const label of SUBTESTS){const line=lines.find(l=>l.toLowerCase().includes(label.toLowerCase()));if(!line)continue;const nums=[...line.matchAll(/\b\d{1,4}\b/g)].map(m=>Number(m[0]));const scale=nums.find(v=>v>=100&&v<=1600)||null;const pct=nums.find(v=>v>=10&&v<=99)||null;const st=nums.find(v=>v>=1&&v<=9)||null;sections.push({name:label,scale_score:scale,percentile:pct,stanine:st,percentile_basis:null,norm_results:{},row:line})}return sections}
export function parseAssessmentReport(layout,fileName=''){
  const text=layout.text||'',lines=layout.lines||text.split('\n'),assessment_type=detectType(text,fileName),assessment_date=firstDate(text);
  const sections=assessment_type==='CTP'?parseCtp(lines,text):parseGeneric(lines);
  const mapped=sections.filter(s=>s.scale_score!=null||s.percentile!=null||s.stanine!=null);
  const strengths=mapped.filter(s=>s.percentile!=null&&s.percentile>=75).map(s=>s.name);
  const needs_attention=mapped.filter(s=>s.percentile!=null&&s.percentile<=40).map(s=>s.name);
  return {assessment_type,assessment_date,sections,strengths,needs_attention,confidence:mapped.length>=3?'high':mapped.length?'medium':'low',mapped_count:mapped.length,text_length:text.length};
}

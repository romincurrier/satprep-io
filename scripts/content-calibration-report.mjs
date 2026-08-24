const base=String(process.env.VITE_SUPABASE_URL||'').replace(/\/$/,'');
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!base||!key){console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run the calibration report.');process.exit(2)}

async function get(path){
 const r=await fetch(`${base}${path}`,{headers:{apikey:key,Authorization:`Bearer ${key}`,Accept:'application/json'}});
 const text=await r.text();
 let data;try{data=text?JSON.parse(text):[]}catch{data=text}
 if(!r.ok)throw new Error(data?.message||data?.error||`Calibration query failed (${r.status})`);
 return data||[];
}

const items=await get('/rest/v1/content_item_calibration_v?select=*&order=response_count.desc');
const skills=await get('/rest/v1/content_skill_calibration_v?select=*&order=section,domain_key,skill_key,difficulty');
const MIN_FLAG_N=50,MIN_CORR_N=100;
const flags=[];
for(const row of items){
 const n=Number(row.response_count||0),facility=Number(row.facility),corr=row.section_score_correlation==null?null:Number(row.section_score_correlation);
 if(n>=MIN_FLAG_N&&Number.isFinite(facility)&&(facility<0.20||facility>0.90))flags.push({item:row.item_id,flag:'extreme_facility',value:facility,n});
 if(n>=MIN_CORR_N&&Number.isFinite(corr)&&corr<0.10)flags.push({item:row.item_id,flag:'low_section_correlation',value:corr,n});
}

console.log(`Observed secure-v3 items: ${items.length}`);
console.log(`Observed skill/difficulty cells: ${skills.length}`);
console.log(`Operational flags: ${flags.length}`);
if(items.length){
 console.log('\nItem calibration');
 console.table(items.map(x=>({item:x.item_id,section:x.section,skill:x.skill_key,difficulty:x.difficulty,n:Number(x.response_count),facility:Number(x.facility).toFixed(3),median_ms:Math.round(Number(x.median_response_ms||0)),corr:x.section_score_correlation==null?'':Number(x.section_score_correlation).toFixed(3)})));
}
if(flags.length){console.log('\nReview flags (screening signals, not automatic retirement decisions)');console.table(flags.map(x=>({...x,value:Number(x.value).toFixed(3)})))}
console.log('\nInterpretation rule: operational statistics supplement independent content/psychometric review. Do not promote, retire, or relabel difficulty from these thresholds alone.');

import { supabase } from './supabase.js';

const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
let busy=false;

async function ctx(){
  const{data:{session}}=await supabase.auth.getSession();
  if(!session)return{};
  const{data:p}=await supabase.from('profiles').select('id,role,household_id,first_name').eq('id',session.user.id).maybeSingle();
  let students=[];
  if(p?.role==='student'){
    const{data:s}=await supabase.from('students').select('*').eq('profile_id',p.id).maybeSingle();
    if(s)students=[s];
  }else if(p?.role==='parent'&&p.household_id){
    const{data:s}=await supabase.from('students').select('*').eq('household_id',p.household_id).order('created_at');
    students=s||[];
  }
  return{session,profile:p,students};
}

function form(student){
  const name=student.display_name||[student.first_name,student.last_name].filter(Boolean).join(' ')||'Student';
  return `<div class="eyebrow">ACADEMIC RECORDS</div><h2 style="margin-top:6px">Previous test scores for ${esc(name)}</h2><p class="muted">Upload a CTP, ERB, FAST, MAP, PSAT, SAT or other standardized assessment, or enter the important scores manually. SATprep.io will preserve these results as part of the student's learning profile.</p><div id="assessmentMsg"></div><div class="field"><label>Assessment</label><select id="assessmentType"><option>CTP</option><option>ERB</option><option>FAST</option><option>MAP Growth</option><option>PSAT</option><option>PSAT/NMSQT</option><option>SAT</option><option>Other</option></select></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div class="field"><label>Test date (optional)</label><input id="assessmentDate" type="date"></div><div class="field"><label>Overall score (optional)</label><input id="overallScore" placeholder="e.g. 1280 or scale score"></div></div><div class="field"><label>Overall percentile (optional)</label><input id="overallPercentile" type="number" min="0" max="100" placeholder="e.g. 78"></div><div class="field"><label>Section/domain results</label><textarea id="sectionScores" rows="4" placeholder="Example: Quantitative Reasoning 62nd percentile; Reading Comprehension 84th percentile; Vocabulary 71st percentile"></textarea></div><div class="field"><label>Upload report (optional)</label><input id="assessmentFile" type="file" accept="application/pdf,image/png,image/jpeg,image/webp"><div class="small">PDF, PNG, JPG or WebP · maximum 10 MB. Reports are stored privately.</div></div><div class="field"><label>Notes (optional)</label><textarea id="assessmentNotes" rows="2" placeholder="Anything useful about this test or the student's performance"></textarea></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="saveAssessment">Save assessment</button><button class="btn secondary" id="closeAssessment">Cancel</button></div>`;
}

function closeOverlay(){document.querySelector('#assessmentOverlay')?.remove()}

async function save(student,container){
  if(busy)return;
  busy=true;
  const btn=container.querySelector('#saveAssessment');
  btn.disabled=true;btn.textContent='Saving…';
  try{
    const{data:{session}}=await supabase.auth.getSession();
    if(!session)throw new Error('Please sign in again.');
    const file=container.querySelector('#assessmentFile').files?.[0];
    let file_path=null,file_name=null,source_method='manual';
    if(file){
      if(file.size>10*1024*1024)throw new Error('The report must be 10 MB or smaller.');
      const allowed=['application/pdf','image/png','image/jpeg','image/webp'];
      if(!allowed.includes(file.type))throw new Error('Please upload a PDF, PNG, JPG or WebP report.');
      const ext=(file.name.split('.').pop()||'file').replace(/[^a-z0-9]/gi,'').toLowerCase();
      const safe=`${crypto.randomUUID()}.${ext}`;
      const path=`${session.user.id}/${student.id}/${safe}`;
      const{error:up}=await supabase.storage.from('assessment-reports').upload(path,file,{contentType:file.type,upsert:false});
      if(up)throw up;
      file_path=path;file_name=file.name;source_method='upload';
    }
    const percentile=container.querySelector('#overallPercentile').value;
    const sections=container.querySelector('#sectionScores').value.trim();
    const{error}=await supabase.from('prior_assessments').insert({
      student_id:student.id,
      assessment_type:container.querySelector('#assessmentType').value,
      assessment_date:container.querySelector('#assessmentDate').value||null,
      grade_level:student.grade_level||null,
      source_method,file_name,file_path,
      overall_score:container.querySelector('#overallScore').value.trim()||null,
      overall_percentile:percentile===''?null:Number(percentile),
      section_scores:sections?{reported_text:sections}:{},
      notes:container.querySelector('#assessmentNotes').value.trim()||null,
      created_by:session.user.id,
      status:'submitted'
    });
    if(error)throw error;
    container.innerHTML=`<div class="success"><strong>Assessment saved.</strong><br>SATprep.io will use this record together with the student's own diagnostic when building the learning profile.</div><div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap"><button class="btn" id="assessmentDone">Continue</button><button class="btn secondary" id="addAnotherAssessment">Add another assessment</button></div>`;
    container.querySelector('#assessmentDone').onclick=closeOverlay;
    container.querySelector('#addAnotherAssessment').onclick=()=>openOverlay(student);
  }catch(e){
    const msg=container.querySelector('#assessmentMsg');
    if(msg)msg.innerHTML=`<div class="error">${esc(e.message||'Unable to save assessment.')}</div>`;
    btn.disabled=false;btn.textContent='Save assessment';
  }finally{busy=false}
}

function openOverlay(student){
  closeOverlay();
  const overlay=document.createElement('div');
  overlay.id='assessmentOverlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(13,31,52,.72);overflow:auto;padding:24px;display:flex;align-items:flex-start;justify-content:center';
  overlay.innerHTML=`<div class="card" style="width:min(780px,100%);margin:20px auto;padding:28px;position:relative" id="assessmentForm">${form(student)}</div>`;
  document.body.appendChild(overlay);
  const container=overlay.querySelector('#assessmentForm');
  container.querySelector('#saveAssessment').onclick=()=>save(student,container);
  container.querySelector('#closeAssessment').onclick=closeOverlay;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeOverlay()});
}

function chooseStudent(students){
  closeOverlay();
  const overlay=document.createElement('div');
  overlay.id='assessmentOverlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(13,31,52,.72);overflow:auto;padding:24px;display:flex;align-items:flex-start;justify-content:center';
  overlay.innerHTML=`<div class="card" style="width:min(620px,100%);margin:40px auto;padding:28px"><div class="eyebrow">ACADEMIC RECORDS</div><h2>Choose a student</h2><p class="muted">Select the student whose prior testing you want to add.</p>${students.map(s=>`<button class="option chooseAssessmentStudent" data-id="${s.id}" style="width:100%;margin:8px 0">${esc(s.display_name||[s.first_name,s.last_name].filter(Boolean).join(' ')||'Student')}</button>`).join('')}<button class="btn secondary" id="closeAssessment" style="margin-top:12px">Cancel</button></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#closeAssessment').onclick=closeOverlay;
  overlay.querySelectorAll('.chooseAssessmentStudent').forEach(b=>b.onclick=()=>openOverlay(students.find(s=>s.id===b.dataset.id)));
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeOverlay()});
}

async function inject(){
  const p=new URLSearchParams(location.search);
  if(p.get('app')!=='1'||p.get('openBilling')==='1')return;
  const{profile,students}=await ctx();
  if(!profile||!students.length)return;
  if(profile.role==='student'){
    const s=students[0];
    if(!s.onboarding_complete||s.diagnostic_completed_at||document.querySelector('#priorAssessmentCard'))return;
    const main=document.querySelector('main');if(!main)return;
    const card=document.createElement('section');
    card.id='priorAssessmentCard';card.className='card';card.style.maxWidth='760px';card.style.margin='18px auto';
    card.innerHTML=`<div class="eyebrow">OPTIONAL — PRIOR TESTING</div><h2>Have scores from CTP, ERB, FAST, MAP, PSAT, SAT or another test?</h2><p class="muted">Put those results to work before your SATprep.io diagnostic. Upload the report or enter the scores manually. You can also skip this and continue with the diagnostic.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="addPriorScores" type="button">Add previous scores</button><button class="btn secondary" id="skipPriorScores" type="button">I don't have scores</button></div>`;
    main.prepend(card);
    card.querySelector('#addPriorScores').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openOverlay(s)});
    card.querySelector('#skipPriorScores').addEventListener('click',e=>{e.preventDefault();card.remove()});
  }else if(profile.role==='parent'&&!document.querySelector('#academicRecordsBtn')){
    const section=document.querySelector('#parentDashboardEnhanced .hero .row');if(!section)return;
    const b=document.createElement('button');b.id='academicRecordsBtn';b.type='button';b.className='btn secondary';b.textContent='Academic records';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();students.length===1?openOverlay(students[0]):chooseStudent(students)});
    section.appendChild(b);
  }
}

let scheduled=false;
function scheduleInject(){if(scheduled)return;scheduled=true;setTimeout(async()=>{scheduled=false;await inject()},80)}
const observer=new MutationObserver(scheduleInject);
observer.observe(document.documentElement,{subtree:true,childList:true});
setTimeout(inject,250);
supabase.auth.onAuthStateChange(()=>scheduleInject());

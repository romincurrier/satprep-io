import {createHash} from 'node:crypto';
import {Sandbox} from '@vercel/sandbox';
import {enforceRateLimit,json,service} from '../server/supabase-server.js';
import {hashPilotToken,pilotEnrollmentByToken} from '../server/live-pilot.js';

const BASE='https://satprep.io';
const TOKEN=/^[A-Za-z0-9_-]{32,128}$/;
const CRON_LABEL='Live Family Pilot #1';
const CHROMIUM_SYSTEM_DEPS=[
 'nss','nspr','libxkbcommon','atk','at-spi2-atk','at-spi2-core','libXcomposite','libXdamage','libXrandr','libXfixes','libXcursor','libXi','libXtst','libXScrnSaver','libXext','mesa-libgbm','libdrm','mesa-libGL','mesa-libEGL','cups-libs','alsa-lib','pango','cairo','gtk3','dbus-libs'
];
const CONTROLLED_LEGACY_ANSWERS=[3,2,1,2,3,1,1,2,1,3,2,1,1,3,1,2];

function stableCredentials(enrollment,key){
 const id=String(enrollment.id).replace(/-/g,'').slice(0,12);
 const digest=createHash('sha256').update(`${key}|satprep-full-browser-self-pilot`).digest('hex');
 return{
  parentEmail:`selfpilot.parent.${id}@satprep.io`,
  studentEmail:`selfpilot.student.${id}@satprep.io`,
  password:`Sp!${digest.slice(0,22)}a9`,
  parentFirst:'Pilot',parentLast:'Parent',studentFirst:'Pilot',studentLast:'Student'
 };
}
function scrub(value,key,credentials){
 let text=String(value??'');
 for(const secret of [key,credentials?.password].filter(Boolean))text=text.split(secret).join('[redacted]');
 return text.slice(0,1200);
}
async function pause(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function rows(path){const data=await service(path);return Array.isArray(data)?data:[]}
async function profileByEmail(email){return (await rows(`/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,email,role,household_id,is_test_account&limit=1`))[0]||null}
async function confirmSyntheticParent(email){
 let profile=null;
 for(let i=0;i<25&&!profile;i++){profile=await profileByEmail(email);if(!profile)await pause(300)}
 if(!profile||profile.role!=='parent'||!email.endsWith('@satprep.io'))throw new Error('Normal parent signup did not create the expected reserved synthetic parent profile.');
 await service(`/auth/v1/admin/users/${encodeURIComponent(profile.id)}`,{method:'PUT',body:JSON.stringify({email_confirm:true})});
 return profile;
}
async function cronEnrollment(){
 const found=await rows(`/rest/v1/pilot_enrollments?label=eq.${encodeURIComponent(CRON_LABEL)}&status=eq.open&parent_profile_id=is.null&household_id=is.null&student_id=is.null&select=id,label,status,expires_at,parent_profile_id,household_id,student_id,metadata,created_at,claimed_at,completed_at&order=created_at.asc&limit=1`);
 return found[0]||null;
}
async function attachCronEnrollment(enrollment,email){
 let profile=null;
 for(let i=0;i<25;i++){profile=await profileByEmail(email);if(profile?.household_id)break;await pause(300)}
 if(!profile?.household_id||profile.role!=='parent'||!email.endsWith('@satprep.io'))throw new Error('Synthetic parent household was not created by the normal signup flow.');
 const now=new Date().toISOString(),metadata={...(enrollment.metadata||{}),self_browser_pilot:true,self_browser_version:'full-browser-v1'};
 await service(`/rest/v1/pilot_enrollments?id=eq.${encodeURIComponent(enrollment.id)}&status=eq.open`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'claimed',parent_profile_id:profile.id,household_id:profile.household_id,claimed_at:now,metadata})});
 await Promise.all([
  service(`/rest/v1/profiles?id=eq.${encodeURIComponent(profile.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_test_account:true})}),
  service(`/rest/v1/households?id=eq.${encodeURIComponent(profile.household_id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_test_household:true})})
 ]);
 return profile;
}
async function databaseReport(parentEmail,enrollmentId){
 const parent=await profileByEmail(parentEmail);
 const household=parent?.household_id?(await rows(`/rest/v1/households?id=eq.${encodeURIComponent(parent.household_id)}&select=id,is_test_household,student_limit&limit=1`))[0]||null:null;
 const students=household?await rows(`/rest/v1/students?household_id=eq.${encodeURIComponent(household.id)}&select=id,profile_id,first_name,last_name,onboarding_complete,diagnostic_completed_at,recommended_path,is_test_student,test_label&order=created_at.asc`):[];
 const student=students.find(s=>String(s.test_label||'')===`live-pilot:${enrollmentId}`)||students[0]||null,sid=student?.id;
 const [diag,responses,lessons,attempts,mastery,journey,achievements,subs,content,enrollments]=await Promise.all([
  sid?rows(`/rest/v1/diagnostic_attempts?student_id=eq.${encodeURIComponent(sid)}&select=id,status,math_score,rw_score,overall_score,recommended_start,completed_at,summary&order=started_at.desc`):[],
  sid?rows(`/rest/v1/diagnostic_responses?student_id=eq.${encodeURIComponent(sid)}&select=id,question_key,is_correct`):[],
  sid?rows(`/rest/v1/lesson_progress?student_id=eq.${encodeURIComponent(sid)}&select=lesson_key,best_score,last_score,completed_at`):[],
  sid?rows(`/rest/v1/question_attempts?student_id=eq.${encodeURIComponent(sid)}&select=id,lesson_key,skill_key,is_correct`):[],
  sid?rows(`/rest/v1/skill_mastery?student_id=eq.${encodeURIComponent(sid)}&select=skill_key,mastery,items_attempted`):[],
  sid?rows(`/rest/v1/student_journey?student_id=eq.${encodeURIComponent(sid)}&select=student_id,xp,level,stage_key,updated_at`):[],
  sid?rows(`/rest/v1/student_achievements?student_id=eq.${encodeURIComponent(sid)}&select=achievement_key,title,xp_awarded,earned_at`):[],
  household?rows(`/rest/v1/subscriptions?household_id=eq.${encodeURIComponent(household.id)}&select=id,status,plan_key,provider`):[],
  rows('/rest/v1/content_items?select=id,active,qa_status'),
  rows(`/rest/v1/pilot_enrollments?id=eq.${encodeURIComponent(enrollmentId)}&select=id,label,status,parent_profile_id,household_id,student_id,claimed_at,completed_at,metadata`)
 ]);
 const completedDiag=diag.find(x=>x.status==='completed')||null,completedLessons=lessons.filter(x=>x.completed_at),activeContent=content.filter(x=>x.active===true),approvedContent=content.filter(x=>x.qa_status==='production_approved');
 return{
  parent:{exists:!!parent,is_test_account:!!parent?.is_test_account,household_id:parent?.household_id||null},
  household:{exists:!!household,is_test_household:!!household?.is_test_household},
  student:{exists:!!student,profile_active:!!student?.profile_id,is_test_student:!!student?.is_test_student,test_label:student?.test_label||null,onboarding_complete:!!student?.onboarding_complete,diagnostic_complete:!!student?.diagnostic_completed_at},
  diagnostic:{completed:!!completedDiag,responses:responses.length,math_score:completedDiag?.math_score??null,rw_score:completedDiag?.rw_score??null,recommended_start:completedDiag?.recommended_start||null,priority_count:Array.isArray(student?.recommended_path?.priority_skills)?student.recommended_path.priority_skills.length:0},
  learning:{completed_lessons:completedLessons.length,question_attempts:attempts.length,mastery_rows:mastery.length,first_completed_lesson:completedLessons[0]?.lesson_key||null},
  journey:{exists:!!journey[0],xp:Number(journey[0]?.xp||0),level:Number(journey[0]?.level||0),stage_key:journey[0]?.stage_key||null,achievement_keys:achievements.map(x=>x.achievement_key)},
  billing:{subscription_rows:subs.length},
  commercial_content:{rows:content.length,active:activeContent.length,production_approved:approvedContent.length},
  enrollment:enrollments[0]?{id:enrollments[0].id,label:enrollments[0].label,status:enrollments[0].status,parent_profile_id:enrollments[0].parent_profile_id,household_id:enrollments[0].household_id,student_id:enrollments[0].student_id,claimed_at:enrollments[0].claimed_at}:null
 };
}
function databaseChecks(state,enrollmentId){
 const checks=[
  ['db_parent_test_identity',state.parent.exists&&state.parent.is_test_account,'Synthetic parent exists and is test-marked.'],
  ['db_test_household',state.household.exists&&state.household.is_test_household,'Pilot household exists and is test-marked.'],
  ['db_student_login',state.student.exists&&state.student.profile_active&&state.student.is_test_student&&state.student.test_label===`live-pilot:${enrollmentId}`,'Exactly scoped pilot student has an active test login.'],
  ['db_diagnostic_complete',state.diagnostic.completed&&state.diagnostic.responses>=16,`Diagnostic completed with ${state.diagnostic.responses} saved responses.`],
  ['db_adaptive_priority_bridge',state.diagnostic.priority_count>0,`Adaptive path contains ${state.diagnostic.priority_count} priority skill(s).`],
  ['db_practice_saved',state.learning.question_attempts>0&&state.learning.completed_lessons>0,`Saved ${state.learning.question_attempts} practice attempt(s) and ${state.learning.completed_lessons} completed lesson(s).`],
  ['db_mastery_tracking',state.learning.mastery_rows>0,`Mastery state contains ${state.learning.mastery_rows} tracked skill row(s).`],
  ['db_journey_tracking',state.journey.exists&&state.journey.xp>=150&&state.journey.achievement_keys.includes('starting_point'),`Journey is ${state.journey.xp} XP at level ${state.journey.level}.`],
  ['db_no_pilot_billing',state.billing.subscription_rows===0,`Pilot household has ${state.billing.subscription_rows} subscription row(s).`],
  ['db_commercial_content_gate',state.commercial_content.rows===0&&state.commercial_content.active===0&&state.commercial_content.production_approved===0,`Commercial content remains ${state.commercial_content.rows} total / ${state.commercial_content.active} active / ${state.commercial_content.production_approved} approved.`]
 ];
 return checks.map(([name,pass,detail])=>({name,pass:!!pass,detail}));
}
async function persistResult(enrollment,overall,checkpoints,state,fatal){
 if(!enrollment?.id)return;
 const current=(await rows(`/rest/v1/pilot_enrollments?id=eq.${encodeURIComponent(enrollment.id)}&select=metadata&limit=1`))[0]?.metadata||{};
 const report={overall,executed_at:new Date().toISOString(),checkpoints,state,fatal:fatal||null};
 await service(`/rest/v1/pilot_enrollments?id=eq.${encodeURIComponent(enrollment.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({metadata:{...current,self_pilot_report:report}})}).catch(error=>console.error('self-pilot report persistence',error?.message||error));
}

export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 const cronMode=String(req.query?.auto||'')==='1'&&String(req.headers?.['user-agent']||'').toLowerCase().includes('vercel-cron');
 const token=String(req.query?.token||'').trim();
 if(!cronMode&&!TOKEN.test(token))return json(res,400,{error:'A valid one-time pilot token is required.'});
 let enrollment=null,credentials=null,sandbox=null,fatal=null,state=null,key=token;
 const checkpoints=[],mark=(name,pass,detail)=>checkpoints.push({name,pass:!!pass,detail:String(detail||'')});
 try{
  enrollment=cronMode?await cronEnrollment():await pilotEnrollmentByToken(token);
  if(cronMode&&!enrollment)return json(res,200,{ok:true,overall:'NOOP',message:'No fresh open live-family pilot is available.'});
  if(!enrollment)return json(res,404,{error:'Pilot invitation was not found.'});
  if(enrollment.status!=='open')return json(res,409,{error:`Pilot invitation is ${enrollment.status}; a fresh open invitation is required for a complete self-pilot.`});
  if(Date.parse(enrollment.expires_at)<=Date.now())return json(res,410,{error:'Pilot invitation has expired.'});
  if(enrollment.parent_profile_id||enrollment.household_id||enrollment.student_id)return json(res,409,{error:'Pilot invitation is already attached to a family.'});
  key=cronMode?enrollment.id:token;
  await enforceRateLimit(cronMode?createHash('sha256').update(`cron|${enrollment.id}`).digest('hex'):hashPilotToken(token),'pilot/full-browser-self',{limit:3,windowSeconds:3600});
  credentials=stableCredentials(enrollment,key);

  sandbox=await Sandbox.create({runtime:'node24',timeout:240000});
  const run=async(command,args,{allowFailure=false}={})=>{
   const result=await sandbox.runCommand(command,args),stdout=await result.stdout(),stderr=await result.stderr();
   if(result.exitCode!==0&&!allowFailure)throw new Error(`${command} failed (${result.exitCode}): ${scrub(stderr||stdout,key,credentials)}`);
   return{exitCode:result.exitCode,stdout:String(stdout||''),stderr:String(stderr||'')};
  };
  await run('sh',['-c',`sudo dnf clean all >/dev/null 2>&1; sudo dnf install -y --skip-broken ${CHROMIUM_SYSTEM_DEPS.join(' ')} >/tmp/browser-deps.log 2>&1; code=$?; sudo ldconfig >/dev/null 2>&1; if [ $code -ne 0 ]; then cat /tmp/browser-deps.log; exit $code; fi`]);
  await run('npm',['install','-g','agent-browser']);
  await run('agent-browser',['install']);

  const ab=(args,options)=>run('agent-browser',args,options),sleep=ms=>ab(['wait',String(ms)]),evaluate=async code=>(await ab(['eval',code])).stdout.trim();
  const exists=async selector=>(await evaluate(`document.querySelector(${JSON.stringify(selector)})?'SATPREP_YES':'SATPREP_NO'`)).includes('SATPREP_YES');
  const waitAny=async(selectors,timeout=15000)=>{const until=Date.now()+timeout;while(Date.now()<until){for(const selector of selectors)if(await exists(selector))return selector;await sleep(250)}return null};
  const click=selector=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return 'SATPREP_MISSING';e.click();return 'SATPREP_CLICKED'})()`);
  const setValues=values=>evaluate(`(()=>{const values=${JSON.stringify(values)};for(const [s,v] of Object.entries(values)){const e=document.querySelector(s);if(!e)return 'SATPREP_MISSING:'+s;e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}return 'SATPREP_SET'})()`);
  const submit=form=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(form)});if(!e)return 'SATPREP_MISSING';e.requestSubmit();return 'SATPREP_SUBMITTED'})()`),bodyText=()=>evaluate('document.body.innerText'),url=async()=>(await ab(['get','url'])).stdout.trim();

  await ab(['open',cronMode?BASE:`${BASE}/?pilot=${encodeURIComponent(token)}`]);await sleep(900);
  let signup=await waitAny(['#parentForm'],cronMode?2500:6000);
  if(!signup){if(await exists('[data-auth="signup"]'))await click('[data-auth="signup"]');await waitAny(['#parentStart'],3000);await click('#parentStart');signup=await waitAny(['#parentForm'],3000)}
  mark('browser_parent_signup_screen',!!signup,signup?'Normal parent signup form rendered.':'Parent signup form did not render.');if(!signup)throw new Error('Parent signup screen could not be reached.');

  await setValues({'#pFirst':credentials.parentFirst,'#pLast':credentials.parentLast,'#pEmail':credentials.parentEmail,'#pPass':credentials.password});await submit('#parentForm');await sleep(1700);
  let currentUrl=await url(),parentSignedIn=/[?&]app=1/.test(currentUrl),signupText=await bodyText();
  if(!parentSignedIn&&/Check your email to confirm your account/i.test(signupText)){
   await confirmSyntheticParent(credentials.parentEmail);
   mark('browser_parent_account_creation',true,'Normal signup created the synthetic parent; automation confirmed only this reserved satprep.io account because email confirmation was required.');
   if(cronMode){await attachCronEnrollment(enrollment,credentials.parentEmail);mark('browser_pilot_claim',true,'Server attached the one-shot open pilot to the normal synthetic parent account after signup; commercial customer paths remain unchanged.');}
   await ab(['open',BASE]);await sleep(700);await click('[data-auth="login"]');if(!await waitAny(['#loginForm'],3000))throw new Error('Parent login screen did not render after synthetic email confirmation.');
   await setValues({'#email':credentials.parentEmail,'#password':credentials.password});await submit('#loginForm');await sleep(1400);currentUrl=await url();parentSignedIn=/[?&]app=1/.test(currentUrl);
  }else{
   mark('browser_parent_account_creation',parentSignedIn,parentSignedIn?'Normal signup created an immediately authenticated parent session.':`Signup stopped at: ${scrub(signupText,key,credentials)}`);
   if(parentSignedIn&&cronMode){await attachCronEnrollment(enrollment,credentials.parentEmail);mark('browser_pilot_claim',true,'Server attached the one-shot open pilot to the authenticated normal synthetic parent account.');await ab(['open',`${BASE}/?app=1`]);await sleep(800)}
  }
  if(!parentSignedIn)throw new Error('Synthetic parent could not sign in through the normal browser login flow.');mark('browser_parent_authentication',true,'Parent reached the authenticated application.');

  let childCard=await waitAny(['#parentFamilySetup'],cronMode?2500:12000);
  if(cronMode&&!childCard){const dashboard=await waitAny(['#parentDashboardEnhanced'],8000);if(dashboard){if(await exists('#addFirstStudent'))await click('#addFirstStudent');else if(await exists('#addStudentFromDashboard'))await click('#addStudentFromDashboard');childCard=await waitAny(['#parentFamilySetup'],5000)}}
  mark('browser_pilot_claim_and_child_setup',!!childCard,childCard?'Pilot isolation is active and the normal child setup rendered.':'Pilot child setup did not render.');if(!childCard)throw new Error('Pilot did not route the signed-in parent to child setup.');
  await setValues({'#childFirst':credentials.studentFirst,'#childLast':credentials.studentLast,'#childDob':'2010-04-15','#childGrade':'11','#childExam':'SAT'});await click('#saveAndBilling');
  const parentDash=await waitAny(['#parentDashboardEnhanced'],12000);mark('browser_child_record_creation',!!parentDash,parentDash?'Child was created through the normal parent household UI without opening billing.':'Parent dashboard did not appear after child creation.');if(!parentDash)throw new Error('Child creation did not return to the parent dashboard.');

  const activate=await waitAny(['.activate-student'],5000);mark('browser_student_activation_entry',!!activate,activate?'Parent dashboard offered student-login activation.':'Student activation control was missing.');if(!activate)throw new Error('Student activation control is missing.');
  await click('.activate-student');if(!await waitAny(['#studentLoginEmail'],3000))throw new Error('Student activation modal did not render.');await setValues({'#studentLoginEmail':credentials.studentEmail,'#studentLoginPassword':credentials.password});await click('#activateStudentConfirm');
  const activationDone=await waitAny(['#activationDone'],8000);mark('browser_student_login_activation',!!activationDone,activationDone?'Parent activated a real synthetic student login.':'Student login activation did not complete.');if(!activationDone)throw new Error('Student login could not be activated.');await click('#activationDone');await sleep(800);

  await click('#signoutBtn');await sleep(900);if(!await waitAny(['[data-auth="login"]'],5000))await ab(['open',BASE]);await click('[data-auth="login"]');if(!await waitAny(['#loginForm'],3000))throw new Error('Student login screen did not render.');
  await setValues({'#email':credentials.studentEmail,'#password':credentials.password});await submit('#loginForm');const onboard=await waitAny(['#onboard'],10000);mark('browser_student_authentication',!!onboard,onboard?'Student signed in and reached learner-profile onboarding.':'Student did not reach learner-profile onboarding.');if(!onboard)throw new Error('Student onboarding form did not render.');
  await setValues({'#grade':'11','#mathCourse':'Algebra II','#targetExam':'SAT','#targetScore':'1350'});await submit('#onboard');const diagGate=await waitAny(['#startDiagnostic','#secureDiagStart'],10000);mark('browser_student_onboarding',!!diagGate,diagGate?'Learner profile saved and diagnostic gate rendered.':'Diagnostic gate did not render after onboarding.');if(!diagGate)throw new Error('Diagnostic could not be started after learner onboarding.');

  const legacy=diagGate==='#startDiagnostic';await click(diagGate);await sleep(400);
  if(legacy){
   for(let i=0;i<CONTROLLED_LEGACY_ANSWERS.length;i++){if(!await waitAny(['[data-a]'],4000))throw new Error(`Legacy diagnostic stopped before question ${i+1}.`);const index=CONTROLLED_LEGACY_ANSWERS[i];await evaluate(`(()=>{const a=[...document.querySelectorAll('[data-a]')];if(!a[${index}])return 'SATPREP_MISSING';a[${index}].click();return 'SATPREP_CLICKED'})()`);await sleep(180)}
   const results=await waitAny(['#diagContinue'],8000),text=await bodyText(),calibrated=/Math readiness\s*50%/i.test(text)&&/Reading & Writing readiness\s*50%/i.test(text)&&/Foundation-Building Path/i.test(text);
   mark('browser_diagnostic_completion',!!results,results?'All 16 QA diagnostic questions completed through the rendered assessment UI.':'Diagnostic result screen did not render.');mark('browser_diagnostic_scoring',calibrated,calibrated?'Controlled answer pattern produced 50% Math, 50% Reading & Writing, and the Foundation-Building Path.':'Rendered diagnostic result did not match the controlled response pattern.');if(!results)throw new Error('Diagnostic did not complete.');await click('#diagContinue');
  }else{
   let completed=false;for(let i=0;i<24&&!completed;i++){if(await exists('#secureDiagDone')){completed=true;break}if(await exists('[data-secure-answer]'))await evaluate(`(()=>{const a=[...document.querySelectorAll('[data-secure-answer]')];if(!a.length)return 'SATPREP_MISSING';a[${i}%a.length].click();return 'SATPREP_CLICKED'})()`);else if(await exists('#secureDiagnosticSpr')){await setValues({'#secureDiagnosticSpr':'1'});await click('#secureDiagnosticSprSubmit')}else await sleep(250);await sleep(220)}completed=completed||await exists('#secureDiagDone');mark('browser_diagnostic_completion',completed,completed?'Secure diagnostic completed through the rendered UI.':'Secure diagnostic did not reach completion.');if(!completed)throw new Error('Secure diagnostic did not complete.');await click('#secureDiagDone');
  }

  const learning=await waitAny(['#learningV2Dashboard'],15000);mark('browser_adaptive_learning_dashboard',!!learning,learning?'Personalized learning plan rendered after the diagnostic.':'Learning plan did not render after the diagnostic.');if(!learning)throw new Error('Personalized learning plan did not render.');
  const firstSkill=(await evaluate(`document.querySelector('[data-learn-skill]')?.dataset.learnSkill||''`)).replace(/^['"]|['"]$/g,''),adaptiveOk=!legacy||firstSkill.includes('linear-equations-one-variable');mark('browser_adaptive_priority_selection',adaptiveOk,legacy?`First recommended skill: ${scrub(firstSkill,key,credentials)} (expected linear-equations-one-variable from the controlled weaknesses).`:`First recommended secure-diagnostic skill: ${scrub(firstSkill,key,credentials)}.`);
  await click('[data-learn-skill]');const teach=await waitAny(['#learningV2Teach'],7000);mark('browser_prep_material',!!teach,teach?'Recommended teaching material rendered before practice.':'Teaching material did not render.');if(!teach)throw new Error('Recommended teaching material did not render.');await click('#lv2Practice');

  const practiceView=await waitAny(['#learningV2Practice','#learningV3Practice'],10000);mark('browser_practice_launch',!!practiceView,practiceView==='#learningV3Practice'?'Trusted server practice opened.':practiceView?'Pilot-only prelaunch practice opened.':'Practice did not open.');if(!practiceView)throw new Error('Practice session did not open.');
  let practiceCompleted=false;for(let i=0;i<20&&!practiceCompleted;i++){if(await exists('#learningV2Results')||await exists('#learningV3Results')){practiceCompleted=true;break}if(await exists('[data-practice-choice]')){await evaluate(`(()=>{const a=[...document.querySelectorAll('[data-practice-choice]')];if(!a.length)return 'SATPREP_MISSING';a[0].click();return 'SATPREP_CLICKED'})()`);await sleep(80);await click('#practiceCheck');await sleep(220);await click('#practiceNext')}else if(await exists('[data-server-practice-choice]')){await evaluate(`(()=>{const a=[...document.querySelectorAll('[data-server-practice-choice]')];if(!a.length)return 'SATPREP_MISSING';a[0].click();return 'SATPREP_CLICKED'})()`);await sleep(80);await click('#serverPracticeCheck');await sleep(250);await click('#serverPracticeNext')}else if(await exists('#serverPracticeSpr')){await setValues({'#serverPracticeSpr':'1'});await click('#serverPracticeCheck');await sleep(250);await click('#serverPracticeNext')}else await sleep(250);await sleep(180)}
  practiceCompleted=practiceCompleted||await exists('#learningV2Results')||await exists('#learningV3Results');mark('browser_practice_completion',practiceCompleted,practiceCompleted?'Student completed a full recommended practice session through the browser.':'Practice did not reach a completion screen.');if(!practiceCompleted)throw new Error('Practice did not complete.');if(await exists('#resultsPlan'))await click('#resultsPlan');else if(await exists('#serverResultsPlan'))await click('#serverResultsPlan');if(!await waitAny(['#learningV2Dashboard'],10000))throw new Error('Updated learning plan did not render after practice.');
  const journeyMini=await waitAny(['#journeyMini'],7000),journeyText=journeyMini?await evaluate(`document.querySelector('#journeyMini')?.innerText||''`):'';mark('browser_journey_progress',!!journeyMini&&/XP/i.test(journeyText),journeyMini?`Journey widget rendered: ${scrub(journeyText,key,credentials)}`:'Journey widget did not render.');

  await click('#lv2Signout');await sleep(800);if(!await waitAny(['[data-auth="login"]'],4000))await ab(['open',BASE]);await click('[data-auth="login"]');if(!await waitAny(['#loginForm'],3000))throw new Error('Parent re-login screen did not render.');await setValues({'#email':credentials.parentEmail,'#password':credentials.password});await submit('#loginForm');
  const parentReview=await waitAny(['#parentDashboardEnhanced'],10000),parentText=parentReview?await evaluate(`document.querySelector('#parentDashboardEnhanced')?.innerText||''`):'',parentVisible=!!parentReview&&/Learning path active/i.test(parentText)&&/Lessons/i.test(parentText)&&/Mastery/i.test(parentText);mark('browser_parent_progress_visibility',parentVisible,parentVisible?'Parent re-entered the dashboard and saw the child’s active learning path, lesson and mastery reporting.':'Parent dashboard did not visibly reflect the completed student journey.');
 }catch(error){fatal=scrub(error?.message||error,key,credentials);mark('browser_runner_fatal',false,fatal)}finally{
  if(sandbox)try{await sandbox.stop()}catch{}
  if(enrollment&&credentials){try{state=await databaseReport(credentials.parentEmail,enrollment.id);checkpoints.push(...databaseChecks(state,enrollment.id))}catch(error){fatal=fatal||scrub(error?.message||error,key,credentials);mark('database_verification',false,`Database verification failed: ${scrub(error?.message||error,key,credentials)}`)}}
 }
 const overall=checkpoints.length>0&&checkpoints.every(x=>x.pass)&&!fatal?'PASS':'FAIL';await persistResult(enrollment,overall,checkpoints,state,fatal);
 return json(res,200,{ok:overall==='PASS',overall,enrollment:{id:enrollment?.id||null,label:enrollment?.label||null},checkpoints,state,fatal});
}

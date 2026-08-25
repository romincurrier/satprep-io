import process from 'node:process';

const url=String(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'').replace(/\/$/,'');
const anon=String(process.env.VITE_SUPABASE_ANON_KEY||'');
const serviceKey=String(process.env.SUPABASE_SERVICE_ROLE_KEY||'');
const expectedProjectRef=String(process.env.SATPREP_EXPECTED_SUPABASE_REF||'ataaiocpbjavmdpgmzlv').trim();
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||!anon||!serviceKey){console.error('SUPABASE_URL (or VITE_SUPABASE_URL), VITE_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required.');process.exit(2)}
const projectRef=new URL(url).hostname.split('.')[0];
if(!expectedProjectRef||projectRef!==expectedProjectRef){console.error(`Refusing backend verification: configured Supabase project ${projectRef||'(unknown)'} does not match expected SATprep.io project ${expectedProjectRef||'(missing)'}.`);process.exit(3)}
console.log(`Verified backend target guard: ${projectRef}`);

// Read-only contract checks. This script does not insert, update, delete, invoke mutating RPCs,
// restore projects, or change storage configuration. Keep this contract aligned with every
// migration required by the commercial diagnostic/practice path so a partially migrated
// backend fails closed before launch.
const CONTRACT={
 profiles:'id,email,first_name,last_name,role,household_id,billing_owner',
 students:'id,profile_id,household_id,first_name,last_name,display_name,date_of_birth,grade_level,target_exam,target_score,onboarding_complete,diagnostic_completed_at,recommended_path',
 households:'id,name,plan_key,student_limit,is_test_household,created_at',
 parent_students:'parent_profile_id,student_id',
 parent_invitations:'id,student_profile_id,parent_email,status,expires_at,accepted_by,accepted_at,created_at',
 parental_consents:'id,student_profile_id,parent_profile_id,consent_type,consent_version,created_at',
 parent_setup_requests:'id,parent_email,status,created_at',
 subscriptions:'id,household_id,billing_profile_id,provider_customer_id,provider_subscription_id,plan_key,status,trial_ends_at,current_period_end,cancel_at_period_end',
 stripe_events:'event_id,event_type,created_at',
 prior_assessments:'id,student_id,created_by,assessment_type,assessment_date,source_method,file_name,file_path,section_scores,extracted_text,extracted_data,status,processed_at,processing_error',
 diagnostic_attempts:'id,student_id,status,started_at,completed_at,summary,overall_score,rw_score,math_score',
 diagnostic_responses:'id,attempt_id,student_id,question_key,content_item_id,selected_answer,response_text,is_correct,response_ms,scored_by_server,created_at',
 diagnostic_attempt_items:'attempt_id,position,item_id,module,is_targeted,selected_at',
 content_items:'id,version,content_type,section,domain_key,skill_key,difficulty,format,stimulus,stem,choices,exams,estimated_seconds,origin,qa_status,active,created_at,updated_at',
 content_answer_keys:'item_id,answer,explanation,distractor_rationales,updated_at',
 content_item_reviews:'id,item_id,review_type,reviewer_label,decision,content_hash,notes,created_at',
 practice_sessions:'id,student_id,skill_key,target_exam,status,content_version,mastery_before,adaptive_band,score,mastery_after,started_at,updated_at,completed_at',
 practice_session_items:'session_id,position,item_id,selected_at',
 practice_responses:'session_id,student_id,item_id,position,selected_answer,response_text,is_correct,response_ms,scored_by_server,created_at',
 lesson_progress:'student_id,lesson_key,current_question,best_score,last_score,completed_at,updated_at',
 skill_mastery:'student_id,skill_key,mastery,items_attempted,updated_at',
 question_attempts:'id,student_id,question_key,is_correct,created_at',
 student_achievements:'id,student_id,achievement_key,xp_awarded,earned_at',
 student_journey:'student_id,xp,level,stage_key,updated_at',
 privacy_requests:'id,requester_profile_id,target_student_id,request_type,status,submitted_at,updated_at,verified_at,completed_at',
 api_rate_limits:'key_hash,route_key,window_started_at,request_count,expires_at',
 marketing_events:'id,occurred_at,event_name,page_path,referrer_host,utm_source,utm_medium,utm_campaign,utm_content,utm_term,cta_key,section_key',
 content_item_calibration_v:'item_id,section,domain_key,skill_key,difficulty,response_count,facility,mean_response_ms,median_response_ms,section_score_correlation,option_a_count,option_b_count,option_c_count,option_d_count,first_observed_at,last_observed_at',
 content_skill_calibration_v:'section,domain_key,skill_key,difficulty,items_observed,response_count,facility,mean_response_ms'
};
const SERVER_ONLY=['content_items','content_answer_keys','content_item_reviews','diagnostic_attempt_items','practice_sessions','practice_session_items','practice_responses','api_rate_limits','marketing_events','content_item_calibration_v','content_skill_calibration_v'];
const failures=[],warnings=[];
async function request(target,key,method='GET'){
 const r=await fetch(target,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,Accept:'application/json'}});return r;
}
for(const [table,columns] of Object.entries(CONTRACT)){
 const target=`${url}/rest/v1/${table}?select=${encodeURIComponent(columns)}&limit=1`;
 try{const r=await request(target,serviceKey);if(!r.ok){const hint=r.status===404?'missing table/route':'missing column, schema drift, insufficient privilege, or unavailable service';failures.push(`${table}: service-role contract failed (${r.status}; ${hint}).`)}else console.log(`OK table/view ${table}`)}catch(e){failures.push(`${table}: ${e.message}`)}
}
for(const table of SERVER_ONLY){
 const target=`${url}/rest/v1/${table}?select=*&limit=1`;
 try{const r=await request(target,anon);if(r.ok)failures.push(`${table}: anonymous browser role can query a server-only table/view (${r.status}).`);else console.log(`OK browser denied ${table} (${r.status})`)}catch(e){warnings.push(`${table}: could not test anonymous denial: ${e.message}`)}
}
try{
 const r=await request(`${url}/storage/v1/bucket/assessment-reports`,serviceKey);if(!r.ok)failures.push(`assessment-reports storage bucket is missing or unavailable (${r.status}).`);else{const b=await r.json();if(b?.public!==false)failures.push('assessment-reports storage bucket must be private (public=false).');else console.log('OK private assessment-reports bucket')}
}catch(e){failures.push(`assessment-reports storage check failed: ${e.message}`)}

if(warnings.length){console.warn('\nWarnings:');for(const w of warnings)console.warn(`- ${w}`)}
if(failures.length){console.error('\nBackend launch contract FAILED:');for(const f of failures)console.error(`- ${f}`);console.error('\nDo not enable commercial mode, public billing, or public indexing until these discrepancies are reconciled.');process.exit(1)}
console.log('\nLive backend read-only contract checks passed for the expected SATprep.io project. This verifies required commercial tables/views/columns, selected browser-denial invariants, and private assessment storage; it is not a substitute for account-level end-to-end authorization tests.');

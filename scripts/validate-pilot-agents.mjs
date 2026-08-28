import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const core=read('server/pilot-agent-core-v2.js');
const run=read('api/pilot-agent-run.js');
const overview=read('api/pilot-agent-overview.js');
const remove=read('api/pilot-agent-delete.js');
const ui=read('pilot-control.js');
const html=read('pilot-control.html');
const gates=JSON.parse(read('launch-gates.json'));
const errors=[];
const need=(ok,msg)=>{if(!ok)errors.push(msg)};

need(core.includes("PILOT_AGENT_VERSION='pilot-agent-v1'"),'Pilot core must carry a versioned test identity.');
need(core.includes('is_test_account:true'),'Pilot Auth profiles must be marked as test accounts.');
need(core.includes('is_test_household:true'),'Pilot households must be marked as test households.');
need(core.includes('is_test_student:true'),'Pilot learners must be marked as test students.');
need(core.includes('test_only:true'),'Pilot diagnostic state must be explicitly test-only.');
need(core.includes("account_origin:'pilot_agent'"),'Pilot Auth users must carry pilot-agent origin metadata.');
need(core.includes("@example.com"),'Pilot agents must use non-customer synthetic email addresses.');
need(core.includes('resolution=merge-duplicates'),'Synthetic mastery/progress writes must use explicit conflict-safe upserts.');
need(!core.includes("qa_status:'production_approved'")&&!core.includes('production_approved:true'),'Pilot core must not approve content.');
need(!core.includes('content_items')&&!core.includes('content_answer_keys')&&!core.includes('content_item_reviews'),'Pilot core must not import or mutate commercial content tables.');
need(!core.includes('provider_customer_id')&&!core.includes('provider_subscription_id'),'Pilot core must not fabricate live billing state.');

for(const [name,source] of [['run',run],['delete',remove]]){
 need(source.includes('assertAppRequestOrigin(req)'),`Pilot ${name} mutation must enforce same-origin requests.`);
 need(source.includes("profile?.role==='admin'"),`Pilot ${name} mutation must require administrator role.`);
 need(source.includes('enforceRateLimit'),`Pilot ${name} mutation must be rate-limited.`);
}
need(run.includes("pilot-agent-core-v2.js"),'Pilot runner must use the hardened active core.');
need(overview.includes("pilot-agent-core-v2.js"),'Pilot overview must use the hardened active core.');
need(overview.includes("profile?.role==='admin'"),'Pilot overview must require administrator role.');
need(ui.includes("profile?.role!=='admin'"),'Pilot control UI must fail closed for non-admin users.');
need(!ui.match(/password/i),'Pilot control browser source must not handle pilot passwords.');
need(html.includes('noindex,nofollow,noarchive'),'Pilot control page must be non-indexable regardless of public launch state.');

for(const key of ['public_indexing','public_billing','live_payments','first_party_measurement','outbound_marketing'])need(gates[key]==='disabled',`Launch gate ${key} must remain disabled while pilot agents are enabled.`);

if(errors.length){console.error(`Pilot-agent safety validation failed with ${errors.length} error(s):`);for(const e of errors)console.error(`- ${e}`);process.exit(1)}
console.log('Pilot-agent safety validation passed: synthetic identity boundaries, admin-only mutations, content isolation, conflict-safe test state, and commercial launch gates remain enforced.');

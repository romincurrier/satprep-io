import fs from 'node:fs';

const endpoint=fs.readFileSync(new URL('../api/admin-overview.js',import.meta.url),'utf8');
const dashboard=fs.readFileSync(new URL('../admin-dashboard.js',import.meta.url),'utf8');
const failures=[];

const requireEndpoint=(text,label)=>{if(!endpoint.includes(text))failures.push(label)};
const requireDashboard=(text,label)=>{if(!dashboard.includes(text))failures.push(label)};

requireEndpoint("profile?.role === 'admin'",'Admin overview API must require the administrator role.');
requireEndpoint("enforceRateLimit(ctx.user.id, 'admin/overview'",'Admin overview API must retain rate limiting.');
requireEndpoint("select=role",'Admin overview must avoid loading unnecessary profile PII.');
requireEndpoint('recent_households','Admin overview must return an intentionally bounded household presentation model.');
requireEndpoint('recent_students','Admin overview must return an intentionally bounded student presentation model.');

for(const forbidden of ['email,first_name,last_name,role,household_id','selected_answer','response_text','content_answer_keys','explanation']){
 if(endpoint.includes(forbidden))failures.push(`Admin overview must not request or expose unnecessary sensitive material: ${forbidden}`);
}

requireDashboard('/api/admin-overview','Admin dashboard must load operations data through the trusted server API.');
requireDashboard('Server mediated','Admin dashboard must communicate the trusted operations data path.');
for(const forbidden of ["supabase.from('students')","supabase.from('households')","supabase.from('subscriptions')","supabase.from('diagnostic_attempts')"]){
 if(dashboard.includes(forbidden))failures.push(`Admin dashboard must not directly read broad operational tables in the browser: ${forbidden}`);
}

if(failures.length){
 console.error('Admin operations validation failed:');
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}
console.log('Admin operations validation passed.');

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const input=process.argv[2]||'artifacts/content-review-validation.json';
const registryPath=path.join(root,'content-approval-registry.json');
const sourcePath=path.join(root,input);
if(!fs.existsSync(sourcePath)){console.error(`Validated review artifact not found: ${input}`);console.error('Run npm run content:review-validate -- <review-file> first.');process.exit(1)}
if(!fs.existsSync(registryPath)){console.error('content-approval-registry.json is missing.');process.exit(1)}
const validation=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
if(!Array.isArray(validation.approved)||!Array.isArray(validation.revisions)||!Array.isArray(validation.rejections)){
 console.error('Review validation artifact is malformed.');process.exit(1)
}
registry.version=1;registry.approvals=registry.approvals||{};
const now=new Date().toISOString();
for(const record of [...validation.revisions,...validation.rejections]){
 const key=`${record.content_type}:${record.item_id}`;
 if(registry.approvals[key])delete registry.approvals[key];
}
for(const record of validation.approved){
 const key=`${record.content_type}:${record.item_id}`;
 registry.approvals[key]={content_hash:record.content_hash,reviewer:record.reviewer,reviewed_at:record.reviewed_at,applied_at:now,source_file:validation.source_file||input};
}
registry.updated_at=now;
registry.approvals=Object.fromEntries(Object.entries(registry.approvals).sort(([a],[b])=>a.localeCompare(b)));
fs.writeFileSync(registryPath,`${JSON.stringify(registry,null,2)}\n`);
console.log(`Applied ${validation.approved.length} approval(s). Removed approvals for ${validation.revisions.length+validation.rejections.length} revised/rejected item(s).`);
console.log('Approvals are hash-pinned: any later content edit invalidates the approval during build validation.');

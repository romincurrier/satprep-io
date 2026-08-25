import fs from 'node:fs';

const errors=[];
const read=p=>fs.readFileSync(p,'utf8');
const fail=m=>errors.push(m);

const ignore=read('.gitignore');
for(const pattern of ['artifacts/','private-content/','*.private.csv','content-review*.csv','.env'])if(!ignore.includes(pattern))fail(`.gitignore must exclude ${pattern}.`);

const importer=read('scripts/import-private-reviewed-content.mjs');
if(!/path\.isAbsolute\(file\)/.test(importer))fail('Private content importer must require an absolute external file path.');
if(!/resolvedFile\.startsWith\(`\$\{repoRoot\}\$\{path\.sep\}`\)/.test(importer))fail('Private content importer must refuse proprietary files located inside the public repository root.');
if(!/SUPABASE_SERVICE_ROLE_KEY/.test(importer))fail('Private content importer must use the server-only Supabase credential.');
if(!/PRIVATE_CONTENT_IMPORT_CONFIRM.*ACTIVATE_REVIEWED_CONTENT/.test(importer))fail('Private content activation must require an explicit confirmation environment value.');
if(!/const REVIEW_TYPES=\['accuracy','alignment','editorial','bias_accessibility','originality'\]/.test(importer))fail('Private importer must require all five independent review dimensions.');
if(!/createHash\('sha256'\)/.test(importer)||!/expected!==actual/.test(importer))fail('Private importer must recompute and verify the exact reviewed SHA-256 content hash.');
if(!/function duplicateSignature\(c\)/.test(importer)||!/function nearDuplicate\(a,b\)/.test(importer))fail('Private importer must screen exact and near-duplicate question content before database writes.');
if(!/qa_status=eq\.production_approved&select=id,content_type,section,skill_key,format,stimulus,stem,choices/.test(importer))fail('Private importer must compare incoming reviewed items against the existing production-approved bank.');
if(!/EXISTING_PAGE_SIZE=500/.test(importer)||!/offset=\$\{offset\}/.test(importer))fail('Private importer must paginate the existing reviewed-bank duplicate scan.');
if(!/existingSignatures\.get\(duplicateSignature\(entry\.c\)\)/.test(importer)||!/nearDuplicate\(entry\.c,prior\)/.test(importer))fail('Private importer must fail closed on duplicate or near-duplicate existing commercial content.');
if(!/body:\{active:false/.test(importer)||!/if\(activate\).*active:true/.test(importer))fail('Private importer must fail closed by deactivating existing content before replacement and activate only after successful writes.');
if(/console\.log\([^\n]*(?:stem|choices|explanation|stimulus)/i.test(importer))fail('Private importer must not log proprietary question content.');
const restStart=importer.indexOf('async function rest('),restEnd=importer.indexOf('async function existingReviewedContent');
if(restStart<0||restEnd<=restStart)fail('Private importer REST helper could not be verified.');
else{
 const restFn=importer.slice(restStart,restEnd);
 if(/new Error\([^)]*(?:text|r\.text)/s.test(restFn))fail('Private importer must not echo database response bodies that could contain proprietary content.');
 if(!/const e=new Error\(`Supabase content import request failed \(\$\{r\.status\}\)\.`\)/.test(restFn))fail('Private importer REST errors must remain status-only and must not include database response content.');
}

const doc=read('docs/PRIVATE_CONTENT_WORKFLOW.md');
if(!/must not be treated as secret commercial assessment content/i.test(doc))fail('Private content documentation must explicitly treat previously public answer keys as exposed.');
if(!/dedicated private content repository|dedicated private repository/i.test(doc))fail('Private content documentation must retain the long-term private repository/CMS requirement.');

if(errors.length){for(const e of errors)console.error(`Private content workflow validation error: ${e}`);process.exit(1)}
console.log('Private proprietary-content workflow validation passed.');

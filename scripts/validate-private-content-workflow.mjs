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
if(!/MIN_INDEPENDENT_REVIEWERS=3/.test(importer)||!/MAX_DIMENSIONS_PER_REVIEWER=2/.test(importer))fail('Private importer must enforce at least three reviewers and no more than two review dimensions per reviewer.');
if(!/`\$\{type\}_reviewer`/.test(importer))fail('Private importer must support reviewer identity by review dimension.');
if(!/counts\.size<MIN_INDEPENDENT_REVIEWERS/.test(importer)||!/Math\.max\(\.\.\.counts\.values\(\)\)>MAX_DIMENSIONS_PER_REVIEWER/.test(importer))fail('Private importer must fail closed when reviewer diversity is insufficient.');
if(!/createHash\('sha256'\)/.test(importer)||!/expected!==actual/.test(importer))fail('Private importer must recompute and verify the exact reviewed SHA-256 content hash.');
if(!/function duplicateSignature\(c\)/.test(importer)||!/function nearDuplicate\(a,b\)/.test(importer))fail('Private importer must screen exact and near-duplicate question content before database writes.');
const signatureFn=importer.match(/function duplicateSignature\(c\)\{([^\n]+)\}/)?.[1]||'';
if(!signatureFn||/type:c\.type/.test(signatureFn))fail('Duplicate signatures must be content-based across diagnostic and practice banks, not partitioned by content type.');
const nearDuplicateFn=importer.match(/function nearDuplicate\(a,b\)\{([^\n]+)\}/)?.[1]||'';
if(!nearDuplicateFn||/a\.type!==b\.type/.test(nearDuplicateFn))fail('Near-duplicate screening must protect diagnostic integrity across diagnostic and practice banks.');
if(!/Diagnostic and practice banks must remain distinct\./.test(importer))fail('Private importer must explicitly fail closed on diagnostic/practice content overlap.');
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

const preflight=read('scripts/private-content-readiness-report.mjs');
if(!/path\.isAbsolute\(file\)/.test(preflight)||!/resolved\.startsWith\(`\$\{root\}\$\{path\.sep\}`\)/.test(preflight))fail('Private readiness preflight must require an external absolute file path and refuse repo-local proprietary files.');
if(!/evaluateSkillCoverage\(pool,kind\)/.test(preflight)||!/COMMERCIAL_CONTENT_POLICY/.test(preflight))fail('Private readiness preflight must use the shared commercial depth/difficulty policy.');
if(!/MIN_INDEPENDENT_REVIEWERS=3/.test(preflight)||!/MAX_DIMENSIONS_PER_REVIEWER=2/.test(preflight))fail('Private readiness preflight must use the commercial reviewer-independence thresholds.');
if(!/question text is intentionally not shown/i.test(preflight))fail('Private readiness preflight must explicitly avoid printing proprietary question text.');
if(/console\.(?:log|warn|error)\([^\n]*(?:stem|choices|explanation|stimulus)/i.test(preflight))fail('Private readiness preflight must not log proprietary question content fields.');

const liveVerifier=read('scripts/verify-live-content-readiness.mjs');
if(!/MIN_INDEPENDENT_REVIEWERS=3/.test(liveVerifier)||!/MAX_DIMENSIONS_PER_REVIEWER=2/.test(liveVerifier)||!/independentReviewSet/.test(liveVerifier))fail('Live content readiness must independently enforce commercial reviewer diversity.');
if(!/process\.argv\.includes\('--strict'\).*invalidProduction\.length/s.test(liveVerifier))fail('Strict live content readiness must fail on production rows with invalid, stale, or non-independent approvals.');

const doc=read('docs/PRIVATE_CONTENT_WORKFLOW.md');
if(!/must not be treated as secret commercial assessment content/i.test(doc))fail('Private content documentation must explicitly treat previously public answer keys as exposed.');
if(!/dedicated private content repository|dedicated private repository/i.test(doc))fail('Private content documentation must retain the long-term private repository/CMS requirement.');
if(!/at least three distinct reviewer labels/i.test(doc)||!/no reviewer approving more than two dimensions/i.test(doc))fail('Private content documentation must state the enforced reviewer-independence rule.');
if(!/content:private-readiness/.test(doc))fail('Private content documentation must include the metadata-only private readiness preflight step.');

if(errors.length){for(const e of errors)console.error(`Private content workflow validation error: ${e}`);process.exit(1)}
console.log('Private proprietary-content workflow validation passed.');

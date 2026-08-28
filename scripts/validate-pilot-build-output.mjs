import fs from 'node:fs';

const required=['dist/index.html','dist/test-lab.html','dist/household-test.html','dist/pilot-control.html'];
const errors=[];
for(const path of required)if(!fs.existsSync(path))errors.push(`Missing built HTML entry: ${path}`);
if(fs.existsSync('dist/pilot-control.html')){
 const html=fs.readFileSync('dist/pilot-control.html','utf8');
 if(!html.includes('noindex,nofollow,noarchive'))errors.push('Built Pilot Control page lost its explicit noindex/nofollow/noarchive directive.');
 if(!/assets\/.+\.js/.test(html))errors.push('Built Pilot Control page does not reference a bundled JavaScript asset.');
}
if(errors.length){console.error(`Pilot build-output validation failed with ${errors.length} error(s):`);for(const e of errors)console.error(`- ${e}`);process.exit(1)}
console.log('Pilot build-output validation passed: standalone QA/control HTML entries are emitted and Pilot Control remains non-indexable.');

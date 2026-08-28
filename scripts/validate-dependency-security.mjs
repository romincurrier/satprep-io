import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const expectedSheetJs='https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz';

function installed(name){
  const file=path.join(root,'node_modules',...name.split('/'),'package.json');
  return JSON.parse(fs.readFileSync(file,'utf8')).version;
}

function parts(version){
  return String(version).split(/[.-]/).slice(0,3).map(v=>Number.parseInt(v,10)||0);
}
function atLeast(actual,minimum){
  const a=parts(actual),b=parts(minimum);
  for(let i=0;i<3;i++){if(a[i]>b[i])return true;if(a[i]<b[i])return false}
  return true;
}

if(pkg.dependencies?.xlsx!==expectedSheetJs){
  throw new Error(`Unsafe SheetJS dependency source. Expected ${expectedSheetJs}.`);
}
if(pkg.devDependencies?.vite!=='7.3.6'){
  throw new Error('Vite must remain pinned to the production-verified 7.3.6 release until a separately reviewed upgrade is tested.');
}

const versions={
  '@supabase/supabase-js':installed('@supabase/supabase-js'),
  'pdfjs-dist':installed('pdfjs-dist'),
  xlsx:installed('xlsx'),
  vite:installed('vite'),
};

if(!atLeast(versions.xlsx,'0.20.3'))throw new Error(`Installed SheetJS ${versions.xlsx} is below the 0.20.3 security floor.`);
if(versions.vite!=='7.3.6')throw new Error(`Installed Vite ${versions.vite} does not match the pinned production-verified 7.3.6 release.`);

console.log(`Dependency security guard passed: @supabase/supabase-js ${versions['@supabase/supabase-js']}, pdfjs-dist ${versions['pdfjs-dist']}, xlsx ${versions.xlsx}, vite ${versions.vite}.`);

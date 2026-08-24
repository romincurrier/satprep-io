import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),errors=[];
const fail=(file,msg)=>errors.push(`${file}: ${msg}`);
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

function publicHtmlFiles(dir='public'){
 const out=[];
 for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  const rel=path.join(dir,entry.name).replaceAll('\\','/');
  if(entry.isDirectory())out.push(...publicHtmlFiles(rel));
  else if(entry.name.endsWith('.html'))out.push(rel);
 }
 return out;
}
function count(txt,re){return [...txt.matchAll(re)].length}
function attr(tag,name){return tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`,'i'))?.slice(1).find(x=>x!=null)}

for(const file of publicHtmlFiles()){
 const html=read(file);
 if(!/<html\b[^>]*\blang=["'][a-z]{2}(?:-[A-Z]{2})?["']/i.test(html))fail(file,'document must declare a language.');
 if(!/<meta\b[^>]*name=["']viewport["']/i.test(html))fail(file,'responsive viewport metadata is required.');
 if(!/<title>\s*[^<]{3,}\s*<\/title>/i.test(html))fail(file,'document must have a meaningful title.');
 if(!/<main\b/i.test(html))fail(file,'document must contain a main landmark.');
 const h1=count(html,/<h1\b/gi);if(h1!==1)fail(file,`expected exactly one h1, found ${h1}.`);
 if(/tabindex=["']?[1-9]/i.test(html))fail(file,'positive tabindex values are prohibited.');
 for(const tag of html.match(/<img\b[^>]*>/gi)||[])if(attr(tag,'alt')==null)fail(file,`image is missing alt text: ${tag.slice(0,100)}`);
 for(const tag of html.match(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)||[]){const rel=attr(tag,'rel')||'';if(!/\bnoopener\b/i.test(rel))fail(file,'target="_blank" links must include rel="noopener".');}
 const tables=html.match(/<table\b[\s\S]*?<\/table>/gi)||[];
 for(const table of tables){
  if(!/<caption\b[\s\S]*?<\/caption>/i.test(table))fail(file,'data tables must include a caption.');
  for(const th of table.match(/<th\b[^>]*>/gi)||[])if(!/\bscope=["'](?:col|row)["']/i.test(th))fail(file,'table header cells must declare scope="col" or scope="row".');
 }
 for(const input of html.match(/<(?:input|select|textarea)\b[^>]*>/gi)||[]){
  if(/type=["']hidden["']/i.test(input))continue;
  const id=attr(input,'id'),aria=attr(input,'aria-label')||attr(input,'aria-labelledby');
  if(!aria&&(!id||!new RegExp(`<label\\b[^>]*for=["']${id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["']`,'i').test(html)))fail(file,`form control needs an associated label or accessible name: ${input.slice(0,100)}`);
 }
}

const appIndex=read('index.html');
if(!/<a\b[^>]*class=["'][^"']*skip-link[^"']*["'][^>]*href=["']#app["']/i.test(appIndex))fail('index.html','application shell must provide a keyboard skip link to #app.');
if(!/<div\b[^>]*id=["']app["'][^>]*tabindex=["']-1["']/i.test(appIndex))fail('index.html','#app must be programmatically focusable for skip-link navigation.');
if(!/href=["']\/accessibility\.css["']/i.test(appIndex))fail('index.html','application accessibility stylesheet must be loaded.');
if(/tabindex=["']?[1-9]/i.test(appIndex))fail('index.html','positive tabindex values are prohibited.');

const appCss=read('public/accessibility.css'),learnCss=read('public/learn.css');
if(!/:focus-visible/.test(appCss))fail('public/accessibility.css','application controls need a visible focus indicator.');
if(!/prefers-reduced-motion\s*:\s*reduce/.test(appCss))fail('public/accessibility.css','application must respect reduced-motion preferences.');
if(!/:focus-visible/.test(learnCss))fail('public/learn.css','public content links and controls need a visible focus indicator.');
if(!/prefers-reduced-motion\s*:\s*reduce/.test(learnCss))fail('public/learn.css','public content must respect reduced-motion preferences.');

if(errors.length){for(const e of errors)console.error(`Accessibility validation error: ${e}`);process.exit(1)}
console.log(`Accessibility invariant validation passed for ${publicHtmlFiles().length} public HTML pages plus the application shell.`);

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const publicDir=path.join(root,'public');
const sitemapPath=path.join(publicDir,'sitemap.xml');
const errors=[];
const warnings=[];

function fail(msg){errors.push(msg)}
function warn(msg){warnings.push(msg)}
function read(file){return fs.readFileSync(file,'utf8')}
function match(html,re){return html.match(re)?.[1]?.trim()||''}
function normalizeUrl(url){try{const u=new URL(url);return `${u.origin}${u.pathname.endsWith('/')?u.pathname:`${u.pathname}/`}`}catch{return url}}

if(!fs.existsSync(sitemapPath))fail('public/sitemap.xml is missing');
const sitemap=fs.existsSync(sitemapPath)?read(sitemapPath):'';
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].trim());
const seen=new Set();
for(const url of urls){if(seen.has(url))fail(`Duplicate sitemap URL: ${url}`);seen.add(url)}
if(!urls.includes('https://satprep.io/'))fail('Sitemap must include https://satprep.io/');

for(const url of urls){
 let u;try{u=new URL(url)}catch{fail(`Invalid sitemap URL: ${url}`);continue}
 if(u.origin!=='https://satprep.io')fail(`Unexpected sitemap origin: ${url}`);
 if(u.pathname==='/' )continue;
 const rel=u.pathname.replace(/^\//,'').replace(/\/$/,'');
 const file=path.join(publicDir,rel,'index.html');
 if(!fs.existsSync(file)){fail(`${u.pathname} is in sitemap but ${path.relative(root,file)} is missing`);continue}
 const html=read(file);
 const title=match(html,/<title>([^<]+)<\/title>/i);
 const description=match(html,/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)||match(html,/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
 const canonical=match(html,/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)||match(html,/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);
 const robots=match(html,/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)||match(html,/<meta\s+content=["']([^"']+)["']\s+name=["']robots["']/i);
 const h1Count=(html.match(/<h1\b/gi)||[]).length;
 if(!title)fail(`${u.pathname}: missing <title>`);else if(title.length>70)warn(`${u.pathname}: title is ${title.length} characters`);
 if(!description)fail(`${u.pathname}: missing meta description`);else if(description.length>180)warn(`${u.pathname}: meta description is ${description.length} characters`);
 if(!canonical)fail(`${u.pathname}: missing canonical URL`);else if(normalizeUrl(canonical)!==normalizeUrl(url))fail(`${u.pathname}: canonical ${canonical} does not match sitemap ${url}`);
 if(!robots)fail(`${u.pathname}: missing robots meta`);else if(/noindex/i.test(robots))fail(`${u.pathname}: sitemap page is marked noindex`);
 if(h1Count!==1)fail(`${u.pathname}: expected exactly one H1, found ${h1Count}`);
 if(!/<meta\s+property=["']og:title["']/i.test(html))warn(`${u.pathname}: missing og:title`);
 if(!/<meta\s+property=["']og:description["']/i.test(html))warn(`${u.pathname}: missing og:description`);
 if(!/application\/ld\+json/i.test(html))warn(`${u.pathname}: no structured data block`);
}

const robotsPath=path.join(publicDir,'robots.txt');
if(!fs.existsSync(robotsPath))fail('public/robots.txt is missing');
else{
 const robots=read(robotsPath);
 if(!/Sitemap:\s*https:\/\/satprep\.io\/sitemap\.xml/i.test(robots))fail('robots.txt must advertise the canonical sitemap URL');
}

for(const w of warnings)console.warn(`SEO warning: ${w}`);
if(errors.length){for(const e of errors)console.error(`SEO error: ${e}`);process.exit(1)}
console.log(`SEO validation passed for ${urls.length} sitemap URLs (${warnings.length} warning${warnings.length===1?'':'s'}).`);

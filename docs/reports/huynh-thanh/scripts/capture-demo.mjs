import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')),'../../../..');
const out=path.join(root,'docs/reports/huynh-thanh');
const req=createRequire(path.join(root,'frontend/package.json'));
const pnpmDir=path.join(root,'frontend/node_modules/.pnpm');
const pwPath=path.join(pnpmDir,readdirSync(pnpmDir).find(n=>n.startsWith('playwright@')),'node_modules/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(pwPath));
const breq=createRequire(path.join(root,'backend/package.json'));
const dotenv=breq('dotenv');
const env={...process.env,...dotenv.config({path:path.join(root,'backend/.env'),quiet:true}).parsed,PORT:'5071',CORS_ORIGINS:'http://localhost:5179',NODE_ENV:'test',RATE_LIMIT_GENERAL:'10000',RATE_LIMIT_AUTH:'1000',LOG_LEVEL:'silent'};
const browser=await chromium.launch({channel:'msedge',headless:true});
const temp=mkdtempSync(path.join(os.tmpdir(),'culinary-report-'));
const evidence={capturedAt:new Date().toISOString(),mode:'Real browser, snapshot frontend + backend, existing PostgreSQL; read-only product screens. Authentication login creates session. No publish/archive/delete/ingredient/step mutations submitted.',snapshots:[],errors:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(url,p){for(let i=0;i<100;i++){if(p.exitCode!==null)throw new Error('Server exited '+p.exitCode);try{if((await fetch(url)).ok)return}catch{} await pause(500)}throw new Error('Timeout '+url)}
function server(args,cwd,e){const p=spawn(process.execPath,args,{cwd,env:e,windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';p.stdout.on('data',b=>log=(log+b).slice(-5000));p.stderr.on('data',b=>log=(log+b).slice(-5000));p.reportLog=()=>log;return p}
async function screenshot(page,file){await page.screenshot({path:path.join(out,'images',file),fullPage:true});}
const specs=[
{commit:'aa0ecc6',code:'FR-RCP-005',route:'/dashboard/recipes',file:'01-xuat-ban.png',heading:'Công thức'},
{commit:'1fa926b',code:'FR-RCP-006',route:'/dashboard/recipes',file:'02-luu-tru.png',heading:'Công thức'},
{commit:'3b3285e',code:'FR-RCP-007',route:'/dashboard/recipes',file:'03-xoa-cong-thuc.png',heading:'Công thức'},
{commit:'c43d091',code:'FR-RCP-009',route:'/dashboard/ingredients',file:'04-nguyen-lieu.png',heading:'Quản lý nguyên liệu'},
{commit:'423407a',code:'FR-RCP-010',route:'/dashboard/recipe-steps',file:'05-buoc-nau.png',heading:'bước'},
{commit:'c620451',code:'FR-SRCH-002',route:'/recipes',file:'06-loc-cong-thuc.png',heading:'Công thức nấu ăn'}
];
try{
const selected=process.argv.slice(2);
if(selected.length){try{const old=JSON.parse(readFileSync(path.join(out,'evidence/capture-results.json'),'utf8'));evidence.snapshots=old.snapshots.filter(s=>!selected.includes(s.code));}catch{}}
for(const spec of specs){
if(selected.length&&!selected.includes(spec.code))continue;
let api,web,context;
try{
const dir=path.join(temp,spec.commit);mkdirSync(dir);
const zip=path.join(temp,spec.commit+'.zip');
execFileSync('git',['archive','--format=zip','--output='+zip,spec.commit,'backend','frontend'],{cwd:root,windowsHide:true});
execFileSync('powershell',['-NoProfile','-Command','Expand-Archive -LiteralPath "'+zip+'" -DestinationPath "'+dir+'"'],{windowsHide:true});
for(const sub of ['frontend','backend'])execFileSync('powershell',['-NoProfile','-Command','New-Item -ItemType Junction -Path "'+path.join(dir,sub,'node_modules')+'" -Target "'+path.join(root,sub,'node_modules')+'" | Out-Null'],{windowsHide:true});
api=server(['--import',pathToFileURL(path.join(root,'backend/node_modules/tsx/dist/loader.mjs')).href,'src/index.ts'],path.join(dir,'backend'),env);
await ready('http://localhost:5071/health/live',api);
web=server([path.join(root,'frontend/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5179'],path.join(dir,'frontend'),{...process.env,VITE_API_BASE_URL:'http://localhost:5071/api/v1'});
await ready('http://localhost:5179',web);
const lr=await fetch('http://localhost:5071/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@lethimcook.com',password:'Admin@123'})});
if(!lr.ok)throw new Error('Demo account login HTTP '+lr.status);
const session=await lr.json();
context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
await context.addInitScript(s=>localStorage.setItem('culinary_session',JSON.stringify(s)),session);
const page=await context.newPage();
const responses=[];
page.on('response',r=>{if(r.url().includes('/api/v1/')&&!r.url().includes('/auth/'))responses.push({url:r.url(),status:r.status()})});
await page.goto('http://localhost:5179'+spec.route,{waitUntil:'networkidle'});
await page.waitForTimeout(1500);
if(spec.code==='FR-RCP-009'||spec.code==='FR-RCP-010'){
const select=page.locator('select').first();
if(await select.count()){const value=await select.locator('option').evaluateAll(opts=>opts.find(o=>o.value)?.value);if(value&&await select.inputValue()!==value)await select.selectOption(value)}
await page.waitForLoadState('networkidle');await page.waitForTimeout(500);
await page.waitForFunction(()=>!document.body.innerText.includes('Đang tải nguyên liệu')&&!document.body.innerText.includes('Đang tải bước'),{timeout:20000});
}
if(spec.code==='FR-RCP-007'){const button=page.getByRole('button',{name:/^Xóa công thức$/}).first();if(await button.count())await button.click();}
if(spec.code==='FR-RCP-006'){const button=page.getByRole('button',{name:/^Lưu trữ$/}).first();if(await button.count())await button.click();}
if(spec.code==='FR-SRCH-002'){
const list=await (await fetch('http://localhost:5071/api/v1/recipes?pageSize=1')).json();
if(!list.items?.length)throw new Error('No published recipes for filter demo');
const item=list.items[0];
await page.goto('http://localhost:5179/recipes?'+new URLSearchParams({categoryId:item.categoryId,difficulty:item.difficulty,maxCookTime:String(item.cookTime),minServings:String(item.servings),page:'1',pageSize:'12'}),{waitUntil:'networkidle'});
await page.getByTestId('recipe-card').first().waitFor();
await screenshot(page,spec.file);
await page.goto('http://localhost:5179/recipes?page=2&pageSize=12',{waitUntil:'networkidle'});
await page.waitForTimeout(500);
await screenshot(page,'08-phan-trang.png');
const sr=await fetch('http://localhost:5071/api/v1/recipes?field=title&order=asc&page=1&pageSize=5');
const data=await sr.json();
writeFileSync(path.join(out,'evidence/sorting-response.json'),JSON.stringify({request:'GET /api/v1/recipes?field=title&order=asc&page=1&pageSize=5',httpStatus:sr.status,data},null,2));
await page.goto('http://localhost:5071/api/v1/recipes?field=title&order=asc&page=1&pageSize=5',{waitUntil:'networkidle'});
await screenshot(page,'07-sap-xep-api.png');
}else await screenshot(page,spec.file);
evidence.snapshots.push({...spec,responses,title:await page.title(),result:'captured'});
console.log(spec.code+' captured');
}catch(e){evidence.errors.push({code:spec.code,message:e.message});console.log(spec.code+' FAILED: '+e.message)}
finally{if(context)await context.close();for(const p of [web,api])if(p&&p.exitCode===null)p.kill();await pause(1000)}
}
}finally{await browser.close();writeFileSync(path.join(out,'evidence/capture-results.json'),JSON.stringify(evidence,null,2));console.log('Evidence saved. Snapshots retained at '+temp);}
if(evidence.errors.length)process.exitCode=1;

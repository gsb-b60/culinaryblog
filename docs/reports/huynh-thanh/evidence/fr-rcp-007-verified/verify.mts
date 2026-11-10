import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const root = process.cwd();
const out = resolve(root, 'docs/reports/huynh-thanh/evidence/fr-rcp-007-verified');
const br = createRequire(resolve(root, 'backend/package.json'));
const fr = createRequire(resolve(root, 'frontend/package.json'));
const {chromium, expect} = fr('@playwright/test');
const commit = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const branch = execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();
const results = {commit, branch, startedAt: new Date().toISOString(), requests: [], checks: {}};
let fixture, server, web, browser, worker;
let storage, s3, keys = [];
const deadline = setTimeout(()=>{console.error('Evidence timeout');process.exit(1)},180000);
async function poll(check, label) {
  for(let n=0;n<100;n++){if(await check())return;await new Promise(r=>setTimeout(r,300));}
  throw new Error('Timeout: '+label);
}
const escape = s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
try {
  assert(JSON.parse(readFileSync(resolve(out,'checks.json'),'utf8').replace(/^\uFEFF/,'')));
  const {startIngredientIntegration} = await import(pathToFileURL(resolve(root,'backend/tests/support/ingredientIntegration.ts')).href);
  fixture = await startIngredientIntegration();
  const {env} = await import(pathToFileURL(resolve(root,'backend/src/config-middleware/config/env.ts')).href);
  const {MinioFileStorageService} = await import(pathToFileURL(resolve(root,'backend/src/infrastructure/file-storage/MinioFileStorageService.ts')).href);
  storage = new MinioFileStorageService();
  const {S3Client, HeadObjectCommand, DeleteObjectCommand} = br('@aws-sdk/client-s3');
  s3 = new S3Client({region:env.S3_REGION, endpoint:env.S3_ENDPOINT,forcePathStyle:true,credentials:{accessKeyId:env.S3_ACCESS_KEY,secretAccessKey:env.S3_SECRET_KEY}});
  const target = fixture.recipes[13];
  const title = 'Minh chứng xóa công thức - Huỳnh Thành 2312748';
  await fixture.prisma.recipe.update({where:{id:target.id},data:{title}});
  keys = ['original.svg','medium.svg','thumbnail.svg','step.svg'].map(n=>'recipes/'+target.id+'/'+n);
  const urls = [];
  for(const key of keys) urls.push(await storage.uploadFile(key,Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="orange"/></svg>'),'image/svg+xml'));
  await fixture.prisma.recipeImage.create({data:{recipeId:target.id,originalUrl:urls[0],mediumUrl:urls[1],thumbnailUrl:urls[2],isPrimary:true}});
  await fixture.prisma.recipeStep.create({data:{recipeId:target.id,stepNumber:1,title:'Bước minh chứng',description:'Kiểm tra cascade và dọn ảnh thật',imageUrl:urls[3]}});
  await fixture.prisma.recipeIngredient.create({data:{recipeId:target.id,name:'Nguyên liệu minh chứng',quantity:1,unit:'g'}});
  async function objectExists(key) {try {await s3.send(new HeadObjectCommand({Bucket:env.S3_BUCKET,Key:key}));return true;}catch(e){if(e.$metadata?.httpStatusCode===404)return false;throw e;}}
  assert((await Promise.all(keys.map(objectExists))).every(Boolean));
  server = fixture.app.listen(0,'127.0.0.1');
  await new Promise(r=>server.once('listening',r));
  const api = 'http://127.0.0.1:'+server.address().port+'/api/v1';
  async function del(id, token) {
    const res = await fetch(api+'/recipes/'+id,{method:'DELETE',headers:token?{Authorization:'Bearer '+token}:{}});
    results.requests.push({method:'DELETE',path:'/api/v1/recipes/'+id,status:res.status});
    return res;
  }
  assert.equal((await del(target.id)).status,401);
  assert.equal((await del(target.id,fixture.otherToken)).status,403);
  assert(await fixture.prisma.recipe.findUnique({where:{id:target.id}}));
  const login = await fetch(api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:fixture.owner.email,password:'Integration1!'})});
  assert.equal(login.status,200);
  const session = await login.json();
  web = spawn(process.execPath,[resolve(root,'frontend/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5187','--strictPort'],{cwd:resolve(root,'frontend'),env:{...process.env,VITE_API_BASE_URL:api},windowsHide:true,stdio:'ignore'});
  await poll(async()=>{try{return (await fetch('http://127.0.0.1:5187')).ok}catch{return false}},'Vite');
  browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:1050}});
  await context.addInitScript(value=>localStorage.setItem('culinary_session',JSON.stringify(value)),session);
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5187/dashboard/recipes/delete');
  const article = page.getByRole('article',{name:title,exact:true});
  await expect(article).toBeVisible();
  await page.screenshot({path:resolve(out,'01-real-delete-list.png'),fullPage:false});
  await article.getByRole('button',{name:'Xóa',exact:true}).click();
  await expect(article.getByRole('group')).toBeVisible();
  await page.screenshot({path:resolve(out,'02-real-confirmation.png'),fullPage:false});
  await article.getByRole('button',{name:'Hủy',exact:true}).click();
  assert(await fixture.prisma.recipe.findUnique({where:{id:target.id}}));
  results.checks.cancelPreservesRecipe = true;
  await article.getByRole('button',{name:'Xóa',exact:true}).click();
  const pending = page.waitForResponse(r=>r.request().method()==='DELETE' && r.url()===api+'/recipes/'+target.id);
  await article.getByRole('button',{name:'Xác nhận xóa',exact:true}).click();
  const deleted = await pending;
  assert.equal(deleted.status(),204);
  assert.equal(await deleted.text(),'');
  results.requests.push({method:'DELETE',path:'/api/v1/recipes/'+target.id,status:204,body:''});
  await expect(page.getByRole('status')).toHaveText('Đã xóa công thức.');
  await expect(article).toHaveCount(0);
  await page.screenshot({path:resolve(out,'03-real-delete-success.png'),fullPage:false});
  for(const [label,model] of [['recipe','recipe'],['steps','recipeStep'],['ingredients','recipeIngredient'],['images','recipeImage']]){
    const count = await fixture.prisma[model].count({where:model==='recipe'?{id:target.id}:{recipeId:target.id}});
    assert.equal(count,0);results.checks[label+'Remaining']=count;
  }
  const tasks = await fixture.prisma.fileCleanupTask.findMany({where:{recipeId:target.id}});
  assert.equal(tasks.length,4);
  results.checks.outboxTasksBeforeWorker = tasks.length;
  const {startFileCleanupWorker} = await import(pathToFileURL(resolve(root,'backend/src/infrastructure/jobs/workers/fileCleanupWorker.ts')).href);
  const {fileCleanupQueue} = await import(pathToFileURL(resolve(root,'backend/src/infrastructure/jobs/queues/fileCleanupQueue.ts')).href);
  worker = startFileCleanupWorker();
  await poll(async()=> (await fixture.prisma.fileCleanupTask.count({where:{recipeId:target.id}}))===0,'outbox drained');
  await poll(async()=> (await Promise.all(tasks.map(async t=>{const j=await fileCleanupQueue.getJob(t.id);return j && await j.getState()==='completed'}))).every(Boolean),'BullMQ completed');
  assert((await Promise.all(keys.map(objectExists))).every(exists=>!exists));
  results.checks.cleanupJobsCompleted = 4;
  results.checks.minioObjectsRemaining = 0;
  for(const task of tasks){const job=await fileCleanupQueue.getJob(task.id);await job.remove();}
  assert.equal((await del(target.id,fixture.ownerToken)).status,404);
  assert.equal((await del(fixture.foreign.id,fixture.adminToken)).status,204);
  results.checks.adminDeletesOtherAuthorRecipe = true;
  results.checks.status = 'PASS';
  results.finishedAt = new Date().toISOString();
  writeFileSync(resolve(out,'result.json'),JSON.stringify(results,null,2));
  const report = await context.newPage();
  await report.setContent('<html><meta charset="utf-8"><body style="background:#0f172a;color:#e2e8f0;padding:32px;font:19px monospace"><h1>FR-RCP-007 — Real integration results</h1><p>Actual HTTP, PostgreSQL, Redis/BullMQ and MinIO results</p><pre>'+escape(JSON.stringify(results,null,2))+'</pre></body></html>');
  await report.screenshot({path:resolve(out,'04-api-database-cleanup-results.png'),fullPage:true});
  const checks = JSON.parse(readFileSync(resolve(out,'checks.json'),'utf8').replace(/^\uFEFF/,''));
  const logs = ['backend-test','frontend-test','backend-lint','frontend-lint','backend-build','frontend-build'];
  let html = '<html><meta charset="utf-8"><body style="background:#0f172a;color:#e2e8f0;padding:30px;font:16px monospace"><h1>Executed checks — '+commit.slice(0,7)+'</h1><pre>'+escape(JSON.stringify(checks,null,2))+'</pre>';
  for(const log of logs){const raw=readFileSync(resolve(out,log+'.log'));const decoded=raw[0]===255 && raw[1]===254?raw.toString('utf16le'):raw.toString('utf8');html+='<h2>'+log+'</h2><pre style="white-space:pre-wrap">'+escape(decoded.replace(/\u001b\[[0-9;]*m/g,'').split('\n').filter((line,index,lines)=>index>=lines.length-24 || /Test Files|Tests |Duration/.test(line)).join('\n'))+'</pre>';}
  await report.setContent(html+'</body></html>');
  await report.screenshot({path:resolve(out,'05-checks-output.png'),fullPage:true});
  console.log(JSON.stringify(results,null,2));
} catch(error) {
  results.error = String(error);
  writeFileSync(resolve(out,'failure.json'),JSON.stringify(results,null,2));
  console.error(error);
  process.exitCode=1;
} finally {
  clearTimeout(deadline);
  if(browser)await browser.close();
  if(web){web.kill();await new Promise(r=>setTimeout(r,500));}
  if(server)await new Promise(r=>server.close(r));
  if(worker)await worker.close();
  if(storage)for(const key of keys)await storage.deleteFile(key).catch(()=>{});
  s3?.destroy();
  if(fixture)await fixture.close();
}

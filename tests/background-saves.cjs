const fs=require('fs'),vm=require('vm'),assert=require('assert');
const helper=fs.readFileSync(__dirname+'/../shared/cloud.js','utf8');
function environment(){
 let now=0,next=1,endpoint='https://script.google.com/macros/s/test-existing/exec',familyKey='test-only';
 const timers=new Map(),handlers={},requests=[];let handler=async()=>({ok:true,state:null});
 const context={console,Promise,JSON,Error,Object,Number,Date:{now:()=>now},encodeURIComponent,AbortController,setTimeout:(fn,ms)=>{let id=next++;timers.set(id,{fn,at:now+ms,ms});return id},clearTimeout:id=>timers.delete(id),document:{visibilityState:'visible',addEventListener(){}},CeciliaWallet:{key:()=>familyKey,saveURL:()=>endpoint},fetch:async(url,opts)=>{requests.push({url,opts});let body=await handler(url,opts);return {ok:true,headers:{get:()=>body.html?'text/html':'application/json'},json:async()=>body}},window:{addEventListener:(n,fn)=>{(handlers[n]??=[]).push(fn)}}};
 context.window.CeciliaWallet=context.CeciliaWallet;vm.createContext(context);vm.runInContext(helper,context);context.CeciliaCloud=context.window.CeciliaCloud;
 return {context,requests,timers,configure:(url,key)=>{endpoint=url;familyKey=key},respond:fn=>handler=fn,advance:async(ms)=>{now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn()}await flush()},event:n=>(handlers[n]||[]).forEach(fn=>fn())};
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
async function test(){
 // Every language game opens its local copy before a delayed server reply.
 for(const name of ['word-garden','sentence-stars','word-match']){
  const e=environment(),c=e.context;let release;
  e.respond(()=>new Promise(resolve=>release=resolve));
  const source=fs.readFileSync(__dirname+'/../'+name+'/index.html','utf8');
  const cloud=source.slice(source.indexOf('var CLOUD_URL='),source.indexOf('/* ===== UI part 1:'));
  const ui={style:{},textContent:''};Object.assign(c,{S:{total:3,ts:1},GAME:{profile:'cecilia_test'},PROFILE:'cecilia_test',cur:'home',idbGet:cb=>cb(null),saveLocal(){},mergeState:s=>s,toast(){},renderHome(){},G:null,go(){},document:{getElementById:()=>ui}});
  vm.runInContext(cloud,c);let opened=false;c.opened=()=>opened=true;vm.runInContext('bootRestore(opened)',c);
  assert(opened,'local game blocked on network');assert.equal(c.S.total,3);
  await e.advance(11200);assert.equal(c.cloud.state,'saving','11-second response incorrectly discarded');
  e.respond(async()=>({ok:true}));release({ok:true,state:{total:8,ts:2}});await flush();
  assert.equal(c.S.total,8,'cloud progress lost');assert(c.cloud.ready);assert(e.requests.some(r=>r.opts.method==='POST'));
  console.log('PASS',name,'local-first launch, slow response, restore and save');
 }
 // An actual timeout aborts, then the next attempt can succeed.
 let e=environment();e.respond((url,opts)=>new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('aborted')))));
 let pending=e.context.CeciliaCloud.load('cecilia_test');let rejected=pending.then(()=>false,()=>true);await e.advance(30000);assert(await rejected);assert.equal(e.timers.size,0);
 e.respond(async()=>({ok:true,state:{total:5}}));assert.equal((await e.context.CeciliaCloud.load('cecilia_test')).state.total,5);
 console.log('PASS timeout abort, timer cleanup and successful retry');
 // Configuration changes do not need a game reload; stale responses are ignored.
 e=environment();let release;e.respond(()=>new Promise(resolve=>release=resolve));pending=e.context.CeciliaCloud.load('cecilia_test');rejected=pending.then(()=>false,err=>err.code==='changed');e.configure('https://script.google.com/macros/s/new/exec','new-test-key');release({ok:true,state:{total:999}});assert(await rejected);
 e.respond(async()=>({ok:true}));await e.context.CeciliaCloud.save('cecilia_test',{total:7},false);const body=JSON.parse(e.requests.at(-1).opts.body);assert(!('key' in body),'Client unexpectedly sends a family key');assert.equal(body.force,false);assert(e.requests.at(-1).url.includes('/new/exec'));
 let reconnect=0;e.context.CeciliaCloud.onReconnect(()=>reconnect++);e.event('online');e.event('cecilia-cloud-change');assert.equal(reconnect,2);
 console.log('PASS keyless requests, stale reply rejection and automatic reconnect');
 // Auth and a wrong deployment must not be reported as successful saves.
 e=environment();e.respond(async()=>({ok:false,error:'key'}));await assert.rejects(e.context.CeciliaCloud.load('x'),err=>err.permanent&&err.message==='Save server rejected request');
 e.respond(async()=>({html:true}));await assert.rejects(e.context.CeciliaCloud.load('x'),err=>err.code==='deployment');
 console.log('PASS server rejection and HTML deployment remain unsynced');
 // Math and World keep the original server protocol and their isolated save envelopes.
 e=environment();let c=e.context;c.mathEnvelope=payload=>({lv:{en:1,fr:1,ar:1},math:payload});c.MATH_PROFILE='cecilia_math_quest';let source=fs.readFileSync(__dirname+'/../math-quest/index.html','utf8');let fn=source.slice(source.indexOf('async function requestMath('),source.indexOf('async function cloudPushMath()'));vm.runInContext(fn,c);
 e.respond(async(url,opts)=>opts.method==='POST'?{ok:true}:{ok:true,state:{math:{solved:9}}});await c.requestMath('save',{solved:9});assert.equal(JSON.parse(e.requests.at(-1).opts.body).state.math.solved,9);assert.equal((await c.requestMath('load')).state.solved,9);
 c.envelope=()=>({lv:{en:1,fr:1,ar:1},world:{items:[{id:'existing'}]}});source=fs.readFileSync(__dirname+'/../little-world/index.html','utf8');fn=source.split('\n').find(l=>l.startsWith('async function request(action'));vm.runInContext(fn,c);await c.request('save');assert.equal(JSON.parse(e.requests.at(-1).opts.body).state.world.items[0].id,'existing');
 console.log('PASS Math and World request schemas and preserved state');
}
test().catch(e=>{console.error(e);process.exitCode=1});

/* Shared coin account test (run: node tests/wallet.cjs).
 * Runs shared/cecilia.js on two pretend iPads against the real backend code, in memory. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const BACKEND=process.env.BACKEND||__dirname+'/../backend/Cecilia_Auto_Account_CodeGS.txt';
function server(){
 const sheets={},props={WALLET_SHEET_ID:'test'};
 const book={getUrl:()=>'',getSheetByName:n=>sheets[n],insertSheet(n){return sheets[n]={rows:[],appendRow(r){this.rows.push(r);return this},getLastRow(){return this.rows.length},getDataRange(){return {getValues:()=>this.rows.map(r=>[...r])}},getRange(r){return {setValues:vs=>vs.forEach((v,i)=>this.rows[r+i-1]=v)}}}}};
 const ctx=vm.createContext({console:{log(){},error(){}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>props[k]=v})},SpreadsheetApp:{openById:()=>book,create:()=>book,flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>true,waitLock(){},releaseLock(){}})},ContentService:{createTextOutput:s=>({setMimeType:()=>s}),MimeType:{JSON:'json'}}});
 vm.runInContext(fs.readFileSync(BACKEND,'utf8'),ctx);ctx.setupCeciliaAccount();return ctx;
}
const S=server();
function device(initial){
 const disk=Object.assign({},initial||{}),requests=[];let online=true;
 function XHR(){this.readyState=0}
 XHR.prototype.open=function(m,u){this.m=m;this.u=u};
 XHR.prototype.getResponseHeader=function(){return 'application/json'};
 XHR.prototype.abort=function(){};
 XHR.prototype.send=function(body){const x=this;requests.push({m:x.m,u:x.u,body});setTimeout(function(){
  if(!online){x.status=0}else{x.status=200;const q=new URL(x.u).searchParams;x.responseText=x.m==='POST'?S.doPost({postData:{contents:body}}):S.doGet({parameter:Object.fromEntries(q)})}
  x.readyState=4;x.onreadystatechange()},1)};
 const noop=()=>{},el={style:{},appendChild:noop,insertBefore:noop,addEventListener:noop,getAttribute:()=>null,className:''};
 const ctx={console,JSON,Math,Date,Number,Object,Array,String,RegExp,Error,Promise,setTimeout,clearTimeout,encodeURIComponent,XMLHttpRequest:XHR,
  navigator:{},location:{href:'https://fady-gendi.github.io/Cecilia-Games/word-garden/'},
  localStorage:{getItem:k=>k in disk?disk[k]:null,setItem:(k,v)=>{disk[k]=String(v)},removeItem:k=>{delete disk[k]}},
  document:{readyState:'loading',currentScript:{src:'https://fady-gendi.github.io/Cecilia-Games/shared/cecilia.js?v=31'},getElementById:()=>null,getElementsByTagName:()=>[el],createElement:()=>Object.assign({},el),addEventListener:noop,body:null}};
 ctx.window=ctx;ctx.addEventListener=noop;vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../shared/cecilia.js','utf8'),ctx);
 return {W:ctx.CeciliaWallet,C:ctx.CeciliaCloud,G:ctx.CeciliaGames,disk,requests,offline:v=>online=!v};
}
(async()=>{
 const a=device({wordgarden_v1:JSON.stringify({coins:100})});await a.W.sync();assert.equal(a.W.balance(),100);assert.equal(a.W.status(),'Cloud synced ✓');
 const b=device({wordgarden_v1:JSON.stringify({coins:100})});await b.W.sync();assert.equal(b.W.balance(),100,'old coins imported once across two iPads');
 console.log('PASS old game coins are imported once, even from two iPads');
 const n=a.requests.length;await a.W.sync(false);assert.equal(a.requests.length,n);console.log('PASS a recent sync is reused without a new request');
 a.W.award(15,'wg','Answer','wg:answer:one');await a.W.sync();await b.W.sync();assert.equal(b.W.balance(),115);
 assert(b.W.spend(30,'littleworld','Cake','adv:item:cake',{type:'adv',item:'cake'}));await b.W.sync();await a.W.sync();assert.equal(a.W.balance(),85);
 assert.equal(a.W.purchases('littleworld').length,1,'purchase made on iPad B is known on iPad A');
 a.W.award(15,'wg','Answer','wg:answer:one');await a.W.sync();assert.equal(a.W.balance(),85,'same answer id never pays twice');
 console.log('PASS learning coins, shared spending, purchase restore, no double pay');
 assert(a.W.spend(80,'littleworld','Boat','adv:item:boat',{type:'adv',item:'boat'}));await a.W.sync();assert.equal(a.W.balance(),5);
 assert(b.W.spend(30,'littleworld','Old','adv:item:stale',{type:'adv',item:'stale'}));await b.W.sync();assert.equal(b.W.balance(),5);
 assert.equal(b.W.purchases('littleworld').find(e=>e.id==='adv:item:stale').status,'rejected');
 console.log('PASS spending more than the shared balance is refused and given back');
 assert.equal(a.W.spend(999,'littleworld','Too much','adv:item:x',{}),false,'cannot spend coins she does not have');
 const c=device({});c.offline(true);c.W.award(10,'math','Answer','math:answer:offline');await c.W.sync();assert.equal(c.W.balance(),10,'offline coins show at once');
 c.offline(false);await c.W.sync();assert.equal(c.W.balance(),15,'offline coins reach the cloud later');
 console.log('PASS offline coins are kept and sent later');
 for(const g of c.G.list.filter(g=>g.profile)){
  const st={ts:100,total:7,lv:{en:2,fr:1,ar:1},solved:{en:3,fr:0,ar:0}};const r=await c.C.save(g.profile,st);assert(r.ok,g.profile);
  const back=await c.C.load(g.profile);assert.equal(back.state.total,7);
 }
 console.log('PASS every game in the registry can save and load its progress');
 const sum=c.G.summarize(c.G.get('wg'),{ts:1,total:12,stars:3,lv:{en:2,fr:1,ar:3},solved:{en:4,fr:0,ar:1},target:{en:12,fr:10,ar:11}});
 assert.equal(sum.langs.ar.level,3);assert.equal(sum.total,12);
 assert.equal(c.G.summarize(c.G.get('rk'),{game:'rainbow',done:{'1-1':1,'1-5':1}}).stars,1);
 console.log('PASS progress summaries for the parent page');
})().catch(e=>{console.error(e);process.exitCode=1});

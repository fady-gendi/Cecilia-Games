const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto').webcrypto;
const sheets={},props={WALLET_SHEET_ID:'test'};
const book={getUrl:()=>'',getSheetByName:n=>sheets[n],insertSheet(n){return sheets[n]={rows:[],appendRow(r){this.rows.push(r);return this},getLastRow(){return this.rows.length},getDataRange(){return {getValues:()=>this.rows.map(r=>[...r])}},getRange(r,c,n,m){return {setValues:vs=>vs.forEach((v,i)=>this.rows[r+i-1]=v)}}}}};
const server=vm.createContext({console:{log(){},error(){}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>props[k]=v})},SpreadsheetApp:{openById:()=>book,flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>true,waitLock(){},releaseLock(){}})},ContentService:{createTextOutput:s=>({setMimeType:()=>JSON.parse(s)}),MimeType:{JSON:'json'}}});
vm.runInContext(fs.readFileSync(__dirname+'/../backend/Cecilia_Auto_Account_CodeGS.txt','utf8'),server);server.setupCeciliaAccount();
function device(initial={}){
 const disk={...initial},events={},requests=[];let beaconPromise=Promise.resolve();
 const context={console,URL,AbortController,Blob,navigator:{sendBeacon(url,blob){beaconPromise=blob.text().then(contents=>server.doPost({postData:{contents}}));return true}},JSON,Math,Date,Number,Object,Array,String,crypto,document:{readyState:'loading',currentScript:{src:'https://fady-gendi.github.io/Cecilia-Games/shared/wallet.js'},getElementById(){return null},addEventListener(){}},window:{crypto,addEventListener:(n,fn)=>events[n]=fn},localStorage:{getItem:k=>disk[k]||null,setItem:(k,v)=>disk[k]=String(v)},setTimeout:()=>1,clearTimeout(){},fetch:async(url,opts)=>{assert(url.includes('AKfycby55_leS-'));const q=JSON.parse(opts.body);assert(!('key' in q));requests.push(q);const j=server.doPost({postData:{contents:opts.body}});return {headers:{get:()=> 'application/json'},json:async()=>j}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../shared/wallet.js','utf8'),context);return {W:context.window.CeciliaWallet,disk,requests,beacon:()=>beaconPromise};
}
(async()=>{
 const oldConfig=JSON.stringify({url:'https://script.google.com/macros/s/WRONG/exec'});
 const a=device({wordgarden_v1:JSON.stringify({coins:100}),cecilia_global_wallet_config:oldConfig});assert(a.W.configured());await a.W.sync();assert.equal(a.W.balance(),100);assert.equal(a.W.status(),'Cloud synced ✓');
 const b=device({wordgarden_v1:JSON.stringify({coins:100})});await b.W.sync();assert.equal(b.W.balance(),100);assert.equal(a.requests[0].events[0].kind,'migration');
 const count=a.requests.length;await a.W.sync(false);assert.equal(a.requests.length,count);console.log('PASS recent empty sync uses cached balance');
 console.log('PASS no setup, stale configuration ignored, existing coins imported once across two devices');
 a.W.award(15,'wg','Answer','wg:answer:one');await a.W.sync();await b.W.sync();assert.equal(b.W.balance(),115);
 assert(b.W.spend(30,'littleworld','Plant','world:plant:one',{type:'decoration',kind:'plant',room:'home',x:30,y:80}));await b.W.sync();await a.W.sync();assert.equal(a.W.balance(),85);assert.equal(a.W.purchases('littleworld').length,1);
 a.W.award(15,'wg','Answer','wg:answer:one');await a.W.sync();assert.equal(a.W.balance(),85);
 console.log('PASS learning credit, shared spending, purchase restore and retry deduplication');
 assert(a.W.spend(80,'littleworld','Decorations','world:purchase:two',{}));await a.W.sync();assert.equal(a.W.balance(),5);
 assert(b.W.spend(30,'littleworld','Plant','world:stale:purchase',{}));await b.W.sync();assert.equal(b.W.balance(),5);assert.equal(b.W.purchases('littleworld').find(e=>e.id==='world:stale:purchase').status,'rejected');
 console.log('PASS stale-device overspending rejected and refunded');
 const previous=JSON.parse(a.disk.cecilia_global_wallet_v1);previous.snapshot.url='https://old.example/exec';const c=device({cecilia_global_wallet_v1:JSON.stringify(previous)});await c.W.sync();assert.equal(c.W.balance(),5);
 console.log('PASS previous server snapshot migrates without losing queued entries or duplicating money');
 // Save/read all supported game profiles without credentials.
 for(const profile of ['cecilia','cecilia_sentences','cecilia_match','cecilia_math_quest','cecilia_little_world']){
  const state={ts:100,total:7,lv:{en:2,fr:1,ar:1},solved:{en:7,fr:0,ar:0},math:{solved:7},world:{items:[{id:'plant'}]}};
  assert(server.doPost({postData:{contents:JSON.stringify({action:'save',p:profile,state})}}).ok);
  const res=server.doGet({parameter:{action:'load',p:profile}});assert.equal(res.state.total,7);
 }
 console.log('PASS all five progress profiles save and restore without a family key');a.W.award(3,'math','Answer','math:beacon:test');a.W.flush();await a.beacon();await a.W.sync();assert.equal(a.W.balance(),8);console.log('PASS queued coin events flush on exit and retry without duplication');
})().catch(e=>{console.error(e);process.exitCode=1});

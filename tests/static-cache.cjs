const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const baseline=JSON.parse(fs.readFileSync(__dirname+'/performance-baseline.json','utf8'));
const callbacks={},stores=new Map(),pending=[],network=[];let online=true;
function store(name){if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return {match:async k=>data.get(k)?.clone(),put:async(k,r)=>data.set(k,r)}}
const ctx={URL,Request,Response,console,caches:{open:async n=>store(n),keys:async()=>[...stores.keys()],delete:async n=>stores.delete(n)},self:{location:{href:'https://fady-gendi.github.io/Cecilia-Games/sw.js'},skipWaiting:async()=>{},clients:{claim:async()=>{}},addEventListener:(n,fn)=>callbacks[n]=fn},fetch:async r=>{network.push(r.url||r);if(!online)throw Error('offline');return new Response('page-'+network.length,{status:200})}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../sw.js','utf8'),ctx);
const waitUntil=p=>pending.push(p);
async function drain(){while(pending.length)await Promise.all(pending.splice(0))}
function request(url,method='GET'){let response;callbacks.fetch({request:new Request(url,{method}),waitUntil,respondWith:p=>response=p});return response}
(async()=>{
 stores.set('cecilia-games-static-v26',new Map());stores.set('some-other-site',new Map());callbacks.activate({waitUntil});await drain();assert(!stores.has('cecilia-games-static-v26'));assert(stores.has('some-other-site'));
 const url='https://fady-gendi.github.io/Cecilia-Games/math-quest/?v=v27';let r=await request(url);assert.equal(await r.text(),'page-1');await drain();
 r=await request(url);assert.equal(await r.text(),'page-1');await drain();
 online=false;r=await request(url);assert.equal(await r.text(),'page-2');await drain();
 console.log('PASS visited pages load from cache, refresh in background and work offline');online=true;const assetUrl='https://fady-gendi.github.io/Cecilia-Games/shared/trophy-photos.js?v=v27';await request(assetUrl);await drain();const count=network.length;await request(assetUrl);await drain();assert.equal(network.length,count);console.log('PASS shared photo asset is reused without repeated background downloads');
 assert.equal(request('https://script.google.com/macros/s/test/exec?action=load'),undefined);
 assert.equal(request(url,'POST'),undefined);
 assert.equal(request('https://fady-gendi.github.io/Cecilia-Games/math-quest/?v=v28'),undefined);
 assert.equal(request('https://fady-gendi.github.io/Another-Repo/'),undefined);
 assert.equal(request('https://fady-gendi.github.io/Cecilia-Games/sw.js'),undefined);
 console.log('PASS cloud APIs, writes, future releases and other repositories bypass static cache');
 for(const game of ['word-garden','sentence-stars','word-match']){
  const before=baseline[game].beforeBytes,after=fs.readFileSync(__dirname+'/../'+game+'/index.html','utf8');
  assert(!/<script[^>]+src=/.test(after),'Blocking script request remains');assert(Buffer.byteLength(after)<before*.11,'Language page too large');
  const asset=fs.readFileSync(__dirname+'/../shared/trophy-photos.js','utf8');
  const photos=JSON.parse(asset.slice(asset.indexOf('=')+1).trim().slice(0,-1));assert.equal(photos.length,35);assert.equal(crypto.createHash('sha256').update(JSON.stringify(photos)).digest('hex'),baseline.photosSha256,'Trophy photos changed');
 }
 console.log('PASS language pages at least 89% smaller, zero external startup scripts, all 35 photos preserved');
})().catch(e=>{console.error(e);process.exitCode=1});

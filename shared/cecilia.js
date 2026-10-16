/* Cecilia's Games shared runtime v3.1
 * ONE file every game loads:  <script src="../shared/cecilia.js?v=31"></script>
 * Provides: CeciliaGames (registry), CeciliaWallet (shared coins), CeciliaCloud (cloud saves),
 *           CeciliaUI (top bar, coin animation, toast, read-aloud, sounds), CeciliaPerformance.
 * RULE: ES5 only (no let/const/arrow/async/template strings). It must run on a 2012-2013 iPad (iOS 9 Safari).
 * Run `node tests/es5-check.cjs` after editing.
 */
(function(){'use strict';

/* ---------- 1. Small polyfills for old Safari ---------- */
if(!Number.isSafeInteger){Number.isSafeInteger=function(n){return typeof n==='number'&&isFinite(n)&&Math.floor(n)===n&&Math.abs(n)<=9007199254740991}}
if(!Number.isInteger){Number.isInteger=function(n){return typeof n==='number'&&isFinite(n)&&Math.floor(n)===n}}
if(!Object.values){Object.values=function(o){var r=[],k;for(k in o)if(Object.prototype.hasOwnProperty.call(o,k))r.push(o[k]);return r}}
if(!Object.entries){Object.entries=function(o){var r=[],k;for(k in o)if(Object.prototype.hasOwnProperty.call(o,k))r.push([k,o[k]]);return r}}
if(!Array.from){Array.from=function(a,fn){var r=[],i;if(a&&typeof a.forEach==='function'&&a.length===undefined){a.forEach(function(v){r.push(v)})}else for(i=0;i<(a?a.length:0);i++)r.push(a[i]);return fn?r.map(fn):r}}
if(!Object.keys){Object.keys=function(o){var r=[],k;for(k in o)if(Object.prototype.hasOwnProperty.call(o,k))r.push(k);return r}}
if(!Object.assign){Object.assign=function(t){for(var i=1;i<arguments.length;i++){var s=arguments[i],k;if(s)for(k in s)if(Object.prototype.hasOwnProperty.call(s,k))t[k]=s[k]}return t}}
if(!Array.prototype.find){Array.prototype.find=function(fn,self){for(var i=0;i<this.length;i++)if(fn.call(self,this[i],i,this))return this[i]}}
if(!Array.prototype.findIndex){Array.prototype.findIndex=function(fn,self){for(var i=0;i<this.length;i++)if(fn.call(self,this[i],i,this))return i;return -1}}
if(!Array.prototype.includes){Array.prototype.includes=function(v){return this.indexOf(v)>=0}}
if(!String.prototype.includes){String.prototype.includes=function(v){return this.indexOf(v)>=0}}
if(!String.prototype.startsWith){String.prototype.startsWith=function(v){return this.slice(0,v.length)===v}}
if(!String.prototype.endsWith){String.prototype.endsWith=function(v){return this.slice(-v.length)===v}}
if(!window.Promise){(function(){
 /* Minimal Promise (iOS 7 and older). Enough for then/catch/resolve/reject/all. */
 function P(fn){var self=this;self._s=0;self._v=undefined;self._q=[];
  function settle(s,v){if(self._s)return;if(s===1&&v&&typeof v.then==='function'){v.then(function(x){self._s=0;settle(1,x)},function(x){self._s=0;settle(2,x)});self._s=3;return}self._s=s;self._v=v;setTimeout(run,0)}
  function run(){var q=self._q;self._q=[];for(var i=0;i<q.length;i++)q[i]()}
  self._run=run;try{fn(function(v){settle(1,v)},function(v){settle(2,v)})}catch(e){settle(2,e)}}
 P.prototype.then=function(a,b){var self=this;return new P(function(res,rej){self._q.push(function(){var cb=self._s===1?a:b;if(typeof cb!=='function'){(self._s===1?res:rej)(self._v);return}try{res(cb(self._v))}catch(e){rej(e)}});if(self._s===1||self._s===2)setTimeout(self._run,0)})};
 P.prototype['catch']=function(b){return this.then(null,b)};
 P.resolve=function(v){return new P(function(r){r(v)})};P.reject=function(v){return new P(function(r,j){j(v)})};
 P.all=function(a){return new P(function(res,rej){var out=[],n=a.length;if(!n){res(out);return}a.forEach(function(p,i){P.resolve(p).then(function(v){out[i]=v;if(--n===0)res(out)},rej)})})};
 window.Promise=P;
})()}

/* ---------- 2. Where the site lives ---------- */
var ROOT=(function(){
 var s=document.currentScript,all,i,src,at;
 if(!s||!s.src){all=document.getElementsByTagName('script');for(i=0;i<all.length;i++)if(/shared\/cecilia\.js/.test(all[i].src))s=all[i]}
 src=s&&s.src||'';at=src.indexOf('shared/cecilia.js');
 if(at>0)return src.slice(0,at);
 return location.href.replace(/[?#].*$/,'').replace(/[^\/]*$/,'');
})();
var VERSION='3.1';

/* ---------- 3. The games registry (hub, top bar, coin panel and parent page all read this) ---------- */
/* kind: 'learn' = earns coins, 'adventure' = spends coins, 'play' = free play.
 * source = wallet source id, profile = cloud save profile, key = localStorage key of the game's own save.
 * NOTE: Rainbow Kingdom keeps the ids 'littleworld' / 'cecilia_little_world' because the deployed server knows them. */
var GAMES=[
 {id:'wg',folder:'word-garden',title:'Word Garden',icon:'🌻',color:'#3cb371',bg:'#e3f6d8',kind:'learn',source:'wg',profile:'cecilia',key:'wordgarden_v1',cookie:'wg1',units:'words',langs:['en','fr','ar'],desc:'Guess hidden words in English, French and Arabic'},
 {id:'ss',folder:'sentence-stars',title:'Sentence Stars',icon:'⭐',color:'#8e6bff',bg:'#ece6ff',kind:'learn',source:'ss',profile:'cecilia_sentences',key:'sentencestars_v1',cookie:'ss1',units:'sentences',langs:['en','fr','ar'],desc:'Read a sentence and pick the right answer'},
 {id:'wm',folder:'word-match',title:'Word Match',icon:'🔤',color:'#ff9f43',bg:'#ffefd9',kind:'learn',source:'wm',profile:'cecilia_match',key:'wordmatch_v1',cookie:'wm1',units:'puzzles',langs:['en','fr','ar'],desc:'Drag each word onto its picture'},
 {id:'math',folder:'math-quest',title:'Math Quest',icon:'🚀',color:'#ee65a1',bg:'#ffe3ef',kind:'learn',source:'math',profile:'cecilia_math_quest',key:'cecilia_math_quest_age7_v2',langs:[],desc:'Number worlds, puzzles and trophies'},
 {id:'rk',folder:'rainbow-kingdom',title:'Rainbow Kingdom',icon:'🌈',color:'#f0559b',bg:'#fff0d9',kind:'adventure',source:'littleworld',profile:'cecilia_little_world',key:'rainbow_kingdom_v1',langs:[],desc:'Bring back the colors! Use your coins on a big adventure'},
 {id:'fs',folder:'fashion-studio',title:'Fashion Studio',icon:'🎀',color:'#d4508f',bg:'#ffe1ef',kind:'play',source:null,profile:null,key:'littleFashionStudio.v1',langs:[],desc:'Dress Bella, design clothes and take pictures'}
];
/* Turn any game's save into the same progress summary (used by the hub and the parent page).
 * New games get this for free if their save has the standard fields: ts, total, stars, lv:{en,fr,ar}, solved:{en,fr,ar}. */
var LANG_NAMES={en:'English',fr:'French',ar:'Arabic'};
function summarize(g,s){
 if(!g||!s||typeof s!=='object')return null;
 var r={game:g.id,ts:Number(s.ts)||0,total:0,stars:0,level:null,langs:{},lines:[]},k;
 if(g.id==='math'){var m=s.math||s,best=m.best||{},done=0,st=0;for(k in best){st+=Number(best[k])||0;if(best[k]>=1)done++}
  r.total=Number(m.solved)||0;r.stars=st;r.ts=Number(m.ts||s.ts)||r.ts;r.lines.push(done+' of 36 levels done',r.total+' problems solved',st+' stars');return r}
 if(g.id==='rk'){var n=0;for(k in s.done||{})if(s.done[k])n++;var gems=0;for(var i=1;i<=8;i++)if(s.done&&s.done[i+'-5'])gems++;
  r.total=n;r.stars=gems;r.level=s.cur&&s.cur.id||null;r.lines.push(n+' of 40 levels done',gems+' of 8 gems');if(s.cur&&s.cur.id)r.lines.push('Playing level '+s.cur.id);return r}
 r.total=Number(s.total)||0;r.stars=Number(s.stars)||0;
 if(s.lv)for(k in LANG_NAMES)if(s.lv[k]!==undefined){r.langs[k]={level:Number(s.lv[k])||1,solved:s.solved?Number(s.solved[k])||0:0,target:s.target?Number(s.target[k])||0:0}}
 r.lines.push(r.total+' '+(g.units||'answers')+' solved',r.stars+' stars');
 if(s.best)r.lines.push('Best streak '+s.best);
 return r;
}
function localSave(g){
 var s=null;try{s=JSON.parse(lsGet(g.key))}catch(e){}
 if(!s&&g.cookie){try{var m=document.cookie.match(new RegExp('(?:^|;\\s*)'+g.cookie+'=([^;]*)'));if(m)s=JSON.parse(decodeURIComponent(escape(atob(m[1]))))}catch(e){s=null}}
 return s;
}
function game(id){for(var i=0;i<GAMES.length;i++)if(GAMES[i].id===id||GAMES[i].folder===id||GAMES[i].source===id)return GAMES[i];return null}
function url(g){return ROOT+g.folder+'/'}
window.CeciliaGames={list:GAMES,get:game,url:url,root:ROOT,version:VERSION,summarize:summarize,localSave:localSave,langNames:LANG_NAMES,
 learn:function(){return GAMES.filter(function(g){return g.kind==='learn'})},
 /* Standard coin rules, used by every learning game (see README "Coin rules"). */
 coins:{correct:10,perfect:5,streak5:10,level:30,perfectLevel:20,hint:-5}};

/* ---------- 4. Storage + network helpers ---------- */
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}}
function now(){return new Date().getTime()}
function uid(){try{if(window.crypto&&crypto.getRandomValues){var a=new Uint32Array(3);crypto.getRandomValues(a);return now().toString(36)+'-'+a[0].toString(36)+a[1].toString(36)+a[2].toString(36)}}catch(e){}return now().toString(36)+'-'+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)}
function fail(code,message,permanent){var e=new Error(message);e.code=code;e.permanent=!!permanent;return e}
/* XMLHttpRequest works on every iPad; fetch/AbortController do not. */
function http(method,address,body,ms){
 return new Promise(function(resolve,reject){
  var x,done=false,timer;
  function finish(err,val){if(done)return;done=true;clearTimeout(timer);if(err)reject(err);else resolve(val)}
  try{x=new XMLHttpRequest();x.open(method,address,true)}catch(e){finish(fail('network','Connection unavailable'));return}
  timer=setTimeout(function(){try{x.abort()}catch(e){}finish(fail('timeout','Connection timed out'))},ms||30000);
  x.onreadystatechange=function(){
   if(x.readyState!==4||done)return;
   if(!x.status){finish(fail('network','Offline'));return}
   if(x.status<200||x.status>=300){finish(fail('network','Server unavailable'));return}
   var type=x.getResponseHeader&&x.getResponseHeader('content-type')||'';
   if(/text\/html/i.test(type)){finish(fail('deployment','Account server unavailable. Progress remains saved here.',true));return}
   var data;try{data=JSON.parse(x.responseText)}catch(e){finish(fail('deployment','Account server returned an unexpected response. Progress remains saved here.',true));return}
   finish(null,data);
  };
  try{if(body!==undefined)x.send(body);else x.send()}catch(e){finish(fail('network','Offline'))}
 });
}

/* ---------- 5. CeciliaWallet: one coin account for every game ---------- */
var ENDPOINT='https://script.google.com/macros/s/AKfycby55_leS-jc2dogE6dF13eEtM9VmghYhcyOq06t_yRI-2rYByh-2SJcvUe1IIYkmwxrYQ/exec';
var KEY='cecilia_global_wallet_v1',SOURCES=['wg','ss','wm','math','littleworld','parent'],busy=false,timer=null,listeners=[],earnListeners=[],state,status='Connecting…';
GAMES.forEach(function(g){if(g.source&&SOURCES.indexOf(g.source)<0)SOURCES.push(g.source)});
function values(o){return Object.values(o||{})}
function read(){try{var s=JSON.parse(lsGet(KEY));if(s&&s.v===1&&s.entries)return s}catch(e){}return {v:1,account:'cecilia',entries:{},snapshot:null}}
state=read();
if(state.snapshot&&state.snapshot.url!==ENDPOINT){state.snapshot=null;values(state.entries).forEach(function(e){if(e.status==='confirmed')e.status='pending'});lsSet(KEY,JSON.stringify(state))}
function effective(e){if(e.status==='rejected'||e.status==='confirmed')return 0;if(e.kind==='migration'&&state.snapshot)return Math.max(0,e.delta-(state.snapshot.migrations[e.source]||0));return e.delta}
function cloudSnap(){return state.snapshot&&state.snapshot.url===ENDPOINT}
function balance(){
 var list=values(state.entries),n=0,i;
 if(cloudSnap()){n=state.snapshot.balance;for(i=0;i<list.length;i++)n+=effective(list[i])}
 else for(i=0;i<list.length;i++)n+=list[i].status==='rejected'?0:list[i].delta;
 return Math.max(0,n);
}
function notify(){
 for(var i=0;i<listeners.length;i++){try{listeners[i]()}catch(e){if(window.console)console.error(e)}}
 UI.updateCoins();
}
function write(){
 try{var disk=read();Object.keys(disk.entries).forEach(function(id){if(!state.entries[id])state.entries[id]=disk.entries[id]});if(!lsSet(KEY,JSON.stringify(state)))status='Storage unavailable'}catch(e){status='Storage unavailable'}
 notify();
}
function schedule(){clearTimeout(timer);timer=setTimeout(function(){sync(false)},state.snapshot?4000:250)}
function importCoins(source,n,alreadyShared){
 if(SOURCES.indexOf(source)<0)return;state=read();
 var id='migration:'+source,old=state.entries[id];n=Math.max(0,Math.floor(Number(n)||0));
 if(alreadyShared||(old&&old.delta>=n))return;
 state.entries[id]={id:id,source:source,kind:'migration',delta:Math.max(n,old?old.delta:0),reason:'Existing '+source+' coins',created:old?old.created:now(),status:'pending',meta:{}};
 write();schedule();
}
function add(delta,source,reason,id,meta,kind){
 state=read();id=id||source+':'+uid();
 if(state.entries[id])return state.entries[id].status!=='rejected'?id:false;
 if(!Number.isSafeInteger(delta)||Math.abs(delta)>1000000||!(SOURCES.indexOf(source)>=0||/^[a-z][a-z0-9]{1,19}$/.test(source)))return false;
 if(delta<0&&balance()<-delta)return false;
 state.entries[id]={id:id,source:source,kind:kind||(delta<0?'spend':'earn'),delta:delta,reason:reason,meta:meta||{},created:now(),status:'pending'};
 write();schedule();
 for(var i=0;i<earnListeners.length;i++){try{earnListeners[i](delta,source,reason)}catch(e){}}
 UI.coinFx(delta);
 return id;
}
function award(n,source,reason,id){return add(Math.max(0,Math.floor(n)),source,reason,id,null,source==='parent'?'parent':'earn')}
function spend(n,source,reason,id,meta){return add(-Math.abs(Math.floor(n)),source,reason,id,meta,'spend')}
function records(){return values(state.entries).sort(function(a,b){return b.created-a.created})}
function pendingList(){return records().filter(function(e){return e.status==='pending'}).sort(function(a,b){return a.created-b.created}).slice(0,80)}
function purchases(source){
 var all={},out=[],k;
 if(state.snapshot)(state.snapshot.grants||[]).forEach(function(e){if(e.source===source)all[e.id]=e});
 records().forEach(function(e){if(e.source===source&&e.kind==='spend')all[e.id]=e});
 for(k in all)out.push(all[k]);return out;
}
/* Coins earned per source on THIS device (the server only returns the total). */
function earnedBySource(){var r={};records().forEach(function(e){if(e.delta>0&&e.status!=='rejected'){r[e.source]=(r[e.source]||0)+e.delta}});return r}
function request(events){return http('POST',ENDPOINT,JSON.stringify({action:'wallet.sync',account:'cecilia',events:events}))}
function sync(force){
 if(busy)return Promise.resolve();
 if(force===false){state=read();if(cloudSnap()&&now()-state.snapshot.at<15000&&!pendingList().length){status='Cloud synced ✓';notify();return Promise.resolve()}}
 busy=true;status='Syncing…';notify();state=read();
 return request(pendingList()).then(function(res){
  if(!res||!res.ok)throw fail('server',res&&res.error||'Account sync failed',true);
  if(!Number.isSafeInteger(res.balance)||res.balance<0||!(res.results instanceof Array))throw fail('server','Unexpected account response',true);
  state=read();
  res.results.forEach(function(r){var e=state.entries[r.id];if(e){e.status=r.ok?'confirmed':'rejected';e.error=r.error||'';if(e.kind==='migration'&&r.creditedTotal!==undefined)e.delta=r.creditedTotal}});
  state.snapshot={url:ENDPOINT,balance:res.balance,migrations:res.migrations||{},grants:res.grants||[],at:now()};
  status='Cloud synced ✓';busy=false;write();
  if(pendingList().length)schedule();
 })['catch'](function(e){
  busy=false;status=e.permanent?e.message:'Connection timed out or offline · saved here';notify();clearTimeout(timer);
  if(!e.permanent)timer=setTimeout(sync,20000);
 });
}
function flush(){
 try{var events=pendingList(),body;if(!events.length||!navigator.sendBeacon)return;
  do{body=JSON.stringify({action:'wallet.sync',account:'cecilia',events:events});if(body.length<60000)break;events.pop()}while(events.length);
  if(events.length)navigator.sendBeacon(ENDPOINT,new Blob([body],{type:'text/plain'}));
 }catch(e){/* Pending events stay on the device and retry later. */}
}
window.CeciliaWallet={balance:balance,award:award,spend:spend,importCoins:importCoins,purchases:purchases,records:records,earned:earnedBySource,
 onChange:function(fn){listeners.push(fn);try{fn()}catch(e){}},onEarn:function(fn){earnListeners.push(fn)},
 sync:sync,flush:flush,configured:function(){return true},saveURL:function(){return ENDPOINT},status:function(){return status},
 uid:uid,root:ROOT,mount:function(){UI.mountBar()},sources:SOURCES};

/* ---------- 6. CeciliaCloud: each game's progress save ---------- */
var cloudListeners=[],lastAttempt=0;
function cloudRequest(action,profile,st,force){
 var p=action==='load'?http('GET',ENDPOINT+'?action=load&p='+encodeURIComponent(profile)+'&t='+now()):http('POST',ENDPOINT,JSON.stringify({action:'save',p:profile,state:st,force:!!force}));
 return p.then(function(data){
  if(!data||typeof data.ok!=='boolean')throw fail('deployment','Unexpected save response',true);
  if(!data.ok&&data.error!=='older')throw fail(data.error||'server','Save server rejected request',true);
  return data;
 });
}
function resume(force){if(!force&&now()-lastAttempt<30000)return;lastAttempt=now();cloudListeners.forEach(function(fn){try{fn()}catch(e){}})}
window.CeciliaCloud={load:function(profile){return cloudRequest('load',profile)},
 /* coins per game from every device (needs backend v3.1; older backends answer 'unknown action') */
 history:function(){return http('GET',ENDPOINT+'?action=history&t='+now()).then(function(d){if(!d||!d.ok)throw fail('server',d&&d.error||'No history',true);return d})},save:function(profile,st,force){return cloudRequest('save',profile,st,force)},
 url:function(){return ENDPOINT},onReconnect:function(fn){cloudListeners.push(fn)},
 message:function(e){return e&&e.permanent?'☁️ '+e.message:'💾 Saved here · reconnecting'}};
window.addEventListener('online',function(){resume(true);sync()});
window.addEventListener('focus',function(){resume(false);state=read();notify();sync(false)});
window.addEventListener('cecilia-cloud-change',function(){resume(true)});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')resume(false);else flush()});
window.addEventListener('pagehide',flush);
window.addEventListener('storage',function(e){if(e.key===KEY){state=read();notify()}});

/* ---------- 7. Performance: shared photos + offline cache ---------- */
var photoWait=[],photoLoading=false;
function loadPhotos(done){
 if(window.CeciliaTrophyPhotos){done(window.CeciliaTrophyPhotos);return}
 photoWait.push(done);if(photoLoading)return;photoLoading=true;
 setTimeout(function(){var s=document.createElement('script');s.src=ROOT+'shared/trophy-photos.js?v=v27';s.async=true;
  s.onload=function(){photoLoading=false;var cbs=photoWait.splice(0);cbs.forEach(function(fn){fn(window.CeciliaTrophyPhotos||[])})};
  s.onerror=function(){photoLoading=false;photoWait=[]};document.getElementsByTagName('head')[0].appendChild(s)},150);
}
window.CeciliaPerformance={loadPhotos:loadPhotos};
function registerWorker(){
 try{if(!('serviceWorker' in navigator))return;
  navigator.serviceWorker.register(ROOT+'sw.js',{scope:ROOT}).then(function(){return navigator.serviceWorker.ready}).then(function(reg){if(reg.active)reg.active.postMessage({type:'CACHE_PAGE',url:location.href})})['catch'](function(){});
 }catch(e){}
}
if(document.readyState==='complete')registerWorker();else window.addEventListener('load',registerWorker);

/* ---------- 8. CeciliaUI: the same look in every game ---------- */
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
/* The coin is drawn with CSS so it looks the same on every iPad (old iPads cannot show the 🪙 emoji). */
var COIN='<i class="cg-c"></i>';
var shownCoins=null,audioCtx=null,muted=lsGet('cecilia_sound')==='off';
var UI={
 mountBar:function(opts){
  if(document.getElementById('cgBar')||!document.body)return;
  opts=opts||{};var b=document.body,g=game(opts.game||b.getAttribute('data-cg-game')||'');
  if(b.getAttribute('data-cg-bar')==='off')return;
  var title=opts.title||b.getAttribute('data-cg-title')||(g?g.title:'Cecilia’s Games'),icon=opts.icon||(g?g.icon:'🌈');
  var bar=el('div','cg-bar');bar.id='cgBar';
  var home=el('a','cg-home','🏠');home.href=ROOT;home.setAttribute('aria-label','All games');
  var t=el('div','cg-title','<span class="cg-ticon">'+icon+'</span> '+esc(title));
  var coins=el('button','cg-coins',COIN+' <b id="cgCoinN">0</b>');coins.id='cgCoins';coins.type='button';
  coins.onclick=function(){UI.coinsPanel()};
  if(b.getAttribute('data-cg-home')==='off')home.style.visibility='hidden';
  bar.appendChild(home);bar.appendChild(t);bar.appendChild(coins);
  b.insertBefore(bar,b.firstChild);
  var cls=' cg-with-bar';if(b.className.indexOf('cg-with-bar')<0)b.className+=cls;
  UI.updateCoins();
 },
 updateCoins:function(){
  var n=document.getElementById('cgCoinN'),v=balance();if(!n)return;
  n.textContent=v;
  if(shownCoins!==null&&v>shownCoins){var c=document.getElementById('cgCoins');if(c){c.className='cg-coins';void c.offsetWidth;c.className='cg-coins cg-pop'}}
  shownCoins=v;
 },
 /* Floating "+15 🪙" that flies into the coin counter. Same in every game. */
 coinFx:function(delta){
  if(!delta||!document.body)return;
  var f=el('div','cg-fly'+(delta<0?' cg-minus':''),(delta>0?'+':'−')+Math.abs(delta)+' '+COIN);document.body.appendChild(f);
  UI.sound(delta>0?'coin':'tap');
  setTimeout(function(){f.className+=' cg-go'},30);setTimeout(function(){if(f.parentNode)f.parentNode.removeChild(f)},1500);
 },
 toast:function(text,ms){
  var t=document.getElementById('cgToast');if(!t){t=el('div','cg-toast');t.id='cgToast';document.body.appendChild(t)}
  t.innerHTML=esc(text);t.className='cg-toast cg-on';clearTimeout(t._h);t._h=setTimeout(function(){t.className='cg-toast'},ms||2200);
 },
 modal:function(html,onClose){
  UI.close();var m=el('div','cg-modal');m.id='cgModal';var c=el('div','cg-mcard',html);m.appendChild(c);
  var x=el('button','cg-x','✖');x.type='button';x.setAttribute('aria-label','Close');x.onclick=function(){UI.close();if(onClose)onClose()};c.appendChild(x);
  m.onclick=function(e){if(e.target===m){UI.close();if(onClose)onClose()}};document.body.appendChild(m);return c;
 },
 close:function(){var m=document.getElementById('cgModal');if(m&&m.parentNode)m.parentNode.removeChild(m)},
 /* Where coins come from and where they go. Opened by tapping the coin counter. */
 coinsPanel:function(){
  var h='<div class="cg-big"><i class="cg-c cg-c-big"></i></div><h2>'+balance()+' coins</h2><p class="cg-sub">Learn to earn coins. Spend them in Rainbow Kingdom!</p><div class="cg-cards">';
  GAMES.forEach(function(g){if(g.kind==='learn')h+='<a class="cg-gcard" style="background:'+g.bg+'" href="'+url(g)+'"><span class="cg-gi">'+g.icon+'</span><b>'+esc(g.title)+'</b><small>Earn '+COIN+'</small></a>'});
  var rk=game('rk');h+='</div><a class="cg-btn cg-pink cg-wide" href="'+url(rk)+'">'+rk.icon+' Spend in '+esc(rk.title)+'</a>';
  h+='<p class="cg-small">'+esc(status)+' · <a href="'+ROOT+'parent/">Grown-ups</a></p>';
  UI.modal(h);UI.say(balance()+' coins. Learn to earn coins!');
 },
 /* Read text aloud (helps a young reader). lang: 'en' | 'fr' | 'ar'. */
 say:function(text,lang){
  try{if(muted||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;
   var clean=String(text).replace(/<[^>]*>/g,' ').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[☀-➿]|️|🪙/g,' ');
   speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(clean);u.lang=lang==='fr'?'fr-FR':(lang==='ar'?'ar-SA':'en-US');u.rate=.88;u.pitch=1.1;speechSynthesis.speak(u);
  }catch(e){}
 },
 sound:function(kind){
  if(muted)return;try{
   var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!audioCtx)audioCtx=new AC();
   var notes={coin:[988,1319],win:[523,659,784,1047],tap:[660],oops:[330,262],pop:[880]}[kind]||[660],t=audioCtx.currentTime;
   notes.forEach(function(f,i){var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.value=f;g.gain.value=0.0001;o.connect(g);g.connect(audioCtx.destination);
    var s=t+i*0.09;g.gain.setValueAtTime(0.0001,s);g.gain.linearRampToValueAtTime(0.18,s+0.02);g.gain.linearRampToValueAtTime(0.0001,s+0.2);
    if(o.start)o.start(s);else o.noteOn(s);if(o.stop)o.stop(s+0.22);else o.noteOff(s+0.22)});
  }catch(e){}
 },
 muted:function(v){if(v!==undefined){muted=!!v;lsSet('cecilia_sound',muted?'off':'on')}return muted},
 confetti:function(n){
  var box=el('div','cg-confetti'),items=['⭐','🌟','✨','🎉','💖','🌈'];document.body.appendChild(box);
  for(var i=0;i<(n||18);i++){var p=el('span','cg-cf',items[i%items.length]);p.style.left=(Math.random()*96)+'%';p.style.webkitAnimationDelay=p.style.animationDelay=(Math.random()*.6)+'s';box.appendChild(p)}
  setTimeout(function(){if(box.parentNode)box.parentNode.removeChild(box)},2600);
 },
 esc:esc,coin:COIN,
 /* true when this device can draw a given emoji (old iPads show an empty box for newer emoji). */
 canShow:function(ch){
  try{var c=document.createElement('canvas');c.width=c.height=20;var x=c.getContext('2d');x.textBaseline='top';x.font='16px sans-serif';x.fillText(ch,0,0);
   var d=x.getImageData(0,0,20,20).data,i;for(i=0;i<d.length;i+=4)if(d[i+3]>0&&(Math.abs(d[i]-d[i+1])>20||Math.abs(d[i+1]-d[i+2])>20))return true;return false}catch(e){return true}
 }
};
window.CeciliaUI=UI;
/* iOS only allows sound after a touch: unlock audio on the first tap. */
document.addEventListener('touchstart',function unlock(){try{var AC=window.AudioContext||window.webkitAudioContext;if(AC&&!audioCtx){audioCtx=new AC();var b=audioCtx.createBuffer(1,1,22050),s=audioCtx.createBufferSource();s.buffer=b;s.connect(audioCtx.destination);if(s.start)s.start(0);else s.noteOn(0)}}catch(e){}document.removeEventListener('touchstart',unlock,true)},true);

/* Old iPads cannot draw newer emoji (🦊 🦒 🪙 ...) and show empty boxes. On such devices only,
 * load small pictures (shared/emoji-old-ipad.js) and put them in place of those emoji. */
function emojiFallback(){
 var force=lsGet('cecilia_emoji_pictures')==='on'; /* set this to test the old-iPad look on a new device */
 if(!window.MutationObserver||(!force&&UI.canShow('🦊')&&UI.canShow('🪙')))return;
 var s=document.createElement('script');s.src=ROOT+'shared/emoji-old-ipad.js?v=31';
 s.onload=function(){var P=window.CeciliaEmojiPictures,keys=[],k;for(k in P)keys.push(k);if(!keys.length)return;
  keys.sort(function(a,b){return b.length-a.length});var re=new RegExp('('+keys.join('|')+')'),urls={};
  function pic(ch){if(!urls[ch])urls[ch]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(P[ch]);var i=document.createElement('img');i.className='cg-emo';i.alt=ch;i.src=urls[ch];return i}
  function skip(n){var p=n.parentNode;if(!p||p.namespaceURI&&p.namespaceURI!=='http://www.w3.org/1999/xhtml')return true;return /^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|TITLE)$/.test(p.tagName)}
  function fix(node){
   if(node.nodeType===3){if(!re.test(node.nodeValue)||skip(node))return;var parts=node.nodeValue.split(re),f=document.createDocumentFragment(),i;
    for(i=0;i<parts.length;i++){if(!parts[i])continue;f.appendChild(P[parts[i]]?pic(parts[i]):document.createTextNode(parts[i]))}node.parentNode.replaceChild(f,node);return}
   if(node.nodeType===1&&!/^(SCRIPT|STYLE|svg)$/i.test(node.tagName)){var kids=[],j;for(j=0;j<node.childNodes.length;j++)kids.push(node.childNodes[j]);for(j=0;j<kids.length;j++)fix(kids[j])}
  }
  fix(document.body);
  new MutationObserver(function(list){for(var i=0;i<list.length;i++){var m=list[i];if(m.type==='characterData')fix(m.target);else for(var j=0;j<m.addedNodes.length;j++)fix(m.addedNodes[j])}}).observe(document.body,{childList:true,subtree:true,characterData:true});
 };
 s.onerror=function(){/* offline before the pictures were cached: at least show a money bag for coins */
  (function swap(n){if(n.nodeType===3){if(n.nodeValue.indexOf('🪙')>=0)n.nodeValue=n.nodeValue.split('🪙').join('💰')}else for(var i=0;i<n.childNodes.length;i++)swap(n.childNodes[i])})(document.body)};
 document.getElementsByTagName('head')[0].appendChild(s);
}
function boot(){UI.mountBar();notify();try{emojiFallback()}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

/* Import coins that were saved inside the learning games before the shared account existed (runs once per game). */
[['wg','wordgarden_v1'],['ss','sentencestars_v1'],['wm','wordmatch_v1'],['math','cecilia_math_quest_age7_v2']].forEach(function(a){try{var s=JSON.parse(lsGet(a[1]));if(s)importCoins(a[0],a[0]==='math'?(s.solved||0)*10:s.coins,!!s.walletV)}catch(e){}});
schedule();
})();

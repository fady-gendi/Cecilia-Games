/* Automatic background progress saving for Cecilia. */
(function(){'use strict';
var W=window.CeciliaWallet,listeners=[],lastAttempt=0;
function url(){return W.saveURL()}
function failure(code,message,permanent){var e=new Error(message);e.code=code;e.permanent=!!permanent;return e}
async function request(action,profile,state,force){
 var endpoint=url();
 var controller=new AbortController(),timer=setTimeout(function(){controller.abort()},30000);
 try{
  var options=action==='load'?{cache:'no-store',redirect:'follow',signal:controller.signal}:{method:'POST',redirect:'follow',signal:controller.signal,body:JSON.stringify({action:'save',p:profile,state:state,force:!!force})};
  var response=await fetch(action==='load'?endpoint+'?action=load&p='+encodeURIComponent(profile)+'&t='+Date.now():endpoint,options);
  if(endpoint!==url())throw failure('changed','Connection updated; reconnecting');
  if(!response.ok)throw failure('network','Save server unavailable');
  if(response.headers&&/text\/html/i.test(response.headers.get('content-type')||''))throw failure('deployment','Save server needs configuration',true);
  var data;try{data=await response.json()}catch(e){throw failure('deployment','Save server needs configuration',true)}
  if(!data||typeof data.ok!=='boolean')throw failure('deployment','Unexpected save response',true);
  if(!data.ok&&data.error!=='older')throw failure(data.error||'server','Save server rejected request',true);
  return data;
 }finally{clearTimeout(timer)}
}
function resume(force){if(!force&&Date.now()-lastAttempt<30000)return;lastAttempt=Date.now();listeners.forEach(function(fn){try{fn()}catch(e){console.error(e)}})}
window.CeciliaCloud={load:function(profile){return request('load',profile)},save:function(profile,state,force){return request('save',profile,state,force)},url:url,onReconnect:function(fn){listeners.push(fn)},message:function(e){return e&&e.permanent?'☁️ '+e.message:'💾 Saved here · reconnecting'}};
window.addEventListener('online',function(){resume(true)});
window.addEventListener('focus',function(){resume(false)});
window.addEventListener('cecilia-cloud-change',function(){resume(true)});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')resume(false)});
})();


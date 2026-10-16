/* Cache static pages only. Cloud requests and saves always reach the server. */
(function(){'use strict';
var root=window.CeciliaWallet.root,waiting=[],loading=false;
function afterPaint(fn){if(window.requestIdleCallback)window.requestIdleCallback(fn,{timeout:2000});else setTimeout(fn,100)}
function loadPhotos(done){
 if(window.CeciliaTrophyPhotos){done(window.CeciliaTrophyPhotos);return}
 waiting.push(done);if(loading)return;loading=true;
 afterPaint(function(){var script=document.createElement('script');script.src=root+'shared/trophy-photos.js?v=v27';script.async=true;script.fetchPriority='low';script.onload=function(){loading=false;var callbacks=waiting.splice(0);callbacks.forEach(function(fn){fn(window.CeciliaTrophyPhotos||[])})};script.onerror=function(){loading=false;waiting=[]};document.head.appendChild(script)});
}
window.CeciliaPerformance={loadPhotos:loadPhotos};
function register(){if(!('serviceWorker' in navigator))return;navigator.serviceWorker.register(root+'sw.js',{scope:root,updateViaCache:'none'}).then(function(){return navigator.serviceWorker.ready}).then(function(reg){if(reg.active)reg.active.postMessage({type:'CACHE_PAGE',url:location.href})}).catch(function(){/* Browser cache remains available when workers are disabled. */})}
if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
})();

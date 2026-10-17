/* Cecilia's Games v3.1 offline cache: pages open instantly and refresh in the background.
 * Cloud requests (script.google.com) are never cached. Old iPads without service workers simply skip this. */
'use strict';
var CACHE='cecilia-games-static-v32',PREFIX='cecilia-games-static-',ROOT=new URL('./',self.location.href);
function allowed(url){return url.origin===ROOT.origin&&url.pathname.indexOf(ROOT.pathname)===0&&!/\/sw\.js$/.test(url.pathname)&&(/\.(?:html|js|css|jpg|jpeg|png|webp|svg)$/.test(url.pathname)||/\/$/.test(url.pathname))}
/* the ?v= number is part of the key, so bumping it in the pages fetches the new shared file */
function key(url){var v=url.searchParams.get('v');return url.origin+url.pathname+(v?'?v='+v:'')}
function update(request,url){return fetch(request).then(function(response){if(response.ok&&response.type!=='opaque'){var copy=response.clone();caches.open(CACHE).then(function(c){c.put(key(url),copy)})}return response})}
self.addEventListener('install',function(event){event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',function(event){event.waitUntil(caches.keys().then(function(names){return Promise.all(names.filter(function(n){return n.indexOf(PREFIX)===0&&n!==CACHE}).map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(event){
 var url=new URL(event.request.url);if(event.request.method!=='GET'||!allowed(url))return;
 event.respondWith(caches.open(CACHE).then(function(cache){return cache.match(key(url)).then(function(cached){
  if(cached){if(!/\.(?:jpg|jpeg|png|webp|svg)$/.test(url.pathname)&&!/trophy-photos\.js$/.test(url.pathname))event.waitUntil(update(event.request,url)['catch'](function(){}));return cached}
  return update(event.request,url);
 })}));
});
self.addEventListener('message',function(event){
 if(!event.data||event.data.type!=='CACHE_PAGE')return;var url;try{url=new URL(event.data.url)}catch(e){return}if(!allowed(url))return;
 event.waitUntil(caches.open(CACHE).then(function(cache){return cache.match(key(url)).then(function(hit){if(!hit)return update(new Request(url.href),url)})})['catch'](function(){}));
});

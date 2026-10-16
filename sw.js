/* Cecilia's Games v3.0: instant cached pages; background static updates. */
'use strict';
const CACHE='cecilia-games-static-v30',PREFIX='cecilia-games-static-',ROOT=new URL('./',self.location.href);
function allowed(url){return url.origin===ROOT.origin&&url.pathname.startsWith(ROOT.pathname)&&!url.pathname.endsWith('/sw.js')&&(/\.(?:html|js|css|jpg|jpeg|png|webp|svg)$/.test(url.pathname)||url.pathname.endsWith('/'))}
function key(url){const copy=new URL(url);copy.search='';copy.hash='';return copy.href}
async function update(request,url){const response=await fetch(request);if(response.ok&&response.type!=='opaque'){const cache=await caches.open(CACHE);await cache.put(key(url),response.clone())}return response}
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(n=>n.startsWith(PREFIX)&&n!==CACHE).map(n=>caches.delete(n)));await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||!allowed(url))return;
 const version=url.searchParams.get('v');if(version&&version!=='v27'&&version!=='v271'&&version!=='v30')return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(key(url));if(cached){if(!(/\.(?:jpg|jpeg|png|webp|svg)$/.test(url.pathname)||url.pathname.endsWith('/shared/trophy-photos.js')))event.waitUntil(update(event.request,url).catch(()=>{}));return cached}return update(event.request,url)})());
});
self.addEventListener('message',event=>{
 if(!event.data||event.data.type!=='CACHE_PAGE')return;
 let url;try{url=new URL(event.data.url)}catch(e){return}if(!allowed(url))return;
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);if(!await cache.match(key(url)))await update(new Request(url.href),url)})().catch(()=>{}));
});

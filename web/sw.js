const CACHE='stamp-book-reader-v4',LIMIT=70;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/web/offline.html','/site.css','/navigation.css','/web/reader.css','/web/theme.css','/web/theme.js','/web/home.css','/web/pwa.js','/web/icon-192.png','/web/icon-512.png'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('stamp-book-reader-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 // Editor sessions, drafts, history and API responses are never service-worker cached.
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/auth/')||url.pathname.startsWith('/api/')||url.pathname.startsWith('/edit')||url.pathname.includes('editor.'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{const response=await fetch(event.request);if(response.ok){await cache.put(event.request,response.clone());const keys=await cache.keys();while(keys.length>LIMIT)await cache.delete(keys.shift())}return response}
  catch{const stored=await cache.match(event.request);if(stored)return stored;if(event.request.mode==='navigate')return (await cache.match('/web/offline.html'))||Response.error();return Response.error()}
 })());
});

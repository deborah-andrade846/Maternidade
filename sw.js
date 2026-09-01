/* Service worker do "Nosso bebê".
   IMPORTANTE: ao mudar qualquer arquivo, incremente a versão do cache abaixo. */
"use strict";
const CACHE = "nosso-bebe-v15";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192-v2.png",
  "./icon-512-v2.png",
  "./icon-maskable-192-v2.png",
  "./icon-maskable-512-v2.png"
];

self.addEventListener("install", (e)=>{
  /* cache:"reload" ignora o cache HTTP do navegador: a versão nova vem da rede */
  e.waitUntil(caches.open(CACHE)
    .then(c=>c.addAll(ASSETS.map(u=>new Request(u, {cache:"reload"}))))
    .then(()=>self.skipWaiting()));
});

self.addEventListener("activate", (e)=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k !== CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", (e)=>{
  const req = e.request;
  if(req.method !== "GET") return;

  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req)
        .then(res=>{
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
          return res;
        })
        .catch(()=>caches.match(req).then(r=>r || caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached=>{
      const rede = fetch(req).then(res=>{
        if(res && res.status === 200 && res.type === "basic"){
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(()=>cached);
      return cached || rede;
    })
  );
});

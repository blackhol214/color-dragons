// 📦 El "service worker" de Color Dragons: guarda el juego en la compu para que cargue rápido y se pueda jugar SIN internet
// (solo, claro: con amigos hace falta internet). Reglas simples y seguras, para que SIEMPRE llegue la versión nueva:
//  · La página (index.html) se pide primero a internet; solo si no hay internet, se usa la guardada.
//  · Los archivos con versión en la dirección (src/…js?v=…), los íconos y el manifest se usan de lo guardado
//    (cada versión tiene otra dirección, así que nunca quedan viejos).
//  · Three.js (los gráficos) viene de otro sitio, pero con su versión en la dirección (r128): también se guarda.
//  · Nada más: ni el WebSocket de los amigos, ni otros sitios.
// VERSION: cámbiala cuando cambies ESTE archivo (así la compu ve que hay un service worker nuevo)
const VERSION = '2026-11-15-pwa';
const CACHE = 'color-dragons-' + VERSION;
const THREE_JS = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const GUARDAR = ['./', './manifest.webmanifest', './iconos/icono-192.png', './iconos/icono-512.png'];

self.addEventListener('install', e => {
  // (si algo falla al guardar, igual se instala: el juego sigue cargando desde internet)
  e.waitUntil(caches.open(CACHE).then(c => Promise.all([c.addAll(GUARDAR), fetch(THREE_JS, { mode: 'no-cors' }).then(r => c.put(THREE_JS, r))])).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('color-dragons-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// El botón "Actualizar" del juego le pide al service worker nuevo que empiece ya
self.addEventListener('message', e => { if (e.data === 'ACTUALIZAR') self.skipWaiting(); });

// ¿Qué hacer con cada pedido? 'pagina' (internet primero), 'fijo' (lo guardado primero), 'three' o null (no se toca)
function estrategia(req, origen) {
  const url = new URL(req.url);
  if (req.method !== 'GET') return null;
  if (req.url === THREE_JS) return 'three';
  if (url.origin !== origen || url.pathname.endsWith('/ws')) return null;
  const esPagina = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  if (esPagina) return 'pagina';
  if (req.mode === 'navigate') return null;
  if (url.searchParams.has('v') || url.pathname.includes('/iconos/') || url.pathname.endsWith('.webmanifest')) return 'fijo';
  return null;
}
const sirve = r => r && r.ok && r.type === 'basic' && !r.redirected;
self.addEventListener('fetch', e => {
  const req = e.request, que = estrategia(req, self.location.origin);
  if (!que) return;
  if (que === 'three') { e.respondWith(caches.match(THREE_JS).then(g => g || fetch(req))); return; }
  if (que === 'pagina') {
    // Primero internet (así llega la versión nueva); si no hay, la guardada
    e.respondWith(fetch(req).then(r => {
      if (sirve(r)) { const copia = r.clone(); caches.open(CACHE).then(c => c.put('./', copia)).catch(() => {}); }
      return r;
    }).catch(() => caches.match('./').then(r => r || Response.error())));
    return;
  }
  e.respondWith(caches.match(req).then(g => g || fetch(req).then(r => {
    if (sirve(r)) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {}); }
    return r;
  })));
});

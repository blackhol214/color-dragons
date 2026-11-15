import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { huellaDe, hayVersionNueva } from '../src/pwa.js';

const ORIGEN = 'https://blackhol214.github.io';
// Carga sw.js en una "compu de mentira" (sin navegador): guardamos sus oyentes para poder llamarlos
function cargarSW() {
  const oyentes = {};
  const self = { location: { origin: ORIGEN }, addEventListener: (tipo, f) => { oyentes[tipo] = f; }, skipWaiting: () => { self.salto = true; }, clients: { claim: () => Promise.resolve() } };
  const caches = { open: () => Promise.resolve({ addAll: () => Promise.resolve(), put: () => Promise.resolve() }), match: () => Promise.resolve(undefined), keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) };
  vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), { self, caches, fetch: () => Promise.resolve({ ok: true }), URL, Promise, Response: { error: () => 'error' }, console });
  return { self, oyentes };
}
// ¿El service worker contesta este pedido (respondWith), o lo deja pasar directo a internet?
function contesta(sw, url, { method = 'GET', mode = 'cors' } = {}) {
  let contesto = false;
  sw.oyentes.fetch({ request: { url, method, mode }, respondWith: p => { contesto = true; if (p && p.catch) p.catch(() => {}); } });
  return contesto;
}

describe('📦 el service worker (jugar sin internet)', () => {
  const sw = cargarSW();
  it('escucha instalar, activar, mensajes y pedidos', () => expect(Object.keys(sw.oyentes).sort()).toEqual(['activate', 'fetch', 'install', 'message']));
  it('la página del juego la contesta (internet primero, y si no hay, la guardada)', () => {
    expect(contesta(sw, `${ORIGEN}/color-dragons/`, { mode: 'navigate' })).toBe(true);
    expect(contesta(sw, `${ORIGEN}/color-dragons/index.html`, { mode: 'navigate' })).toBe(true);
  });
  it('los archivos con versión, los íconos y el manifest los guarda', () => {
    expect(contesta(sw, `${ORIGEN}/color-dragons/src/logic.js?v=18`)).toBe(true);
    expect(contesta(sw, `${ORIGEN}/color-dragons/iconos/icono-192.png`)).toBe(true);
    expect(contesta(sw, `${ORIGEN}/color-dragons/manifest.webmanifest?v=2`)).toBe(true);
  });
  it('three.js (de otro sitio, pero con versión fija) también', () => expect(contesta(sw, 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')).toBe(true));
  it('NO toca: el WebSocket de los amigos, otros sitios, archivos sin versión ni pedidos que no son GET', () => {
    expect(contesta(sw, `${ORIGEN}/ws`)).toBe(false);
    expect(contesta(sw, 'https://otro-sitio.com/algo.js?v=1')).toBe(false);
    expect(contesta(sw, `${ORIGEN}/color-dragons/src/logic.js`)).toBe(false);
    expect(contesta(sw, `${ORIGEN}/color-dragons/src/logic.js?v=18`, { method: 'POST' })).toBe(false);
  });
  it('con "ACTUALIZAR" el service worker nuevo empieza de una', () => {
    sw.oyentes.message({ data: 'ACTUALIZAR' });
    expect(sw.self.salto).toBe(true);
  });
});

describe('🆕 el aviso de versión nueva', () => {
  it('la misma página tiene la misma huella', () => expect(huellaDe('<html>hola</html>')).toBe(huellaDe('<html>hola</html>')));
  it('si cambia una sola letra, cambia la huella', () => expect(huellaDe('<html>hola</html>')).not.toBe(huellaDe('<html>Hola</html>')));
  it('avisa solo si la huella cambió', () => {
    expect(hayVersionNueva('abc', 'abd')).toBe(true);
    expect(hayVersionNueva('abc', 'abc')).toBe(false);
  });
  it('sin internet (no hay huella nueva) no avisa nada', () => { expect(hayVersionNueva('abc', null)).toBe(false); expect(hayVersionNueva(null, 'abc')).toBe(false); });
});

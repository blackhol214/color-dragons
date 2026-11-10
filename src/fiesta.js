// 🎈 La noche final: "la fiesta de despedida" (historia y mapa de Mathias). Funciones puras (se prueban con tests).
// Juegas en un mapa aparte (las salas f… de src/laboratorio.js). Las etapas, en orden:
//   1. 'intro'    → la cámara recorre la fiesta y el sombrero 🎩 habla
//   2. 'fiesta'   → Grey duerme con su sombrero de fiesta. Si tocas un globo, se despierta, va a ver qué hizo ruido y vuelve a dormir
//   3. 'bloques'  → subiste la rampa: cae un globo sobre el sombrero de fiesta, Grey se despierta y se abre la compuerta
//                   del cuarto de las cajas (al entrar, se cierra detrás de ti). Empujas las cajas fuera de la escotilla del piso
//   4. 'escape'   → con la escotilla libre, Grey la abre desde abajo: cae rápido como rampa y te persigue. Bajas, sales al
//                   pasillo y escapas por las ventilaciones hasta la salida
//   5. 'choque'   → la puerta se cierra detrás de ti y Grey se estrella contra ella
//   6. 'hat'      → aparece el sombrero completo y habla
//   7. 'fin'      → "ESCAPASTE" y vuelves al lobby

import { SALAS, tramosDePared, salaEn } from './laboratorio.js?v=10';

export const MENSAJE_INICIO = "Now this is the final night. I've decided to invite you to the goodbye celebration.";
export const MENSAJE_FINAL = "I'm still not done with you. Things are going to get a lot more EPIC.";
export const DURACION = { intro: 14, choque: 4, hat: 11, fin: 5 };

// Grey duerme aquí (en el salón), con su sombrero de fiesta
export const CAMA_GREY = { x: 181, z: -8.5 };
// Los globos de colores (tocarlos hace ruido)
export const GLOBOS = [
  [172, -10], [176, -3], [171, 2], [186, 2], [190, -10], [178, 4], [184, -5], [189, -2], [174, -7], [165, -10], [163, 0], [166, 7],
].map(([x, z], i) => ({ x, z, color: [0xe85d75, 0x5da8e8, 0xe8c75d, 0x7ad37a, 0xb17ae8, 0xe8935d][i % 6] }));
export const TOCAR_GLOBO = 1.1;
// La rampa (escalones que suben hacia el norte) y el descanso de arriba, a 3 m
export const RAMPA = { x0: 196, x1: 204, zAbajo: 6, zArriba: -8, alto: 3, escalones: 10 };
export const DESCANSO = { x0: 194, x1: 204, z0: -12, z1: -8 };
// El sombrero de fiesta (al pie de la rampa): ahí cae el globo
export const SOMBRERO_FIESTA = { x: 198.5, z: 8.2 };
// 📦 El cuarto de las cajas (a 3 m de alto): una escotilla en el piso, tapada con muchas cajas. Hay que sacarlas todas
export const CAJA_FIESTA = 1.3;   // de lado
export const ESCOTILLA_FIESTA = { x0: 210, x1: 214, z0: -10, z1: -6 };
// 8 cajas en un anillo encima de la escotilla (el centro queda vacío para poder maniobrar)
export const CAJAS = [[210.65, -9.35], [212, -9.35], [213.35, -9.35], [210.65, -8], [213.35, -8], [210.65, -6.65], [212, -6.65], [213.35, -6.65]].map(([x, z]) => ({ x, z }));
export const CUARTO_BLOQUES = { x0: 204, x1: 216, z0: -14, z1: -2, y: 3 };
// La puerta que abre Grey (entre el pasillo y las ventilaciones) y la de la salida (se cierra detrás de ti)
export const PUERTA_GREY = { x: 220, z: 26 };
export const PUERTA_SALIDA = { x: 234, z: 54 };
export const ENTRA_GREY = { x: 205.5, z: -12.5 };   // Grey aparece abajo de la escotilla (en el cuarto de abajo) y sube a perseguirte

export const nuevaFiesta = () => ({
  fase: 'intro', tiempo: 0,
  globos: GLOBOS.map(() => ({ tocado: 0 })),
  cajas: CAJAS.map(c => ({ ...c })),
  grey: { x: CAMA_GREY.x, z: CAMA_GREY.z, rot: 0, modo: 'dormir', meta: null, espera: 0, vel: 0 },
});

// ¿Tocaste un globo? Devuelve su número (o -1). Un globo tocado tarda 3 s en poder volver a sonar
export function globoTocado(fiesta, pos) {
  return fiesta.globos.findIndex((g, i) => g.tocado <= 0 && pos.y < 2 && Math.hypot(GLOBOS[i].x - pos.x, GLOBOS[i].z - pos.z) < TOCAR_GLOBO);
}
// ¿Llegaste arriba de la rampa?
export const enElDescanso = pos => pos.y > RAMPA.alto - 0.3 && pos.x > DESCANSO.x0 && pos.x < DESCANSO.x1 && pos.z > DESCANSO.z0 && pos.z < DESCANSO.z1;

// 📦 Empujar una caja: se mueve en la dirección del empujón (solo en x o solo en z), sin salirse del cuarto ni meterse en otra
export function empujar(fiesta, i, dx, dz) {
  const b = fiesta.cajas[i];
  if (!b) return false;
  const h = CAJA_FIESTA / 2, c = CUARTO_BLOQUES;
  const nx = Math.max(c.x0 + h + 0.3, Math.min(c.x1 - h - 0.3, b.x + dx)), nz = Math.max(c.z0 + h + 0.3, Math.min(c.z1 - h - 0.3, b.z + dz));
  if (fiesta.cajas.some((o, j) => j !== i && Math.abs(o.x - nx) < CAJA_FIESTA && Math.abs(o.z - nz) < CAJA_FIESTA)) return false;
  if (nx === b.x && nz === b.z) return false;
  b.x = nx; b.z = nz;
  return true;
}
// ¿Esta caja todavía tapa la escotilla?
const E = ESCOTILLA_FIESTA;
export const tapa = c => c.x + CAJA_FIESTA / 2 > E.x0 && c.x - CAJA_FIESTA / 2 < E.x1 && c.z + CAJA_FIESTA / 2 > E.z0 && c.z - CAJA_FIESTA / 2 < E.z1;
export const escotillaLibre = fiesta => !fiesta.cajas.some(tapa);
export const cajasQueTapan = fiesta => fiesta.cajas.filter(tapa).length;
// ¿Ya entraste al cuarto de las cajas? (ahí la compuerta se cierra detrás de ti)
export const enCuartoCajas = pos => pos.y > 2.5 && pos.x > CUARTO_BLOQUES.x0 + 1 && pos.x < CUARTO_BLOQUES.x1 && pos.z > CUARTO_BLOQUES.z0 && pos.z < CUARTO_BLOQUES.z1;

// 🐉 Grey en la fiesta: camina por las puertas (nunca atraviesa paredes) y solo te ve si no hay una pared en medio
//   dormir → oir (va adonde sonó el globo) → mirar (3 s) → volver (a su cama) → dormir · guardia (despierto, esperando)
//   perseguir: te sigue por el camino más corto (por las puertas)
export const GREY_FIESTA = { camina: 4.5, corre: 11.5, correFiesta: 8, ve: 9, atrapa: 1.5, rendirse: 2.5 };   // rendirse: segundos sin verte hasta que se aburre
// El mapa de la fiesta para Grey (solo el piso de abajo: Grey no sube la rampa)
const FS = SALAS.filter(q => q.zona === 'fiesta' && q.y === 0);
const ENF = { n: 's', s: 'n', e: 'w', w: 'e' }, lin = (q, lado) => ({ n: q.z0, s: q.z1, e: q.x1, w: q.x0 })[lado];
const FVEC = new Map(FS.map(q => [q.id, []]));
for (const q of FS) for (const lado of Object.keys(q.puertas)) for (const [a, b] of q.puertas[lado]) {
  const o = FS.find(r => r !== q && lin(r, ENF[lado]) === lin(q, lado) && (r.puertas[ENF[lado]] || []).some(([c, d]) => c <= a && d >= b));
  if (!o) continue;
  const m = (a + b) / 2, hz = lado === 'n' || lado === 's', n = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[lado];
  FVEC.get(q.id).push({ a: o.id, x: hz ? m : lin(q, lado), z: hz ? lin(q, lado) : m, nx: n[0], nz: n[1] });
}
export function rutaFiesta(desde, hacia) {
  if (desde === hacia) return [];
  const vino = new Map([[desde, null]]), cola = [desde];
  while (cola.length) { const id = cola.shift(); if (id === hacia) break; for (const v of FVEC.get(id) || []) if (!vino.has(v.a)) { vino.set(v.a, { de: id, p: v }); cola.push(v.a); } }
  if (!vino.has(hacia)) return null;
  const pts = [];
  for (let id = hacia; vino.get(id); id = vino.get(id).de) { const p = vino.get(id).p; pts.unshift({ x: p.x - p.nx * 0.8, z: p.z - p.nz * 0.8 }, { x: p.x + p.nx * 0.8, z: p.z + p.nz * 0.8 }); }
  return pts;
}
// Las paredes (los huecos sin pareja también cuentan como pared: Grey no pasa por ahí)
const MUROS = [];
for (const q of FS) { const p = q.puertas;
  for (const [a, b] of tramosDePared(q.x0, q.x1, p.n)) MUROS.push([a, q.z0, b, q.z0]); for (const [a, b] of tramosDePared(q.x0, q.x1, p.s)) MUROS.push([a, q.z1, b, q.z1]);
  for (const [a, b] of tramosDePared(q.z0, q.z1, p.w)) MUROS.push([q.x0, a, q.x0, b]); for (const [a, b] of tramosDePared(q.z0, q.z1, p.e)) MUROS.push([q.x1, a, q.x1, b]); }
const cruza = (ax, az, bx, bz, cx, cz, dx, dz) => { const l = (px, pz, qx, qz, rx, rz) => (qx - px) * (rz - pz) - (qz - pz) * (rx - px); return ((l(cx, cz, dx, dz, ax, az) > 0) !== (l(cx, cz, dx, dz, bx, bz) > 0)) && ((l(ax, az, bx, bz, cx, cz) > 0) !== (l(ax, az, bx, bz, dx, dz) > 0)); };
export const hayLineaFiesta = (a, b) => !MUROS.some(w => cruza(a.x, a.z, b.x, b.z, w[0], w[1], w[2], w[3]));

// Camina hacia un punto, pasando por las puertas. Devuelve true cuando llegó
function caminar(g, meta, vel, dt) {
  if (!g.ruta || g.rutaPara !== meta) {
    const a = salaEn(g.x, 0, g.z), b = salaEn(meta.x, 0, meta.z), r = a && b ? rutaFiesta(a.id, b.id) : null;
    g.ruta = r ? [...r, { x: meta.x, z: meta.z }] : []; g.rutaPara = meta;   // (si no hay camino, se queda quieto: nunca atraviesa una pared)
  }
  const p = g.ruta[0];
  if (!p) { g.vel = 0; return !salaEn(meta.x, 0, meta.z) || Math.hypot(meta.x - g.x, meta.z - g.z) < 0.4; }
  const dx = p.x - g.x, dz = p.z - g.z, d = Math.hypot(dx, dz), paso = Math.min(d, vel * dt);
  if (d > 0.01) { g.x += dx / d * paso; g.z += dz / d * paso; g.rot = Math.atan2(dx, dz); }
  g.vel = paso / dt;
  if (d - paso < 0.3) g.ruta.shift();
  return g.ruta.length === 0;
}
// Un sonido en (x, z): si Grey duerme, se despierta y va a ver
export function ruido(fiesta, x, z) {
  const g = fiesta.grey;
  if (g.modo === 'dormir' || g.modo === 'volver' || g.modo === 'mirar' || g.modo === 'guardia') { g.modo = 'oir'; g.meta = { x, z }; g.ruta = null; }
}
// Un cuadro de Grey. Devuelve 'atrapado' si te atrapó
export function tickGrey(fiesta, dt, jugador) {
  const g = fiesta.grey;
  g.vel = 0;
  const lejos = Math.hypot(jugador.x - g.x, jugador.z - g.z), teVe = jugador.y < 1.5 && !jugador.oculto && hayLineaFiesta(g, jugador);
  // Despierto, si te ve cerca (sin pared en medio, y estás abajo) te persigue
  if (['oir', 'mirar', 'volver', 'guardia'].includes(g.modo) && lejos < GREY_FIESTA.ve && teVe) { g.modo = 'perseguir'; g.ruta = null; }
  if (g.modo === 'oir' && caminar(g, g.meta, GREY_FIESTA.camina, dt)) { g.modo = 'mirar'; g.espera = 3; }
  else if (g.modo === 'mirar' && (g.espera -= dt) <= 0) { g.modo = fiesta.fase === 'fiesta' ? 'volver' : 'guardia'; g.ruta = null; }
  else if (g.modo === 'volver' && caminar(g, CAMA_GREY, GREY_FIESTA.camina, dt)) { g.modo = 'dormir'; g.rot = 0; }
  else if (g.modo === 'perseguir') {
    // Cada ratito vuelve a calcular el camino hasta donde estás (por las puertas)
    if ((g.recalcular = (g.recalcular || 0) - dt) <= 0 || !g.objetivo) { g.recalcular = 0.4; g.objetivo = { x: jugador.x, z: jugador.z }; g.ruta = null; }
    caminar(g, g.objetivo, fiesta.fase === 'escape' ? GREY_FIESTA.corre : GREY_FIESTA.correFiesta, dt);
    // Si te pierde de vista un rato, se rinde: en la fiesta vuelve a dormir; después, se queda de guardia
    g.sinVerte = teVe ? 0 : (g.sinVerte || 0) + dt;
    if (fiesta.fase !== 'escape' && g.sinVerte > GREY_FIESTA.rendirse) { g.modo = fiesta.fase === 'fiesta' ? 'volver' : 'guardia'; g.ruta = null; g.sinVerte = 0; }
  }
  if (g.modo === 'perseguir' && lejos < GREY_FIESTA.atrapa && teVe) return 'atrapado';
  return null;
}
// ¿Ya pasaste por la puerta de la salida?
export const afuera = pos => pos.z > PUERTA_SALIDA.z + 1.5;

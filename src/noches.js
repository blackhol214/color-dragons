// 🌙 Las noches de Color Dragons (historia de Mathias). Funciones puras: las usa el servidor (con amigos) y el juego (solo).
// Cada noche: primero la cámara recorre el laboratorio mientras la voz del sombrero 🎩 te dice qué buscar;
// después salen los dragones de esa noche: agarras los objetos con E y los llevas a la máquina del sombrero, en el Center Lab.
import { SALAS, ESCOTILLAS, PISO_SUBSUELO, delLab } from './laboratorio.js?v=17';
import { REFUGIOS } from './dragones.js?v=17';

export const NOCHES = [
  { n: 1, dragones: ['red'], objeto: 'tubo', cantidad: 16,
    mensaje: "Hello. I'm not telling you who am I, but I'm needing you to find 16 test tubes I dropped all over." },
  { n: 2, dragones: ['red', 'grey'], objeto: 'comida', cantidad: 9,
    mensaje: 'Now I need you to get some of these food packs.' },
  { n: 3, dragones: ['red', 'grey', 'yellow'], objeto: 'bateria', cantidad: 6, maquina: true,
    mensaje: 'Look who decided to get out of his bed. Anyways, you have to find 6 batteries to connect them on my machine.' },
  { n: 4, dragones: ['white', 'grey'], objeto: 'pieza', cantidad: 24,
    mensaje: "Today is the final night. After you find the puzzle pieces I'll tell you why are you here." },
  { n: 5, dragones: ['red', 'grey', 'yellow', 'white'], objeto: 'fusible', cantidad: 10, apagon: true,
    mensaje: 'Oh now I guess you have to find 10 fuses to turn everything on. Take these flashlights.' },
];
// Cómo se llama cada objeto en el contador
export const OBJETOS = {
  tubo: { nombre: 'Tubos de ensayo', emoji: '🧪' },
  comida: { nombre: 'Paquetes de comida', emoji: '🥫' },
  bateria: { nombre: 'Baterías', emoji: '🔋' },
  pieza: { nombre: 'Piezas de rompecabezas', emoji: '🧩' },
  fusible: { nombre: 'Fusibles', emoji: '⚡' },
};
export const INTRO_SEGUNDOS = 18;   // lo que dura el recorrido de la cámara (no se puede saltar)
export const FIN_SEGUNDOS = 5;
// 🔦 Noche 5: las linternas están en una mesa junto al Spawn (se agarran con E)
export const MESA_LINTERNAS = { x: 2.5, y: 0, z: -27.6, radio: 2.2 };      // lo que dura el cartel de "noche completada"
export const PISTA_SEGUNDOS = 90;    // si tardas más que esto, los objetos que faltan muestran un contorno blanco (a través de las paredes)
export const RADIO_RECOGER = 1.5;   // qué tan cerca tienes que pasar para agarrar un objeto
// 🎩 La máquina del sombrero (en el Center Lab): ahí se entregan los objetos (y en la noche 3 se conectan las baterías)
export const MAQUINA = { x: 24, y: 0, z: 29.5, radio: 2.6 };

export const nocheDe = n => NOCHES.find(q => q.n === n) || null;

// ¿Dónde aparecen los objetos? Repartidos por todo el laboratorio (arriba y abajo), una sala tras otra para que no
// queden todos juntos. No en el refugio, ni en el Spawn, ni encima de una escotilla
export function lugaresObjetos(cantidad, azar = Math.random) {
  const salas = SALAS.filter(s => delLab(s) && !REFUGIOS.includes(s.id) && s.id !== 'spawn');
  // Mezclar las salas (cada noche quedan en otro orden)
  for (let i = salas.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [salas[i], salas[j]] = [salas[j], salas[i]]; }
  const lugares = [];
  for (let k = 0; lugares.length < cantidad && k < cantidad * 20; k++) {
    const s = salas[k % salas.length], m = 1.2;
    const x = s.x0 + m + azar() * (s.x1 - s.x0 - 2 * m), z = s.z0 + m + azar() * (s.z1 - s.z0 - 2 * m);
    if (ESCOTILLAS.some(e => x > e.x0 - 1 && x < e.x1 + 1 && z > e.z0 - 1 && z < e.z1 + 1)) continue;
    if (lugares.some(p => Math.hypot(p.x - x, p.z - z) < 3)) continue;   // no dos objetos pegados
    lugares.push({ x: Math.round(x * 100) / 100, y: s.y, z: Math.round(z * 100) / 100 });
  }
  return lugares;
}

// Una noche nueva. fase: 'intro' (la cámara recorre el lugar) → 'jugando' → 'ganada'
// Cada objeto está 'suelto' (en su lugar), 'llevado' (alguien lo agarró con E: quien) o 'entregado' (ya está en el Center Lab)
export function nuevaNoche(n, azar = Math.random) {
  const def = nocheDe(n);
  return { n, fase: 'intro', tiempo: 0, objetos: lugaresObjetos(def.cantidad, azar).map(p => ({ ...p, estado: 'suelto', quien: null })) };
}
export const entregados = noche => noche.objetos.filter(o => o.estado === 'entregado').length;
export const llevaDe = (noche, quien) => noche.objetos.filter(o => o.estado === 'llevado' && o.quien === quien).length;

// ¿Hay un objeto suelto al alcance? Devuelve su número (o -1)
export function objetoCerca(noche, pos) {
  if (noche.fase !== 'jugando') return -1;
  return noche.objetos.findIndex(o => o.estado === 'suelto' && Math.abs(o.y - pos.y) < 2 && Math.hypot(o.x - pos.x, o.z - pos.z) < RADIO_RECOGER);
}
// Agarrar el objeto i con E (si de verdad está cerca). Devuelve true si lo agarró
export function recoger(noche, i, pos, quien = 'yo') {
  const o = noche.objetos[i];
  if (!o || o.estado !== 'suelto' || noche.fase !== 'jugando' || Math.abs(o.y - pos.y) > 2 || Math.hypot(o.x - pos.x, o.z - pos.z) > RADIO_RECOGER + 0.6) return false;
  o.estado = 'llevado'; o.quien = quien;
  return true;
}
// 🧪 Al llegar a la máquina del Center Lab se entregan todos los que llevas. Devuelve cuántos entregó
export const cercaDeMaquina = pos => Math.abs(pos.y - MAQUINA.y) < 2 && Math.hypot(pos.x - MAQUINA.x, pos.z - MAQUINA.z) < MAQUINA.radio;
export function entregar(noche, pos, quien = 'yo') {
  if (noche.fase !== 'jugando' || !cercaDeMaquina(pos)) return 0;
  let k = 0;
  for (const o of noche.objetos) if (o.estado === 'llevado' && o.quien === quien) { o.estado = 'entregado'; k++; }
  return k;
}
// 🐉 Si te atrapan, se te caen los que llevabas: vuelven a su lugar. Devuelve cuántos se cayeron
export function soltar(noche, quien) {
  let k = 0;
  for (const o of noche.objetos) if (o.estado === 'llevado' && o.quien === quien) { o.estado = 'suelto'; o.quien = null; k++; }
  return k;
}
// ¿Ya ganaste? Todos los objetos entregados en el Center Lab
export const nocheCompleta = noche => entregados(noche) === nocheDe(noche.n).cantidad;
// Avanza el reloj de la noche: termina la intro, y si ya ganaste, pasa a 'ganada'. Devuelve true si cambió de fase
export function tickNoche(noche, dt) {
  noche.tiempo += dt;
  if (noche.fase === 'intro' && noche.tiempo >= INTRO_SEGUNDOS) { noche.fase = 'jugando'; noche.tiempo = 0; return true; }
  if (noche.fase === 'jugando' && nocheCompleta(noche)) { noche.fase = 'ganada'; noche.tiempo = 0; return true; }
  return false;
}
// La que sigue (después de la 5 viene la final: 6, que se juega en la fiesta, ver src/fiesta.js)
export const NOCHE_FINAL = 6;
export const siguienteNoche = n => (nocheDe(n + 1) ? n + 1 : null);
export const enElSubsuelo = o => o.y <= PISO_SUBSUELO + 0.5;

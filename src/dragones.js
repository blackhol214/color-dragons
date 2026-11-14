// 🐉 El cerebro de los dragones (diseños de Mathias). Funciones puras: las usa el servidor (para que todos vean
// a los dragones en el mismo lugar) y el juego cuando juegas solo. Cómo se VEN y se ANIMAN está en src/criaturas.js.
//
// Qué hace cada dragón:
//   pasear    → camina despacio de sala en sala (de su piso), a veces se para a mirar
//   perseguir → te vio: corre derecho hacia ti
//   buscar    → te perdió de vista: va a donde te vio por última vez
//   caja      → te vio meterte en tu caja: la sigue aunque te muevas (y sobre tu caja sale un "!")
import { SALAS, ESCOTILLAS, PISO_PRINCIPAL, PISO_SUBSUELO, tramosDePared, salaEn, delLab } from './laboratorio.js?v=16';
import { MUEBLES } from './muebles.js?v=16';
import { collideWalls } from './logic.js?v=16';

export const MODOS = ['pasear', 'perseguir', 'buscar', 'caja', 'dormir', 'comer'];
// 🟡 Yellow es dormilón: duerme en su cama y cada 30–40 s se despierta con hambre. Si su plato tiene comida, come y
// vuelve a dormir; si está vacío, sale de su cuarto a buscar (un rato) y después vuelve a la cama
export const CAMA = { x: 47.4, z: 6 }, PLATO = { x: 41.25, z: 8.6 };
export const HAMBRE = { min: 30, max: 40, buscando: 40, comiendo: 4 };

// camina / corre: metros por segundo (tú corres a 12) · vista: hasta dónde ve · piso: en qué piso vive
// ciego: no ve (nunca corre), camina lento y a veces se para a tantear con los brazos. Si te choca, te lleva… ¡aunque estés en tu caja!
export const DRAGONES = [
  { id: 'red', nombre: 'Red', piso: 0, casa: 'centerLab', inicio: { x: 10, z: 18 }, camina: 1.7, corre: 1.7, vista: 0, ciego: true, alcance: 2 },   // mide 4 m (el doble que tú): sus brazos llegan más lejos
  { id: 'white', nombre: 'White', piso: -7, casa: 'greyCove', inicio: { x: -44.2, z: -24.2 }, camina: 3, corre: 8.5, vista: 20 },   // aparece en sus mesas
  { id: 'grey', nombre: 'Grey', piso: -7, casa: 'greyCove', camina: 4.5, corre: 12.5, vista: 22 },   // ¡el rápido!
  { id: 'yellow', nombre: 'Yellow', piso: -7, casa: 'yellowRoom', inicio: { x: 47.4, z: 6 }, camina: 2.4, corre: 7, vista: 15, campo: 0.6, dormilon: true },   // ve poquito: solo lo que tiene justo enfrente   // aparece en su cama
];
export const ATRAPA = 1.4;            // a esta distancia te atrapa
export const CAMPO_VISION = 1.2;      // radianes a cada lado de hacia donde mira (~70°). Detrás de ellos no te ven
export const GIRO = 5;                // qué tan rápido gira (radianes por segundo)

const salaPorId = id => SALAS.find(s => s.id === id);
// 😐 Los refugios: el Panic Hole (sus puertas de metal no dejan pasar a los dragones, ni verte a través) y 🌞 el Spawn
// (ahí apareces: ningún dragón entra ni te atrapa adentro, así nadie te "remata" al volver)
export const REFUGIOS = ['panico', 'spawn'];
// 🌞 Al Spawn (y a sus escaleras) no van a pasear: así al empezar (o al volver después de que te atrapen) tienes tiempo
export const LEJOS_DEL_SPAWN = ['spawn', 'escaleras'];

// ---------- El mapa visto por un dragón: qué salas se conectan y por qué puerta ----------
const ENFRENTE = { n: 's', s: 'n', e: 'w', w: 'e' };
const linea = (s, lado) => ({ n: s.z0, s: s.z1, e: s.x1, w: s.x0 })[lado];
// id de sala → [{ a: sala vecina, x, z: el centro de la puerta }]
export const VECINOS = new Map(SALAS.map(s => [s.id, []]));
for (const s of SALAS) for (const lado of Object.keys(s.puertas)) for (const [a, b] of s.puertas[lado]) {
  const o = SALAS.find(q => q !== s && q.y === s.y && linea(q, ENFRENTE[lado]) === linea(s, lado) && (q.puertas[ENFRENTE[lado]] || []).some(([c, d]) => c <= a && d >= b));
  if (!o || REFUGIOS.includes(s.id) || REFUGIOS.includes(o.id) || !delLab(s)) continue;   // (el lobby y la fiesta no son del laboratorio)
  const m = (a + b) / 2, horizontal = lado === 'n' || lado === 's';
  const n = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[lado];   // hacia dónde se sale por esa puerta
  VECINOS.get(s.id).push({ a: o.id, x: horizontal ? m : linea(s, lado), z: horizontal ? linea(s, lado) : m, nx: n[0], nz: n[1] });
}

// 🪜 Las escotillas también unen salas (de un piso al otro): los dragones bajan y suben por la escalera de mano.
// lado: hacia dónde se bajan de la escalera (la escalera de aGrey está al oeste del hoyo, la de aYellow al este)
export const TREPA = 2.2;   // metros por segundo subiendo o bajando la escalera
for (const e of ESCOTILLAS) {
  const lado = e.id === 'aGrey' ? 1 : -1, cx = (e.x0 + e.x1) / 2, cz = (e.z0 + e.z1) / 2;
  const datos = { x: cx, z: cz, sale: { x: cx + lado * 2, z: cz }, mira: lado > 0 ? -Math.PI / 2 : Math.PI / 2 };
  VECINOS.get(e.desde).push({ a: e.hacia, escotilla: { ...datos, de: PISO_PRINCIPAL, a: PISO_SUBSUELO } });
  VECINOS.get(e.hacia).push({ a: e.desde, escotilla: { ...datos, de: PISO_SUBSUELO, a: PISO_PRINCIPAL } });
}
export const pisoDe = y => (y < (PISO_PRINCIPAL + PISO_SUBSUELO) / 2 ? PISO_SUBSUELO : PISO_PRINCIPAL);

// El camino más corto de una sala a otra (búsqueda en anchura). Por cada puerta hay DOS paradas: un poco antes y un poco
// después de la puerta. Así la cruza derecho y nunca corta camino por la esquina de una pared
export function ruta(desde, hacia) {
  if (desde === hacia) return [];
  const vino = new Map([[desde, null]]), cola = [desde];
  while (cola.length) {
    const id = cola.shift();
    if (id === hacia) break;
    for (const v of VECINOS.get(id) || []) if (!vino.has(v.a)) { vino.set(v.a, { de: id, puerta: v }); cola.push(v.a); }
  }
  if (!vino.has(hacia)) return null;   // no se puede llegar (por ejemplo, al refugio)
  const puertas = [];
  for (let id = hacia; vino.get(id); id = vino.get(id).de) {
    const p = vino.get(id).puerta, e = p.escotilla;
    if (e) puertas.unshift(   // 🪜 ir al lado de la escalera → pararse en el hoyo → trepar → bajarse de la escalera
      { x: e.sale.x, z: e.sale.z }, { x: e.x, z: e.z }, { x: e.x, z: e.z, y: e.a, trepar: true, mira: e.mira }, { x: e.sale.x, z: e.sale.z });
    else puertas.unshift({ x: p.x - p.nx * 0.8, z: p.z - p.nz * 0.8 }, { x: p.x + p.nx * 0.8, z: p.z + p.nz * 0.8 });
  }
  return puertas;
}

// ---------- ¿Te ve? Una línea del dragón hasta ti que no atraviese ninguna pared ----------
// Las paredes de cada piso como segmentos [x1, z1, x2, z2] (los huecos de las puertas no cuentan)
export const PAREDES = new Map();
for (const s of SALAS) {
  if (!PAREDES.has(s.y)) PAREDES.set(s.y, []);
  const lista = PAREDES.get(s.y), p = s.puertas;
  for (const [a, b] of tramosDePared(s.x0, s.x1, p.n)) lista.push([a, s.z0, b, s.z0]);
  for (const [a, b] of tramosDePared(s.x0, s.x1, p.s)) lista.push([a, s.z1, b, s.z1]);
  for (const [a, b] of tramosDePared(s.z0, s.z1, p.w)) lista.push([s.x0, a, s.x0, b]);
  for (const [a, b] of tramosDePared(s.z0, s.z1, p.e)) lista.push([s.x1, a, s.x1, b]);
  // Las puertas del refugio cuentan como pared (para la vista de los dragones)
  if (REFUGIOS.includes(s.id)) {
    for (const [a, b] of p.n || []) lista.push([a, s.z0, b, s.z0]);
    for (const [a, b] of p.s || []) lista.push([a, s.z1, b, s.z1]);
    for (const [a, b] of p.w || []) lista.push([s.x0, a, s.x0, b]);
    for (const [a, b] of p.e || []) lista.push([s.x1, a, s.x1, b]);
  }
}
// ¿Se cruzan dos segmentos? (con la "regla de la mano": de qué lado queda cada punta)
function seCruzan(ax, az, bx, bz, cx, cz, dx, dz) {
  const lado = (px, pz, qx, qz, rx, rz) => (qx - px) * (rz - pz) - (qz - pz) * (rx - px);
  const d1 = lado(cx, cz, dx, dz, ax, az), d2 = lado(cx, cz, dx, dz, bx, bz), d3 = lado(ax, az, bx, bz, cx, cz), d4 = lado(ax, az, bx, bz, dx, dz);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}
export function hayLinea(piso, a, b) {
  for (const w of PAREDES.get(piso) || []) if (seCruzan(a.x, a.z, b.x, b.z, w[0], w[1], w[2], w[3])) return false;
  return true;
}
const anguloEntre = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
// ¿Este dragón ve a este jugador? (persiguiendo ya no le importa hacia dónde mira: te sigue con los ojos)
export function teVe(d, j, def) {
  if (def.ciego || j.oculto || Math.abs(j.y - d.y) > 2.5) return false;
  const dist = Math.hypot(j.x - d.x, j.z - d.z);
  if (dist > def.vista) return false;
  if (d.modo !== 'perseguir' && dist > 3 && anguloEntre(Math.atan2(j.x - d.x, j.z - d.z), d.rot) > (def.campo || CAMPO_VISION)) return false;
  return hayLinea(pisoDe(d.y), d, j);
}

// ---------- El dragón ----------
export function nuevosDragones() {
  return DRAGONES.map(def => {
    const s = salaPorId(def.casa), p = def.inicio || { x: (s.x0 + s.x1) / 2, z: (s.z0 + s.z1) / 2 };
    return { id: def.id, x: p.x, y: def.piso, z: p.z, rot: 0, modo: def.dormilon ? 'dormir' : 'pasear', ruta: [], espera: 1, objetivo: null, ultimo: null, vioHace: 99, vel: 0, recalcular: 0,
      hambre: def.dormilon ? HAMBRE.min + Math.random() * (HAMBRE.max - HAMBRE.min) : 0, despierto: 0 };
  });
}
const DEF = new Map(DRAGONES.map(d => [d.id, d]));
const salaDe = d => salaEn(d.x, d.y, d.z);

// Un punto al azar dentro de una sala (lejos de las paredes)
function puntoEn(s, azar) {
  const m = Math.min(1.5, (s.x1 - s.x0) / 3, (s.z1 - s.z0) / 3);
  let p;
  for (let i = 0; i < 12; i++) {   // (si cae encima de un mueble, prueba otro punto)
    p = { x: s.x0 + m + azar() * (s.x1 - s.x0 - 2 * m), z: s.z0 + m + azar() * (s.z1 - s.z0 - 2 * m) };
    if (!enMueble(p.x, s.y, p.z, RADIO + 0.3)) break;
  }
  return p;
}
// 🪑 Los dragones chocan con los muebles (y resbalan por el borde, como tú)
export const RADIO = 0.5;
export const enMueble = (x, y, z, margen = 0) => MUEBLES.some(m => y < m.top && y + 2 > m.bottom && Math.abs(x - m.x) < m.hw + margen && Math.abs(z - m.z) < m.hd + margen);
export function chocarMuebles(d, antesX, antesZ) {
  const st = { pos: { x: d.x, y: d.y, z: d.z }, vel: { x: 0, z: 0 }, onGround: false, prevX: antesX, prevZ: antesZ };
  const choco = collideWalls(st, MUEBLES, { PR: RADIO, H: 2, STEP_UP: 0 });
  d.x = st.pos.x; d.z = st.pos.z;
  return choco;
}
// Arma la ruta hasta un punto: las puertas del camino y, al final, el punto
function irA(d, punto, piso = pisoDe(d.y)) {
  const desde = salaDe(d), hasta = salaEn(punto.x, piso, punto.z);
  if (hasta && REFUGIOS.includes(hasta.id)) { d.ruta = []; return; }   // al refugio no entra
  const puertas = desde && hasta ? ruta(desde.id, hasta.id) : null;
  // Si no hay camino (o no sabe dónde está), se queda donde está: NUNCA camina derecho a través de una pared
  d.ruta = puertas ? [...puertas, punto] : [];
}
// Camina hacia la siguiente parada de su ruta. Devuelve true cuando llegó al final
function avanzar(d, vel, dt) {
  const p = d.ruta[0];
  d.trepando = !!(p && p.trepar);
  if (!p) { d.vel = 0; return true; }
  if (p.trepar) {   // 🪜 en la escalera: solo sube o baja, mirando la escalera
    d.x = p.x; d.z = p.z; d.vel = 0;
    d.rot += Math.atan2(Math.sin(p.mira - d.rot), Math.cos(p.mira - d.rot)) * Math.min(1, dt * 8);
    const dy = p.y - d.y, paso = Math.min(Math.abs(dy), TREPA * dt);
    d.y += Math.sign(dy) * paso; d.velTrepa = paso / dt;
    if (Math.abs(p.y - d.y) < 0.01) { d.y = p.y; d.ruta.shift(); d.trepando = false; }
    return d.ruta.length === 0;
  }
  d.velTrepa = 0;
  const dx = p.x - d.x, dz = p.z - d.z, dist = Math.hypot(dx, dz);
  // Gira de a poco hacia donde va (no de golpe)
  const quiere = Math.atan2(dx, dz), dif = Math.atan2(Math.sin(quiere - d.rot), Math.cos(quiere - d.rot));
  d.rot += Math.sign(dif) * Math.min(Math.abs(dif), GIRO * dt);
  // Si tiene que girar mucho, primero frena (así no camina de costado)
  const paso = Math.min(dist, vel * dt * Math.max(0.25, Math.cos(dif)));
  const antesX = d.x, antesZ = d.z;
  if (dist > 0.01) { d.x += dx / dist * paso; d.z += dz / dist * paso; chocarMuebles(d, antesX, antesZ); }
  const avanzo = Math.hypot(d.x - antesX, d.z - antesZ);
  d.vel = avanzo / dt;
  // ¿Atascado contra un mueble? Si casi no avanza durante 1 segundo, se salta ese punto del camino
  if (paso > 0.01 && avanzo < paso * 0.3) { d.atascado = (d.atascado || 0) + dt; if (d.atascado > 1) { d.atascado = 0; d.ruta.shift(); return d.ruta.length === 0; } }
  else d.atascado = 0;
  if (dist < 0.35) d.ruta.shift();
  return d.ruta.length === 0;
}

// Un cuadro de todos los dragones. jugadores: [{ id, x, y, z, oculto }] (oculto: metido en su caja o en el armario) · devuelve lo que pasó:
//   { tipo: 'alerta', dragon, jugador } → te vio meterte en tu caja (sale el "!" encima)
//   { tipo: 'atrapado', dragon, jugador }
// Devuelve true si este cuadro el dormilón está ocupado durmiendo o comiendo (y no hay que hacer nada más con él)
function dormilon(d, def, dt, mundo, eventos, azar) {
  if (d.modo === 'dormir') {
    d.vel = 0;
    if (Math.hypot(d.x - CAMA.x, d.z - CAMA.z) > 0.5) { avanzar(d, def.camina, dt); return true; }   // camina de vuelta a la cama
    if ((d.hambre -= dt) <= 0) {   // ¡hambre! va al plato
      d.modo = 'comer'; d.ruta = [{ x: PLATO.x + 0.9, z: PLATO.z }]; d.espera = 0;
    }
    return true;
  }
  if (d.modo === 'comer') {
    if (d.ruta.length) { avanzar(d, def.camina, dt); return true; }
    if (mundo.plato) {   // hay comida: come un ratito y vuelve a dormir
      if (d.espera === 0) eventos.push({ tipo: 'come', dragon: d.id });
      d.espera += dt; d.vel = 0;
      if (d.espera >= HAMBRE.comiendo) acostarse(d, azar);
      return true;
    }
    if (d.espera > 0) { acostarse(d, azar); return true; }   // ya comió (el plato quedó vacío): a dormir
    // Plato vacío: ¡sale a buscar!
    d.modo = 'pasear'; d.despierto = HAMBRE.buscando; d.ruta = []; d.espera = 0;
    eventos.push({ tipo: 'despierta', dragon: d.id });
    return false;
  }
  // Despierto buscando: cuando se le acaba el tiempo (y no te está persiguiendo), vuelve a la cama
  if (d.despierto > 0 && (d.despierto -= dt) <= 0 && d.modo !== 'perseguir' && d.modo !== 'caja') acostarse(d, azar);
  return false;
}
function acostarse(d, azar) {
  d.modo = 'dormir'; d.ruta = [];
  irA(d, CAMA);
  d.hambre = HAMBRE.min + azar() * (HAMBRE.max - HAMBRE.min); d.espera = 0; d.objetivo = null;
}

// mundo: { plato } → si el plato de Yellow tiene comida (true/false)
//   { tipo: 'come', dragon }             → Yellow se comió lo del plato (queda vacío)
//   { tipo: 'despierta', dragon }        → Yellow se despertó y el plato estaba vacío: ¡sale a buscar!
export function tickDragones(dragones, jugadores, dt, azar = Math.random, mundo = { plato: true }) {
  const eventos = [];
  for (const d of dragones) {
    const def = DEF.get(d.id);
    // 🟡 El dormilón: durmiendo no ve ni se mueve; cuando le da hambre, va al plato
    if (def.dormilon && dormilon(d, def, dt, mundo, eventos, azar)) continue;
    d.vioHace += dt;
    // 🪜 Trepando no mira ni atrapa a nadie: primero termina de subir (o bajar)
    if (d.ruta[0] && d.ruta[0].trepar) { avanzar(d, def.camina, dt); continue; }
    // ¿A quién ve? Al más cercano
    let visto = null, mejor = Infinity;
    for (const j of jugadores) if (teVe(d, j, def)) { const k = Math.hypot(j.x - d.x, j.z - d.z); if (k < mejor) { mejor = k; visto = j; } }
    const objetivo = d.objetivo !== null ? jugadores.find(j => j.id === d.objetivo) : null;

    if (visto) {
      d.modo = 'perseguir'; d.objetivo = visto.id; d.ultimo = { x: visto.x, y: visto.y, z: visto.z }; d.vioHace = 0;
      d.ruta = [{ x: visto.x, z: visto.z }];
    } else if (d.modo === 'perseguir' && objetivo && objetivo.oculto && d.vioHace < 1) {
      // ¡Te vio meterte en la caja!
      d.modo = 'caja'; d.recalcular = 0;
      eventos.push({ tipo: 'alerta', dragon: d.id, jugador: objetivo.id });
    } else if (d.modo === 'perseguir') {
      d.modo = 'buscar';
      if (d.ultimo) irA(d, d.ultimo, pisoDe(d.ultimo.y ?? d.y));
    }

    // Siguiendo tu caja: como te puedes mover, cada medio segundo vuelve a calcular el camino hasta donde estás
    if (d.modo === 'caja') {
      if (!objetivo || !objetivo.oculto) { d.modo = 'pasear'; d.objetivo = null; d.ruta = []; }   // saliste de la caja (o te fuiste): ahí te ve normal
      else if ((d.recalcular -= dt) <= 0) { d.recalcular = 0.5; irA(d, { x: objetivo.x, z: objetivo.z }, pisoDe(objetivo.y)); }   // (por la escotilla si estás en el otro piso)
    }
    const vel = d.modo === 'perseguir' ? def.corre : d.modo === 'caja' ? def.corre * 0.8 : d.modo === 'buscar' ? def.camina * 1.4 : def.camina;
    if (d.espera > 0 && d.modo === 'pasear') { d.espera -= dt; d.vel = 0; }
    else if (avanzar(d, vel, dt)) {
      if (d.modo === 'caja') {
        // Llegó a tu caja: si sigues adentro (y cerca), te atrapa
        if (objetivo && objetivo.oculto && Math.hypot(objetivo.x - d.x, objetivo.z - d.z) < ATRAPA * 1.4) {
          eventos.push({ tipo: 'atrapado', dragon: d.id, jugador: objetivo.id });
          d.modo = 'pasear'; d.objetivo = null; d.espera = 2;
        } else d.recalcular = 0;   // te moviste: sigue buscándote
      } else if (d.modo === 'buscar') {
        d.modo = 'pasear'; d.objetivo = null; d.espera = 1.5 + azar() * 1.5;   // mira a su alrededor
      } else if (d.modo === 'pasear') {
        // Elige otra sala de su piso (a veces se queda en la misma) y un punto adentro
        // Casi siempre pasea por el piso donde está; a veces (30%) va al otro piso por la escotilla
        const piso = azar() < 0.3 ? (pisoDe(d.y) === PISO_PRINCIPAL ? PISO_SUBSUELO : PISO_PRINCIPAL) : pisoDe(d.y);
        const salas = SALAS.filter(s => delLab(s) && s.y === piso && !REFUGIOS.includes(s.id) && !LEJOS_DEL_SPAWN.includes(s.id)), s = salas[Math.floor(azar() * salas.length)];
        irA(d, puntoEn(s, azar), s.y);
        d.espera = def.ciego ? (azar() < 0.7 ? 2 + azar() * 2.5 : 0) : azar() < 0.4 ? 1 + azar() * 2 : 0;   // (Red se para seguido a tantear)
      }
    }
    // ¿Atrapó a alguien?
    for (const j of jugadores) {
      const sj = salaEn(j.x, j.y, j.z);
      if (sj && REFUGIOS.includes(sj.id)) continue;   // en un refugio nadie te atrapa
      if ((!j.oculto || def.ciego) && Math.abs(j.y - d.y) < 2.5 && Math.hypot(j.x - d.x, j.z - d.z) < (def.alcance || ATRAPA)) {
        eventos.push({ tipo: 'atrapado', dragon: d.id, jugador: j.id });
        d.modo = 'pasear'; d.objetivo = null; d.ruta = []; d.espera = 2.5;
      }
    }
  }
  return eventos;
}

// Lo que se manda por la red (cortito): [x, y, z, giro, modo] por dragón
export const filaDragon = d => [Math.round(d.x * 100) / 100, Math.round(d.y * 100) / 100, Math.round(d.z * 100) / 100, Math.round(d.rot * 100) / 100, MODOS.indexOf(d.modo), d.trepando ? 1 : 0];

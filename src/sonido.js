// 🔊 La música y el sonido ambiente de Color Dragons, hechos con la Web Audio API (sin archivos: todo se "toca" con osciladores y ruido).
// Cada zona tiene su propio "paisaje sonoro" para que sepas dónde estás con los oídos. Todo suave: volumen bajo, sin tambores, nada chillón.
// Arriba están las partes puras (las prueban los tests). Abajo, crearAmbiente(), que hace sonar todo en el navegador.

// ---------- Los paisajes: uno por zona ----------
// raiz: la nota base en Hz · acorde: las notas del colchón (pad), en semitonos desde la raíz · escala: las notas sueltas que van saliendo
// cada: [mínimo, máximo] de segundos entre nota y nota · onda: el "timbre" de las notas · brillo: hasta qué frecuencia deja pasar el filtro
// ruido: el viento o el aire de los ductos ({ tipo de filtro, frecuencia, volumen }) · dron: una nota grave que no para
// sonidos: los ruiditos de la zona (gotas, grillos, pitidos…) y cada cuántos segundos sale cada uno. Son lo que más se oye: la música viene apagada
export const PAISAJES = {
  // 🏠 Lobby: tranquilo y alegre (Do mayor, pentatónica: no hay notas que choquen)
  lobby: { raiz: 130.81, acorde: [0, 7, 16], escala: [12, 14, 16, 19, 21, 24, 26, 28], cada: [2.8, 5], onda: 'sine', brillo: 1400, pad: 0.5, dron: 0, ruido: { tipo: 'lowpass', frec: 380, vol: 0.14 }, sonidos: [{ tipo: 'pajaro', cada: [6, 12] }, { tipo: 'tintineo', cada: [14, 26] }] },
  // 🛟 Spawn y Hoyo del Pánico: refugio, cálido y lento (Fa mayor)
  refugio: { raiz: 87.31, acorde: [0, 7, 12, 16], escala: [12, 16, 19, 24, 28], cada: [5, 8], onda: 'sine', brillo: 900, pad: 0.6, dron: 0.25, ruido: { tipo: 'lowpass', frec: 220, vol: 0.16 }, sonidos: [{ tipo: 'crujido', cada: [10, 18] }, { tipo: 'tic', cada: [16, 28] }] },
  // 🧪 Laboratorio (piso principal, en las noches): misterioso pero calmado (La menor), con un zumbido muy bajito de máquinas
  laboratorio: { raiz: 110, acorde: [0, 7, 15], escala: [12, 15, 17, 19, 22, 24], cada: [5, 9], onda: 'triangle', brillo: 800, pad: 0.45, dron: 0.35, ruido: { tipo: 'lowpass', frec: 260, vol: 0.18 }, sonidos: [{ tipo: 'pitido', cada: [7, 13] }, { tipo: 'burbuja', cada: [9, 16] }] },
  // 🔦 Apagón (noche 5): casi todo es un dron grave y oscuro, muy pocas notas
  apagon: { raiz: 98, acorde: [0, 7], escala: [12, 15, 19], cada: [9, 14], onda: 'sine', brillo: 500, pad: 0.35, dron: 0.45, ruido: { tipo: 'lowpass', frec: 180, vol: 0.2 }, sonidos: [{ tipo: 'chispa', cada: [8, 15] }, { tipo: 'crujido', cada: [12, 22] }] },
  // 🕳️ Subsuelos y túneles: grave y con eco, como una cueva (Re menor)
  subsuelo: { raiz: 73.42, acorde: [0, 7, 10], escala: [12, 15, 17, 19, 22], cada: [7, 12], onda: 'sine', brillo: 600, pad: 0.4, dron: 0.45, ruido: { tipo: 'lowpass', frec: 140, vol: 0.28 }, sonidos: [{ tipo: 'gota', cada: [2.5, 6] }, { tipo: 'rafaga', cada: [18, 30] }] },
  // 🎈 Fiesta (noche final): una cajita de música suave (Si bemol mayor)
  fiesta: { raiz: 116.54, acorde: [0, 4, 7, 11], escala: [12, 14, 16, 19, 21, 24, 26, 28, 31], cada: [1.6, 3], onda: 'sine', brillo: 1700, pad: 0.45, dron: 0, ruido: { tipo: 'bandpass', frec: 520, vol: 0.18 }, sonidos: [{ tipo: 'tintineo', cada: [6, 11] }, { tipo: 'burbuja', cada: [12, 20] }] },
  // 🌀 Ventilaciones: el aire que corre por los ductos y un dron metálico, casi sin notas
  ventilacion: { raiz: 82.41, acorde: [0, 7], escala: [19, 24, 26], cada: [8, 13], onda: 'triangle', brillo: 700, pad: 0.25, dron: 0.3, ruido: { tipo: 'bandpass', frec: 420, vol: 0.45 }, sonidos: [{ tipo: 'tic', cada: [4, 9] }, { tipo: 'rafaga', cada: [9, 16] }] },
  // 🌙 Afuera: noche abierta, viento suave y quintas (Sol mayor)
  afuera: { raiz: 98, acorde: [0, 7, 14, 19], escala: [12, 14, 19, 21, 24, 26], cada: [3.5, 6], onda: 'sine', brillo: 1200, pad: 0.5, dron: 0, ruido: { tipo: 'lowpass', frec: 500, vol: 0.3 }, sonidos: [{ tipo: 'grillo', cada: [2, 5] }, { tipo: 'rafaga', cada: [12, 22] }] },
};
export const ZONAS = Object.keys(PAISAJES);
export const TIPOS_SONIDO = ['gota', 'grillo', 'pajaro', 'pitido', 'burbuja', 'crujido', 'chispa', 'tic', 'rafaga', 'tintineo'];
// Cuánto esperar hasta que vuelva a sonar un ruidito (un número al azar entre su mínimo y su máximo)
export const esperaSonido = (s, azar = Math.random) => s.cada[0] + azar() * (s.cada[1] - s.cada[0]);
export const CRUCE_SEGUNDOS = 2.5;   // lo que dura el cruce (crossfade) de una zona a otra
export const VOLUMEN_MAXIMO = 0.3;   // aunque pongas todo al 100 %, el juego nunca suena fuerte

const REFUGIOS = ['spawn', 'escaleras', 'panico', 'secreto'];
// ¿Qué zona suena? Mira dónde estás. Si no estás en ninguna sala (en una escalera, entre dos salas…), sigue la que sonaba antes
export function zonaSonora({ jugando = true, enLobby = false, sala = null, apagon = false, fiesta = false, intro = false, anterior = null } = {}) {
  if (!jugando) return null;           // en la pantalla de inicio no suena nada
  if (enLobby) return 'lobby';
  if (intro) return apagon ? 'apagon' : 'laboratorio';   // la cámara está recorriendo el laboratorio
  if (!sala) return anterior;
  if (fiesta || sala.zona === 'fiesta') {
    if (sala.cielo) return 'afuera';
    if (sala.id.startsWith('fVent')) return 'ventilacion';
    return 'fiesta';
  }
  if (sala.zona === 'lobby') return 'lobby';
  if (REFUGIOS.includes(sala.id)) return 'refugio';
  if (sala.y < -1) return 'subsuelo';
  return apagon ? 'apagon' : 'laboratorio';
}

// Una nota a "semitonos" de la raíz (12 semitonos = una octava = el doble de frecuencia)
export const nota = (raiz, semitonos) => raiz * 2 ** (semitonos / 12);

// La próxima nota suelta del paisaje: cuál suena y cuánto esperar hasta la siguiente
export function proximaNota(p, azar = Math.random) {
  const semi = p.escala[Math.floor(azar() * p.escala.length) % p.escala.length];
  const [min, max] = p.cada;
  return { frec: nota(p.raiz, semi), espera: min + azar() * (max - min) };
}

// ---------- 🐾 Los pasos de cada dragón (cada uno suena distinto, y se oyen más fuerte mientras más cerca están) ----------
// grave: la nota del golpe (Hz) · cae: hasta dónde baja · dur: cuánto dura · fuerza: qué tan fuerte · ruido: el "roce" del pie (0 = nada)
// filtro: qué tan agudo es ese roce · extra: algo propio de cada uno
export const PASOS = {
  red: { grave: 62, cae: 34, dur: 0.42, fuerza: 1, ruido: 0.55, filtro: 260, extra: 'retumbo' },        // 🔴 pisadas FUERTES (retumba el piso)
  grey: { grave: 210, cae: 150, dur: 0.07, fuerza: 0.32, ruido: 0.35, filtro: 2400, extra: 'uñas' },     // ⚫ pasos rápidos pero pequeños (tic-tic de uñas)
  yellow: { grave: 118, cae: 82, dur: 0.16, fuerza: 0.3, ruido: 0.12, filtro: 600, extra: 'amenaza' },   // 🟡 pasitos suaves… pero amenazantes (un zumbido grave)
  white: { grave: 88, cae: 52, dur: 0.26, fuerza: 0.62, ruido: 0.32, filtro: 420, extra: 'gelatina' },   // ⚪ en medio de Red y Yellow (y blandito, como gelatina)
};
export const ALCANCE_PASOS = 24;   // más lejos que esto (en metros), no se oyen
// Qué tan fuerte se oye un paso a esa distancia (0 = nada, 1 = pegado a ti). Baja suave, y en otro piso se oye mucho menos
export function volumenPaso(id, dist, otroPiso = false) {
  const p = PASOS[id];
  if (!p || !(dist >= 0) || dist >= ALCANCE_PASOS) return 0;
  const cerca = 1 - dist / ALCANCE_PASOS;
  return p.fuerza * cerca * cerca * (otroPiso ? 0.35 : 1);
}
// ¿Dio un paso? Las piernas avanzan con "fase": cada media vuelta (π) es un paso nuevo
export const pasoNumero = fase => Math.floor(fase / Math.PI);
// Izquierda (-1) o derecha (+1): según dónde está el dragón comparado con hacia dónde mira la cámara
export function ladoDe(dx, dz, camYaw) {
  const d = Math.hypot(dx, dz);
  if (d < 0.01) return 0;
  // la derecha de la cámara: la cámara mira hacia (−sin yaw, −cos yaw); su derecha es (cos yaw, −sin yaw)
  return Math.max(-1, Math.min(1, (dx * Math.cos(camYaw) - dz * Math.sin(camYaw)) / d));
}

// ---------- Tus ajustes de volumen (se guardan en este navegador) ----------
export const CLAVE_AJUSTES = 'color-dragons:sonido-v2';   // (v2: ahora la música viene apagada y se oyen los sonidos de cada zona)
export const AJUSTES_INICIALES = { musica: 0, ambiente: 0.7, silencio: false };
const entre01 = (v, siNo) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : siNo);
export function leerAjustes(texto) {
  let d = null;
  try { d = JSON.parse(texto); } catch (e) {}
  if (!d || typeof d !== 'object') return { ...AJUSTES_INICIALES };
  return { musica: entre01(d.musica, AJUSTES_INICIALES.musica), ambiente: entre01(d.ambiente, AJUSTES_INICIALES.ambiente), silencio: d.silencio === true };
}
export const guardarAjustes = a => JSON.stringify(leerAjustes(JSON.stringify(a)));
// Del deslizador (0 a 1) al volumen real. Al cuadrado porque el oído siente el volumen así: la mitad del deslizador suena "a la mitad"
export function volumenes(a) {
  if (a.silencio) return { musica: 0, ambiente: 0 };
  return { musica: a.musica ** 2 * VOLUMEN_MAXIMO, ambiente: a.ambiente ** 2 * VOLUMEN_MAXIMO };
}

// ---------- El motor (solo en el navegador) ----------
// Arranca con crearAmbiente() después del primer clic (los navegadores no dejan sonar nada antes).
// amb.zona('lobby') cruza a esa zona en CRUCE_SEGUNDOS · amb.volumen(ajustes) · amb.tick(dt) en cada cuadro · amb.agachar(true) baja todo un rato (en un susto)
export function crearAmbiente(Ctx = (globalThis.AudioContext || globalThis.webkitAudioContext)) {
  const ctx = new Ctx(), ahora = () => ctx.currentTime;
  const maestro = ctx.createGain(); maestro.gain.value = 1; maestro.connect(ctx.destination);
  const busMusica = ctx.createGain(), busAmbiente = ctx.createGain();
  busMusica.gain.value = 0; busAmbiente.gain.value = 0;
  busMusica.connect(maestro); busAmbiente.connect(maestro);
  // Un eco suave para las notas sueltas (les da espacio, como una sala grande)
  const eco = ctx.createDelay(2); eco.delayTime.value = 0.42;
  const ecoVuelta = ctx.createGain(); ecoVuelta.gain.value = 0.35;
  const ecoFiltro = ctx.createBiquadFilter(); ecoFiltro.type = 'lowpass'; ecoFiltro.frequency.value = 1500;
  eco.connect(ecoFiltro).connect(ecoVuelta).connect(eco); ecoFiltro.connect(busMusica);
  // El ruido: 2 segundos de "sssh" que se repiten (de ahí salen el viento y el aire de los ductos)
  const ruidoBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), datos = ruidoBuf.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < datos.length; i++) { ultimo = (ultimo + 0.02 * (Math.random() * 2 - 1)) / 1.02; datos[i] = ultimo * 3.5; }   // ruido "café": más grave y suave que el blanco
  const blancoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), blanco = blancoBuf.getChannelData(0);
  for (let i = 0; i < blanco.length; i++) blanco[i] = Math.random() * 2 - 1;   // ruido blanco: para chispas y crujidos
  const capas = new Map();
  let actual = null;

  const rampa = (param, valor, seg) => { const t = ahora(); param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(valor, t + seg); };
  // Una "respiración" lenta: sube y baja un parámetro un poquito, para que nada suene quieto
  function respirar(param, frec, cuanto, nodos) {
    const lfo = ctx.createOscillator(); lfo.frequency.value = frec;
    const g = ctx.createGain(); g.gain.value = cuanto;
    lfo.connect(g).connect(param); lfo.start(); nodos.push(lfo);
  }

  function crearCapa(id) {
    const p = PAISAJES[id], nodos = [];
    const salM = ctx.createGain(), salA = ctx.createGain();   // el volumen de esta capa (0 = callada, 1 = sonando)
    salM.gain.value = 0; salA.gain.value = 0; salM.connect(busMusica); salA.connect(busAmbiente);
    // El colchón (pad): las notas del acorde, cada una con dos osciladores un pelín desafinados (así "flota")
    const filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.value = p.brillo; filtro.Q.value = 0.4;
    const pad = ctx.createGain(); pad.gain.value = p.pad * 0.12; filtro.connect(pad).connect(salM);
    respirar(filtro.frequency, 0.05 + Math.random() * 0.03, p.brillo * 0.25, nodos);
    respirar(pad.gain, 0.07, p.pad * 0.03, nodos);
    for (const semi of p.acorde) for (const des of [-4, 4]) {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = nota(p.raiz, semi); o.detune.value = des;
      o.connect(filtro); o.start(); nodos.push(o);
    }
    // El dron: una nota muy grave (una octava debajo de la raíz)
    if (p.dron) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = p.raiz / 2;
      const g = ctx.createGain(); g.gain.value = p.dron * 0.35; o.connect(g).connect(salA); o.start(); nodos.push(o);
      respirar(g.gain, 0.04, p.dron * 0.08, nodos);
    }
    // El ruido filtrado: viento, aire o el zumbido de las máquinas
    if (p.ruido) {
      const r = ctx.createBufferSource(); r.buffer = ruidoBuf; r.loop = true;
      const f = ctx.createBiquadFilter(); f.type = p.ruido.tipo; f.frequency.value = p.ruido.frec; f.Q.value = p.ruido.tipo === 'bandpass' ? 0.8 : 0.5;
      const g = ctx.createGain(); g.gain.value = p.ruido.vol * 0.6;
      r.connect(f).connect(g).connect(salA); r.start(); nodos.push(r);
      respirar(g.gain, 0.06 + Math.random() * 0.04, p.ruido.vol * 0.2, nodos);   // el viento va y viene
      respirar(f.frequency, 0.03, p.ruido.frec * 0.2, nodos);
    }
    const sonidos = (p.sonidos || []).map(x => ({ ...x, espera: 1.5 + esperaSonido(x) * 0.5 }));   // (el primero sale pronto, para que se note la zona)
    return { id, p, nodos, salM, salA, filtro, sonidos, espera: 1 + Math.random() * 2, apagarEn: null };
  }

  // Una nota suelta: entra suave y se apaga despacio (nada de golpes)
  function tocar(capa) {
    const { frec, espera } = proximaNota(capa.p);
    const t = ahora(), dur = 2.6;
    const o = ctx.createOscillator(); o.type = capa.p.onda; o.frequency.value = frec;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = capa.p.brillo * 1.4;
    o.connect(f).connect(g); g.connect(capa.salM); g.connect(eco);
    o.start(t); o.stop(t + dur + 0.1);
    capa.espera = espera;
  }

  // ---------- Los ruiditos de cada zona (todos cortos y bajitos) ----------
  const azar = (a, b) => a + Math.random() * (b - a);
  // Un "tono": un oscilador con su volumen que sube y se apaga (frecs: [inicio, final] para que la nota resbale)
  function tono(salida, t, { onda = 'sine', frecs, dur, vol, ataque = 0.01, eco: conEco = false }) {
    const o = ctx.createOscillator(); o.type = onda; o.frequency.setValueAtTime(frecs[0], t);
    if (frecs[1]) o.frequency.exponentialRampToValueAtTime(frecs[1], t + dur * 0.8);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + ataque); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(salida); if (conEco) g.connect(ecoAmb);
    o.start(t); o.stop(t + dur + 0.05);
  }
  // Un "soplo" de ruido filtrado (crujidos, chispas, ráfagas de viento)
  function soplo(salida, t, { buf = ruidoBuf, tipo = 'bandpass', frecs, q = 1, dur, vol, ataque = 0.01 }) {
    const r = ctx.createBufferSource(); r.buffer = buf; r.loop = true;
    const f = ctx.createBiquadFilter(); f.type = tipo; f.Q.value = q; f.frequency.setValueAtTime(frecs[0], t);
    if (frecs[1]) f.frequency.exponentialRampToValueAtTime(frecs[1], t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + ataque); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    r.connect(f).connect(g).connect(salida); r.start(t, Math.random()); r.stop(t + dur + 0.05);
  }
  const SONIDOS = {
    gota: (s, t) => tono(s, t, { frecs: [azar(1100, 1500), azar(450, 600)], dur: 0.25, vol: 0.05, ataque: 0.004, eco: true }),   // plip… (con eco de cueva)
    grillo: (s, t) => { const f = azar(2600, 3000); for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) tono(s, t + i * 0.07, { frecs: [f], dur: 0.04, vol: 0.006, ataque: 0.005 }); },
    pajaro: (s, t) => { for (let i = 0; i < 2; i++) tono(s, t + i * 0.22, { frecs: [azar(1700, 2000), azar(2300, 2700)], dur: 0.14, vol: 0.012, ataque: 0.02 }); },
    pitido: (s, t) => { const f = azar(700, 950); for (let i = 0; i < 2; i++) tono(s, t + i * 0.2, { frecs: [f], dur: 0.1, vol: 0.014, ataque: 0.01 }); },   // una máquina del laboratorio
    burbuja: (s, t) => { for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) tono(s, t + i * azar(0.1, 0.25), { frecs: [azar(180, 260), azar(500, 750)], dur: 0.09, vol: 0.03, ataque: 0.005 }); },
    crujido: (s, t) => soplo(s, t, { frecs: [azar(260, 340), azar(160, 200)], q: 9, dur: azar(0.5, 0.9), vol: 0.35, ataque: 0.15 }),   // la madera que cruje
    chispa: (s, t) => { for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) soplo(s, t + i * azar(0.03, 0.09), { buf: blancoBuf, tipo: 'highpass', frecs: [2500], dur: 0.03, vol: 0.02, ataque: 0.002 }); },
    tic: (s, t) => tono(s, t, { onda: 'triangle', frecs: [azar(1300, 1700)], dur: 0.06, vol: 0.02, ataque: 0.002, eco: true }),   // el metal que se enfría
    rafaga: (s, t) => soplo(s, t, { tipo: 'lowpass', frecs: [azar(300, 400), azar(800, 1000)], q: 0.7, dur: azar(2.5, 3.5), vol: 0.25, ataque: 1.4 }),   // una ráfaga de viento que va y viene
    tintineo: (s, t) => { const f = azar(1500, 1900); tono(s, t, { frecs: [f], dur: 0.7, vol: 0.008 }); tono(s, t, { frecs: [f * 1.26], dur: 0.6, vol: 0.006 }); },
  };
  // El eco de los ruiditos (más corto que el de la música): las gotas y los tics suenan "en un lugar grande"
  const ecoAmb = ctx.createDelay(1); ecoAmb.delayTime.value = 0.28;
  const ecoAmbVuelta = ctx.createGain(); ecoAmbVuelta.gain.value = 0.3;
  ecoAmb.connect(ecoAmbVuelta).connect(ecoAmb); ecoAmbVuelta.connect(busAmbiente);

  function apagar(capa) { for (const n of capa.nodos) { try { n.stop(); } catch (e) {} n.disconnect(); } capa.salM.disconnect(); capa.salA.disconnect(); capas.delete(capa.id); }

  return {
    ctx,
    get actual() { return actual; },
    zona(id) {
      if (id === actual || (id && !PAISAJES[id])) return;
      for (const c of capas.values()) if (c.id !== id) { rampa(c.salM.gain, 0, CRUCE_SEGUNDOS); rampa(c.salA.gain, 0, CRUCE_SEGUNDOS); c.apagarEn = ahora() + CRUCE_SEGUNDOS + 0.2; }
      actual = id;
      if (!id) return;
      const c = capas.get(id) || crearCapa(id);   // si volviste rápido, la capa todavía estaba sonando bajito: se reusa
      capas.set(id, c); c.apagarEn = null;
      rampa(c.salM.gain, 1, CRUCE_SEGUNDOS); rampa(c.salA.gain, 1, CRUCE_SEGUNDOS);
    },
    // 🐾 Un paso de un dragón: vol de 0 a 1 (ver volumenPaso), lado de -1 (izquierda) a 1 (derecha)
    paso(id, vol, lado = 0) {
      const p = PASOS[id];
      if (!p || vol <= 0.002 || ctx.state !== 'running') return;
      const t = ahora() + 0.01, salida = ctx.createGain(); salida.gain.value = vol * 0.9;
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) { pan.pan.value = lado * 0.8; salida.connect(pan).connect(busAmbiente); } else salida.connect(busAmbiente);
      tono(salida, t, { frecs: [p.grave, p.cae], dur: p.dur, vol: 0.5, ataque: 0.004 });   // el golpe
      if (p.ruido) soplo(salida, t, { buf: blancoBuf, tipo: 'lowpass', frecs: [p.filtro, p.filtro * 0.5], q: 0.8, dur: p.dur * 0.6, vol: p.ruido, ataque: 0.002 });   // el roce
      if (p.extra === 'retumbo') tono(salida, t + 0.02, { frecs: [31, 24], dur: 0.7, vol: 0.35, ataque: 0.03 });   // 🔴 el piso retumba
      if (p.extra === 'uñas') soplo(salida, t + 0.015, { buf: blancoBuf, tipo: 'highpass', frecs: [4200], dur: 0.02, vol: 0.18, ataque: 0.001 });   // ⚫ tic de uñas
      if (p.extra === 'amenaza') { tono(salida, t, { frecs: [58], dur: 0.5, vol: 0.12, ataque: 0.08 }); tono(salida, t, { frecs: [61.5], dur: 0.5, vol: 0.1, ataque: 0.08 }); }   // 🟡 dos notas graves que chocan: da miedito
      if (p.extra === 'gelatina') tono(salida, t + 0.03, { onda: 'sine', frecs: [180, 120], dur: 0.12, vol: 0.12, ataque: 0.01 });   // ⚪ "blop" blandito
      setTimeout(() => { try { salida.disconnect(); if (pan) pan.disconnect(); } catch (e) {} }, 1500);
    },
    volumen(ajustes) { const v = volumenes(ajustes); rampa(busMusica.gain, v.musica, 0.3); rampa(busAmbiente.gain, v.ambiente, 0.3); },
    agachar(si) { rampa(maestro.gain, si ? 0.15 : 1, si ? 0.3 : 2); },
    tick(dt) {
      if (ctx.state === 'suspended') return;
      for (const c of [...capas.values()]) {
        if (c.apagarEn !== null) { if (ahora() >= c.apagarEn) apagar(c); continue; }
        c.espera -= dt;
        if (c.espera <= 0) tocar(c);
        for (const x of c.sonidos) {
          x.espera -= dt;
          if (x.espera <= 0) { SONIDOS[x.tipo](c.salA, ahora() + 0.02); x.espera = esperaSonido(x); }
        }
      }
    },
    reanudar() { if (ctx.state === 'suspended') ctx.resume(); },
    // Qué tan fuerte está sonando ahora (0 = nada · 1 = el máximo posible). Sirve para revisar que nunca suene fuerte
    nivel() {
      if (!this.medidor) { this.medidor = ctx.createAnalyser(); this.medidor.fftSize = 2048; maestro.connect(this.medidor); }
      const d = new Float32Array(this.medidor.fftSize); this.medidor.getFloatTimeDomainData(d);
      let pico = 0, suma = 0; for (const v of d) { pico = Math.max(pico, Math.abs(v)); suma += v * v; }
      return { pico, rms: Math.sqrt(suma / d.length), capas: capas.size };
    },
  };
}

// Lógica pura del juego (sin Three.js ni DOM), para poder probarla con tests.

// ---------- Choques contra paredes, pisos y muebles ----------
// Cajas fijas alineadas a los ejes: { x, z, hw, hd, top, bottom }.
// st = { pos: {x,y,z}, vel: {x,z}, onGround, prevX, prevZ }. Saca al cuerpo de cualquier caja que atraviese.
// El lado hacia el que se empuja sale de dónde estaba antes (prevX/prevZ), así nunca "salta" al otro lado de una pared.
export function collideWalls(st, boxes, { PR, H, STEP_UP }) {
  let hit = false;
  for (const pl of boxes) {
    const y = st.pos.y;
    if (y >= pl.top - 0.05 || y + H <= pl.bottom) continue;
    const dx = st.pos.x - pl.x, dz = st.pos.z - pl.z;
    const ox = pl.hw + PR - Math.abs(dx), oz = pl.hd + PR - Math.abs(dz);
    if (ox <= 0 || oz <= 0) continue;
    // Escalón bajito: se sube solo caminando
    if (st.onGround && pl.top - y <= STEP_UP) { st.pos.y = pl.top; continue; }
    const px = (st.prevX ?? st.pos.x) - pl.x, pz = (st.prevZ ?? st.pos.z) - pl.z;
    const wasInX = Math.abs(px) < pl.hw + PR - 1e-6, wasInZ = Math.abs(pz) < pl.hd + PR - 1e-6;
    let alongX;
    if (wasInZ && !wasInX) alongX = true;        // llegó por el lado x
    else if (wasInX && !wasInZ) alongX = false;  // llegó por el lado z
    else alongX = ox < oz;                       // ya estaba dentro: sale por el lado más cercano
    if (alongX) { st.pos.x = pl.x + (Math.sign(wasInX ? dx : px) || 1) * (pl.hw + PR); st.vel.x = 0; }
    else { st.pos.z = pl.z + (Math.sign(wasInZ ? dz : pz) || 1) * (pl.hd + PR); st.vel.z = 0; }
    hit = true;
  }
  return hit;
}

// Mueve un cuerpo (tx, tz) en pasitos de máximo 0,2 m, chocando en cada uno: así no atraviesa paredes aunque vaya muy rápido.
export function moveAndCollide(st, tx, tz, boxes, opts) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(tx), Math.abs(tz)) / 0.2));
  let hit = false;
  for (let i = 0; i < n; i++) {
    st.prevX = st.pos.x; st.prevZ = st.pos.z;
    st.pos.x += tx / n; st.pos.z += tz / n;
    if (collideWalls(st, boxes, opts)) hit = true;
  }
  return hit;
}

// ---------- Estirar y aplastar al saltar (como en los dibujos animados) ----------
// En el aire el personaje se estira un poquito (más mientras más rápido sube o cae);
// al caer al piso se aplasta un instante y vuelve a la normalidad. Lo de ancho cambia al revés,
// para que parezca de goma y no "crezca": si se estira hacia arriba, se adelgaza.
export const SQUASH = { stretchPerSpeed: 0.012, maxStretch: 0.16, landSquash: 0.2, landTime: 0.18 };
export function squashStretch(vy, airborne, landT) {
  let tall = 1;
  if (airborne) tall = 1 + Math.min(SQUASH.maxStretch, Math.abs(vy) * SQUASH.stretchPerSpeed);
  else if (landT < SQUASH.landTime) tall = 1 - SQUASH.landSquash * (1 - landT / SQUASH.landTime);
  return { tall, wide: 1 / Math.sqrt(tall) };
}

// 🧭 Hacia dónde mirar: si se está moviendo (más de 0,5 m/s de costado), hacia donde camina; si no, hacia donde dice su "rot"
// (así un amigo que manda siempre el mismo giro igual camina mirando para adelante, y no "deslizándose" de lado)
export const rumboDeMovimiento = (vx, vz, rot, umbral = 0.5) => (Math.hypot(vx, vz) > umbral ? Math.atan2(vx, vz) : rot);

// ---------- Guardado (localStorage) ----------
// Por ahora solo se guarda dónde estás. Cuando haya más cosas (dragones, colores…), se agregan aquí.
export const normalizeName = name => String(name).trim().replace(/\s+/g, ' ').toLowerCase();
export const saveKey = name => `color-dragons:partida:${normalizeName(name)}`;
export const serializeSave = ({ pos }) => JSON.stringify({ v: 1, pos: { x: pos.x, y: pos.y, z: pos.z } });
// Lee un guardado. Si está roto o es raro, devuelve null (y el juego empieza de cero)
export function parseSave(text) {
  let d;
  try { d = JSON.parse(text); } catch (e) { return null; }
  if (!d || typeof d !== 'object') return null;
  const p = d.pos, ok = p && [p.x, p.y, p.z].every(n => typeof n === 'number' && Number.isFinite(n));
  return { pos: ok ? { x: p.x, y: p.y, z: p.z } : null };
}

// ---------- 🤖 El bot guía: un cubito que te sigue y te explica el juego ----------
// Lo que dice cuando pulsas «¿Cómo juego?» (en el celular no hay teclas: nombra los botones)
export const GUIA_COMO = {
  teclado: 'Para moverte usa WASD, las flechas izquierda/derecha (o arrastrar el mouse) para mover la cámara, y ESPACIO para saltar. B = meterte en una caja o en el armario (y salir) · en una escotilla, W sube por la escalera y S baja · V = primera persona · ENTER = abrir o cerrar este diálogo · H = esconderme o llamarme · C = cambiar mi color. Para guardar, pulsa el botón verde GUARDAR.',
  touch: 'Para moverte usa el círculo de abajo a la izquierda, arrastra el dedo (o el círculo CÁMARA) para mover la cámara, y toca SALTAR para saltar. Cerca de una caja aparece 📦 Esconderse. En una escotilla, empuja el círculo hacia arriba para subir por la escalera. El botón 🤖 Guía abre o cierra este diálogo. Para guardar, toca GUARDAR.',
};
// Lo que dice cuando pulsas «¿Qué tengo que hacer?», según dónde estás (por ahora solo hay un lugar)
export const GUIA_QUE_HAGO = {
  mundo: 'Estás en el laboratorio. Explóralo con tus amigos: el Test Lab, el Spawn, los Baños, los Lockers, el Panic Hole y el Center Lab. Por las escotillas (en el Test Lab y en los Lockers) se baja a los subsuelos, y abajo hay túneles que los unen. Si algo te da miedo, métete en una caja. (Los dragones todavía no llegan… 🐉)',
};
export const textoQueHago = lugar => GUIA_QUE_HAGO[lugar] || GUIA_QUE_HAGO.mundo;
// Colores del bot guía: C pasa al siguiente (y después del último vuelve al primero)
export const GUIA_COLORES = [0xffffff, 0x64d2ff, 0xffd60a, 0xff6bb5, 0x9b6bff, 0xff8a3d];
export const siguienteColorGuia = i => (i + 1) % GUIA_COLORES.length;

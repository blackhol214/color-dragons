// 🪙 Tu cuenta: monedas, tu color y tus cajas (lógica pura, sin Three.js: así los tests la pueden revisar).
// Cada noche ganada da monedas en secreto (sin avisar). En la tienda del lobby se compran cajas.
// Si entras a la tienda sin monedas suficientes, el tendero te echa (y sales volando unos metros).

export const MONEDAS_POR_NOCHE = 10;

// Las cajas que existen. La de cartón la tienes siempre (es gratis)
export const CAJAS = [
  { id: 'carton', nombre: 'Caja de cartón', precio: 0 },
  { id: 'espacial', nombre: 'Caja espacial', precio: 15 },
  { id: 'regalo', nombre: 'Caja de Navidad', precio: 20 },     // 🎁 papel rojo con cinta dorada y moño
  { id: 'playa', nombre: 'Caja mojada', precio: 20 },          // 🏖️ como una playa (y brilla de mojada)
  { id: 'piedra', nombre: 'Piedra mascota', precio: 30 },      // 🪨 pixelada, con ojos de punto (para "Raise a Pet Rock", el próximo juego)
];
export const cajaDe = id => CAJAS.find(c => c.id === id) || null;

// 🎨 La paleta del balde de pintura
export const PALETA = [
  // verdes
  0x2fae4e, 0x0f6b2e, 0x7ad34f, 0xb6f08a, 0x2ec4b6, 0x0f8a7a,
  // azules y celestes
  0x3d8bff, 0x1b3fa8, 0x7fd8ff, 0x0aa5d8, 0x5b6cff, 0xbfe6ff,
  // morados y rosas
  0x9b6bff, 0x5a2ca0, 0xd29bff, 0xe85da8, 0xff9fd2, 0xb0125b,
  // rojos y naranjas
  0xd9534f, 0x8f1d1d, 0xff3b30, 0xff7f50, 0xff9f1a, 0xffc68a,
  // amarillos y cafés
  0xe8b23a, 0xffe14a, 0xfff3a0, 0x8b5a2b, 0x5a3a1c, 0xc8a27a,
  // blancos, grises y negro
  0xf2f2f2, 0xc9ccd1, 0x8a8f96, 0x55595e, 0x3a3a3a, 0x111111,
];
export const COLOR_INICIAL = PALETA[0];   // todos empiezan verdes (después cada uno se pinta en el balde)

// ✨ Los caminos (trails): una estela que dejas al caminar, para verte fachero. Ninguno viene gratis
export const CAMINOS = [
  { id: 'amarillo', precio: 10 },    // una línea amarilla en el piso
  { id: 'fuego', precio: 25 },       // llamitas que suben
  { id: 'electrico', precio: 25 },   // rayos
];
export const caminoDe = id => CAMINOS.find(c => c.id === id) || null;

// 🥚 Las mascotas: salen de un huevo (10 monedas). Cada una tiene su probabilidad (prob, en %): las 3 primeras son comunes,
// las otras 3 son raras. Las repetidas se pueden vender (venta = monedas que te dan). La que llevas te sigue como el bot guía
export const PRECIO_HUEVO = 10;
export const MASCOTAS = [
  { id: 'ganso', prob: 30, rara: false, venta: 3 },
  { id: 'oso', prob: 25, rara: false, venta: 3 },
  { id: 'planta', prob: 25, rara: false, venta: 3 },
  { id: 'fantasma', prob: 10, rara: true, venta: 6 },
  { id: 'miniYellow', prob: 7, rara: true, venta: 8 },
  { id: 'arcoiris', prob: 3, rara: true, venta: 15 },   // ¡legendaria!
];
export const mascotaDe = id => MASCOTAS.find(m => m.id === id) || null;
// Elige una mascota según las probabilidades: un número al azar de 0 a 100 y se ve en qué "pedazo" cae
// (ganso: 0–30, oso: 30–55, planta: 55–80, fantasma: 80–90, mini Yellow: 90–97, arcoíris: 97–100)
export function sacarMascota(azar = Math.random) {
  let n = azar() * 100;
  for (const m of MASCOTAS) { if (n < m.prob) return m.id; n -= m.prob; }
  return MASCOTAS[MASCOTAS.length - 1].id;
}
export function abrirHuevo(cuenta, azar = Math.random) {
  if (cuenta.monedas < PRECIO_HUEVO) return { ok: false, motivo: 'no-alcanza', cuenta };
  const id = sacarMascota(azar), mascotas = { ...cuenta.mascotas, [id]: (cuenta.mascotas[id] || 0) + 1 };
  return { ok: true, id, nueva: !cuenta.mascotas[id], cuenta: { ...cuenta, monedas: cuenta.monedas - PRECIO_HUEVO, mascotas, mascota: cuenta.mascota || id } };
}
// Vender una repetida (siempre te queda al menos una)
export function venderRepetida(cuenta, id) {
  const m = mascotaDe(id), n = cuenta.mascotas[id] || 0;
  if (!m || n < 2) return { ok: false, cuenta };
  return { ok: true, cuenta: { ...cuenta, monedas: cuenta.monedas + m.venta, mascotas: { ...cuenta.mascotas, [id]: n - 1 } } };
}
// Llevar una mascota que tienes (o ninguna: null)
export const llevarMascota = (cuenta, id) => (id === null || cuenta.mascotas[id] ? { ...cuenta, mascota: id } : cuenta);

export const nuevaCuenta = () => ({ monedas: 0, color: COLOR_INICIAL, cajas: ['carton'], caja: 'carton', caminos: [], camino: null, mascotas: {}, mascota: null });

// Ganaste una noche: monedas en secreto
export const ganarNoche = cuenta => ({ ...cuenta, monedas: cuenta.monedas + MONEDAS_POR_NOCHE });

export const pintar = (cuenta, color) => (PALETA.includes(color) ? { ...cuenta, color } : cuenta);

// ¿Te deja entrar a la tienda? Sí, si te alcanza para alguna caja que no tienes (o si ya las tienes todas: entras a elegir)
export function puedeEntrar(cuenta) {
  const faltan = CAJAS.filter(c => !cuenta.cajas.includes(c.id));
  return faltan.length === 0 || faltan.some(c => c.precio <= cuenta.monedas);
}

// Comprar una caja: si te alcanza y no la tienes, se descuentan las monedas y te la pones
export function comprar(cuenta, id) {
  const c = cajaDe(id);
  if (!c) return { ok: false, motivo: 'no-existe', cuenta };
  if (cuenta.cajas.includes(id)) return { ok: false, motivo: 'ya-la-tienes', cuenta };
  if (cuenta.monedas < c.precio) return { ok: false, motivo: 'no-alcanza', cuenta };
  return { ok: true, cuenta: { ...cuenta, monedas: cuenta.monedas - c.precio, cajas: [...cuenta.cajas, id], caja: id } };
}

// La tienda de caminos: te deja entrar si te alcanza para alguno que no tienes (o si ya los tienes todos)
export function puedeEntrarCaminos(cuenta) {
  const faltan = CAMINOS.filter(c => !cuenta.caminos.includes(c.id));
  return faltan.length === 0 || faltan.some(c => c.precio <= cuenta.monedas);
}
export function comprarCamino(cuenta, id) {
  const c = caminoDe(id);
  if (!c) return { ok: false, motivo: 'no-existe', cuenta };
  if (cuenta.caminos.includes(id)) return { ok: false, motivo: 'ya-lo-tienes', cuenta };
  if (cuenta.monedas < c.precio) return { ok: false, motivo: 'no-alcanza', cuenta };
  return { ok: true, cuenta: { ...cuenta, monedas: cuenta.monedas - c.precio, caminos: [...cuenta.caminos, id], camino: id } };
}
// Ponerte un camino que tienes (o quitártelo: null)
export const ponerCamino = (cuenta, id) => (id === null || cuenta.caminos.includes(id) ? { ...cuenta, camino: id } : cuenta);

// Ponerte una caja que ya tienes
export const ponerCaja = (cuenta, id) => (cuenta.cajas.includes(id) ? { ...cuenta, caja: id } : cuenta);

// 💀 Te atrapó un dragón: pierdes la noche… a menos que pagues 20 monedas para seguir
export const COSTO_SEGUIR = 20;
export function pagarParaSeguir(cuenta) {
  if (cuenta.monedas < COSTO_SEGUIR) return { ok: false, cuenta };
  return { ok: true, cuenta: { ...cuenta, monedas: cuenta.monedas - COSTO_SEGUIR } };
}

// Lee la cuenta de un guardado (si algo está raro, lo arregla en vez de romper el juego)
export function leerCuenta(d) {
  const c = nuevaCuenta();
  if (!d || typeof d !== 'object') return c;
  if (Number.isInteger(d.monedas) && d.monedas >= 0 && d.monedas <= 100000) c.monedas = d.monedas;
  if (PALETA.includes(d.color)) c.color = d.color;
  if (Array.isArray(d.cajas)) c.cajas = ['carton', ...new Set(d.cajas.filter(id => id !== 'carton' && cajaDe(id)))];
  if (c.cajas.includes(d.caja)) c.caja = d.caja;
  if (Array.isArray(d.caminos)) c.caminos = [...new Set(d.caminos.filter(id => caminoDe(id)))];
  if (c.caminos.includes(d.camino)) c.camino = d.camino;
  if (d.mascotas && typeof d.mascotas === 'object') for (const m of MASCOTAS) { const n = d.mascotas[m.id]; if (Number.isInteger(n) && n > 0 && n < 10000) c.mascotas[m.id] = n; }
  if (c.mascotas[d.mascota]) c.mascota = d.mascota;
  return c;
}

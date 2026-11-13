// 🪙 Tu cuenta: monedas, tu color y tus cajas (lógica pura, sin Three.js: así los tests la pueden revisar).
// Cada noche ganada da monedas en secreto (sin avisar). En la tienda del lobby se compran cajas.
// Si entras a la tienda sin monedas suficientes, el tendero te echa (y sales volando unos metros).

export const MONEDAS_POR_NOCHE = 10;

// Las cajas que existen. La de cartón la tienes siempre (es gratis)
export const CAJAS = [
  { id: 'carton', nombre: 'Caja de cartón', precio: 0 },
  { id: 'espacial', nombre: 'Caja espacial', precio: 15 },
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

export const nuevaCuenta = () => ({ monedas: 0, color: COLOR_INICIAL, cajas: ['carton'], caja: 'carton' });

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
  return c;
}

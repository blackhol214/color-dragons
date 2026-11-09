// 🧪 El laboratorio de Color Dragons (diseño de Mathias, dibujado visto desde arriba).
// Aquí solo está el PLANO (datos puros, sin Three.js): qué salas hay, dónde están sus puertas, las escotillas y los escondites.
// index.html lee este plano y lo construye en 3D. Así los tests pueden revisar que toda puerta lleve a algún lado.
//
// Coordenadas: x crece hacia el este (derecha del dibujo) y z hacia el sur (abajo del dibujo). En metros.
// Cada sala es un rectángulo { x0, x1, z0, z1 } en su piso (y). Sus puertas son huecos en sus paredes:
//   n (norte, z = z0) y s (sur, z = z1) → tramos en x · e (este, x = x1) y w (oeste, x = x0) → tramos en z

export const ALTO = 4;           // de piso a techo
export const PISO_PRINCIPAL = 0;
export const PISO_SUBSUELO = -7; // los dos subsuelos están a la misma profundidad (así se pueden unir con pasillos)
export const ALTO_PUERTA = 3;

// Los colores son apagados: es un laboratorio. pared = tinte de las paredes · piso = tinte de las baldosas
export const SALAS = [
  // ---------- Piso principal ----------
  { id: 'testLab', nombre: 'Test Lab', y: 0, x0: -36, x1: -14, z0: -30, z1: -18, pared: 0x8c9a9b, piso: 0x5d6a6c,
    puertas: { s: [[-26, -22]], e: [[-26, -22]] } },
  { id: 'spawn', nombre: 'Spawn', y: 0, x0: -14, x1: 6, z0: -30, z1: -18, pared: 0x9a9890, piso: 0x66645e,
    puertas: { w: [[-26, -22]], s: [[-6, -2]] } },
  { id: 'escaleras', nombre: 'Escaleras del spawn', y: 0, x0: -6, x1: -2, z0: -18, z1: -12, pared: 0x868a8c, piso: 0x5a5e61,
    puertas: { n: [[-6, -2]], s: [[-6, -2]] } },
  { id: 'pasilloNorte', nombre: 'Pasillo norte', y: 0, x0: -22, x1: 14, z0: -12, z1: -8, pared: 0x868a8c, piso: 0x5a5e61,
    puertas: { n: [[-6, -2]], w: [[-12, -8]], e: [[-12, -8]] } },
  { id: 'pasilloOeste', nombre: 'Pasillo oeste', y: 0, x0: -26, x1: -22, z0: -18, z1: 4, pared: 0x868a8c, piso: 0x5a5e61,
    puertas: { n: [[-26, -22]], e: [[-12, -8], [-2, 2]], s: [[-26, -22]] } },
  { id: 'panico', nombre: 'Panic Hole', y: 0, x0: -34, x1: -22, z0: 4, z1: 20, pared: 0x97817c, piso: 0x6a5c58,
    puertas: { n: [[-26, -22]], e: [[8, 11]] } },
  { id: 'salon', nombre: 'Salón central', y: 0, x0: -22, x1: 14, z0: -4, z1: 12, pared: 0x8a8d93, piso: 0x5f6268,
    puertas: { w: [[-2, 2], [8, 11]], e: [[2, 6]] } },
  { id: 'banos', nombre: 'Baños', y: 0, x0: 14, x1: 26, z0: -30, z1: -8, pared: 0xa7aaa5, piso: 0x7b807c,
    puertas: { w: [[-12, -8]], s: [[15, 19]] } },
  { id: 'pasilloEste', nombre: 'Pasillo este', y: 0, x0: 14, x1: 20, z0: -8, z1: 14, pared: 0x868a8c, piso: 0x5a5e61,
    puertas: { n: [[15, 19]], w: [[2, 6]], e: [[0, 4]], s: [[15, 19]] } },
  { id: 'lockers', nombre: 'Lockers', y: 0, x0: 20, x1: 32, z0: -8, z1: 10, pared: 0x7d8a7a, piso: 0x5c6159,
    puertas: { w: [[0, 4]] } },
  { id: 'centerLab', nombre: 'Center Lab', y: 0, x0: -10, x1: 30, z0: 14, z1: 32, pared: 0x8f979f, piso: 0x60666c,
    puertas: { n: [[15, 19]] } },

  // ---------- Subsuelos (y túneles para conectarlos) ----------
  { id: 'greyCove', nombre: "Grey's Cove", y: -7, x0: -52, x1: -30, z0: -32, z1: -16, pared: 0x6f7275, piso: 0x4e5153,
    puertas: { e: [[-22, -19]], s: [[-46, -42]] } },
  { id: 'yellowRoom', nombre: 'Cuarto de Yellow', y: -7, x0: 26, x1: 52, z0: 2, z1: 10, pared: 0x9a9172, piso: 0x6a6450,
    puertas: { n: [[36, 40]], s: [[26, 30]] } },
  { id: 'tunelNorte', nombre: 'Túnel norte', y: -7, x0: -30, x1: 36, z0: -22, z1: -19, pared: 0x5f6466, piso: 0x45494b,
    puertas: { w: [[-22, -19]], e: [[-22, -19]], s: [[-6, -2]] } },
  { id: 'tunelEste', nombre: 'Túnel este', y: -7, x0: 36, x1: 40, z0: -22, z1: 2, pared: 0x5f6466, piso: 0x45494b,
    puertas: { w: [[-22, -19]], s: [[36, 40]] } },
  { id: 'tunelCentro', nombre: 'Túnel del centro', y: -7, x0: -6, x1: -2, z0: -19, z1: 16, pared: 0x5f6466, piso: 0x45494b,
    puertas: { n: [[-6, -2]], s: [[-6, -2]] } },
  { id: 'tunelOeste', nombre: 'Túnel oeste', y: -7, x0: -46, x1: -42, z0: -16, z1: 20, pared: 0x5f6466, piso: 0x45494b,
    puertas: { n: [[-46, -42]], e: [[16, 20]] } },
  { id: 'tunelSur', nombre: 'Túnel sur', y: -7, x0: -42, x1: 30, z0: 16, z1: 20, pared: 0x5f6466, piso: 0x45494b,
    puertas: { w: [[16, 20]], n: [[-6, -2], [26, 30]] } },
  { id: 'tunelYellow', nombre: 'Túnel a Yellow', y: -7, x0: 26, x1: 30, z0: 10, z1: 16, pared: 0x5f6466, piso: 0x45494b,
    puertas: { n: [[26, 30]], s: [[26, 30]] } },
];

// Escotillas: un hoyo en el piso principal con una escalera de mano que baja al subsuelo
export const ESCOTILLAS = [
  { id: 'aGrey', desde: 'testLab', hacia: 'greyCove', x0: -35.6, x1: -33.2, z0: -26.2, z1: -23.8 },
  { id: 'aYellow', desde: 'lockers', hacia: 'yellowRoom', x0: 28.4, x1: 30.8, z0: 5.8, z1: 8.2 },
];

// Dónde apareces: en el centro del Spawn (sobre el sol)
export const SPAWN = { x: -4, y: 0, z: -24 };

// 📦 Escondites: las cajas (y el armario de Yellow). Con B te metes y con B sales
export const ESCONDITES = [
  { tipo: 'caja', x: -31, z: -20.2, y: 0 }, { tipo: 'caja', x: -17, z: -28, y: 0 },          // Test Lab
  { tipo: 'caja', x: 3.6, z: -20.4, y: 0 },                                                   // Spawn
  { tipo: 'caja', x: -18.6, z: -2.2, y: 0 }, { tipo: 'caja', x: 11.4, z: 9.6, y: 0 }, { tipo: 'caja', x: -10, z: 9.8, y: 0 },   // Salón
  { tipo: 'caja', x: -31.4, z: 17.4, y: 0 }, { tipo: 'caja', x: -31.6, z: 6.6, y: 0 },      // Panic Hole
  { tipo: 'caja', x: 24, z: 7.6, y: 0 },                                                      // Lockers
  { tipo: 'caja', x: -7.4, z: 29.4, y: 0 }, { tipo: 'caja', x: 27.4, z: 29.4, y: 0 },       // Center Lab
  { tipo: 'caja', x: 39, z: -10, y: -7 }, { tipo: 'caja', x: -38, z: 19.2, y: -7 },     // túneles
  { tipo: 'caja', x: -49.4, z: -29.4, y: -7 },                                                // Grey's Cove
  { tipo: 'armario', x: 34, z: 2.9, y: -7 },                                                  // el armario para esconderse (cuarto de Yellow)
];
export const DIST_ESCONDITE = 1.9;   // qué tan cerca tienes que estar para meterte

const dentro = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

// ¿En qué sala estás? (null = en ninguna: te caíste del mapa)
export function salaEn(x, y, z) {
  return SALAS.find(s => dentro(s, x, z) && y >= s.y - 0.5 && y <= s.y + ALTO) || null;
}

// La escotilla en la que estás parado (o colgado de su escalera), o null. y: de un piso al otro
export function escotillaEn(x, y, z) {
  return ESCOTILLAS.find(e => dentro(e, x, z) && y >= PISO_SUBSUELO - 0.2 && y <= PISO_PRINCIPAL + 0.8) || null;
}

// El escondite más cercano (si estás lo bastante cerca y en el mismo piso), o null
export function esconditeCerca(x, y, z, lista = ESCONDITES, max = DIST_ESCONDITE) {
  let mejor = null, mejorD = max;
  for (const e of lista) {
    const d = Math.hypot(x - e.x, z - e.z);
    if (d <= mejorD && Math.abs(y - e.y) < 1.2) { mejor = e; mejorD = d; }
  }
  return mejor;
}

// Los tramos de pared que quedan después de abrir las puertas. Ej: pared de 0 a 10 con puerta [4, 6] → [[0, 4], [6, 10]]
export function tramosDePared(desde, hasta, puertas = []) {
  const tramos = [];
  let x = desde;
  for (const [a, b] of [...puertas].sort((p, q) => p[0] - q[0])) {
    if (a > x) tramos.push([x, a]);
    x = Math.max(x, b);
  }
  if (x < hasta) tramos.push([x, hasta]);
  return tramos;
}

// Una puerta tiene pareja si del otro lado hay una sala (del mismo piso) con la misma puerta en su pared de enfrente.
// Devuelve las puertas que llevan a una pared (o al vacío): tiene que estar vacía.
const ENFRENTE = { n: 's', s: 'n', e: 'w', w: 'e' };
const linea = (s, lado) => ({ n: s.z0, s: s.z1, e: s.x1, w: s.x0 })[lado];
export function puertasSinPareja(salas = SALAS) {
  const malas = [];
  for (const s of salas) {
    for (const lado of Object.keys(s.puertas)) {
      for (const [a, b] of s.puertas[lado]) {
        const ok = salas.some(o => o !== s && o.y === s.y && linea(o, ENFRENTE[lado]) === linea(s, lado)
          && (o.puertas[ENFRENTE[lado]] || []).some(([c, d]) => c <= a && d >= b));
        if (!ok) malas.push(`${s.id}.${lado} [${a}, ${b}]`);
      }
    }
  }
  return malas;
}

// 🧪 El laboratorio de Color Dragons (diseño de Mathias, dibujado visto desde arriba).
// Aquí solo está el PLANO (datos puros, sin Three.js): qué salas hay, dónde están sus puertas, las escotillas y los escondites.
// index.html lee este plano y lo construye en 3D. Así los tests pueden revisar que toda puerta lleve a algún lado.
//
// Coordenadas: x crece hacia el este (derecha del dibujo) y z hacia el sur (abajo del dibujo). En metros.
// Cada sala es un rectángulo { x0, x1, z0, z1 } en su piso (y). Sus puertas son huecos en sus paredes:
//   n (norte, z = z0) y s (sur, z = z1) → tramos en x · e (este, x = x1) y w (oeste, x = x0) → tramos en z

// Alturas: techos altos (¡nada de claustrofobia!). Las puertas de arriba son altas para que Red (4 m) pase
export const ALTO = 6;           // de piso a techo, en el piso principal
export const ALTO_SUBSUELO = 6;  // de piso a techo, en los subsuelos
export const PISO_PRINCIPAL = 0;
export const PISO_SUBSUELO = -7; // los dos subsuelos están a la misma profundidad (así se pueden unir con pasillos)
export const ALTO_PUERTA = 4.5;      // las puertas del piso principal (Red mide 4 m: pasa justo)
export const ALTO_PUERTA_CHICA = 3;  // las de los subsuelos y las del Panic Hole (ahí Red no entra)
export const altoDe = (y, s = null) => (s && s.alto) || (y < PISO_PRINCIPAL - 1 ? ALTO_SUBSUELO : ALTO);
export const puertaDe = (y, refugio = false) => (refugio || y < PISO_PRINCIPAL - 1 ? ALTO_PUERTA_CHICA : ALTO_PUERTA);

// Los colores son apagados: es un laboratorio. pared = tinte de las paredes · piso = tinte de las baldosas
export const SALAS = [
  // ---------- Piso principal (los pasillos miden 5 m de ancho) ----------
  { id: 'testLab', nombre: 'Test Lab', y: 0, x0: -36, x1: -14, z0: -30, z1: -18, pared: 0x8c9a9b, piso: 0x5d6a6c,
    puertas: { s: [[-26.5, -21.5]], e: [[-26, -22]] } },
  { id: 'spawn', nombre: 'Spawn', y: 0, x0: -14, x1: 6, z0: -30, z1: -18, pared: 0x9a9890, piso: 0x66645e,
    puertas: { w: [[-26, -22]], s: [[-6.5, -1.5]] } },
  { id: 'escaleras', nombre: 'Escaleras del spawn', y: 0, x0: -6.5, x1: -1.5, z0: -18, z1: -12.5, pared: 0x868a8c, piso: 0x5a5e61,
    puertas: { n: [[-6.5, -1.5]], s: [[-6.5, -1.5]] } },
  { id: 'pasilloNorte', nombre: 'Pasillo norte', y: 0, x0: -21.5, x1: 14, z0: -12.5, z1: -7.5, pared: 0x868a8c, piso: 0x5a5e61,
    puertas: { n: [[-6.5, -1.5]], w: [[-12.5, -7.5]], e: [[-12.5, -7.5]] } },
  { id: 'pasilloOeste', nombre: 'Pasillo oeste', y: 0, x0: -26.5, x1: -21.5, z0: -18, z1: 4, pared: 0x868a8c, piso: 0x5a5e61,
    puertas: { n: [[-26.5, -21.5]], e: [[-12.5, -7.5], [-2, 2]], s: [[-26.5, -21.5]] } },
  { id: 'panico', nombre: 'Panic Hole', y: 0, x0: -34, x1: -21.5, z0: 4, z1: 20, pared: 0x97817c, piso: 0x6a5c58,
    puertas: { n: [[-26.5, -21.5]], e: [[8, 11]] } },
  { id: 'salon', nombre: 'Salón central', y: 0, x0: -21.5, x1: 14, z0: -4, z1: 12, pared: 0x8a8d93, piso: 0x5f6268,
    puertas: { w: [[-2, 2], [8, 11]], e: [[2, 6]] } },
  { id: 'banos', nombre: 'Baños', y: 0, x0: 14, x1: 26, z0: -30, z1: -7.5, pared: 0xa7aaa5, piso: 0x7b807c,
    puertas: { w: [[-12.5, -7.5]], s: [[15, 19]] } },
  { id: 'pasilloEste', nombre: 'Pasillo este', y: 0, x0: 14, x1: 20, z0: -7.5, z1: 14, pared: 0x868a8c, piso: 0x5a5e61,
    puertas: { n: [[15, 19]], w: [[2, 6]], e: [[0, 4]], s: [[15, 19]] } },
  { id: 'lockers', nombre: 'Lockers', y: 0, x0: 20, x1: 32, z0: -7.5, z1: 10, pared: 0x7d8a7a, piso: 0x5c6159,
    puertas: { w: [[0, 4]] } },
  { id: 'centerLab', nombre: 'Center Lab', y: 0, x0: -10, x1: 30, z0: 14, z1: 32, pared: 0x8f979f, piso: 0x60666c,
    puertas: { n: [[15, 19]] } },

  // ---------- Subsuelos (y túneles para conectarlos, de 4 a 5 m de ancho) ----------
  { id: 'greyCove', nombre: "Grey's Cove", y: -7, x0: -52, x1: -30, z0: -32, z1: -16, pared: 0x6f7275, piso: 0x4e5153,
    puertas: { e: [[-22.5, -18.5]], s: [[-46.5, -41.5]] } },
  { id: 'yellowRoom', nombre: 'Cuarto de Yellow', y: -7, x0: 26, x1: 52, z0: 2, z1: 10, pared: 0x9a9172, piso: 0x6a6450,
    puertas: { n: [[35.5, 40.5]], s: [[26, 30]] } },
  { id: 'tunelNorte', nombre: 'Túnel norte', y: -7, x0: -30, x1: 35.5, z0: -22.5, z1: -18.5, pared: 0x5f6466, piso: 0x45494b,
    puertas: { w: [[-22.5, -18.5]], e: [[-22.5, -18.5]], s: [[-6.5, -1.5]] } },
  { id: 'tunelEste', nombre: 'Túnel este', y: -7, x0: 35.5, x1: 40.5, z0: -22.5, z1: 2, pared: 0x5f6466, piso: 0x45494b,
    puertas: { w: [[-22.5, -18.5]], s: [[35.5, 40.5]] } },
  { id: 'tunelCentro', nombre: 'Túnel del centro', y: -7, x0: -6.5, x1: -1.5, z0: -18.5, z1: 15.5, pared: 0x5f6466, piso: 0x45494b,
    puertas: { n: [[-6.5, -1.5]], s: [[-6.5, -1.5]] } },
  { id: 'tunelOeste', nombre: 'Túnel oeste', y: -7, x0: -46.5, x1: -41.5, z0: -16, z1: 20.5, pared: 0x5f6466, piso: 0x45494b,
    puertas: { n: [[-46.5, -41.5]], e: [[15.5, 20.5]] } },
  { id: 'tunelSur', nombre: 'Túnel sur', y: -7, x0: -41.5, x1: 30, z0: 15.5, z1: 20.5, pared: 0x5f6466, piso: 0x45494b,
    puertas: { w: [[15.5, 20.5]], n: [[-6.5, -1.5], [26, 30]] } },
  { id: 'tunelYellow', nombre: 'Túnel a Yellow', y: -7, x0: 26, x1: 30, z0: 10, z1: 15.5, pared: 0x5f6466, piso: 0x45494b,
    puertas: { n: [[26, 30]], s: [[26, 30]] } },

  // ---------- 🏠 El lobby: una recepción de laboratorio (aparte: no se conecta con el laboratorio) ----------
  { id: 'lobby', zona: 'lobby', nombre: 'Lobby', y: 0, x0: 100, x1: 126, z0: -14, z1: 14, pared: 0xb7c3c6, piso: 0x8d989b, puertas: {} },

  // ---------- 🎈 La fiesta (noche final, dibujo de Mathias). También aparte ----------
  // huecos: aberturas sin pareja (entre pisos de distinta altura); alto: salas más bajitas (las ventilaciones)
  { id: 'fSpawn', zona: 'fiesta', nombre: 'Spawn de la fiesta', y: 0, x0: 160, x1: 168, z0: -14, z1: 10, pared: 0x9c8fa8, piso: 0x6d6478,
    puertas: { e: [[-10, -6]] } },
  { id: 'fSalon', zona: 'fiesta', nombre: 'Salón de la fiesta', y: 0, x0: 168, x1: 194, z0: -12, z1: 6, pared: 0xa78fa0, piso: 0x72616e,
    puertas: { w: [[-10, -6]], e: [[-2, 4]] } },
  { id: 'fRampa', zona: 'fiesta', nombre: 'La rampa', y: 0, x0: 194, x1: 204, z0: -12, z1: 10, pared: 0x8f95a8, piso: 0x62677a,
    puertas: { w: [[-2, 4]] }, huecos: { e: [[-11.5, -8.5]] } },
  // El cuarto de las cajas (arriba, a 3 m) tiene una escotilla en el piso (hoyos) que baja al cuarto de abajo
  { id: 'fBloques', zona: 'fiesta', nombre: 'Cuarto de las cajas', y: 3, x0: 204, x1: 216, z0: -14, z1: -2, pared: 0x8a8f86, piso: 0x5f645c,
    puertas: {}, huecos: { w: [[-11.5, -8.5]] }, hoyos: [{ x0: 210, x1: 214, z0: -10, z1: -6 }] },
  { id: 'fBajo', zona: 'fiesta', nombre: 'Cuarto de abajo', y: 0, alto: 2.7, x0: 204, x1: 216, z0: -14, z1: -2, pared: 0x6f747a, piso: 0x4f545a,
    puertas: { e: [[-8, -4]] }, hoyosTecho: [{ x0: 210, x1: 214, z0: -10, z1: -6 }] },   // (el techo también tiene el hoyo de la escotilla)
  { id: 'fPasillo', zona: 'fiesta', nombre: 'Pasillo de la fiesta', y: 0, x0: 216, x1: 226, z0: -14, z1: 26, pared: 0x7f8590, piso: 0x575c66,
    puertas: { w: [[-8, -4]], s: [[218, 222]] } },
  // 🌀 Las ventilaciones: un laberinto de ductos (con caminos sin salida). Grey también se mete
  { id: 'fVent1', zona: 'fiesta', nombre: 'Ventilación', y: 0, alto: 2.8, x0: 218, x1: 222, z0: 26, z1: 42, pared: 0x8d9296, piso: 0x6a6f73,
    puertas: { n: [[218, 222]], e: [[28, 32], [38, 42]], s: [[218, 222]] } },
  { id: 'fVentA', zona: 'fiesta', nombre: 'Ventilación (sin salida)', y: 0, alto: 2.8, x0: 222, x1: 234, z0: 28, z1: 32, pared: 0x8d9296, piso: 0x6a6f73,
    puertas: { w: [[28, 32]] } },
  { id: 'fVentB', zona: 'fiesta', nombre: 'Ventilación (sin salida)', y: 0, alto: 2.8, x0: 218, x1: 222, z0: 42, z1: 52, pared: 0x8d9296, piso: 0x6a6f73,
    puertas: { n: [[218, 222]] } },
  { id: 'fVent2', zona: 'fiesta', nombre: 'Ventilación', y: 0, alto: 2.8, x0: 222, x1: 244, z0: 38, z1: 42, pared: 0x8d9296, piso: 0x6a6f73,
    puertas: { w: [[38, 42]], n: [[240, 244]], s: [[232, 236]] } },
  { id: 'fVentC', zona: 'fiesta', nombre: 'Ventilación (sin salida)', y: 0, alto: 2.8, x0: 240, x1: 244, z0: 26, z1: 38, pared: 0x8d9296, piso: 0x6a6f73,
    puertas: { s: [[240, 244]] } },
  { id: 'fVent3', zona: 'fiesta', nombre: 'Ventilación final', y: 0, alto: 2.8, x0: 232, x1: 236, z0: 42, z1: 54, pared: 0x8d9296, piso: 0x6a6f73,
    puertas: { n: [[232, 236]], s: [[232, 236]] } },
  { id: 'fSalida', zona: 'fiesta', nombre: 'Afuera', cielo: true, y: 0, x0: 226, x1: 242, z0: 54, z1: 66, pared: 0x3d4a3f, piso: 0x3f5a35,
    puertas: { n: [[232, 236]] } },
];
// Las salas que son parte del laboratorio (donde están los dragones y los objetos de las noches)
export const delLab = s => !s.zona;
export const LOBBY_SPAWN = { x: 113, y: 0, z: 9 };
export const FIESTA_SPAWN = { x: 164, y: 0, z: 4 };

// Escotillas: un hoyo en el piso principal con una escalera de mano que baja al subsuelo
export const ESCOTILLAS = [
  { id: 'aGrey', desde: 'testLab', hacia: 'greyCove', x0: -35.6, x1: -33.2, z0: -26.2, z1: -23.8 },
  { id: 'aYellow', desde: 'lockers', hacia: 'yellowRoom', x0: 28.4, x1: 30.8, z0: 5.8, z1: 8.2 },
];

// Dónde apareces: en el centro del Spawn (sobre el sol)
export const SPAWN = { x: -4, y: 0, z: -24 };

// 🚪 Escondites fijos: el armario de Yellow (B cerca de él te mete adentro). En cualquier otro lado, B te pone TU caja
export const ESCONDITES = [
  { tipo: 'armario', x: 34, z: 2.9, y: -7 },   // el armario para esconderse (cuarto de Yellow)
];
export const DIST_ESCONDITE = 1.9;   // qué tan cerca tienes que estar para meterte

const dentro = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

// ¿En qué sala estás? (null = en ninguna: te caíste del mapa)
export function salaEn(x, y, z) {
  return SALAS.find(s => dentro(s, x, z) && y >= s.y - 0.5 && y <= s.y + altoDe(s.y, s)) || null;
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

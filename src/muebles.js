// 🪑 Los muebles del laboratorio con los que chocan los dragones (mesas, baños, lockers, camas…).
// Cada fila: [x, z, medio ancho, medio largo, abajo, arriba] (en metros). Salen de los muebles que index.html dibuja
// (los de más de 0,7 m de alto). No están la cama ni el plato de Yellow (a esos sí tiene que llegar) ni los muebles junto a las escotillas.
// Si mueves un mueble en index.html, muévelo aquí también.
const FILAS = [
  // yellowRoom
  [34, 2.9, 0.8, 0.45, -7, -4.7],
  // testLab
  [-28.5, -26.6, 1.1, 1.1, 0, 2.75],
  [-21, -26.6, 1.1, 1.1, 0, 0.94],
  [-25, -29.2, 1.94, 0.44, 0, 0.94],
  [-20.5, -21.4, 1.94, 0.54, 0, 0.86],
  // banos
  [14.95, -28.55, 0.05, 1.15, 0.15, 2.2],
  [17.55, -28.55, 0.05, 1.15, 0.15, 2.2],
  [20.15, -28.55, 0.05, 1.15, 0.15, 2.2],
  [22.75, -28.55, 0.05, 1.15, 0.15, 2.2],
  [25.35, -28.55, 0.05, 1.15, 0.15, 2.2],
  [25.3, -16.5, 0.4, 4.5, 0, 0.85],
  // lockers
  [26.07, -7.45, 5.57, 0.25, 0, 2],
  [31.45, -1.57, 0.25, 4.33, 0, 2],
  // centerLab
  [2, 14.95, 10.94, 0.49, 0, 0.94],
  [25, 14.95, 3.94, 0.49, 0, 0.94],
  [10, 24, 7.94, 2.94, 0, 0.86],
  [24, 29.5, 1.6, 0.6, 0, 0.94],
  // greyCove
  [-46, -27, 1.44, 0.64, -7, -6.06],
  [-46, -21.5, 1.44, 0.64, -7, -6.14],
  [-40, -29.5, 2, 1.3, -7, -4.8],
  [-45, -26.95, 0.05, 1.6, -7, -5.85],
  [-45, -29.95, 0.05, 1.5, -7, -5.85],
  [-35.9, -29.95, 0.05, 1.5, -7, -6.06],
  [-50, -19.5, 0.64, 1.14, -7, -6.06],
  [-35.5, -17.4, 1.44, 0.49, -7, -6.14],
  // spawn
  [2.5, -27.6, 1.04, 0.44, 0, 0.86],
];
export const MUEBLES = FILAS.map(([x, z, hw, hd, bottom, top]) => ({ x, z, hw, hd, bottom, top }));

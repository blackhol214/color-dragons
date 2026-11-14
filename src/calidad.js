// ⚙️ La calidad de los gráficos (la misma idea que en Rectángulo Verde): Auto, Alta, Media o Baja.
// En Auto se elige según la compu y la pantalla, y si el juego va lento baja sola (nunca sube sola, para que no salte de un lado a otro).

// ratioMax: cuántos píxeles de verdad por cada píxel de pantalla (más = más nítido, pero más trabajo)
// niebla: hasta dónde se ve antes de perderse en la oscuridad (en metros)
export const CALIDADES = {
  alta: { nombre: 'Alta', name: 'High', ratioMax: 2, niebla: 62 },
  media: { nombre: 'Media', name: 'Medium', ratioMax: 1.5, niebla: 52 },
  baja: { nombre: 'Baja', name: 'Low', ratioMax: 1, niebla: 42 },
};
export const OPCIONES_CALIDAD = ['auto', 'alta', 'media', 'baja'];
export const CLAVE_CALIDAD = 'color-dragons:calidad', CLAVE_CALIDAD_AUTO = 'color-dragons:calidad-auto';
export const leerCalidad = t => (OPCIONES_CALIDAD.includes(t) ? t : 'auto');
export const leerNivel = t => (t === 'alta' || t === 'media' || t === 'baja' ? t : null);

// En "Auto", ¿con cuál empezamos? Con lo que dice la compu (núcleos, memoria en GB, si es táctil)
// y con la PANTALLA: una pantalla enorme con muchos píxeles (como un 4K o un celular muy nítido) cuesta mucho más de dibujar
export function calidadInicial({ nucleos = 0, memoria = 0, tactil = false, ancho = 0, alto = 0, ratio = 1 } = {}) {
  const megapixeles = (ancho * alto * ratio * ratio) / 1e6;   // los píxeles de verdad que habría que pintar en cada cuadro
  if ((memoria && memoria <= 2) || (nucleos && nucleos <= 2)) return 'baja';
  if (tactil && megapixeles > 5) return 'baja';               // celular o tablet con pantalla muy nítida
  if (tactil || (memoria && memoria <= 4) || (nucleos && nucleos <= 4) || megapixeles > 8) return 'media';
  return 'alta';
}

// El pixel ratio que usa el juego: nunca más que el de la pantalla, ni que el máximo de la calidad (ni que 1,5 en un celular)
export const ratioPara = (nivel, ratioPantalla, tactil) => Math.min(ratioPantalla || 1, tactil ? 1.5 : 2, CALIDADES[nivel].ratioMax);

// Si va lento (menos de 30 cuadros por segundo) aun con la resolución más baja, baja un nivel
export const bajarCalidad = (nivel, fps) => (fps >= 30 ? nivel : nivel === 'alta' ? 'media' : 'baja');

// Cada 2 segundos: ¿qué hacemos con la resolución? (bajarla un poco si va lento, subirla despacito si va sobrado)
export function ajustarResolucion(ratio, max, fps, buenos) {
  if (fps < 40 && ratio > 1) return { ratio: Math.max(1, ratio - 0.25), buenos: 0 };
  if (fps > 55 && ratio < max) return buenos + 1 >= 5 ? { ratio: Math.min(max, ratio + 0.25), buenos: 0 } : { ratio, buenos: buenos + 1 };
  return { ratio, buenos };
}

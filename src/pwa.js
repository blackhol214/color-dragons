// 🆕 ¿Hay una versión nueva del juego? Cada tanto el juego vuelve a pedir index.html a internet y compara su "huella"
// con la de cuando abriste el juego. Si cambió, sale el aviso "Hay una versión nueva → Actualizar". (Sin números de versión a mano)

// Una huella corta de un texto (si cambia una sola letra, cambia la huella)
export function huellaDe(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}
// ¿Avisamos? Solo si las dos huellas existen y son distintas (si no hubo internet, no se avisa nada)
export const hayVersionNueva = (base, nueva) => !!base && !!nueva && base !== nueva;
export const REVISAR_CADA_MS = 10 * 60 * 1000;   // cada 10 minutos (y cada vez que vuelves a la pestaña)

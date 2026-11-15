// 🎬 Las escenas (las "películas" del juego): cuál está pasando, si se puede saltar, y cómo sale el texto del sombrero.

// ¿Qué escena está pasando? (o null si estás jugando). Cada una tiene su música
//   splash: la pantalla de inicio · intro / introApagon: la intro de cada noche · fiestaIntro, choque, hat, fin: la noche final
export function escenaDe({ splash = false, nocheFase = null, apagon = false, introSaltada = false, fiestaFase = null } = {}) {
  if (splash) return 'splash';
  if (nocheFase === 'intro' && !introSaltada) return apagon ? 'introApagon' : 'intro';
  if (fiestaFase === 'intro') return 'fiestaIntro';
  if (fiestaFase === 'choque' || fiestaFase === 'hat' || fiestaFase === 'fin') return fiestaFase;
  return null;
}
// Todas se pueden saltar (con el botón ⏭ o con Esc)
export const ESCENAS_SALTABLES = ['splash', 'intro', 'introApagon', 'fiestaIntro', 'choque', 'hat', 'fin'];

// El texto sale letra por letra un poco rápido (termina a la MITAD de la escena) y después se queda quieto,
// así hay tiempo de sobra para leerlo completo. Nunca más lento que 8 letras por segundo
export const TEXTO_TERMINA = 0.5;
export function letrasVisibles(texto, tiempo, total) {
  const porSegundo = Math.max(8, texto.length / (total * TEXTO_TERMINA));
  return texto.slice(0, Math.max(0, Math.floor(tiempo * porSegundo)));
}

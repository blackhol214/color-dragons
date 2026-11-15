// 🖥️ Arrancar los gráficos 3D (WebGL) sin que el juego se rompa.
// Algunos navegadores no dejan crear el "contexto WebGL" (el permiso para dibujar en 3D): la aceleración por hardware está
// apagada, la tarjeta de video está bloqueada, o hay demasiadas pestañas con 3D abiertas. Antes el juego se quedaba roto;
// ahora prueba otra vez con opciones más livianas y, si igual no puede, explica qué hacer.

// Los intentos, del más lindo al más liviano
export const INTENTOS_RENDER = [
  { antialias: true },
  { antialias: false, powerPreference: 'default' },
  { antialias: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false, precision: 'mediump' },
];

// crear(opciones) hace el renderer de verdad (o lanza un error). Devuelve el primero que funcione, o todos los errores
export function crearRendererSeguro(crear, intentos = INTENTOS_RENDER) {
  const errores = [];
  for (let i = 0; i < intentos.length; i++) {
    try {
      const renderer = crear(intentos[i]);
      if (renderer) return { ok: true, renderer, intento: i, errores };
      errores.push('vacío');
    } catch (e) {
      errores.push(String((e && e.message) || e));
    }
  }
  return { ok: false, renderer: null, intento: -1, errores };
}

// ¿Qué navegador es? (para dar el consejo justo)
export function navegadorDe(ua = '') {
  const u = String(ua);
  if (/Edg\//.test(u)) return 'edge';
  if (/OPR\/|Opera/.test(u)) return 'opera';
  if (/Firefox\//.test(u)) return 'firefox';
  if (/Chrome\/|CriOS\//.test(u)) return 'chrome';
  if (/Safari\//.test(u)) return 'safari';
  return 'otro';
}

// Los pasos para arreglarlo en ese navegador (claves de idioma.js, en orden)
export function pasosSinGraficos(navegador) {
  const comun = ['sinGraficos.paso.reiniciar', 'sinGraficos.paso.pestanas'];
  const propio = {
    chrome: ['sinGraficos.paso.chrome'],
    edge: ['sinGraficos.paso.edge'],
    opera: ['sinGraficos.paso.chrome'],
    firefox: ['sinGraficos.paso.firefox'],
    safari: ['sinGraficos.paso.safari'],
    otro: [],
  }[navegador] || [];
  return [...comun, ...propio, 'sinGraficos.paso.probar'];
}

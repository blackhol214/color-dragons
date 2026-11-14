// Multijugador: funciones puras que usan el servidor (server.js) y el juego (index.html)

export const PUERTO = 8080;
export const CAMINOS_VALIDOS = ['amarillo', 'fuego', 'electrico'];   // (los mismos de src/tienda.js)
export const MASCOTAS_VALIDAS = ['ganso', 'oso', 'planta', 'fantasma', 'miniYellow', 'arcoiris'];
export const OFICIAL = 'https://blackhol214.github.io/color-dragons/';   // el único juego oficial

// La sala es el nombre del túnel de Cloudflare (lo de antes de .trycloudflare.com). Solo letras, números y guiones,
// así nadie puede mandarte un link que conecte el juego a otro sitio raro.
export function leerSala(texto) {
  const sala = String(texto || '').trim().toLowerCase();
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(sala) && sala.length <= 80 ? sala : null;
}
export const salaDeHost = host => { const m = /^([a-z0-9-]+)\.trycloudflare\.com$/.exec(String(host).toLowerCase()); return m ? leerSala(m[1]) : null; };
export const linkOficial = sala => `${OFICIAL}?sala=${sala}`;
export const MAX_JUGADORES = 12;
export const ENVIOS_POR_SEGUNDO = 10;   // cuántas veces por segundo mandas tu posición
export const BORDE = 260;               // hasta dónde puede estar un jugador (en metros): el lab, el lobby (x ≈ 113) y la fiesta (x ≈ 160–242)

// Números cortos para mandar menos letras por la red (2 decimales)
export const corto = n => Math.round(n * 100) / 100;

// Nombre limpio: sin espacios de más y máximo 20 letras
export function limpiarNombre(nombre) {
  if (typeof nombre !== 'string') return '';
  return nombre.trim().replace(/\s+/g, ' ').slice(0, 20);
}

const esNumero = n => typeof n === 'number' && Number.isFinite(n);

// Lee un mensaje que llegó por la red. Si viene roto o con trampas, devuelve null.
export const MAX_MENSAJE = 1500;
// t: la hora (en ms) de la compu que mandó el mensaje (para dibujarlo suave)
const horaDe = t => esNumero(t) && t >= 0 ? t : null;
export function leerMensaje(texto) {
  if (typeof texto !== 'string' || texto.length > MAX_MENSAJE) return null;
  let m;
  try { m = JSON.parse(texto); } catch (e) { return null; }
  if (!m || typeof m !== 'object') return null;
  if (m.tipo === 'hola') {
    const nombre = limpiarNombre(m.nombre);
    if (!nombre || !esNumero(m.color)) return null;
    return { tipo: 'hola', nombre, color: m.color };
  }
  if (m.tipo === 'pos') {
    if (![m.x, m.y, m.z, m.rot].every(esNumero)) return null;
    // oculto: 1 si estás metido en una caja (tus amigos no te ven)
    // camino: el trail que lleva puesto (solo uno de los que existen; si no, ninguno)
    return { tipo: 'pos', x: m.x, y: m.y, z: m.z, rot: m.rot, color: esNumero(m.color) ? m.color : null, oculto: m.oculto === 1 ? 1 : 0, camino: CAMINOS_VALIDOS.includes(m.camino) ? m.camino : null, mascota: MASCOTAS_VALIDAS.includes(m.mascota) ? m.mascota : null, t: horaDe(m.t) };
  }
  // 🌙 Las noches: agarrar el objeto número i (E), entregar lo que llevas en el Center Lab, servirle comida a Yellow
  if (m.tipo === 'recoger') return Number.isInteger(m.i) && m.i >= 0 && m.i < 100 ? { tipo: 'recoger', i: m.i } : null;
  if (m.tipo === 'entregar' || m.tipo === 'alimentar') return { tipo: m.tipo };
  // 🏠 Desde el lobby: empezar la noche n (1 a 5; 6 = la noche final)
  if (m.tipo === 'empezar') return Number.isInteger(m.n) && m.n >= 1 && m.n <= 6 ? { tipo: 'empezar', n: m.n } : null;
  return null;
}

// Mueve un número un poquito hacia otro (k = 0 no se mueve, k = 1 llega de golpe).
export function acercar(desde, hacia, k) {
  return desde + (hacia - desde) * Math.min(1, Math.max(0, k));
}

// Pedacitos de la explosión: cada uno sale volando en una dirección al azar y hacia arriba
export function piezasExplosion(cantidad, azar = Math.random) {
  const piezas = [];
  for (let i = 0; i < cantidad; i++) {
    const ang = azar() * Math.PI * 2, fuerza = 3 + azar() * 5;
    piezas.push({
      vx: Math.cos(ang) * fuerza,
      vy: 4 + azar() * 6,
      vz: Math.sin(ang) * fuerza,
      y: azar() * 2,             // sale desde algún punto del cuerpo (que mide 2 de alto)
      giro: (azar() - 0.5) * 10,
    });
  }
  return piezas;
}

// Lo mismo, pero para girar: va por el camino más corto (de 350° a 10° gira 20°, no 340°)
export function acercarAngulo(desde, hacia, k) {
  const d = Math.atan2(Math.sin(hacia - desde), Math.cos(hacia - desde));
  return desde + d * Math.min(1, Math.max(0, k));
}

// ---------- Movimiento suave: dibujar lo que llega por la red un poquito en el pasado ----------
// Por internet los mensajes llegan a tirones (dos juntos y después nada). Si dibujas siempre "lo último que llegó",
// tus amigos avanzan a saltitos. El truco: guardar las últimas posiciones con su hora y dibujarlos RETRASO_MS atrás,
// en un punto entre dos posiciones conocidas. Así siempre hay "una posición siguiente" hacia donde ir.
export const RETRASO_MS = 100;     // lo mínimo que se dibuja en el pasado (si internet anda a tirones, se atrasa más: ver retrasoDe)
export const RETRASO_MAX = 500;    // pero nunca más de medio segundo
export const TELETRANSPORTE = 15;  // si algo se movió más que esto (en metros) entre dos mensajes, aparece allá de golpe
const INTERVALO_MS = 1000 / ENVIOS_POR_SEGUNDO;
export const nuevoSuavizador = () => ({ muestras: [], desfase: null, atraso: 0 });
// v = lista de números (x, y, z, giro…) · t = la hora del que lo mandó · ahora = mi hora al recibirlo
export function agregarMuestra(s, v, t, ahora) {
  if (t === null || t === undefined) t = ahora;   // si no manda su hora: usamos la hora en que llegó
  // Las dos compus tienen relojes distintos: el mensaje que llegó más rápido dice cuánto se diferencian.
  // (Sube despacito, por si internet se puso más lento para siempre)
  const d = ahora - t;
  s.desfase = s.desfase === null ? d : Math.min(d, s.desfase + 0.5);
  // ¿Cuánto más tarde que el más rápido llegó este? El peor atraso de los últimos mensajes dice cuánto hay que esperar
  // (va bajando de a poquito si internet se arregla)
  s.atraso = Math.max(d - s.desfase, s.atraso * 0.98);
  const hora = t + s.desfase, m = s.muestras, ult = m[m.length - 1];
  if (ult && hora <= ult.t) return;   // llegó tarde o repetido: ya tenemos algo más nuevo
  // Si estuvo quieto, solo manda una vez por segundo: copiamos su última posición justo antes de esta,
  // para que no se deslice despacito durante todo ese segundo
  if (ult && hora - ult.t > INTERVALO_MS * 1.5) m.push({ t: hora - INTERVALO_MS, v: ult.v });
  m.push({ t: hora, v });
  if (m.length > 30) m.splice(0, m.length - 30);
}
// Mezcla dos posiciones: f = 0 es la primera, f = 1 la segunda. clase(i) dice qué es cada número:
// 'giro' (va por el camino más corto), 'fijo' (no se mezcla) o nada (un número normal)
// Si las 3 primeras (x, y, z) saltaron más de TELETRANSPORTE, aparece allá de golpe ENTERO
export function mezclar(a, b, f, clase = null) {
  if (a.length !== b.length) return b;
  if (a.length >= 3 && Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) > TELETRANSPORTE) return b;
  return a.map((x, i) => {
    const c = clase && clase(i), y = b[i];
    if (c === 'fijo') return f < 1 ? x : y;
    if (c === 'giro') return acercarAngulo(x, y, f);
    return Math.abs(y - x) > TELETRANSPORTE ? y : x + (y - x) * f;
  });
}
// Cuánto en el pasado hay que dibujarlo: lo que se atrasan los mensajes, más el tiempo entre dos mensajes
// (para dibujar ENTRE dos posiciones, la siguiente ya tiene que haber llegado), más un poquito de margen
export const retrasoDe = s => Math.min(RETRASO_MAX, Math.max(RETRASO_MS, s.atraso + INTERVALO_MS + 20));
// ¿Dónde dibujarlo ahora? null si todavía no llegó nada
export function valoresEn(s, ahora, clase) {
  const m = s.muestras, t = ahora - retrasoDe(s);
  if (!m.length) return null;
  while (m.length > 2 && m[1].t <= t) m.shift();   // las muestras viejas ya no sirven
  if (t <= m[0].t || m.length === 1) return m[0].v;
  const [a, b] = m;
  if (t >= b.t) return b.v;   // se acabaron las muestras (internet se trabó): se queda en la última, sin inventar
  return mezclar(a.v, b.v, (t - a.t) / (b.t - a.t), clase);
}

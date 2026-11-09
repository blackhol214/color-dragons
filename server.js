// Servidor multijugador de Color Dragons (se enciende con: bun server.js)
// 1) Entrega el juego (index.html y src/) a quien abra el link
// 2) Reparte en tiempo real dónde está cada jugador (WebSocket)
// 3) Guarda a todos los jugadores en una base de datos SQLite (datos/jugadores.sqlite)
import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { PUERTO, MAX_JUGADORES, BORDE, leerMensaje, salaDeHost, linkOficial } from './src/red.js';

// ---------- Base de datos ----------
mkdirSync(new URL('./datos', import.meta.url), { recursive: true });
const db = new Database(new URL('./datos/jugadores.sqlite', import.meta.url).pathname);
db.run(`CREATE TABLE IF NOT EXISTS jugadores (
  nombre     TEXT PRIMARY KEY,
  color      INTEGER,
  x REAL, y REAL, z REAL,
  veces      INTEGER DEFAULT 0,   -- cuántas veces ha entrado
  ultima_vez TEXT
)`);
const buscarJugador = db.query('SELECT * FROM jugadores WHERE nombre = ?');
const guardarJugador = db.query(`INSERT INTO jugadores (nombre, color, x, y, z, veces, ultima_vez)
  VALUES ($nombre, $color, $x, $y, $z, 1, datetime('now', 'localtime'))
  ON CONFLICT(nombre) DO UPDATE SET color = $color, x = $x, y = $y, z = $z, ultima_vez = datetime('now', 'localtime')`);
const sumarVisita = db.query('UPDATE jugadores SET veces = veces + 1 WHERE nombre = ?');

function guardar(j) {
  guardarJugador.run({ $nombre: j.nombre, $color: j.color, $x: j.x, $y: j.y, $z: j.z });
}

// ---------- Jugadores conectados ahora ----------
const conectados = new Map();   // id → { id, nombre, color, x, y, z, rot, ws }
let siguienteId = 1;
const aTodos = datos => servidor.publish('juego', JSON.stringify(datos));
const sinWs = j => ({ id: j.id, nombre: j.nombre, color: j.color, rot: j.rot, x: j.x, y: j.y, z: j.z });
// 🛡️ Nadie puede decir que está fuera del mapa ni volando a 1 km de altura
const dentro = (n, max) => Math.max(-max, Math.min(max, n));

// ---------- Archivos que se pueden ver desde internet (solo estos, nada más de tu compu) ----------
const PERMITIDOS = /^\/(index\.html|manifest\.webmanifest|src\/[a-z]+\.js|iconos\/[a-z0-9-]+\.png)$/;
const TIPOS = { '.webmanifest': 'application/manifest+json', '.js': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8', '.png': 'image/png' };

const servidor = Bun.serve({
  port: PUERTO,
  fetch(req, srv) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      if (conectados.size >= MAX_JUGADORES) return new Response('El juego está lleno', { status: 503 });
      return srv.upgrade(req, { data: { id: null } }) ? undefined : new Response('Se necesita WebSocket', { status: 400 });
    }
    // Quien abre el link de Cloudflare va al juego oficial (github.io) con la sala puesta: así hay un solo juego
    const sala = salaDeHost(req.headers.get('host'));
    if (sala && (url.pathname === '/' || url.pathname === '/index.html')) return Response.redirect(linkOficial(sala), 302);
    const ruta = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!PERMITIDOS.test(ruta)) return new Response('No encontrado', { status: 404 });
    const tipo = TIPOS[ruta.slice(ruta.lastIndexOf('.'))];
    return new Response(Bun.file(new URL('.' + ruta, import.meta.url)), { headers: { 'Cache-Control': 'no-cache', ...(tipo ? { 'Content-Type': tipo } : {}) } });
  },
  websocket: {
    message(ws, texto) {
      const m = leerMensaje(String(texto));
      if (!m) return;   // mensaje raro: lo ignoramos
      const yo = ws.data.id && conectados.get(ws.data.id);

      if (m.tipo === 'hola' && !yo) {
        if ([...conectados.values()].some(j => j.nombre.toLowerCase() === m.nombre.toLowerCase())) {
          ws.send(JSON.stringify({ tipo: 'error', texto: `Ya hay alguien jugando como "${m.nombre}". Usa otro nombre.` }));
          ws.close();
          return;
        }
        const antes = buscarJugador.get(m.nombre);   // ¿ya había jugado alguna vez?
        if (antes) sumarVisita.run(m.nombre);
        const j = { id: siguienteId++, nombre: m.nombre, color: m.color, rot: 0,
          x: antes ? antes.x : 0, y: antes ? antes.y : 0, z: antes ? antes.z : 15, ws };
        ws.data.id = j.id;
        // Al nuevo: quién es él, quiénes están ya y dónde quedó la última vez
        ws.send(JSON.stringify({ tipo: 'bienvenida', id: j.id, jugadores: [...conectados.values()].map(sinWs),
          guardado: antes ? { x: antes.x, y: antes.y, z: antes.z, veces: antes.veces + 1 } : null }));
        conectados.set(j.id, j);
        guardar(j);
        ws.subscribe('juego');
        ws.publish('juego', JSON.stringify({ tipo: 'entra', ...sinWs(j) }));   // ws.publish no se lo manda a él mismo
        console.log(`➕ ${j.nombre} entró (${conectados.size} jugando)`);
        return;
      }
      if (!yo) return;   // todo lo demás solo vale después de saludar

      if (m.tipo === 'pos') {
        yo.x = dentro(m.x, BORDE); yo.y = dentro(m.y, 200); yo.z = dentro(m.z, BORDE); yo.rot = m.rot;
        if (m.color !== null) yo.color = m.color;
        ws.publish('juego', JSON.stringify({ tipo: 'pos', id: yo.id, x: yo.x, y: yo.y, z: yo.z, rot: yo.rot, color: yo.color, t: m.t }));   // t: su hora, para dibujarlo suave
      }
    },
    close(ws) {
      const yo = ws.data.id && conectados.get(ws.data.id);
      if (!yo) return;
      conectados.delete(yo.id);
      guardar(yo);
      aTodos({ tipo: 'sale', id: yo.id, nombre: yo.nombre });   // ¡BOOM! en la pantalla de todos
      console.log(`💥 ${yo.nombre} se desconectó (${conectados.size} jugando)`);
    },
  },
});

// Cada 10 segundos guarda a todos (por si la compu se apaga de golpe)
setInterval(() => { for (const j of conectados.values()) guardar(j); }, 10000);

console.log(`🐉 Servidor de Color Dragons en http://localhost:${servidor.port}`);
console.log('   Para que entren tus amigos, en otra terminal: npm run tunel');

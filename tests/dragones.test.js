import { describe, it, expect } from 'vitest';
import { REFUGIOS, DRAGONES, VECINOS, ruta, hayLinea, teVe, nuevosDragones, tickDragones, filaDragon, MODOS, CAMA, HAMBRE, enMueble, RADIO } from '../src/dragones.js';
import { SALAS, salaEn, delLab } from '../src/laboratorio.js';

const def = id => DRAGONES.find(d => d.id === id);
const dragon = (id, extra = {}) => ({ ...nuevosDragones().find(d => d.id === id), ...extra });
const jugador = (x, y, z, extra = {}) => ({ id: 'yo', x, y, z, oculto: 0, ...extra });

describe('el mapa de los dragones', () => {
  const salasDragon = () => SALAS.filter(q => delLab(q) && !REFUGIOS.includes(q.id));
  it('cada sala tiene al menos una puerta a otra', () => { for (const s of salasDragon()) expect(VECINOS.get(s.id).length, s.id).toBeGreaterThan(0); });
  it('desde el Test Lab se llega al Center Lab', () => {
    const r = ruta('testLab', 'centerLab');
    expect(r.length).toBeGreaterThan(1);
  });
  it('todas las salas de un piso se conectan entre sí (menos los refugios)', () => {
    for (const a of salasDragon()) for (const b of salasDragon()) if (a.y === b.y) expect(ruta(a.id, b.id), `${a.id} → ${b.id}`).not.toBe(null);
  });
  it('🌞 al Spawn tampoco entran: ahí nadie te atrapa', () => {
    expect(ruta('testLab', 'spawn')).toBe(null);
    const red = dragon('red', { x: -4, y: 0, z: -24 });   // (aunque esté pegado a ti)
    const ev = tickDragones([red], [jugador(-4.5, 0, -24)], 0.05, () => 0.5, { plato: false });
    expect(ev.some(e => e.tipo === 'atrapado')).toBe(false);
  });
  it('😐 al Panic Hole no entran los dragones, ni ven adentro', () => {
    expect(ruta('salon', 'panico')).toBe(null);
    expect(hayLinea(0, { x: -15, z: 9.5 }, { x: -28, z: 9.5 })).toBe(false);   // por la puerta del salón
  });
  it('🪜 del piso principal al subsuelo se va trepando por una escotilla', () => {
    const r = ruta('centerLab', 'greyCove');
    expect(r.some(p => p.trepar && p.y === -7)).toBe(true);
    expect(ruta('greyCove', 'centerLab').some(p => p.trepar && p.y === 0)).toBe(true);
  });
  it('una pared tapa la vista; una puerta no', () => {
    const r = ruta('testLab', 'centerLab');   // los dos puntos de antes y después de la primera puerta se ven
    expect(hayLinea(0, r[0], r[1])).toBe(true);
    expect(hayLinea(0, { x: -4, z: -24 }, { x: -25, z: -29 })).toBe(false);   // a través de la pared
  });
  it('🌞 ninguno empieza en el Spawn, y paseando nunca se mete ahí', () => {
    const ds = nuevosDragones();
    for (let i = 0; i < 2000; i++) {
      tickDragones(ds, [], 0.05);
      for (const d of ds) if (!d.trepando) expect(['spawn', 'escaleras']).not.toContain(salaEn(d.x, d.y, d.z)?.id);   // (justo en el marco de una puerta no está en ninguna sala)
    }
  });
  it('⚪ White empieza en sus mesas y 🟡 Yellow en su cama', () => {
    const ds = nuevosDragones(), w = ds.find(d => d.id === 'white'), y = ds.find(d => d.id === 'yellow');
    expect(salaEn(w.x, w.y, w.z).id).toBe('greyCove'); expect(Math.abs(w.x + 46)).toBeLessThan(2.5);
    expect(Math.hypot(y.x - 47.4, y.z - 6)).toBeLessThan(0.5);
  });
  it('cada dragón empieza en su casa, en su piso', () => {
    for (const d of nuevosDragones()) expect(salaEn(d.x, d.y, d.z).id).toBe(def(d.id).casa);
  });
});

describe('ver', () => {
  // (White vive en Grey's Cove, en el subsuelo: y = -7)
  it('te ve si estás enfrente y cerca', () => expect(teVe(dragon('white', { x: -41, z: -30, rot: 0 }), jugador(-41, -7, -24), def('white'))).toBe(true));
  it('no te ve si estás en una caja', () => expect(teVe(dragon('white', { x: -41, z: -30, rot: 0 }), jugador(-41, -7, -24, { oculto: 1 }), def('white'))).toBe(false));
  it('no te ve a la espalda (de lejos)', () => expect(teVe(dragon('white', { x: -41, z: -22, rot: 0 }), jugador(-41, -7, -28), def('white'))).toBe(false));
  it('🟡 Yellow ve más angosto: de costado ya no te ve', () => {
    const y = dragon('yellow', { x: 34, z: 6, rot: Math.PI / 2 });   // mirando hacia +x
    expect(teVe(y, jugador(40, -7, 6), def('yellow'))).toBe(true);
    expect(teVe(y, jugador(38, -7, 9.5), def('yellow'))).toBe(false);   // un poco de lado
  });
  it('no ve a través de los pisos', () => expect(teVe(dragon('grey', { x: 10, z: 20 }), jugador(10, 0, 22), def('grey'))).toBe(false));
});

describe('el cerebro', () => {
  it('paseando, se mueve despacio y sigue en su piso', () => {
    const ds = nuevosDragones();
    for (let i = 0; i < 600; i++) tickDragones(ds, [], 0.05);
    for (const d of ds) {
      if (!d.trepando) expect(salaEn(d.x, d.y, d.z), d.id).not.toBe(null);   // nunca atraviesa una pared hacia afuera
      expect(d.vel).toBeLessThanOrEqual(def(d.id).camina + 0.01);
    }
  });
  it('si te ve, corre hacia ti', () => {
    const d = dragon('white', { x: -41, z: -30, rot: 0 }), j = jugador(-41, -7, -22);
    tickDragones([d], [j], 0.1);
    expect(d.modo).toBe('perseguir');
    tickDragones([d], [j], 0.1);
    expect(d.z).toBeGreaterThan(-30);
    expect(d.vel).toBeGreaterThan(def('white').camina);
  });
  it('🔴 Red es ciego: no te ve aunque estés enfrente…', () => {
    const d = dragon('red', { x: 10, z: 20, rot: 0 });
    tickDragones([d], [jugador(10, 0, 24)], 0.1);
    expect(d.modo).toBe('pasear');
  });
  it('…pero si te choca, te lleva (¡aunque estés en tu caja!)', () => {
    const d = dragon('red', { x: 10, z: 20 });
    expect(tickDragones([d], [jugador(10.5, 0, 20.5, { oculto: 1 })], 0.1)).toContainEqual({ tipo: 'atrapado', dragon: 'red', jugador: 'yo' });
  });
  it('Grey corre más rápido que todos', () => { for (const d of DRAGONES) if (d.id !== 'grey') expect(def('grey').corre).toBeGreaterThan(d.corre); });
  it('si te ve meterte en tu caja: alerta "!" y sigue a tu caja (aunque te muevas)', () => {
    const d = dragon('white', { x: -41, z: -30, rot: 0 }), j = jugador(-41, -7, -24);
    tickDragones([d], [j], 0.1);
    expect(d.modo).toBe('perseguir');
    j.oculto = 1;
    const ev = tickDragones([d], [j], 0.1);
    expect(ev).toContainEqual({ tipo: 'alerta', dragon: 'white', jugador: 'yo' });
    expect(d.modo).toBe('caja');
    j.x = -37;   // te mueves con la caja
    let atrapado = false;
    for (let k = 0; k < 200 && !atrapado; k++) atrapado = tickDragones([d], [j], 0.1).some(e => e.tipo === 'atrapado');
    expect(atrapado).toBe(true);
  });
  it('si ya estabas en tu caja, pasa de largo', () => {
    const d = dragon('white', { x: -41, z: -30, rot: 0 });
    const ev = tickDragones([d], [jugador(-41, -7, -26, { oculto: 1 })], 0.1);
    expect(ev).toEqual([]); expect(d.modo).toBe('pasear');
  });
  it('si te pierde, va a buscarte donde te vio', () => {
    const d = dragon('white', { x: -41, z: -30, rot: 0 }), j = jugador(-41, -7, -22);
    tickDragones([d], [j], 0.1);
    j.x = 100;   // desapareció de su vista
    tickDragones([d], [j], 0.1);
    expect(d.modo).toBe('buscar');
  });
  it('se manda cortito por la red', () => {
    const f = filaDragon(dragon('red', { x: 1.234, z: 5.678, rot: 0.5 }));
    expect(f).toEqual([1.23, 0, 5.68, 0.5, MODOS.indexOf('pasear'), 0]);
  });
});

describe('🟡 Yellow, el dormilón', () => {
  const yellow = () => nuevosDragones().find(d => d.id === 'yellow');
  const correr = (d, segundos, mundo) => { const ev = []; for (let t = 0; t < segundos; t += 0.1) ev.push(...tickDragones([d], [], 0.1, Math.random, mundo)); return ev; };
  it('empieza dormido en su cama y no se mueve', () => {
    const d = yellow(); d.hambre = 100;
    correr(d, 10, { plato: true });
    expect(d.modo).toBe('dormir');
    expect(Math.hypot(d.x - CAMA.x, d.z - CAMA.z)).toBeLessThan(0.5);
  });
  it('durmiendo no te ve aunque estés enfrente', () => {
    const d = yellow(); d.hambre = 100;
    tickDragones([d], [{ id: 'yo', x: CAMA.x - 3, y: -7, z: CAMA.z, oculto: 0 }], 0.1, Math.random, { plato: true });
    expect(d.modo).toBe('dormir');
  });
  it('con comida en el plato: come y vuelve a dormir', () => {
    const d = yellow(); d.hambre = 0.1;
    const ev = correr(d, 20, { plato: true });
    expect(ev).toContainEqual({ tipo: 'come', dragon: 'yellow' });
    expect(d.modo).toBe('dormir');
  });
  it('con el plato vacío: ¡sale a buscar!', () => {
    const d = yellow(); d.hambre = 0.1;
    const ev = correr(d, 15, { plato: false });
    expect(ev).toContainEqual({ tipo: 'despierta', dragon: 'yellow' });
    expect(d.modo).not.toBe('dormir');
  });
  it('después de buscar un rato, vuelve a su cama', () => {
    const d = yellow(); d.hambre = 0.1;
    correr(d, 15 + HAMBRE.buscando, { plato: false });
    expect(d.modo).toBe('dormir');
  });
});

describe('🪜 trepar por las escaleras', () => {
  it('un dragón baja por la escotilla, trepando, y llega abajo', () => {
    const d = { ...nuevosDragones().find(q => q.id === 'white'), x: -30, y: 0, z: -22, modo: 'buscar', ultimo: null };
    d.ruta = [...ruta('testLab', 'greyCove'), { x: -40, z: -24 }];
    let trepo = false;
    for (let i = 0; i < 400 && d.ruta.length; i++) { tickDragones([d], [], 0.05); if (d.trepando) trepo = true; }
    expect(trepo).toBe(true);
    expect(d.y).toBe(-7);
    expect(salaEn(d.x, d.y, d.z).id).toBe('greyCove');
  });
  it('trepando no atrapa a nadie (primero termina de subir)', () => {
    const d = { ...nuevosDragones().find(q => q.id === 'white'), x: -34.4, y: -3, z: -25, modo: 'pasear' };
    d.ruta = [{ x: -34.4, z: -25, y: 0, trepar: true, mira: 0 }];
    expect(tickDragones([d], [{ id: 'yo', x: -34.4, y: -3, z: -25, oculto: 0 }], 0.05)).toEqual([]);
  });
});

describe('🪑 los dragones chocan con los muebles', () => {
  it('nunca quedan metidos en un mueble y no se quedan atascados para siempre', () => {
    let semilla = 7; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    const ds = nuevosDragones(), recorrido = new Map(ds.map(d => [d.id, 0]));
    for (let i = 0; i < 6000; i++) {
      const antes = ds.map(d => [d.x, d.z]);
      tickDragones(ds, [], 0.05, azar, { plato: false });
      ds.forEach((d, k) => {
        if (!d.trepando) expect(enMueble(d.x, d.y, d.z, RADIO - 0.05), `${d.id} en (${d.x.toFixed(1)}, ${d.z.toFixed(1)})`).toBe(false);
        recorrido.set(d.id, recorrido.get(d.id) + Math.hypot(d.x - antes[k][0], d.z - antes[k][1]));
      });
    }
    // en 5 minutos de juego cada uno caminó bastante (Yellow duerme mucho, pero también sale a comer)
    for (const [id, m] of recorrido) expect(m, id).toBeGreaterThan(20);
  });
  it('una mesa lo frena: no la atraviesa', () => {
    const d = dragon('red', { x: 10, y: 0, z: 18, ruta: [{ x: 10, z: 30 }], modo: 'buscar' });
    for (let i = 0; i < 40; i++) tickDragones([d], [], 0.05, () => 0.5, { plato: false });
    expect(d.z).toBeLessThan(24 - 2.94);   // la mesa grande del Center Lab empieza en z ≈ 21
  });
});

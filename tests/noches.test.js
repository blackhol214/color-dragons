import { describe, it, expect } from 'vitest';
import { NOCHES, OBJETOS, nocheDe, lugaresObjetos, nuevaNoche, entregados, llevaDe, objetoCerca, recoger, entregar, soltar, nocheCompleta, tickNoche, siguienteNoche, INTRO_SEGUNDOS, MAQUINA } from '../src/noches.js';
import { DRAGONES } from '../src/dragones.js';
import { salaEn } from '../src/laboratorio.js';

// Números "al azar" pero siempre los mismos (para que los tests den siempre igual)
const semilla = (s = 7) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const empezada = n => { const q = nuevaNoche(n, semilla()); q.fase = 'jugando'; return q; };

describe('las 5 noches', () => {
  it('cada noche pide lo que dijo Mathias', () => {
    expect(NOCHES.map(q => [q.objeto, q.cantidad])).toEqual([['tubo', 16], ['comida', 9], ['bateria', 6], ['pieza', 24], ['fusible', 10]]);
  });
  it('los dragones de cada noche existen', () => {
    for (const q of NOCHES) for (const id of q.dragones) expect(DRAGONES.some(d => d.id === id), `${id} (noche ${q.n})`).toBe(true);
  });
  it('la noche 5 es con todos y con apagón', () => {
    expect(nocheDe(5).dragones.length).toBe(DRAGONES.length);
    expect(nocheDe(5).apagon).toBe(true);
  });
  it('cada objeto tiene nombre para el contador', () => { for (const q of NOCHES) expect(OBJETOS[q.objeto]).toBeTruthy(); });
  it('después de la 5 todavía no hay noche (la final viene después)', () => { expect(siguienteNoche(1)).toBe(2); expect(siguienteNoche(5)).toBe(null); });
});

describe('dónde aparecen los objetos', () => {
  it('aparecen todos, dentro de una sala, y nunca en el Spawn ni en el refugio', () => {
    const l = lugaresObjetos(24, semilla(3));
    expect(l.length).toBe(24);
    for (const p of l) {
      const s = salaEn(p.x, p.y, p.z);
      expect(s).not.toBe(null);
      expect(['spawn', 'panico']).not.toContain(s.id);
    }
  });
  it('hay arriba y abajo (en los subsuelos)', () => {
    const l = lugaresObjetos(16, semilla(5));
    expect(l.some(p => p.y === 0)).toBe(true);
    expect(l.some(p => p.y < 0)).toBe(true);
  });
  it('no quedan dos pegados', () => {
    const l = lugaresObjetos(24, semilla(9));
    for (const a of l) for (const b of l) if (a !== b) expect(Math.hypot(a.x - b.x, a.z - b.z) >= 3 || a.y !== b.y).toBe(true);
  });
});

describe('jugar una noche', () => {
  it('empieza con la intro y después se juega', () => {
    const q = nuevaNoche(1, semilla());
    expect(q.fase).toBe('intro');
    tickNoche(q, INTRO_SEGUNDOS + 0.1);
    expect(q.fase).toBe('jugando');
  });
  it('durante la intro no se puede agarrar nada', () => {
    const q = nuevaNoche(1, semilla()), o = q.objetos[0];
    expect(recoger(q, 0, o)).toBe(false);
  });
  it('agarrar un objeto (E): solo si estás cerca, y una sola vez', () => {
    const q = empezada(1), o = q.objetos[0];
    expect(recoger(q, 0, { x: o.x + 10, y: o.y, z: o.z })).toBe(false);
    expect(objetoCerca(q, o)).toBe(0);
    expect(recoger(q, 0, o)).toBe(true);
    expect(recoger(q, 0, o)).toBe(false);
    expect(llevaDe(q, 'yo')).toBe(1);
    expect(entregados(q)).toBe(0);   // todavía no lo llevas al Center Lab
  });
  it('🧪 se entregan al llegar a la máquina del Center Lab (lejos, no)', () => {
    const q = empezada(1);
    recoger(q, 0, q.objetos[0]); recoger(q, 1, q.objetos[1]);
    expect(entregar(q, { x: 0, y: 0, z: 0 })).toBe(0);
    expect(entregar(q, MAQUINA)).toBe(2);
    expect(entregados(q)).toBe(2); expect(llevaDe(q, 'yo')).toBe(0);
  });
  it('cada uno entrega solo lo que lleva él', () => {
    const q = empezada(1);
    recoger(q, 0, q.objetos[0], 'ana'); recoger(q, 1, q.objetos[1], 'beto');
    expect(entregar(q, MAQUINA, 'ana')).toBe(1);
    expect(llevaDe(q, 'beto')).toBe(1);
  });
  it('🐉 si te atrapan, lo que llevabas vuelve a su lugar', () => {
    const q = empezada(1);
    recoger(q, 0, q.objetos[0]);
    expect(soltar(q, 'yo')).toBe(1);
    expect(q.objetos[0].estado).toBe('suelto');
    expect(objetoCerca(q, q.objetos[0])).toBe(0);
  });
  it('con todos entregados ganas la noche', () => {
    const q = empezada(3);
    q.objetos.forEach((o, i) => recoger(q, i, o));
    expect(nocheCompleta(q)).toBe(false);   // las llevas, pero falta conectarlas en la máquina
    entregar(q, MAQUINA);
    expect(tickNoche(q, 0.1)).toBe(true);
    expect(q.fase).toBe('ganada');
  });
});

import { describe, it, expect } from 'vitest';
import { SALAS, ESCOTILLAS, ESCONDITES, SPAWN, LOBBY_SPAWN, FIESTA_SPAWN, PISO_PRINCIPAL, PISO_SUBSUELO, salaEn, escotillaEn, esconditeCerca, tramosDePared, puertasSinPareja } from '../src/laboratorio.js';

const sala = id => SALAS.find(s => s.id === id);

describe('el plano del laboratorio', () => {
  it('toda puerta lleva a otra sala (ninguna da contra una pared)', () => expect(puertasSinPareja()).toEqual([]));
  it('apareces en el Spawn', () => expect(salaEn(SPAWN.x, SPAWN.y, SPAWN.z).id).toBe('spawn'));
  it('ninguna sala del mismo piso se encima con otra', () => {
    for (const a of SALAS) for (const b of SALAS) {
      if (a === b || a.y !== b.y) continue;
      const seEncima = a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
      expect(seEncima, `${a.id} y ${b.id}`).toBe(false);
    }
  });
  it('cada escotilla está arriba en su sala y abajo en su subsuelo', () => {
    for (const e of ESCOTILLAS) {
      const cx = (e.x0 + e.x1) / 2, cz = (e.z0 + e.z1) / 2;
      expect(salaEn(cx, PISO_PRINCIPAL, cz).id).toBe(e.desde);
      expect(salaEn(cx, PISO_SUBSUELO, cz).id).toBe(e.hacia);
    }
  });
  it('cada escondite está dentro de una sala de su piso', () => {
    for (const e of ESCONDITES) expect(salaEn(e.x, e.y, e.z), `${e.tipo} en ${e.x}, ${e.z}`).not.toBe(null);
  });
  it('🏠 el lobby y 🎈 la fiesta existen, aparte del laboratorio', () => {
    expect(sala('lobby').zona).toBe('lobby');
    expect(SALAS.filter(q => q.zona === 'fiesta').length).toBeGreaterThan(5);
    expect(salaEn(LOBBY_SPAWN.x, LOBBY_SPAWN.y, LOBBY_SPAWN.z).id).toBe('lobby');
    expect(salaEn(FIESTA_SPAWN.x, FIESTA_SPAWN.y, FIESTA_SPAWN.z).id).toBe('fSpawn');
  });
  it('las ventilaciones son bajitas', () => expect(sala('fVent1').alto).toBeLessThan(3));
  it('el piso principal tiene las salas del dibujo', () => {
    for (const id of ['testLab', 'spawn', 'banos', 'lockers', 'panico', 'centerLab']) expect(sala(id).y).toBe(0);
  });
});

describe('ayudantes', () => {
  it('una pared con una puerta queda en dos tramos', () => expect(tramosDePared(0, 10, [[4, 6]])).toEqual([[0, 4], [6, 10]]));
  it('una puerta del ancho de la pared no deja pared', () => expect(tramosDePared(0, 4, [[0, 4]])).toEqual([]));
  it('dos puertas, en cualquier orden', () => expect(tramosDePared(0, 10, [[7, 8], [1, 2]])).toEqual([[0, 1], [2, 7], [8, 10]]));
  it('fuera del mapa no hay sala', () => expect(salaEn(500, 0, 500)).toBe(null));
  it('encuentra la escotilla en la que estás', () => {
    expect(escotillaEn(29.6, -3, 7).id).toBe('aYellow');
    expect(escotillaEn(0, 0, 0)).toBe(null);
  });
  it('escondite: solo si estás cerca y en el mismo piso', () => {
    const lista = [{ tipo: 'caja', x: 0, z: 0, y: 0 }];
    expect(esconditeCerca(1, 0, 1, lista)).toBe(lista[0]);
    expect(esconditeCerca(5, 0, 0, lista)).toBe(null);
    expect(esconditeCerca(1, -7, 1, lista)).toBe(null);   // estás justo abajo, en el subsuelo
  });
});

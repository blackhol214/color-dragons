import { describe, it, expect } from 'vitest';
import { PAISAJES, ZONAS, zonaSonora, nota, proximaNota, leerAjustes, guardarAjustes, volumenes, AJUSTES_INICIALES, VOLUMEN_MAXIMO, CRUCE_SEGUNDOS, TIPOS_SONIDO, esperaSonido } from '../src/sonido.js';
import { SALAS } from '../src/laboratorio.js';

const sala = id => SALAS.find(s => s.id === id);

describe('🔊 qué zona suena', () => {
  it('en la pantalla de inicio no suena nada', () => expect(zonaSonora({ jugando: false, enLobby: true })).toBe(null));
  it('el lobby', () => expect(zonaSonora({ enLobby: true, sala: sala('lobby') })).toBe('lobby'));
  it('el Spawn, sus escaleras y el Hoyo del Pánico son refugio (aunque haya apagón)', () => {
    for (const id of ['spawn', 'escaleras', 'panico']) expect(zonaSonora({ sala: sala(id), apagon: true }), id).toBe('refugio');
  });
  it('el piso principal es laboratorio, y con apagón suena distinto', () => {
    expect(zonaSonora({ sala: sala('salon') })).toBe('laboratorio');
    expect(zonaSonora({ sala: sala('centerLab'), apagon: true })).toBe('apagon');
  });
  it('los túneles y los cuartos de abajo son subsuelo', () => {
    for (const id of ['tunelNorte', 'greyCove', 'yellowRoom']) expect(zonaSonora({ sala: sala(id) }), id).toBe('subsuelo');
  });
  it('la fiesta, sus ventilaciones y afuera', () => {
    expect(zonaSonora({ fiesta: true, sala: sala('fSalon') })).toBe('fiesta');
    expect(zonaSonora({ fiesta: true, sala: sala('fBloques') })).toBe('fiesta');
    for (const id of ['fVent1', 'fVentA', 'fVent3']) expect(zonaSonora({ fiesta: true, sala: sala(id) }), id).toBe('ventilacion');
    expect(zonaSonora({ fiesta: true, sala: sala('fSalida') })).toBe('afuera');
  });
  it('durante la intro suena el laboratorio (la cámara lo está recorriendo)', () => expect(zonaSonora({ intro: true, sala: sala('spawn') })).toBe('laboratorio'));
  it('entre dos salas sigue la zona de antes (así no salta)', () => expect(zonaSonora({ sala: null, anterior: 'subsuelo' })).toBe('subsuelo'));
  it('todas las salas tienen una zona que existe', () => {
    for (const s of SALAS) expect(ZONAS, s.id).toContain(zonaSonora({ sala: s, fiesta: s.zona === 'fiesta', enLobby: s.zona === 'lobby' }));
  });
  it('cada zona suena distinto (ningún par de paisajes es igual)', () => {
    const firmas = ZONAS.map(z => JSON.stringify(PAISAJES[z]));
    expect(new Set(firmas).size).toBe(ZONAS.length);
  });
  it('el cruce entre zonas dura entre 2 y 3 segundos', () => { expect(CRUCE_SEGUNDOS).toBeGreaterThanOrEqual(2); expect(CRUCE_SEGUNDOS).toBeLessThanOrEqual(3); });
});

describe('🎵 las notas', () => {
  it('12 semitonos arriba es el doble de frecuencia', () => expect(nota(110, 12)).toBeCloseTo(220));
  it('la próxima nota es de la escala y espera lo que dice el paisaje', () => {
    const p = PAISAJES.lobby;
    for (const r of [0, 0.5, 0.999]) {
      const n = proximaNota(p, () => r);
      expect(p.escala.map(s => nota(p.raiz, s))).toContain(n.frec);
      expect(n.espera).toBeGreaterThanOrEqual(p.cada[0]); expect(n.espera).toBeLessThanOrEqual(p.cada[1]);
    }
  });
  it('nada chillón: ninguna nota pasa de 1200 Hz y nunca salen más de una por segundo', () => {
    for (const z of ZONAS) {
      const p = PAISAJES[z];
      for (const s of [...p.escala, ...p.acorde]) expect(nota(p.raiz, s), z).toBeLessThan(1200);
      expect(p.cada[0], z).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('🎚️ ajustes de volumen', () => {
  it('sin nada guardado usa los de siempre', () => { expect(leerAjustes(null)).toEqual(AJUSTES_INICIALES); expect(leerAjustes('{roto')).toEqual(AJUSTES_INICIALES); });
  it('guarda y vuelve a leer lo mismo', () => {
    const a = { musica: 0.3, ambiente: 0.9, silencio: true };
    expect(leerAjustes(guardarAjustes(a))).toEqual(a);
  });
  it('arregla valores raros (fuera de 0 a 1 o que no son números)', () => {
    expect(leerAjustes(JSON.stringify({ musica: 5, ambiente: -1, silencio: 'si' }))).toEqual({ musica: 1, ambiente: 0, silencio: false });
    expect(leerAjustes(JSON.stringify({ musica: 'x' })).musica).toBe(AJUSTES_INICIALES.musica);
  });
  it('silencio = todo a cero', () => expect(volumenes({ musica: 1, ambiente: 1, silencio: true })).toEqual({ musica: 0, ambiente: 0 }));
  it('al 100 % nunca pasa del volumen máximo, y la mitad suena a un cuarto', () => {
    expect(volumenes({ musica: 1, ambiente: 1, silencio: false }).musica).toBe(VOLUMEN_MAXIMO);
    expect(volumenes({ musica: 0.5, ambiente: 0, silencio: false })).toEqual({ musica: VOLUMEN_MAXIMO / 4, ambiente: 0 });
  });
});

describe('🌧️ los sonidos de cada zona', () => {
  it('la música viene apagada y el ambiente prendido', () => { expect(AJUSTES_INICIALES.musica).toBe(0); expect(AJUSTES_INICIALES.ambiente).toBeGreaterThan(0); });
  it('cada zona tiene al menos un ruidito, y todos existen', () => {
    for (const z of ZONAS) {
      expect(PAISAJES[z].sonidos?.length, z).toBeGreaterThan(0);
      for (const s of PAISAJES[z].sonidos) expect(TIPOS_SONIDO, `${z}: ${s.tipo}`).toContain(s.tipo);
    }
  });
  it('cada zona tiene su propia mezcla de ruiditos', () => {
    const mezclas = ZONAS.map(z => PAISAJES[z].sonidos.map(s => s.tipo).sort().join('+'));
    expect(new Set(mezclas).size).toBe(ZONAS.length);
  });
  it('ningún ruidito se repite tan seguido que canse (mínimo 2 s)', () => {
    for (const z of ZONAS) for (const s of PAISAJES[z].sonidos) {
      expect(s.cada[0], `${z}: ${s.tipo}`).toBeGreaterThanOrEqual(2);
      expect(esperaSonido(s, () => 0)).toBe(s.cada[0]); expect(esperaSonido(s, () => 1)).toBe(s.cada[1]);
    }
  });
});

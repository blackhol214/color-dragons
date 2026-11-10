import { describe, it, expect } from 'vitest';
import { colorDeNombre, COLORES_JUGADOR, alLado, moveAndCollide, squashStretch, rumboDeMovimiento, saveKey, serializeSave, parseSave, GUIA_COLORES, siguienteColorGuia, textoQueHago } from '../src/logic.js';

const OPTS = { PR: 0.45, H: 2, STEP_UP: 0.45 };
const cuerpo = (x, z) => ({ pos: { x, y: 0, z }, vel: { x: 0, z: 0 }, onGround: true });

describe('choques', () => {
  it('sin paredes camina libre', () => {
    const st = cuerpo(0, 0);
    expect(moveAndCollide(st, 3, 0, [], OPTS)).toBe(false);
    expect(st.pos.x).toBeCloseTo(3);
  });
  it('una pared alta lo frena (aunque vaya muy rápido)', () => {
    const st = cuerpo(0, 0), pared = { x: 2, z: 0, hw: 0.5, hd: 5, top: 4, bottom: 0 };
    expect(moveAndCollide(st, 10, 0, [pared], OPTS)).toBe(true);
    expect(st.pos.x).toBeCloseTo(2 - 0.5 - 0.45);
  });
  it('un escalón bajito se sube caminando', () => {
    const st = cuerpo(0, 0), escalon = { x: 2, z: 0, hw: 1, hd: 1, top: 0.3, bottom: 0 };
    moveAndCollide(st, 2, 0, [escalon], OPTS);
    expect(st.pos.y).toBeCloseTo(0.3);
  });
});

describe('estirar y aplastar', () => {
  it('quieto en el piso queda normal', () => expect(squashStretch(0, false, 9)).toEqual({ tall: 1, wide: 1 }));
  it('en el aire se estira y adelgaza', () => {
    const s = squashStretch(10, true, 9);
    expect(s.tall).toBeGreaterThan(1); expect(s.wide).toBeLessThan(1);
  });
  it('al aterrizar se aplasta', () => expect(squashStretch(0, false, 0).tall).toBeLessThan(1));
});

describe('hacia dónde mirar', () => {
  it('caminando mira hacia donde va', () => expect(rumboDeMovimiento(0, 5, 2)).toBeCloseTo(0));
  it('quieto usa su giro', () => expect(rumboDeMovimiento(0, 0, 2)).toBe(2));
});

describe('guardado', () => {
  it('la llave no depende de mayúsculas ni espacios', () => expect(saveKey('  Mathias ')).toBe(saveKey('mathias')));
  it('guarda y lee la posición', () => {
    expect(parseSave(serializeSave({ pos: { x: 1, y: 2, z: 3 } })).pos).toEqual({ x: 1, y: 2, z: 3 });
  });
  it('un guardado roto no rompe el juego', () => {
    expect(parseSave('{no es json')).toBe(null);
    expect(parseSave('{"pos":{"x":"hola"}}').pos).toBe(null);
  });
});

describe('bot guía', () => {
  it('los colores dan la vuelta', () => expect(siguienteColorGuia(GUIA_COLORES.length - 1)).toBe(0));
  it('siempre tiene algo que decir', () => expect(textoQueHago('lugar-raro')).toBe(textoQueHago('mundo')));
});

describe('🎨 cada jugador con su color', () => {
  it('el mismo nombre da siempre el mismo color (sin importar mayúsculas)', () => expect(colorDeNombre('Mathias')).toBe(colorDeNombre('  mathias ')));
  it('los colores salen de la lista', () => { for (const n of ['Ana', 'Beto', 'Coco', 'Dani']) expect(COLORES_JUGADOR).toContain(colorDeNombre(n)); });
  it('nombres distintos suelen tener colores distintos', () => {
    const colores = new Set(['Ana', 'Beto', 'Coco', 'Dani', 'Eli', 'Fer'].map(colorDeNombre));
    expect(colores.size).toBeGreaterThan(2);
  });
  it('aparecer al lado: cerca, pero no encima', () => {
    for (let i = 0; i < 50; i++) { const p = alLado({ x: 0, y: 0, z: 0 }), d = Math.hypot(p.x, p.z); expect(d).toBeGreaterThanOrEqual(0.8); expect(d).toBeLessThanOrEqual(2.2); }
  });
});

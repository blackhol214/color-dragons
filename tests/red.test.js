import { describe, it, expect } from 'vitest';
import { BORDE, leerSala, salaDeHost, linkOficial, leerMensaje, limpiarNombre, corto, acercarAngulo, nuevoSuavizador, agregarMuestra, valoresEn, mezclar, TELETRANSPORTE } from '../src/red.js';

describe('salas', () => {
  it('acepta nombres de túnel normales', () => expect(leerSala('Palabras-Raras-123')).toBe('palabras-raras-123'));
  it('rechaza cosas raras', () => {
    expect(leerSala('evil.com/x')).toBe(null);
    expect(leerSala('')).toBe(null);
  });
  it('saca la sala del host de Cloudflare', () => expect(salaDeHost('abc-def.trycloudflare.com')).toBe('abc-def'));
  it('el link oficial es el de Color Dragons', () => expect(linkOficial('abc')).toBe('https://blackhol214.github.io/color-dragons/?sala=abc'));
});

describe('mensajes', () => {
  it('lee un saludo y limpia el nombre', () => {
    expect(leerMensaje(JSON.stringify({ tipo: 'hola', nombre: '  Mathias   el  pro ', color: 123 }))).toEqual({ tipo: 'hola', nombre: 'Mathias el pro', color: 123 });
  });
  it('lee una posición', () => {
    const m = leerMensaje(JSON.stringify({ tipo: 'pos', x: 1, y: 0, z: 2, rot: 0.5, color: 5, t: 100 }));
    expect(m).toEqual({ tipo: 'pos', x: 1, y: 0, z: 2, rot: 0.5, color: 5, oculto: 0, camino: null, mascota: null, t: 100 });
  });
  it('escondido en una caja: solo 1 cuenta como escondido', () => {
    const pos = o => leerMensaje(JSON.stringify({ tipo: 'pos', x: 0, y: 0, z: 0, rot: 0, oculto: o })).oculto;
    expect(pos(1)).toBe(1); expect(pos('si')).toBe(0); expect(pos(undefined)).toBe(0);
  });
  it('ignora mensajes rotos o con trampas', () => {
    expect(leerMensaje('no es json')).toBe(null);
    expect(leerMensaje(JSON.stringify({ tipo: 'pos', x: 'mucho', y: 0, z: 0, rot: 0 }))).toBe(null);
    expect(leerMensaje(JSON.stringify({ tipo: 'hola', nombre: '', color: 1 }))).toBe(null);
    expect(leerMensaje(JSON.stringify({ tipo: 'gigante' }))).toBe(null);
    expect(leerMensaje('x'.repeat(5000))).toBe(null);
  });
  it('🌙 mensajes de las noches', () => {
    expect(leerMensaje(JSON.stringify({ tipo: 'recoger', i: 3 }))).toEqual({ tipo: 'recoger', i: 3 });
    expect(leerMensaje(JSON.stringify({ tipo: 'recoger', i: -1 }))).toBe(null);
    expect(leerMensaje(JSON.stringify({ tipo: 'recoger', i: 'todos' }))).toBe(null);
    expect(leerMensaje(JSON.stringify({ tipo: 'alimentar' }))).toEqual({ tipo: 'alimentar' });
  });
  it('el borde deja caber el lobby y la fiesta (si no, tus amigos aparecen en otro lugar)', () => {
    expect(BORDE).toBeGreaterThan(242);   // la salida de la fiesta llega hasta x = 242
  });
  it('nombres de máximo 20 letras', () => expect(limpiarNombre('a'.repeat(30)).length).toBe(20));
  it('números cortos', () => expect(corto(1.23456)).toBe(1.23));
});

describe('movimiento suave', () => {
  it('gira por el camino más corto', () => {
    expect(acercarAngulo(0.1, -0.1, 1)).toBeCloseTo(-0.1);
    expect(Math.abs(acercarAngulo(3.1, -3.1, 0.5))).toBeGreaterThan(3);
  });
  it('dibuja entre dos posiciones que ya llegaron', () => {
    const s = nuevoSuavizador();
    agregarMuestra(s, [0, 0, 0, 0], 0, 0);
    agregarMuestra(s, [10, 0, 0, 0], 100, 100);
    const v = valoresEn(s, 100 + 120 + 50, null);   // (el retraso mínimo es de unos 120 ms)
    expect(v[0]).toBeGreaterThan(0); expect(v[0]).toBeLessThanOrEqual(10);
  });
  it('si salta muy lejos, aparece allá de golpe', () => {
    expect(mezclar([0, 0, 0], [TELETRANSPORTE + 5, 0, 0], 0.5)).toEqual([TELETRANSPORTE + 5, 0, 0]);
  });
});

import { leerMensaje as leer2 } from '../src/red.js';
import { CAMINOS } from '../src/tienda.js';
describe('✨ el camino viaja con tu posición', () => {
  it('un camino que existe pasa', () => expect(leer2(JSON.stringify({ tipo: 'pos', x: 1, y: 0, z: 2, rot: 0, camino: 'fuego' })).camino).toBe('fuego'));
  it('uno inventado no pasa', () => expect(leer2(JSON.stringify({ tipo: 'pos', x: 1, y: 0, z: 2, rot: 0, camino: 'arcoiris' })).camino).toBe(null));
  it('los caminos válidos son los de la tienda', () => expect(CAMINOS.map(c => c.id)).toEqual(['amarillo', 'fuego', 'electrico']));
});

import { MASCOTAS_VALIDAS } from '../src/red.js';
import { MASCOTAS } from '../src/tienda.js';
it('🥚 las mascotas válidas de la red son las de la tienda', () => expect(MASCOTAS_VALIDAS).toEqual(MASCOTAS.map(m => m.id)));

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
  it('silencio = todo a cero', () => expect(volumenes({ musica: 1, ambiente: 1, silencio: true })).toEqual({ musica: 0, ambiente: 0, efectos: 0, escena: 0 }));
  it('al 100 % nunca pasa del volumen máximo, y la mitad suena a un cuarto', () => {
    expect(volumenes({ musica: 1, ambiente: 1, silencio: false }).musica).toBe(VOLUMEN_MAXIMO);
    expect(volumenes({ musica: 0.5, ambiente: 0, silencio: false })).toEqual({ musica: VOLUMEN_MAXIMO / 4, ambiente: 0, efectos: 0, escena: 0 });
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

import { PASOS, ALCANCE_PASOS, volumenPaso, pasoNumero, ladoDe } from '../src/sonido.js';
describe('🐾 los pasos de los dragones', () => {
  it('los 4 dragones tienen su sonido de pasos, y los 4 son distintos', () => {
    const dragones = ['grey', 'red', 'white', 'yellow'];   // (el otro sonido de pasos es el tuyo: 'jugador')
    expect(Object.keys(PASOS).filter(k => k !== 'jugador').sort()).toEqual(dragones);
    expect(new Set(dragones.map(id => JSON.stringify(PASOS[id]))).size).toBe(4);
  });
  it('🔴 Red pisa más fuerte y más grave que todos', () => {
    for (const id of ['grey', 'yellow', 'white']) { expect(PASOS.red.fuerza, id).toBeGreaterThan(PASOS[id].fuerza); expect(PASOS.red.grave, id).toBeLessThan(PASOS[id].grave); }
  });
  it('⚫ Grey: pasos cortitos y agudos (pequeños)', () => {
    for (const id of ['red', 'yellow', 'white']) { expect(PASOS.grey.dur, id).toBeLessThan(PASOS[id].dur); expect(PASOS.grey.grave, id).toBeGreaterThan(PASOS[id].grave); }
  });
  it('🟡 Yellow: suave (de los más bajitos) pero con su sonido amenazante', () => { expect(PASOS.yellow.fuerza).toBeLessThanOrEqual(PASOS.grey.fuerza); expect(PASOS.yellow.extra).toBe('amenaza'); });
  it('⚪ White queda en el medio entre Red y Yellow', () => {
    for (const k of ['grave', 'dur', 'fuerza']) {
      const [a, b] = [PASOS.red[k], PASOS.yellow[k]].sort((x, y) => x - y);
      expect(PASOS.white[k], k).toBeGreaterThan(a); expect(PASOS.white[k], k).toBeLessThan(b);
    }
  });
  it('más cerca = más fuerte; lejos no se oye; en otro piso, más bajito', () => {
    expect(volumenPaso('red', 0)).toBe(PASOS.red.fuerza);
    expect(volumenPaso('red', 5)).toBeGreaterThan(volumenPaso('red', 12));
    expect(volumenPaso('red', ALCANCE_PASOS)).toBe(0); expect(volumenPaso('red', 99)).toBe(0);
    expect(volumenPaso('red', 5, true)).toBeLessThan(volumenPaso('red', 5));
    expect(volumenPaso('nadie', 1)).toBe(0); expect(volumenPaso('red', NaN)).toBe(0);
  });
  it('cada media vuelta de las piernas es un paso nuevo', () => {
    expect(pasoNumero(0)).toBe(0); expect(pasoNumero(Math.PI - 0.01)).toBe(0); expect(pasoNumero(Math.PI + 0.01)).toBe(1); expect(pasoNumero(2 * Math.PI + 0.1)).toBe(2);
  });
  it('se oye del lado donde está el dragón (comparado con la cámara)', () => {
    // la cámara con yaw 0 mira hacia −z: su derecha es +x
    expect(ladoDe(5, 0, 0)).toBeCloseTo(1); expect(ladoDe(-5, 0, 0)).toBeCloseTo(-1); expect(ladoDe(0, -5, 0)).toBeCloseTo(0);
    // con la cámara girada media vuelta (mira hacia +z), +x queda a la izquierda
    expect(ladoDe(5, 0, Math.PI)).toBeCloseTo(-1);
    expect(ladoDe(0, 0, 0)).toBe(0);
  });
});

describe('🔊 los pasos se oyen de verdad', () => {
  it('los pasos van más fuertes que el fondo (si no, no se oían)', () => {
    const v = volumenes({ musica: 0, ambiente: 0.7, silencio: false });
    expect(v.efectos).toBeGreaterThan(v.ambiente * 3);
  });
  it('si bajas Ambiente a 0, los pasos también se callan', () => expect(volumenes({ musica: 1, ambiente: 0, silencio: false }).efectos).toBe(0));
  it('todos tienen un "cuerpo" de 140 Hz o más (los parlantes de laptop y celular no suenan más grave)', () => {
    for (const [id, p] of Object.entries(PASOS)) expect(p.cuerpo, id).toBeGreaterThanOrEqual(140);
  });
  it('a 10 m Red todavía se oye fuerte (más de la mitad)', () => expect(volumenPaso('red', 10)).toBeGreaterThan(0.5));
});

import { ESCENAS, notaEscena } from '../src/sonido.js';
import { escenaDe, ESCENAS_SALTABLES, letrasVisibles, TEXTO_TERMINA } from '../src/escenas.js';
describe('🎬 las escenas y su música', () => {
  it('cada escena tiene su música, y todas son distintas', () => {
    for (const id of ESCENAS_SALTABLES) expect(ESCENAS[id], id).toBeTruthy();
    expect(new Set(Object.values(ESCENAS).map(e => JSON.stringify(e))).size).toBe(Object.keys(ESCENAS).length);
  });
  it('nada chillón: ninguna nota pasa de 1200 Hz, y nunca más de 6 notas por segundo', () => {
    for (const [id, e] of Object.entries(ESCENAS)) {
      for (let i = 0; i < e.melodia.length; i++) expect(notaEscena(e, i), id).toBeLessThan(1200);
      expect(e.paso, id).toBeGreaterThanOrEqual(0.16);
    }
  });
  it('la melodía da vueltas', () => { const e = ESCENAS.intro; expect(notaEscena(e, e.melodia.length)).toBe(notaEscena(e, 0)); });
  it('la música de las escenas suena aunque la música del juego esté apagada (sigue al deslizador de Ambiente)', () => {
    expect(volumenes({ musica: 0, ambiente: 0.7, silencio: false }).escena).toBeGreaterThan(0);
    expect(volumenes({ musica: 1, ambiente: 0, silencio: false }).escena).toBe(0);
  });
  it('qué escena está pasando', () => {
    expect(escenaDe({ splash: true, nocheFase: 'intro' })).toBe('splash');
    expect(escenaDe({ nocheFase: 'intro' })).toBe('intro');
    expect(escenaDe({ nocheFase: 'intro', apagon: true })).toBe('introApagon');
    expect(escenaDe({ nocheFase: 'intro', introSaltada: true })).toBe(null);
    expect(escenaDe({ nocheFase: 'jugando' })).toBe(null);
    for (const f of ['choque', 'hat', 'fin']) expect(escenaDe({ fiestaFase: f })).toBe(f);
    expect(escenaDe({ fiestaFase: 'intro' })).toBe('fiestaIntro');
    expect(escenaDe({ fiestaFase: 'bloques' })).toBe(null);
    expect(escenaDe()).toBe(null);
  });
});
describe('📜 el texto de las escenas', () => {
  const texto = 'Hola. No te voy a decir quién soy, pero necesito que encuentres 16 tubos de ensayo que se me cayeron por todas partes.';
  it('termina de escribirse a la mitad de la escena (y después se queda para leerlo)', () => {
    expect(letrasVisibles(texto, 28 * TEXTO_TERMINA, 28)).toBe(texto);
    expect(letrasVisibles(texto, 27, 28)).toBe(texto);
    expect(letrasVisibles(texto, 28 * TEXTO_TERMINA * 0.5, 28).length).toBeLessThan(texto.length);
  });
  it('nunca más lento que 8 letras por segundo', () => expect(letrasVisibles('x'.repeat(100), 1, 1000).length).toBe(8));
  it('al principio no se ve nada', () => expect(letrasVisibles(texto, 0, 28)).toBe(''));
});

import { intervaloPasos as intervalo2, PASOS as PASOS2 } from '../src/sonido.js';
describe('👟 tus pasos', () => {
  it('corriendo (12 m/s) suena un paso cada 0,32 s', () => expect(intervalo2(12)).toBeCloseTo(0.32));
  it('con la caja (6 m/s) los pasos van más espaciados', () => expect(intervalo2(6)).toBeGreaterThan(intervalo2(12)));
  it('tus pasos existen y son más suaves que los de Red', () => expect(PASOS2.jugador.fuerza).toBeLessThan(PASOS2.red.fuerza));
});

// 🟥→🟩 Jefe rojo de Mathias: lo que DEBE pasar con el sonido de las puertas (los números los decidió él)
import { volumenPuerta } from '../src/sonido.js';
describe('🚪 el sonido de las puertas (test de Mathias)', () => {
  it('una puerta a 30 metros no se oye (volumen 0)', () => expect(volumenPuerta(30)).toBe(0));
  it('una puerta pegadita suena lo más fuerte (volumen 1)', () => expect(volumenPuerta(0)).toBe(1));
  it('una puerta en otro piso, justo arriba o abajo, suena más bajito (0.3)', () => expect(volumenPuerta(0, true)).toBeCloseTo(0.3));
});

import { describe, it, expect, afterEach } from 'vitest';
import { TEXTOS, t, ponerIdioma, idioma, s } from '../src/idioma.js';
import { SALAS } from '../src/laboratorio.js';
import { CAJAS } from '../src/tienda.js';
import { OBJETOS } from '../src/noches.js';
import { MASCOTAS } from '../src/tienda.js';

const llaves = obj => Object.keys(obj).sort();
const huecos = txt => [...new Set(txt.match(/\{\w+\}/g) || [])].filter(h => h !== '{s}' && h !== '{ies}').sort().join(',');   // ({s} y {ies} son plurales: cada idioma los usa a su modo)

describe('🌍 idiomas', () => {
  afterEach(() => ponerIdioma('es'));
  it('español e inglés tienen exactamente las mismas llaves (no falta ninguna traducción)', () => expect(llaves(TEXTOS.en)).toEqual(llaves(TEXTOS.es)));
  it('las {llaves} de cada texto son las mismas en los dos idiomas', () => {
    for (const k of Object.keys(TEXTOS.es)) {
      expect(huecos(TEXTOS.en[k]), k).toBe(huecos(TEXTOS.es[k]));
    }
  });
  it('cambia de idioma', () => {
    expect(t('sala.panico')).toBe('Hoyo del Pánico');
    ponerIdioma('en'); expect(idioma()).toBe('en');
    expect(t('sala.panico')).toBe('Panic Hole');
  });
  it('un idioma que no existe no cambia nada', () => { ponerIdioma('fr'); expect(idioma()).toBe('es'); });
  it('reemplaza las {llaves}', () => expect(t('toast.conectadoAmigos', { n: 2, s: s(2) })).toBe('¡Conectado! Hay 2 amigos jugando'));
  it('todas las salas, cajas y objetos tienen nombre en los dos idiomas', () => {
    for (const k of [...SALAS.map(q => 'sala.' + q.id), ...CAJAS.map(c => 'caja.' + c.id), ...Object.keys(OBJETOS).map(o => 'obj.' + o), ...MASCOTAS.map(m => 'mascota.' + m.id)]) {
      expect(TEXTOS.es[k], k).toBeTruthy(); expect(TEXTOS.en[k], k).toBeTruthy();
    }
  });
});

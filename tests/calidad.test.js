import { describe, it, expect } from 'vitest';
import { CALIDADES, leerCalidad, leerNivel, calidadInicial, ratioPara, bajarCalidad, ajustarResolucion } from '../src/calidad.js';

describe('⚙️ la calidad de los gráficos', () => {
  it('lee lo guardado (y si está roto, Auto)', () => {
    expect(leerCalidad('media')).toBe('media'); expect(leerCalidad('auto')).toBe('auto'); expect(leerCalidad('ultra')).toBe('auto'); expect(leerCalidad(null)).toBe('auto');
    expect(leerNivel('auto')).toBe(null); expect(leerNivel('baja')).toBe('baja');
  });
  it('una compu potente con pantalla normal empieza en Alta', () => expect(calidadInicial({ nucleos: 8, memoria: 8, ancho: 1920, alto: 1080, ratio: 1 })).toBe('alta'));
  it('una compu chiquita empieza en Baja', () => expect(calidadInicial({ nucleos: 2, memoria: 8, ancho: 1366, alto: 768 })).toBe('baja'));
  it('un celular empieza en Media, y en Baja si su pantalla es muy nítida', () => {
    expect(calidadInicial({ nucleos: 8, tactil: true, ancho: 390, alto: 844, ratio: 2 })).toBe('media');
    expect(calidadInicial({ nucleos: 8, tactil: true, ancho: 1024, alto: 1366, ratio: 2 })).toBe('baja');
  });
  it('una pantalla 4K (muchos píxeles) empieza en Media aunque la compu sea buena', () => expect(calidadInicial({ nucleos: 8, memoria: 16, ancho: 3840, alto: 2160, ratio: 1 })).toBe('media'));
  it('el pixel ratio nunca pasa el de la pantalla, el de la calidad ni 1,5 en un celular', () => {
    expect(ratioPara('alta', 3, false)).toBe(2); expect(ratioPara('alta', 3, true)).toBe(1.5);
    expect(ratioPara('baja', 2, false)).toBe(1); expect(ratioPara('alta', 1, false)).toBe(1);
  });
  it('mientras más baja la calidad, menos lejos se ve y menos píxeles', () => {
    expect(CALIDADES.baja.niebla).toBeLessThan(CALIDADES.media.niebla); expect(CALIDADES.media.niebla).toBeLessThan(CALIDADES.alta.niebla);
    expect(CALIDADES.baja.ratioMax).toBeLessThan(CALIDADES.alta.ratioMax);
  });
  it('si va lento, baja un nivel (y si va bien, no cambia)', () => {
    expect(bajarCalidad('alta', 20)).toBe('media'); expect(bajarCalidad('media', 20)).toBe('baja'); expect(bajarCalidad('baja', 10)).toBe('baja'); expect(bajarCalidad('alta', 45)).toBe('alta');
  });
  it('la resolución baja enseguida si va lento y sube despacito si va sobrado', () => {
    expect(ajustarResolucion(1.5, 2, 30, 0)).toEqual({ ratio: 1.25, buenos: 0 });
    expect(ajustarResolucion(1, 2, 30, 0)).toEqual({ ratio: 1, buenos: 0 });
    let r = { ratio: 1.5, buenos: 0 };
    for (let i = 0; i < 4; i++) r = ajustarResolucion(r.ratio, 2, 60, r.buenos);
    expect(r.ratio).toBe(1.5);
    expect(ajustarResolucion(r.ratio, 2, 60, r.buenos).ratio).toBe(1.75);
  });
});

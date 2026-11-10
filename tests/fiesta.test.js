import { describe, it, expect } from 'vitest';
import { nuevaFiesta, GREY_FIESTA, globoTocado, enElDescanso, empujar, escotillaLibre, cajasQueTapan, enCuartoCajas, ruido, tickGrey, hayLineaFiesta, rutaFiesta, afuera, GLOBOS, CAMA_GREY, RAMPA, DESCANSO, PUERTA_SALIDA, ESCOTILLA_FIESTA, SOMBRERO_FIESTA } from '../src/fiesta.js';
import { salaEn } from '../src/laboratorio.js';

const correrGrey = (f, segundos, jugador) => { let r = null; for (let t = 0; t < segundos && !r; t += 0.05) r = tickGrey(f, 0.05, jugador); return r; };
const lejos = { x: 165, y: 0, z: 8 };   // en el spawn de la fiesta

describe('🎈 la fiesta (noche final)', () => {
  it('los globos y la cama de Grey están dentro del mapa de la fiesta', () => {
    for (const g of GLOBOS) expect(salaEn(g.x, 0, g.z).zona).toBe('fiesta');
    expect(salaEn(CAMA_GREY.x, 0, CAMA_GREY.z).id).toBe('fSalon');
  });
  it('tocar un globo: solo si pasas cerca', () => {
    const f = nuevaFiesta(), g = GLOBOS[0];
    expect(globoTocado(f, { x: g.x + 3, y: 0, z: g.z })).toBe(-1);
    expect(globoTocado(f, { x: g.x + 0.5, y: 0, z: g.z })).toBe(0);
  });
  it('Grey duerme, el globo lo despierta, va a ver y vuelve a dormir', () => {
    const f = nuevaFiesta(); f.fase = 'fiesta';
    correrGrey(f, 5, lejos);
    expect(f.grey.modo).toBe('dormir');
    ruido(f, 176, -3);
    correrGrey(f, 0.5, lejos);
    expect(f.grey.modo).toBe('oir');
    correrGrey(f, 20, lejos);
    expect(f.grey.modo).toBe('dormir');
    expect(Math.hypot(f.grey.x - CAMA_GREY.x, f.grey.z - CAMA_GREY.z)).toBeLessThan(0.4);
  });
  it('si te ve despierto (y estás abajo), te persigue y te atrapa', () => {
    const f = nuevaFiesta(); f.fase = 'fiesta';
    ruido(f, 176, -3);
    expect(correrGrey(f, 20, { x: 176, y: 0, z: -1 })).toBe('atrapado');
  });
  it('arriba de la rampa no te alcanza', () => {
    const f = nuevaFiesta(); f.fase = 'bloques'; f.grey.modo = 'guardia';
    expect(correrGrey(f, 5, { x: 199, y: RAMPA.alto, z: -10 })).toBe(null);
  });
  it('el descanso de arriba de la rampa se detecta', () => {
    expect(enElDescanso({ x: 199, y: RAMPA.alto, z: -10 })).toBe(true);
    expect(enElDescanso({ x: 199, y: 0, z: -10 })).toBe(false);
    expect(salaEn((DESCANSO.x0 + DESCANSO.x1) / 2, 0, -10).id).toBe('fRampa');
  });
  it('📦 la escotilla empieza tapada con cajas (ninguna encimada); hay que sacarlas todas', () => {
    const f = nuevaFiesta();
    for (const a of f.cajas) for (const b of f.cajas) if (a !== b) expect(Math.abs(a.x - b.x) >= 1.3 || Math.abs(a.z - b.z) >= 1.3).toBe(true);
    expect(escotillaLibre(f)).toBe(false);
    expect(cajasQueTapan(f)).toBe(f.cajas.length);
    for (let k = 0; k < 400 && !escotillaLibre(f); k++) f.cajas.forEach((c, i) => empujar(f, i, 0, c.z < (ESCOTILLA_FIESTA.z0 + ESCOTILLA_FIESTA.z1) / 2 ? -0.1 : 0.1));
    expect(escotillaLibre(f)).toBe(true);
  });
  it('una caja no se mete en otra ni se sale del cuarto', () => {
    const f = nuevaFiesta();
    for (let k = 0; k < 300; k++) empujar(f, 0, -0.2, 0);
    expect(f.cajas[0].x).toBeGreaterThan(204);
    expect(empujar(f, 1, -0.2, 0)).toBe(true);
  });
  it('se nota cuando entras al cuarto de las cajas (arriba)', () => {
    expect(enCuartoCajas({ x: 208, y: 3, z: -8 })).toBe(true);
    expect(enCuartoCajas({ x: 208, y: 0, z: -8 })).toBe(false);   // abajo: es el cuarto de abajo
  });
  it('🧱 Grey no ve a través de las paredes, y camina por las puertas', () => {
    expect(hayLineaFiesta({ x: 175, z: -5 }, { x: 165, z: -5 })).toBe(false);   // salón → spawn de la fiesta, por la pared
    expect(hayLineaFiesta({ x: 175, z: -8 }, { x: 165, z: -8 })).toBe(true);    // por la puerta
    expect(rutaFiesta('fSalon', 'fRampa').length).toBeGreaterThan(0);
    expect(rutaFiesta('fSalon', 'fBajo')).toBe(null);   // al cuarto de abajo no llega caminando desde el salón
  });
  it('Grey va hasta el sombrero de fiesta por la puerta (sin atravesar la pared)', () => {
    const f = nuevaFiesta(); f.fase = 'bloques';
    ruido(f, SOMBRERO_FIESTA.x, SOMBRERO_FIESTA.z);
    let paso = false;
    for (let t = 0; t < 30 && f.grey.modo === 'oir'; t += 0.05) {
      const antes = { x: f.grey.x, z: f.grey.z };
      tickGrey(f, 0.05, { x: 165, y: 0, z: 8 });
      if (!hayLineaFiesta(antes, f.grey)) paso = true;   // en un pasito, ¿cruzó una pared?
    }
    expect(paso).toBe(false);
    expect(Math.hypot(f.grey.x - SOMBRERO_FIESTA.x, f.grey.z - SOMBRERO_FIESTA.z)).toBeLessThan(1);
  });
  it('🎈 si te persigue y te escondes (sin que te vea), se rinde y vuelve a dormir', () => {
    const f = nuevaFiesta(); f.fase = 'fiesta';
    f.grey = { ...f.grey, x: 176, z: -3, modo: 'perseguir' };
    correrGrey(f, 20, { x: 199, y: 3, z: -10 });   // tú arriba de la rampa: no te ve
    expect(f.grey.modo).toBe('dormir');
  });
  it('en la fiesta corre más lento que tú (te puedes escapar); en el escape, rapidísimo', () => {
    expect(GREY_FIESTA.correFiesta).toBeLessThan(12);
    expect(GREY_FIESTA.corre).toBeGreaterThan(GREY_FIESTA.correFiesta);
  });
  it('a través de una pared no te atrapa (aunque estés al lado)', () => {
    const f = nuevaFiesta(); f.fase = 'fiesta';
    f.grey = { ...f.grey, x: 169, z: -2, modo: 'guardia' };
    expect(correrGrey(f, 2, { x: 167, y: 0, z: -2 })).toBe(null);   // tú en el spawn, Grey en el salón, pared en medio
  });
  it('afuera: pasaste la puerta de la salida', () => {
    expect(afuera({ x: 234, z: PUERTA_SALIDA.z + 3 })).toBe(true);
    expect(afuera({ x: 234, z: PUERTA_SALIDA.z - 3 })).toBe(false);
  });
});

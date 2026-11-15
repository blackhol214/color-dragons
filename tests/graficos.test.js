import { describe, it, expect } from 'vitest';
import { INTENTOS_RENDER, crearRendererSeguro, navegadorDe, pasosSinGraficos } from '../src/graficos.js';

// Un "crear" de mentira: falla las primeras n veces (como un navegador que no deja usar WebGL con antialias)
const fallaPrimeras = n => { const vistos = []; const crear = op => { vistos.push(op); if (vistos.length <= n) throw new Error('Error creating WebGL context.'); return { soy: 'renderer', op }; }; crear.vistos = vistos; return crear; };

describe('🖥️ arrancar los gráficos sin romperse', () => {
  it('si todo anda, usa el primer intento (el más lindo, con antialias)', () => {
    const r = crearRendererSeguro(fallaPrimeras(0));
    expect(r.ok).toBe(true); expect(r.intento).toBe(0); expect(r.renderer.op.antialias).toBe(true); expect(r.errores).toEqual([]);
  });
  it('si el primero falla, prueba con uno más liviano', () => {
    const crear = fallaPrimeras(1), r = crearRendererSeguro(crear);
    expect(r.ok).toBe(true); expect(r.intento).toBe(1); expect(r.renderer.op.antialias).toBe(false);
    expect(r.errores).toEqual(['Error creating WebGL context.']);
  });
  it('el último intento es el más liviano de todos', () => {
    const r = crearRendererSeguro(fallaPrimeras(2));
    expect(r.intento).toBe(2); expect(r.renderer.op.powerPreference).toBe('low-power');
  });
  it('si ninguno funciona, NO lanza un error: avisa (así el juego puede explicar qué hacer)', () => {
    const crear = fallaPrimeras(99);
    let r; expect(() => { r = crearRendererSeguro(crear); }).not.toThrow();
    expect(r.ok).toBe(false); expect(r.renderer).toBe(null); expect(r.errores).toHaveLength(INTENTOS_RENDER.length);
    expect(crear.vistos).toHaveLength(INTENTOS_RENDER.length);   // probó todos, uno por uno
  });
  it('un crear que devuelve nada cuenta como fallido', () => {
    const r = crearRendererSeguro(() => null);
    expect(r.ok).toBe(false); expect(r.errores.every(e => e === 'vacío')).toBe(true);
  });
  it('se detiene en el primero que funciona (no crea renderers de más)', () => {
    const crear = fallaPrimeras(0); crearRendererSeguro(crear);
    expect(crear.vistos).toHaveLength(1);
  });
});

describe('🧭 qué navegador es', () => {
  const UA = {
    chrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    opera: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 OPR/115.0.0.0',
    chromeIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1',
  };
  it('reconoce Chrome, Edge, Firefox, Safari y Opera', () => {
    for (const n of ['chrome', 'edge', 'firefox', 'safari', 'opera']) expect(navegadorDe(UA[n]), n).toBe(n);
  });
  it('Edge y Opera no se confunden con Chrome (aunque digan "Chrome" adentro)', () => { expect(navegadorDe(UA.edge)).toBe('edge'); expect(navegadorDe(UA.opera)).toBe('opera'); });
  it('Chrome en iPhone cuenta como Chrome', () => expect(navegadorDe(UA.chromeIphone)).toBe('chrome'));
  it('si no lo conoce (o no hay nada), dice "otro"', () => { expect(navegadorDe('')).toBe('otro'); expect(navegadorDe(undefined)).toBe('otro'); expect(navegadorDe('Robotito/1.0')).toBe('otro'); });
});

describe('📝 los pasos para arreglarlo', () => {
  it('siempre empieza con reiniciar y cerrar pestañas, y termina con "probar otra vez"', () => {
    for (const n of ['chrome', 'edge', 'firefox', 'safari', 'opera', 'otro', 'raro']) {
      const p = pasosSinGraficos(n);
      expect(p.slice(0, 2), n).toEqual(['sinGraficos.paso.reiniciar', 'sinGraficos.paso.pestanas']);
      expect(p.at(-1), n).toBe('sinGraficos.paso.probar');
    }
  });
  it('cada navegador conocido tiene su paso de la aceleración por hardware', () => {
    expect(pasosSinGraficos('chrome')).toContain('sinGraficos.paso.chrome');
    expect(pasosSinGraficos('edge')).toContain('sinGraficos.paso.edge');
    expect(pasosSinGraficos('firefox')).toContain('sinGraficos.paso.firefox');
    expect(pasosSinGraficos('safari')).toContain('sinGraficos.paso.safari');
    expect(pasosSinGraficos('opera')).toContain('sinGraficos.paso.chrome');   // (Opera es Chrome por dentro)
  });
  it('un navegador desconocido solo recibe los pasos generales', () => expect(pasosSinGraficos('otro')).toHaveLength(3));
});

import { describe, it, expect } from 'vitest';
import { MASCOTAS, PRECIO_HUEVO, sacarMascota, abrirHuevo, venderRepetida, llevarMascota, CAMINOS, puedeEntrarCaminos, comprarCamino, ponerCamino, COSTO_SEGUIR, pagarParaSeguir, CAJAS, PALETA, COLOR_INICIAL, MONEDAS_POR_NOCHE, nuevaCuenta, ganarNoche, pintar, puedeEntrar, comprar, ponerCaja, leerCuenta } from '../src/tienda.js';

describe('🪙 monedas', () => {
  it('empiezas con 0 monedas, verde y con la caja de cartón', () => {
    expect(nuevaCuenta()).toEqual({ monedas: 0, color: COLOR_INICIAL, cajas: ['carton'], caja: 'carton', caminos: [], camino: null, mascotas: {}, mascota: null });
  });
  it('cada noche ganada da 10', () => {
    let c = nuevaCuenta();
    for (let i = 0; i < 5; i++) c = ganarNoche(c);
    expect(MONEDAS_POR_NOCHE).toBe(10);
    expect(c.monedas).toBe(50);
  });
});

describe('🎨 balde de pintura', () => {
  it('pinta con un color de la paleta', () => expect(pintar(nuevaCuenta(), PALETA[3]).color).toBe(PALETA[3]));
  it('un color que no está en la paleta no hace nada', () => expect(pintar(nuevaCuenta(), 0x123456).color).toBe(COLOR_INICIAL));
});

describe('🛒 tienda de cajas', () => {
  it('la caja espacial vale 15', () => expect(CAJAS.find(c => c.id === 'espacial').precio).toBe(15));
  it('con 10 monedas te echan; con 20 te dejan entrar', () => {
    expect(puedeEntrar({ ...nuevaCuenta(), monedas: 10 })).toBe(false);
    expect(puedeEntrar({ ...nuevaCuenta(), monedas: 20 })).toBe(true);
  });
  it('comprar descuenta las monedas y te pone la caja', () => {
    const r = comprar({ ...nuevaCuenta(), monedas: 20 }, 'espacial');
    expect(r.ok).toBe(true);
    expect(r.cuenta.monedas).toBe(5);
    expect(r.cuenta.cajas).toContain('espacial');
    expect(r.cuenta.caja).toBe('espacial');
  });
  it('sin monedas suficientes no se compra (y no te quita nada)', () => {
    const r = comprar({ ...nuevaCuenta(), monedas: 14 }, 'espacial');
    expect(r).toMatchObject({ ok: false, motivo: 'no-alcanza' });
    expect(r.cuenta.monedas).toBe(14);
  });
  it('no se compra dos veces la misma caja', () => {
    const una = comprar({ ...nuevaCuenta(), monedas: 40 }, 'espacial').cuenta;
    expect(comprar(una, 'espacial')).toMatchObject({ ok: false, motivo: 'ya-la-tienes' });
  });
  it('si ya tienes todas las cajas, entras a elegir aunque tengas 0', () => {
    const todas = { ...nuevaCuenta(), cajas: CAJAS.map(c => c.id) };
    expect(puedeEntrar(todas)).toBe(true);
  });
  it('solo te puedes poner cajas que tienes', () => {
    expect(ponerCaja(nuevaCuenta(), 'espacial').caja).toBe('carton');
    expect(ponerCaja({ ...nuevaCuenta(), cajas: ['carton', 'espacial'] }, 'espacial').caja).toBe('espacial');
  });
});

describe('💾 leer la cuenta guardada', () => {
  it('un guardado bueno se lee igual', () => {
    const c = { monedas: 35, color: PALETA[2], cajas: ['carton', 'espacial'], caja: 'espacial', caminos: ['fuego'], camino: 'fuego', mascotas: { oso: 2 }, mascota: 'oso' };
    expect(leerCuenta(c)).toEqual(c);
  });
  it('un guardado raro no rompe nada', () => {
    expect(leerCuenta({ monedas: -5, color: 'rojo', cajas: ['inventada'], caja: 'espacial' })).toEqual(nuevaCuenta());
    expect(leerCuenta(null)).toEqual(nuevaCuenta());
  });
});

describe('💀 pagar para seguir en la noche', () => {
  it('cuesta 20', () => expect(COSTO_SEGUIR).toBe(20));
  it('con 25 pagas y te quedan 5', () => expect(pagarParaSeguir({ ...nuevaCuenta(), monedas: 25 })).toMatchObject({ ok: true, cuenta: { monedas: 5 } }));
  it('con 19 no puedes (y no te quita nada)', () => expect(pagarParaSeguir({ ...nuevaCuenta(), monedas: 19 })).toMatchObject({ ok: false, cuenta: { monedas: 19 } }));
});

describe('📦 las cajas nuevas', () => {
  it('están la de Navidad, la mojada y la piedra mascota', () => { for (const id of ['regalo', 'playa', 'piedra']) expect(CAJAS.map(c => c.id)).toContain(id); });
  it('con 30 monedas compras la piedra y te la pones', () => {
    const r = comprar({ ...nuevaCuenta(), monedas: 30 }, 'piedra');
    expect(r).toMatchObject({ ok: true, cuenta: { monedas: 0, caja: 'piedra' } });
  });
  it('un guardado con la caja de Navidad se lee bien', () => expect(leerCuenta({ monedas: 3, cajas: ['carton', 'regalo'], caja: 'regalo' }).caja).toBe('regalo'));
});

describe('✨ caminos (trails)', () => {
  it('hay amarillo, fuego y eléctrico', () => expect(CAMINOS.map(c => c.id)).toEqual(['amarillo', 'fuego', 'electrico']));
  it('empiezas sin camino', () => expect(nuevaCuenta().camino).toBe(null));
  it('con 5 monedas te echan de la tienda de caminos; con 10 entras', () => {
    expect(puedeEntrarCaminos({ ...nuevaCuenta(), monedas: 5 })).toBe(false);
    expect(puedeEntrarCaminos({ ...nuevaCuenta(), monedas: 10 })).toBe(true);
  });
  it('comprar el de fuego: descuenta y te lo pone', () => expect(comprarCamino({ ...nuevaCuenta(), monedas: 30 }, 'fuego')).toMatchObject({ ok: true, cuenta: { monedas: 5, camino: 'fuego', caminos: ['fuego'] } }));
  it('no te alcanza: no compra nada', () => expect(comprarCamino({ ...nuevaCuenta(), monedas: 24 }, 'electrico')).toMatchObject({ ok: false, motivo: 'no-alcanza' }));
  it('te lo puedes quitar (null) y volver a poner', () => {
    const c = comprarCamino({ ...nuevaCuenta(), monedas: 10 }, 'amarillo').cuenta;
    expect(ponerCamino(c, null).camino).toBe(null);
    expect(ponerCamino(ponerCamino(c, null), 'amarillo').camino).toBe('amarillo');
    expect(ponerCamino(c, 'fuego').camino).toBe('amarillo');   // (el de fuego no lo tiene)
  });
});

describe('🥚 mascotas', () => {
  it('son 6, y las probabilidades suman 100%', () => {
    expect(MASCOTAS.length).toBe(6);
    expect(MASCOTAS.reduce((n, m) => n + m.prob, 0)).toBe(100);
  });
  it('las 3 primeras (comunes) tienen más probabilidad que las 3 raras', () => {
    const comunes = MASCOTAS.filter(m => !m.rara), raras = MASCOTAS.filter(m => m.rara);
    expect(comunes.map(m => m.id)).toEqual(['ganso', 'oso', 'planta']);
    expect(Math.min(...comunes.map(m => m.prob))).toBeGreaterThan(Math.max(...raras.map(m => m.prob)));
  });
  it('el azar cae en el pedazo correcto', () => {
    expect(sacarMascota(() => 0)).toBe('ganso');        // 0
    expect(sacarMascota(() => 0.31)).toBe('oso');       // 31
    expect(sacarMascota(() => 0.85)).toBe('fantasma');  // 85
    expect(sacarMascota(() => 0.995)).toBe('arcoiris'); // 99,5
  });
  it('en 10.000 huevos, el ganso sale más o menos el 30% de las veces', () => {
    let semilla = 11; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    let gansos = 0; for (let i = 0; i < 10000; i++) if (sacarMascota(azar) === 'ganso') gansos++;
    expect(gansos / 10000).toBeGreaterThan(0.27); expect(gansos / 10000).toBeLessThan(0.33);
  });
  it('abrir un huevo cuesta 10 y te da la mascota (y te la pone si no llevabas ninguna)', () => {
    const r = abrirHuevo({ ...nuevaCuenta(), monedas: 15 }, () => 0.31);
    expect(PRECIO_HUEVO).toBe(10);
    expect(r).toMatchObject({ ok: true, id: 'oso', nueva: true, cuenta: { monedas: 5, mascotas: { oso: 1 }, mascota: 'oso' } });
  });
  it('sin monedas no se abre', () => expect(abrirHuevo({ ...nuevaCuenta(), monedas: 9 })).toMatchObject({ ok: false }));
  it('vender una repetida: te quedas con una y te dan monedas', () => {
    const c = { ...nuevaCuenta(), monedas: 0, mascotas: { ganso: 2 } };
    const r = venderRepetida(c, 'ganso');
    expect(r).toMatchObject({ ok: true, cuenta: { monedas: 3, mascotas: { ganso: 1 } } });
    expect(venderRepetida(r.cuenta, 'ganso').ok).toBe(false);   // la última no se vende
  });
  it('solo llevas mascotas que tienes', () => {
    const c = { ...nuevaCuenta(), mascotas: { oso: 1 } };
    expect(llevarMascota(c, 'oso').mascota).toBe('oso');
    expect(llevarMascota(c, 'arcoiris').mascota).toBe(null);
    expect(llevarMascota(llevarMascota(c, 'oso'), null).mascota).toBe(null);
  });
});

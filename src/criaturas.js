// 🐉 Cómo se VEN y cómo se MUEVEN los dragones (diseños de Mathias). El cerebro (adónde van) está en src/dragones.js.
// Todo se arma con figuras simples (cajas, esferas, cilindros) y se anima con senos (Math.sin): nada de archivos.
//
// La regla de oro para que no se vea "glitcheado": las piernas avanzan según lo que el dragón CAMINA de verdad
// (fase += velocidad × tiempo). Así los pies nunca patinan, y si frena, las piernas frenan con él.
const THREE = window.THREE;

const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const NEGRO = new THREE.MeshBasicMaterial({ color: 0x111111 });
const BLANCO_OJO = () => lam(0xf2f0e8);
const suave = (desde, hacia, dt, rapidez) => desde + (hacia - desde) * Math.min(1, dt * rapidez);   // acercarse de a poco (sin saltos)
function malla(geo, mat, x = 0, y = 0, z = 0, padre = null) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  if (padre) padre.add(m);
  return m;
}
function grupo(x = 0, y = 0, z = 0, padre = null) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  if (padre) padre.add(g);
  return g;
}
// Un ojo: lo blanco y la pupila (la pupila se mueve dentro del ojo)
function ojo(padre, x, y, z, r, rPupila, { blanco = BLANCO_OJO(), escalaZ = 0.55 } = {}) {
  const b = malla(new THREE.SphereGeometry(r, 16, 12), blanco, x, y, z, padre); b.scale.z = escalaZ;
  const p = malla(new THREE.SphereGeometry(rPupila, 12, 10), NEGRO, x, y, z + r * escalaZ * 0.92, padre); p.scale.z = 0.4;
  return { blanco: b, pupila: p, base: p.position.clone(), rango: r - rPupila * 0.9 };
}
// Una pierna con muslo, rodilla y pie. La cadera queda ADENTRO del cuerpo: así la pierna es parte del cuerpo y no "se sale"
function pierna(padre, x, y, z, mat, { muslo = 0.5, canilla = 0.45, ancho = 0.26, pie = 0.4 } = {}) {
  const cadera = grupo(x, y, z, padre);
  malla(new THREE.BoxGeometry(ancho, muslo + 0.15, ancho * 1.1), mat, 0, -muslo / 2 + 0.07, 0, cadera);
  const rodilla = grupo(0, -muslo, 0, cadera);
  malla(new THREE.SphereGeometry(ancho * 0.55, 10, 8), mat, 0, 0, 0, rodilla);   // la rodilla redondita (une las dos partes)
  malla(new THREE.BoxGeometry(ancho * 0.9, canilla, ancho), mat, 0, -canilla / 2, 0, rodilla);
  malla(new THREE.BoxGeometry(ancho * 1.15, 0.12, pie), mat, 0, -canilla + 0.04, pie * 0.25, rodilla);
  return { cadera, rodilla };
}
// Una cola de varios pedazos: cada pedazo cuelga del anterior, así al moverse se dobla como una cola de verdad
function cola(padre, x, y, z, mat, n, largo, grosor, { punta = null } = {}) {
  const partes = [];
  let p = grupo(x, y, z, padre);
  for (let i = 0; i < n; i++) {
    const g = grupo(0, 0, i === 0 ? 0 : -largo, i === 0 ? p : partes[i - 1]);
    const k = 1 - i / (n + 1);
    malla(new THREE.BoxGeometry(grosor * k, grosor * k, largo + 0.05), mat, 0, 0, -largo / 2, g);
    partes.push(g);
  }
  if (punta) { const c = malla(new THREE.ConeGeometry(0.16, 0.4, 4), punta, 0, 0, -largo - 0.15, partes[n - 1]); c.rotation.x = -Math.PI / 2; }
  return partes;
}
// Púas en fila (la espalda dentada de los dibujos)
function puas(padre, mat, desde, hasta, y, n, alto, x = 0, inclinar = -0.35) {
  for (let i = 0; i < n; i++) {
    const z = desde + (hasta - desde) * (i / Math.max(1, n - 1));
    const c = malla(new THREE.ConeGeometry(alto * 0.4, alto, 4), mat, x, y + alto / 2 - 0.05, z, padre);
    c.rotation.x = inclinar; c.rotation.y = Math.PI / 4;
  }
}

// ==================== 🔴 RED (dibujo 3 de Mathias): ciego. Cabeza cuadrada ladeada con cuernos en punta, cuerpo largo,
// brazos y piernas curvos y una cola grande con púas. Camina lento; cuando se para, revisa su entorno (dibujo 4):
// levanta un brazo bien alto y gira la cabeza de un lado a otro ====================
// Un tubo curvo que pasa por varios puntos (para los brazos, las piernas y la cola, que en el dibujo son curvos)
function tuboCurvo(puntos, radio, mat, padre, radioFinal = radio) {
  const curva = new THREE.CatmullRomCurve3(puntos.map(p => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curva, 20, radio, 10, false);
  // Que se afine hacia la punta: achicamos cada anillo del tubo según qué tan lejos está del principio
  if (radioFinal !== radio) {
    const pos = geo.attributes.position, centro = new THREE.Vector3(), v = new THREE.Vector3();
    for (let i = 0; i <= 20; i++) {
      const k = i / 20, escala = (radio + (radioFinal - radio) * k) / radio;
      curva.getPointAt(k, centro);
      for (let j = 0; j <= 10; j++) { const n = i * 11 + j; v.fromBufferAttribute(pos, n).sub(centro).multiplyScalar(escala).add(centro); pos.setXYZ(n, v.x, v.y, v.z); }
    }
    geo.computeVertexNormals();
  }
  const m = new THREE.Mesh(geo, mat); padre.add(m);
  // Tapitas redondas en las puntas (para que no se vea hueco)
  malla(new THREE.SphereGeometry(radio, 10, 8), mat, ...puntos[0], padre);
  malla(new THREE.SphereGeometry(radioFinal, 10, 8), mat, ...puntos[puntos.length - 1], padre);
  return { malla: m, curva };
}
function crearRed() {
  const rojo = lam(0xb3342d), oscuro = lam(0x7a221d), garraM = lam(0x2f1a18);
  const obj = new THREE.Group(), cuerpo = grupo(0, 0, 0, obj);
  // Piernas curvas, abiertas hacia los lados y con la punta del pie hacia adentro (como una horquilla)
  const piernas = [];
  for (const sx of [-1, 1]) {
    const cadera = grupo(sx * 0.14, 1.02, 0, cuerpo);
    tuboCurvo([[0, 0.05, 0], [sx * 0.22, -0.45, 0], [sx * 0.3, -0.82, 0.04], [sx * 0.16, -1.0, 0.16]], 0.11, rojo, cadera, 0.09);
    piernas.push({ cadera, lado: sx });
  }
  // El cuerpo: largo y delgado (sin panza), con las dos rayitas y 3 púas en la espalda
  const torso = grupo(0, 1.02, 0, cuerpo);
  malla(new THREE.BoxGeometry(0.5, 1.15, 0.32), rojo, 0, 0.55, 0, torso);
  for (const x of [-0.07, 0.07]) malla(new THREE.BoxGeometry(0.03, 0.75, 0.02), oscuro, x, 0.55, 0.165, torso);
  for (let i = 0; i < 3; i++) { const c = malla(new THREE.ConeGeometry(0.1, 0.34, 6), oscuro, 0, 0.35 + i * 0.3, -0.2, torso); c.rotation.x = -1.1; }
  // Brazos largos y curvos que cuelgan, con garras
  const brazos = [];
  for (const sx of [-1, 1]) {
    const hombro = grupo(sx * 0.3, 1.0, 0, torso);
    const t = tuboCurvo([[0, 0, 0], [sx * 0.16, -0.38, 0.04], [sx * 0.14, -0.82, 0.12], [sx * 0.02, -1.08, 0.2]], 0.075, rojo, hombro, 0.06);
    for (const dx of [-0.05, 0, 0.05]) { const g = malla(new THREE.ConeGeometry(0.025, 0.12, 6), garraM, sx * 0.02 + dx, -1.15, 0.22, hombro); g.rotation.x = Math.PI; }
    brazos.push({ hombro, lado: sx });
  }
  // La cabeza cuadrada va pegada directo al cuerpo (sin cuello), ladeada, con dos cuernos en punta en las esquinas de arriba.
  // ("cuello" es solo el punto donde gira la cabeza: no se ve)
  const cuello = grupo(0, 1.12, 0.02, torso);
  // La cabeza cuadrada: exactamente del mismo ancho que el cuerpo (0,5), con un cuerno en punta
  const CABEZA = 1, ANCHO = 0.5;   // CABEZA: qué tan grande es (1 = normal) · ANCHO: igual que el cuerpo
  const cabeza = grupo(0, 0.28 * CABEZA, 0, cuello);
  cabeza.scale.setScalar(CABEZA);
  cabeza.rotation.z = 0.15;   // un poquito ladeada, como en el dibujo 3
  malla(new THREE.BoxGeometry(ANCHO, 0.39, 0.42), rojo, 0, 0.085, 0, cabeza);   // la parte de arriba (la de abajo es la mandíbula)
  { const c = malla(new THREE.ConeGeometry(0.11, 0.4, 3), oscuro, -0.12, 0.42, -0.02, cabeza); c.rotation.z = 0.5; c.scale.z = 0.3; }   // un solo cuerno plano, como una escama
  // Los ojos: óvalos blancos y planos, del mismo tamaño, con una pupila negra redonda
  const ojos = [];
  for (const sx of [-1, 1]) {
    const blanco = malla(new THREE.CircleGeometry(0.12, 24), new THREE.MeshBasicMaterial({ color: 0xf2f0e8 }), sx * 0.115, 0.1, 0.212, cabeza);
    blanco.scale.set(0.8, 1.15, 1);
    const pupila = malla(new THREE.CircleGeometry(0.045, 20), NEGRO, sx * 0.115, 0.1, 0.216, cabeza);
    ojos.push({ blanco, pupila, base: pupila.position.clone(), rango: 0.05 });
  }
  // La boca: la mandíbula de abajo queda FIJA, pegada al torso, y la CABEZA se levanta como una tapa.
  // Dos filas de dientes en zigzag (arriba y abajo) que encajan entre sí. Sin lengua: adentro solo está oscuro
  const blancoDiente = lam(0xece6d6), adentro = lam(0x2a0b0a);
  malla(new THREE.BoxGeometry(ANCHO - 0.04, 0.12, 0.36), adentro, 0, -0.16, 0, cabeza);   // el hueco de arriba (oscuro)
  const fila = (padre, y, haciaAbajo, desfase) => {   // una fila de dientes por el borde de adelante y los costados
    const n = 7;
    for (let i = 0; i < n; i++) {
      const d = malla(new THREE.ConeGeometry(0.034, 0.09, 4), blancoDiente, -ANCHO / 2 + 0.04 + (i + desfase) * (ANCHO - 0.08) / (n - 1 + desfase), y, 0.19, padre);
      if (haciaAbajo) d.rotation.x = Math.PI;
    }
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
      const d = malla(new THREE.ConeGeometry(0.03, 0.08, 4), blancoDiente, sx * (ANCHO / 2 - 0.035), y, 0.1 - (i + desfase) * 0.11, padre);
      if (haciaAbajo) d.rotation.x = Math.PI;
    }
  };
  fila(cabeza, -0.135, true, 0);
  const mandibula = grupo(0, 0.28 * CABEZA, 0, cuello);   // (cuelga del cuello, no de la cabeza: así no se mueve cuando la cabeza se levanta)
  mandibula.scale.setScalar(CABEZA); mandibula.rotation.z = 0.15;
  malla(new THREE.BoxGeometry(ANCHO, 0.17, 0.42), rojo, 0, -0.195, 0, mandibula);       // el pedazo de abajo de la cara
  malla(new THREE.BoxGeometry(ANCHO - 0.04, 0.02, 0.36), adentro, 0, -0.105, 0, mandibula);   // el fondo de la boca (oscuro)
  fila(mandibula, -0.075, false, 0.5);
  // La cola: grande y curva hacia arriba, en 3 pedazos (para que se doble al moverse), con púas en el borde de arriba
  const cola = [];
  let padre = grupo(0, 0.12, -0.16, torso);
  const tramos = [[[0, 0, 0], [0, -0.12, -0.35], [0, -0.1, -0.7]], [[0, 0, 0], [0, 0.12, -0.32], [0, 0.35, -0.55]], [[0, 0, 0], [0, 0.3, -0.12], [0, 0.6, -0.08]]];
  const radios = [[0.12, 0.1], [0.1, 0.08], [0.08, 0.04]];
  tramos.forEach((pts, i) => {
    const g = grupo(...(i === 0 ? [0, 0, 0] : tramos[i - 1][tramos[i - 1].length - 1]), i === 0 ? padre : cola[i - 1]);
    tuboCurvo(pts, radios[i][0], rojo, g, radios[i][1]);
    const medio = pts[1], c = malla(new THREE.ConeGeometry(0.07 - i * 0.012, 0.26 - i * 0.04, 6), oscuro, medio[0], medio[1] + radios[i][0] + 0.08, medio[2], g);
    c.rotation.x = i === 0 ? -0.6 : i === 1 ? -1.2 : -1.9;
    cola.push(g);
  });
  return { obj, cuerpo, torso, piernas, brazos, cuello, cabeza, ojos, mandibula, cola, alto: 2.9, tamCabeza: CABEZA };
}
function animarRed(c, dt, t, paso, correr) {
  // Camina lento y pesado: las piernas curvas se mueven adelante y atrás, y el cuerpo se balancea
  const s = Math.sin(c.fase);
  for (const p of c.piernas) { p.cadera.rotation.x = s * 0.35 * p.lado; p.cadera.rotation.z = Math.max(0, s * p.lado) * 0.08 * paso; }
  c.cuerpo.position.y = Math.abs(Math.cos(c.fase)) * 0.05 * paso;
  c.cuerpo.rotation.z = Math.sin(c.fase) * 0.025 * paso;
  // Parado, revisa su entorno (dibujo 4): levanta el brazo derecho bien alto y gira la cabeza buscando
  c.tanteo = suave(c.tanteo || 0, 1 - paso, dt, 2);
  for (const b of c.brazos) {
    const colgar = -Math.sin(c.fase + (b.lado > 0 ? Math.PI : 0)) * 0.22 * paso + Math.sin(t * 0.8 + b.lado) * 0.04;
    const arriba = b.lado > 0 ? -2.9 + Math.sin(t * 1.3) * 0.25 : 0.1 + Math.sin(t * 1.1) * 0.08;   // el derecho arriba, el otro colgando
    b.hombro.rotation.x = colgar * (1 - c.tanteo) + arriba * c.tanteo;
    b.hombro.rotation.z = b.lado * (0.05 + c.tanteo * (b.lado > 0 ? 0.15 : 0.05));
  }
  c.cuello.rotation.y = suave(c.cuello.rotation.y, c.tanteo * Math.sin(t * 0.5) * 0.7, dt, 2);   // parado, mira despacio a un lado y al otro
  c.cabeza.rotation.z = 0.15;   // la cabeza un poquito ladeada (fija, como en el dibujo)
  // La boca de marioneta: caminando, cerrada. Parado, la cabeza salta hacia arriba (abre, cierra, abre…) y la mandíbula queda fija
  const salto = c.tanteo > 0.5 ? (Math.sin(t * 7) > 0 ? 0.13 : 0.03) : 0;   // a saltitos: abierta o casi cerrada, sin término medio
  c.cabeza.position.y = suave(c.cabeza.position.y, (0.28 + salto) * c.tamCabeza, dt, 18);   // la cabeza sube; la mandíbula se queda
  // La cola: se mueve despacio de lado a lado, cada pedazo un poquito después (como una ola)
  c.cola.forEach((g, i) => { g.rotation.y = Math.sin(t * 1.1 - i * 0.7) * (0.22 - i * 0.04); });
}

// ==================== ⚫ GREY: cocodrilo de 4 patas, rápido, con la mandíbula llena de dientes ("bro bite") ====================
// Una caja que se afina hacia adelante (para el hocico): las esquinas de adelante se juntan
function cajaAfinada(w, h, d, punta = 0.6) {
  const g = new THREE.BoxGeometry(w, h, d, 1, 1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0) { p.setX(i, p.getX(i) * punta); p.setY(i, p.getY(i) * (0.6 + punta * 0.4)); }
  g.computeVertexNormals();
  return g;
}
const ovalo = (rx, ry, rz, mat, x, y, z, padre) => { const m = malla(new THREE.SphereGeometry(1, 20, 14), mat, x, y, z, padre); m.scale.set(rx, ry, rz); return m; };
function crearGrey() {
  const gris = lam(0x6e757b), lomo = lam(0x4f555b), panza = lam(0xa5a698), diente = lam(0xece6d6), boca = lam(0x6b2f2f), garra = lam(0x2f3236);
  const obj = new THREE.Group(), cuerpo = grupo(0, 0, 0, obj);
  const tronco = grupo(0, 0.85, 0, cuerpo);
  // El cuerpo: un óvalo largo y redondeado, con la panza más clara abajo y el lomo más oscuro arriba
  ovalo(0.62, 0.4, 1.25, gris, 0, 0, 0, tronco);
  ovalo(0.52, 0.25, 1.1, panza, 0, -0.17, 0.02, tronco);
  ovalo(0.42, 0.18, 1.1, lomo, 0, 0.27, -0.02, tronco);
  // Escamas: placas en dos filas por el lomo, y en el medio las púas grandes en zigzag (como en el dibujo)
  for (let i = 0; i < 7; i++) {
    const z = 0.95 - i * 0.3;
    for (const sx of [-1, 1]) { const e = malla(new THREE.BoxGeometry(0.14, 0.07, 0.2), lomo, sx * 0.22, 0.36 - Math.abs(z) * 0.08, z, tronco); e.rotation.z = sx * 0.25; }
    const alto = 0.42 - Math.abs(i - 3) * 0.05, c = malla(new THREE.ConeGeometry(0.15, alto, 4), lomo, 0, 0.38 + alto / 2 - Math.abs(z) * 0.06, z, tronco);
    c.rotation.x = -0.35; c.rotation.y = Math.PI / 4; c.scale.z = 0.45;
  }
  // Las 4 patas, un poco abiertas hacia los lados (como cocodrilo). La cadera queda dentro del cuerpo
  const patas = [];
  for (const [x, z, fase] of [[-0.48, 0.72, 0], [0.48, 0.72, Math.PI], [-0.48, -0.72, Math.PI], [0.48, -0.72, 0]]) {
    const abre = grupo(x, -0.05, z, tronco); abre.rotation.z = Math.sign(x) * 0.22;
    ovalo(0.2, 0.24, 0.26, gris, 0, 0, 0, abre);                             // hombro / cadera redondita
    const p = pierna(abre, 0, -0.05, 0, gris, { muslo: 0.38, canilla: 0.36, ancho: 0.24, pie: 0.34 });
    for (const dx of [-0.08, 0, 0.08]) { const g = malla(new THREE.ConeGeometry(0.03, 0.12, 4), garra, dx, -0.36, 0.24, p.rodilla); g.rotation.x = Math.PI / 2; }   // garras
    patas.push({ ...p, fase, adelante: z > 0, lado: Math.sign(x) });
  }
  // Cuello y cabeza
  ovalo(0.42, 0.3, 0.4, gris, 0, 0.05, 1.15, tronco);
  const cabeza = grupo(0, 0.1, 1.3, tronco);
  const arriba = grupo(0, 0.02, 0, cabeza), abajo = grupo(0, -0.1, 0, cabeza);
  malla(cajaAfinada(0.66, 0.3, 0.55, 0.85), gris, 0, 0.1, 0.2, arriba);               // la parte de atrás de la cabeza
  malla(cajaAfinada(0.56, 0.22, 0.85, 0.62), gris, 0, 0.04, 0.88, arriba);            // el hocico (se afina)
  malla(cajaAfinada(0.46, 0.04, 1.0, 0.65), boca, 0, -0.07, 0.62, arriba);            // el paladar
  for (const sx of [-1, 1]) {
    malla(new THREE.SphereGeometry(0.035, 8, 6), garra, sx * 0.08, 0.14, 1.26, arriba);  // las narices, en la punta
    ovalo(0.12, 0.11, 0.14, gris, sx * 0.21, 0.3, 0.2, arriba);                           // el bulto donde va el ojo
  }
  const ojos = [];
  for (const sx of [-1, 1]) {
    const o = ojo(arriba, sx * 0.21, 0.33, 0.28, 0.075, 0.045, { blanco: lam(0xcdbf5c), escalaZ: 0.8 });
    o.pupila.scale.set(0.35, 1.1, 0.4);   // pupila de rayita (de reptil)
    ojos.push(o);
  }
  for (const sx of [-1, 1]) { const ceja = malla(new THREE.BoxGeometry(0.2, 0.05, 0.12), lomo, sx * 0.21, 0.42, 0.26, arriba); ceja.rotation.z = sx * -0.35; }   // cejas de enojado
  // 🎩 Su sombrerito de copa (porque ¿por qué no?), un poco chueco
  const sombrero = grupo(0, 0.38, 0.05, arriba); sombrero.rotation.z = 0.12; sombrero.rotation.x = -0.08;
  const negro = lam(0x1d1d20);
  malla(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24), negro, 0, 0.02, 0, sombrero);       // el ala
  malla(new THREE.CylinderGeometry(0.19, 0.21, 0.42, 24), negro, 0, 0.25, 0, sombrero);     // la copa
  malla(new THREE.CylinderGeometry(0.215, 0.215, 0.07, 24), lam(0x5b5f64), 0, 0.09, 0, sombrero);   // la cinta (gris, como él)
  malla(cajaAfinada(0.6, 0.15, 0.55, 0.85), gris, 0, -0.05, 0.2, abajo);
  malla(cajaAfinada(0.5, 0.13, 0.82, 0.6), gris, 0, -0.06, 0.86, abajo);
  malla(cajaAfinada(0.4, 0.03, 0.95, 0.6), lam(0x8a4a4a), 0, 0.02, 0.62, abajo);       // la lengua
  // Dientes en zigzag a los dos lados (los de arriba hacia abajo y los de abajo hacia arriba) y dos colmillos adelante
  for (let i = 0; i < 7; i++) for (const sx of [-1, 1]) {
    const z = 0.45 + i * 0.11, ancho = 0.25 - i * 0.012;
    const da = malla(new THREE.ConeGeometry(0.032, 0.1, 4), diente, sx * ancho, -0.1, z, arriba); da.rotation.x = Math.PI;
    malla(new THREE.ConeGeometry(0.028, 0.08, 4), diente, sx * (ancho - 0.02), 0.06, z + 0.055, abajo);
  }
  for (const sx of [-1, 1]) { const g = malla(new THREE.ConeGeometry(0.04, 0.17, 4), diente, sx * 0.15, -0.13, 1.22, arriba); g.rotation.x = Math.PI; }
  // La cola: óvalos que se van afinando, con púas chiquitas siguiendo las del lomo
  const colaP = [];
  let padre = grupo(0, 0, -1.1, tronco);
  for (let i = 0; i < 6; i++) {
    const g = grupo(0, 0, i === 0 ? 0 : -0.38, i === 0 ? padre : colaP[i - 1]), k = 1 - i / 7;
    ovalo(0.32 * k, 0.24 * k, 0.26, gris, 0, 0, -0.19, g);
    const c = malla(new THREE.ConeGeometry(0.08 * k, 0.24 * k, 4), lomo, 0, 0.24 * k, -0.19, g); c.rotation.x = -0.4; c.scale.z = 0.45;
    colaP.push(g);
  }
  return { obj, cuerpo, tronco, patas, cabeza, arriba, abajo, ojos, cola: colaP, alto: 1.5 };
}
function animarGrey(c, dt, t, paso, correr) {
  // Al trote (caminando) se mueven en diagonal; corriendo, galopa: las de adelante juntas y las de atrás juntas
  for (const p of c.patas) {
    const fase = correr > 0.5 ? (p.adelante ? 0 : Math.PI) + (p.lado > 0 ? 0.35 : 0) : p.fase;
    const s = Math.sin(c.fase + fase), amp = 0.4 + correr * 0.45;
    p.cadera.rotation.x = s * amp;
    p.rodilla.rotation.x = (p.adelante ? -1 : 1) * Math.max(0, -s) * (0.6 + correr * 0.5) * paso;
  }
  c.cuerpo.position.y = Math.abs(Math.sin(c.fase)) * (0.04 + correr * 0.1) * paso;
  c.tronco.rotation.x = Math.sin(c.fase) * correr * 0.08 * paso;   // galopando, sube y baja la cabeza
  c.cola.forEach((p, i) => { p.rotation.y = Math.sin(t * (2 + correr * 4) - i * 0.7) * (0.12 + correr * 0.1); });
  // La mandíbula: cerrada paseando (con un "clac" de vez en cuando); persiguiendo, abre y cierra (¡bro bite!)
  const morder = correr > 0.3 ? 0.35 + Math.sin(t * 9) * 0.28 : Math.max(0, Math.sin(t * 0.8) - 0.92) * 3;
  c.abajo.rotation.x = suave(c.abajo.rotation.x, morder, dt, 12);
  c.arriba.rotation.x = suave(c.arriba.rotation.x, -morder * 0.35, dt, 12);
  c.cabeza.rotation.y = Math.sin(t * 0.6) * 0.15 * (1 - correr);
}

// ==================== 🟡 YELLOW: una bola con 3 patitas, ojos enormes y alitas que aletean (sin volar) ====================
function crearYellow() {
  const amarillo = lam(0xc9ad3a), oscuro = lam(0x9a8226), ala = lam(0xb59a2e, { side: THREE.DoubleSide });
  const obj = new THREE.Group(), cuerpo = grupo(0, 0, 0, obj);
  const bola = grupo(0, 1.05, 0, cuerpo);
  malla(new THREE.SphereGeometry(0.82, 24, 18), amarillo, 0, 0, 0, bola);
  // Ojos enormes, todo negros con una pupila blanca (uno un poquito más grande: es "dum")
  const ojos = [];
  for (const [sx, r] of [[-1, 0.3], [1, 0.34]]) {
    const o = ojo(bola, sx * 0.3, 0.12, 0.64, r, r * 0.32, { blanco: lam(0x0d0d0d), escalaZ: 0.45 });
    o.pupila.material = new THREE.MeshBasicMaterial({ color: 0xf4f1e6 });
    ojos.push(o);
  }
  // Púas en la cabeza
  for (const [x, z, rz] of [[-0.2, 0.1, 0.4], [0, 0.05, 0], [0.2, 0.1, -0.4]]) { const c = malla(new THREE.ConeGeometry(0.1, 0.3, 4), oscuro, x, 0.82, z, bola); c.rotation.z = rz; }
  // Alitas de murciélago (pequeñas): una figura con picos
  const forma = new THREE.Shape();
  forma.moveTo(0, 0); forma.lineTo(0.55, 0.35); forma.lineTo(0.5, 0.05); forma.lineTo(0.38, 0.12); forma.lineTo(0.3, -0.08); forma.lineTo(0.15, 0.02); forma.lineTo(0, -0.12);
  const alas = [];
  for (const sx of [-1, 1]) {
    const bis = grupo(sx * 0.55, 0.55, -0.15, bola);
    const m = malla(new THREE.ShapeGeometry(forma), ala, 0, 0, 0, bis); m.scale.x = sx;
    alas.push({ bis, lado: sx });
  }
  // 3 patas: dos adelante y una atrás
  const patas = [];
  for (const [x, z, fase] of [[-0.35, 0.28, 0], [0.35, 0.28, Math.PI * 2 / 3], [0, -0.4, Math.PI * 4 / 3]]) {
    const cadera = grupo(x, 0.5, z, cuerpo);
    malla(new THREE.CylinderGeometry(0.15, 0.15, 0.52, 14), amarillo, 0, -0.25, 0, cadera);   // pata de cilindro (sin dedos)
    patas.push({ cadera, fase });
  }
  return { obj, cuerpo, bola, ojos, alas, patas, alto: 2 };
}
function animarYellow(c, dt, t, paso, correr) {
  for (const p of c.patas) {
    const s = Math.sin(c.fase + p.fase);
    p.cadera.rotation.x = s * (0.45 + correr * 0.3);
    p.cadera.position.y = 0.5 + Math.max(0, Math.cos(c.fase + p.fase)) * 0.12 * paso;   // levanta la pata al avanzar
  }
  c.bola.position.y = 1.05 + Math.abs(Math.sin(c.fase * 1.5)) * 0.08 * paso;
  c.bola.rotation.z = Math.sin(c.fase) * 0.08 * paso;   // se tambalea (tres patas no es fácil)
  c.bola.rotation.x = correr * 0.15;
  for (const a of c.alas) a.bis.rotation.y = a.lado * (0.3 + Math.sin(t * (7 + correr * 8)) * (0.5 + correr * 0.2));   // aletea sin volar
}

// ==================== ⚪ WHITE: un arco blandito (como de gelatina) con ojos grandes; persiguiendo, los ojos se vuelven rojos ====================
function crearWhite() {
  const blanco = new THREE.MeshPhongMaterial({ color: 0xd8d8d2, shininess: 70, specular: 0x555555 });   // brillante: se ve babosito
  const obj = new THREE.Group(), cuerpo = grupo(0, 0, 0, obj);
  // El arco (∩): medio anillo grueso parado, y una pierna debajo de cada punta
  const arco = grupo(0, 1.25, 0, cuerpo);
  malla(new THREE.TorusGeometry(0.5, 0.27, 12, 24, Math.PI), blanco, 0, 0, 0, arco);
  const piernas = [];
  for (const sx of [-1, 1]) {
    const cadera = grupo(sx * 0.5, 1.25, 0, cuerpo);
    malla(new THREE.CylinderGeometry(0.28, 0.28, 1.25, 16), blanco, 0, -0.625, 0, cadera);   // pierna de cilindro (sin pie aparte)
    malla(new THREE.SphereGeometry(0.28, 16, 10), blanco, 0, 0, 0, cadera);   // unión redondita con el arco (sin corte)
    piernas.push({ cadera, lado: sx });
  }
  // La cabeza (como en el dibujo): un ojo chico con pupila, un ojo alto ovalado y la boca: un óvalo oscuro con dientes ("he bite")
  const cabeza = grupo(0, 1.95, 0, cuerpo);
  const ojos = [], petalos = [];
  const lobulo = (x, y, rz, r) => { const p = grupo(x, y, 0, cabeza); p.rotation.z = rz; malla(new THREE.SphereGeometry(r + 0.06, 16, 12), blanco, 0, 0, -0.02, p).scale.set(0.75, 1.35, 0.7); petalos.push(p); return p; };
  // Ojos largos (bien estirados hacia arriba)
  { const p = lobulo(-0.46, 0.12, 0.45, 0.22); p.scale.y = 1.35; const o = ojo(p, 0, 0, 0.11, 0.18, 0.085, { escalaZ: 0.5 }); o.blanco.scale.set(0.7, 1.7, 0.5); ojos.push(o); }
  { const p = lobulo(0.46, 0.12, -0.45, 0.24); p.scale.y = 1.35; const o = ojo(p, 0, 0, 0.12, 0.21, 0.1, { escalaZ: 0.5 }); o.blanco.scale.set(0.65, 1.75, 0.5); ojos.push(o); }
  // La boca va en el medio, al frente (entre los dos ojos)
  const pBoca = lobulo(0, 0.12, 0, 0.3);
  const boca = grupo(0, -0.02, 0.17, pBoca);
  malla(new THREE.SphereGeometry(0.26, 16, 12), lam(0x1a1414), 0, 0, 0, boca).scale.set(0.62, 1.2, 0.35);   // el hueco de la boca
  for (let i = 0; i < 6; i++) {   // dientes alrededor del borde
    const a = i / 6 * Math.PI * 2, d = malla(new THREE.ConeGeometry(0.03, 0.09, 4), lam(0xe8e4d8), Math.cos(a) * 0.13, Math.sin(a) * 0.27, 0.06, boca);
    d.rotation.z = a + Math.PI / 2;
  }
  return { obj, cuerpo, arco, piernas, cabeza, ojos, petalos, boca, alto: 2.6, rojos: false };
}
function animarWhite(c, dt, t, paso, correr) {
  // Camina levantando una pierna y después la otra; el arco se inclina hacia el lado de la pierna que apoya
  for (const p of c.piernas) {
    const s = Math.sin(c.fase + (p.lado > 0 ? Math.PI : 0));
    p.cadera.rotation.x = s * (0.4 + correr * 0.3);
    p.cadera.position.y = 1.25 + Math.max(0, Math.cos(c.fase + (p.lado > 0 ? Math.PI : 0))) * 0.14 * paso;
  }
  c.arco.rotation.z = Math.sin(c.fase) * 0.1 * paso;
  // Gelatina: se estira y se aplasta todo el tiempo (más al caminar), y los pétalos tiemblan un poquito después
  const blob = Math.sin(t * 4.2) * 0.04 + Math.sin(c.fase * 2) * 0.05 * paso;
  c.cuerpo.scale.set(1 - blob * 0.6, 1 + blob, 1 - blob * 0.6);
  c.cabeza.rotation.z = Math.sin(t * 2.1 - 0.6) * 0.1 + Math.sin(c.fase) * 0.06 * paso;
  c.cabeza.rotation.x = Math.sin(t * 1.7) * 0.06 + correr * 0.15;
  c.petalos.forEach((p, i) => { const k = 1 + Math.sin(t * 3 + i * 1.3) * 0.04, alto = p.userData.alto || (p.userData.alto = p.scale.y); p.scale.set(k, k * alto, k); });
  // Cuando te ve, la boca se agranda muchísimo (y tiembla un poquito)
  const grande = 1 + correr * (0.9 + Math.sin(t * 9) * 0.12);
  c.boca.scale.set(1 + correr * 0.5, grande, 1);
}

const FABRICAS = { red: [crearRed, animarRed], grey: [crearGrey, animarGrey], yellow: [crearYellow, animarYellow], white: [crearWhite, animarWhite] };
// Cuánto avanza la fase de las piernas por cada metro caminado (piernas cortas = pasos más seguidos)
const PASOS_POR_METRO = { red: 1.6, grey: 2.7, yellow: 3.4, white: 2.4 };   // (Red es grande: da pasos largos)

export function crearDragon(id) {
  const c = FABRICAS[id][0]();
  if (id === 'red') c.obj.scale.setScalar(1.38);   // 🔴 Red mide 4 m: el doble que tú
  if (id === 'grey') c.obj.scale.setScalar(0.7);    // ⚫ Grey: más chiquito (y rápido)
  Object.assign(c, { id, fase: 0, correr: 0, paso: 0, t: Math.random() * 10, mira: { x: 0, y: 0 }, miraMeta: { x: 0, y: 0 }, miraCambio: 0 });
  c.obj.traverse(m => { if (m.isMesh) m.castShadow = false; });
  return c;
}

const _v = new THREE.Vector3();
// Anima un cuadro. vel: a cuántos m/s va de verdad · persigue: si está persiguiendo · mirar: hacia dónde mirar (Vector3 del mundo) o null
export function animarDragon(c, dt, { vel, persigue, mirar = null }) {
  c.t += dt;
  c.fase += vel * dt * PASOS_POR_METRO[c.id];                 // 👣 las piernas avanzan lo que camina (nunca patinan)
  c.paso = suave(c.paso, Math.min(1, vel / 1.5), dt, 6);       // 0 = quieto, 1 = caminando (cambia de a poco)
  c.correr = suave(c.correr, persigue ? 1 : 0, dt, 3);         // 0 = paseando, 1 = corriendo
  FABRICAS[c.id][1](c, dt, c.t, c.paso, c.correr);
  // 👀 Los ojos: persiguiendo te miran a ti; si no, miran a su alrededor (cada tanto eligen otro lugar)
  if (mirar) {
    for (const o of c.ojos) {
      o.pupila.parent.worldToLocal(_v.copy(mirar));
      const dx = _v.x - o.base.x, dy = _v.y - o.base.y, dz = Math.max(0.3, _v.z - o.base.z);
      o.mx = suave(o.mx || 0, Math.max(-1, Math.min(1, dx / dz)), dt, 8); o.my = suave(o.my || 0, Math.max(-1, Math.min(1, dy / dz)), dt, 8);
    }
  } else {
    if ((c.miraCambio -= dt) <= 0) { c.miraMeta = { x: (Math.random() - 0.5) * 1.6, y: (Math.random() - 0.5) * 1 }; c.miraCambio = 0.8 + Math.random() * 2; }
    for (const o of c.ojos) {
      if (o.loco) {   // 🔴 cada ojo por su lado, a saltitos (desorbitados)
        if ((o.cambio = (o.cambio || 0) - dt) <= 0) { o.meta = { x: (Math.random() - 0.5) * 1.6, y: (Math.random() - 0.5) * 1.6 }; o.cambio = 0.6 + Math.random() * 1.2; }
        o.mx = suave(o.mx || 0, o.meta.x, dt, 4); o.my = suave(o.my || 0, o.meta.y, dt, 4);
      } else { o.mx = suave(o.mx || 0, c.miraMeta.x, dt, 5); o.my = suave(o.my || 0, c.miraMeta.y, dt, 5); }
    }
  }
  for (const o of c.ojos) {
    if (c.id === 'yellow' || c.id === 'grey' || c.id === 'red') { o.pupila.position.copy(o.base); continue; }   // 🟡⚫🔴 sus ojos no se mueven
    const k = Math.min(1, Math.hypot(o.mx, o.my)) / Math.max(1e-6, Math.hypot(o.mx, o.my));
    o.pupila.position.set(o.base.x + o.mx * k * o.rango, o.base.y + o.my * k * o.rango, o.base.z);
  }
  // ⚪ White: persiguiendo, los ojos se vuelven totalmente rojos
  if (c.id === 'white' && c.rojos !== persigue) {
    c.rojos = persigue;
    for (const o of c.ojos) { o.blanco.material.color.setHex(persigue ? 0xc0141a : 0xf2f0e8); o.pupila.visible = !persigue; }
  }
}

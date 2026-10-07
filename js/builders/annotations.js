import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { derivadas } from '../config/dimensiones.js';

export const ESTADOS = {
  confirmada: { color: 0x2e9d5b, texto: 'Confirmada (cota del dibujo)' },
  inferida: { color: 0x2f6fd6, texto: 'Inferida (deducida de cotas)' },
  estimada: { color: 0xe08a1e, texto: 'Estimada (pendiente de confirmar)' },
};

const lineMaterials = Object.fromEntries(
  Object.entries(ESTADOS).map(([k, v]) => [
    k,
    new THREE.LineBasicMaterial({ color: v.color, depthTest: false, transparent: true }),
  ]),
);

function label(text, className, title) {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  if (title) el.title = title;
  return new CSS2DObject(el);
}

/**
 * Línea de cota entre a y b con remates perpendiculares (dirección `perp`).
 * `ref` es la pared u objeto al que pertenece: la cota se oculta con él.
 */
function cota(a, b, perp, estado, nota, ref) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const P = new THREE.Vector3(...perp).multiplyScalar(0.04);
  const pts = [A, B, A.clone().add(P), A.clone().sub(P), B.clone().add(P), B.clone().sub(P)];
  const geometry = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.LineSegments(geometry, lineMaterials[estado]);
  line.renderOrder = 10;

  const group = new THREE.Group();
  group.add(line);
  const valor = A.distanceTo(B).toFixed(2);
  const lbl = label(`${valor} m`, `cota cota--${estado}`, `${ESTADOS[estado].texto}${nota ? ` · ${nota}` : ''}`);
  lbl.position.copy(A).add(B).multiplyScalar(0.5);
  group.add(lbl);
  group.userData = { dir: B.clone().sub(A).normalize(), ref };
  return group;
}

/**
 * Oculta las cotas que se ven de punta (paralelas a la mirada) o cuya pared
 * u objeto de referencia está oculto.
 */
export function updateAnnotationVisibility(group, camDir, refs) {
  if (!group.visible) return;
  for (const c of group.children) {
    const { dir, ref } = c.userData;
    const refObj = ref ? refs[ref] : null;
    c.visible = Math.abs(dir.dot(camDir)) < 0.8 && (!refObj || refObj.visible);
  }
}

/**
 * Nombres de pared: sobre el muro si la pared está visible y a nivel del piso
 * si está oculta; se ocultan los que quedan delante o detrás del centro.
 */
export function updateWallLabelVisibility(group, camDir, center, walls) {
  const v = new THREE.Vector3();
  for (const l of group.children) {
    const { wall, yAlto } = l.userData;
    l.position.y = walls[wall].group.visible ? yAlto : 0;
    v.subVectors(l.position, center).setY(0).normalize();
    l.visible = Math.abs(v.dot(camDir)) < 0.85;
  }
}

/** Cotas principales del modelo, coloreadas según el estado de la medida. */
export function buildAnnotations(d) {
  const { ancho: A, fondo: F, alto: H, espesorMuro: t } = d.ambiente;
  const der = derivadas(d);
  const m = d.mesas;
  const v = der.ventana;
  const g = new THREE.Group();
  g.name = 'cotas';
  const add = (...args) => g.add(cota(...args));

  const X = [1, 0, 0];
  const Y = [0, 1, 0];
  const Z = [0, 0, 1];
  const yA = H + 0.08;
  const yt = m.alto + 0.03;

  // Ambiente.
  add([0, yA, -t - 0.3], [A, yA, -t - 0.3], Z, 'confirmada', 'Ancho interior');
  add([A + t + 0.3, yA, 0], [A + t + 0.3, yA, F], X, 'inferida', 'Fondo interior: suma de medidas del usuario (los dibujos indican 3 m)');
  add([A + t + 0.3, 0, -t - 0.3], [A + t + 0.3, H, -t - 0.3], X, 'confirmada', 'Altura piso–techo');

  // Mesas de cerámica (cotas sobre el canto frontal para no coincidir en planta con las de la ventana).
  const fz = m.fondo - 0.05;
  const fx0 = m.fondo - 0.05;
  const fx1 = A - m.fondo + 0.05;
  add([0, yt, fz], [m.izquierda.largoPared2, yt, fz], Z, 'confirmada', 'Mesa izquierda sobre Pared 2', 'mesaIzquierda');
  add([fx0, yt, 0], [fx0, yt, m.izquierda.largoPared3], X, 'confirmada', 'Mesa izquierda sobre Pared 3', 'mesaIzquierda');
  add([A - m.derecha.largoPared2, yt, fz], [A, yt, fz], Z, 'confirmada', 'Mesa derecha sobre Pared 2', 'mesaDerecha');
  add([fx1, yt, 0], [fx1, yt, m.derecha.largoPared1], X, 'confirmada', 'Mesa derecha sobre Pared 1', 'mesaDerecha');
  const yf = yt + 0.1;
  add([0, yf, m.izquierda.largoPared3 - 0.05], [m.fondo, yf, m.izquierda.largoPared3 - 0.05], Z, 'confirmada', 'Fondo de mesa', 'mesaIzquierda');
  add([A - m.fondo, yf, m.derecha.largoPared1 - 0.05], [A, yf, m.derecha.largoPared1 - 0.05], Z, 'confirmada', 'Fondo de mesa', 'mesaDerecha');
  add(
    [A - m.fondo - 0.04, 0, m.derecha.largoPared1 + 0.04],
    [A - m.fondo - 0.04, m.alto, m.derecha.largoPared1 + 0.04],
    X,
    'confirmada',
    'Altura de mesa',
    'mesaDerecha',
  );
  add([der.huecoCocina.x0, 1.0, m.fondo + 0.06], [der.huecoCocina.x1, 1.0, m.fondo + 0.06], Z, 'inferida', 'Hueco de la estufa = 3.00 − 0.95 − 1.20', 'estufa');
  add([m.fondo, 0.02, 1.2], [A - m.fondo, 0.02, 1.2], Z, 'inferida', 'Pasillo entre frentes de mesa');

  // Ventana (Pared 1).
  const xw = A - 0.03;
  add([xw, v.y0 - 0.06, v.z0], [xw, v.y0 - 0.06, v.z1], Y, 'confirmada', 'Ancho de ventana', 'pared1');
  add([xw, v.y0, v.z1 + 0.06], [xw, v.yTop, v.z1 + 0.06], Z, 'confirmada', 'Alto de ventana', 'pared1');
  const zFin = der.pared1.largo;
  add([xw, v.y0 + 0.3, v.z1], [xw, v.y0 + 0.3, zFin], Y, 'confirmada', 'Ventana → extremo de la Pared 1 (incluye la columna)', 'pared1');
  add([xw, v.y0 + 0.3, 0], [xw, v.y0 + 0.3, v.z0], Y, 'confirmada', 'Pared 2 → ventana', 'pared1');
  add([xw, m.alto, v.z0 - 0.06], [xw, v.y0, v.z0 - 0.06], Z, 'inferida', 'Mesa → alféizar', 'pared1');

  // Pared 3 y columnas de sus esquinas.
  const { z0Alto, z1Alto, z1Bajo } = der.pared3;
  const cn = d.columnas.pared2Pared3;
  const yMuro = d.pared3.altoMuro + 0.06;
  const yBajo = d.pared3.tramoBajo.alto + 0.06;
  add([0.03, 0, z1Alto - 0.08], [0.03, d.pared3.altoMuro, z1Alto - 0.08], Z, 'confirmada', 'Altura muro Pared 3', 'pared3');
  add([0.03, yMuro, z0Alto], [0.03, yMuro, z1Alto], Y, 'confirmada', 'Largo tramo alto Pared 3', 'pared3');
  add([0.03, 0, z1Bajo - 0.06], [0.03, d.pared3.tramoBajo.alto, z1Bajo - 0.06], Z, 'confirmada', 'Altura tramo bajo Pared 3', 'pared3');
  add([0.03, yBajo, z1Alto], [0.03, yBajo, z1Bajo], Y, 'confirmada', 'Largo tramo bajo Pared 3', 'pared3');
  add([0, yMuro + 0.1, cn.z + 0.03], [cn.x, yMuro + 0.1, cn.z + 0.03], Y, 'confirmada', 'Columna Pared 2/3 vista desde la Pared 2');
  add([cn.x + 0.03, yMuro + 0.1, 0], [cn.x + 0.03, yMuro + 0.1, cn.z], Y, 'confirmada', 'Columna Pared 2/3 vista desde la Pared 3');
  add([0.03, yBajo, z1Bajo], [0.03, yBajo, F], Y, 'inferida', 'Columna Pared 3/4 = fondo − 0.11 − 1.90 − 0.80');

  // Pared 4 y entrada.
  const xe = der.pared4.largoMuro;
  add([xe - 0.08, 0, F - 0.03], [xe - 0.08, d.pared4.altoMuro, F - 0.03], X, 'confirmada', 'Altura muro Pared 4', 'pared4');
  const t4 = der.pared4.espesor;
  add([xe, 0.02, F + t4 / 2], [A, 0.02, F + t4 / 2], Z, 'confirmada', 'Ancho de entrada');
  add([A + t + 0.12, 0.3, F], [A + t + 0.12, 0.3, F + t4], X, 'inferida', 'Espesor línea Pared 4 = 0.65 + 1.40 + 1.00 − fondo');
  add([0, d.pared4.altoMuro + 0.06, F - 0.03], [xe, d.pared4.altoMuro + 0.06, F - 0.03], Y, 'inferida', 'Muro Pared 4 = 3.00 − 1.20', 'pared4');

  // Electrodomésticos.
  const e = d.estufa;
  const xc = (der.huecoCocina.x0 + der.huecoCocina.x1) / 2 + e.desplazamientoX;
  const yE = e.altoTablero + e.tapa.alto + 0.06;
  add([xc - e.ancho / 2, yE, 0.06], [xc + e.ancho / 2, yE, 0.06], Y, 'confirmada', 'Ancho de estufa', 'estufa');

  const r = der.refri;
  const yR = d.refrigeradora.alto + 0.05;
  add([r.x1, yR, r.z0], [r.x1, yR, r.z1], X, 'confirmada', 'Ancho de refrigeradora', 'refrigeradora');
  add([r.x0, yR, r.z0 + 0.15], [r.x1, yR, r.z0 + 0.15], Z, 'confirmada', 'Fondo de refrigeradora', 'refrigeradora');
  add([r.x1 + 0.05, 0, r.z0 - 0.05], [r.x1 + 0.05, d.refrigeradora.alto, r.z0 - 0.05], X, 'confirmada', 'Alto de refrigeradora', 'refrigeradora');

  // Espacios libres.
  add([0.3, 0.02, m.izquierda.largoPared3], [0.3, 0.02, r.z0], X, 'confirmada', 'Mesa izquierda → refrigeradora', 'refrigeradora');
  add([0.3, 0.02, r.z1], [0.3, 0.02, F], X, 'confirmada', 'Refrigeradora → Pared 4', 'refrigeradora');
  add([A - 0.3, 0.02, m.derecha.largoPared1], [A - 0.3, 0.02, F], X, 'inferida', 'Mesa derecha → Pared 4', 'mesaDerecha');

  g.visible = false;
  return g;
}

/** Nombres de las paredes, como en los dibujos. */
export function buildWallLabels(d) {
  const { ancho: A, fondo: F, alto: H, espesorMuro: t } = d.ambiente;
  const g = new THREE.Group();
  g.name = 'nombres de paredes';
  const off = t + 0.85;
  const items = [
    ['pared1', 'Pared 1 · ventana', [A + off, F / 2]],
    ['pared2', 'Pared 2 · estufa', [A / 2, -off]],
    ['pared3', 'Pared 3', [-off, F / 2]],
    ['pared4', 'Pared 4 · entrada', [A / 2, F + off]],
  ];
  for (const [wall, text, [x, z]] of items) {
    const l = label(text, 'wall-label');
    l.position.set(x, H + 0.1, z);
    l.userData = { wall, yAlto: H + 0.1 };
    g.add(l);
  }
  return g;
}

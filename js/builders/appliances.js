import * as THREE from 'three';
import { derivadas } from '../config/dimensiones.js';
import { addEdges, boxBetween, setShadows } from '../utils/geometry.js';

const box = (min, max, mat, group) => {
  const mesh = boxBetween(min, max, mat, { worldUV: false });
  group.add(mesh);
  return mesh;
};

/**
 * Estufa de piso con horno, 4 hornillas y tapa de vidrio levantada.
 * Se ubica centrada en el hueco entre las mesas de la Pared 2, con el frente hacia +Z.
 */
export function buildStove(d, M) {
  const e = d.estufa;
  const m = d.mesas;
  const { x0: hx0, x1: hx1 } = derivadas(d).huecoCocina;
  const group = new THREE.Group();
  group.name = 'estufa';

  const xc = (hx0 + hx1) / 2 + e.desplazamientoX;
  const x0 = xc - e.ancho / 2;
  const x1 = xc + e.ancho / 2;
  const z0 = e.separacionPared;
  const z1 = z0 + e.fondo;
  const yb = m.zocalo.enHuecoCocina ? m.zocalo.alto : 0;
  const yT = e.altoTablero;
  const W = e.ancho;

  // Cuerpo y tablero.
  addEdges(box([x0, yb, z0], [x1, yT - 0.015, z1], M.acero, group));
  box([x0, yT - 0.015, z0], [x1, yT, z1], M.hierroFundido, group);

  // Hornillas.
  const burners = [
    [0.28, 0.3, 0.045],
    [0.72, 0.3, 0.04],
    [0.28, 0.7, 0.04],
    [0.72, 0.7, 0.05],
  ];
  for (const [fx, fz, r] of burners) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.016, 24), M.aceroOscuro);
    ring.position.set(x0 + W * fx, yT + 0.008, z0 + e.fondo * fz);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.008, 20), M.negroMate);
    cap.position.set(ring.position.x, yT + 0.02, ring.position.z);
    group.add(ring, cap);
  }

  // Parrillas (dos, una por mitad).
  const gy0 = yT + 0.024;
  const gy1 = gy0 + 0.01;
  const bw = 0.01;
  for (const [ga, gb] of [
    [x0 + 0.01, xc - 0.005],
    [xc + 0.005, x1 - 0.01],
  ]) {
    const za = z0 + 0.03;
    const zb = z1 - 0.03;
    box([ga, gy0, za], [gb, gy1, za + bw], M.hierroFundido, group);
    box([ga, gy0, zb - bw], [gb, gy1, zb], M.hierroFundido, group);
    box([ga, gy0, za], [ga + bw, gy1, zb], M.hierroFundido, group);
    box([gb - bw, gy0, za], [gb, gy1, zb], M.hierroFundido, group);
    const gm = (ga + gb) / 2;
    box([gm - bw / 2, gy0, za], [gm + bw / 2, gy1, zb], M.hierroFundido, group);
    const zm = (za + zb) / 2;
    box([ga, gy0, zm - bw / 2], [gb, gy1, zm + bw / 2], M.hierroFundido, group);
    for (const [px, pz] of [
      [ga, za],
      [gb - bw, za],
      [ga, zb - bw],
      [gb - bw, zb - bw],
    ])
      box([px, yT, pz], [px + bw, gy0, pz + bw], M.hierroFundido, group);
  }

  // Panel de mandos con perillas (1 + 4, como en la foto).
  const yp0 = yT - 0.13;
  box([x0, yp0, z1], [x1, yT - 0.015, z1 + 0.012], M.acero, group);
  for (const f of [0.15, 0.5, 0.61, 0.72, 0.83]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.026, 20), M.perilla);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(x0 + W * f, (yp0 + yT - 0.015) / 2, z1 + 0.012 + 0.013);
    group.add(knob);
  }

  // Puerta del horno (vidrio oscuro con marco) y asa.
  const yd0 = yb + 0.17;
  const yd1 = yp0 - 0.01;
  box([x0 + 0.005, yd0, z1], [x1 - 0.005, yd1, z1 + 0.018], M.acero, group);
  box([x0 + 0.04, yd0 + 0.04, z1 + 0.018], [x1 - 0.04, yd1 - 0.06, z1 + 0.02], M.negroVidrio, group);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, W * 0.8, 16), M.acero);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(xc, yd1 - 0.03, z1 + 0.05);
  group.add(handle);
  for (const s of [-1, 1]) box([xc + s * W * 0.38 - 0.008, yd1 - 0.038, z1 + 0.018], [xc + s * W * 0.38 + 0.008, yd1 - 0.022, z1 + 0.05], M.acero, group);

  // Cajón inferior.
  box([x0 + 0.005, yb + 0.02, z1], [x1 - 0.005, yd0 - 0.01, z1 + 0.012], M.aceroOscuro, group);

  // Tapa de vidrio levantada en la parte posterior.
  if (e.tapa.levantada) {
    const tz0 = z0 + 0.005;
    const tz1 = tz0 + 0.012;
    const ty1 = yT + e.tapa.alto;
    const f = 0.012;
    box([x0 + 0.01, yT, tz0], [x0 + 0.01 + f, ty1, tz1], M.acero, group);
    box([x1 - 0.01 - f, yT, tz0], [x1 - 0.01, ty1, tz1], M.acero, group);
    box([x0 + 0.01, ty1 - f, tz0], [x1 - 0.01, ty1, tz1], M.acero, group);
    box([x0 + 0.01, yT, tz0], [x1 - 0.01, yT + f, tz1], M.acero, group);
    box([x0 + 0.01 + f, yT + f, tz0 + 0.004], [x1 - 0.01 - f, ty1 - f, tz1 - 0.004], M.vidrio, group);
  }

  return setShadows(group);
}

/**
 * Refrigeradora de congelador superior en la esquina Pared 3 / Pared 4,
 * con el frente hacia +X y las manijas del lado de la Pared 4 (fotos 3 y 4).
 */
export function buildFridge(d, M) {
  const r = d.refrigeradora;
  const { x0, x1, z0, z1 } = derivadas(d).refri;
  const group = new THREE.Group();
  group.name = 'refrigeradora';

  const door = 0.035;
  const xf = x1 - door; // frente del gabinete
  const H = r.alto;
  const yCong = H - r.altoPuertaCongelador;

  addEdges(box([x0, 0, z0], [xf, H, z1], M.blancoRefri, group));
  box([xf, 0.01, z0 + 0.03], [xf + 0.006, r.altoZocalo, z1 - 0.03], M.hueco, group);

  // Puertas (congelador arriba, refrigeración abajo).
  addEdges(box([xf, yCong + 0.005, z0 + 0.003], [x1, H - 0.004, z1 - 0.003], M.blancoRefri, group));
  addEdges(box([xf, r.altoZocalo + 0.004, z0 + 0.003], [x1, yCong - 0.005, z1 - 0.003], M.blancoRefri, group));

  // Manijas verticales del lado de la Pared 4.
  const hz0 = z1 - 0.065;
  const hz1 = z1 - 0.035;
  box([x1, yCong + 0.05, hz0], [x1 + 0.028, yCong + 0.3, hz1], M.grisRefri, group);
  box([x1, yCong - 0.45, hz0], [x1 + 0.028, yCong - 0.05, hz1], M.grisRefri, group);

  // Panel de control en la puerta del congelador.
  const zc = (z0 + z1) / 2;
  box([x1, yCong + 0.2, zc - 0.05], [x1 + 0.004, yCong + 0.32, zc + 0.04], M.grisRefri, group);

  return setShadows(group);
}

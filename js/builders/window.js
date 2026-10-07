import * as THREE from 'three';
import { derivadas } from '../config/dimensiones.js';
import { boxBetween } from '../utils/geometry.js';

/**
 * Ventana de la Pared 1: marco metálico perimetral, travesaño, paño inferior
 * corredizo de dos hojas, paño superior fijo y reja exterior.
 * La disposición de rejas y diagonales es aproximada (foto Pared 1).
 */
export function buildWindow(d, M) {
  const { ancho: A, espesorMuro: t } = d.ambiente;
  const w = d.pared1.ventana;
  const { z0, z1, y0, yTop } = derivadas(d).ventana;
  const p = w.perfil;
  const group = new THREE.Group();
  group.name = 'ventana';

  const xf = A + w.profundidadMarco; // plano del marco
  const bar = (zA, zB, yA, yB, xA = xf - p / 2, xB = xf + p / 2, mat = M.marcoVentana) =>
    group.add(boxBetween([xA, yA, Math.min(zA, zB)], [xB, yB, Math.max(zA, zB)], mat, { worldUV: false }));

  // Marco perimetral.
  bar(z0, z1, yTop - p, yTop);
  bar(z0, z1, y0, y0 + p);
  bar(z0, z0 + p, y0, yTop);
  bar(z1 - p, z1, y0, yTop);

  // Travesaño.
  const yt = yTop - w.travesanoDesdeArriba;
  bar(z0, z1, yt - p / 2, yt + p / 2);

  // Paño inferior: dos hojas corredizas en planos ligeramente distintos.
  const zc = (z0 + z1) / 2;
  const off = 0.012;
  const hoja = 0.025;
  const glass = (zA, zB, yA, yB, x) =>
    group.add(boxBetween([x - 0.003, yA, zA], [x + 0.003, yB, zB], M.vidrio, { worldUV: false }));
  const yHoja0 = y0 + p;
  const yHoja1 = yt - p / 2;
  glass(z0 + p, zc + hoja / 2, yHoja0, yHoja1, xf - off);
  glass(zc - hoja / 2, z1 - p, yHoja0, yHoja1, xf + off);
  bar(zc - hoja / 2, zc + hoja / 2, yHoja0, yHoja1, xf - off - 0.01, xf - off + 0.01);
  bar(zc - hoja / 2, zc + hoja / 2, yHoja0, yHoja1, xf + off - 0.01, xf + off + 0.01);

  // Paño superior fijo.
  glass(z0 + p, z1 - p, yt + p / 2, yTop - p, xf);

  // Reja exterior.
  const xr0 = A + t - 0.025;
  const xr1 = A + t - 0.01;
  const r = 0.015;
  const reja = (zA, zB, yA, yB) => bar(zA, zB, yA, yB, xr0, xr1);
  const bays = Math.max(1, Math.round((z1 - z0) / w.separacionRejas));
  const step = (z1 - z0) / bays;
  for (let i = 1; i < bays; i++) {
    const z = z0 + i * step;
    reja(z - r / 2, z + r / 2, y0, yTop);
  }
  const hLower = yt - y0;
  for (let k = 1; k <= w.nivelesRejaInferior; k++) {
    const y = y0 + (hLower * k) / (w.nivelesRejaInferior + 1);
    reja(z0, z1, y - r / 2, y + r / 2);
  }
  reja(z0, z1, yt - r / 2, yt + r / 2);

  // Diagonales del paño superior (zig-zag cada dos paños).
  const yA = yt + p / 2;
  const yB = yTop - p;
  const dy = yB - yA;
  for (let i = 0; i + 2 <= bays; i += 2) {
    const zA = z0 + i * step + r;
    const dz = 2 * step - 2 * r;
    const len = Math.hypot(dz, dy);
    const geom = new THREE.BoxGeometry(xr1 - xr0, r, len);
    const diag = new THREE.Mesh(geom, M.marcoVentana);
    const up = (i / 2) % 2 === 0;
    diag.position.set((xr0 + xr1) / 2, (yA + yB) / 2, zA + dz / 2);
    diag.rotation.x = Math.atan2(up ? -dy : dy, dz);
    group.add(diag);
  }

  return group;
}

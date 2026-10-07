import * as THREE from 'three';
import { derivadas } from '../config/dimensiones.js';
import { applyWorldUV, boxBetween } from '../utils/geometry.js';
import { buildWindow } from './window.js';

// Separación de los acabados respecto a la cara del muro (evita z-fighting).
const EPS = 0.002;

/**
 * Cara interior de cada pared.
 *  axis: eje perpendicular a la pared ('x' o 'z')
 *  plane: coordenada del plano del acabado
 *  inward: sentido de la normal hacia el interior (+1 / -1)
 *  u: coordenada a lo largo de la pared = z (paredes 1 y 3) o x (paredes 2 y 4)
 */
function wallFrames(d) {
  const { ancho, fondo } = d.ambiente;
  return {
    pared1: { axis: 'x', plane: ancho - EPS, inward: -1 },
    pared2: { axis: 'z', plane: EPS, inward: 1 },
    pared3: { axis: 'x', plane: EPS, inward: 1 },
    pared4: { axis: 'z', plane: fondo - EPS, inward: -1 },
  };
}

/** Rectángulo de acabado sobre la cara interior de una pared (u, v en metros). */
function finishRect(frame, [u0, u1, v0, v1], material, { localV = false } = {}) {
  if (u1 - u0 <= 1e-4 || v1 - v0 <= 1e-4) return null;
  const g = new THREE.PlaneGeometry(u1 - u0, v1 - v0);
  const uc = (u0 + u1) / 2;
  const vc = (v0 + v1) / 2;
  if (frame.axis === 'z') {
    if (frame.inward < 0) g.rotateY(Math.PI);
    g.translate(uc, vc, frame.plane);
  } else {
    g.rotateY(frame.inward > 0 ? Math.PI / 2 : -Math.PI / 2);
    g.translate(frame.plane, vc, uc);
  }
  applyWorldUV(g);
  if (localV) {
    // La cenefa usa V local (0..1) para que la franja quede completa.
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setY(i, (pos.getY(i) - v0) / (v1 - v0));
  }
  const mesh = new THREE.Mesh(g, material);
  mesh.receiveShadow = true;
  return mesh;
}

/** Resta un vano rectangular a un rectángulo [u0,u1,v0,v1]; devuelve las piezas. */
function subtractHole(rect, hole) {
  const [u0, u1, v0, v1] = rect;
  if (!hole) return [rect];
  const [h0, h1, k0, k1] = hole;
  if (h1 <= u0 || h0 >= u1 || k1 <= v0 || k0 >= v1) return [rect];
  const cu0 = Math.max(u0, h0);
  const cu1 = Math.min(u1, h1);
  return [
    [u0, cu0, v0, v1],
    [cu1, u1, v0, v1],
    [cu0, cu1, v0, Math.max(v0, k0)],
    [cu0, cu1, Math.min(v1, k1), v1],
  ].filter(([a, b, c, e]) => b - a > 1e-4 && e - c > 1e-4);
}

/** Bandas horizontales de acabado: cerámica + cenefa + cerámica + parte superior. */
function bandsWithBorder(d, u0, u1, topMaterial, topHeight, M) {
  const { ceramicaParedAlto: hc, cenefa } = d.acabados;
  return [
    { rect: [u0, u1, 0, cenefa.base], mat: M.ceramicaPared },
    { rect: [u0, u1, cenefa.base, cenefa.base + cenefa.alto], mat: M.cenefa, localV: true },
    { rect: [u0, u1, cenefa.base + cenefa.alto, hc], mat: M.ceramicaPared },
    { rect: [u0, u1, hc, topHeight], mat: topMaterial },
  ];
}

function addFinishes(group, frame, bands, hole) {
  for (const b of bands) {
    for (const piece of subtractHole(b.rect, hole)) {
      const mesh = finishRect(frame, piece, b.mat, { localV: b.localV });
      if (mesh) group.add(mesh);
    }
  }
}

function ghostOf(meshes) {
  const ghost = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: 0x55606c, transparent: true, opacity: 0.55 });
  for (const m of meshes) ghost.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), material));
  ghost.visible = false;
  return ghost;
}

export function buildRoom(d, M) {
  const { ancho: A, fondo: F, alto: H, espesorMuro: t, espesorTecho: tc } = d.ambiente;
  const der = derivadas(d);
  const zSur = F + der.pared4.espesor; // cara exterior de la línea de la Pared 4 = extremo de la Pared 1
  const frames = wallFrames(d);
  const root = new THREE.Group();
  root.name = 'ambiente';

  const walls = {};
  const makeWall = (id, outward, point) => {
    const group = new THREE.Group();
    group.name = id;
    root.add(group);
    walls[id] = { group, outward, point, structure: [] };
    return walls[id];
  };
  const addBox = (wall, min, max, name) => {
    const mesh = boxBetween(min, max, M.muro, { name });
    mesh.receiveShadow = true;
    wall.group.add(mesh);
    wall.structure.push(mesh);
    return mesh;
  };

  // ── Pared 2 (norte, z = 0): muro completo; cerámica + pintura amarilla.
  const p2 = makeWall('pared2', new THREE.Vector3(0, 0, -1), new THREE.Vector3(A / 2, 0, 0));
  addBox(p2, [-t, 0, -t], [A + t, H, 0], 'muro pared 2');
  addFinishes(p2.group, frames.pared2, bandsWithBorder(d, d.columnas.pared2Pared3.x, A, M.pinturaAmarilla, H, M));

  // ── Pared 1 (este, x = A): muro completo con vano de ventana.
  const v = der.ventana;
  const p1 = makeWall('pared1', new THREE.Vector3(1, 0, 0), new THREE.Vector3(A, 0, F / 2));
  addBox(p1, [A, 0, 0], [A + t, v.y0, zSur], 'muro pared 1 bajo ventana');
  addBox(p1, [A, v.y0, 0], [A + t, v.yTop, v.z0], 'muro pared 1 lado pared 2');
  addBox(p1, [A, v.y0, v.z1], [A + t, v.yTop, zSur], 'muro pared 1 lado pared 4');
  if (v.yTop < H) addBox(p1, [A, v.yTop, v.z0], [A + t, H, v.z1], 'dintel ventana');
  const hole = [v.z0, v.z1, v.y0, v.yTop];
  const zRosado = d.acabados.pared1RosadoDesde;
  addFinishes(p1.group, frames.pared1, bandsWithBorder(d, 0, zRosado, M.pinturaVerde, H, M), hole);
  addFinishes(p1.group, frames.pared1, [{ rect: [zRosado, F, 0, H], mat: M.pinturaRosada }], hole);
  p1.group.add(buildWindow(d, M));

  // ── Pared 3 (oeste, x = 0): columna | muro alto 1.85 m | tramo bajo 0.95 m | columna.
  const p3 = makeWall('pared3', new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, F / 2));
  const { z0Alto, z1Alto, z1Bajo } = der.pared3;
  const h3 = d.pared3.altoMuro;
  addBox(p3, [-t, 0, z0Alto], [0, h3, z1Alto], 'muro pared 3');
  addBox(p3, [-t, 0, z1Alto], [0, d.pared3.tramoBajo.alto, z1Bajo], 'muro bajo pared 3');
  addFinishes(p3.group, frames.pared3, bandsWithBorder(d, z0Alto, z1Alto, M.ladrillo, h3, M));

  // ── Pared 4 (sur, z = F): muro de 1.66 m; entrada de 1.20 m junto a la Pared 1.
  const p4 = makeWall('pared4', new THREE.Vector3(0, 0, 1), new THREE.Vector3(A / 2, 0, F));
  const xEntrada = der.pared4.largoMuro;
  const h4 = d.pared4.altoMuro;
  const xColSur = d.columnas.pared3Pared4.x;
  addBox(p4, [-t, 0, F], [xEntrada, h4, zSur], 'muro pared 4');
  addFinishes(p4.group, frames.pared4, [
    { rect: [xColSur, xEntrada, 0, d.acabados.pared4TarrajeoAlto], mat: M.pinturaAmarilla },
    { rect: [xColSur, xEntrada, d.acabados.pared4TarrajeoAlto, h4], mat: M.ladrillo },
  ]);

  // ── Columnas de las esquinas de la Pared 3: sobresalen hacia el interior y
  // continúan dentro del espesor de los muros (siempre visibles: son estructura).
  const inset = 0.001;
  const cn = d.columnas.pared2Pared3;
  const hc = d.columnas.ceramicaHasta;
  const columnas = new THREE.Group();
  columnas.name = 'columnas';
  columnas.add(
    boxBetween([-t + inset, 0, -t + inset], [cn.x, hc, cn.z], M.ceramicaPared, { name: 'columna P2/P3' }),
    boxBetween([-t + inset, hc, -t + inset], [cn.x, H, cn.z], M.columna, { name: 'columna P2/P3' }),
    boxBetween([-t + inset, 0, z1Bajo], [xColSur, H, zSur - inset], M.columna, { name: 'columna P3/P4' }),
  );
  columnas.traverse((o) => {
    if (o.isMesh) o.receiveShadow = true;
  });
  root.add(columnas);

  // ── Piso y techo.
  const floor = boxBetween([-t, -0.05, -t], [A + t, 0, zSur], M.piso, { name: 'piso' });
  floor.receiveShadow = true;
  root.add(floor);

  const ceiling = boxBetween([-t, H, -t], [A + t, H + tc, zSur], M.techo, { name: 'techo' });
  ceiling.receiveShadow = true;
  root.add(ceiling);

  // Contornos que permanecen visibles cuando una pared se oculta.
  for (const w of Object.values(walls)) {
    w.ghost = ghostOf(w.structure);
    root.add(w.ghost);
  }

  return { group: root, walls, ceiling, floor };
}

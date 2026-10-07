import * as THREE from 'three';
import { derivadas } from '../config/dimensiones.js';
import { addEdges, boxBetween, extrudePlan, rectPlan, setShadows } from '../utils/geometry.js';

/**
 * Contorno en planta de una mesa en "L" apoyada en una esquina.
 *  (cx, cz): esquina interior de las paredes
 *  sx, sz:   sentido hacia el interior del ambiente (+1 / -1)
 *  largoX:   largo a lo largo de la pared paralela a X (Pared 2)
 *  largoZ:   largo a lo largo de la pared paralela a Z (Pared 1 o 3)
 *  muesca:   {x, z} recorte en la esquina para rodear una columna (opcional)
 */
function outlineL({ cx, cz, sx, sz, largoX, largoZ, muesca }, fondo) {
  const esquina = muesca
    ? [
        [cx, cz + sz * muesca.z],
        [cx + sx * muesca.x, cz + sz * muesca.z],
        [cx + sx * muesca.x, cz],
      ]
    : [[cx, cz]];
  return [
    ...esquina,
    [cx + sx * largoX, cz],
    [cx + sx * largoX, cz + sz * fondo],
    [cx + sx * fondo, cz + sz * fondo],
    [cx + sx * fondo, cz + sz * largoZ],
    [cx, cz + sz * largoZ],
  ];
}

const span = (a, b) => [Math.min(a, b), Math.max(a, b)];

/** Pilares de apoyo en los dos extremos libres de la "L". */
function endPiers(mesa, m, y0, y1, material) {
  const { cx, cz, sx, sz, largoX, largoZ } = mesa;
  const e = m.espesorPilar;
  const r = m.retiroPilar;
  const piers = [];

  const [ax0, ax1] = span(cx + sx * (largoX - r - e), cx + sx * (largoX - r));
  const [az0, az1] = span(cz, cz + sz * (m.fondo - r));
  piers.push(boxBetween([ax0, y0, az0], [ax1, y1, az1], material, { name: 'pilar' }));

  const [bx0, bx1] = span(cx, cx + sx * (m.fondo - r));
  const [bz0, bz1] = span(cz + sz * (largoZ - r - e), cz + sz * (largoZ - r));
  piers.push(boxBetween([bx0, y0, bz0], [bx1, y1, bz1], material, { name: 'pilar' }));

  return piers;
}

/** Lavadero de poza doble: retorno de acero sobre la cerámica y dos pozas colgantes. */
function buildSink(d, M, holeRect) {
  const l = d.lavadero;
  const yTop = d.mesas.alto;
  const [x0, z0, x1, z1] = holeRect;
  const lip = 0.02;
  const wall = 0.006;
  const group = new THREE.Group();
  group.name = 'lavadero';

  const usable = z1 - z0 - 2 * lip - l.separacionPozas;
  const L1 = usable * l.proporcionPozaPared2;
  const basins = [
    [x0 + lip, z0 + lip, x1 - lip, z0 + lip + L1],
    [x0 + lip, z0 + lip + L1 + l.separacionPozas, x1 - lip, z1 - lip],
  ];

  // Retorno (placa superior) con las dos aberturas.
  const outer = rectPlan(x0 - 0.015, z0 - 0.015, x1 + 0.015, z1 + 0.015);
  group.add(
    extrudePlan(outer, yTop, yTop + 0.004, M.acero, {
      holes: basins.map(([a, b, c, e]) => rectPlan(a, b, c, e)),
      name: 'retorno lavadero',
    }),
  );

  const yb = yTop - l.profundidad;
  for (const [bx0, bz0, bx1, bz1] of basins) {
    group.add(boxBetween([bx0, yb - wall, bz0], [bx1, yb, bz1], M.acero, { worldUV: false }));
    group.add(boxBetween([bx0, yb, bz0], [bx0 + wall, yTop, bz1], M.acero, { worldUV: false }));
    group.add(boxBetween([bx1 - wall, yb, bz0], [bx1, yTop, bz1], M.acero, { worldUV: false }));
    group.add(boxBetween([bx0, yb, bz0], [bx1, yTop, bz0 + wall], M.acero, { worldUV: false }));
    group.add(boxBetween([bx0, yb, bz1 - wall], [bx1, yTop, bz1], M.acero, { worldUV: false }));
    // Desagüe.
    const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.004, 20), M.aceroOscuro);
    drain.position.set((bx0 + bx1) / 2, yb + 0.002, (bz0 + bz1) / 2);
    group.add(drain);
  }

  // Grifería de pared con caño cuello de ganso (salida desde la Pared 1).
  const A = d.ambiente.ancho;
  const yG = l.griferia.altura;
  for (const zG of l.griferia.posiciones) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(A, yG, zG),
      new THREE.Vector3(A - 0.05, yG, zG),
      new THREE.Vector3(A - 0.07, yG + 0.12, zG),
      new THREE.Vector3(A - 0.14, yG + 0.2, zG),
      new THREE.Vector3(A - 0.22, yG + 0.12, zG),
      new THREE.Vector3(A - 0.23, yG + 0.04, zG),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.01, 10, false), M.acero));
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 16), M.acero);
    knob.rotation.z = Math.PI / 2;
    knob.position.set(A - 0.03, yG - 0.045, zG);
    group.add(knob);
  }

  return group;
}

export function buildCounters(d, M) {
  const m = d.mesas;
  const { ancho: A } = d.ambiente;
  const der = derivadas(d);
  const group = new THREE.Group();
  group.name = 'mesas de cerámica';

  const yTop = m.alto;
  const yBot = m.alto - m.espesorLosa;
  const yBase = m.zocalo.alto;

  const mesas = [
    {
      id: 'izquierda',
      cx: 0,
      cz: 0,
      sx: 1,
      sz: 1,
      largoX: m.izquierda.largoPared2,
      largoZ: m.izquierda.largoPared3,
      muesca: d.columnas.pared2Pared3,
    },
    {
      id: 'derecha',
      cx: A,
      cz: 0,
      sx: -1,
      sz: 1,
      largoX: m.derecha.largoPared2,
      largoZ: m.derecha.largoPared1,
    },
  ];

  // Vano del lavadero en la mesa de la Pared 1.
  const l = d.lavadero;
  const sinkHole = [
    A - m.fondo / 2 - l.ancho / 2,
    l.centroDesdePared2 - l.largo / 2,
    A - m.fondo / 2 + l.ancho / 2,
    l.centroDesdePared2 + l.largo / 2,
  ];

  const losaMats = [M.ceramicaMesa, M.ceramicaCanto];
  const parts = {};
  for (const mesa of mesas) {
    const sub = new THREE.Group();
    sub.name = `mesa ${mesa.id}`;
    const outline = outlineL(mesa, m.fondo);
    const holes = mesa.id === 'derecha' ? [rectPlan(...sinkHole)] : [];
    sub.add(addEdges(extrudePlan(outline, yBot, yTop, losaMats, { holes, name: `losa mesa ${mesa.id}` })));
    sub.add(addEdges(extrudePlan(outline, 0, yBase, losaMats, { name: `zócalo mesa ${mesa.id}` })));
    for (const pier of endPiers(mesa, m, yBase, yBot, M.ceramicaCanto)) sub.add(addEdges(pier));
    if (mesa.id === 'derecha') sub.add(buildSink(d, M, sinkHole));
    group.add(sub);
    parts[mesa.id] = sub;
  }

  if (m.zocalo.enHuecoCocina) {
    const { x0, x1 } = der.huecoCocina;
    parts.zocaloHueco = addEdges(
      extrudePlan(rectPlan(x0, 0, x1, m.fondo), 0, yBase, losaMats, { name: 'zócalo hueco estufa' }),
    );
    group.add(parts.zocaloHueco);
  }

  setShadows(group);
  return { group, ...parts };
}

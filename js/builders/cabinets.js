import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { REPOSTEROS, resolverModulos, resolverApoyos, cajaMundo, tiradorAbajo } from '../config/reposteros.js';
import { addEdges, boxBetween, setShadows } from '../utils/geometry.js';

const edgeGhost = new THREE.LineBasicMaterial({ color: 0x2f6fd6, transparent: true, opacity: 0.5 });

function panel(m, u, dd, y, material, name, d) {
  const { min, max } = cajaMundo(m.pared, u, dd, y, d);
  return addEdges(boxBetween(min, max, material, { worldUV: false, name }));
}

/** Tirador vertical de aluminio cerca del canto opuesto a la bisagra. */
function tirador(m, hoja, d, M) {
  const t = REPOSTEROS.tirador;
  const esp = REPOSTEROS.material.espesor;
  const uc = hoja.bisagra === 'inicio' ? hoja.u1 - t.retiroBorde : hoja.u0 + t.retiroBorde;
  const yc = tiradorAbajo(hoja, d) ? hoja.y0 + t.retiroBorde + t.largo / 2 : hoja.y1 - t.retiroBorde - t.largo / 2;
  const front = m.d1 + esp;
  return boxBetween(
    ...Object.values(cajaMundo(m.pared, [uc - 0.006, uc + 0.006], [front, front + 0.025], [yc - t.largo / 2, yc + t.largo / 2], d)),
    M.acero,
    { worldUV: false, name: 'tirador' },
  );
}

function buildModule(m, d, M) {
  const esp = REPOSTEROS.material.espesor;
  const g = REPOSTEROS.material.holgura;
  const group = new THREE.Group();
  group.name = `módulo ${m.id}`;
  group.userData.modulo = m.id;
  const puertas = new THREE.Group();
  puertas.name = `puertas ${m.id}`;

  if (m.tipo === 'relleno') {
    group.add(panel(m, [m.u0, m.u1], [m.d0, m.d1], [m.y0, m.y1], M.melamina, 'relleno', d));
    return { group, puertas };
  }

  const dB = m.d0 + m.espEspalda; // cara interior de la espalda
  const matEspalda = m.espalda === 'melamina' ? M.melamina : M.fondoMdf;
  group.add(panel(m, [m.u0, m.u1], [m.d0, dB], [m.y0, m.y1], matEspalda, 'espalda', d));
  group.add(panel(m, [m.u0, m.u0 + esp], [dB, m.d1], [m.y0, m.y1], M.melamina, 'lateral', d));
  group.add(panel(m, [m.u1 - esp, m.u1], [dB, m.d1], [m.y0, m.y1], M.melamina, 'lateral', d));
  group.add(panel(m, [m.u0 + esp, m.u1 - esp], [dB, m.d1], [m.y0, m.y0 + esp], M.melamina, 'piso', d));
  group.add(panel(m, [m.u0 + esp, m.u1 - esp], [dB, m.d1], [m.y1 - esp, m.y1], M.melamina, 'techo', d));
  for (const y of m.repisas) {
    group.add(
      panel(m, [m.u0 + esp + 0.001, m.u1 - esp - 0.001], [dB, m.d1 - m.retiroRepisa], [y, y + esp], M.melaminaInterior, 'repisa', d),
    );
  }

  const yH = [m.y0 + g / 2, m.y1 - g / 2];
  if (m.tapaFija) group.add(panel(m, [m.tapaFija.u0, m.tapaFija.u1], [m.d1, m.d1 + esp], yH, M.melamina, 'tapa fija', d));
  for (const hoja of m.puertas) {
    puertas.add(panel(m, [hoja.u0, hoja.u1], [m.d1, m.d1 + esp], [hoja.y0, hoja.y1], M.melamina, 'puerta', d));
    puertas.add(tirador(m, hoja, d, M));
  }
  group.add(puertas);
  return { group, puertas };
}

const NORMAL_FRENTE = {
  pared2: new THREE.Vector3(0, 0, 1),
  pared3: new THREE.Vector3(1, 0, 0),
  pared1: new THREE.Vector3(-1, 0, 0),
};

function etiqueta(texto, posicion, modulo, pared) {
  const el = document.createElement('div');
  el.className = 'modulo-label';
  el.textContent = texto;
  const obj = new CSS2DObject(el);
  obj.position.set(...posicion);
  obj.userData = { modulo, frente: NORMAL_FRENTE[pared] ?? null };
  return obj;
}

function buildEquipo(eq, M) {
  let mesh;
  if (eq.cilindro) {
    const { x, z, radio } = eq.cilindro;
    const h = eq.y[1] - eq.y[0];
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, h, 28), M.equipo);
    mesh.position.set(x, eq.y[0] + h / 2, z);
  } else {
    const { min, max } = cajaMundo(eq.pared, eq.u, eq.d, eq.y);
    mesh = boxBetween(min, max, M.equipo, { worldUV: false });
  }
  mesh.name = eq.nombre;
  mesh.renderOrder = 2;
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 30), M.equipoArista));
  return mesh;
}

/**
 * Reposteros de la etapa 2. Devuelve los grupos necesarios para las capas,
 * las vistas (objetos que se ocultan) y los contornos por pared.
 */
export function buildCabinets(d, M) {
  const modulos = resolverModulos(REPOSTEROS, d);
  const group = new THREE.Group();
  group.name = 'reposteros';

  const grupos = {
    altosPared2: new THREE.Group(),
    altosPared3: new THREE.Group(),
    bajosIzquierda: new THREE.Group(),
    bajosDerecha: new THREE.Group(),
  };
  for (const [k, g] of Object.entries(grupos)) {
    g.name = k;
    group.add(g);
  }
  // Las vistas ocultan `grupos.*`; el ocultamiento por pared actúa sobre `cuerpo`/`contorno`.
  const cuerpo = { pared2: new THREE.Group(), pared3: new THREE.Group() };
  grupos.altosPared2.add(cuerpo.pared2);
  grupos.altosPared3.add(cuerpo.pared3);

  const puertas = [];
  const etiquetas = new THREE.Group();
  etiquetas.name = 'códigos de módulos';
  const A = d.ambiente.ancho;

  for (const m of modulos) {
    const { group: mg, puertas: pg } = buildModule(m, d, M);
    puertas.push(pg);
    let destino;
    if (m.tipo === 'bajo') {
      const izquierda = m.pared === 'pared3' || (m.pared === 'pared2' && m.u1 <= A / 2);
      destino = izquierda ? grupos.bajosIzquierda : grupos.bajosDerecha;
    } else {
      destino = m.pared === 'pared3' ? cuerpo.pared3 : cuerpo.pared2;
    }
    destino.add(mg);
    if (m.tipo === 'relleno') continue;
    const { min, max } = cajaMundo(m.pared, [m.u0, m.u1], [m.frente, m.frente + 0.02], [m.y0, m.y1], d);
    const pos = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    etiquetas.add(etiqueta(m.id, pos, mg, m.pared));
  }
  for (const a of resolverApoyos(REPOSTEROS, d)) {
    const mat = a.tipo === 'tubo' ? M.acero : M.melamina;
    const mesh = panel(a, [a.u0, a.u1], [a.d0, a.d1], [a.y0, a.y1], mat, `apoyo ${a.id}`, d);
    (cuerpo[a.pared] ?? group).add(mesh);
  }
  setShadows(group);

  // Contornos de los altos para cuando su pared se oculta y el repostero tapa la vista.
  const fantasmas = {};
  for (const pared of ['pared2', 'pared3']) {
    const f = new THREE.Group();
    f.name = `contorno altos ${pared}`;
    cuerpo[pared].traverse((o) => {
      if (o.isMesh && o.name !== 'tirador') f.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 30), edgeGhost));
    });
    f.visible = false;
    cuerpo[pared].parent.add(f);
    fantasmas[pared] = { cuerpo: cuerpo[pared], contorno: f };
  }

  // Equipos de referencia (volúmenes translúcidos, no se fabrican).
  const equipos = { izquierda: new THREE.Group(), tacho: new THREE.Group(), bidon: new THREE.Group(), verdulero: new THREE.Group(), derecha: new THREE.Group() };
  const equiposGroup = new THREE.Group();
  equiposGroup.name = 'equipos de referencia';
  for (const [k, g] of Object.entries(equipos)) {
    g.name = `equipos ${k}`;
    equiposGroup.add(g);
  }
  for (const eq of REPOSTEROS.equipos) {
    const mesh = buildEquipo(eq, M);
    equipos[eq.grupo].add(mesh);
    etiquetas.add(etiquetaEquipo(eq.nombre, mesh));
  }

  return { group, grupos, puertas, etiquetas, fantasmas, equipos, equiposGroup, modulos };
}

/** Nombre de un equipo sobre su cara superior; se muestra siempre que el objeto sea visible. */
export function etiquetaEquipo(nombre, objeto) {
  const top = new THREE.Box3().setFromObject(objeto);
  const c = top.getCenter(new THREE.Vector3());
  const lbl = etiqueta(nombre, [c.x, top.max.y + 0.05, c.z], objeto);
  lbl.element.classList.add('modulo-label--equipo');
  lbl.userData.siempre = true;
  return lbl;
}

/**
 * Muestra un código solo si su módulo (y toda su cadena de padres) es visible
 * y su frente mira a la cámara (o se ve en planta). Los nombres de los equipos
 * no dependen de las cotas.
 */
export function updateCabinetLabels(etiquetas, visibles, camDir) {
  for (const lbl of etiquetas.children) {
    const n = lbl.userData.frente;
    let o = lbl.userData.modulo;
    let ok = (visibles || lbl.userData.siempre === true) && (!n || Math.abs(camDir.y) > 0.8 || camDir.dot(n) < -0.2);
    while (ok && o) {
      ok = o.visible;
      o = o.parent;
    }
    lbl.visible = ok;
  }
}

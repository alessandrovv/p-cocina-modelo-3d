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
    const instalado = eq.tipo === 'canaleta' || eq.tipo === 'toma';
    mesh = boxBetween(min, max, eq.tipo === 'canaleta' || eq.nueva ? M.instalacion : instalado ? M.melamina : M.equipo, { worldUV: false });
    if (instalado) {
      mesh.name = eq.nombre;
      if (mesh.material === M.instalacion) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), M.instalacionLinea));
      return mesh;
    }
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
    const destinoApoyo = cuerpo[a.pared] ?? group;
    destinoApoyo.add(panel(a, [a.u0, a.u1], [a.d0, a.d1], [a.y0, a.y1], mat, `apoyo ${a.id}`, d));
    for (const [nombre, p] of Object.entries(a.placas ?? {}))
      destinoApoyo.add(panel(a, [p.u0, p.u1], [p.d0, p.d1], [p.y0, p.y1], nombre === 'goma' ? M.negroMate : M.acero, `${nombre} ${a.id}`, d));
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
    if (eq.rotulo) {
      const { linea, rotulo } = llamada(eq, mesh, d, M);
      equipos[eq.grupo].add(linea);
      etiquetas.add(rotulo);
    } else if (eq.tipo !== 'canaleta') etiquetas.add(etiquetaEquipo(eq.nombre, mesh));
  }

  return { group, grupos, puertas, etiquetas, fantasmas, equipos, equiposGroup, modulos };
}

/**
 * Rótulo de una instalación nueva: sale hacia el frente por debajo de los altos
 * y sube hasta sus puertas, lejos de los nombres de los equipos de la mesa.
 */
function llamada(eq, mesh, d, M) {
  const uc = (eq.u[0] + eq.u[1]) / 2;
  const yc = (eq.y[0] + eq.y[1]) / 2;
  const frente = REPOSTEROS.altos.fondo + REPOSTEROS.material.espesor + 0.03;
  const yRotulo = REPOSTEROS.altos.y0 + (eq.tipo === 'canaleta' ? 0.24 : 0.08);
  const punto = (dd, y) => new THREE.Vector3(...cajaMundo(eq.pared, [uc, uc], [dd, dd], [y, y], d).min);
  const linea = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([punto(eq.d[1], yc), punto(frente, yc), punto(frente, yRotulo)]),
    M.instalacionLinea,
  );
  const rotulo = etiqueta(eq.rotulo, punto(frente, yRotulo).toArray(), mesh, eq.pared);
  rotulo.element.classList.add('modulo-label--instalacion');
  rotulo.userData.siempre = true;
  rotulo.userData.ambosLados = true;
  return { linea, rotulo };
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
 * no dependen de las cotas; los rótulos de instalaciones solo se ocultan de canto.
 */
export function updateCabinetLabels(etiquetas, visibles, camDir) {
  for (const lbl of etiquetas.children) {
    const n = lbl.userData.frente;
    let o = lbl.userData.modulo;
    const encara = n && (lbl.userData.ambosLados ? Math.abs(camDir.dot(n)) > 0.2 : camDir.dot(n) < -0.2);
    let ok = (visibles || lbl.userData.siempre === true) && (!n || Math.abs(camDir.y) > 0.8 || encara);
    while (ok && o) {
      ok = o.visible;
      o = o.parent;
    }
    lbl.visible = ok;
  }
}

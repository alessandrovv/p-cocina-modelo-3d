import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { DIM, validarDimensiones } from './config/dimensiones.js';
import { validarReposteros } from './config/reposteros.js';
import { createMaterials } from './materials.js';
import { buildRoom } from './builders/room.js';
import { buildCounters } from './builders/counters.js';
import { buildStove, buildFridge } from './builders/appliances.js';
import { buildCabinets, updateCabinetLabels } from './builders/cabinets.js';
import {
  buildAnnotations,
  buildWallLabels,
  updateAnnotationVisibility,
  updateWallLabelVisibility,
} from './builders/annotations.js';
import { defineViews, ViewManager } from './ui/views.js';
import { bindToolbar } from './ui/toolbar.js';

const container = document.getElementById('viewport');
const avisosEl = document.getElementById('avisos');

function mostrarAvisos(lista) {
  avisosEl.hidden = lista.length === 0;
  avisosEl.innerHTML = lista.map((a) => `⚠ ${a}`).join('<br>');
}
window.addEventListener('error', (e) => mostrarAvisos([`Error: ${e.message}`]));

// ── Renderizadores
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(container.clientWidth, container.clientHeight);
Object.assign(labelRenderer.domElement.style, { position: 'absolute', top: '0', pointerEvents: 'none' });
container.appendChild(labelRenderer.domElement);

// ── Escena e iluminación
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9ebee);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

const { ancho: A, fondo: F, alto: H } = DIM.ambiente;
const centro = new THREE.Vector3(A / 2, 0, F / 2);

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f96, 0.9));

const sol = new THREE.DirectionalLight(0xffffff, 1.6);
sol.position.set(A / 2 + 3, 8, F / 2 - 2.5);
sol.target.position.copy(centro);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 });
sol.shadow.bias = -0.0004;
sol.shadow.normalBias = 0.02;
scene.add(sol, sol.target);

const foco = new THREE.PointLight(0xfff4e0, 3.5, 0, 2);
foco.position.set(A / 2, H - 0.15, F / 2);
scene.add(foco);

// ── Modelo
const M = createMaterials(renderer);
const room = buildRoom(DIM, M);
const mesas = buildCounters(DIM, M);
const estufa = buildStove(DIM, M);
const refrigeradora = buildFridge(DIM, M);
const cotas = buildAnnotations(DIM);
const nombres = buildWallLabels(DIM);
const reposteros = buildCabinets(DIM, M);
scene.add(room.group, mesas.group, estufa, refrigeradora, cotas, nombres);
scene.add(reposteros.group, reposteros.equiposGroup, reposteros.etiquetas);

const rejilla = new THREE.Group();
const fina = new THREE.GridHelper(Math.max(A, F), Math.round(Math.max(A, F) / 0.1), 0x6b7684, 0x6b7684);
fina.material.opacity = 0.25;
fina.material.transparent = true;
const gruesa = new THREE.GridHelper(Math.max(A, F), Math.round(Math.max(A, F) / 0.5), 0x2f3a46, 0x2f3a46);
gruesa.material.opacity = 0.55;
gruesa.material.transparent = true;
gruesa.position.y = 0.001;
rejilla.add(fina, gruesa);
rejilla.position.set(A / 2, 0.003, F / 2);
rejilla.visible = false;
scene.add(rejilla);

mostrarAvisos([...validarDimensiones(DIM), ...validarReposteros()]);

// ── Cámaras, controles y vistas
const aspect = container.clientWidth / container.clientHeight;
const perspective = new THREE.PerspectiveCamera(45, aspect, 0.05, 100);
const orthographic = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 100);

const controls = new OrbitControls(perspective, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = true;
controls.minDistance = 0.5;
controls.maxDistance = 25;
controls.minZoom = 0.3;
controls.maxZoom = 12;
controls.maxPolarAngle = Math.PI * 0.95;

const views = new ViewManager({
  perspective,
  orthographic,
  controls,
  views: defineViews(DIM),
  objetos: {
    refrigeradora,
    estufa,
    mesaIzquierda: mesas.izquierda,
    mesaDerecha: mesas.derecha,
    zocaloHueco: mesas.zocaloHueco,
    ...reposteros.grupos,
    equiposIzquierda: reposteros.equipos.izquierda,
    tacho: reposteros.equipos.tacho,
    bidon: reposteros.equipos.bidon,
  },
});
views.set('iso', { animate: false });

// ── Capas conmutables
const estado = {
  cotas: false,
  autoParedes: true,
  techo: true,
  rejilla: false,
  reposteros: true,
  puertas: true,
  equipos: true,
};
const aplicarCapas = () => {
  cotas.visible = estado.cotas;
  rejilla.visible = estado.rejilla;
  reposteros.group.visible = estado.reposteros;
  reposteros.equiposGroup.visible = estado.equipos;
  for (const p of reposteros.puertas) p.visible = estado.puertas;
};
aplicarCapas();

bindToolbar({ views, estado, onToggle: aplicarCapas });

const refsCotas = {
  ...Object.fromEntries(Object.entries(room.walls).map(([id, w]) => [id, w.group])),
  ...views.objetos,
};
const centroVista = new THREE.Vector3(A / 2, 0, F / 2);

// Oculta las paredes situadas entre la cámara y el interior y deja su contorno
// (salvo en alzados, donde el contorno se superpondría a la pared observada).
const rel = new THREE.Vector3();
const camDir = new THREE.Vector3();
function actualizarVisibilidad(cam) {
  cam.getWorldDirection(camDir);
  for (const w of Object.values(room.walls)) {
    const tapa = estado.autoParedes && rel.subVectors(cam.position, w.point).dot(w.outward) > 0.05;
    w.group.visible = !tapa;
    w.ghost.visible = tapa && Math.abs(camDir.dot(w.outward)) < 0.9;
  }
  for (const [pared, f] of Object.entries(reposteros.fantasmas)) {
    const tapa = !room.walls[pared].group.visible;
    f.cuerpo.visible = !tapa;
    f.contorno.visible = tapa;
  }
  room.ceiling.visible = estado.techo && cam.position.y < H - 0.05;
  updateAnnotationVisibility(cotas, camDir, refsCotas);
  updateCabinetLabels(reposteros.etiquetas, estado.cotas, camDir);
  updateWallLabelVisibility(nombres, camDir, centroVista, room.walls);
}

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  views.resize();
}
window.addEventListener('resize', onResize);
onResize();

renderer.setAnimationLoop((now) => {
  views.update(now);
  controls.update();
  const cam = views.camera;
  actualizarVisibilidad(cam);
  renderer.render(scene, cam);
  labelRenderer.render(scene, cam);
});

// Acceso de depuración desde la consola del navegador.
window.__cocina = { scene, DIM, views, renderer, estado, aplicarCapas, reposteros, ready: true };

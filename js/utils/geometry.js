import * as THREE from 'three';

/**
 * Asigna coordenadas UV en metros proyectando cada cara sobre su plano
 * dominante. Con texturas en RepeatWrapping y repeat = 1/tamañoBaldosa,
 * las baldosas quedan a escala real y continuas entre piezas adyacentes.
 * La geometría debe estar ya en coordenadas de mundo.
 */
export function applyWorldUV(geometry) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    let u;
    let v;
    if (ay >= ax && ay >= az) {
      u = pos.getX(i);
      v = pos.getZ(i);
    } else if (ax >= az) {
      u = pos.getZ(i);
      v = pos.getY(i);
    } else {
      u = pos.getX(i);
      v = pos.getY(i);
    }
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}

/** Caja definida por sus esquinas mínima y máxima [x, y, z] en coordenadas de mundo. */
export function boxBetween(min, max, material, { worldUV = true, name } = {}) {
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
  geometry.translate(
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  );
  if (worldUV) applyWorldUV(geometry);
  const mesh = new THREE.Mesh(geometry, material);
  if (name) mesh.name = name;
  return mesh;
}

/**
 * Polígono en planta (puntos [x, z]) extruido verticalmente entre y0 e y1.
 * `holes` es una lista de polígonos [x, z] que se recortan.
 */
export function extrudePlan(points, y0, y1, material, { holes = [], name } = {}) {
  const toShapePoints = (pts) => pts.map(([x, z]) => new THREE.Vector2(x, z));
  const shape = new THREE.Shape(toShapePoints(points));
  for (const h of holes) shape.holes.push(new THREE.Path(toShapePoints(h)));

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false });
  // Plano XY de la forma → plano XZ del mundo; la extrusión (+Z local) pasa a -Y.
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, y1, 0);
  applyWorldUV(geometry);
  const mesh = new THREE.Mesh(geometry, material);
  if (name) mesh.name = name;
  return mesh;
}

/** Rectángulo [x0, z0, x1, z1] como polígono en planta. */
export function rectPlan(x0, z0, x1, z1) {
  return [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
  ];
}

const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x4f5965, transparent: true, opacity: 0.45 });

/** Añade aristas finas a un mesh para leer los volúmenes en vistas ortográficas. */
export function addEdges(mesh, thresholdAngle = 30) {
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, thresholdAngle), edgeMaterial));
  return mesh;
}

/** Activa sombras en todos los meshes de un objeto. */
export function setShadows(object, { cast = true, receive = true } = {}) {
  object.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return object;
}

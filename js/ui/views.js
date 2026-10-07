import * as THREE from 'three';

/**
 * Vistas predefinidas. Las vistas de pared son alzados interiores
 * ortográficos orientados igual que los dibujos de referencia; ocultan los
 * objetos que quedan entre la cámara y la pared mientras no se gire la vista.
 */
export function defineViews(d) {
  const { ancho: A, fondo: F, alto: H, espesorMuro: t } = d.ambiente;
  const center = new THREE.Vector3(A / 2, H / 2, F / 2);
  const elev = (pos, ocultar) => ({
    ortho: true,
    position: pos,
    target: center.clone(),
    fit: [Math.max(A, F) + 2 * t + 0.6, H + 0.9],
    ocultar,
  });
  return {
    iso: {
      ortho: false,
      position: new THREE.Vector3(-2.3, 5.9, 6.5),
      target: new THREE.Vector3(A / 2, 0.8, F / 2 + 0.1),
      ocultar: [],
    },
    top: {
      ortho: true,
      position: new THREE.Vector3(A / 2, 12, F / 2 + 0.001),
      target: new THREE.Vector3(A / 2, 0, F / 2),
      fit: [A + 2 * t + 1.3, F + 2 * t + 1.3],
      ocultar: [],
    },
    pared1: elev(new THREE.Vector3(-9, H / 2, F / 2), [
      'refrigeradora',
      'mesaIzquierda',
      'estufa',
      'zocaloHueco',
      'bajosIzquierda',
      'altosPared3',
      'equiposIzquierda',
    ]),
    pared2: elev(new THREE.Vector3(A / 2, H / 2, 10), ['refrigeradora', 'altosPared3', 'bidon']),
    pared3: elev(new THREE.Vector3(10, H / 2, F / 2), [
      'mesaDerecha',
      'estufa',
      'zocaloHueco',
      'bajosDerecha',
      'tacho',
      'bidon',
    ]),
    pared4: elev(new THREE.Vector3(A / 2, H / 2, -9), [
      'mesaIzquierda',
      'estufa',
      'zocaloHueco',
      'bajosIzquierda',
      'equiposIzquierda',
      'altosPared2',
      'altosPared3',
    ]),
  };
}

const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export class ViewManager {
  constructor({ perspective, orthographic, controls, views, objetos, onCameraChange }) {
    this.persp = perspective;
    this.ortho = orthographic;
    this.controls = controls;
    this.views = views;
    this.objetos = objetos;
    this.onCameraChange = onCameraChange;
    this.camera = perspective;
    this.orthoHalfHeight = 2.5;
    this.tween = null;
    this.current = null;
    this.viewDir = null;

    controls.addEventListener('change', () => this.#restoreIfRotated());
  }

  get aspect() {
    const el = this.controls.domElement;
    return el.clientWidth / Math.max(1, el.clientHeight);
  }

  resize() {
    this.persp.aspect = this.aspect;
    this.persp.updateProjectionMatrix();
    this.#applyOrthoFrustum();
  }

  #applyOrthoFrustum() {
    const h = this.orthoHalfHeight;
    const a = this.aspect;
    Object.assign(this.ortho, { top: h, bottom: -h, left: -h * a, right: h * a });
    this.ortho.updateProjectionMatrix();
  }

  #fitOrtho([w, h]) {
    this.orthoHalfHeight = (Math.max(h, w / this.aspect) / 2) * 1.04;
    this.ortho.zoom = 1;
    this.#applyOrthoFrustum();
  }

  #setHidden(names) {
    for (const [name, obj] of Object.entries(this.objetos)) if (obj) obj.visible = !names.includes(name);
  }

  #restoreIfRotated() {
    if (!this.viewDir || this.tween) return;
    const dir = new THREE.Vector3().subVectors(this.controls.target, this.camera.position).normalize();
    if (dir.angleTo(this.viewDir) > THREE.MathUtils.degToRad(4)) {
      this.#setHidden([]);
      this.viewDir = null;
    }
  }

  set(name, { animate = true } = {}) {
    const v = this.views[name];
    if (!v) return;
    const cam = v.ortho ? this.ortho : this.persp;
    if (cam !== this.camera) {
      cam.position.copy(this.camera.position);
      this.camera = cam;
      this.controls.object = cam;
      animate = false;
      this.onCameraChange?.(cam);
    }
    if (v.ortho) this.#fitOrtho(v.fit);
    this.#setHidden(v.ocultar);
    this.current = name;
    this.viewDir = v.ocultar.length
      ? new THREE.Vector3().subVectors(v.target, v.position).normalize()
      : null;

    if (!animate) {
      this.tween = null;
      cam.position.copy(v.position);
      this.controls.target.copy(v.target);
      this.controls.update();
      return;
    }
    this.tween = {
      t0: performance.now(),
      dur: 700,
      fromPos: cam.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos: v.position.clone(),
      toTarget: v.target.clone(),
    };
  }

  update(now) {
    const tw = this.tween;
    if (!tw) return;
    const k = ease(Math.min(1, (now - tw.t0) / tw.dur));
    this.camera.position.lerpVectors(tw.fromPos, tw.toPos, k);
    this.controls.target.lerpVectors(tw.fromTarget, tw.toTarget, k);
    if (k >= 1) this.tween = null;
  }
}

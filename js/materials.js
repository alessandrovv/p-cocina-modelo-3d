import * as THREE from 'three';

/**
 * Colores y materiales sobrios inspirados en las fotografías.
 * Las texturas se generan por código (canvas) y se escalan en metros
 * mediante UV de mundo (ver utils/geometry.js → applyWorldUV).
 */
export const COLORES = {
  tarrajeo: 0xd9d4ca,
  piso: 0xa9aaa6,
  junta: 0x8f908c,
  ceramicaBlanca: 0xf4f3ef,
  juntaCeramica: 0xc9c7c0,
  amarillo: 0xe6bf55,
  verde: 0x9ccc3d,
  rosado: 0xd9485c,
  columna: 0xcf3a48,
  ladrillo: 0x9a5640,
  mortero: 0xc9b9a6,
  techo: 0xe9e8e4,
  acero: 0xc4c8cc,
  aceroOscuro: 0x7d8288,
  marcoVentana: 0x9da3a8,
  vidrio: 0xbfd9e6,
  negroVidrio: 0x16181b,
  blancoRefri: 0xf1f1ee,
};

function canvasTexture(width, height, draw, { repeat = [1, 1], anisotropy = 8 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = anisotropy;
  return texture;
}

const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;

/** Baldosa rectangular de `w` × `h` metros con junta. */
function tileTexture({ w, h, color, grout, groutPx = 3, noise = 0.025, anisotropy }) {
  const px = 256;
  const height = Math.round((px * h) / w);
  return canvasTexture(
    px,
    height,
    (ctx, W, H) => {
      ctx.fillStyle = hex(grout);
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = hex(color);
      ctx.fillRect(groutPx / 2, groutPx / 2, W - groutPx, H - groutPx);
      // Variación sutil para que la superficie no se vea plana.
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * noise})`;
        ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
      }
    },
    { repeat: [1 / w, 1 / h], anisotropy },
  );
}

/** Ladrillo visto: hiladas de 0.08 m con aparejo a soga de 0.25 m. */
function brickTexture(anisotropy) {
  const moduloX = 0.25;
  const moduloY = 0.16; // dos hiladas
  return canvasTexture(
    256,
    164,
    (ctx, W, H) => {
      ctx.fillStyle = hex(COLORES.mortero);
      ctx.fillRect(0, 0, W, H);
      const rowH = H / 2;
      const joint = 6;
      const tonos = ['#9a5640', '#a35d45', '#8f4f3b', '#a86249'];
      const drawBrick = (x, y, w) => {
        ctx.fillStyle = tonos[Math.floor(Math.random() * tonos.length)];
        ctx.fillRect(x + joint / 2, y + joint / 2, w - joint, rowH - joint);
      };
      drawBrick(0, 0, W);
      drawBrick(-W / 2, rowH, W);
      drawBrick(W / 2, rowH, W);
    },
    { repeat: [1 / moduloX, 1 / moduloY], anisotropy },
  );
}

/** Cenefa decorativa (franja con frutas) — se mapea con V local 0..1. */
function borderTexture(anisotropy) {
  const largo = 0.25;
  return canvasTexture(
    256,
    64,
    (ctx, W, H) => {
      ctx.fillStyle = '#f6f4ee';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3f4a52';
      ctx.fillRect(0, 0, W, 6);
      ctx.fillRect(0, H - 6, W, 6);
      const frutas = ['#d8432f', '#e8a43a', '#7fae3c', '#c2324a', '#f0c94a', '#6a9e35'];
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.fillStyle = frutas[i];
        ctx.arc(20 + i * 42, H / 2, 11, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { repeat: [1 / largo, 1], anisotropy },
  );
}

/** Ruido muy leve para superficies tarrajeadas y pintadas. */
function plasterTexture(anisotropy) {
  return canvasTexture(
    128,
    128,
    (ctx, W, H) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 1400; i++) {
        const g = 225 + Math.random() * 30;
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
      }
    },
    { repeat: [1 / 0.6, 1 / 0.6], anisotropy },
  );
}

export function createMaterials(renderer) {
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  const plaster = plasterTexture(anisotropy);

  const paint = (color) =>
    new THREE.MeshStandardMaterial({ color, map: plaster, roughness: 0.92 });

  return {
    muro: paint(COLORES.tarrajeo),
    techo: paint(COLORES.techo),
    pinturaAmarilla: paint(COLORES.amarillo),
    pinturaVerde: paint(COLORES.verde),
    pinturaRosada: paint(COLORES.rosado),
    columna: paint(COLORES.columna),

    piso: new THREE.MeshStandardMaterial({
      map: tileTexture({
        w: 0.5,
        h: 0.5,
        color: COLORES.piso,
        grout: COLORES.junta,
        groutPx: 2,
        anisotropy,
      }),
      roughness: 0.75,
    }),
    ceramicaPared: new THREE.MeshStandardMaterial({
      map: tileTexture({
        w: 0.3,
        h: 0.2,
        color: COLORES.ceramicaBlanca,
        grout: COLORES.juntaCeramica,
        anisotropy,
      }),
      roughness: 0.35,
    }),
    ceramicaMesa: new THREE.MeshStandardMaterial({
      map: tileTexture({
        w: 0.3,
        h: 0.3,
        color: COLORES.ceramicaBlanca,
        grout: COLORES.juntaCeramica,
        anisotropy,
      }),
      roughness: 0.3,
    }),
    ceramicaCanto: new THREE.MeshStandardMaterial({
      map: tileTexture({
        w: 0.3,
        h: 0.1,
        color: COLORES.ceramicaBlanca,
        grout: COLORES.juntaCeramica,
        anisotropy,
      }),
      roughness: 0.3,
    }),
    cenefa: new THREE.MeshStandardMaterial({ map: borderTexture(anisotropy), roughness: 0.4 }),
    ladrillo: new THREE.MeshStandardMaterial({ map: brickTexture(anisotropy), roughness: 0.9 }),

    acero: new THREE.MeshStandardMaterial({ color: COLORES.acero, metalness: 0.75, roughness: 0.32 }),
    aceroOscuro: new THREE.MeshStandardMaterial({
      color: COLORES.aceroOscuro,
      metalness: 0.7,
      roughness: 0.45,
    }),
    marcoVentana: new THREE.MeshStandardMaterial({
      color: COLORES.marcoVentana,
      metalness: 0.5,
      roughness: 0.45,
    }),
    vidrio: new THREE.MeshStandardMaterial({
      color: COLORES.vidrio,
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    negroVidrio: new THREE.MeshStandardMaterial({
      color: COLORES.negroVidrio,
      metalness: 0.3,
      roughness: 0.15,
    }),
    negroMate: new THREE.MeshStandardMaterial({ color: 0x222326, roughness: 0.7 }),
    hierroFundido: new THREE.MeshStandardMaterial({ color: 0x1b1b1d, metalness: 0.4, roughness: 0.6 }),
    perilla: new THREE.MeshStandardMaterial({ color: 0x9fa4a9, metalness: 0.6, roughness: 0.35 }),
    blancoRefri: new THREE.MeshStandardMaterial({ color: COLORES.blancoRefri, roughness: 0.4 }),
    grisRefri: new THREE.MeshStandardMaterial({ color: 0xc9cbc9, roughness: 0.5 }),
    hueco: new THREE.MeshStandardMaterial({ color: 0x2a2c2e, roughness: 0.9 }),

    // Reposteros (etapa 2)
    melamina: new THREE.MeshStandardMaterial({ color: 0xfbfbf9, roughness: 0.55 }),
    melaminaInterior: new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.6 }),
    fondoMdf: new THREE.MeshStandardMaterial({ color: 0xe7e7e3, roughness: 0.8 }),
    equipo: new THREE.MeshStandardMaterial({
      color: 0x3d8bd9,
      transparent: true,
      opacity: 0.28,
      roughness: 0.6,
      depthWrite: false,
    }),
    equipoArista: new THREE.LineBasicMaterial({ color: 0x1f5fa8, transparent: true, opacity: 0.8 }),
  };
}

/**
 * Diseño de reposteros (etapa 2), en METROS.
 *
 * Usa el sistema de coordenadas de dimensiones.js. Cada módulo se ubica a lo
 * largo de la pared donde se apoya:
 *   pared2 → u = x (desde la Pared 3), frente hacia +Z
 *   pared3 → u = z (desde la Pared 2), frente hacia +X
 *   pared1 → u = z (desde la Pared 2), frente hacia −X
 *   pared4 → u = x (desde la Pared 3), frente hacia −Z (solo equipos)
 *
 * Decisiones del usuario:
 *   - Melamina blanca de 18 mm.
 *   - Bajo las mesas de cerámica: módulos abiertos, sin puertas ni cajones.
 *   - Altos en la Pared 2 (hasta 2.30 m) y en la Pared 3; en la Pared 3
 *     sobresalen del muro de 1.85 m con espalda de melamina vista.
 *   - Microondas y freidora sobre la mesa; arrocera, licuadora y extractor
 *     de jugos guardados bajo las mesas; bidón de agua en su lugar actual.
 *
 * Versiones (ver VERSIONES): la 1 es el diseño base; las siguientes lo
 * modifican. La activa se elige con ?v=N en la URL y se recuerda en localStorage.
 */
import { DIM } from './dimensiones.js';

const BASE = {
  material: {
    espesor: 0.018, // melamina blanca 18 mm
    espesorFondo: 0.003, // MDF blanco 3 mm (fondos no vistos)
    holgura: 0.003, // luz entre puertas y en su perímetro
    plancha: { largo: 2.44, ancho: 2.15 }, // melamina 18 mm (Vesto / Arauco)
    planchaFondo: { largo: 2.44, ancho: 1.22 }, // MDF 3 mm
    sierra: 0.004, // espesor de corte
    refilado: 0.01, // borde descartado en cada lado de la plancha
  },

  altos: {
    y0: 1.5, // justo sobre la cerámica de pared (60 cm sobre la mesa); la versión 2 lo baja
    y1: 2.3, // 20 cm libres hasta el techo
    fondo: 0.33, // cuerpo con espalda, sin puerta
    retiroRepisa: 0.02,
  },

  bajos: {
    holguraLosa: 0.01, // separación bajo la losa de la mesa
    retiroPared: 0.03, // espacio para irregularidades y tuberías
    fondo: 0.53, // queda 4 cm retirado del canto de la mesa
    retiroRepisa: 0.01,
  },

  tirador: { largo: 0.148, separacion: 0.128, retiroBorde: 0.04 },

  modulos: [
    // ── Altos de la Pared 2
    {
      id: 'A1',
      tipo: 'alto',
      pared: 'pared2',
      u: [0.16, 0.95],
      repisas: 2,
      // El tramo junto a la esquina queda detrás del repostero de la Pared 3:
      // se cierra con una tapa fija y la puerta abre desde 0.40 m.
      tapaFija: [0.16, 0.4],
      puertas: 1,
      bisagra: 'inicio',
      esquinero: true,
      contenido: 'Esquinero: artículos de poco uso',
    },
    {
      id: 'A2',
      tipo: 'alto',
      pared: 'pared2',
      u: [0.95, 1.8],
      y0: 1.7, // 80 cm sobre la mesa: aleja la melamina del calor de la estufa (sin campana)
      repisas: 1,
      puertas: 2,
      contenido: 'Sobre la estufa: condimentos y artículos livianos',
    },
    {
      id: 'A3',
      tipo: 'alto',
      pared: 'pared2',
      u: [1.8, 2.39],
      repisas: 2,
      puertas: 1,
      bisagra: 'inicio',
      contenido: 'Vasos, tazas y platos de uso diario',
    },
    {
      id: 'A4',
      tipo: 'alto',
      pared: 'pared2',
      u: [2.39, 2.98],
      repisas: 2,
      puertas: 1,
      bisagra: 'fin',
      contenido: 'Abarrotes',
    },
    { id: 'R1', tipo: 'relleno', pared: 'pared2', u: [2.98, 3.0], contenido: 'Relleno contra la Pared 1' },

    // ── Altos de la Pared 3 (espalda de melamina: sobresalen del muro de 1.85 m)
    {
      id: 'R2',
      tipo: 'relleno',
      pared: 'pared3',
      u: [0.348, 0.4],
      contenido: 'Relleno de esquina: deja abrir las puertas de A1 y A5',
    },
    {
      id: 'A5',
      tipo: 'alto',
      pared: 'pared3',
      u: [0.4, 1.175],
      repisas: 2,
      puertas: 2,
      espalda: 'melamina',
      contenido: 'Abarrotes y conservas',
    },
    {
      id: 'A6',
      tipo: 'alto',
      pared: 'pared3',
      u: [1.175, 1.95],
      repisas: 2,
      puertas: 2,
      espalda: 'melamina',
      contenido: 'Platos, fuentes y tapers livianos',
    },

    // ── Bajos de la mesa izquierda (Paredes 2 y 3)
    {
      id: 'B1',
      tipo: 'bajo',
      pared: 'pared2',
      u: [0.16, 0.82],
      repisas: 1,
      esquinero: true,
      contenido: 'Esquinero: ollas grandes y artículos de poco uso',
    },
    {
      id: 'B2',
      tipo: 'bajo',
      pared: 'pared3',
      u: [0.6, 1.21],
      repisas: [0.4],
      contenido: 'Ollas y sartenes (40 cm libres abajo)',
    },
    {
      id: 'B3',
      tipo: 'bajo',
      pared: 'pared3',
      u: [1.21, 1.82],
      repisas: 2,
      contenido: 'Tapers y recipientes',
    },

    // ── Bajos de la mesa derecha (Paredes 2 y 1)
    {
      id: 'B4',
      tipo: 'bajo',
      pared: 'pared2',
      u: [1.92, 2.42],
      repisas: 1,
      contenido: 'Platos, fuentes y tapas',
    },
    {
      id: 'B5',
      tipo: 'bajo',
      pared: 'pared2',
      u: [2.42, 2.97],
      repisas: 1,
      esquinero: true,
      contenido: 'Esquinero (acceso por el bajo del lavadero): reservas',
    },
    {
      id: 'B6',
      tipo: 'bajo',
      pared: 'pared1',
      u: [2.0, 2.57],
      repisas: [0.4],
      contenido: 'Arrocera, licuadora y extractor de jugos',
    },
  ],

  /** Zonas que se dejan libres a propósito. */
  zonasLibres: [
    {
      id: 'lavadero',
      pared: 'pared1',
      u: [0.6, 1.6],
      contenido: 'Bajo el lavadero: sin melamina (humedad y tuberías); organizador plástico',
    },
  ],

  /**
   * Equipos de referencia para comprobar espacios (no se fabrican).
   * Medidas [E] de modelos comunes: reemplazar por las de los equipos reales.
   */
  equipos: [
    {
      id: 'microondas',
      nombre: 'Microondas',
      pared: 'pared3',
      u: [0.13, 0.61],
      d: [0.03, 0.39],
      y: [DIM.mesas.alto, DIM.mesas.alto + 0.28], // [E] 20 L: 48 × 36 × 28 cm
      grupo: 'izquierda',
    },
    {
      id: 'freidora',
      nombre: 'Freidora de aire',
      pared: 'pared3',
      u: [0.7, 1.02],
      d: [0.08, 0.43],
      y: [DIM.mesas.alto, DIM.mesas.alto + 0.33], // [E] 4–5 L: 32 × 35 × 33 cm
      grupo: 'izquierda',
    },
    {
      id: 'tacho',
      nombre: 'Tacho de basura',
      pared: 'pared1',
      u: [1.62, 1.98],
      d: [0.05, 0.5],
      y: [DIM.mesas.zocalo.alto, DIM.mesas.zocalo.alto + 0.62], // [E] ~40 L: 36 × 45 × 62 cm
      grupo: 'tacho',
    },
    {
      id: 'bidon',
      nombre: 'Bidón de agua (lugar actual)',
      cilindro: { x: DIM.ambiente.ancho - 0.25, z: 2.88, radio: 0.17 },
      y: [0, 0.98], // [E] base ~48 cm + bidón 20 L ~50 cm
      grupo: 'bidon',
    },
  ],
};

/** Altura libre de cada tramo de repisa en los altos bajados de la versión 2 (25 + 25 cm, el resto arriba). */
const REPISAS_V2 = [0.25, 0.25];

export const VERSIONES = {
  1: {
    nombre: 'Versión 1',
    descripcion: 'Altos de 1.50 a 2.30 m (60 cm sobre la mesa)',
    aplicar: (R) => R,
  },
  2: {
    nombre: 'Versión 2',
    descripcion:
      'Altos de 1.40 a 2.20 m y 35 cm de fondo para alcanzarlos con 1.50 m de estatura; sin repostero sobre la estufa; Pared 3 en forma de C con dos columnas apoyadas en la mesa; verdulero junto a la Pared 4',
    aplicar: (R) => {
      const esp = R.material.espesor;
      const mesa = DIM.mesas;
      const finMesa = mesa.izquierda.largoPared3; // 1.95: extremo junto a la refrigeradora
      const columna = 0.35; // interior de 31.4 cm: entran platos de 27 cm
      // C2 deja un especiero de 25 cm en la esquina y C1 cierra la C sobre el pilar del
      // extremo de la mesa; entre ambas, 60 cm para el microondas (6 cm de ventilación por lado).
      const uC2 = [0.65, 0.65 + columna];
      const uC1 = [finMesa - columna, finMesa];
      const repisasColumna = [0.18, 0.264, ...REPISAS_V2]; // la repisa a 1.40 m divide las puertas
      const paredTres = (m) => m.pared === 'pared3' && m.tipo !== 'relleno';
      // Fondo total de 35 cm con la puerta; el relleno de esquina arranca en el frente de A1.
      const altos = { ...R.altos, y0: 1.4, y1: 2.2, fondo: 0.35 - esp };
      const verdulero = { ancho: 0.4, fondo: 0.27, alto: 1.0 };
      const xVerdulero = 1.15; // fuera del giro de la puerta de la refrigeradora (69 cm desde su bisagra)
      // Electrodomésticos en las mesas de la Pared 2 (junto a sus tomacorrientes, uno a cada
      // lado de la estufa) y de la Pared 3; la Pared 1 sigue con sus secadores.
      const toma = { ancho: 0.12, y: [1.12, 1.19] }; // [E] altura por confirmar en obra
      const separacionPared = 0.05; // freidora y arrocera
      const contenidos = {
        B2: 'Moldes, bandejas y artículos grandes (40 cm libres abajo)',
        B4: 'Ollas, sartenes y tapas (junto a la estufa)',
        B6: 'Fuentes, tapers y reservas',
      };
      return {
        ...R,
        altos,
        modulos: [
          ...R.modulos
            .filter((m) => m.id !== 'A2' && (!paredTres(m) || m.tipo === 'bajo'))
            .map((m) => {
              if (m.id === 'R2') return { ...m, u: [altos.fondo + esp, m.u[1]] };
              if (contenidos[m.id]) return { ...m, contenido: contenidos[m.id] };
              return m.tipo === 'alto' && m.y0 === undefined && m.repisas === 2 ? { ...m, repisas: REPISAS_V2 } : m;
            }),
          {
            id: 'A5',
            tipo: 'alto',
            pared: 'pared3',
            u: [R.modulos.find((m) => m.id === 'R2').u[1], uC2[0]],
            repisas: 3,
            puertas: 1,
            bisagra: 'inicio',
            espalda: 'melamina',
            contenido: 'Especiero sobre el microondas: condimentos, aceites y frascos',
          },
          {
            id: 'C2',
            tipo: 'alto',
            pared: 'pared3',
            u: uC2,
            y0: mesa.alto,
            hastaMesa: true,
            repisas: repisasColumna,
            // Abajo abre hacia la freidora (lejos del microondas); arriba, hacia el especiero,
            // para no chocar con la hoja vecina de A6.
            tramosPuertas: [
              { hasta: altos.y0, puertas: 1, bisagra: 'fin' },
              { puertas: 1, bisagra: 'inicio' },
            ],
            espalda: 'melamina',
            contenido: 'Uso diario, hasta la mesa: tazas, vasos y bowls; arriba jarras y vasos de reserva',
          },
          {
            id: 'A6',
            tipo: 'alto',
            pared: 'pared3',
            u: [uC2[1], uC1[0]],
            repisas: REPISAS_V2,
            puertas: 2,
            espalda: 'melamina',
            contenido: 'Abarrotes y conservas',
          },
          {
            id: 'C1',
            tipo: 'alto',
            pared: 'pared3',
            u: uC1,
            y0: mesa.alto,
            hastaMesa: true,
            repisas: repisasColumna,
            tramosPuertas: [
              { hasta: altos.y0, puertas: 1, bisagra: 'fin' },
              { puertas: 1, bisagra: 'fin' },
            ],
            espalda: 'melamina',
            contenido: 'Uso diario, hasta la mesa: cubiertos y platos; arriba platos hondos y fuentes',
          },
        ],
        equipos: [
          ...R.equipos.map((q) => {
            // Entre las columnas: 48 cm en un hueco de 60 y 22 cm libres hasta A6.
            if (q.id === 'microondas') return { ...q, u: [uC2[1] + 0.06, uC1[0] - 0.06] };
            // Esquina de la L, en fila con la arrocera a 5 cm de la Pared 2 (bajo A1).
            if (q.id === 'freidora')
              return { ...q, pared: 'pared2', u: [0.25, 0.57], d: [separacionPared, separacionPared + 0.35] };
            return q;
          }),
          {
            id: 'arrocera',
            nombre: 'Arrocera',
            pared: 'pared2',
            // Junto a la estufa, a 5 cm de la Pared 2 (bajo A1).
            u: [0.62, 0.9],
            d: [separacionPared, separacionPared + 0.28],
            y: [mesa.alto, mesa.alto + 0.29], // [E] 1.8 L: 28 × 28 × 29 cm
            grupo: 'izquierda',
          },
          {
            id: 'licuadora',
            nombre: 'Licuadora',
            pared: 'pared2',
            // Mesa derecha de la Pared 2, delante del tomacorriente.
            u: [2.23, 2.43],
            d: [0.06, 0.28],
            y: [mesa.alto, mesa.alto + 0.38], // [E] con jarra de 1.5 L: 20 × 22 × 38 cm
            grupo: 'derecha',
          },
          {
            id: 'extractor',
            nombre: 'Extractor',
            pared: 'pared2',
            u: [2.47, 2.69],
            d: [0.04, 0.37],
            y: [mesa.alto, mesa.alto + 0.4], // [E] centrífugo: 22 × 33 × 40 cm
            grupo: 'derecha',
          },
          {
            id: 'tomaIzquierda',
            nombre: 'Toma doble',
            pared: 'pared2',
            u: [mesa.izquierda.largoPared2 - 0.03 - toma.ancho, mesa.izquierda.largoPared2 - 0.03],
            d: [0, 0.01],
            y: toma.y,
            grupo: 'izquierda',
          },
          {
            id: 'tomaDerecha',
            nombre: 'Toma doble',
            pared: 'pared2',
            u: [DIM.ambiente.ancho - mesa.derecha.largoPared2 + 0.28, DIM.ambiente.ancho - mesa.derecha.largoPared2 + 0.28 + toma.ancho],
            d: [0, 0.01],
            y: toma.y,
            grupo: 'derecha',
          },
          // Existentes en la Pared 1, sobre la extensión de acero del lavadero (no se mueven).
          {
            id: 'secadorAbierto',
            nombre: 'Secador abierto',
            pared: 'pared1',
            u: [1.57, 2.07],
            d: [0.06, 0.4],
            y: [mesa.alto, mesa.alto + 0.22], // [E] 50 × 34 × 22 cm
            grupo: 'derecha',
          },
          {
            id: 'secadorCerrado',
            nombre: 'Secador cerrado',
            pared: 'pared1',
            u: [2.1, 2.62],
            d: [0.06, 0.42],
            y: [mesa.alto, mesa.alto + 0.32], // [E] 52 × 36 × 32 cm, con tapa
            grupo: 'derecha',
          },
          {
            id: 'verdulero',
            nombre: 'Verdulero',
            pared: 'pared4',
            u: [xVerdulero, xVerdulero + verdulero.ancho],
            d: [0, verdulero.fondo],
            y: [0, verdulero.alto],
            grupo: 'verdulero',
          },
        ],
        montaje: 'desmontable',
      };
    },
  },
};

const CLAVE_VERSION = 'cocina-version';
const ULTIMA = Math.max(...Object.keys(VERSIONES).map(Number));

function elegirVersion() {
  if (typeof window === 'undefined') return ULTIMA;
  const valida = (v) => (VERSIONES[v] ? Number(v) : null);
  const v =
    valida(new URLSearchParams(window.location.search).get('v')) ??
    valida(window.localStorage.getItem(CLAVE_VERSION)) ??
    ULTIMA;
  window.localStorage.setItem(CLAVE_VERSION, String(v));
  return v;
}

export const VERSION = elegirVersion();
export const REPOSTEROS = VERSIONES[VERSION].aplicar(BASE);

/** Recarga la página con otra versión del diseño. */
export function cambiarVersion(v) {
  const url = new URL(window.location.href);
  url.searchParams.set('v', String(v));
  window.location.assign(url);
}

const e = () => REPOSTEROS.material.espesor;

/** Distribuye `n` repisas o aplica alturas libres explícitas (desde la cara superior del piso). */
function alturasRepisas(spec, yi0, yi1, esp) {
  if (!spec) return [];
  if (Array.isArray(spec)) {
    const ys = [];
    let y = yi0;
    for (const libre of spec) {
      y += libre;
      ys.push(y);
      y += esp;
    }
    return ys;
  }
  const libre = (yi1 - yi0 - spec * esp) / (spec + 1);
  return Array.from({ length: spec }, (_, k) => yi0 + (k + 1) * libre + k * esp);
}

/** Puertas sobrepuestas con holgura perimetral y entre hojas. */
function hojas(u0, u1, n, bisagra, g, y0, y1) {
  const ancho = (u1 - u0 - g * n) / n;
  return Array.from({ length: n }, (_, k) => {
    const a = u0 + g / 2 + k * (ancho + g);
    return {
      u0: a,
      u1: a + ancho,
      y0: y0 + g / 2,
      y1: y1 - g / 2,
      bisagra: n === 1 ? bisagra ?? 'inicio' : k === 0 ? 'inicio' : 'fin',
    };
  });
}

/**
 * Tramos verticales de puertas, de abajo arriba. Sin `tramosPuertas` hay un solo
 * tramo de toda la altura con `puertas` hojas.
 */
function puertasDe(m, [u0, u1], y0, y1, g) {
  const tramos = m.tramosPuertas ?? (m.puertas ? [{ puertas: m.puertas, bisagra: m.bisagra }] : []);
  let yb = y0;
  return tramos.flatMap((t) => {
    const yt = t.hasta ?? y1;
    const out = hojas(u0, u1, t.puertas, t.bisagra, g, yb, yt);
    yb = yt;
    return out;
  });
}

/**
 * Normaliza los módulos: alturas absolutas, profundidades desde la pared,
 * repisas, puertas y tapas. Fuente común del modelo 3D, los planos y el despiece.
 */
export function resolverModulos(R = REPOSTEROS, d = DIM) {
  const esp = R.material.espesor;
  const g = R.material.holgura;
  const yBajo0 = d.mesas.zocalo.alto;
  const yBajo1 = d.mesas.alto - d.mesas.espesorLosa - R.bajos.holguraLosa;

  return R.modulos.map((m) => {
    const [u0, u1] = m.u;
    const alto = m.tipo !== 'bajo';
    const y0 = alto ? m.y0 ?? R.altos.y0 : yBajo0;
    const y1 = alto ? m.y1 ?? R.altos.y1 : yBajo1;
    const d0 = alto ? 0 : R.bajos.retiroPared;
    const fondoCuerpo = alto ? R.altos.fondo : R.bajos.fondo;
    const d1 = d0 + fondoCuerpo;
    const base = { ...m, u0, u1, ancho: u1 - u0, y0, y1, alto: y1 - y0, d0, d1, fondo: fondoCuerpo };

    if (m.tipo === 'relleno') return { ...base, d0: d1, d1: d1 + esp, fondo: esp, repisas: [], puertas: [] };

    const espalda = m.espalda ?? 'mdf';
    const espEspalda = espalda === 'melamina' ? esp : R.material.espesorFondo;
    const repisas = alturasRepisas(m.repisas, y0 + esp, y1 - esp, esp);
    const zonaPuertas = m.tapaFija ? [m.tapaFija[1], u1] : [u0, u1];
    const puertas = puertasDe(m, zonaPuertas, y0, y1, g);
    const tapaFija = m.tapaFija ? { u0: m.tapaFija[0] + g / 2, u1: m.tapaFija[1] - g / 2 } : null;
    return {
      ...base,
      espalda,
      espEspalda,
      repisas,
      retiroRepisa: alto ? R.altos.retiroRepisa : R.bajos.retiroRepisa,
      puertas,
      tapaFija,
      frente: d1 + (puertas.length || tapaFija ? esp : 0),
    };
  });
}

/** Tirador abajo en las puertas altas; arriba en las que arrancan desde la mesa. */
export function tiradorAbajo(hoja, d = DIM) {
  return hoja.y0 > d.mesas.alto + 0.1;
}

/** Apoyos de los altos sobre la mesa (de la cara superior de la mesa a la base del alto). */
export function resolverApoyos(R = REPOSTEROS, d = DIM) {
  return (R.apoyos ?? []).map((a) => {
    const [u0, u1] = a.u;
    const [d0, d1] = a.d;
    const y0 = d.mesas.alto;
    const y1 = R.altos.y0;
    return { ...a, u0, u1, d0, d1, y0, y1, ancho: u1 - u0, fondo: d1 - d0, alto: y1 - y0 };
  });
}

/** Caja en coordenadas de mundo a partir de coordenadas de pared. */
export function cajaMundo(pared, [u0, u1], [d0, d1], [y0, y1], d = DIM) {
  const A = d.ambiente.ancho;
  if (pared === 'pared2') return { min: [u0, y0, d0], max: [u1, y1, d1] };
  if (pared === 'pared3') return { min: [d0, y0, u0], max: [d1, y1, u1] };
  if (pared === 'pared1') return { min: [A - d1, y0, u0], max: [A - d0, y1, u1] };
  if (pared === 'pared4') return { min: [u0, y0, d.ambiente.fondo - d1], max: [u1, y1, d.ambiente.fondo - d0] };
  throw new Error(`Pared sin soporte para reposteros: ${pared}`);
}

/** Pilares de las mesas en coordenadas de mundo (mismo cálculo que counters.js). */
function pilares(d) {
  const m = d.mesas;
  const A = d.ambiente.ancho;
  const r = m.retiroPilar;
  const t = m.espesorPilar;
  const L = m.izquierda;
  const D = m.derecha;
  return [
    { min: [L.largoPared2 - r - t, 0, 0], max: [L.largoPared2 - r, 1, m.fondo - r] },
    { min: [0, 0, L.largoPared3 - r - t], max: [m.fondo - r, 1, L.largoPared3 - r] },
    { min: [A - (D.largoPared2 - r), 0, 0], max: [A - (D.largoPared2 - r - t), 1, m.fondo - r] },
    { min: [A - (m.fondo - r), 0, D.largoPared1 - r - t], max: [A, 1, D.largoPared1 - r] },
  ];
}

const seCruzan = (a, b, tol = 1e-4) =>
  [0, 1, 2].every((i) => a.min[i] < b.max[i] - tol && b.min[i] < a.max[i] - tol);

/** Comprueba choques entre módulos y con la estructura de la cocina. */
export function validarReposteros(R = REPOSTEROS, d = DIM) {
  const avisos = [];
  const mods = resolverModulos(R, d);
  const cajas = mods.map((m) => ({ m, ...cajaMundo(m.pared, [m.u0, m.u1], [m.d0, m.frente ?? m.d1], [m.y0, m.y1], d) }));

  for (let i = 0; i < cajas.length; i++)
    for (let j = i + 1; j < cajas.length; j++)
      if (seCruzan(cajas[i], cajas[j])) avisos.push(`Los módulos ${cajas[i].m.id} y ${cajas[j].m.id} se superponen.`);

  for (const c of cajas) {
    if (c.m.tipo !== 'bajo') continue;
    for (const p of pilares(d)) if (seCruzan(c, p)) avisos.push(`El módulo ${c.m.id} choca con un pilar de la mesa.`);
  }

  const encimaMesa = d.mesas.alto;
  const largoMesa = { pared3: d.mesas.izquierda.largoPared3, pared2: d.mesas.izquierda.largoPared2 };
  for (const m of mods) {
    if (m.hastaMesa) {
      if (Math.abs(m.y0 - encimaMesa) > 1e-6) avisos.push(`El módulo ${m.id} debe apoyarse sobre la mesa.`);
      if (m.u1 > (largoMesa[m.pared] ?? 0) + 1e-6) avisos.push(`El módulo ${m.id} queda fuera de la mesa.`);
    } else if (m.tipo === 'alto' && m.y0 - encimaMesa < 0.5 - 1e-6)
      avisos.push(`El módulo ${m.id} queda a menos de 50 cm sobre la mesa.`);
    if (m.tipo === 'alto' && m.y1 > d.ambiente.alto) avisos.push(`El módulo ${m.id} supera la altura del techo.`);
    for (const y of m.repisas ?? [])
      if (y + e() > m.y1 - e() + 1e-6) avisos.push(`Una repisa del módulo ${m.id} no cabe.`);
    // Luz recomendada para repisas de melamina de 18 mm con carga ligera.
    if (m.repisas?.length && m.ancho - 2 * e() > 0.85)
      avisos.push(`Las repisas del módulo ${m.id} superan 85 cm de luz: pueden pandearse.`);
  }

  const equipos = R.equipos.filter((q) => !q.cilindro).map((q) => ({ q, ...cajaMundo(q.pared, q.u, q.d, q.y, d) }));
  for (const c of cajas)
    for (const { q, ...b } of equipos)
      if (q.dentro !== c.m.id && seCruzan(c, b)) avisos.push(`El módulo ${c.m.id} choca con ${q.nombre.toLowerCase()}.`);
  for (const q of R.equipos.filter((x) => x.dentro)) {
    const m = mods.find((x) => x.id === q.dentro);
    const techo = [...m.repisas, m.y1 - e()].find((y) => y > q.y[0]);
    const cabe =
      m.pared === q.pared &&
      q.u[0] >= m.u0 + e() - 1e-6 &&
      q.u[1] <= m.u1 - e() + 1e-6 &&
      q.d[0] >= m.d0 + m.espEspalda - 1e-6 &&
      q.d[1] <= m.d1 + 1e-6 &&
      q.y[0] >= m.y0 + e() - 1e-6 &&
      q.y[1] <= techo + 1e-6;
    if (!cabe) avisos.push(`${q.nombre} no cabe en el módulo ${m.id}.`);
  }
  for (const a of resolverApoyos(R, d)) {
    if (a.u1 > (largoMesa[a.pared] ?? 0) + 1e-6 || a.d1 > d.mesas.fondo)
      avisos.push(`El apoyo ${a.id} queda fuera de la mesa.`);
    const caja = cajaMundo(a.pared, [a.u0, a.u1], [a.d0, a.d1], [a.y0, a.y1], d);
    for (const { q, ...c } of equipos) if (seCruzan(caja, c)) avisos.push(`El apoyo ${a.id} choca con ${q.nombre.toLowerCase()}.`);
  }
  return avisos;
}

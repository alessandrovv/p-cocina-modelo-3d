/**
 * Diseño de reposteros (etapa 2), en METROS.
 *
 * Usa el sistema de coordenadas de dimensiones.js. Cada módulo se ubica a lo
 * largo de la pared donde se apoya:
 *   pared2 → u = x (desde la Pared 3), frente hacia +Z
 *   pared3 → u = z (desde la Pared 2), frente hacia +X
 *   pared1 → u = z (desde la Pared 2), frente hacia −X
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
      'Altos a 1.40 m (50 cm sobre la mesa) para alcanzarlos con 1.50 m de estatura; sin repostero sobre la estufa; columna de uso diario hasta la mesa y verdulero en la Pared 3',
    aplicar: (R) => {
      const esp = R.material.espesor;
      const mesa = DIM.mesas;
      const finMesa = mesa.izquierda.largoPared3; // 1.95: extremo junto a la refrigeradora
      // Verdulero de pie frente al extremo de la mesa; la columna C1 queda a su lado
      // para que el verdulero no estorbe el acceso.
      const verdulero = { ancho: 0.4, fondo: 0.27, alto: 1.0 };
      const uVerdulero = [finMesa - verdulero.ancho, finMesa];
      const uColumna = [uVerdulero[0] - 0.4, uVerdulero[0]];
      const paredTres = (m) => m.pared === 'pared3' && m.tipo !== 'relleno';
      return {
        ...R,
        altos: { ...R.altos, y0: 1.4 },
        modulos: [
          ...R.modulos
            .filter((m) => m.id !== 'A2' && !paredTres(m))
            .map((m) => (m.tipo === 'alto' && m.y0 === undefined && m.repisas === 2 ? { ...m, repisas: REPISAS_V2 } : m)),
          {
            id: 'A5',
            tipo: 'alto',
            pared: 'pared3',
            u: [0.4, uColumna[0]],
            repisas: REPISAS_V2,
            puertas: 2,
            espalda: 'melamina',
            contenido: 'Abarrotes y conservas',
          },
          {
            id: 'C1',
            tipo: 'alto',
            pared: 'pared3',
            u: uColumna,
            y0: mesa.alto,
            hastaMesa: true,
            // Abajo: cubiertos y tazas (18 cm) y platos (26 cm); la repisa a 1.40 m divide las puertas.
            repisas: [0.18, 0.264, ...REPISAS_V2],
            // La puerta baja abre hacia A5 para no chocar con el verdulero; la alta, hacia A6,
            // para no chocar con la hoja vecina de A5.
            tramosPuertas: [
              { hasta: 1.4, puertas: 1, bisagra: 'inicio' },
              { puertas: 1, bisagra: 'fin' },
            ],
            espalda: 'melamina',
            contenido: 'Uso diario, hasta la mesa: cubiertos y tazas, platos, vasos; sostiene A5 y A6',
          },
          {
            id: 'A6',
            tipo: 'alto',
            pared: 'pared3',
            u: uVerdulero,
            repisas: REPISAS_V2,
            puertas: 1,
            bisagra: 'fin',
            espalda: 'melamina',
            contenido: 'Sobre el verdulero: artículos de poco uso',
          },
          { id: 'B2', tipo: 'bajo', pared: 'pared3', u: [0.6, 1.075], repisas: [0.4], contenido: 'Ollas y sartenes (40 cm libres abajo)' },
          { id: 'B3', tipo: 'bajo', pared: 'pared3', u: [1.075, uVerdulero[0]], repisas: 2, contenido: 'Tapers y recipientes' },
        ],
        // La Pared 3 (ladrillo de soga sin tarrajeo, borde superior libre) solo mantiene
        // los altos verticales: C1 y P1 bajan el peso a la mesa y el techo de losa toma el vuelco.
        apoyos: [
          {
            id: 'P1',
            tipo: 'panel',
            pared: 'pared3',
            u: [finMesa - esp, finMesa],
            d: [0, R.altos.fondo + esp],
            contenido: 'Pie de melamina bajo el extremo de A6, sobre el pilar de la mesa (queda detrás del verdulero)',
          },
        ],
        zonasLibres: [
          ...R.zonasLibres,
          {
            id: 'verdulero',
            pared: 'pared3',
            u: [uVerdulero[0], mesa.izquierda.largoPared3 - mesa.retiroPilar - mesa.espesorPilar],
            contenido: 'libre (detrás del verdulero)',
          },
        ],
        equipos: [
          ...R.equipos,
          {
            id: 'verdulero',
            nombre: 'Verdulero',
            pared: 'pared3',
            u: uVerdulero,
            d: [mesa.fondo + 0.01, mesa.fondo + 0.01 + verdulero.fondo],
            y: [0, verdulero.alto],
            grupo: 'izquierda',
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
    for (const { q, ...b } of equipos) if (seCruzan(c, b)) avisos.push(`El módulo ${c.m.id} choca con ${q.nombre.toLowerCase()}.`);
  for (const a of resolverApoyos(R, d)) {
    if (a.u1 > (largoMesa[a.pared] ?? 0) + 1e-6 || a.d1 > d.mesas.fondo)
      avisos.push(`El apoyo ${a.id} queda fuera de la mesa.`);
    const caja = cajaMundo(a.pared, [a.u0, a.u1], [a.d0, a.d1], [a.y0, a.y1], d);
    for (const { q, ...c } of equipos) if (seCruzan(caja, c)) avisos.push(`El apoyo ${a.id} choca con ${q.nombre.toLowerCase()}.`);
  }
  return avisos;
}

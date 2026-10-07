/**
 * Despiece de los reposteros: piezas, cantos, herrajes, optimización de
 * planchas y presupuesto. Sin dependencias de Three.js (lo usan el modelo y
 * la página de planos).
 */
import { REPOSTEROS, resolverModulos, resolverApoyos, cajaMundo } from '../config/reposteros.js';

const mm = (m) => Math.round(m * 1000);

/** Piezas de un módulo. Medidas en metros; `cantos` en metros lineales por pieza. */
function piezasModulo(m, R) {
  const esp = R.material.espesor;
  const g = R.material.holgura;
  // 'humedad': piezas de los bajos en contacto con el piso (laterales y piso).
  const base = m.tipo === 'bajo' ? 'humedad' : 'estandar';
  const piezas = [];
  const add = (nombre, cant, largo, ancho, material, cantos = {}) =>
    piezas.push({ modulo: m.id, nombre, cant, largo, ancho, material, delgado: cantos.delgado ?? 0, grueso: cantos.grueso ?? 0 });

  if (m.tipo === 'relleno') {
    add('Relleno', 1, m.alto, m.ancho, 'estandar', { grueso: 2 * m.alto });
    return piezas;
  }

  const prof = m.fondo - m.espEspalda;
  const interior = m.ancho - 2 * esp;
  add('Lateral', 2, m.alto, prof, base, { delgado: m.alto });
  // 'relleno': piezas de los bajos que pueden ir en RH si sobra espacio en esas planchas.
  const flexible = m.tipo === 'bajo' ? 'relleno' : 'estandar';
  if (m.tipo === 'bajo') {
    add('Piso', 1, interior, prof, 'humedad', { delgado: interior });
    add('Techo', 1, interior, prof, flexible, { delgado: interior });
  } else {
    add('Piso / techo', 2, interior, prof, 'estandar', { delgado: interior });
  }
  if (m.repisas.length) {
    const largo = interior - 0.002;
    add('Repisa', m.repisas.length, largo, prof - m.retiroRepisa, flexible, { delgado: largo });
  }
  if (m.espalda === 'melamina') add('Espalda vista', 1, m.alto, m.ancho, 'estandar', { delgado: 2 * (m.alto + m.ancho) });
  else add('Fondo', 1, m.alto - 0.002, m.ancho - 0.002, 'mdf3');

  for (const h of m.puertas) {
    const a = h.u1 - h.u0;
    const alto = h.y1 - h.y0;
    add('Puerta', 1, alto, a, 'estandar', { grueso: 2 * (alto + a) });
  }
  const hPuerta = m.alto - g;
  if (m.tapaFija) {
    const a = m.tapaFija.u1 - m.tapaFija.u0;
    add('Tapa fija', 1, hPuerta, a, 'estandar', { grueso: 2 * (hPuerta + a) });
  }
  return piezas;
}

/** Agrupa piezas idénticas del mismo módulo. */
function agrupar(piezas) {
  const map = new Map();
  for (const p of piezas) {
    const k = [p.modulo, p.nombre, mm(p.largo), mm(p.ancho), p.material].join('|');
    const prev = map.get(k);
    if (prev) prev.cant += p.cant;
    else map.set(k, { ...p });
  }
  return [...map.values()];
}

/** Pies de melamina: el canto frontal queda a la vista. */
function piezasApoyo(a) {
  if (a.tipo !== 'panel') return [];
  return [{ modulo: a.id, nombre: 'Pie de apoyo', cant: 1, largo: a.alto, ancho: a.fondo, material: 'estandar', delgado: 0, grueso: a.alto }];
}

/** Pares de altos o rellenos que se tocan (se unen con pernos desmontables). */
function contactosAltos(modulos) {
  const cajas = modulos
    .filter((m) => m.tipo !== 'bajo')
    .map((m) => cajaMundo(m.pared, [m.u0, m.u1], [m.d0, m.frente ?? m.d1], [m.y0, m.y1]));
  const tol = 1e-3;
  let n = 0;
  for (let i = 0; i < cajas.length; i++)
    for (let j = i + 1; j < cajas.length; j++) {
      const a = cajas[i];
      const b = cajas[j];
      const solape = [0, 1, 2].map((k) => Math.min(a.max[k], b.max[k]) - Math.max(a.min[k], b.min[k]));
      if (solape.filter((s) => Math.abs(s) <= tol).length === 1 && solape.filter((s) => s > 0.01).length === 2) n++;
    }
  return n;
}

export function despiece(R = REPOSTEROS, modulos = resolverModulos(R)) {
  const apoyos = resolverApoyos(R);
  const piezas = agrupar([...modulos.flatMap((m) => piezasModulo(m, R)), ...apoyos.flatMap(piezasApoyo)]);
  const puertas = modulos.reduce((n, m) => n + (m.puertas?.length ?? 0), 0);
  const altos = modulos.filter((m) => m.tipo === 'alto');
  const bajos = modulos.filter((m) => m.tipo === 'bajo');
  const altosVistos = altos.filter((m) => m.espalda === 'melamina');
  const desmontable = R.montaje === 'desmontable';
  const tramosRiel = ['pared2', 'pared3'].map((p) =>
    modulos.filter((m) => m.tipo === 'alto' && m.pared === p).reduce((s, m) => s + m.ancho, 0),
  );

  const herrajes = [
    { id: 'bisagra', cant: puertas, nota: '2 bisagras por puerta (1 paquete)' },
    { id: 'tirador', cant: puertas, nota: '1 por puerta, vertical, cerca del borde inferior' },
    { id: 'colgador', cant: altos.length, nota: desmontable ? '1 par por módulo alto; se enganchan al riel' : '1 par por módulo alto' },
    ...(desmontable
      ? [
          { id: 'riel', cant: Math.ceil(tramosRiel.reduce((s, x) => s + x, 0) * 10) / 10, nota: 'Un tramo por pared, del ancho de los altos; tarugos de 8 mm cada 30 cm' },
          { id: 'pernoUnion', cant: 2 * contactosAltos(modulos), nota: '2 por cada unión entre altos o rellenos (sin cola)' },
        ]
      : []),
    { id: 'escuadra', cant: altosVistos.length * 2, nota: '2 por módulo alto de la Pared 3, fijadas al techo' },
    { id: 'tuboApoyo', cant: apoyos.filter((a) => a.tipo === 'tubo').length, nota: 'Apoyo de los altos de la Pared 3 sobre la mesa' },
    {
      id: 'regaton',
      cant: (bajos.length + altos.filter((m) => m.hastaMesa).length) * 4,
      nota: altos.some((m) => m.hastaMesa) ? '4 por módulo bajo y 4 de goma bajo la columna que apoya en la mesa' : '4 por módulo bajo',
    },
    { id: 'tornilleria', cant: 1, nota: 'Tornillos 4 × 40 / 4 × 50 mm, tarugos 8 mm, clavos de fondo' },
  ].filter((h) => h.cant > 0);

  const total = (k) => piezas.reduce((s, p) => s + p[k] * p.cant, 0);
  return {
    modulos,
    piezas,
    herrajes,
    cantoDelgado: total('delgado'),
    cantoGrueso: total('grueso'),
    corte: piezas.filter((p) => p.material !== 'mdf3').reduce((s, p) => s + (p.largo + p.ancho) * p.cant, 0),
  };
}

const EPS = 1e-9;

/**
 * Empaquetado por guillotina (cada corte atraviesa el rectángulo libre de lado
 * a lado, como en una sierra de panel), con giro libre: la melamina blanca no
 * tiene veta. Las piezas se colocan en el orden recibido; `corte` elige la regla.
 */
function guillotina(items, L, W, sierra, corte, opcionales = []) {
  const planchas = [];
  const sobrantes = [];
  const ubicar = (it, abrir) => {
    let mejor = null;
    for (const s of planchas)
      for (let i = 0; i < s.libres.length; i++) {
        const r = s.libres[i];
        for (const [w, h] of [
          [it.w, it.h],
          [it.h, it.w],
        ]) {
          if (w > r.w + EPS || h > r.h + EPS) continue;
          const score = r.w * r.h - w * h;
          if (!mejor || score < mejor.score - EPS) mejor = { s, i, w, h, score };
        }
      }
    if (!mejor) {
      if (!abrir) return false;
      const s = { libres: [{ x: 0, y: 0, w: L, h: W }], piezas: [] };
      planchas.push(s);
      const [w, h] = it.w <= L && it.h <= W ? [it.w, it.h] : [it.h, it.w];
      mejor = { s, i: 0, w, h };
    }
    const { s, i, w, h } = mejor;
    const r = s.libres.splice(i, 1)[0];
    s.piezas.push({ ...it, x: r.x, y: r.y, w, h });
    const restoW = r.w - w - sierra;
    const restoH = r.h - h - sierra;
    const horizontal = corte(restoW, restoH);
    const derecha = { x: r.x + w + sierra, y: r.y, w: restoW, h: horizontal ? h : r.h };
    const arriba = { x: r.x, y: r.y + h + sierra, w: horizontal ? r.w : w, h: restoH };
    for (const n of [derecha, arriba]) if (n.w > 0.02 && n.h > 0.02) s.libres.push(n);
    return true;
  };
  for (const it of items) ubicar(it, true);
  // Las opcionales solo aprovechan el sobrante; no abren planchas nuevas.
  for (const it of [...opcionales].sort(ORDENES[0])) if (!ubicar(it, false)) sobrantes.push(it);
  return { planchas, sobrantes };
}

const ORDENES = [
  (a, b) => b.w * b.h - a.w * a.h,
  (a, b) => b.w - a.w || b.h - a.h,
  (a, b) => b.h - a.h || b.w - a.w,
  (a, b) => b.w + b.h - (a.w + a.h),
];
const CORTES = [(rw, rh) => rw <= rh, (rw, rh) => rw > rh, (rw, rh) => rw * 1 < rh * 0.5];

/** Generador pseudoaleatorio con semilla: el resultado es el mismo en cada carga. */
function azar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VARIANTES_MIN = 200;
const VARIANTES_MAX = 6000;

/** Órdenes de colocación: las heurísticas fijas y luego variantes del orden por área con ruido. */
function* ordenesDeColocacion(items) {
  for (const o of ORDENES) yield [...items].sort(o);
  const rnd = azar(20261006);
  for (let k = 0; k < VARIANTES_MAX; k++)
    yield items
      .map((it) => ({ it, clave: it.w * it.h * (1 + 0.8 * rnd()) }))
      .sort((a, b) => b.clave - a.clave)
      .map((x) => x.it);
}

const cache = new Map();

/**
 * Optimiza el uso de planchas probando varias heurísticas; elige la de menos
 * planchas y, a igualdad, la que deja la última plancha más libre (sobrante útil).
 * Deja de buscar cuando alcanza el mínimo de planchas que permite el área.
 */
export function optimizarPlanchas(piezas, plancha, material, opcionales = []) {
  const clave = JSON.stringify([piezas, plancha, material.sierra, material.refilado, opcionales]);
  if (!cache.has(clave)) cache.set(clave, calcularPlanchas(piezas, plancha, material, opcionales));
  return cache.get(clave);
}

function calcularPlanchas(piezas, plancha, { sierra, refilado }, opcionales) {
  const L = plancha.largo - 2 * refilado;
  const W = plancha.ancho - 2 * refilado;
  const expandir = (lista) => {
    const out = [];
    for (const p of lista)
      for (let i = 0; i < p.cant; i++) {
        const a = Math.max(p.largo, p.ancho);
        const b = Math.min(p.largo, p.ancho);
        if (a > L + EPS || b > W + EPS) throw new Error(`La pieza ${p.modulo} ${p.nombre} no cabe en la plancha.`);
        out.push({ ...p, cant: 1, w: a, h: b });
      }
    return out;
  };
  const items = expandir(piezas);
  const extra = expandir(opcionales);

  const area = (s) => s.piezas.reduce((t, p) => t + p.w * p.h, 0);
  const areaLista = (l) => l.reduce((t, p) => t + p.w * p.h, 0);
  const cota = Math.ceil(areaLista(items) / (L * W) - EPS);
  let mejor = null;
  let k = 0;
  for (const orden of ordenesDeColocacion(items)) {
    // Con el mínimo de planchas ya alcanzado, el sobrante de opcionales solo se afina un rato más.
    if (k >= VARIANTES_MIN && mejor.n <= cota && (mejor.resto <= EPS || k >= 5 * VARIANTES_MIN)) break;
    k++;
    for (const corte of CORTES) {
      const r = guillotina(orden, L, W, sierra, corte, extra);
      const n = r.planchas.length;
      const resto = areaLista(r.sobrantes);
      const ultima = n ? area(r.planchas[n - 1]) : 0;
      const peor =
        mejor &&
        (n > mejor.n || (n === mejor.n && (resto > mejor.resto + EPS || (Math.abs(resto - mejor.resto) <= EPS && ultima >= mejor.ultima))));
      if (!mejor || !peor) mejor = { r, n, resto, ultima };
    }
  }

  const total = plancha.largo * plancha.ancho;
  const planchas = mejor.r.planchas.map((s) => ({ piezas: s.piezas, aprovechamiento: area(s) / total }));
  return { planchas, sobrantes: mejor.r.sobrantes, util: { largo: L, ancho: W }, refilado };
}

/**
 * Planchas por producto. Con `bajosRH`, las piezas de los bajos en contacto con
 * el piso van en melamina RH y el sobrante de esas planchas se completa con
 * techos y repisas de los bajos; lo que no entra pasa a la melamina estándar.
 */
export function planchasPorProducto(piezas, bajosRH, R = REPOSTEROS) {
  const de = (...mats) => piezas.filter((p) => mats.includes(p.material));
  const out = {};
  let estandar = de('estandar');
  if (bajosRH) {
    const rh = optimizarPlanchas(de('humedad'), R.material.plancha, R.material, de('relleno'));
    out.melamina18rh = rh;
    estandar = [...estandar, ...rh.sobrantes];
  } else {
    estandar = [...estandar, ...de('humedad', 'relleno')];
  }
  out.melamina18 = optimizarPlanchas(estandar, R.material.plancha, R.material);
  out.mdf3 = optimizarPlanchas(de('mdf3'), R.material.planchaFondo, R.material);
  return out;
}

/** Producto en el que terminó cada pieza (para la lista de cortes). */
export function productoDePieza(planchas) {
  const mapa = new Map();
  for (const [producto, r] of Object.entries(planchas))
    for (const s of r.planchas)
      for (const p of s.piezas) {
        const k = `${p.modulo}|${p.nombre}|${mm(p.largo)}|${mm(p.ancho)}`;
        const set = mapa.get(k) ?? new Set();
        set.add(producto);
        mapa.set(k, set);
      }
  return (p) => [...(mapa.get(`${p.modulo}|${p.nombre}|${mm(p.largo)}|${mm(p.ancho)}`) ?? [])];
}

/** Líneas del presupuesto con los precios dados. */
export function presupuesto(d, precios, opciones) {
  const P = precios.items;
  const precioUnit = (id, cant) => {
    const it = P[id];
    return it.volumen && cant >= it.volumen.desde ? it.volumen.precio : it.precio;
  };
  const lineas = [];
  const add = (id, cant, grupo = 'materiales', nota = '') => {
    if (!cant) return;
    const unit = precioUnit(id, cant);
    lineas.push({ id, nombre: P[id].nombre, cant, unidad: P[id].unidad, unit, total: unit * cant, estado: P[id].estado, grupo, nota });
  };

  const planchas = planchasPorProducto(d.piezas, opciones.bajosRH);
  for (const [producto, r] of Object.entries(planchas)) add(producto, r.planchas.length);
  add('corte', Math.ceil(d.corte), 'servicios', 'Suma de largo + ancho de cada pieza');
  add('cantoDelgado', Math.ceil(d.cantoDelgado * 1.1), 'servicios', 'Incluye 10 % de merma');
  add('cantoGrueso', Math.ceil(d.cantoGrueso * 1.1), 'servicios', 'Incluye 10 % de merma');
  for (const h of d.herrajes) add(h.id, h.cant, 'herrajes', h.nota);
  add('movilidad', 1, 'servicios');
  if (opciones.manoObra) add('manoObra', 1, 'mano de obra');

  const suma = (f) => lineas.filter(f).reduce((s, l) => s + l.total, 0);
  return {
    lineas,
    planchas,
    materiales: suma((l) => l.grupo !== 'mano de obra'),
    manoObra: suma((l) => l.grupo === 'mano de obra'),
    total: suma(() => true),
  };
}

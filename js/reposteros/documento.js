/**
 * Página de fabricación: planos acotados, módulos, lista de cortes, planchas,
 * herrajes y presupuesto. Todo se calcula desde las configuraciones.
 */
import { DIM, derivadas } from '../config/dimensiones.js';
import {
  REPOSTEROS,
  VERSION,
  VERSIONES,
  cambiarVersion,
  resolverApoyos,
  resolverModulos,
  tiradorAbajo,
  validarReposteros,
} from '../config/reposteros.js';
import { PRECIOS } from '../config/precios.js';
import { despiece, largoPlatina, presupuesto, productoDePieza } from './despiece.js';

const D = DIM;
const der = derivadas(D);
const { ancho: A, fondo: F, alto: H } = D.ambiente;
const modulos = resolverModulos(REPOSTEROS, D);
const apoyos = resolverApoyos(REPOSTEROS, D);
const datos = despiece(REPOSTEROS, modulos);

const cm = (m) => {
  const v = Math.round(m * 1000) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};
const mmTxt = (m) => String(Math.round(m * 1000));
const soles = (v) => `S/ ${v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const NOMBRE_PRODUCTO = {
  melamina18: 'Melamina blanca 18 mm',
  melamina18rh: 'Melamina blanca RH 18 mm',
  mdf3: 'MDF blanco 3 mm',
};

// ── Precios editables (se guardan en el navegador)
const CLAVE = 'cocina-reposteros-precios';
function cargarPrecios() {
  const base = structuredClone(PRECIOS);
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if (g?.fecha === base.fecha) {
      for (const [id, p] of Object.entries(g.precios ?? {})) if (base.items[id]) base.items[id].precio = p;
      Object.assign(base.opciones, g.opciones ?? {});
    }
  } catch {
    /* precios guardados ilegibles: se usan los de la configuración */
  }
  return base;
}
const precios = cargarPrecios();
const guardarPrecios = () =>
  localStorage.setItem(
    CLAVE,
    JSON.stringify({
      fecha: precios.fecha,
      precios: Object.fromEntries(Object.entries(precios.items).map(([k, v]) => [k, v.precio])),
      opciones: precios.opciones,
    }),
  );

// ── Utilidades SVG (unidades: milímetros)
const S = 1000;
function svg(w, h, contenido, { margen = [420, 320, 360, 380] } = {}) {
  const [mt, mr, mb, ml] = margen;
  return `<svg class="plano" viewBox="${-ml} ${-mt} ${w + ml + mr} ${h + mt + mb}" xmlns="http://www.w3.org/2000/svg">${contenido}</svg>`;
}
const rect = (x, y, w, h, cls, extra = '') =>
  `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" class="${cls}" ${extra}/>`;
const line = (x1, y1, x2, y2, cls) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
const text = (x, y, t, cls = 't', extra = '') => `<text x="${x}" y="${y}" class="${cls}" ${extra}>${esc(t)}</text>`;

/** Cadena de cotas horizontal (valores en metros, ya en coordenadas del dibujo). */
function cadenaH(valores, y, Y, sentido = -1) {
  const v = [...new Set(valores.map((x) => Math.round(x * 1000)))].sort((a, b) => a - b);
  let out = line(v[0], y, v[v.length - 1], y, 'cota');
  for (const x of v) out += line(x, y - 40, x, y + 40, 'cota') + line(x, y, x, Y, 'guia');
  for (let i = 0; i < v.length - 1; i++) {
    const w = v[i + 1] - v[i];
    if (w < 1) continue;
    // Tramos angostos: se alterna la altura del texto para que no se encimen.
    const escalon = w < 120 && i % 2 ? 60 : 0;
    const yl = sentido < 0 ? y - 30 - escalon : y + 75 + escalon;
    out += text((v[i] + v[i + 1]) / 2, yl, cm(w / 1000), 'tc');
  }
  return out;
}

/** Cadena de cotas vertical (alturas en metros desde el piso). */
function cadenaV(valores, x, h, X) {
  const v = [...new Set(valores.map((y) => Math.round(y * 1000)))].sort((a, b) => a - b);
  let out = line(x, h - v[0], x, h - v[v.length - 1], 'cota');
  for (const y of v) out += line(x - 40, h - y, x + 40, h - y, 'cota') + line(x, h - y, X, h - y, 'guia');
  for (let i = 0; i < v.length - 1; i++) {
    const d = v[i + 1] - v[i];
    const ym = h - (v[i] + v[i + 1]) / 2;
    out += text(x - 30, ym + 14, cm(d / 1000), 'tc tv', `transform="rotate(-90 ${x - 30} ${ym})"`);
  }
  for (const y of v) out += text(x + 60, h - y + 14, cm(y / 1000), 'tn');
  return out;
}

// ── Alzados por pared
const PILARES = {
  pared2: [
    [D.mesas.izquierda.largoPared2 - D.mesas.retiroPilar - D.mesas.espesorPilar, D.mesas.izquierda.largoPared2 - D.mesas.retiroPilar],
    [A - D.mesas.derecha.largoPared2 + D.mesas.retiroPilar, A - D.mesas.derecha.largoPared2 + D.mesas.retiroPilar + D.mesas.espesorPilar],
  ],
  pared3: [[D.mesas.izquierda.largoPared3 - D.mesas.retiroPilar - D.mesas.espesorPilar, D.mesas.izquierda.largoPared3 - D.mesas.retiroPilar]],
  pared1: [[D.mesas.derecha.largoPared1 - D.mesas.retiroPilar - D.mesas.espesorPilar, D.mesas.derecha.largoPared1 - D.mesas.retiroPilar]],
};

const PAREDES = {
  pared2: {
    titulo: 'Pared 2 · estufa',
    largo: A,
    s: (u) => u,
    lados: ['Pared 3', 'Pared 1'],
    mesas: [
      [0, D.mesas.izquierda.largoPared2],
      [A - D.mesas.derecha.largoPared2, A],
    ],
    alturas: [
      0,
      D.mesas.zocalo.alto,
      D.mesas.alto - D.mesas.espesorLosa - REPOSTEROS.bajos.holguraLosa,
      D.mesas.alto,
      ...new Set(modulos.filter((m) => m.pared === 'pared2' && m.tipo === 'alto').map((m) => m.y0)),
      REPOSTEROS.altos.y1,
      H,
    ].sort((a, b) => a - b),
  },
  pared3: {
    titulo: 'Pared 3 · vista desde la cocina',
    largo: F,
    s: (u) => F - u,
    lados: ['Pared 4', 'Pared 2'],
    mesas: [[0, D.mesas.izquierda.largoPared3]],
    alturas: [0, D.mesas.zocalo.alto, D.mesas.alto - D.mesas.espesorLosa - REPOSTEROS.bajos.holguraLosa, D.mesas.alto, REPOSTEROS.altos.y0, D.pared3.altoMuro, REPOSTEROS.altos.y1, H],
  },
  pared1: {
    titulo: 'Pared 1 · ventana',
    largo: F,
    s: (u) => u,
    lados: ['Pared 2', 'Pared 4'],
    mesas: [[0, D.mesas.derecha.largoPared1]],
    alturas: [0, D.mesas.zocalo.alto, D.mesas.alto - D.mesas.espesorLosa - REPOSTEROS.bajos.holguraLosa, D.mesas.alto, der.ventana.y0, H],
  },
};

function estructuraPared(id, P, h) {
  const sx = (u) => P.s(u) * S;
  const span = (u0, u1) => [Math.min(sx(u0), sx(u1)), Math.abs(sx(u1) - sx(u0))];
  let out = '';
  if (id === 'pared3') {
    const t = der.pared3;
    out += rect(0, 0, F * S, h, 'vacio');
    out += text((F * S) / 2, (H - D.pared3.altoMuro) * S * 0.5 + 20, 'espacio vacío sobre el muro', 'tnota');
    let [x, w] = span(t.z0Alto, t.z1Alto);
    out += rect(x, h - D.pared3.altoMuro * S, w, D.pared3.altoMuro * S, 'muro');
    [x, w] = span(t.z1Alto, t.z1Bajo);
    out += rect(x, h - D.pared3.tramoBajo.alto * S, w, D.pared3.tramoBajo.alto * S, 'muro');
    [x, w] = span(0, t.z0Alto);
    out += rect(x, 0, w, h, 'columna');
    [x, w] = span(t.z1Bajo, F);
    out += rect(x, 0, w, h, 'columna');
    const r = der.refri;
    [x, w] = span(r.z0, r.z1);
    out += rect(x, h - D.refrigeradora.alto * S, w, D.refrigeradora.alto * S, 'equipo-fijo');
    out += text(x + w / 2, h - D.refrigeradora.alto * S * 0.5, 'Refrigeradora', 'tnota');
  } else {
    out += rect(0, 0, P.largo * S, h, 'muro');
  }
  if (id === 'pared2') {
    out += rect(0, 0, D.columnas.pared2Pared3.x * S, h, 'columna');
    const { x0, x1 } = der.huecoCocina;
    const xc = (x0 + x1) / 2 + D.estufa.desplazamientoX;
    const w = D.estufa.ancho * S;
    out += rect(xc * S - w / 2, h - D.estufa.altoTablero * S, w, (D.estufa.altoTablero - D.mesas.zocalo.alto) * S, 'equipo-fijo');
    out += text(xc * S, h - 0.5 * S, 'Estufa', 'tnota');
  }
  if (id === 'pared1') {
    const v = der.ventana;
    out += rect(v.z0 * S, 0, (v.z1 - v.z0) * S, (H - v.y0) * S, 'ventana');
    out += text(((v.z0 + v.z1) / 2) * S, (H - v.y0) * S * 0.5, 'Ventana', 'tnota');
    const l = D.lavadero;
    out += rect((l.centroDesdePared2 - l.largo / 2) * S, h - D.mesas.alto * S, l.largo * S, l.profundidad * S, 'lavadero');
  }
  for (const z of REPOSTEROS.zonasLibres.filter((x) => x.pared === id)) {
    const yb0 = D.mesas.zocalo.alto;
    const yb1 = D.mesas.alto - D.mesas.espesorLosa;
    const [x, w] = span(z.u[0], z.u[1]);
    out += rect(x, h - yb1 * S, w, (yb1 - yb0) * S, 'libre');
    out += text(x + w / 2, h - ((yb0 + yb1) / 2) * S, z.id === 'lavadero' ? 'libre (lavadero)' : 'libre', 'tnota');
  }
  // Mesas: losa, zócalo y pilares.
  const losa = D.mesas.espesorLosa * S;
  const zoc = D.mesas.zocalo.alto * S;
  for (const [u0, u1] of P.mesas) {
    const [x, w] = span(u0, u1);
    out += rect(x, h - D.mesas.alto * S, w, losa, 'losa');
    out += rect(x, h - zoc, w, zoc, 'losa');
  }
  for (const [u0, u1] of PILARES[id] ?? []) {
    const [x, w] = span(u0, u1);
    out += rect(x, h - (D.mesas.alto - D.mesas.espesorLosa) * S, w, (D.mesas.alto - D.mesas.espesorLosa) * S - zoc, 'losa');
  }
  return out;
}

function moduloEnAlzado(m, P, h) {
  const sx = (u) => P.s(u) * S;
  const x0 = Math.min(sx(m.u0), sx(m.u1));
  const w = Math.abs(sx(m.u1) - sx(m.u0));
  const y = h - m.y1 * S;
  const alto = m.alto * S;
  let out = rect(x0, y, w, alto, m.tipo === 'bajo' ? 'mod mod-bajo' : 'mod');
  if (m.tipo === 'relleno') return out;
  const esp = REPOSTEROS.material.espesor * S;
  // Interior de los bajos abiertos: laterales, piso, techo y repisas.
  if (m.tipo === 'bajo') {
    out += rect(x0 + esp, y + esp, w - 2 * esp, alto - 2 * esp, 'mod-int');
    for (const yr of m.repisas) out += rect(x0 + esp, h - (yr + REPOSTEROS.material.espesor) * S, w - 2 * esp, esp, 'repisa');
  } else {
    for (const yr of m.repisas) out += line(x0 + esp, h - yr * S, x0 + w - esp, h - yr * S, 'repisa-oculta');
  }
  const hojas = [...m.puertas.map((p) => ({ ...p, tipo: 'puerta' })), ...(m.tapaFija ? [{ ...m.tapaFija, tipo: 'tapa' }] : [])];
  for (const p of hojas) {
    const a = Math.min(sx(p.u0), sx(p.u1));
    const b = Math.max(sx(p.u0), sx(p.u1));
    const yt = h - (p.y1 ?? m.y1 - 0.0015) * S;
    const yb = h - (p.y0 ?? m.y0 + 0.0015) * S;
    out += rect(a, yt, b - a, yb - yt, p.tipo === 'tapa' ? 'tapa' : 'puerta');
    if (p.tipo === 'tapa') {
      out += text((a + b) / 2, (yt + yb) / 2, 'tapa fija', 'tnota');
      continue;
    }
    // Símbolo de apertura: el vértice indica el lado de la bisagra.
    const bisagraEnA = (p.bisagra === 'inicio') === (sx(m.u0) <= sx(m.u1));
    const xv = bisagraEnA ? a : b;
    const xo = bisagraEnA ? b : a;
    out += `<polyline points="${xo},${yt} ${xv},${(yt + yb) / 2} ${xo},${yb}" class="apertura"/>`;
    const xt = bisagraEnA ? b - 40 : a + 40;
    const lt = REPOSTEROS.tirador.largo * S;
    const ya = tiradorAbajo(p, D) ? yb - 40 : yt + 40 + lt;
    out += line(xt, ya, xt, ya - lt, 'tirador');
  }
  const cx = x0 + w / 2;
  // En las columnas el código va en el tramo alto, lejos de la división de puertas.
  const cy = m.tipo === 'bajo' ? y + 110 : m.hastaMesa ? h - ((REPOSTEROS.altos.y0 + m.y1) / 2) * S : y + alto / 2;
  out += `<circle cx="${cx}" cy="${cy}" r="62" class="id-bg"/>` + text(cx, cy + 22, m.id, 'tid');
  return out;
}

const instalacionNueva = (eq) => eq.tipo === 'canaleta' || eq.nueva === true;

function equiposEnAlzado(id, P, h) {
  let out = '';
  for (const eq of REPOSTEROS.equipos) {
    let u0;
    let u1;
    if (eq.pared === id) [u0, u1] = eq.u;
    else if (eq.cilindro && id === 'pared1') [u0, u1] = [eq.cilindro.z - eq.cilindro.radio, eq.cilindro.z + eq.cilindro.radio];
    else continue;
    const a = Math.min(P.s(u0), P.s(u1)) * S;
    const b = Math.min(Math.max(P.s(u0), P.s(u1)), P.largo) * S;
    out += rect(a, h - eq.y[1] * S, b - a, (eq.y[1] - eq.y[0]) * S, instalacionNueva(eq) ? 'canaleta' : 'equipo');
    const ty = eq.y[1] - eq.y[0] >= 0.15 ? h - ((eq.y[0] + eq.y[1]) / 2) * S + 18 : h - eq.y[1] * S - 30;
    if (!instalacionNueva(eq)) out += text((a + b) / 2, ty, eq.nombre, 'tequipo');
    if (eq.rotulo) {
      const yr = h - (REPOSTEROS.altos.y0 + (eq.tipo === 'canaleta' ? 0.24 : 0.08)) * S;
      out += line((a + b) / 2, h - eq.y[1] * S, (a + b) / 2, yr, 'llamada') + text((a + b) / 2, yr - 10, eq.rotulo, 'trotulo');
    }
  }
  return out;
}

function alzado(id) {
  const P = PAREDES[id];
  const w = P.largo * S;
  const h = H * S;
  let c = estructuraPared(id, P, h);
  const mods = modulos.filter((m) => m.pared === id);
  for (const m of mods) c += moduloEnAlzado(m, P, h);
  c += equiposEnAlzado(id, P, h);
  for (const a of apoyos.filter((x) => x.pared === id)) {
    const x0 = Math.min(P.s(a.u0), P.s(a.u1)) * S;
    const wa = Math.abs(P.s(a.u1) - P.s(a.u0)) * S;
    c += rect(x0, h - a.y1 * S, wa, a.alto * S, a.tipo === 'tubo' ? 'apoyo apoyo-tubo' : 'apoyo');
    c += text(x0 + wa / 2, h - ((a.y0 + a.y1) / 2) * S + 20, a.id, 'tapoyo', 'text-anchor="end" dx="-40"');
  }
  c += rect(0, 0, w, h, 'marco');

  const altos = mods.filter((m) => m.tipo !== 'bajo');
  const bajos = mods.filter((m) => m.tipo === 'bajo');
  if (altos.length) c += cadenaH([0, P.largo, ...altos.flatMap((m) => [P.s(m.u0), P.s(m.u1)])].map((v) => v), -170, 0);
  if (id === 'pared1') c += cadenaH([0, P.largo, der.ventana.z0, der.ventana.z1], -170, 0);
  if (bajos.length) c += cadenaH([0, P.largo, ...bajos.flatMap((m) => [P.s(m.u0), P.s(m.u1)])], h + 150, h, 1);
  c += cadenaV(P.alturas, -200, h, 0);
  c += text(0, -330, `← ${P.lados[0]}`, 'tlado', 'text-anchor="start"');
  c += text(w, -330, `${P.lados[1]} →`, 'tlado', 'text-anchor="end"');
  return `<figure class="lamina"><figcaption>${esc(P.titulo)}</figcaption>${svg(w, h, c)}</figure>`;
}

// ── Planta
function planta() {
  const t = D.ambiente.espesorMuro * S;
  const zs = (F + der.pared4.espesor) * S;
  let c = rect(-t, -t, A * S + 2 * t, zs + t, 'muro');
  c += rect(0, 0, A * S, F * S, 'piso');
  c += rect(der.pared4.largoMuro * S, F * S - 2, D.pared4.entrada.ancho * S, der.pared4.espesor * S + 4, 'piso');
  const col = D.columnas.pared2Pared3;
  c += rect(-t, -t, col.x * S + t, col.z * S + t, 'columna');
  c += rect(-t, der.pared3.z1Bajo * S, D.columnas.pared3Pared4.x * S + t, zs - der.pared3.z1Bajo * S, 'columna');
  // Mesas (contorno en L)
  const f = D.mesas.fondo * S;
  const L = D.mesas.izquierda;
  const R = D.mesas.derecha;
  c += `<path d="M${col.x * S},0 H${L.largoPared2 * S} V${f} H${f} V${L.largoPared3 * S} H0 V${col.z * S} H${col.x * S} Z" class="losa-planta"/>`;
  c += `<path d="M${A * S},0 H${(A - R.largoPared2) * S} V${f} H${(A - D.mesas.fondo) * S} V${R.largoPared1 * S} H${A * S} Z" class="losa-planta"/>`;
  const l = D.lavadero;
  c += rect((A - D.mesas.fondo / 2 - l.ancho / 2) * S, (l.centroDesdePared2 - l.largo / 2) * S, l.ancho * S, l.largo * S, 'lavadero');
  const { x0, x1 } = der.huecoCocina;
  const xc = ((x0 + x1) / 2 + D.estufa.desplazamientoX) * S;
  c += rect(xc - (D.estufa.ancho * S) / 2, D.estufa.separacionPared * S, D.estufa.ancho * S, D.estufa.fondo * S, 'equipo-fijo');
  c += text(xc, (D.estufa.fondo * S) / 2 + 20, 'Estufa', 'tnota');
  const r = der.refri;
  c += rect(r.x0 * S, r.z0 * S, (r.x1 - r.x0) * S, (r.z1 - r.z0) * S, 'equipo-fijo');
  c += text(((r.x0 + r.x1) / 2) * S, ((r.z0 + r.z1) / 2) * S, 'Refri', 'tnota');

  const caja = (pared, u0, u1, d0, d1) => {
    if (pared === 'pared2') return [u0, d0, u1 - u0, d1 - d0];
    if (pared === 'pared3') return [d0, u0, d1 - d0, u1 - u0];
    if (pared === 'pared4') return [u0, F - d1, u1 - u0, d1 - d0];
    return [A - d1, u0, d1 - d0, u1 - u0];
  };
  const punto = (pared, u, dd) => (pared === 'pared2' ? [u, dd] : pared === 'pared3' ? [dd, u] : [A - dd, u]);
  const contorno = (m, cls) => {
    const [x, z, w, hh] = caja(m.pared, m.u0, m.u1, m.d0, m.frente ?? m.d1);
    return rect(x * S, z * S, w * S, hh * S, cls);
  };
  for (const m of modulos.filter((x) => x.tipo === 'bajo')) c += contorno(m, 'mod mod-bajo');
  let altos = '';
  let codigos = '';
  for (const m of modulos.filter((x) => x.tipo !== 'bajo')) altos += contorno(m, 'mod-alto-planta');
  for (const m of modulos.filter((x) => x.tipo !== 'relleno')) {
    // Altos y bajos se superponen en planta: los códigos de los altos van junto a la pared.
    const dl = m.tipo === 'bajo' ? m.d0 + 0.38 : 0.1;
    const [px, pz] = punto(m.pared, (m.u0 + m.u1) / 2, dl);
    codigos += `<circle cx="${px * S}" cy="${pz * S}" r="58" class="${m.tipo === 'bajo' ? 'id-bg' : 'id-bg id-alto'}"/>` + text(px * S, pz * S + 20, m.id, 'tid');
  }
  for (const eq of REPOSTEROS.equipos) {
    if (eq.cilindro) {
      c += `<circle cx="${eq.cilindro.x * S}" cy="${eq.cilindro.z * S}" r="${eq.cilindro.radio * S}" class="equipo"/>`;
      c += text(eq.cilindro.x * S - 260, eq.cilindro.z * S + 20, 'Bidón', 'tequipo');
      continue;
    }
    const [x, z, w, hh] = caja(eq.pared, eq.u[0], eq.u[1], eq.d[0], eq.d[1]);
    c += rect(x * S, z * S, w * S, hh * S, instalacionNueva(eq) ? 'canaleta' : 'equipo');
    if (!instalacionNueva(eq)) c += text((x + w / 2) * S, (z + hh / 2) * S + 18, eq.nombre.split(' ')[0], 'tequipo');
  }
  for (const a of apoyos) {
    const [x, z, w, hh] = caja(a.pared, a.u0, a.u1, a.d0, a.d1);
    altos += rect(x * S, z * S, w * S, hh * S, a.tipo === 'tubo' ? 'apoyo apoyo-tubo' : 'apoyo');
  }
  c += altos + codigos;
  c += text((A * S) / 2, -t - 60, 'Pared 2', 'tlado');
  c += text((A * S) / 2, zs + 140, 'Pared 4 · entrada', 'tlado');
  c += text(-t - 60, (F * S) / 2, 'Pared 3', 'tlado', `transform="rotate(-90 ${-t - 60} ${(F * S) / 2})"`);
  c += text(A * S + t + 60, (F * S) / 2, 'Pared 1', 'tlado', `transform="rotate(90 ${A * S + t + 60} ${(F * S) / 2})"`);
  return `<figure class="lamina lamina--planta"><figcaption>Planta · bajos (gris, código negro), altos (contorno discontinuo, código azul) y equipos (azul)</figcaption>${svg(
    A * S,
    zs,
    c,
    { margen: [260, 260, 260, 260] },
  )}</figure>`;
}

// ── Tablas
function tablaModulos() {
  const ordenPared = { pared2: 0, pared3: 1, pared1: 2 };
  const filas = modulos
    .filter((m) => m.tipo !== 'relleno')
    .sort((a, b) => (a.tipo === 'bajo') - (b.tipo === 'bajo') || ordenPared[a.pared] - ordenPared[b.pared] || a.u0 - b.u0)
    .map((m) => {
      const puertas = !m.puertas.length
        ? '—'
        : m.tramosPuertas
          ? m.puertas.map((p) => `${cm(p.u1 - p.u0)} × ${cm(p.y1 - p.y0)} (${tiradorAbajo(p, D) ? 'arriba' : 'abajo'})`).join(' + ')
          : m.puertas.map((p) => cm(p.u1 - p.u0)).join(' + ');
      const libres = (() => {
        const ys = [m.y0 + REPOSTEROS.material.espesor, ...m.repisas.flatMap((y) => [y, y + REPOSTEROS.material.espesor]), m.y1 - REPOSTEROS.material.espesor];
        const out = [];
        for (let i = 0; i < ys.length; i += 2) out.push(cm(ys[i + 1] - ys[i]));
        return out.join(' / ');
      })();
      const pared = { pared1: 'Pared 1', pared2: 'Pared 2', pared3: 'Pared 3' }[m.pared];
      return `<tr><td><b>${m.id}</b></td><td>${m.hastaMesa ? 'Columna hasta la mesa' : m.tipo === 'alto' ? 'Alto' : 'Bajo abierto'}</td><td>${pared}</td>
        <td class="n">${cm(m.ancho)}</td><td class="n">${cm(m.alto)}</td><td class="n">${cm(m.fondo + (m.puertas.length || m.tapaFija ? REPOSTEROS.material.espesor : 0))}</td>
        <td class="n">${cm(m.y0)}</td><td class="n">${m.repisas.length}</td><td>${libres}</td><td>${puertas}${m.tapaFija ? ' + tapa fija ' + cm(m.tapaFija.u1 - m.tapaFija.u0) : ''}</td>
        <td>${m.espalda === 'melamina' ? 'Melamina 18 mm (vista)' : 'MDF 3 mm'}</td><td>${esc(m.contenido)}</td></tr>`;
    })
    .join('');
  const rellenos = modulos
    .filter((m) => m.tipo === 'relleno')
    .map((m) => `<li><b>${m.id}</b>: ${cm(m.ancho)} × ${cm(m.alto)} cm — ${esc(m.contenido)}</li>`)
    .join('');
  const listaApoyos = apoyos
    .map((a) => `<li><b>${a.id}</b>: ${cm(a.ancho)} × ${cm(a.fondo)} × ${cm(a.alto)} cm de alto, a ${cm(a.d0)}–${cm(a.d1)} cm de la pared — ${esc(a.contenido)}</li>`)
    .join('');
  return `<table><thead><tr><th>Módulo</th><th>Tipo</th><th>Pared</th><th>Ancho</th><th>Alto</th><th>Fondo</th><th>Desde el piso</th><th>Repisas</th><th>Alturas libres (abajo → arriba)</th><th>Puertas (ancho)</th><th>Espalda</th><th>Uso previsto</th></tr></thead><tbody>${filas}</tbody></table>
  <p class="nota">Medidas en centímetros. El fondo incluye la puerta. Rellenos:</p><ul class="nota">${rellenos}</ul>
  ${listaApoyos ? `<p class="nota">Apoyos sobre la mesa (de la mesa a la base de los altos):</p><ul class="nota">${listaApoyos}</ul>` : ''}`;
}

function cantoTxt(p) {
  const lados = (m) => {
    if (m >= 2 * (p.largo + p.ancho) - 1e-6) return '4 lados';
    return m >= 2 * p.largo - 1e-6 ? '2 lados largos' : '1 lado largo';
  };
  const out = [];
  if (p.delgado) out.push(`delgado ${lados(p.delgado)}`);
  if (p.grueso) out.push(`grueso ${lados(p.grueso)}`);
  return out.join(', ') || '—';
}

function tablaCortes(planchas) {
  const producto = productoDePieza(planchas);
  const grupos = {};
  for (const p of datos.piezas) {
    const prods = producto(p);
    const k = prods.length ? prods.map((x) => NOMBRE_PRODUCTO[x]).join(' / ') : '—';
    (grupos[k] ??= []).push(p);
  }
  return Object.entries(grupos)
    .map(([nombre, lista]) => {
      const filas = lista
        .map(
          (p) =>
            `<tr><td>${p.modulo}</td><td>${p.nombre}</td><td class="n">${p.cant}</td><td class="n">${mmTxt(Math.max(p.largo, p.ancho))}</td><td class="n">${mmTxt(Math.min(p.largo, p.ancho))}</td><td>${cantoTxt(p)}</td></tr>`,
        )
        .join('');
      const n = lista.reduce((s, p) => s + p.cant, 0);
      return `<h3>${esc(nombre)} <small>(${n} piezas)</small></h3><table class="cortes"><thead><tr><th>Módulo</th><th>Pieza</th><th>Cant.</th><th>Largo (mm)</th><th>Ancho (mm)</th><th>Canto</th></tr></thead><tbody>${filas}</tbody></table>`;
    })
    .join('');
}

function laminasPlanchas(planchas) {
  return Object.entries(planchas)
    .map(([producto, r]) => {
      const pl = producto === 'mdf3' ? REPOSTEROS.material.planchaFondo : REPOSTEROS.material.plancha;
      const W = pl.largo * S;
      const Hh = pl.ancho * S;
      const off = r.refilado * S;
      const hojas = r.planchas
        .map((s, i) => {
          let c = rect(0, 0, W, Hh, 'plancha');
          for (const p of s.piezas) {
            const x = off + p.x * S;
            const y = off + p.y * S;
            const w = p.w * S;
            const h = p.h * S;
            c += rect(x, y, w, h, `pieza ${p.material === 'mdf3' ? 'pieza-mdf' : ''}`);
            const fs = Math.min(70, Math.max(28, Math.min(w, h) / 4));
            c += text(x + w / 2, y + h / 2 - fs * 0.2, `${p.modulo} ${p.nombre}`, 'tpieza', `style="font-size:${fs}px"`);
            c += text(x + w / 2, y + h / 2 + fs * 0.95, `${mmTxt(p.w)} × ${mmTxt(p.h)}`, 'tpieza', `style="font-size:${fs * 0.85}px"`);
          }
          return `<figure class="hoja"><figcaption>${NOMBRE_PRODUCTO[producto]} · plancha ${i + 1} de ${r.planchas.length} · aprovechamiento ${Math.round(s.aprovechamiento * 100)} %</figcaption>${svg(W, Hh, c, { margen: [40, 40, 40, 40] })}</figure>`;
        })
        .join('');
      return hojas;
    })
    .join('');
}

function tablaHerrajes() {
  return `<table><thead><tr><th>Herraje</th><th>Cant.</th><th>Nota</th></tr></thead><tbody>${datos.herrajes
    .map((h) => `<tr><td>${esc(PRECIOS.items[h.id].nombre)}</td><td class="n">${h.cant}</td><td>${esc(h.nota)}</td></tr>`)
    .join('')}</tbody></table>
    <p class="nota">Cantos: ${Math.ceil(datos.cantoDelgado)} m de canto delgado y ${Math.ceil(datos.cantoGrueso)} m de canto grueso (sin merma).</p>`;
}

const ESTADO_TXT = { consultado: 'precio consultado', referencial: 'referencial', estimado: 'estimado' };

function tablaPresupuesto(b) {
  const filas = b.lineas
    .map(
      (l) => `<tr><td>${esc(l.nombre)}${l.nota ? `<div class="sub">${esc(l.nota)}</div>` : ''}</td>
      <td class="n">${l.cant}</td><td>${esc(l.unidad)}</td>
      <td class="n"><input type="number" min="0" step="0.1" value="${precios.items[l.id].precio}" data-precio="${l.id}" aria-label="Precio unitario de ${esc(l.nombre)}"></td>
      <td class="n">${soles(l.total)}</td><td><span class="estado estado--${l.estado}">${ESTADO_TXT[l.estado]}</span></td></tr>`,
    )
    .join('');
  return `<table class="presupuesto"><thead><tr><th>Concepto</th><th>Cant.</th><th>Unidad</th><th>Precio unit. (S/)</th><th>Total</th><th>Fuente</th></tr></thead>
    <tbody>${filas}</tbody>
    <tfoot>
      <tr><td colspan="4">Materiales, servicios y herrajes</td><td class="n">${soles(b.materiales)}</td><td></td></tr>
      ${b.manoObra ? `<tr><td colspan="4">Mano de obra (estimada)</td><td class="n">${soles(b.manoObra)}</td><td></td></tr>` : ''}
      <tr class="total"><td colspan="4">Total aproximado</td><td class="n">${soles(b.total)}</td><td></td></tr>
    </tfoot></table>
    <p class="nota">Cuando la cantidad alcanza el mínimo, se aplica el precio por volumen de la tienda (melamina desde 3 planchas). Precios consultados el ${PRECIOS.fecha}: confírmalos antes de comprar.</p>`;
}

// ── Render
function render() {
  const b = presupuesto(datos, precios, precios.opciones);
  const nPlanchas = Object.entries(b.planchas)
    .map(([k, r]) => `${r.planchas.length} × ${NOMBRE_PRODUCTO[k]}`)
    .join(' · ');
  const puertas = modulos.reduce((n, m) => n + m.puertas.length, 0);

  document.getElementById('resumen').innerHTML = `
    <div class="card"><b>${modulos.filter((m) => m.tipo === 'alto').length}</b><span>módulos altos</span></div>
    <div class="card"><b>${modulos.filter((m) => m.tipo === 'bajo').length}</b><span>módulos bajos abiertos</span></div>
    <div class="card"><b>${puertas}</b><span>puertas</span></div>
    <div class="card"><b>${datos.piezas.reduce((s, p) => s + p.cant, 0)}</b><span>piezas</span></div>
    <div class="card wide"><b>${soles(b.total)}</b><span>total aproximado${b.manoObra ? ' con mano de obra' : ''}</span></div>
    <p class="nota planchas-resumen">${nPlanchas}</p>`;

  document.getElementById('cortes').innerHTML = tablaCortes(b.planchas);
  document.getElementById('planchas').innerHTML = laminasPlanchas(b.planchas);
  document.getElementById('presupuesto').innerHTML = tablaPresupuesto(b);
  for (const inp of document.querySelectorAll('[data-precio]'))
    inp.addEventListener('change', () => {
      precios.items[inp.dataset.precio].precio = Math.max(0, Number(inp.value) || 0);
      guardarPrecios();
      render();
    });
}

function init() {
  const ver = VERSIONES[VERSION];
  document.title = `Cocina · reposteros ${ver.nombre.toLowerCase()} · planos, cortes y presupuesto`;
  document.getElementById('version-nombre').textContent = ver.nombre;
  document.getElementById('version-desc').textContent = ver.descripcion;
  document.getElementById('volver').href = `index.html?v=${VERSION}`;
  for (const b of document.querySelectorAll('.versiones [data-version]')) {
    const v = Number(b.dataset.version);
    b.classList.toggle('active', v === VERSION);
    b.addEventListener('click', () => v !== VERSION && cambiarVersion(v));
  }
  document.getElementById('anclaje-cm').textContent = Math.round((D.pared3.altoMuro - REPOSTEROS.altos.y0) * 100);
  for (const el of document.querySelectorAll('#anclaje-desde, .anclaje-desde')) el.textContent = REPOSTEROS.altos.y0.toFixed(2);
  for (const el of document.querySelectorAll('.platina-cm')) el.textContent = largoPlatina();
  const verdulero = REPOSTEROS.equipos.find((q) => q.id === 'verdulero');
  for (const el of document.querySelectorAll('.verdulero-x')) el.textContent = verdulero ? verdulero.u[0].toFixed(2) : '';
  for (const li of document.querySelectorAll('[data-modulo]'))
    li.hidden = !modulos.some((m) => m.id === li.dataset.modulo);
  for (const li of document.querySelectorAll('.notas [data-version]'))
    li.hidden = !li.dataset.version.split(' ').map(Number).includes(VERSION);

  const avisos = validarReposteros();
  const av = document.getElementById('avisos');
  av.hidden = avisos.length === 0;
  av.innerHTML = avisos.map((a) => `⚠ ${esc(a)}`).join('<br>');

  document.getElementById('alzados').innerHTML = ['pared2', 'pared3', 'pared1'].map(alzado).join('');
  document.getElementById('planta').innerHTML = planta();
  document.getElementById('modulos').innerHTML = tablaModulos();
  document.getElementById('herrajes').innerHTML = tablaHerrajes();

  for (const [id, key] of [
    ['opt-rh', 'bajosRH'],
    ['opt-mo', 'manoObra'],
  ]) {
    const el = document.getElementById(id);
    el.checked = Boolean(precios.opciones[key]);
    el.addEventListener('change', () => {
      precios.opciones[key] = el.checked;
      guardarPrecios();
      render();
    });
  }
  document.getElementById('restablecer').addEventListener('click', () => {
    localStorage.removeItem(CLAVE);
    location.reload();
  });
  document.getElementById('imprimir').addEventListener('click', () => window.print());
  render();
  window.__reposteros = { modulos, datos, precios, ready: true };
}

init();

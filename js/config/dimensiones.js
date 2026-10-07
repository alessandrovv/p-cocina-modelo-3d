/**
 * Dimensiones de la cocina actual, en METROS.
 *
 * Sistema de coordenadas del modelo:
 *   origen = esquina interior Pared 2 / Pared 3, a nivel del piso terminado.
 *   +X → hacia la Pared 1 (ventana)
 *   +Z → hacia la Pared 4 (entrada)
 *   +Y → hacia arriba
 *
 * Orientación (igual que el dibujo de vista superior):
 *   Pared 2 = arriba / norte (z = 0)      Pared 4 = abajo / sur (z = fondo)
 *   Pared 3 = izquierda / oeste (x = 0)   Pared 1 = derecha / este (x = ancho)
 *
 * Estado de cada medida:
 *   [C] confirmada → cota explícita en los dibujos de cocina/images/ o medida dada por el usuario
 *   [I] inferida   → deducida de cotas explícitas o coherente entre dibujo y fotos
 *   [E] estimada   → tomada de fotografías o de tamaños estándar; PENDIENTE DE CONFIRMAR
 *
 * Para corregir una medida basta con cambiar el número aquí; el modelo se
 * reconstruye a partir de estos valores.
 */
export const DIM = {
  ambiente: {
    ancho: 3.0, // [C] Paredes 2 y 4 (eje X)
    // [I] Los dibujos indican 3 m, pero las medidas del usuario suman 2.92 m por dos vías:
    //     mesa 1.95 + 0.08 + refrigeradora 0.69 + 0.20 = 2.92
    //     columna 0.11 + muro alto 1.90 + tramo bajo 0.80 + columna 0.11 = 2.92
    // Se aplica también a la Pared 1 (paralela).
    fondo: 2.92, // Paredes 1 y 3 (eje Z)
    alto: 2.5, // [C] piso → techo (vistas frontales)
    espesorMuro: 0.15, // [E] no acotado; ladrillo tarrajeado típico (la Pared 4 usa el valor deducido)
    espesorTecho: 0.12, // [E]
  },

  pared1: {
    ventana: {
      ancho: 1.4, // [C]
      alto: 1.25, // [C]
      distanciaPared2: 0.65, // [C] usuario: Pared 2 → borde de la ventana
      // [C] borde de la ventana → extremo de la Pared 1 en la entrada, incluida la columna
      //     de la esquina Pared 1/4. Fija el espesor de la línea de la Pared 4 (ver derivadas).
      distanciaFinPared1: 1.0,
      distanciaTecho: 0.0, // [C] el dibujo la muestra al ras del techo
      profundidadMarco: 0.1, // [E] marco hacia el exterior del muro
      perfil: 0.04, // [E] sección del marco metálico
      travesanoDesdeArriba: 0.4, // [E] posición del travesaño (foto Pared 1)
      separacionRejas: 0.127, // [E] ~11 paños de reja en la foto
      nivelesRejaInferior: 2, // [E] barras horizontales en el paño inferior
    },
  },

  pared3: {
    altoMuro: 1.85, // [C] sobre esta altura hay espacio vacío
    largoTramoAlto: 1.9, // [C] usuario: desde la columna de la esquina Pared 2/3
    tramoBajo: {
      largo: 0.8, // [C] a continuación del tramo alto, hacia la Pared 4
      alto: 0.95, // [C]
    },
  },

  pared4: {
    altoMuro: 1.66, // [C] sobre esta altura hay espacio vacío
    entrada: {
      ancho: 1.2, // [C] vano junto a la Pared 1, abierto hasta el techo
    },
  },

  mesas: {
    alto: 0.9, // [C] nivel superior de la cerámica
    fondo: 0.6, // [C]
    espesorLosa: 0.1, // [E] losa + cerámica (fotos)
    espesorPilar: 0.1, // [E] pilares de apoyo en extremos libres
    retiroPilar: 0.02, // [E] retiro del pilar respecto al canto de la losa
    zocalo: {
      alto: 0.07, // [E] base elevada enchapada bajo las mesas (fotos 1 y 2)
      enHuecoCocina: true, // [I] la base parece continuar bajo la estufa (foto 2)
    },
    izquierda: {
      largoPared2: 0.95, // [C] desde la Pared 3
      largoPared3: 1.95, // [C] desde la Pared 2
    },
    derecha: {
      largoPared2: 1.2, // [C] desde la Pared 1
      largoPared1: 2.7, // [C] desde la Pared 2
    },
  },

  lavadero: {
    // Poza doble de acero empotrada en la mesa de la Pared 1, bajo la ventana.
    centroDesdePared2: 1.1, // [E] foto Pared 1
    largo: 0.85, // [E] a lo largo de la Pared 1
    ancho: 0.45, // [E] en el sentido del fondo de la mesa
    profundidad: 0.18, // [E]
    separacionPozas: 0.05, // [E]
    proporcionPozaPared2: 0.5, // [E] fracción del largo útil ocupada por la poza más cercana a la Pared 2
    griferia: {
      altura: 1.05, // [E] salida de pared (foto)
      posiciones: [0.9, 1.32], // [E] distancia desde la Pared 2
    },
  },

  estufa: {
    ancho: 0.6, // [C] confirmado por el usuario
    fondo: 0.6, // [C] confirmado por el usuario
    altoTablero: 0.9, // [I] tablero al nivel de las mesas (foto Pared 2)
    separacionPared: 0.02, // [E]
    // Centrada en el hueco entre mesas [I]; usar desplazamiento para corregir.
    desplazamientoX: 0.0, // [E]
    tapa: {
      levantada: true, // [I] marco de tapa de vidrio levantada (foto Pared 2)
      alto: 0.5, // [E]
    },
  },

  refrigeradora: {
    ancho: 0.69, // [C] confirmado por el usuario (dirección Z, a lo largo de la Pared 3)
    fondo: 0.65, // [C] confirmado por el usuario (dirección X)
    alto: 1.7, // [C] confirmado por el usuario
    holguraPared3: 0.03, // [C] confirmado por el usuario
    holguraPared4: 0.2, // [C] usuario: lado de la refrigeradora → Pared 4 (queda a 0.08 m de la mesa)
    altoPuertaCongelador: 0.6, // [E] congelador superior
    altoZocalo: 0.06, // [E]
  },

  acabados: {
    ceramicaParedAlto: 1.5, // [E] altura del enchape blanco de pared
    cenefa: { base: 1.4, alto: 0.06 }, // [E] franja decorativa con frutas
    pared1RosadoDesde: 2.7, // [I] la cerámica termina con la mesa; después pintura rosada
    pared4TarrajeoAlto: 0.92, // [E] parte baja amarilla; arriba ladrillo visto
  },

  columnas: {
    // Columnas de las esquinas de la Pared 3; sobresalen hacia el interior.
    // x = cuánto sobresale desde la Pared 3; z = desde la Pared 2 o la Pared 4.
    pared2Pared3: {
      x: 0.16, // [C] usuario: ancho visto desde la Pared 2
      z: 0.11, // [C] usuario: ancho visto desde la Pared 3
    },
    pared3Pared4: {
      x: 0.16, // [C] confirmado por el usuario (igual a la columna de la esquina Pared 2/3)
      // z se deduce: fondo − (columna 0.11 + muro alto 1.90 + tramo bajo 0.80) = 0.11 [I]
    },
    ceramicaHasta: 1.5, // [E] la columna de la esquina Pared 2/3 está enchapada hasta la cenefa
  },
};

/** Tramos de la Pared 3 a lo largo de Z, desde la Pared 2. */
function pared3Tramos(d) {
  const c = d.columnas.pared2Pared3;
  const z0Alto = c.z;
  const z1Alto = z0Alto + d.pared3.largoTramoAlto; // 2.01
  const z1Bajo = z1Alto + d.pared3.tramoBajo.largo; // 2.81
  return { z0Alto, z1Alto, z1Bajo, largoColumnaPared4: d.ambiente.fondo - z1Bajo }; // [I] 0.11
}

/** Valores derivados de las cotas explícitas (no editar: se calculan). */
export function derivadas(d = DIM) {
  const { ancho, fondo, alto } = d.ambiente;
  const v = d.pared1.ventana;
  const m = d.mesas;
  const huecoX0 = m.izquierda.largoPared2;
  const huecoX1 = ancho - m.derecha.largoPared2;
  const largoPared1 = v.distanciaPared2 + v.ancho + v.distanciaFinPared1; // [I] 3.05 m

  return {
    ventana: {
      z0: v.distanciaPared2,
      z1: v.distanciaPared2 + v.ancho, // [I] 2.05 m (queda a 0.87 m del plano interior de la Pared 4)
      yTop: alto - v.distanciaTecho,
      y0: alto - v.distanciaTecho - v.alto, // [I] alféizar = 1.25 m
    },
    huecoCocina: { x0: huecoX0, x1: huecoX1, ancho: huecoX1 - huecoX0 }, // [I] 0.85 m
    pared3: pared3Tramos(d),
    pared1: { largo: largoPared1 },
    pared4: {
      largoMuro: ancho - d.pared4.entrada.ancho, // [I] 1.80 m
      espesor: largoPared1 - fondo, // [I] 0.13 m: el extremo de la Pared 1 coincide con la cara exterior
    },
    pasillo: ancho - m.fondo * 2, // [I] 1.80 m entre frentes de mesa
    refri: {
      x0: d.refrigeradora.holguraPared3,
      x1: d.refrigeradora.holguraPared3 + d.refrigeradora.fondo,
      z1: fondo - d.refrigeradora.holguraPared4,
      z0: fondo - d.refrigeradora.holguraPared4 - d.refrigeradora.ancho,
    },
  };
}

/** Comprueba incoherencias geométricas tras editar medidas. */
export function validarDimensiones(d = DIM) {
  const avisos = [];
  const der = derivadas(d);
  const { ancho, fondo, alto } = d.ambiente;

  if (der.ventana.z0 < 0) avisos.push('La ventana se sale de la Pared 1 hacia la Pared 2.');
  if (der.pared4.espesor <= 0)
    avisos.push('Pared 2 → ventana + ventana + ventana → fin de Pared 1 no alcanza el fondo del ambiente.');
  if (der.ventana.y0 < d.mesas.alto) avisos.push('El alféizar de la ventana queda por debajo de las mesas.');
  if (der.huecoCocina.ancho < d.estufa.ancho) avisos.push('La estufa no cabe en el hueco entre mesas.');
  if (d.mesas.izquierda.largoPared3 > fondo || d.mesas.derecha.largoPared1 > fondo)
    avisos.push('Una mesa es más larga que la pared que la soporta.');
  if (der.refri.z0 < d.mesas.izquierda.largoPared3)
    avisos.push('La refrigeradora se superpone con la mesa de la Pared 3.');
  if (der.pared3.largoColumnaPared4 < 0)
    avisos.push('Columna 2/3 + muro alto + tramo bajo de la Pared 3 superan el fondo del ambiente.');
  if (d.mesas.izquierda.largoPared3 > der.pared3.z1Alto)
    avisos.push('La mesa de la Pared 3 sobrepasa el tramo alto del muro.');
  if (d.refrigeradora.alto > alto) avisos.push('La refrigeradora es más alta que el techo.');
  if (d.pared4.entrada.ancho > ancho) avisos.push('La entrada es más ancha que la Pared 4.');

  const l = d.lavadero;
  const lz0 = l.centroDesdePared2 - l.largo / 2;
  const lz1 = l.centroDesdePared2 + l.largo / 2;
  if (lz0 < d.mesas.fondo || lz1 > d.mesas.derecha.largoPared1)
    avisos.push('El lavadero se sale del tramo recto de la mesa de la Pared 1.');
  if (l.ancho > d.mesas.fondo - 0.06) avisos.push('El lavadero es demasiado ancho para el fondo de la mesa.');

  return avisos;
}

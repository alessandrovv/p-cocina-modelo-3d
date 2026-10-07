/**
 * Precios de referencia en soles (S/), Lima.
 * estado: 'consultado' → precio publicado por la tienda en la fecha indicada
 *         'referencial' → tomado de una cotización publicada de otro proyecto
 *         'estimado'   → sin fuente directa; confirmar con el proveedor
 * Se pueden editar aquí o directamente en la página de presupuesto.
 */
export const PRECIOS = {
  fecha: '2026-10-06',
  moneda: 'S/',
  items: {
    melamina18: {
      nombre: 'Melamina blanca 18 mm, plancha 2.15 × 2.44 m (Vesto)',
      unidad: 'plancha',
      precio: 157.5,
      volumen: { desde: 3, precio: 152.78 },
      fuente: 'Sodimac Perú',
      estado: 'consultado',
    },
    melamina18rh: {
      nombre: 'Melamina blanca RH (resistente a la humedad) 18 mm, 2.15 × 2.44 m (Vesto)',
      unidad: 'plancha',
      precio: 249.9,
      volumen: { desde: 3, precio: 242.4 },
      fuente: 'Sodimac Perú / Promart',
      estado: 'consultado',
    },
    mdf3: {
      nombre: 'MDF blanco 3 mm, plancha 1.22 × 2.44 m (fondos)',
      unidad: 'plancha',
      precio: 24.9,
      fuente: 'Sodimac Perú',
      estado: 'consultado',
    },
    corte: {
      nombre: 'Servicio de corte',
      unidad: 'm',
      precio: 0.5,
      fuente: 'Cotización de melamina publicada (Scribd)',
      estado: 'referencial',
    },
    cantoDelgado: {
      nombre: 'Canto delgado blanco 0.45 mm (material S/ 0.50 + pegado S/ 0.50)',
      unidad: 'm',
      precio: 1.0,
      fuente: 'Cotización de melamina publicada (Scribd)',
      estado: 'referencial',
    },
    cantoGrueso: {
      nombre: 'Canto grueso blanco 2 mm (material S/ 2.00 + pegado S/ 1.50)',
      unidad: 'm',
      precio: 3.5,
      fuente: 'Cotización de melamina publicada (Scribd)',
      estado: 'referencial',
    },
    bisagra: {
      nombre: 'Bisagra cangrejo 35 mm, paquete × 2',
      unidad: 'paquete',
      precio: 4.9,
      fuente: 'Sodimac Perú (Ducasse)',
      estado: 'consultado',
    },
    tirador: {
      nombre: 'Tirador de aluminio blanco mate 148/128 mm',
      unidad: 'unidad',
      precio: 11.9,
      fuente: 'Sodimac Perú',
      estado: 'consultado',
    },
    colgador: {
      nombre: 'Colgador regulable para mueble alto (par)',
      unidad: 'par',
      precio: 9.9,
      estado: 'estimado',
    },
    riel: {
      nombre: 'Riel metálico de colgar para muebles altos',
      unidad: 'm',
      precio: 12,
      estado: 'estimado',
    },
    pernoUnion: {
      nombre: 'Perno de unión para módulos (tornillo + tuerca, desmontable)',
      unidad: 'unidad',
      precio: 1.5,
      estado: 'estimado',
    },
    tuboApoyo: {
      nombre: 'Tubo de aluminio blanco 1" × 1" × 50 cm con placa superior y tope de goma',
      unidad: 'unidad',
      precio: 35,
      estado: 'estimado',
    },
    escuadra: {
      nombre: 'Platina o ángulo ranurado de 25 cm (amarre de altos de la Pared 3 al techo)',
      unidad: 'unidad',
      precio: 5.0,
      estado: 'estimado',
    },
    regaton: {
      nombre: 'Regatón plástico para la base de los bajos',
      unidad: 'unidad',
      precio: 1.0,
      estado: 'estimado',
    },
    tornilleria: {
      nombre: 'Tornillos, tarugos, clavos para fondos y cola',
      unidad: 'global',
      precio: 40,
      estado: 'estimado',
    },
    movilidad: {
      nombre: 'Movilidad de las piezas cortadas',
      unidad: 'global',
      precio: 40,
      estado: 'estimado',
    },
    manoObra: {
      nombre: 'Mano de obra: armado e instalación',
      unidad: 'global',
      precio: 600,
      estado: 'estimado',
    },
  },
  opciones: {
    bajosRH: true, // los bajos se apoyan sobre el zócalo, expuestos al trapeado y al lavadero
    manoObra: true,
  },
};

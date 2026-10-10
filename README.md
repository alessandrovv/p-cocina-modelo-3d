# Cocina · modelo 3D y reposteros

Modelo 3D interactivo de una cocina real (Lima, Perú) y diseño de los reposteros de melamina que se van a fabricar para ella. El proyecto tiene dos páginas:

- **`index.html` — Modelo 3D.** Reconstrucción de la cocina actual (paredes, ventana, mesas de cerámica, lavadero, estufa y refrigeradora) con los reposteros propuestos encima. Permite recorrer la escena, ver alzados de cada pared, mostrar cotas y quitar puertas para ver el interior.
- **`reposteros.html` — Planos y presupuesto.** Documento de fabricación generado a partir de la misma configuración: planos acotados en SVG, tabla de módulos, lista de cortes, optimización de planchas, herrajes, presupuesto editable y notas de instalación. Está pensado para imprimirse.

Todo se calcula a partir de tres archivos de configuración (`js/config/`): si se corrige una medida, el modelo, los planos, el despiece y el presupuesto se actualizan solos.

## Requisitos

- Un navegador moderno con WebGL 2 (Chrome, Edge, Firefox o Safari recientes).
- Conexión a internet: Three.js se carga desde el CDN de jsDelivr mediante un *import map*.
- Cualquier servidor HTTP estático (Python 3, Node.js o la extensión Live Server).

No hay dependencias que instalar, ni `package.json`, ni paso de compilación.

## Cómo levantar el proyecto

Las páginas usan módulos ES (`<script type="module">`), que el navegador **no carga desde `file://`**. Por eso no basta con abrir `index.html` con doble clic: hay que servir la carpeta por HTTP.

Desde la carpeta `cocina/`, con cualquiera de estas opciones:

```bash
# Opción 1: Python 3 (viene instalado en la mayoría de sistemas)
python3 -m http.server 8000

# Opción 2: Node.js
npx serve -l 8000 .

# Opción 3: Node.js, alternativa sin caché
npx http-server -p 8000 -c-1 .
```

Luego abre en el navegador:

- Modelo 3D: <http://localhost:8000/index.html>
- Planos y presupuesto: <http://localhost:8000/reposteros.html>

También funciona la extensión **Live Server** de VS Code o Cursor: clic derecho sobre `index.html` → *Open with Live Server*.

> En WSL, el servidor levantado dentro de Linux es accesible desde el navegador de Windows en `localhost` sin configuración adicional.

Si cambias un archivo `.js` y el navegador no refleja el cambio, recarga sin caché (Ctrl+Shift+R).

## Despliegue en Cloudflare Pages

El sitio se publica automáticamente en Cloudflare Pages con GitHub Actions (`.github/workflows/deploy.yml`) en cada push a `main`. También se puede lanzar a mano desde la pestaña *Actions* → *Desplegar en Cloudflare Pages* → *Run workflow*.

El workflow copia el sitio a una carpeta temporal **sin** `images/`, sin los archivos `.md` y sin `.git`/`.github`, y la sube con `wrangler pages deploy`. La primera vez crea el proyecto `cocina` en Cloudflare; la URL queda como `https://cocina.pages.dev` (si el nombre está tomado, Cloudflare añade un sufijo y lo muestra en el log del despliegue).

### Configuración inicial (una sola vez)

1. **Token de API de Cloudflare.** En el panel de Cloudflare: *My Profile* → *API Tokens* → *Create Token* → *Create Custom Token*, con el permiso **Account → Cloudflare Pages → Edit** sobre tu cuenta.
2. **ID de cuenta.** Está en el panel de Cloudflare, en *Workers & Pages* (columna derecha, *Account ID*), o en la URL del panel: `dash.cloudflare.com/<ACCOUNT_ID>/...`.
3. **Secretos en GitHub.** En el repositorio: *Settings* → *Secrets and variables* → *Actions* → *New repository secret*:
   - `CLOUDFLARE_API_TOKEN`: el token del paso 1.
   - `CLOUDFLARE_ACCOUNT_ID`: el ID del paso 2.

   O desde la terminal, con `gh` autenticado en la cuenta dueña del repositorio:

   ```bash
   gh secret set CLOUDFLARE_API_TOKEN --repo alessandrovv/p-cocina-modelo-3d
   gh secret set CLOUDFLARE_ACCOUNT_ID --repo alessandrovv/p-cocina-modelo-3d
   ```

4. Hacer push a `main` (o ejecutar el workflow a mano) y revisar el log del paso *Desplegar en Cloudflare Pages*, que muestra la URL publicada.

Para cambiar el nombre del proyecto de Cloudflare, edita `PROYECTO_PAGES` en el workflow.

## Uso del modelo 3D

**Ratón:** arrastrar para rotar, rueda para zoom, clic derecho o Shift+arrastrar para desplazar.

**Atajos de teclado:**

| Tecla | Acción |
| --- | --- |
| `R` | Vista isométrica inicial |
| `T` | Planta (vista superior ortográfica) |
| `1`–`4` | Alzado interior de la Pared 1, 2, 3 o 4 |
| `C` | Mostrar u ocultar cotas |
| `P` | Mostrar u ocultar puertas de los reposteros |

**Barra superior:**

- **V1 a V4:** versión del diseño de reposteros (ver más abajo).
- **Vistas:** isométrica, superior y alzados de cada pared. En los alzados se ocultan los objetos que quedan entre la cámara y la pared; al girar la cámara más de unos grados vuelven a aparecer.
- **Capas:** cotas (coloreadas según la confianza de la medida), ocultado automático de las paredes que tapan la vista, techo y rejilla de 10 cm en el piso.
- **Reposteros:** muestra u oculta los muebles propuestos, sus puertas y los volúmenes de referencia de los equipos (microondas, freidora de aire, tacho de basura y bidón de agua).
- **Planos ↗:** abre `reposteros.html` en la misma versión del diseño.

**Colores de las cotas:** verde = confirmada (medida explícita en los dibujos o dada por el usuario), azul = inferida (deducida de otras cotas), naranja = estimada (tomada de fotos o tamaños estándar; pendiente de confirmar).

Si alguna medida deja la geometría incoherente (por ejemplo, dos módulos que se superponen), aparece un recuadro de avisos en la parte inferior de la pantalla.

## Versiones del diseño

| Versión | Descripción |
| --- | --- |
| V1 | Altos de 1.50 a 2.30 m (60 cm sobre la mesa). Incluye el repostero A2 sobre la estufa. |
| V2 | Altos bajados a 1.40 m (50 cm sobre la mesa) y de 35 cm de fondo, para alcanzarlos con 1.50 m de estatura. Sin repostero sobre la estufa. La Pared 3 forma una C con dos columnas (C1 y C2) apoyadas en la mesa; el verdulero pasa a la Pared 4 y el montaje es desmontable. |
| V3 | Como la V2, pero C2 se une al especiero en un alto (A5) sostenido por un tubo (T1); licuadora y extractor en la Pared 3, con una extensión eléctrica en canaleta y dos tomacorrientes nuevos. |
| V4 | Como la V3, con puertas en los bajos (B5 queda abierto: se llega a él por el bajo del lavadero). B3 igual a B2 por la llave de agua, con el extractor guardado abajo; licuadora en la Pared 2 como en la V2; pata T1 de 1½" con placa superior y base. **Es la versión por defecto.** |

La versión activa se elige con el parámetro `?v=N` en la URL; sin él se abre la V4. Cambiar de versión recarga la página.

## Página de planos y presupuesto

- **Planos acotados:** alzados de las Paredes 2, 3 y 1 vistos desde la cocina y planta general. Cotas en centímetros; el triángulo de cada puerta apunta al lado de las bisagras.
- **Lista de cortes:** medidas finales en milímetros, agrupadas por material, con los cantos de cada pieza. Es lo que se pide al servicio de corte.
- **Optimización de planchas:** distribución por cortes de guillotina sobre planchas de 2.44 × 2.15 m (melamina) y 2.44 × 1.22 m (MDF). Es determinista: da el mismo resultado en cada carga.
- **Presupuesto:** precios en soles con su fuente y estado (consultado, referencial o estimado). Los precios unitarios se pueden editar en la tabla y se guardan en el navegador; el botón *Restablecer precios* vuelve a los valores de `js/config/precios.js`. También se puede activar o desactivar la melamina RH para los bajos y la mano de obra.
- **Imprimir:** el botón usa la hoja de estilos de impresión para obtener un documento limpio.

## Estructura del proyecto

```
cocina/
├── .github/workflows/
│   └── deploy.yml          Despliegue automático en Cloudflare Pages
├── index.html              Modelo 3D (barra de herramientas + import map de Three.js)
├── reposteros.html         Planos, cortes, planchas, herrajes, presupuesto y notas
├── css/
│   ├── styles.css          Estilos del modelo 3D
│   └── reposteros.css      Estilos de la página de planos (incluye @media print)
├── images/                 Dibujos a mano y fotos de la cocina real (fuente de las medidas)
└── js/
    ├── main.js             Entrada del modelo 3D: renderer, escena, luces, capas y bucle
    ├── materials.js        Colores y materiales; texturas generadas por código (canvas)
    ├── config/
    │   ├── dimensiones.js  Medidas de la cocina actual (en metros) y validaciones
    │   ├── reposteros.js   Módulos, versiones del diseño, resolución y validaciones
    │   └── precios.js      Precios de referencia en soles y opciones del presupuesto
    ├── builders/           Construcción de la geometría 3D
    │   ├── room.js         Paredes, acabados, columnas, piso y techo
    │   ├── window.js       Ventana de la Pared 1
    │   ├── counters.js     Mesas de cerámica en L, pilares, zócalo y lavadero
    │   ├── appliances.js   Estufa y refrigeradora
    │   ├── cabinets.js     Reposteros, etiquetas y equipos de referencia
    │   └── annotations.js  Cotas y nombres de las paredes
    ├── ui/
    │   ├── views.js        Vistas predefinidas y transición de cámara
    │   └── toolbar.js      Botones, atajos de teclado y cambio de versión
    ├── reposteros/
    │   ├── despiece.js     Piezas, cantos, herrajes, planchas y presupuesto (sin Three.js)
    │   └── documento.js    Entrada de reposteros.html: genera SVG y tablas
    └── utils/
        └── geometry.js     Cajas, extrusiones, UV en metros, aristas y sombras
```

## Cómo modificar el diseño

- **Corregir una medida de la cocina:** editar `js/config/dimensiones.js`. Cada valor lleva una etiqueta `[C]` confirmada, `[I]` inferida o `[E]` estimada; al confirmar una medida estimada conviene cambiar también la etiqueta.
- **Cambiar los reposteros:** editar la lista `modulos` de `BASE` en `js/config/reposteros.js` (posición a lo largo de la pared, repisas, puertas, bisagras, espalda). Las versiones posteriores a la 1 se definen en `VERSIONES` como transformaciones de `BASE`.
- **Actualizar precios:** editar `js/config/precios.js` y cambiar el campo `fecha`; eso invalida los precios que cada navegador tenga guardados.

Después de cualquier cambio, recarga ambas páginas y comprueba que no aparezca el recuadro de avisos.

## Material de referencia

La carpeta `images/` contiene la información original de la que salen las medidas:

- `dibujo_vista_superior.jpeg`: planta a mano con las cotas principales.
- `dibujo_vista_frontal_pared1.jpeg` a `..._pared4.jpeg`: alzados a mano de cada pared.
- `foto_pared1.jpeg` a `foto_pared4.jpeg`: fotografías de cada pared, usadas para acabados y medidas estimadas.

## Tecnologías

- [Three.js](https://threejs.org/) r186 (`three@0.186.1`), cargado desde jsDelivr con `OrbitControls`, `CSS2DRenderer` y `RoomEnvironment`.
- JavaScript moderno con módulos ES nativos, HTML y CSS, sin frameworks ni empaquetador.
- SVG generado en el navegador para los planos.

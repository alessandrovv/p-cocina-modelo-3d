# AGENTS.md — Cocina · modelo 3D y reposteros

Guía para agentes de IA que trabajen en este proyecto. Léela completa antes de editar: el proyecto es pequeño pero tiene convenciones de unidades, coordenadas y fuentes de verdad que es fácil romper sin darse cuenta.

## 1. Qué es el proyecto

Sitio estático (HTML + CSS + JavaScript con módulos ES nativos) con dos páginas:

| Página | Entrada JS | Qué hace |
| --- | --- | --- |
| `index.html` | `js/main.js` | Modelo 3D en Three.js de una cocina real (Lima, Perú) con los reposteros propuestos. |
| `reposteros.html` | `js/reposteros/documento.js` | Documento de fabricación: planos SVG, módulos, lista de cortes, planchas, herrajes, presupuesto y notas. **No usa Three.js.** |

Contexto del usuario (útil para decisiones de diseño):

- **Etapa 1:** modelar la cocina tal como está, a partir de dibujos a mano y fotos (`images/`).
- **Etapa 2:** diseñar reposteros de melamina blanca de 18 mm: altos con puertas en las Paredes 2 y 3, bajos **abiertos** (sin puertas ni cajones) bajo las mesas de cerámica.
- Quien usará los altos mide 1.50 m (de ahí la versión 2, con los altos más bajos).
- Precios en soles (S/), tiendas peruanas (Sodimac, Promart).
- Todo el contenido visible, los identificadores y los comentarios están **en español**. Mantenlo así.

## 2. Cómo ejecutarlo

No hay `package.json`, dependencias, build ni tests (el despliegue está en la sección 12). Three.js r186 se carga desde jsDelivr con un *import map* declarado en `index.html`:

```html
"three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"
```

Hay que servir la carpeta por HTTP (los módulos ES no cargan desde `file://`):

```bash
cd cocina && python3 -m http.server 8000
# http://localhost:8000/index.html  y  http://localhost:8000/reposteros.html
```

Parámetros y estado del navegador:

- `?v=1` / `?v=2` elige la versión del diseño; se guarda en `localStorage['cocina-version']`. Sin parámetro ni valor guardado se usa la última versión definida.
- `localStorage['cocina-reposteros-precios']` guarda los precios editados en el presupuesto. Solo se aplican si su `fecha` coincide con `PRECIOS.fecha`.

Ganchos de depuración en la consola del navegador:

- `window.__cocina` → `{ scene, DIM, views, renderer, estado, aplicarCapas, reposteros, ready }` (modelo 3D).
- `window.__reposteros` → `{ modulos, datos, precios, ready }` (página de planos).

Úsalos si automatizas el navegador: espera a que `ready === true`.

## 3. Mapa de archivos

```
js/
├── main.js                Renderer, escena, luces, montaje de builders, capas, visibilidad por cámara, bucle
├── materials.js           COLORES + createMaterials(renderer); texturas procedurales en canvas
├── config/                ← FUENTES DE VERDAD (datos + funciones puras)
│   ├── dimensiones.js     DIM, derivadas(), validarDimensiones()
│   ├── reposteros.js      BASE, VERSIONES, VERSION, REPOSTEROS, resolverModulos(), resolverApoyos(),
│   │                      cajaMundo(), validarReposteros(), cambiarVersion()
│   └── precios.js         PRECIOS (items, opciones, fecha)
├── builders/              Geometría 3D; cada uno recibe (DIM, materiales) y devuelve grupos
│   ├── room.js            buildRoom → { group, walls, ceiling, floor }
│   ├── window.js          buildWindow (lo usa room.js)
│   ├── counters.js        buildCounters → { group, izquierda, derecha, zocaloHueco }
│   ├── appliances.js      buildStove, buildFridge
│   ├── cabinets.js        buildCabinets → { group, grupos, puertas, etiquetas, fantasmas, equipos, equiposGroup, modulos }
│   └── annotations.js     buildAnnotations (cotas), buildWallLabels, funciones de visibilidad
├── ui/
│   ├── views.js           defineViews(DIM), clase ViewManager (cámara perspectiva/ortográfica, tween)
│   └── toolbar.js         bindToolbar: botones data-view / data-toggle / data-version y teclado
├── reposteros/
│   ├── despiece.js        despiece(), optimizarPlanchas(), planchasPorProducto(), presupuesto()
│   └── documento.js       Render de reposteros.html (SVG + tablas + presupuesto editable)
└── utils/geometry.js      boxBetween, extrudePlan, rectPlan, applyWorldUV, addEdges, setShadows
```

Grafo de dependencias relevante:

- `config/*` no importa Three.js. `reposteros.js` importa `dimensiones.js`.
- `reposteros/despiece.js` y `reposteros/documento.js` **no deben importar Three.js**: la página de planos no tiene import map.
- `builders/*` y `ui/*` sí usan Three.js.

## 4. Unidades y sistema de coordenadas

**Unidades:**

- Toda la configuración y la geometría 3D están en **metros**.
- `documento.js` dibuja los SVG en **milímetros** (`S = 1000`) y muestra cotas en **centímetros** (`cm()`).
- La lista de cortes muestra **milímetros** (`mmTxt()`).
- Dinero en soles, con formato `es-PE`.

**Coordenadas de mundo** (definidas en `dimensiones.js`):

- Origen: esquina interior Pared 2 / Pared 3, a nivel del piso terminado.
- `+X` hacia la Pared 1 (ventana); `+Z` hacia la Pared 4 (entrada); `+Y` hacia arriba.
- Pared 2 = norte (`z = 0`), Pared 4 = sur (`z = fondo`), Pared 3 = oeste (`x = 0`), Pared 1 = este (`x = ancho`).

**Coordenadas de pared** (usadas por los reposteros y los equipos), convertidas con `cajaMundo(pared, [u0,u1], [d0,d1], [y0,y1])`:

| Pared | `u` (a lo largo) | `d` (profundidad) | Frente hacia |
| --- | --- | --- | --- |
| `pared2` | `x`, desde la Pared 3 | `z` | `+Z` |
| `pared3` | `z`, desde la Pared 2 | `x` | `+X` |
| `pared1` | `z`, desde la Pared 2 | `ancho − x` | `−X` |

`cajaMundo` lanza un error para `pared4`: no hay reposteros en esa pared. Si alguna vez se necesitan, hay que ampliar `cajaMundo`, `NORMAL_FRENTE` (cabinets.js), la función `caja`/`punto` de `planta()` y `PAREDES` (documento.js).

En los alzados SVG, la Pared 3 se dibuja espejada (`s: (u) => F - u`) porque se ve desde dentro de la cocina.

## 5. Fuentes de verdad y flujo de datos

```
dimensiones.js (DIM) ─┬─> builders/* ──────────────> escena 3D
                      │
reposteros.js (BASE) ─┴─> VERSIONES[VERSION].aplicar(BASE) = REPOSTEROS
                              │
                              └─> resolverModulos() / resolverApoyos()
                                     ├─> builders/cabinets.js  (3D)
                                     ├─> reposteros/documento.js (planos y tablas)
                                     └─> reposteros/despiece.js (piezas → planchas → presupuesto)
precios.js (PRECIOS) ─────────────────> despiece.presupuesto()
```

Reglas:

1. **No hardcodees medidas** en builders, vistas ni documento. Léelas de `DIM`, `derivadas(DIM)` o `REPOSTEROS`.
2. `derivadas()` calcula valores que no se editan a mano (hueco de la estufa, posición de la ventana, tramos de la Pared 3, espesor de la Pared 4, posición de la refrigeradora…). Si necesitas un valor derivado nuevo, agrégalo ahí.
3. `resolverModulos()` es la única normalización de módulos (alturas absolutas, profundidades, repisas, puertas, tapas fijas, `frente`). El 3D, los planos y el despiece deben consumir su salida, no `REPOSTEROS.modulos` en crudo.
4. Al cargar, ambas páginas muestran en `#avisos` el resultado de `validarDimensiones()` y `validarReposteros()`. Tras cualquier cambio, **la lista de avisos debe quedar vacía**. Si agregas una restricción geométrica nueva, agrega su validación en la función correspondiente.

### Etiquetas de confianza en `dimensiones.js`

Cada medida lleva un comentario `[C]` confirmada, `[I]` inferida o `[E]` estimada. Las cotas del 3D usan el mismo código de color (`ESTADOS` en `annotations.js`). Si el usuario confirma una medida, actualiza el número **y** la etiqueta, y revisa si alguna cota en `buildAnnotations` debe pasar a `'confirmada'`.

Dato conocido: los dibujos indican un fondo de 3 m, pero las medidas del usuario suman 2.92 m por dos vías; el modelo usa 2.92 m (está documentado en el propio archivo).

## 6. Modelo de datos de los reposteros

Cada entrada de `BASE.modulos`:

| Campo | Significado |
| --- | --- |
| `id` | Código visible: `A*` altos, `B*` bajos, `R*` rellenos. Se usa en etiquetas, planos, cortes y notas HTML. |
| `tipo` | `'alto'`, `'bajo'` o `'relleno'`. |
| `pared` | `'pared1'`, `'pared2'` o `'pared3'`. |
| `u` | `[u0, u1]` en metros a lo largo de la pared. |
| `y0`, `y1` | Opcionales; por defecto `BASE.altos.y0/y1` en los altos y zócalo → bajo la losa en los bajos. |
| `repisas` | Número (se reparten de forma uniforme) o lista de **alturas libres** desde abajo (p. ej. `[0.4]`). |
| `puertas`, `bisagra` | Número de hojas; `'inicio'`/`'fin'` indica el lado de la bisagra en la coordenada `u` (con 2 hojas se ignora). |
| `tapaFija` | `[u0, u1]` cerrado con un panel fijo (esquina de A1 detrás de A5); las puertas cubren el resto. |
| `espalda` | `'melamina'` (18 mm, vista) o por defecto MDF de 3 mm. |
| `esquinero` | Informativo (módulos de esquina). |
| `contenido` | Uso previsto; aparece en la tabla de módulos. |

Otras listas de `BASE`: `zonasLibres` (bajo el lavadero), `equipos` (volúmenes de referencia que **no se fabrican**; cajas en coordenadas de pared o `cilindro` en coordenadas de mundo).

Las versiones posteriores (`VERSIONES[n].aplicar(R)`) devuelven un objeto nuevo sin mutar `BASE`. La versión 2, por ejemplo, baja `altos.y0` a 1.40, elimina A2, cambia las repisas, agrega `apoyos` (P1 panel, T1 tubo) y `montaje: 'desmontable'` (que activa el riel y los pernos en los herrajes).

La versión se resuelve **una sola vez al cargar el módulo**; `cambiarVersion(v)` recarga la página con `?v=v`. No intentes cambiar de versión en caliente.

## 7. Recetas frecuentes

**Agregar o mover un módulo:**

1. Editar `BASE.modulos` (o la transformación de la versión correspondiente).
2. Comprobar que no haya avisos (superposición, choque con pilares, repisas de más de 85 cm de luz, menos de 50 cm sobre la mesa).
3. Si es un alto o bajo en una pared nueva, revisar la agrupación en `buildCabinets` (`altosPared2`, `altosPared3`, `bajosIzquierda`, `bajosDerecha`) y las listas `ocultar` de `defineViews`.
4. Si `reposteros.html` tiene una nota sobre ese módulo, usar `data-modulo="ID"` para que se oculte cuando el módulo no exista.

**Agregar una versión del diseño:**

1. Agregar `VERSIONES[n]` con `nombre`, `descripcion` y `aplicar`.
2. Agregar el botón `data-version="n"` en **ambos** HTML (`index.html` y `reposteros.html`).
3. Para notas exclusivas de una versión en `reposteros.html`, usar `data-version="n"` (admite varios valores separados por espacio).
4. Recuerda que la versión por defecto pasa a ser la nueva (`ULTIMA`).

**Agregar una vista de cámara:**

1. Definirla en `defineViews()` (`ortho`, `position`, `target`, `fit` para ortográficas, `ocultar`).
2. Los nombres de `ocultar` deben ser claves del objeto `objetos` que se pasa a `ViewManager` en `main.js`; si el objeto no está ahí, agrégalo.
3. Agregar el botón `data-view="nombre"` en `index.html` y, si aplica, la tecla en `toolbar.js`.

**Agregar una capa conmutable:**

1. Agregar la clave a `estado` en `main.js` y aplicarla en `aplicarCapas()` (o en `actualizarVisibilidad()` si depende de la cámara).
2. Agregar un botón `data-toggle="clave"` con `aria-pressed` en `index.html`. `toolbar.js` lo conecta solo.

**Agregar un herraje o material al presupuesto:**

1. Agregar el item en `PRECIOS.items` con `nombre`, `unidad`, `precio`, `estado` y, si existe, `fuente` y `volumen`.
2. Calcular su cantidad en `despiece()` (lista `herrajes`) o agregar la línea en `presupuesto()`.
3. **Cambiar `PRECIOS.fecha`** si cambian precios existentes; si no, los navegadores conservarán los precios viejos guardados.

**Agregar geometría 3D:**

- Usa `boxBetween(min, max, material)` y `extrudePlan(puntos, y0, y1, material)` de `utils/geometry.js`, que trabajan directamente en coordenadas de mundo.
- `applyWorldUV` hace que las texturas de baldosa/ladrillo queden a escala real (repeat = 1/tamaño en metros). Para piezas sin textura (melamina, acero) pasa `{ worldUV: false }`.
- Llama a `setShadows(group)` y, en volúmenes que deban leerse en vistas ortográficas, a `addEdges(mesh)`.
- Los acabados de pared se separan `EPS = 0.002` m de la cara del muro para evitar *z-fighting*.

## 8. Comportamientos sutiles (gotchas)

- **Lógica duplicada de pilares:** la posición de los pilares de las mesas se calcula en tres lugares: `endPiers()` en `counters.js`, `pilares()` en `reposteros.js` (para validar choques) y `PILARES` en `documento.js` (para los planos). Si cambias uno, cambia los tres.
- **Ocultado automático de paredes:** `actualizarVisibilidad()` oculta cada pared cuyo lado exterior mira a la cámara y muestra su contorno (`ghost`). Los altos de cada pared tienen su propio contorno (`fantasmas`) que se activa cuando su pared se oculta.
- **Vistas con objetos ocultos:** al entrar en un alzado se ocultan objetos; `ViewManager` los restaura si la cámara gira más de 4°. No dependas de `visible` de esos objetos fuera de este flujo.
- **Puertas:** `reposteros.puertas` es una lista de grupos por módulo; la capa “Puertas” solo cambia su `visible`.
- **Etiquetas CSS2D:** las de módulos se muestran solo con la capa de cotas activa, si su módulo (y todos sus padres) es visible y su frente mira a la cámara.
- **Optimización de planchas:** `optimizarPlanchas` prueba hasta 6000 órdenes de colocación con un PRNG de semilla fija (`20261006`), así que el resultado es determinista. Está memoizada por contenido. Si cambias la heurística, verifica que la página siga cargando rápido.
- **Materiales del despiece:** `'estandar'`, `'humedad'` (bajos en contacto con el piso; van en RH si `bajosRH`), `'relleno'` (techos y repisas de bajos que aprovechan el sobrante de las planchas RH) y `'mdf3'`.
- **Texto en HTML generado:** `documento.js` arma HTML con plantillas; todo texto que venga de datos pasa por `esc()`. Mantén esa práctica.
- **Atajos de teclado:** se ignoran cuando el foco está en un `<input>` o hay modificadores (Ctrl, Meta, Alt).

## 9. Estilo de código

- JavaScript moderno: módulos ES, `const`/`let`, funciones flecha, desestructuración, `??`, `?.`, campos privados (`#`) en clases.
- Formato tipo Prettier: 2 espacios, comillas simples, punto y coma, comas finales, líneas de hasta ~120 caracteres.
- Nombres de dominio en español (`resolverModulos`, `largoPared2`, `huecoCocina`); algunos utilitarios técnicos están en inglés (`boxBetween`, `buildRoom`). Sigue el estilo del archivo que edites.
- Comentarios en español y escasos: JSDoc breve sobre funciones exportadas y notas sobre restricciones no evidentes (p. ej. por qué una medida es la que es). No agregues comentarios que repitan lo que hace el código.
- No hay frameworks; no agregues dependencias, empaquetadores ni `package.json` salvo que el usuario lo pida. Si necesitas otro addon de Three.js, impórtalo desde `three/addons/...` con la misma versión del import map.

## 10. Verificación

No hay tests automatizados. Después de un cambio:

1. **Lógica pura (rápido, sin navegador).** Como no hay `package.json`, Node trata los `.js` como CommonJS; usa `--experimental-default-type=module`:

   ```bash
   cat > /tmp/check.mjs <<'EOF'
   const base = 'file:///RUTA/ABSOLUTA/cocina/js/';
   const { validarDimensiones } = await import(base + 'config/dimensiones.js');
   const R = await import(base + 'config/reposteros.js');
   const { despiece, presupuesto } = await import(base + 'reposteros/despiece.js');
   const { PRECIOS } = await import(base + 'config/precios.js');
   console.log('versión', R.VERSION, validarDimensiones(), R.validarReposteros());
   const d = despiece();
   const b = presupuesto(d, PRECIOS, PRECIOS.opciones);
   console.log('piezas', d.piezas.reduce((s, p) => s + p.cant, 0), 'total', b.total.toFixed(2));
   EOF
   node --experimental-default-type=module /tmp/check.mjs
   ```

   En Node se evalúa la última versión (no hay `window`). Ambas listas de avisos deben salir vacías. Referencia al 2026-10-07 (versión 2): 83 piezas; 2 planchas RH, 3 de melamina estándar y 2 de MDF; total aproximado S/ 2,185.24.

2. **Navegador.** Sirve la carpeta y abre `index.html?v=1`, `index.html?v=2`, `reposteros.html?v=1` y `reposteros.html?v=2`. Comprueba que no aparezca el recuadro `#avisos`, que la consola no tenga errores y que el cambio se vea en el 3D y en los planos.

## 11. Material de referencia

`images/` contiene la información original: `dibujo_vista_superior.jpeg` (planta con cotas), `dibujo_vista_frontal_pared{1..4}.jpeg` (alzados a mano) y `foto_pared{1..4}.jpeg` (fotos de cada pared). Consúltalos antes de cambiar una medida `[C]` o al justificar una `[I]`/`[E]`. No los muevas ni los renombres: `dimensiones.js` se refiere a ellos.

## 12. Repositorio y despliegue

- La raíz del repositorio git es `cocina/`. Remoto: `git@github-personal:alessandrovv/p-cocina-modelo-3d.git` (alias SSH `github-personal` de la cuenta personal). Rama principal: `main`.
- El repositorio de GitHub es **público**: todo lo que se suba (incluidas las fotos de `images/`) es visible.
- No hagas commits, push ni cambios de configuración de git sin que el usuario lo pida.
- `gh` en esta máquina puede estar autenticado con otra cuenta (de trabajo). Para operar sobre este repositorio con `gh`, confirma antes la cuenta activa (`gh auth status`) y usa `--repo alessandrovv/p-cocina-modelo-3d`.

**Despliegue:** `.github/workflows/deploy.yml` publica en Cloudflare Pages en cada push a `main` (y a mano con `workflow_dispatch`):

1. `rsync` copia el repositorio a `$RUNNER_TEMP/dist` excluyendo `.git/`, `.github/`, `images/` y `*.md`.
2. `cloudflare/wrangler-action@v4` (Wrangler 4) crea el proyecto `cocina` si no existe (`|| true` cuando ya existe) y ejecuta `pages deploy`.
3. Necesita los secretos `CLOUDFLARE_API_TOKEN` (permiso *Account → Cloudflare Pages → Edit*) y `CLOUDFLARE_ACCOUNT_ID`.

Implicaciones al editar:

- Cualquier archivo nuevo que deba servirse tiene que quedar fuera de esas exclusiones. Si agregas archivos que **no** deben publicarse (notas, scripts, datos privados), añádelos a las exclusiones del `rsync`.
- El sitio desplegado no tiene paso de build: lo que hay en el repositorio es lo que se sirve. No introduzcas rutas que solo funcionen con el servidor local.
- Las rutas son relativas (`css/…`, `js/…`, `reposteros.html`), así que el sitio funciona en la raíz del dominio o en un subdirectorio; mantenlo así.

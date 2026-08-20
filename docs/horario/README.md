# Horario UASD

Herramienta gratuita para construir, editar e imprimir un horario semanal.
Vive en `/horario/` dentro de `agnerdiaz.com` y se integra con el sistema visual
existente (variables CSS, componentes `.btn` / `.card`, tema claro/oscuro).

Esta es la **iteración 01**: un constructor **manual** de horarios. El parser de
PDF de la UASD todavía **no** está implementado.

---

## Propósito

Flujo objetivo final:

> PDF UASD → analizar → revisar materias → generar horario → editar →
> personalizar → imprimir/PDF.

En esta iteración se entrega el motor manual: agregar, editar, duplicar y
eliminar actividades sobre un calendario semanal (lunes a domingo), con
posicionamiento preciso por minutos, manejo de solapamientos, formato 12/24 h,
rango horario configurable y vistas de escritorio y móvil.

## Arquitectura

Sitio estático, sin frameworks, sin bundler. Scripts clásicos que se registran
bajo el espacio de nombres global `window.Horario`. Separación estado / lógica /
presentación:

```
public/horario/           # la app: servida tal cual, sin pasar por el bundler
├── index.html            # Estructura, diálogos accesibles, SEO
├── css/
│   ├── horario.css       # Estilos específicos de la app (calendario neutro)
│   └── print.css         # Base mínima de impresión (desacoplada)
├── js/
│   ├── utils.js          # Helpers puros: ids, tiempo (HH:mm), DOM seguro
│   ├── types.js          # Registro de tipos + derivación de color/contraste
│   ├── settings.js       # Estado de ajustes + validación (formato, rango)
│   ├── events.js         # Modelo ScheduleItem + CRUD/validación (sin DOM)
│   ├── storage.js        # Persistencia local (localStorage), tolerante a fallos
│   ├── schedule.js       # MOTOR de calendario: geometría + solapamientos (puro)
│   ├── pdf-reader.js     # PDF → DocumentText (PDF.js + reconstrucción de líneas)
│   ├── uasd-parser.js    # DocumentText → modelo UASD (PURO, comprobable)
│   ├── uasd-import.js    # Adaptador: modelo UASD → ScheduleItem[] + reglas
│   ├── pdf-layout.js     # Geometría PURA del PDF (escala vertical, wrapping)
│   ├── pdf-export.js     # Dibujo vectorial del PDF (jsPDF) + descarga
│   └── app.js            # Controlador/vista: render, diálogos, import/export UI
└── vendor/               # (opcional) PDF.js auto-hospedado

tests/horario/            # fuera de public/: los tests no se publican
├── engine.test.js                # Motor del calendario (17)
├── uasd-parser.test.js           # Parser + adaptador (83)
├── pdf-layout.test.js            # Layout del PDF (32)
├── storage.test.js               # Persistencia local (13)
└── fixtures/
    ├── uasd-sanitized.json       # Fixture SIN datos personales (12/15/17/1)
    └── private/                  # (gitignored) PDFs reales de prueba

docs/horario/             # esta documentación
```

Reutiliza del sitio: `/assets/css/styles.css` (tokens, botones, tarjetas, tema)
y `/assets/js/main.js` (toggle de tema y año del footer). No se copian estilos
globales dentro de `horario.css`.

### Principios

- El **motor** (`schedule.js`) es puro y no depende del futuro parser UASD.
- Los ítems manuales y los importados usarán **el mismo modelo** (`ScheduleItem`).
- Todo el texto del usuario se pinta con `textContent` (nunca `innerHTML`).
- Las mutaciones de estado pasan por funciones únicas (`addItem`, `updateItem`,
  `removeItem`) para poder conectar `storage.js` sin reescribir componentes.

## Modelo `ScheduleItem`

```js
{
  id: "item-...",            // único
  title: "Fisiopatología II", // único campo obligatorio
  section: "W05",             // opcional
  code: "CFI 1560",           // opcional
  location: "Instituto de Cardiología 101", // opcional
  professor: "Marlene Núñez Rodríguez",      // opcional
  description: "",            // opcional
  day: "thursday",            // monday … sunday (interno en inglés)
  startTime: "19:00",         // 24h interno "HH:mm"
  endTime: "21:50",           // 24h interno "HH:mm"
  typeId: "uasd",             // referencia a un tipo
  source: "manual",           // "manual" | (futuro) "uasd"
  autoScheduled: false        // preparado para materias sin horario
}
```

Reglas: solo `title` es obligatorio; campos vacíos nunca se renderizan (ni
`undefined`/`null`); horas internas siempre 24h; ids únicos.

## Motor de solapamientos

`schedule.layoutDayEvents(items)` es una función **pura y comprobable**. Agrupa
los eventos de un día en *clusters* transitivamente solapados y asigna columnas
con un algoritmo *greedy* determinista (misma familia que los calendarios tipo
Google): cada evento ocupa la primera columna libre; si no hay, se abre una
nueva. Devuelve por id `{ column, columnCount }`; el ancho es `1/columnCount`.

Casos soportados: dos/tres o más eventos, solapamientos parciales, mismo inicio,
y mismo inicio/fin (p. ej. tres actividades idénticas domingo 08:00–09:00 se
muestran en tres columnas legibles). Dos eventos solapan solo si
`a.start < b.end && b.start < a.end` (los bordes que se tocan no solapan).

`schedule.computeDayPositions(...)` centraliza minutos→píxeles: `top`, `height`
(con altura mínima legible), columna y detección de fuera de rango.

## Importación del PDF UASD (Iteración 02)

Pipeline por capas, cada una comprobable de forma independiente:

```
PDF  →  pdf-reader.extractPdfDocument()  →  DocumentText
     →  uasd-parser.parseUasdDocument()  →  UasdImportResult
     →  uasd-import.convertToScheduleItems()  →  ScheduleItem[]
     →  (revisión + confirmar)  →  events store  →  calendario
```

- **`pdf-reader.js`** solo convierte PDF → texto estructurado. Para cada token
  conserva `{ text, x, y, width, height }` (coordenadas de `item.transform`) y
  reconstruye **líneas** agrupando por Y con tolerancia y ordenando por X. No
  sabe nada de materias/UASD.
- **`uasd-parser.js`** es **puro** (sin DOM, sin PDF.js). Detecta materias por el
  patrón final `Título - CÓDIGO - SECCIÓN` (interpretado desde el final; la
  sección se conserva como string: `02`, `W05`…), reconstruye la **tabla de
  reuniones por columnas usando las X del encabezado** (las columnas no están
  hardcodeadas: cambian entre páginas), une **celdas multilínea**, mantiene la
  materia **a través de saltos de página**, interpreta días (`L M I J V S D`,
  `I`=Miércoles, `LMI`→3 días) y horas AM/PM 12h→24h, y clasifica en
  `virtual` / `hospital` / `uasd`.
- **`uasd-import.js`** adapta el modelo a `ScheduleItem[]` (una reunión `LMI`
  produce 3 items enlazados por `courseKey`/`importId`), y aplica las reglas de
  importación (reemplazar UASD / agregar, y deduplicación).

### Reglas clave (no dependen de nombres de materia)

- **PA con horario** (hora válida, `Dónde: PA`): se clasifica **Virtual** y se
  conserva `location: "PA"`.
- **PA/PA** (`Hora: PA`, sin horario): se coloca automáticamente **Domingo
  08:00–09:00**, `autoScheduled: true`, con *warning* informativo.
- **Hospital**: `location` contiene `HOSP`/`HOSPITAL`/`MATERNIDAD` → tipo
  `Hospital / Fuera UASD`.
- **`( P )`** al final del instructor se elimina; el nombre real se preserva.

### PDF.js (fuente y vendorizado)

Por defecto se carga **PDF.js 5.7.284** desde CDN (jsdelivr) con worker vía
*blob* y `cMapUrl`/`standardFontDataUrl`. Todo el procesamiento ocurre **en el
navegador**; el PDF nunca sale del dispositivo.

Para un sitio 100 % estático, vendoriza PDF.js y actívalo:

```bash
npm pack pdfjs-dist@5.7.284      # o descarga el build oficial (Apache-2.0)
# copia a: public/horario/vendor/pdfjs/{build,cmaps,standard_fonts,wasm}, LICENSE, VERSION
```

Luego en `public/horario/index.html` cambia el flag:

```html
<script>window.HORARIO_PDFJS = { vendor: true };</script>
```

`pdf-reader.js` probará `/horario/vendor/pdfjs/build/pdf.min.mjs` y, si existe,
lo usará; si no, vuelve al CDN. (Con el flag en `false` no se hace ninguna
petición al vendor, para mantener la consola limpia.)

## Rediseño + exportación PDF (Iteración 03)

- **Tipos con rol semántico.** Un tipo es `{ id, semanticRole, name, color,
  system }`. El importador clasifica por `semanticRole` (`uasd`/`hospital`/
  `virtual`), nunca por el nombre — así puedes **renombrar y recolorear** un tipo
  (p. ej. `Dentro UASD` → `Campus UASD`) y el importador lo sigue reconociendo.
  Los tipos del sistema no se pueden eliminar; los personalizados sí.
- **Dos renderers sobre los mismos datos.** La vista interactiva (`app.js`) y el
  PDF (`pdf-layout.js` + `pdf-export.js`) son capas distintas: el PDF **no** es
  una captura del DOM.
- **PDF vectorial** con **jsPDF 2.5.2** (CDN por defecto; opt-in a vendor con
  `window.HORARIO_JSPDF = { vendor: true }`). Botón principal **Descargar PDF**
  (ya no depende de `window.print()`).
  - Siempre incluye **los 7 días** (Lun–Dom) y todo el eje horario; página de
    tamaño personalizado (no atada a A4).
  - **Escala vertical global** que crece hasta que cada evento tenga espacio para
    su texto completo → **nunca** se trunca materia, lugar, profesor ni hora
    (usa *wrapping*, no `...`). Fuente mínima legible.
  - Orientación **Horizontal** (recomendada, más ancho) o **Vertical** (los 7
    días igualmente).
  - Leyenda con los **nombres configurados**, branding discreto, fondo claro,
    sin cabecera/URL/fecha del navegador ni número de página.
  - El rango del PDF se amplía automáticamente para incluir actividades fuera del
    rango visible (se avisa antes de exportar).

## Persistencia (localStorage)

El horario, los tipos (con sus renombrados/colores) y los ajustes se **guardan
automáticamente en este dispositivo** bajo la clave `horario-uasd:v1`. Es
como una cookie pero mejor para estos datos: **no** se envía a ningún servidor,
no caduca y tiene más capacidad. Al abrir `/horario/` se restaura el último
estado. El módulo `storage.js` es tolerante a fallos (modo privado, cuota, JSON
corrupto): si algo falla, la app sigue funcionando en memoria. En
*Configuración → Horario* hay **Vaciar horario** y **Borrar datos guardados**.
Nunca se guardan el nombre ni la matrícula del estudiante (el importador ya los
omite).

## Pruebas

```bash
# Los cuatro de una vez (145 assertions)
npm test
```

O uno por uno:

```bash
# Motor del calendario
node tests/horario/engine.test.js          # 17 passed, 0 failed

# Parser UASD + adaptador (incluye estabilidad de semanticRole)
node tests/horario/uasd-parser.test.js     # 83 passed, 0 failed

# Layout del PDF (geometría pura, escala, wrapping)
node tests/horario/pdf-layout.test.js      # 32 passed, 0 failed

# Persistencia local (mock localStorage)
node tests/horario/storage.test.js         # 13 passed, 0 failed
```

Verificación adicional del PDF: se genera y se **vuelve a leer con PDF.js**
(prueba manual en `?dev=1`) comprobando que contiene los 7 días y nombres
completos, y que **no** contiene `localhost`, `http`, `1/1` ni `...`.

El fixture `tests/horario/fixtures/uasd-sanitized.json` **no** contiene datos personales
y reproduce los casos académicos del PDF real (12 materias, 15 reuniones, 17
items, 1 automático, saltos de página, `LMI`, PA/PA, hospital, multilínea).
El PDF real solo se usa localmente desde `tests/horario/fixtures/private/`
(gitignored).

## Cómo ejecutar localmente

La app sigue siendo estática, pero ahora vive dentro de `public/`, así que la
forma recomendada es el servidor de desarrollo de Astro (respeta las rutas
absolutas `/horario/…` y `/assets/…`):

```bash
npm run dev
#   http://localhost:4321/horario/
```

En `localhost`, `file:` o con `?dev=1` aparece la sección **Desarrollo** dentro
de *Configurar*, con el botón **Cargar datos demo** (incluye casos de
solapamiento). Los datos demo nunca se cargan solos.

## Estado de implementación

Terminado en esta iteración:

- Calendario semanal lunes–domingo con eje horario y posicionamiento por minutos.
- Agregar / editar / duplicar / eliminar (con confirmación accesible).
- Tipos de actividad desacoplados + creación de tipos personalizados.
- Formato 12/24 h (los datos internos no cambian).
- Rango horario visible configurable (se ajusta a horas completas).
- Manejo seguro de actividades fuera de rango (aviso + “Ajustar rango”).
- Algoritmo de solapamiento en columnas (P0).
- Vistas escritorio (semana), tablet (semana con scroll) y móvil (día + chips).
- Empty state, toasts no bloqueantes, tema claro/oscuro, accesibilidad
  (diálogos nativos `<dialog>`, foco, teclado, `aria-*`).
- Botón **Imprimir** (`window.print()`) + base mínima de `print.css`.
- **Importación del PDF UASD** (Iteración 02): PDF.js local, reconocimiento del
  documento, pantalla de revisión, importación atómica (solo muta al confirmar),
  reemplazar/agregar, deduplicación, y preservación de las actividades manuales.

## Qué falta (deliberado)

- Importación/exportación de un archivo JSON (respaldo manual entre dispositivos).
- Vendorizado de PDF.js / jsPDF dentro del repo (hoy vía CDN; opt-in listo).
- Enlace público visible hacia la herramienta desde el sitio.

## Decisiones tomadas

- **Fuera de rango:** no se ocultan datos. Se avisa con un *banner* y un botón
  “Ajustar rango” que expande el rango para incluir todo; los eventos
  parcialmente fuera se recortan al rango pero nunca se pierden.
- **Rango a horas completas:** el inicio/fin visibles se ajustan a la hora en
  punto para que las líneas de la cuadrícula coincidan siempre con el eje; los
  eventos siguen siendo precisos al minuto.
- **Color y contraste:** el texto de las tarjetas usa el color de texto del tema
  (contraste garantizado en claro/oscuro); el color del tipo se usa solo en la
  barra de acento, el borde y el tinte de fondo.
- **Estado en memoria:** esta iteración no persiste; las mutaciones están
  centralizadas para conectar `storage.js` después sin tocar la vista.

## Siguiente etapa

Persistencia (`storage.js`) → importación UASD (parser + PDF.js) → impresión
pulida → publicación del enlace.

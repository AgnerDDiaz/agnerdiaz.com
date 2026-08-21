# IMPLEMENTACIÓN HORARIO UASD — ITERACIÓN 01

**Rama:** `feature/horario-uasd-v1` (creada desde `main`; HEAD ya apunta a ella)
**SHA inicial:** `56db6fe181a6cc33120b43b18b325d6247a0a543`
**SHA final:** _pendiente_ — el commit lo debe crear el usuario (ver secciones 14–15).

---

## 1. Arquitectura implementada

Sitio estático, sin frameworks ni bundler. Módulos JS clásicos bajo el
espacio de nombres global `window.Horario`, con separación estado / lógica /
presentación:

```
horario/
├── index.html          # Estructura + diálogos accesibles + SEO
├── css/
│   ├── horario.css     # Estilos específicos (calendario neutro)
│   └── print.css       # Base mínima de impresión (desacoplada)
├── js/
│   ├── utils.js        # Helpers puros: ids, tiempo HH:mm, DOM seguro
│   ├── types.js        # Registro de tipos + derivación de color/contraste
│   ├── settings.js     # Estado de ajustes + validación (formato, rango)
│   ├── events.js       # Modelo ScheduleItem + CRUD/validación (sin DOM)
│   ├── schedule.js     # MOTOR puro: geometría + layout de solapamientos
│   └── app.js          # Controlador/vista: render, diálogos, wiring
├── README.md
└── REPORTE-ITERACION-01.md
```

- El motor (`schedule.js`) es **puro** y no depende del futuro parser UASD.
- Ítems manuales e importados comparten el **mismo modelo** `ScheduleItem`
  (`source: "manual" | "uasd"`).
- Reutiliza `/assets/css/styles.css` (tokens, `.btn`, `.card`, tema) y
  `/assets/js/main.js` (toggle de tema y año del footer). **No** se copian los
  estilos globales dentro de `horario.css`.
- Las mutaciones de estado pasan por funciones únicas (`addItem`, `updateItem`,
  `removeItem`) para conectar `storage.js` en la siguiente iteración sin
  reescribir la vista.

## 2. Archivos creados

- `horario/index.html`
- `horario/css/horario.css`
- `horario/css/print.css`
- `horario/js/utils.js`
- `horario/js/types.js`
- `horario/js/settings.js`
- `horario/js/events.js`
- `horario/js/schedule.js`
- `horario/js/app.js`
- `horario/README.md`
- `horario/REPORTE-ITERACION-01.md` (este documento)

## 3. Archivos modificados

**Ninguno de los archivos existentes del sitio fue modificado.** Se respetaron
intactos `index.html` (raíz), `/projects/`, `/projects/finclarity/`,
`/assets/i18n/*`, `/assets/css/styles.css`, `/assets/js/main.js`, footer y SEO
globales. La herramienta se integra reutilizándolos, no editándolos.

## 4. Funcionalidades terminadas

- Calendario semanal **lunes–domingo** (7 días siempre) con eje horario.
- **Agregar / editar / duplicar / eliminar** actividades.
- Modelo `ScheduleItem` con `title` como único campo obligatorio; el resto
  opcional. Campos vacíos, `undefined` o `null` **nunca** se renderizan.
- Formulario accesible (modal `<dialog>` nativo) con “Más opciones” para
  sección, código, profesor y descripción.
- Validaciones inline (sin `alert`): título obligatorio y `endTime > startTime`.
- Posicionamiento **preciso al minuto** (07:00–09:50 = 2 h 50 min proporcional).
- **Solapamientos** resueltos con asignación determinista de columnas (P0).
- Rango horario visible configurable (se ajusta a horas completas) + manejo
  seguro de actividades fuera de rango (aviso + botón “Ajustar rango”).
- Formato **12/24 h** (los datos internos siempre 24 h `HH:mm`).
- Tipos de actividad desacoplados + creación de **tipos personalizados**.
- Vistas **semana / día** + selector de día (chips) para móvil.
- Empty state dentro del calendario, toasts no bloqueantes.
- Tema claro/oscuro reutilizando el mecanismo existente.
- **Imprimir** (`window.print()`) + base mínima `print.css`.
- Botón **Importar horario UASD** que informa que llegará en la próxima etapa
  (no simula ninguna importación).
- Datos **demo** solo en desarrollo (`localhost`, `file:` o `?dev=1`).

## 5. Algoritmo de solapamiento utilizado

`schedule.layoutDayEvents(items)` — función **pura y comprobable**:

1. Ordena los eventos por inicio, luego por fin, luego por id (determinista).
2. Los agrupa en *clusters* de eventos transitivamente solapados: se cierra un
   cluster cuando aparece un evento cuyo inicio es `>=` al fin máximo del cluster
   (no puede solapar con ninguno anterior).
3. Dentro de cada cluster asigna columnas de forma *greedy*: cada evento ocupa la
   primera columna cuyo último evento ya terminó; si no hay, abre una nueva.
4. Devuelve por id `{ column, columnCount }`. El ancho de cada tarjeta es
   `1 / columnCount` y el desplazamiento horizontal `column / columnCount`.

Dos eventos solapan solo si `a.start < b.end && b.start < a.end` (los bordes que
se tocan, p. ej. 09:00 fin / 09:00 inicio, **no** solapan). Soporta 2, 3 o más
eventos, solapamientos parciales, mismo inicio y mismo inicio/fin. No hay casos
particulares codificados a mano.

## 6. Comportamiento desktop

- Semana completa (7 columnas) con eje de horas a la izquierda, encabezados de
  día arriba (sticky), y cuadrícula por hora alineada con el eje.
- Contenedor con scroll vertical (sticky headers/eje) y horizontal cuando el
  ancho no alcanza. A 1440 px la semana entra sin scroll horizontal del body.

## 7. Comportamiento móvil

- A ≤ 760 px arranca en **vista día** con chips Lun–Dom para elegir el día; una
  sola columna, perfectamente usable con una mano.
- Botón **Semana / Día** disponible; la semana usa scroll horizontal interno.
- Verificado a 390 px: sin overflow horizontal del body (390 vs 390).

## 8. Integración dark/light

Reutiliza el `#themeToggle` de `/assets/js/main.js` y el script anti-parpadeo en
`<head>` (idéntico al resto del sitio). El calendario se mantiene neutro
(`--hz-grid-bg`, `--hz-line`) para que manden los colores de los tipos. El texto
de las tarjetas usa el color de texto del tema (contraste garantizado en ambos
modos); el color del tipo se aplica solo a barra de acento, borde y tinte.

## 9. Pruebas ejecutadas

**A) Motor (Node, 26 aserciones, `schedule.js`/`events.js`/`settings.js`/`utils.js`):**
tiempo HH:mm ↔ minutos, formato 12/24, `formatRange`, `layoutDayEvents`
(2 solapados, 3 idénticos, bordes que se tocan, cadena parcial),
`computeDayPositions` (top/height, altura mínima, fuera de rango), validaciones,
normalización de rango y `duplicate`.

**B) UI en navegador** (servidor estático local, viewport 390/768/1440):
consola, red (404), IDs duplicados, y los 12 casos funcionales del prompt.

## 10. Resultado de cada prueba

| # | Prueba | Resultado |
|---|--------|-----------|
| Motor | 26 aserciones en Node | ✅ 26/26 |
| 1 | Crear Fisiología Humana II, Miércoles 08:00–10:50 | ✅ top 60, height 170 |
| 2 | Crear Fisiopatología I, Jueves 09:00–10:50 (equivalente demo Jueves) | ✅ posición proporcional |
| 3 | Dos solapadas Lun 18:00–19:00 / 18:30–20:00 | ✅ 2 columnas 50%, legibles |
| 4 | Tres idénticas Domingo 08:00–09:00 | ✅ 3 columnas 33.3%, legibles |
| 5 | Editar actividad | ✅ reposiciona (top 120, height 120) |
| 6 | Duplicar | ✅ nuevo id único, datos conservados |
| 7 | Eliminar (con confirmación) | ✅ desaparece; total 9 |
| 8 | Alternar 12/24 h | ✅ eje y tarjetas; datos internos intactos |
| 9 | Cambiar rango 05:00–23:00 | ✅ recalcula (07:00 → top 120) |
| 10 | Dark → Light → Dark | ✅ sin perder actividades |
| 11 | Responsive 1440 / 768 / 390 | ✅ sin overflow del body |
| 12 | Recargar `/`, `/projects/`, `/projects/finclarity/`, `/horario/` | ✅ 200 y render correcto |
| Técnico | Consola sin errores | ✅ |
| Técnico | Sin 404 de recursos | ✅ |
| Técnico | Sin IDs HTML duplicados | ✅ |
| Técnico | Sin `undefined`/`null` visibles | ✅ |
| Técnico | Teclado: foco + Enter abre edición | ✅ |
| Técnico | Caracteres ó/í/ñ/— | ✅ (Miércoles, Fisiopatología, —) |
| Extra | Tipo personalizado | ✅ aparece en el selector |
| Extra | Importar UASD | ✅ muestra aviso, no simula import |
| Extra | Fuera de rango | ✅ banner “4 actividades…” + Ajustar rango |

## 11. Errores encontrados y corregidos

- **Chips de día visibles en vista semana:** `.hz-chips { display:flex }` anulaba
  el atributo `[hidden]`. **Corregido** añadiendo `.hz-chips[hidden]{display:none}`.
  Reverificado: ocultos en semana, visibles en día.

(No se detectaron otros defectos durante las pruebas.)

## 12. Pendientes deliberados

- Parser PDF de la UASD (`uasd-parser.js`) y PDF.js.
- Persistencia (`storage.js` / localStorage) e import/export JSON.
- Experiencia de impresión/PDF pulida.
- Enlace público visible hacia la herramienta desde el sitio.

## 13. `git status` final

```
On branch feature/horario-uasd-v1
Untracked files:
  horario/
nothing added to commit but untracked files present
```

(El archivo `zztest.txt`, creado por error al sondear permisos de escritura del
entorno, quedó añadido a `.git/info/exclude` para que **no** se incluya en el
commit. Puedes borrarlo localmente con `rm zztest.txt`.)

## 14. Commit creado

**No** — ver sección 15. El working tree tiene todo listo en la rama
`feature/horario-uasd-v1`; falta ejecutar el commit.

## 15. Push realizado o no

**No.** En este entorno la shell es de solo lectura a nivel de sistema operativo
(“Acceso denegado” incluso en `.git`), por lo que `git add/commit/push` no
pudieron ejecutarse (`fatal: Unable to create '.git/index.lock'`). Los archivos
sí se escribieron correctamente en el working tree y la rama ya está activa.

Para subir los cambios y continuar en tu otra máquina, ejecuta:

```bash
git add horario/
git commit -m "feat(horario): add manual weekly schedule foundation"
git push -u origin feature/horario-uasd-v1
```

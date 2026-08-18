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
horario/
├── index.html            # Estructura, diálogos accesibles, SEO
├── css/
│   ├── horario.css       # Estilos específicos de la app (calendario neutro)
│   └── print.css         # Base mínima de impresión (desacoplada)
├── js/
│   ├── utils.js          # Helpers puros: ids, tiempo (HH:mm), DOM seguro
│   ├── types.js          # Registro de tipos + derivación de color/contraste
│   ├── settings.js       # Estado de ajustes + validación (formato, rango)
│   ├── events.js         # Modelo ScheduleItem + CRUD/validación (sin DOM)
│   ├── schedule.js       # MOTOR: geometría + layout de solapamientos (puro)
│   └── app.js            # Controlador/vista: render, diálogos, wiring
└── README.md
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

## Cómo ejecutar localmente

Es estático. Cualquiera de estas opciones sirve:

```bash
# Opción A: abrir el archivo directamente
#   file:///.../agnerdiaz.com/horario/index.html

# Opción B: servidor estático desde la raíz del repo (recomendado, rutas /)
python -m http.server 8080
#   http://localhost:8080/horario/
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

## Qué falta (deliberado)

- Parser de PDF de la UASD (`uasd-parser.js`) y PDF.js.
- Persistencia (`storage.js` / localStorage) e importación/exportación JSON.
- Experiencia de impresión/PDF pulida.
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

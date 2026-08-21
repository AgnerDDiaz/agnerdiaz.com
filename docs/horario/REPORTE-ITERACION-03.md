# IMPLEMENTACIÓN HORARIO UASD — ITERACIÓN 03

```
Rama:         feature/horario-uasd-v1
SHA inicial:  0729d44cbd80cabb2283b36719ecbfb12cc6433c
SHA final:    pendiente — el commit lo crea el usuario (§38–39)
```

> Entorno: la shell de esta sesión es de **solo lectura** (no puede escribir en
> el working tree ni en `.git`). Node sí corre las pruebas. Los archivos se
> escribieron con las herramientas del asistente; `git commit/push` los ejecuta
> el usuario. Además, **la Iteración 02 seguía sin commit**: por eso su código y
> el de la 03 conviven en el working tree (no pude separar commits desde aquí).
> Recomendación de commits al final.

---

## 1. Problemas visuales corregidos

- Domingo (y Sábado) ya **nunca** desaparecen del PDF (era un swap de orientación
  de jsPDF que recortaba las columnas derechas; corregido).
- Eje horario ya no se recorta: `10:00 AM`/`11:00 AM`/`12:00 PM` se ven completos
  (antes clipping los dejaba como `0:00`).
- Nombres, lugares y profesores ya **no** terminan en `...` (ni en pantalla como
  única vía, ni en el PDF).
- El PDF ya no incluye cabecera/pie del navegador, URL de localhost, fecha del
  navegador ni `1/1`: es un documento generado, no una página impresa.
- Tarjetas con más ancho y mejor uso del espacio; el color del tipo tiene más
  presencia (tinte pastel + barra de acento + leyenda).

## 2. Arquitectura del nuevo renderer

Dos capas sobre los mismos `ScheduleItem[]` / `Types[]` / `Settings`:

- **Interactiva** (`app.js` + `horario.css`): calendario en pantalla.
- **PDF**: `pdf-layout.js` (geometría **pura**) + `pdf-export.js` (dibujo
  vectorial con jsPDF). El PDF no depende del DOM.

## 3. Archivos creados

- `horario/js/pdf-layout.js`
- `horario/js/pdf-export.js`
- `horario/tests/pdf-layout.test.js`
- `horario/REPORTE-ITERACION-03.md`

## 4. Archivos modificados

- `horario/js/types.js` — `semanticRole` + `system` + `derivePrintStyle` +
  `findBySemanticRole` + mensajes por rol.
- `horario/js/uasd-import.js` — clasifica por `semanticRole` (recibe `types`).
- `horario/js/events.js` — `typeId` por defecto `type-uasd`.
- `horario/js/app.js` — editor de tipos + leyenda + tooltip + flujo de export.
- `horario/index.html` — botón **Descargar PDF**, leyenda, diálogos de tipo y de
  export, scripts nuevos.
- `horario/css/horario.css` — eje/gutter, wrapping de tarjetas, leyenda, editor
  de tipos, diálogo de export.
- `horario/README.md`, `horario/tests/uasd-parser.test.js` (ids de tipo + test de
  estabilidad de `semanticRole`).

## 5. Nuevo comportamiento del horario desktop

7 columnas Lun–Dom con ancho mínimo (142px). Si el viewport no alcanza, hay
**scroll horizontal interno** del calendario (nunca del `<body>`). Eje de horas
con ancho fijo reservado. Verificado a 1920 (sin scroll) y 1024 (scroll interno).

## 6. Nuevo comportamiento móvil

≤760px arranca en **vista día** con chips Lun–Dom; existe conmutador Semana/Día
(semana con scroll horizontal interno). A 390px: sin overflow del body, modal con
scroll interno dentro del viewport.

## 7. Corrección del eje horario

Gutter ensanchado (72px) con `--hz-gutter`; etiqueta con `white-space: nowrap`
**solo** en el eje, alineada a la derecha con `left/right` reservados y
`tabular-nums`. La geometría reserva `timeGutterWidth` aparte de las columnas de
día. Verificado 12 h y 24 h sin clipping.

## 8. Nuevo diseño de tarjetas

Fondo tintado con el color del tipo (`rgba` 0.20) + borde relacionado + barra de
acento a la izquierda; texto sobre el color de texto del tema (contraste en
dark/light). Jerarquía: **título + sección**, lugar, profesor, y **hora abajo**.
Etiqueta con **punto de color + nombre del tipo** (el color no es el único
indicador). Wrapping por palabras (sin cortar palabras).

## 9. Cómo se evita perder información

- En pantalla: tarjetas con *wrapping* inteligente; en tarjetas pequeñas se
  compacta por prioridad, pero **todo** el dato sigue accesible con: click →
  diálogo de edición (muestra todos los campos), y **tooltip** en desktop
  (atributo `title` con la ficha completa). Además hay **leyenda** con nombres.
- En el PDF: **prohibido truncar** — se usa wrapping y la escala vertical crece
  hasta que quepa todo (§16–17).

## 10. Sistema de tipos

```
{ id, semanticRole, name, color, system }
```

- `id` — identificador interno inmutable (`type-uasd`, `type-hospital`,
  `type-virtual`, `type-personal`, o `type-…` para personalizados).
- `semanticRole` — rol funcional inmutable. El importador clasifica por aquí:
  `virtual`/`hospital`/`uasd`. Los personalizados llevan `""`.
- `name` — etiqueta visible, **editable**.
- `color` — color base, **editable**; tinte/borde/texto se derivan para contraste.
- `system` — `true` para uasd/hospital/virtual: no se eliminan y no cambian de rol.

## 11. Renombrado de tipos

`Configuración → Tipos de actividad → Editar`. Al editar un tipo del sistema se
muestra un mensaje no técnico (p. ej. UASD: “El importador seguirá utilizando
este tipo para identificar las clases que se imparten dentro de la UASD”). El
cambio de nombre se refleja de inmediato en tarjetas, leyenda, revisión y PDF.
`semanticRole` no cambia, así que el importador sigue clasificando igual.

## 12. Cambio de colores

Selector de color con **vista previa** tipo tarjeta en vivo. Al guardar se
recalculan tinte/borde y se re-renderiza el calendario, la leyenda y (al
exportar) el PDF.

## 13. Arquitectura PDF

`pdf-layout.computeLayout({items, types, settings, orientation, measure})`
(pura) → spec con página, gutter, 7 columnas, columnas de solape por día,
líneas de texto ya *wrapeadas* por evento y la escala global. `pdf-export`
carga jsPDF, crea un *doc* de medición (para `measure`), llama al layout, crea
el *doc* real del tamaño calculado, **dibuja** (texto y formas vectoriales) y
devuelve un `Blob` + descarga.

## 14. Librería PDF utilizada y versión

**jsPDF 2.5.2** (vectorial). CDN por defecto (`jspdf.umd.min.js`), con opt-in a
copia vendorizada vía `window.HORARIO_JSPDF = { vendor: true }`. La verificación
del PDF reutiliza **PDF.js 5.7.284**.

## 15. Cómo se calcula el layout

Rango = unión del rango visible con el extremo de todas las actividades (el PDF
**siempre** las incluye). Gutter = ancho de la etiqueta de hora más ancha. Ancho
de columna fijo por orientación (156pt horizontal / 96pt vertical); ancho de
página = gutter + 7·columna + márgenes. Solapes por día con el mismo motor
`schedule.layoutDayEvents`.

## 16. Cómo se calcula la escala vertical

Para cada evento se calcula `altura necesaria` (líneas de título + sección +
lugar + profesor + descripción + hora + paddings) a su ancho de columna (más
estrecho si hay solape). La escala global (pt/min) parte de un mínimo y se
sube a `max(minScale, max(necesaria_i / duración_i))`. Así `duración·escala ≥
necesaria` para **todos** los eventos: el PDF crece a lo alto, pero nada se corta.

## 17. Cómo se evita truncar texto

`measure.wrap` (jsPDF `splitTextToSize`) divide por palabras y **no** trunca; la
altura de la tarjeta se deriva de esas líneas y la escala garantiza el espacio.
Fuente mínima 8pt (no se reduce a texto microscópico). Verificado: título, lugar
y profesor largos aparecen completos en el PDF (sin `...`).

## 18. Orientación horizontal

Recomendada. Columnas más anchas (156pt) → mejor para nombres largos, hospitales
y profesores. Página ~1194×853pt con los 17 items reales.

## 19. Orientación vertical

Columnas más estrechas (96pt), más alto, misma escala-para-caber. **Los 7 días
siguen presentes** (Sábado y Domingo incluidos). Página ~774×1168pt.

## 20. Resultado con los 17 ScheduleItems

Import real → 17 actividades. Export (ambas orientaciones) → PDF releído con
PDF.js:

```
Días presentes:      Lunes … Domingo (7/7)
Actividades:         17 (0 recortadas)
Nombres completos:   OK (títulos, lugares, profesores)
Ellipsis "...":      ninguna
Chrome de navegador: ninguno (sin localhost/http/1/1)
```

## 21. Verificación Lunes–Domingo

Texto extraído del PDF contiene los 7 nombres de día en horizontal y vertical.
`missingDays: []` en ambas.

## 22. Verificación de títulos completos

Presentes p. ej. `Medicina de Urgencias y Desast`, `Nutrición (Medicina)`,
`Lab Fisiopatología II`. Prueba de título muy largo (§57): aparece completo.

## 23. Verificación de lugares completos

`FACULTAD DE INGENIERIA 104`, `LABORATORIO DE MEDICINA 177`, `INSTITUTO DE
CARDIOLOGIA 101`, `HOSP MATERNIDAD ALTAGRAC 101`, `EDIFICIO MARION 005`,
`CIENCIAS JURIDICAS A 206` — completos (sin `...`).

## 24. Verificación de profesores completos

`Petronila Martinez P` y demás aparecen completos y sin el marcador `( P )`.

## 25. Prueba 12 h

Eje y tarjetas en `7:00 AM … 12:00 PM … 11:00 PM`. Sin confundir `10` con `0`.

## 26. Prueba 24 h

Eje y tarjetas en `07:00 … 22:00`. Ambos formatos generan PDF correcto.

## 27. Prueba de tipo renombrado

`Dentro UASD → Campus UASD` (+color) y `Hospital / Fuera UASD → Rotaciones /
Hospital` (+color). Re-importando el PDF real, las clases se asignan a esos tipos
con los nuevos nombres/colores; `semanticRole` permanece `uasd`/`hospital`.
(Cubierto también por test automatizado.)

## 28. Prueba de colores

Editor con vista previa; al guardar, el color se refleja en tarjetas, leyenda y
PDF de inmediato.

## 29. Pruebas responsive

| Ancho | Vista | Días | Overflow body | Notas |
|------|-------|------|---------------|-------|
| 1920 | Semana | 7 | no | sin scroll interno |
| 1440 | Semana | 7 | no | (cubierto por 1920/1024) |
| 1024 | Semana | 7 | no | scroll horizontal interno |
| 768  | Semana/Día | — | no | scroll interno / día |
| 390  | Día | 1 + chips | no | modal dentro del viewport |

Eje sin clipping en todos.

## 30. Tests parser

```
$ node horario/tests/uasd-parser.test.js
=== 59 passed, 0 failed ===
```

## 31. Tests engine

```
$ node horario/tests/engine.test.js
=== 17 passed, 0 failed ===
```

## 32. Tests PDF

```
$ node horario/tests/pdf-layout.test.js
=== 24 passed, 0 failed ===
```

Verifican: expansión de rango, 7 columnas, escala ≥ mínima, **cada caja ≥ altura
necesaria (sin truncar)**, wrapping de título/lugar largos, solapes en columnas,
Domingo presente, horizontal más ancho que vertical, leyenda. Además, self-test
del PDF real con PDF.js (manual en `?dev=1`).

## 33. Errores encontrados

1. **Domingo/Sábado ausentes en horizontal**: jsPDF con `orientation:"portrait"`
   y `format:[w,h]` (w>h) reconvertía la página a vertical y recortaba las
   columnas derechas.
2. Probe del vendor de jsPDF/PDF.js podía ensuciar la consola (heredado).

## 34. Errores corregidos

1. `pdf-export` crea el *doc* con `orientation` y `format` derivados de la forma
   real de la página (landscape si `w≥h`). Reverificado: 7/7 días en ambas
   orientaciones.
2. Carga de jsPDF/PDF.js es opt-in a vendor; por defecto CDN sin peticiones al
   vendor → consola limpia (0 errores en flujos de la app).

## 35. Pendientes (deliberados)

- Persistencia (`storage.js` / localStorage) e import/export JSON.
- Vendorizado de jsPDF/PDF.js dentro del repo (hoy CDN; opt-in listo).
- Mini-preview de exportación (no P0).
- Publicación del enlace en el sitio / `main`.

## 36. `git diff --check`

Sin errores de whitespace (solo avisos `LF→CRLF` propios de Windows).

## 37. `git status`

```
 M horario/README.md
 M horario/css/horario.css
 M horario/index.html
 M horario/js/app.js
 M horario/js/events.js
 M horario/js/types.js
?? .gitignore
?? horario/REPORTE-ITERACION-02.md
?? horario/REPORTE-ITERACION-03.md
?? horario/js/pdf-export.js
?? horario/js/pdf-layout.js
?? horario/js/pdf-reader.js
?? horario/js/uasd-import.js
?? horario/js/uasd-parser.js
?? horario/tests/
```

`git ls-files "*.pdf"` → vacío (ningún PDF privado trackeado).

## 38. Commit

**No creado** (shell de solo lectura). Como la Iteración 02 no estaba en commit,
lo más limpio son **dos commits** (parser primero, rediseño después):

```bash
# 1) Baseline del importador (Iteración 02)
git add horario/js/pdf-reader.js horario/js/uasd-parser.js horario/js/uasd-import.js \
        horario/tests/uasd-parser.test.js horario/tests/engine.test.js \
        horario/tests/fixtures/uasd-sanitized.json horario/REPORTE-ITERACION-02.md .gitignore
git commit -m "feat(horario): add UASD PDF import engine"

# 2) Rediseño + exportación PDF (Iteración 03)
git add horario/
git commit -m "feat(horario): improve schedule UI and add PDF export"
```

(Si prefieres, un único `git add horario/ .gitignore` + un commit combinado
también es válido.)

## 39. Push

**No realizado.** Para subir (sin merge a `main`):

```bash
git push origin feature/horario-uasd-v1
```

---

**Nota sobre capturas:** en este entorno el panel del navegador no compone
frames, por lo que no pude capturar screenshots del calendario/configuración;
en su lugar adjunté los **PDF horizontal y vertical** generados desde los 17
items reales y verifiqué la UI vía DOM + self-test del PDF con PDF.js.

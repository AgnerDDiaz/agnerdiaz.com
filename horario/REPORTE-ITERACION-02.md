# IMPLEMENTACIÓN HORARIO UASD — ITERACIÓN 02

```
Rama:                       feature/horario-uasd-v1
SHA inicial:                0729d44cbd80cabb2283b36719ecbfb12cc6433c
SHA baseline Iteración 01:  0729d44cbd80cabb2283b36719ecbfb12cc6433c  (commit "inclusion de horario")
SHA final:                  pendiente — el commit lo crea el usuario (ver §25–26)
PDF.js versión:             5.7.284 (CDN por defecto; vendorizable)
```

> Nota de entorno: en esta sesión la shell es de **solo lectura** a nivel de SO
> (no puede escribir en el working tree ni en `.git`). Todos los archivos se
> escribieron con las herramientas del asistente; `git commit/push` debe
> ejecutarlos el usuario (comandos al final). Node sí se ejecutó para las pruebas.

---

## 1. Arquitectura del importador

Pipeline por capas, cada una comprobable de forma independiente y sin que el
motor del calendario dependa del parser:

```
PDF → pdf-reader.extractPdfDocument() → DocumentText
    → uasd-parser.parseUasdDocument()  → UasdImportResult
    → uasd-import.convertToScheduleItems() → ScheduleItem[]
    → (revisión + confirmar) → events store → calendario
```

- `pdf-reader.js`: PDF → texto estructurado (líneas con tokens `{text,x,y,w,h}`).
  No conoce materias/UASD. Carga PDF.js (CDN o vendor) y reconstruye líneas.
- `uasd-parser.js`: **puro**, sin DOM ni PDF.js. Toda la lógica del formato UASD.
- `uasd-import.js`: adaptador modelo→`ScheduleItem[]` + reglas de importación.
- `app.js`: solo UI (selección, progreso, revisión, confirmar, reemplazar/agregar).

## 2. Archivos creados

- `horario/js/pdf-reader.js`
- `horario/js/uasd-parser.js`
- `horario/js/uasd-import.js`
- `horario/tests/uasd-parser.test.js`
- `horario/tests/engine.test.js`
- `horario/tests/fixtures/uasd-sanitized.json`  (fixture SIN datos personales)
- `horario/REPORTE-ITERACION-02.md`  (este informe)
- `.gitignore`  (ignora `horario/tests/fixtures/private/` y `*.pdf`)

## 3. Archivos modificados

- `horario/index.html` — scripts nuevos, flag `HORARIO_PDFJS`, diálogos de import
  y revisión.
- `horario/css/horario.css` — estilos de import/revisión (dropzone, spinner,
  lista de revisión, diagnóstico).
- `horario/js/app.js` — flujo de importación (reemplaza el placeholder).
- `horario/js/events.js` — metadata opcional `importId`/`courseKey`/`meetingKey`
  en `ScheduleItem` (no rompe ítems manuales).
- `horario/README.md` — documentación de la Iteración 02.

**No** se tocaron `index.html` (raíz), `/projects/`, FinClarity, i18n globales,
`styles.css` ni `main.js`.

## 4. Cómo se extrae el PDF

PDF.js `getDocument().promise` + `page.getTextContent()`. De cada `item` se
conservan `str` y las coordenadas de `item.transform` (`x=transform[4]`,
`y=transform[5]`) más `width`. Todo ocurre en el navegador; el PDF nunca sale
del dispositivo. El worker se carga como *blob* same-origin (CDN) para evitar
restricciones de worker cross-origin.

## 5. Cómo se reconstruyen las líneas/celdas

- **Líneas:** se agrupan tokens por Y con tolerancia (3.5) y se ordenan por X.
- **Celdas/columnas:** la tabla de reuniones se resuelve por **posición X**. Se
  detecta la fila de encabezado (`Tipo Hora Días Dónde Rango de Fecha Tipo de
  Horario Instructores`) y se leen las X de cada columna **dinámicamente** (las X
  cambian entre páginas — verificado: Días@175 en p.1 vs @146 en p.5). Cada token
  se asigna a la columna de X más cercana.
- **Celdas multilínea:** una reunión puede ocupar 2 líneas visuales; se agrupan
  por columna y se concatenan en orden de lectura → `FACULTAD DE` + `INGENIERIA
  104` = `FACULTAD DE INGENIERIA 104`; `12:00 PM -` + `3:50 PM` = `12:00 PM -
  3:50 PM`.

## 6. Cómo se detectan materias

Patrón final `Título - CÓDIGO - SECCIÓN`, interpretado **desde el final**
(`/^(.+?) - ([A-Z]{2,4} \d{3,4}) - ([A-Za-z0-9]+)$/`). El título puede tener
espacios, acentos, paréntesis, `Lab`/`LAB`, números romanos. La **sección se
conserva como string** (`02`, `08`, `07`, `W05`, `W12`), nunca como número.

## 7. Cómo se detectan reuniones

Dentro de una tabla, una **nueva reunión** empieza cuando aparece un token en la
columna `Tipo` (`Class`). Las líneas sin token en `Tipo` son continuación de la
reunión actual. Se acumulan tokens por columna y se construyen las celdas.

## 8. Cómo se manejan page breaks

El parser procesa un **flujo continuo de líneas** de todas las páginas en orden e
ignora el ruido de pie/encabezado (`Página X de 7`, URLs, `MAPA DE SITIO`…). El
estado de la materia actual y su tabla **cruzan el salto de página**; solo una
nueva línea de encabezado de materia cambia la materia. Casos reales cubiertos:
`BAN 3170` (p.1→p.2), `CFI 1570` (p.2→p.3), `CFI 2470` (p.3→p.4), `FAR 3510`
(p.4→p.5), `MIP 1240` (p.5→p.6), `SAP 1180` (p.6→p.7). Con prueba específica.

## 9. Cómo se interpretan días

Mapa `L→monday, M→tuesday, I→wednesday, J→thursday, V→friday, S→saturday,
D→sunday` (I = Miércoles; nunca `X`). `expandDayCodes("LMI")` →
`[monday, tuesday, wednesday]`. Una reunión con varios días produce varios items.

## 10. Cómo se interpretan horas

Función pura `parseTimeRange("7:00 PM - 9:50 PM")` → `{startTime:"19:00",
endTime:"21:50"}`. `parseClock` maneja 12 AM=00, 12 PM=12, AM/PM, espacios
variables y el corte de línea entre hora y `AM/PM`. Si no se puede interpretar,
**no se inventa**: se marca la reunión como sin horario / se registra warning.

## 11. Regla PA con horario

`Hora` válida + `Dónde: PA` → clasificación **Virtual**, conservando
`location: "PA"` (ej. `Fisiopatología II - CFI 1560 - W05`, Jueves 19:00–21:50).

## 12. Regla PA/PA

`Hora: PA` (sin horario) → **Domingo 08:00–09:00**, `autoScheduled: true`, con
warning `UNSCHEDULED_AUTO_ASSIGNED`. Si hubiera varias, todas van a la misma
franja (el motor las coloca en columnas). Ej. `Nutrición (Medicina) - FAR 3510 - W12`.

## 13. Clasificación UASD / Hospital / Virtual

Función pura `classifyUasdCourse(course, meeting)` (reglas, no nombres):
`virtual` si el método contiene `Virtual`/`Internet` **o** `location === "PA"`;
`hospital` si `location` contiene `HOSP`/`HOSPITAL`/`MATERNIDAD`; `uasd` en
cualquier otro caso. La clasificación nunca impide importar; el usuario puede
cambiarla luego.

## 14. Resultado del PDF real

Ejecutado en el navegador con el PDF real (pipeline completo: PDF.js → extracción
→ reconstrucción → parser → adaptador):

```
Materias:       12
Reuniones:      15
ScheduleItems:  17
AutoScheduled:  1
Warnings:       1   (UNSCHEDULED_AUTO_ASSIGNED — FAR-3510-W12, página 5)
Errors:         0
```

## 15. Tabla de los 17 ScheduleItems generados

| # | Materia | Código | Sec | Día | Inicio | Fin | Lugar | Tipo | Auto |
|---|---------|--------|-----|-----|--------|-----|-------|------|------|
| 1 | Hematología Médica | BAN 3160 | 19 | Viernes | 12:00 | 15:50 | FACULTAD DE INGENIERIA 104 | Dentro UASD | no |
| 2 | Lab Hematología Médica | BAN 3170 | 56 | Martes | 07:00 | 09:50 | LABORATORIO DE MEDICINA 177 | Dentro UASD | no |
| 3 | Fisiopatología II | CFI 1560 | W05 | Jueves | 19:00 | 21:50 | PA | Virtual | no |
| 4 | Lab Fisiopatología II | CFI 1570 | 35 | Jueves | 10:00 | 12:50 | INSTITUTO DE CARDIOLOGIA 101 | Dentro UASD | no |
| 5 | Farmacología | CFI 2460 | 25 | Lunes | 14:00 | 15:50 | ESCUELA DE MEDICINA 207 | Dentro UASD | no |
| 6 | Farmacología | CFI 2460 | 25 | Martes | 20:00 | 21:50 | INST DE ANATOMIA 005 | Dentro UASD | no |
| 7 | Lab Farmacología | CFI 2470 | 23 | Jueves | 07:00 | 09:50 | INST DE ANATOMIA 032 | Dentro UASD | no |
| 8 | Anatomía Patológica I | CMO 2280 | 16 | Jueves | 14:00 | 15:50 | ESCUELA DE MEDICINA 209 | Dentro UASD | no |
| 9 | Anatomía Patológica I | CMO 2280 | 16 | Viernes | 16:00 | 17:50 | ESCUELA DE MEDICINA 210 | Dentro UASD | no |
| 10 | Nutrición (Medicina) | FAR 3510 | W12 | Domingo | 08:00 | 09:00 | — | Virtual | **sí** |
| 11 | Sexología Médica | MED 1360 | 02 | Lunes | 07:00 | 08:50 | HOSP MATERNIDAD ALTAGRAC 101 | Hospital / Fuera UASD | no |
| 12 | Parasitología | MIP 1240 | 08 | Lunes | 18:00 | 19:50 | CIENCIAS JURIDICAS A 206 | Dentro UASD | no |
| 13 | Parasitología | MIP 1240 | 08 | Miércoles | 18:00 | 19:50 | CIENCIAS MODERNAS 112 | Dentro UASD | no |
| 14 | LAB Parasitología | MIP 1240 | 42 | Lunes | 10:00 | 11:50 | FACULTAD DE CIENCIAS 185 | Dentro UASD | no |
| 15 | LAB Parasitología | MIP 1240 | 42 | Martes | 10:00 | 11:50 | FACULTAD DE CIENCIAS 185 | Dentro UASD | no |
| 16 | LAB Parasitología | MIP 1240 | 42 | Miércoles | 10:00 | 11:50 | FACULTAD DE CIENCIAS 185 | Dentro UASD | no |
| 17 | Medicina de Urgencias y Desast | SAP 1180 | 07 | Martes | 16:00 | 18:50 | EDIFICIO MARION 005 | Dentro UASD | no |

Secciones con cero inicial verificadas: `02`, `08`, `07` (strings). `W05`/`W12` OK.

## 16. Pruebas automatizadas

Comando y resultado reales:

```
$ node horario/tests/uasd-parser.test.js
=== 54 passed, 0 failed ===

$ node horario/tests/engine.test.js
=== 17 passed, 0 failed ===
```

Cubren: encabezado (incl. `02`, título con paréntesis, título truncado), horas
(AM, PM, 12 PM, 12 AM, corte de línea), días (`LMI`, `I`=Miércoles, `PA`, código
desconocido), `stripInstructorMarker` (`( P )`/`(P)`), clasificación
(virtual/hospital/uasd), page break (encabezado en pág. N, reunión en N+1) e
**integración** con el fixture sanitizado (12/15/17/1 + los 17 items exactos:
título, código, sección, día, hora, lugar, tipo, `autoScheduled`).

## 17. Prueba PDF real

**EJECUTADA.** El PDF real (`Horario de Detalle de Alumno.pdf`, provisto por el
usuario) se procesó por el pipeline completo en el navegador (PDF.js 5.7.284 →
extracción → reconstrucción → parser → adaptador) con resultado 12 / 15 / 17 / 1
y **0 errores**, y los 17 items coinciden exactamente con la tabla de §15.

## 18. Pruebas UI

En `http://localhost:8100/horario/?dev=1` (servidor estático local):

- Selector de archivo + validación (`.pdf`, MIME, firma `%PDF-`, tamaño). Un
  `.txt` se rechaza con mensaje claro.
- Progreso “Analizando horario… Página X de 7”.
- Pantalla de revisión: `12 materias · 15 reuniones · 17 bloques · 1 automático`,
  lista agrupada por materia, `W05`/`W12`/`02` visibles, Nutrición con ⚠
  “Sin horario definido → Domingo · 08:00–09:00”.
- Confirmar → 17 tarjetas en el calendario (semana), distribuidas Lun 4 / Mar 4 /
  Mié 2 / Jue 4 / Vie 2 / Dom 1; `LAB Parasitología` en Lun/Mar/Mié.
- Importación **atómica**: el estado solo cambia al pulsar “Crear mi horario”.
- Reimportar: aparece “Reemplazar / Agregar”; *replace* mantiene los 17 y
  conserva los manuales; *add* deduplica (“17 ya existían y fueron omitidas”).
- Documento no-UASD → “No pudimos reconocer este archivo…”, sin importar nada.
- `?dev=1`: botón “Ver diagnóstico” (stats/warnings/courses) **sin** datos
  personales del encabezado.
- **Sin errores de consola**, sin `undefined`/`null`, sin `(P)` en profesores,
  lugares multilínea unidos.

## 19. Errores encontrados

- El probe del vendor de PDF.js (`fetch` HEAD a una ruta inexistente) generaba un
  `404` en la consola.
- Los chips de día se veían en vista semana (regresión de estilo detectada en
  Iteración 01; ya corregida entonces).

## 20. Errores corregidos

- PDF.js: la carga del vendor ahora es **opt-in** (`window.HORARIO_PDFJS =
  { vendor: true }`); por defecto no se hace ninguna petición al vendor →
  consola limpia. Reverificado: sin errores de consola.

## 21. Casos que podrían requerir más PDFs UASD

- Materias con **más de 2 líneas** por celda, o encabezados de tabla partidos de
  forma distinta.
- Otros métodos educativos / tipos de horario no vistos (semipresencial, etc.).
- Documentos de **otras facultades** (códigos con longitudes o formatos atípicos).
- Combinaciones de días poco comunes o secciones con formatos nuevos.
Las reglas son generales (posición de columnas + patrones), no dependen de
nombres de materia, por lo que deberían generalizar; conviene validar con más
muestras reales cuando estén disponibles.

## 22. Privacidad

- El PDF real **no** está en Git (`git ls-files "*.pdf"` → vacío).
- `.gitignore` ignora `horario/tests/fixtures/private/` y `*.pdf`.
- El fixture `uasd-sanitized.json` **no** contiene nombre ni matrícula del
  estudiante (verificado por regex) y anonimiza los nombres de instructores.
- El PDF se procesa 100 % en el navegador; no se sube a ningún servidor.

## 23. `git diff --check`

Sin errores de whitespace. Solo avisos informativos de fin de línea
(`LF will be replaced by CRLF`) propios de Windows.

## 24. `git status` (final)

```
 M horario/README.md
 M horario/css/horario.css
 M horario/index.html
 M horario/js/app.js
 M horario/js/events.js
?? .gitignore
?? horario/js/pdf-reader.js
?? horario/js/uasd-import.js
?? horario/js/uasd-parser.js
?? horario/tests/
```

## 25. Commit

**No creado** (shell de solo lectura en esta sesión). Para crearlo:

```bash
git add horario/ .gitignore
git commit -m "feat(horario): add UASD PDF import engine"
```

## 26. Push

**No realizado.** Para subir a la rama (no hacer merge a `main`):

```bash
git push -u origin feature/horario-uasd-v1
```

> Recuerda colocar el PDF real en `horario/tests/fixtures/private/` (queda
> gitignored) si quieres reejecutar la prueba real localmente en tu otra máquina.

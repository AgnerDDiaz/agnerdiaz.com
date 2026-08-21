---
title: Horario UASD
tagline:
  es: Convierte el PDF oficial de la UASD en un horario semanal editable.
  en: Turns the official UASD PDF into an editable weekly schedule.
role:
  es: Diseño y desarrollo completo
  en: Full design & development
kind: tool
status: live
featured: true
order: 3
period:
  start: "2025"
  end: null
platforms: [web]
tech: [javascript, github]
metrics:
  - value: "100% local"
    label:
      es: El PDF nunca sale del navegador
      en: The PDF never leaves the browser
  - value: "145"
    label:
      es: Pruebas automatizadas
      en: Automated tests
overview:
  es: >
    Horario UASD convierte el PDF oficial de «Horario de Detalle de Alumno» en un
    calendario semanal claro. Lee el PDF en el propio navegador —nunca se sube a
    ningún servidor—, reconoce materias, secciones, aulas y profesores, y clasifica
    cada clase según el edificio real del campus. Todo queda editable a mano, los
    tipos y colores son configurables, y el horario se exporta a PDF vectorial.
  en: >
    Horario UASD turns the official "Horario de Detalle de Alumno" PDF into a clear
    weekly calendar. It reads the PDF entirely in the browser — nothing is ever
    uploaded — recognising courses, sections, rooms and lecturers, and classifying
    each class by the actual campus building. Everything stays editable by hand,
    types and colours are configurable, and the schedule exports to a vector PDF.
highlights:
  es:
    - Motor de calendario puro con manejo de solapamientos, cubierto por pruebas.
    - Parser del PDF de la UASD por columnas, robusto a saltos de página.
    - Exportación a PDF vectorial y persistencia local.
  en:
    - Pure calendar engine with overlap handling, covered by tests.
    - Column-based UASD PDF parser, robust to page breaks.
    - Vector PDF export and local persistence.
links:
  live: /horario/
  repo: https://github.com/AgnerDDiaz/agnerdiaz.com
accent: "#D90429"
---

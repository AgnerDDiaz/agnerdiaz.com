Los archivos y carpetas que empiezan con `_` no generan rutas en Astro.

Este archivo solo existe para que `src/pages/` esté versionado durante la
Fase 0, cuando todas las páginas todavía se sirven como HTML estático desde
`public/`. Se borra en la Fase 1, al crear `src/pages/[lang]/index.astro`.

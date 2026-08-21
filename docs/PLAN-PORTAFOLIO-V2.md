# Plan de acción — Portafolio v2

**Decisiones tomadas:** Astro (build estático) · Sitio 100% bilingüe ES/EN
**Rama de trabajo propuesta:** `feature/portfolio-v2`
**Estado actual:** sitio estático HTML/CSS/JS en Netlify, sin build.

---

## 1. Diagnóstico del código actual

### 1.1 Lo que funciona y hay que conservar

| Activo | Por qué se conserva |
|---|---|
| Tokens CSS en `assets/css/styles.css` (`--bg`, `--surface`, `--accent`, `--radius`, `--transition`) | Es un design system real. Solo hay que separarlo en archivos. |
| Script anti-flash de tema (inline en `<head>`) | Correcto: aplica el tema antes del primer paint. Se mueve al layout base. |
| Patrón de `/horario/` | Ya hace lo correcto: app aislada que consume los tokens globales. **Este es el patrón a formalizar.** |
| Formulario Netlify + honeypot `bot-field` | Cumple el requisito de no exponer el correo. Se mantiene igual. |
| Paleta negro `#0A0A0B` + rojo `#D90429` | Distintiva y coherente. El problema no es el color, es el ritmo visual. |

### 1.2 Problemas estructurales

**P1 — Contenido hardcodeado y duplicado.**
Agregar un proyecto hoy exige tocar 6 sitios: `index.html`, `projects/index.html`, crear `projects/<slug>/index.html`, `assets/i18n/es.json`, `assets/i18n/en.json` y el `PROJECT_TECH_MAP` dentro de `assets/js/main.js`. Es exactamente el dolor que quieres eliminar.

**P2 — El header/nav/footer está copiado 7 veces.**
`index.html`, `projects/index.html`, `projects/finclarity/index.html`, `links/index.html`, `privacy/finclarity/index.html`, `support/finclarity/index.html`, `horario/index.html`. Cada uno repite además el script de tema completo. Cambiar un ítem del menú = 7 ediciones.

**P3 — El sitio está desactualizado respecto al CV.** Es el problema más grave, porque es el que te cuesta oportunidades:

| El sitio dice hoy | El CV dice |
|---|---|
| "próximo a graduarme (abril 2026)" | Ingeniero de Software, INTEC 2026 (graduado) |
| "Pasante — DGII, Nov 2025 — Presente" | DGII fue Nov 2025 – Abr 2026, como **Desarrollador de Aplicaciones** |
| No existe | **EDESUR — Analista de Software** (Jun 2026 – Actualidad) |
| No existe | **Top1Solutions — Flutter Developer** (Feb 2026 – Actualidad) |
| "FinClarity: preparado para publicación" | FinClarity **publicado** en App Store y Google Play |
| 3 certificaciones | 4 (falta *Talento Digital – Ciberseguridad, 2026*) |

Y faltan las métricas que más pesan en una entrevista: **app en producción para ~1,000 brigadistas**, **4 apps móviles/tablet en Flutter**, **2 publicaciones en Google Play + 2 en App Store**, **Oracle/.NET a escala empresarial**.

**P4 — Módulo de proyectos incompleto.** `projects/index.html` lista 3 proyectos (FinClarity, MercaVerde, Horario UASD) pero MercaVerde apunta a "Coming soon", y el detalle de FinClarity —la única página de detalle que existe— tiene placeholders vacíos de capturas (`.shot__ph`). No hay filtros, ni orden, ni detalle para los otros dos.

**P5 — Certificaciones sin estructura.** 3 tarjetas fijas en HTML, sin fecha, sin orden, sin visor, con un enlace a una carpeta de Google Drive. No es un módulo, es un adorno.

**P6 — Dependencia externa no fijada.** Todos los iconos de tecnologías salen de `cdn.jsdelivr.net/gh/devicons/devicon@latest`. `@latest` significa que un cambio en un repo de terceros puede romper o alterar tu portafolio sin que toques nada. Hay que auto-hospedar los SVG.

**P7 — Ruido en el repo.** `zztest.txt`, `.DS_Store` versionados. `README.md` de 2 líneas.

**P8 — Trampa en `.gitignore`.** La línea `*.pdf` (puesta para proteger los PDFs privados de la UASD) **bloqueará los PDFs de tus certificados** en cuanto quieras publicarlos. Hay que hacer la excepción explícita.

---

## 2. Arquitectura objetivo

### 2.1 Estructura de carpetas

```
agnerdiaz.com/
├─ astro.config.mjs
├─ netlify.toml                 # build + redirects 301 de las URLs viejas
├─ package.json
│
├─ public/                      # servido tal cual, URLs estables
│  ├─ app-ads.txt  robots.txt
│  ├─ assets/css/               # ← contrato de URL compartido con las micro-apps
│  │  └─ styles.css · tokens.css · base.css · typography.css · components/
│  ├─ img/{profile,og,tech,projects}/
│  ├─ certs/*.pdf
│  ├─ cv/Agner_Diaz_CV_{ES,EN}.pdf
│  └─ horario/                  # micro-app existente, intacta
│
├─ src/
│  ├─ content/                  # ← TODO el contenido vive aquí
│  │  ├─ config.ts              # esquemas Zod = contrato tipado
│  │  ├─ projects/      {slug}.{es,en}.md
│  │  ├─ experience/    {slug}.{es,en}.md
│  │  └─ certifications/{slug}.md
│  │
│  ├─ data/
│  │  ├─ site.ts                # nombre, redes, email, dominio
│  │  ├─ tech.ts                # registro ÚNICO de tecnologías
│  │  └─ nav.ts
│  │
│  ├─ i18n/  {es,en}.json · ui.ts · routes.ts
│  │
│  ├─ layouts/
│  │  ├─ BaseLayout.astro       # head, SEO, JSON-LD, tema, nav, footer
│  │  ├─ ProjectLayout.astro
│  │  └─ LegalLayout.astro
│  │
│  ├─ components/
│  │  ├─ nav/       Header · MobileMenu · ThemeToggle · LangToggle
│  │  ├─ ui/        Section · Card · Button · Badge · TechChip · Modal
│  │  ├─ home/      Hero · About · Timeline · SkillsGrid · Metrics · ContactForm
│  │  ├─ projects/  ProjectCard · ProjectGrid · Filters · PhoneMockup · Gallery
│  │  └─ certs/     CertCard · CertViewer
│  │
│  ├─ styles/                  # solo lo que deba pasar por el bundler
│  │                           # (los tokens globales viven en public/, ver D1)
│  │
│  └─ pages/
│     ├─ index.astro                        # redirect por idioma
│     └─ [lang]/
│        ├─ index.astro                     # portafolio principal
│        ├─ proyectos/index.astro
│        ├─ proyectos/[slug].astro
│        ├─ certificaciones.astro
│        ├─ links.astro
│        └─ legal/[project]/[doc].astro     # privacy · support · terms
│
├─ tests/horario/               # tests del motor (CommonJS) — fuera de public/
└─ docs/  PLAN-PORTAFOLIO-V2.md · CONTENIDO.md · horario/
```

### 2.2 El contrato de datos (`src/content/config.ts`)

Esto es el corazón del "hacerlo fácil": defines el esquema una vez y Astro te valida cada archivo en el build. Si a un proyecto le falta el `slug` o pones una fecha inválida, **el build falla** en vez de publicarse roto.

**Proyecto**
```
slug, title, tagline, role, period {start, end|null}
kind: 'mobile' | 'web' | 'tool'
status: 'live' | 'wip' | 'archived'
featured: boolean, order: number
tech: string[]                       # ids del registro de src/data/tech.ts
platforms: ('ios'|'android'|'web')[]
metrics: [{ label, value }]          # "Usuarios en producción" · "~1,000"
highlights: string[]                 # 3–5 logros concretos
links: { appStore?, googlePlay?, repo?, live?, demo? }
legal: { privacy: bool, support: bool, terms: bool }
cover, screenshots: [{ src, alt, caption? }]
--- (cuerpo Markdown: problema → solución → decisiones técnicas → resultado)
```

**Experiencia**
```
company, role, location, start, end|null
type: 'fulltime' | 'internship' | 'contract'
confidential: boolean               # oculta detalles sensibles (DGII, Banreservas)
summary, bullets: string[], tech: string[]
```

**Certificación**
```
slug, name, issuer, issuedAt: 'YYYY-MM', expiresAt?
credentialId?, credentialUrl?
file: '/certs/x.pdf', thumb: '/img/certs/x.png'
tags: string[]
```
El orden cronológico descendente sale solo de `issuedAt`. Nunca más lo ordenas a mano.

### 2.3 Cómo se agregan cosas después de la reestructuración

| Quiero… | Trabajo requerido |
|---|---|
| Agregar un proyecto | 2 archivos `.md` (es/en) + su carpeta de imágenes. La ruta, la tarjeta en el home, el filtro, el sitemap y el OG salen automáticos. |
| Agregar una experiencia | 2 archivos `.md`. Entra sola en el timeline, ordenada por fecha. |
| Agregar un certificado | 1 archivo `.md` + el PDF en `public/certs/`. Se ordena y se hace visualizable solo. |
| Agregar una micro-app tipo Horario | Carpeta en `public/<slug>/` que enlaza `tokens.css` + 1 archivo de proyecto que la presenta. |
| Cambiar el menú | 1 archivo: `src/data/nav.ts`. |
| Publicar legales de una app nueva | Poner `legal: { privacy: true, support: true, terms: true }`. Las 3 páginas se generan del template. |

---

## 3. Fases de ejecución

### Fase 0 — Preparación (sin cambios visibles) — ✅ COMPLETADA

1. ✅ Rama `feature/portfolio-v2`.
2. ✅ Astro **7.2.4** sobre el repo (`npm install astro`), Node 24.
3. ✅ `netlify.toml`: `npm run build` → `dist`, Node 24, cabeceras de seguridad y caché.
4. ✅ Todo el sitio movido a `public/` con `git mv` (41 renombrados). **Ninguna URL cambió**, así que los redirects 301 no hacen falta todavía: se añaden en la Fase 1.
5. ✅ Limpieza: `zztest.txt` y los tres `.DS_Store` fuera; `.gitignore` reescrito con las excepciones `!public/certs/*.pdf` y `!public/cv/*.pdf`.
6. ✅ Tests de Horario UASD movidos de `public/horario/tests/` a `tests/horario/`, y los reportes de iteración a `docs/horario/` — ya no se publican a producción.
7. ⏳ **Pendiente**: partir `styles.css` (1158 líneas) en `tokens / base / typography / components / utilities`.
8. ⏳ **Pendiente**: auto-hospedar los SVG de devicon en `public/img/tech/` y construir `src/data/tech.ts` (resuelve P6).

**Criterio de salida:** ✅ `dist/` es byte a byte idéntico a `public/` (`diff -rq` limpio), los 145 tests pasan y `npm audit` reporta 0 vulnerabilidades.

#### Decisiones tomadas durante la Fase 0

**D1 — El CSS global vive en `public/assets/css/`, no en `src/styles/`.**
Las micro-apps (`/horario/`) son HTML estático que no pasa por el bundler de Astro. Si Astro versiona la hoja de estilos con un hash, esas apps se quedan sin los tokens del tema. Una URL estable es el contrato que las mantiene integradas. `src/styles/` queda reservado para estilos que sí deban pasar por el bundler.

**D2 — No se declara `"type": "module"` en `package.json`.**
`astro.config.mjs` ya es ESM por su extensión. Marcar el proyecto entero como ESM hace que Node trate `public/horario/js/*.js` (scripts clásicos de navegador) como módulos ESM. Como los módulos ESM no viven en `require.cache`, el `delete require.cache[...]` de `storage.test.js` deja de tener efecto y el test falla. Detectado y corregido durante la migración.

**D3 — Astro 7 en vez de Astro 5.**
El plan original apuntaba a Astro 5. Astro 5 arrastra 8 avisos de seguridad (XSS en `define:vars`, en spread props y en directivas `transition:*`) — justo las funciones que va a usar el portafolio. Con 0 páginas escritas, migrar costaba cero.

**D4 — `trailingSlash: "always"`.**
Las URLs legales (`/privacy/finclarity/`) ya están publicadas en App Store y Google Play. Cambiar el formato de barra final las rompería.

### Fase 1 — Sistema base
- `BaseLayout.astro`: `<head>` con SEO + OG + `hreflang`, script anti-flash, JSON-LD `Person`.
- `Header` / `Footer` / `MobileMenu` / `ThemeToggle` / `LangToggle` como componentes únicos → **elimina P2**.
- i18n por ruta: `/es/…` y `/en/…`, con `/` redirigiendo según `Accept-Language` y preferencia guardada. Esto es mejor que el i18n actual por JS: cada idioma tiene su URL indexable.

**Criterio de salida:** cero HTML duplicado; el menú se edita en un archivo.

**Ajustes por feedback del usuario (post-revisión de la home):**
- Eliminado el botón de descarga de CV del hero (el contacto es por el formulario).
- Eliminada la banda de 4 métricas.
- Página de links reconstruida en el sistema nuevo: `/[lang]/links/` (linktree
  bilingüe con header minimal, avatar, rol dinámico y botones data-driven desde
  `src/data/links.ts`). Pendiente: redirigir el viejo `/links/` al nuevo al publicar.

### Fase 2 — Contenido real (cerrar la brecha con el CV)
- Reescribir perfil y "Sobre mí" con el posicionamiento actual del CV: *Ingeniero de Software | Desarrollador Flutter | Analista de Software*, ya graduado.
- **Timeline vertical** reemplazando las 3 tarjetas de experiencia: EDESUR → Top1Solutions → DGII → Banreservas → Hershey. Escala a 10 empleos sin romperse.
- **Banda de métricas** bajo el hero: `4 apps móviles` · `~1,000 usuarios en producción` · `4 publicaciones en tiendas` · `Flutter · .NET · Oracle`. Es la prueba social que hoy no existe.
- Skills reagrupados en las 6 categorías del CV (Móvil/Frontend · Backend e Integraciones · Bases de Datos · Herramientas y Calidad · Metodologías · Adicionales) en lugar de una nube plana de 17 logos.
- Añadir *Talento Digital – Ciberseguridad, Nivel Intermedio (2026)*.
- Botón de descarga de CV en ES y EN.

**Criterio de salida:** cualquier reclutador que compare tu CV y tu sitio ve lo mismo.

### Fase 3 — Módulo de Proyectos — ✅ COMPLETADA
- ✅ `/[lang]/proyectos/`: grid con **filtros por tipo** (Móvil · Web · Herramientas), toggle en cliente.
- ✅ `/[lang]/proyectos/[slug]/`: hero con **mockup de teléfono**, estado, rol, período, plataformas, resumen, destacados, **galería de capturas** y chips de stack. Botones de tienda/repo/live condicionales.
- ✅ Fichas: **FinClarity** (publicado), **MercaVerde** (en desarrollo), **Horario UASD** (herramienta).
- ✅ `PhoneMockup`: marco de teléfono con estado «Captura próximamente» cuando no hay imagen.
- ✅ `ProjectCard` unificado: la home y el listado usan el mismo componente; la tarjeta entera enlaza al detalle.
- ✅ Carpetas `public/img/projects/<slug>/` con README para soltar capturas.
- ⏳ **Pendiente del usuario**: capturas de FinClarity y MercaVerde + URLs de App Store/Google Play. Los enlaces legales del detalle se activan en la Fase 5.

**Criterio de salida:** ✅ agregar un proyecto = 1 archivo `.md`; el detalle, el listado, el filtro y la tarjeta salen solos.

### Fase 4 — Módulo de Certificados — ✅ COMPLETADA (adelantada)
El usuario aportó los 16 archivos, así que esta fase se adelantó.
- ✅ 14 certificados reales en `public/certs/` (se descartó 1 duplicado exacto por folio; 1 par Fortinet FCA + curso base).
- ✅ Contenido tipado en `src/content/certifications/` (un `.md` por certificado), con emisor, fecha e id/URL de verificación extraídos de los propios PDFs.
- ✅ Home: 4 destacados (INDOTEL, Fortinet FCA, SAS, Huawei) + «Ver todas (14)».
- ✅ Página `/[lang]/certificaciones/`: grid **agrupado por año** (2026→2023), orden descendente automático por `issuedAt`.
- ✅ **Visor modal** con `<dialog>` nativo (foco atrapado + `Esc` + backdrop): PDF en `<iframe>`, PNG en `<img>`, botón «Abrir en pestaña» y «Verificar» solo si hay `credentialUrl`.
- ✅ Se elimina la dependencia del enlace a Google Drive.
- ⏳ **Pendiente de confirmar por el usuario**: fecha exacta de los certificados marcados `dateApprox: true` (ISOC ×2, Search and AI, SAS, Huawei) y el emisor de «Search and AI» (asumido Google).

### Fase 5 — Legales por proyecto — ✅ COMPLETADA
**Una sola web aloja los legales de todas tus apps.**
- ✅ Ruta genérica `/[lang]/legal/[app]/[privacy|support|terms]/` (bilingüe).
- ✅ Plantilla parametrizada (`src/data/legal.ts`): nombre de app, email de soporte, fecha de actualización, `usesAds` (AdMob), `offlineFirst`. El texto se genera según esos flags.
- ✅ FinClarity con Privacidad, Soporte y **Términos y Condiciones** (nuevos, que App Store exige).
- ✅ Botones legales reactivados en la ficha de proyecto, desde el registro legal.
- ✅ Publicar una app nueva = una entrada en `legalApps` (sin dominio ni hosting extra).
- ⏳ **Al publicar**: los legales viejos en `public/privacy/finclarity/` y `public/support/finclarity/` siguen en su URL original (publicada en las tiendas). Decidir si se redirigen a las nuevas o se dejan como están.

### Fase 6 — Migrar páginas viejas + redirects — ✅ COMPLETADA
**Objetivo del usuario: no tener que cambiar las URLs de privacidad publicadas en las tiendas.**
- ✅ `/privacy/finclarity/` y `/support/finclarity/` **conservan su URL exacta** y ahora sirven el contenido nuevo directo (200, sin redirección) desde el sistema legal. Canonical a sí mismas, hreflang al inglés. El usuario no toca nada en App Store / Google Play.
- ✅ Para no duplicar, el ES de esos dos docs NO se genera en `/es/legal/…`; el helper `legalUrl()` enruta al ES heredado y al EN nuevo.
- ✅ Redirects 301 en `netlify.toml` de las URLs no críticas: `/projects/*` → `/es/proyectos/…`, `/links/*` → `/es/links/`.
- ✅ Páginas viejas eliminadas de `public/` (privacy, support, projects, links). `/horario/`, `/certs/` y `app-ads.txt` intactos.
- ✅ `sitemap-index.xml` (con hreflang ES/EN) + `robots.txt`.
- ⏳ Los redirects 301 solo actúan en Netlify (producción), no en el preview local.

### Fase 6b — Micro-apps (pendiente)
- Formalizar `/horario/` como referencia: `public/<slug>/` que enlaza `/assets/css/tokens.css` y define su propio namespace CSS (`.hz-*`).
- Documentar el patrón en `docs/CONTENIDO.md`.

### Fase 7 — Pulido profesional
`sitemap.xml` · `robots.txt` · imágenes OG por proyecto · JSON-LD `SoftwareApplication` por app · auditoría Lighthouse (objetivo 95+) · `prefers-reduced-motion` en todas las animaciones nuevas · verificación de Netlify Forms sobre el HTML generado.

---

## 4. Dirección visual

El objetivo es que el home **cuente una historia**, no que enumere secciones:

> Quién soy → **prueba** (métricas) → **qué he construido** (proyectos destacados) → **dónde lo he hecho** (timeline) → **con qué** (stack) → **respaldo** (certificados) → contacto.

Decisiones concretas:

1. **Mantener la paleta.** Negro + rojo ya te identifica. Lo que falta es jerarquía, no color nuevo.
2. **Timeline vertical** con línea de acento y punto por empleo, en vez de tarjetas en grid.
3. **Mockups de teléfono** en las fichas de proyecto. Eres desarrollador móvil: el portafolio debe verse móvil.
4. **Reveal on scroll** con `IntersectionObserver` (respetando `prefers-reduced-motion`). Sutil, 12px de desplazamiento, sin rebotes.
5. **Par tipográfico**: Montserrat se queda para titulares; evaluar Inter para el cuerpo — Montserrat en párrafos largos cansa.
6. Conservar las micro-interacciones que ya tienes (typing bilingüe, highlight de contacto): funcionan bien.

---

## 5. Riesgos y puntos de atención

| Riesgo | Mitigación |
|---|---|
| Netlify Forms necesita ver el `<form>` en el HTML del build | Validar tras el primer deploy; si falla, declarar el form en `public/__forms.html` |
| Perder posicionamiento de URLs actuales | Redirects 301 en `netlify.toml` (Fase 0) |
| `/horario/` ya tiene `canonical` publicado | No se mueve de ruta |
| La regla `*.pdf` del `.gitignore` bloquea certificados y CV | Excepciones explícitas en Fase 0 |
| Migración grande de una sola vez | Fases 0–1 no cambian nada visible; se puede desplegar y validar antes de tocar contenido |

---

## 6. Orden recomendado de ejecución

`Fase 0` → `Fase 1` → **`Fase 2`** → `Fase 3` → `Fase 5` → `Fase 4` → `Fase 6` → `Fase 7`

La Fase 2 se adelanta porque tener EDESUR y Top1Solutions publicados tiene valor inmediato. La Fase 5 va antes que la 4 porque desbloquea publicar apps en tiendas, que es dinero; los certificados pueden esperar una semana más.

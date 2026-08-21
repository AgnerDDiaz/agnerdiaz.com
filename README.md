# agnerdiaz.com

Portafolio personal de **Agner Díaz** — Ingeniero de Software, Desarrollador
Flutter y Analista de Software.

Sitio estático construido con [Astro](https://astro.build) y desplegado en
Netlify.

---

## Requisitos

- Node.js **≥ 22.12** (Astro 7)
- npm 10+

## Puesta en marcha

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo -> http://localhost:4321
npm run build    # genera dist/
npm run preview  # sirve dist/ para verificar el build
npm test         # tests de Horario UASD (145)
```

## Estructura

```
├─ public/          Servido tal cual, con URLs estables
│  ├─ assets/css/   CSS global (contrato compartido con las micro-apps)
│  ├─ assets/js/    JS del sitio actual
│  ├─ assets/i18n/  Diccionarios ES/EN
│  └─ horario/      Micro-app «Horario UASD»
│
├─ src/             Código de Astro
│  ├─ pages/        Rutas
│  ├─ layouts/      Plantillas de página
│  ├─ components/   Componentes reutilizables
│  ├─ content/      Proyectos, experiencia y certificaciones (Markdown)
│  ├─ data/         Configuración del sitio, registro de tecnologías, nav
│  ├─ i18n/         Cadenas de interfaz
│  └─ styles/       Estilos que sí pasan por el bundler
│
├─ tests/horario/   Tests del motor de Horario UASD (Node, CommonJS)
└─ docs/            Plan de arquitectura y documentación de Horario UASD
```

### Por qué el CSS global vive en `public/assets/css/`

Las micro-apps como `/horario/` son HTML estático que **no pasa por el bundler
de Astro**. Necesitan una URL de hoja de estilos estable para consumir los
tokens del sistema de diseño (`--bg`, `--surface`, `--accent`, …). Si Astro le
pusiera un hash al archivo, esas apps se quedarían sin tema. Ver
[`docs/PLAN-PORTAFOLIO-V2.md`](docs/PLAN-PORTAFOLIO-V2.md) §2.1.

### Por qué no declaramos `"type": "module"`

`astro.config.mjs` ya es ESM por su extensión. Marcar todo el proyecto como ESM
haría que Node tratase los scripts clásicos de `public/horario/js/*.js` como
módulos ESM, y los tests dejarían de funcionar (los módulos ESM no viven en
`require.cache`).

## Documentación

- [Plan de arquitectura del portafolio v2](docs/PLAN-PORTAFOLIO-V2.md)
- [Horario UASD](docs/horario/README.md)

## Despliegue

Netlify compila con `npm run build` y publica `dist/`. La configuración
(cabeceras, caché, versión de Node) está en [`netlify.toml`](netlify.toml).

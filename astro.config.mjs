// @ts-check
import { defineConfig } from "astro/config";

/**
 * Portafolio de Agner Diaz — configuración base.
 *
 * Fase 0: el sitio sigue siendo el HTML estático de siempre, servido desde
 * `public/`. Astro solo aporta el build y la base para las fases siguientes.
 * El i18n por rutas (`/es/`, `/en/`) se activa en la Fase 1.
 */
export default defineConfig({
  site: "https://agnerdiaz.com",
  output: "static",

  // URLs con barra final: /proyectos/finclarity/ — es lo que ya está indexado
  // hoy y lo que enlazan las páginas legales publicadas en las tiendas.
  trailingSlash: "always",

  build: {
    format: "directory",
  },

  // El CSS global vive en `public/assets/css/` a propósito: es un contrato de
  // URL estable que también consumen las micro-apps (p. ej. /horario/), que no
  // pasan por el bundler de Astro. Ver docs/PLAN-PORTAFOLIO-V2.md §2.1.
  vite: {
    build: {
      cssMinify: "lightningcss",
    },
  },
});

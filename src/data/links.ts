/**
 * Enlaces del "link in bio" (/[lang]/links/). Editar aquí = editar la página.
 * `icon` puede ser un emoji o una clave de SVG ("linkedin" | "github").
 */
import { site } from "@data/site";
import type { Lang } from "@i18n/ui";

export interface LinkItem {
  label: { es: string; en: string };
  href: (lang: Lang) => string;
  icon: string;
  external?: boolean;
  primary?: boolean;
}

export const links: LinkItem[] = [
  {
    label: { es: "Ir a mi portafolio", en: "Go to my portfolio" },
    href: (lang) => `/${lang}/`,
    icon: "🌐",
    primary: true,
  },
  {
    label: { es: "Proyectos", en: "Projects" },
    href: (lang) => `/${lang}/#projects`,
    icon: "🛠️",
  },
  {
    label: { es: "Certificaciones", en: "Certifications" },
    href: (lang) => `/${lang}/certificaciones/`,
    icon: "🎓",
  },
  {
    label: { es: "Horario UASD", en: "Horario UASD" },
    href: () => "/horario/",
    icon: "🗓️",
  },
  {
    label: { es: "LinkedIn", en: "LinkedIn" },
    href: () => site.socials.linkedin,
    icon: "linkedin",
    external: true,
  },
  {
    label: { es: "GitHub", en: "GitHub" },
    href: () => site.socials.github,
    icon: "github",
    external: true,
  },
];

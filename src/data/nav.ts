/**
 * Navegación principal. Editar el menú = editar SOLO este archivo.
 * `href` es un ancla dentro de la home; `key` referencia la etiqueta i18n.
 */
export interface NavItem {
  key: string;
  href: string;
  cta?: boolean;
}

export const mainNav: NavItem[] = [
  { key: "nav.about", href: "#about" },
  { key: "nav.experience", href: "#experience" },
  { key: "nav.projects", href: "#projects" },
  { key: "nav.skills", href: "#skills" },
  { key: "nav.certs", href: "#certs" },
  { key: "nav.education", href: "#education" },
  { key: "nav.contact", href: "#contact", cta: true },
];

/**
 * Cadenas de interfaz (chrome del sitio) por idioma, y helpers de traducción.
 *
 * El contenido largo (proyectos, experiencia, certificados) NO vive aquí: vive
 * en colecciones de contenido (src/content). Aquí solo van etiquetas de UI.
 */
import type { Lang } from "@data/site";
export type { Lang };

export const LANGS: Lang[] = ["es", "en"];
export const DEFAULT_LANG: Lang = "es";

export const ui = {
  es: {
    "a11y.skip": "Saltar al contenido",
    "a11y.menu.open": "Abrir menú",
    "a11y.menu.close": "Cerrar menú",
    "a11y.theme": "Cambiar tema",
    "a11y.lang": "Cambiar idioma",
    "a11y.top": "Volver arriba",

    "nav.home": "Inicio",
    "nav.portfolio": "Portafolio",
    "nav.about": "Sobre mí",
    "nav.experience": "Experiencia",
    "nav.projects": "Proyectos",
    "nav.skills": "Tecnologías",
    "nav.certs": "Certificaciones",
    "nav.education": "Educación",
    "nav.contact": "Contacto",

    "hero.lead":
      "Ingeniero de Software especializado en desarrollo móvil con Flutter. Construyo aplicaciones desde cero, modernizo sistemas existentes y las llevo a producción en Android e iOS.",
    "hero.cvBtn": "Descargar CV",
    "hero.contactBtn": "Contáctame",
    "hero.availabilityRole": "Rol profesional",

    "metrics.title": "En números",
    "about.title": "Sobre mí",

    "experience.title": "Experiencia",
    "experience.current": "Actual",
    "experience.tech": "Tecnologías",

    "projects.title": "Proyectos",
    "projects.subtitle": "Aplicaciones que he diseñado y construido.",
    "projects.featured": "Destacado",
    "projects.viewAll": "Ver todos los proyectos",
    "projects.githubMore": "Ver más en GitHub",
    "tools.title": "Apps web que puedes usar ahora",
    "tools.subtitle": "Proyectos publicados y listos para usar directamente en el navegador, sin instalar nada.",
    "tools.use": "Usar ahora",
    "projects.status.live": "Publicado",
    "projects.status.wip": "En desarrollo",
    "projects.status.archived": "Archivado",
    "projects.open": "Abrir",
    "projects.details": "Ver detalle",
    "projects.pageSubtitle": "Aplicaciones móviles, web y herramientas que he diseñado y construido.",
    "projects.back": "Volver a proyectos",
    "projects.filter.all": "Todos",
    "projects.filter.mobile": "Móvil",
    "projects.filter.web": "Web",
    "projects.filter.tool": "Herramientas",
    "projects.overview": "Resumen",
    "projects.highlights": "Lo más destacado",
    "projects.gallery": "Capturas",
    "projects.links": "Enlaces",
    "projects.role": "Rol",
    "projects.period": "Período",
    "projects.platforms": "Plataformas",
    "projects.repo": "Repositorio",
    "projects.visit": "Visitar",
    "projects.demo": "Demo",
    "projects.privacy": "Privacidad",
    "projects.support": "Soporte",
    "projects.terms": "Términos",
    "projects.shotSoon": "Captura próximamente",
    "projects.present": "Actualidad",

    "skills.title": "Tecnologías",
    "skills.subtitle": "El stack con el que trabajo a diario.",
    "skills.cat.mobile": "Móvil y frontend",
    "skills.cat.backend": "Backend e integraciones",
    "skills.cat.database": "Bases de datos",
    "skills.cat.tools": "Herramientas y calidad",
    "skills.cat.additional": "Lenguajes adicionales",

    "certs.title": "Certificaciones",
    "certs.subtitle": "Formación y credenciales, de lo más reciente a lo más antiguo.",
    "certs.verify": "Verificar",
    "certs.viewAll": "Ver todas las certificaciones",
    "certs.view": "Ver certificado",
    "certs.close": "Cerrar",
    "certs.openTab": "Abrir en pestaña nueva",
    "certs.approx": "Fecha aproximada",
    "certs.backHome": "Volver al inicio",
    "certs.pageSubtitle": "Todos mis certificados, ordenados del más reciente al más antiguo. Pulsa uno para previsualizarlo.",

    "education.title": "Educación",
    "languages.title": "Idiomas",

    "contact.title": "Contacto",
    "contact.intro":
      "¿Tienes una oportunidad o proyecto en mente? Escríbeme por aquí y te respondo pronto.",
    "contact.how": "Envíame un mensaje",
    "contact.form.subjectLabel": "Asunto",
    "contact.form.subjectPh": "Ej: Oportunidad laboral",
    "contact.form.emailLabel": "Correo (opcional)",
    "contact.form.emailPh": "tuemail@ejemplo.com",
    "contact.form.messageLabel": "Mensaje",
    "contact.form.messagePh": "Escribe tu mensaje...",
    "contact.form.send": "Enviar mensaje",
    "contact.sending": "Enviando…",
    "contact.successTitle": "Mensaje enviado",
    "contact.successMessage": "Gracias, te responderé pronto.",
    "contact.errorTitle": "No se pudo enviar",
    "contact.errorMessage": "Intenta de nuevo.",
    "contact.validation.subjectRequired": "El asunto es obligatorio.",
    "contact.validation.messageRequired": "El mensaje es obligatorio.",
    "contact.validation.emailInvalid": "Escribe un correo válido.",

    "footer.rights": "Todos los derechos reservados.",
    "footer.built": "Diseñado y construido por Agner Díaz.",

    "links.kicker": "Directorio",
    "links.subtitle": "Accesos directos a mi portafolio y redes profesionales.",
  },

  en: {
    "a11y.skip": "Skip to content",
    "a11y.menu.open": "Open menu",
    "a11y.menu.close": "Close menu",
    "a11y.theme": "Toggle theme",
    "a11y.lang": "Switch language",
    "a11y.top": "Back to top",

    "nav.home": "Home",
    "nav.portfolio": "Portfolio",
    "nav.about": "About",
    "nav.experience": "Experience",
    "nav.projects": "Projects",
    "nav.skills": "Tech",
    "nav.certs": "Certifications",
    "nav.education": "Education",
    "nav.contact": "Contact",

    "hero.lead":
      "Software Engineer specialized in mobile development with Flutter. I build apps from scratch, modernize existing systems, and ship them to production on Android and iOS.",
    "hero.cvBtn": "Download CV",
    "hero.contactBtn": "Get in touch",
    "hero.availabilityRole": "Professional role",

    "metrics.title": "By the numbers",
    "about.title": "About me",

    "experience.title": "Experience",
    "experience.current": "Current",
    "experience.tech": "Tech",

    "projects.title": "Projects",
    "projects.subtitle": "Applications I've designed and built.",
    "projects.featured": "Featured",
    "projects.viewAll": "View all projects",
    "projects.githubMore": "See more on GitHub",
    "tools.title": "Web apps you can use right now",
    "tools.subtitle": "Published projects, ready to use right in your browser — nothing to install.",
    "tools.use": "Use now",
    "projects.status.live": "Published",
    "projects.status.wip": "In progress",
    "projects.status.archived": "Archived",
    "projects.open": "Open",
    "projects.details": "View details",
    "projects.pageSubtitle": "Mobile apps, web and tools I've designed and built.",
    "projects.back": "Back to projects",
    "projects.filter.all": "All",
    "projects.filter.mobile": "Mobile",
    "projects.filter.web": "Web",
    "projects.filter.tool": "Tools",
    "projects.overview": "Overview",
    "projects.highlights": "Highlights",
    "projects.gallery": "Screenshots",
    "projects.links": "Links",
    "projects.role": "Role",
    "projects.period": "Period",
    "projects.platforms": "Platforms",
    "projects.repo": "Repository",
    "projects.visit": "Visit",
    "projects.demo": "Demo",
    "projects.privacy": "Privacy",
    "projects.support": "Support",
    "projects.terms": "Terms",
    "projects.shotSoon": "Screenshot coming soon",
    "projects.present": "Present",

    "skills.title": "Tech Stack",
    "skills.subtitle": "The stack I work with every day.",
    "skills.cat.mobile": "Mobile & frontend",
    "skills.cat.backend": "Backend & integrations",
    "skills.cat.database": "Databases",
    "skills.cat.tools": "Tooling & quality",
    "skills.cat.additional": "Additional languages",

    "certs.title": "Certifications",
    "certs.subtitle": "Training and credentials, newest first.",
    "certs.verify": "Verify",
    "certs.viewAll": "View all certifications",
    "certs.view": "View certificate",
    "certs.close": "Close",
    "certs.openTab": "Open in new tab",
    "certs.approx": "Approx. date",
    "certs.backHome": "Back to home",
    "certs.pageSubtitle": "All my certificates, newest first. Tap one to preview it.",

    "education.title": "Education",
    "languages.title": "Languages",

    "contact.title": "Contact",
    "contact.intro":
      "Have an opportunity or a project in mind? Drop me a message here and I'll get back to you soon.",
    "contact.how": "Send me a message",
    "contact.form.subjectLabel": "Subject",
    "contact.form.subjectPh": "e.g. Job opportunity",
    "contact.form.emailLabel": "Email (optional)",
    "contact.form.emailPh": "youremail@example.com",
    "contact.form.messageLabel": "Message",
    "contact.form.messagePh": "Write your message...",
    "contact.form.send": "Send message",
    "contact.sending": "Sending…",
    "contact.successTitle": "Message sent",
    "contact.successMessage": "Thanks, I'll reply soon.",
    "contact.errorTitle": "Couldn't send",
    "contact.errorMessage": "Please try again.",
    "contact.validation.subjectRequired": "Subject is required.",
    "contact.validation.messageRequired": "Message is required.",
    "contact.validation.emailInvalid": "Enter a valid email.",

    "footer.rights": "All rights reserved.",
    "footer.built": "Designed and built by Agner Díaz.",

    "links.kicker": "Directory",
    "links.subtitle": "Quick links to my portfolio and professional networks.",
  },
} as const;

export type UIKey = keyof (typeof ui)["es"];

/** Devuelve una función `t(key)` para el idioma dado. */
export function useTranslations(lang: Lang) {
  const dict = ui[lang] ?? ui[DEFAULT_LANG];
  return function t(key: UIKey): string {
    return dict[key] ?? ui[DEFAULT_LANG][key] ?? key;
  };
}

/** Idioma válido a partir de un string (p. ej. el parámetro de ruta). */
export function toLang(value: string | undefined): Lang {
  return value === "en" ? "en" : "es";
}

/** El otro idioma (para el toggle). */
export function otherLang(lang: Lang): Lang {
  return lang === "es" ? "en" : "es";
}

/** Prefija una ruta interna con el idioma: localizePath("/#about", "en") → "/en/#about". */
export function localizePath(path: string, lang: Lang): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean === "/") return `/${lang}/`;
  return `/${lang}${clean}`;
}

/** Elige el campo del idioma en un objeto {es, en}. */
export function pick<T>(field: { es: T; en: T } | undefined, lang: Lang): T | undefined {
  return field ? field[lang] : undefined;
}

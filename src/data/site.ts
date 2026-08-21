/**
 * Configuración global del sitio. Fuente única para datos de identidad,
 * redes y enlaces. Consumido por el layout, el SEO y el footer.
 */
export const site = {
  name: "Agner Díaz",
  fullName: "Agner David Díaz Encarnación",
  domain: "agnerdiaz.com",
  url: "https://agnerdiaz.com",
  email: "agnerdiazenc@gmail.com",

  brand: {
    first: "Agner",
    last: "Diaz",
  },

  /** Roles que rota el efecto de máquina de escribir (por idioma). */
  roles: {
    es: ["Ingeniero de Software", "Desarrollador Flutter", "Analista de Software"],
    en: ["Software Engineer", "Flutter Developer", "Software Analyst"],
  },

  socials: {
    linkedin: "https://linkedin.com/in/agnerdiaz",
    github: "https://github.com/AgnerDDiaz",
  },

  cv: {
    es: "/cv/Agner_Diaz_CV_ES.pdf",
    en: "/cv/Agner_Diaz_CV_EN.pdf",
  },
} as const;

export type Lang = "es" | "en";

/**
 * Contenido específico de la home que no encaja en una colección:
 * la banda de métricas y el texto de «Sobre mí».
 */
import type { Lang } from "@data/site";

export interface Metric {
  value: string;
  label: { es: string; en: string };
}

export const metrics: Metric[] = [
  { value: "4", label: { es: "Apps móviles en Flutter", en: "Flutter mobile apps" } },
  { value: "~1,000", label: { es: "Usuarios en producción", en: "Users in production" } },
  { value: "4", label: { es: "Publicaciones en tiendas", en: "App store releases" } },
  { value: "3", label: { es: "Apps construidas desde cero", en: "Apps built from scratch" } },
];

export const about: Record<Lang, string[]> = {
  es: [
    "Soy Ingeniero de Software especializado en desarrollo móvil con Flutter. Trabajo construyendo aplicaciones empresariales desde cero, modernizando sistemas existentes e integrando APIs REST y bases de datos para llevar soluciones reales a producción en Android e iOS.",
    "Mi forma de trabajar parte de entender la lógica del negocio: analizo el problema, estimo el esfuerzo, propongo soluciones y me involucro con los stakeholders para definir la mejor arquitectura. Me muevo con soltura entre el frontend móvil, el backend (.NET, REST) y bases de datos como Oracle, PostgreSQL y SQLite, con Git, code review y metodologías Agile/Scrum.",
    "Disfruto especialmente crear productos propios —como FinClarity, mi app de finanzas personales— cuidando la calidad, el detalle y una experiencia de usuario moderna. Esa combinación de mentalidad analítica y foco en producto es lo que guía todo lo que diseño y construyo.",
  ],
  en: [
    "I'm a Software Engineer specialized in mobile development with Flutter. I build enterprise applications from scratch, modernize existing systems and integrate REST APIs and databases to ship real solutions to production on Android and iOS.",
    "My approach starts from the business logic: I analyze the problem, estimate the effort, propose solutions and work with stakeholders to define the best architecture. I move comfortably between the mobile frontend, the backend (.NET, REST) and databases like Oracle, PostgreSQL and SQLite, using Git, code review and Agile/Scrum.",
    "I especially enjoy building my own products — like FinClarity, my personal-finance app — with care for quality, detail and a modern user experience. That mix of analytical mindset and product focus guides everything I design and build.",
  ],
};

export const education = {
  institution: "Instituto Tecnológico de Santo Domingo (INTEC)",
  degree: { es: "Ingeniería de Software", en: "Software Engineering" },
  date: { es: "Graduado 2026", en: "Graduated 2026" },
};

export const languages: { name: { es: string; en: string }; level: { es: string; en: string } }[] = [
  {
    name: { es: "Español", en: "Spanish" },
    level: { es: "Nativo", en: "Native" },
  },
  {
    name: { es: "Inglés", en: "English" },
    level: { es: "Intermedio", en: "Intermediate" },
  },
];

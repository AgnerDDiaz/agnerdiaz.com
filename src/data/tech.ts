/**
 * Registro ÚNICO de tecnologías.
 *
 * Cada proyecto/experiencia referencia tecnologías por su `id`. Aquí viven la
 * etiqueta visible, el icono y la categoría. Añadir una tecnología nueva =
 * una entrada aquí, y queda disponible en chips, skills y fichas de proyecto.
 *
 * Los iconos están AUTO-HOSPEDADOS en /public/img/tech/<id>.svg (descargados de
 * Devicon, Apache-2.0). Sin dependencia de CDN: el sitio no se rompe si un repo
 * de terceros cambia, y funciona sin conexión. Para añadir un icono nuevo,
 * suelta `public/img/tech/<id>.svg` y referencia `icon: ic("<id>")`.
 */
const ic = (id: string) => `/img/tech/${id}.svg`;

export type TechCategory =
  | "mobile"
  | "backend"
  | "database"
  | "tools"
  | "methods"
  | "additional";

export interface Tech {
  id: string;
  label: string;
  icon?: string; // ruta del SVG, o undefined → chip de solo texto
  category: TechCategory;
  /** Invertir color del icono en tema oscuro (iconos monocromos negros). */
  invertOnDark?: boolean;
}

export const TECH: Record<string, Tech> = {
  // ── Móvil y frontend ─────────────────────────────────────────
  flutter: { id: "flutter", label: "Flutter", icon: ic("flutter"), category: "mobile" },
  dart: { id: "dart", label: "Dart", icon: ic("dart"), category: "mobile" },
  react: { id: "react", label: "React", icon: ic("react"), category: "mobile" },
  tailwind: { id: "tailwind", label: "Tailwind", icon: ic("tailwind"), category: "mobile" },

  // ── Backend e integraciones ──────────────────────────────────
  dotnet: { id: "dotnet", label: ".NET", icon: ic("dotnet"), category: "backend" },
  fastapi: { id: "fastapi", label: "FastAPI", icon: ic("fastapi"), category: "backend" },
  restapi: { id: "restapi", label: "REST APIs", category: "backend" },
  supabase: { id: "supabase", label: "Supabase", icon: ic("supabase"), category: "backend" },
  firebase: { id: "firebase", label: "Firebase", icon: ic("firebase"), category: "backend" },
  firestore: { id: "firestore", label: "Firestore", icon: ic("firestore"), category: "backend" },
  stripe: { id: "stripe", label: "Stripe", category: "backend" },
  mapbox: { id: "mapbox", label: "Mapbox", icon: ic("mapbox"), category: "backend" },

  // ── Bases de datos ───────────────────────────────────────────
  oracle: { id: "oracle", label: "Oracle SQL", icon: ic("oracle"), category: "database" },
  postgresql: { id: "postgresql", label: "PostgreSQL", icon: ic("postgresql"), category: "database" },
  mysql: { id: "mysql", label: "MySQL", icon: ic("mysql"), category: "database" },
  sqlite: { id: "sqlite", label: "SQLite", icon: ic("sqlite"), category: "database" },
  sql: { id: "sql", label: "SQL", icon: ic("sql"), category: "database" },

  // ── Herramientas y calidad ───────────────────────────────────
  git: { id: "git", label: "Git", icon: ic("git"), category: "tools" },
  github: { id: "github", label: "GitHub", icon: ic("github"), category: "tools", invertOnDark: true },
  bitbucket: { id: "bitbucket", label: "Bitbucket", icon: ic("bitbucket"), category: "tools" },
  docker: { id: "docker", label: "Docker", icon: ic("docker"), category: "tools" },
  gcloud: { id: "gcloud", label: "Google Cloud", icon: ic("gcloud"), category: "tools" },
  gcloudrun: { id: "gcloudrun", label: "Cloud Run", icon: ic("gcloudrun"), category: "tools" },

  // ── Lenguajes adicionales ────────────────────────────────────
  csharp: { id: "csharp", label: "C#", icon: ic("csharp"), category: "additional" },
  javascript: { id: "javascript", label: "JavaScript", icon: ic("javascript"), category: "additional" },
  cpp: { id: "cpp", label: "C++", icon: ic("cpp"), category: "additional" },
};

/** Resuelve una lista de ids a objetos Tech, ignorando los desconocidos. */
export function resolveTech(ids: readonly string[]): Tech[] {
  return ids
    .map((id) => TECH[id])
    .filter((t): t is Tech => Boolean(t));
}

/** Categorías en el orden en que se muestran, con su etiqueta i18n. */
export const TECH_CATEGORY_ORDER: { id: TechCategory; key: string }[] = [
  { id: "mobile", key: "skills.cat.mobile" },
  { id: "backend", key: "skills.cat.backend" },
  { id: "database", key: "skills.cat.database" },
  { id: "tools", key: "skills.cat.tools" },
  { id: "additional", key: "skills.cat.additional" },
];

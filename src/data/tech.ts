/**
 * Registro ÚNICO de tecnologías.
 *
 * Cada proyecto/experiencia referencia tecnologías por su `id`. Aquí viven la
 * etiqueta visible, el icono y la categoría. Añadir una tecnología nueva =
 * una entrada aquí, y queda disponible en chips, skills y fichas de proyecto.
 *
 * Los iconos usan Devicon fijado a una versión (no `@latest`) para que un
 * cambio en un repo de terceros nunca altere el sitio. Auto-hospedarlos en
 * /assets/img/tech/ es una mejora pendiente (Fase 7).
 */
const ICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons";

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
  icon?: string; // URL del SVG, o undefined → chip de solo texto
  category: TechCategory;
  /** Invertir color del icono en tema oscuro (iconos monocromos negros). */
  invertOnDark?: boolean;
}

export const TECH: Record<string, Tech> = {
  // ── Móvil y frontend ─────────────────────────────────────────
  flutter: { id: "flutter", label: "Flutter", icon: `${ICON}/flutter/flutter-original.svg`, category: "mobile" },
  dart: { id: "dart", label: "Dart", icon: `${ICON}/dart/dart-original.svg`, category: "mobile" },
  react: { id: "react", label: "React", icon: `${ICON}/react/react-original.svg`, category: "mobile" },
  tailwind: { id: "tailwind", label: "Tailwind", icon: `${ICON}/tailwindcss/tailwindcss-original.svg`, category: "mobile" },

  // ── Backend e integraciones ──────────────────────────────────
  dotnet: { id: "dotnet", label: ".NET", icon: `${ICON}/dotnetcore/dotnetcore-original.svg`, category: "backend" },
  fastapi: { id: "fastapi", label: "FastAPI", icon: `${ICON}/fastapi/fastapi-original.svg`, category: "backend" },
  restapi: { id: "restapi", label: "REST APIs", category: "backend" },
  supabase: { id: "supabase", label: "Supabase", icon: `${ICON}/supabase/supabase-original.svg`, category: "backend" },
  firebase: { id: "firebase", label: "Firebase", icon: `${ICON}/firebase/firebase-plain.svg`, category: "backend" },
  firestore: { id: "firestore", label: "Firestore", icon: `${ICON}/firebase/firebase-plain.svg`, category: "backend" },
  stripe: { id: "stripe", label: "Stripe", icon: `${ICON}/stripe/stripe-original.svg`, category: "backend" },
  mapbox: { id: "mapbox", label: "Mapbox", icon: `${ICON}/mapbox/mapbox-original.svg`, category: "backend" },

  // ── Bases de datos ───────────────────────────────────────────
  oracle: { id: "oracle", label: "Oracle SQL", icon: `${ICON}/oracle/oracle-original.svg`, category: "database" },
  postgresql: { id: "postgresql", label: "PostgreSQL", icon: `${ICON}/postgresql/postgresql-original.svg`, category: "database" },
  mysql: { id: "mysql", label: "MySQL", icon: `${ICON}/mysql/mysql-original.svg`, category: "database" },
  sqlite: { id: "sqlite", label: "SQLite", icon: `${ICON}/sqlite/sqlite-original.svg`, category: "database" },
  sql: { id: "sql", label: "SQL", icon: `${ICON}/azuresqldatabase/azuresqldatabase-original.svg`, category: "database" },

  // ── Herramientas y calidad ───────────────────────────────────
  git: { id: "git", label: "Git", icon: `${ICON}/git/git-original.svg`, category: "tools" },
  github: { id: "github", label: "GitHub", icon: `${ICON}/github/github-original.svg`, category: "tools", invertOnDark: true },
  bitbucket: { id: "bitbucket", label: "Bitbucket", icon: `${ICON}/bitbucket/bitbucket-original.svg`, category: "tools" },
  docker: { id: "docker", label: "Docker", icon: `${ICON}/docker/docker-original.svg`, category: "tools" },
  gcloud: { id: "gcloud", label: "Google Cloud", icon: `${ICON}/googlecloud/googlecloud-original.svg`, category: "tools" },
  gcloudrun: { id: "gcloudrun", label: "Cloud Run", icon: `${ICON}/googlecloud/googlecloud-original.svg`, category: "tools" },

  // ── Lenguajes adicionales ────────────────────────────────────
  csharp: { id: "csharp", label: "C#", icon: `${ICON}/csharp/csharp-original.svg`, category: "additional" },
  javascript: { id: "javascript", label: "JavaScript", icon: `${ICON}/javascript/javascript-original.svg`, category: "additional" },
  cpp: { id: "cpp", label: "C++", icon: `${ICON}/cplusplus/cplusplus-original.svg`, category: "additional" },
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

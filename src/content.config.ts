import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Esquemas de contenido = contrato tipado. Si a un archivo de experiencia,
 * proyecto o certificado le falta un campo o tiene una fecha inválida, el
 * `astro build` FALLA en vez de publicarse roto.
 *
 * Cada elemento es UN archivo Markdown con todo en el frontmatter. Los campos
 * traducibles usan `{ es, en }`, así que añadir un elemento bilingüe = un solo
 * archivo (no dos que mantener en sync).
 */

// Texto en los dos idiomas.
const bilingual = z.object({ es: z.string(), en: z.string() });
// Lista de textos en los dos idiomas (p. ej. viñetas).
const bilingualList = z.object({ es: z.array(z.string()), en: z.array(z.string()) });

// ── Experiencia ────────────────────────────────────────────────
const experience = defineCollection({
  loader: glob({ base: "./src/content/experience", pattern: "**/*.md" }),
  schema: z.object({
    company: z.string(),
    role: bilingual,
    location: bilingual,
    /** "YYYY-MM" para poder ordenar cronológicamente. */
    start: z.string().regex(/^\d{4}-\d{2}$/),
    /** null = actual. */
    end: z.string().regex(/^\d{4}-\d{2}$/).nullable().default(null),
    type: z.enum(["fulltime", "internship", "contract"]),
    /** Oculta detalles sensibles en clientes confidenciales. */
    confidential: z.boolean().default(false),
    summary: bilingual.optional(),
    bullets: bilingualList,
    tech: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

// ── Certificaciones ────────────────────────────────────────────
const certifications = defineCollection({
  loader: glob({ base: "./src/content/certifications", pattern: "**/*.md" }),
  schema: z.object({
    name: bilingual,
    issuer: z.string(),
    /** "YYYY-MM" — el orden descendente sale solo de aquí. */
    issuedAt: z.string().regex(/^\d{4}(-\d{2})?$/),
    credentialId: z.string().optional(),
    credentialUrl: z.string().url().optional(),
    /** PDF/imagen para el visor (Fase 4). Opcional mientras no exista. */
    file: z.string().optional(),
    thumb: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

// ── Proyectos ──────────────────────────────────────────────────
const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: bilingual,
      role: bilingual,
      kind: z.enum(["mobile", "web", "tool"]),
      status: z.enum(["live", "wip", "archived"]),
      featured: z.boolean().default(false),
      order: z.number().default(0),
      period: z.object({
        start: z.string(),
        end: z.string().nullable().default(null),
      }),
      tech: z.array(z.string()).default([]),
      platforms: z.array(z.enum(["ios", "android", "web"])).default([]),
      metrics: z.array(z.object({ label: bilingual, value: z.string() })).default([]),
      highlights: bilingualList.optional(),
      overview: bilingual.optional(),
      links: z
        .object({
          appStore: z.string().url().optional(),
          googlePlay: z.string().url().optional(),
          repo: z.string().url().optional(),
          live: z.string().optional(),
          demo: z.string().url().optional(),
        })
        .default({}),
      legal: z
        .object({
          privacy: z.boolean().default(false),
          support: z.boolean().default(false),
          terms: z.boolean().default(false),
        })
        .default({}),
      cover: image().optional(),
      accent: z.string().optional(),
    }),
});

export const collections = { experience, certifications, projects };

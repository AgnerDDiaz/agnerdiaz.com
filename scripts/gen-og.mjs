/**
 * Genera la imagen Open Graph (1200×630) del sitio a partir de un SVG,
 * usando sharp (ya viene con Astro). Ejecutar: node scripts/gen-og.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "..", "public", "assets", "img", "og.png");

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="18%" cy="12%" r="60%">
      <stop offset="0%" stop-color="#D90429" stop-opacity="0.42"/>
      <stop offset="60%" stop-color="#D90429" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="88%" cy="90%" r="55%">
      <stop offset="0%" stop-color="#D90429" stop-opacity="0.20"/>
      <stop offset="70%" stop-color="#D90429" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="#0A0A0B"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>

  <!-- brand mark -->
  <circle cx="92" cy="90" r="11" fill="#D90429"/>
  <text x="116" y="99" font-family="Montserrat, Arial, sans-serif" font-size="30" font-weight="800"
        letter-spacing="2" fill="#EDF2F4">AGNER<tspan fill="#D90429">DIAZ</tspan></text>

  <!-- name -->
  <text x="90" y="330" font-family="Montserrat, Arial, sans-serif" font-size="118" font-weight="900"
        letter-spacing="2" fill="#EDF2F4">AGNER <tspan fill="#D90429">DÍAZ</tspan></text>

  <!-- roles -->
  <text x="96" y="400" font-family="Montserrat, Arial, sans-serif" font-size="34" font-weight="800"
        letter-spacing="3" fill="#8D99AE">INGENIERO DE SOFTWARE · FLUTTER DEVELOPER</text>

  <!-- accent underline -->
  <rect x="96" y="440" width="150" height="7" rx="3.5" fill="#D90429"/>

  <!-- domain -->
  <text x="96" y="560" font-family="Montserrat, Arial, sans-serif" font-size="30" font-weight="700"
        letter-spacing="1" fill="#EDF2F4">agnerdiaz.com</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
console.log("OG image escrita en", out);

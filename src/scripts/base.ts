/**
 * Interacciones presentes en TODAS las páginas (cargadas desde BaseLayout):
 * aparición al hacer scroll y botón «volver arriba». Respetan
 * prefers-reduced-motion y degradan si falta soporte.
 */
const reduceMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Máquina de escribir (roles) — no-op si no hay .hero__roles ─
function initTyping() {
  const el = document.querySelector<HTMLElement>(".hero__roles");
  const out = el?.querySelector<HTMLElement>(".typing");
  if (!el || !out) return;

  let roles: string[] = [];
  try {
    roles = JSON.parse(el.getAttribute("data-roles") || "[]");
  } catch {
    roles = [];
  }
  if (!roles.length) return;

  if (reduceMotion()) {
    out.textContent = roles[0];
    const caret = el.querySelector<HTMLElement>(".typing__cursor");
    if (caret) caret.style.display = "none";
    return;
  }

  let idx = 0;
  const rand = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));
  const type = (text: string, i: number) => {
    out.textContent = text.slice(0, i);
    if (i <= text.length) setTimeout(() => type(text, i + 1), rand(34, 58));
    else setTimeout(() => del(text, text.length), rand(900, 1200));
  };
  const del = (text: string, i: number) => {
    out.textContent = text.slice(0, i);
    if (i > 0) setTimeout(() => del(text, i - 1), rand(18, 32));
    else {
      idx = (idx + 1) % roles.length;
      setTimeout(() => type(roles[idx], 0), rand(240, 360));
    }
  };
  type(roles[0], 0);
}

function initReveal() {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
  if (!nodes.length) return;
  if (reduceMotion() || typeof IntersectionObserver === "undefined") {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  nodes.forEach((n) => io.observe(n));
}

function initToTop() {
  const btn = document.getElementById("toTop");
  if (!btn) return;
  const onScroll = () => btn.classList.toggle("is-visible", window.scrollY > 600);
  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" }),
  );
  onScroll();
}

export function initBase() {
  initTyping();
  initReveal();
  initToTop();
}

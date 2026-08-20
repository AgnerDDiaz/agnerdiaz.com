/**
 * Interacciones presentes en TODAS las páginas (cargadas desde BaseLayout):
 * aparición al hacer scroll y botón «volver arriba». Respetan
 * prefers-reduced-motion y degradan si falta soporte.
 */
const reduceMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  initReveal();
  initToTop();
}

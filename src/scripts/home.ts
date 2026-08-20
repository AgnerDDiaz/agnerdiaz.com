/**
 * Interacciones de la home (bundleadas por Astro). Todo respeta
 * prefers-reduced-motion y degrada con elegancia si falta algún nodo.
 */

const reduceMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Máquina de escribir (roles del hero) ─────────────────────
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
    if (i <= text.length) {
      setTimeout(() => type(text, i + 1), rand(34, 58));
    } else {
      setTimeout(() => del(text, text.length), rand(900, 1200));
    }
  };
  const del = (text: string, i: number) => {
    out.textContent = text.slice(0, i);
    if (i > 0) {
      setTimeout(() => del(text, i - 1), rand(18, 32));
    } else {
      idx = (idx + 1) % roles.length;
      setTimeout(() => type(roles[idx], 0), rand(240, 360));
    }
  };
  type(roles[0], 0);
}

// ── Reveal on scroll ─────────────────────────────────────────
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

// ── Botón «volver arriba» ────────────────────────────────────
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

// ── Formulario de contacto (Netlify Forms) ───────────────────
function initContact() {
  const form = document.getElementById("contactForm") as HTMLFormElement | null;
  if (!form) return;
  const d = form.dataset;
  const statusEl = document.getElementById("contactStatus");
  const submitBtn = document.getElementById("contactSubmit") as HTMLButtonElement | null;
  const card = document.getElementById("contactCard");

  const fields = {
    subject: form.querySelector<HTMLInputElement>("#cf-subject"),
    email: form.querySelector<HTMLInputElement>("#cf-email"),
    message: form.querySelector<HTMLTextAreaElement>("#cf-message"),
  };
  const errors = {
    subject: document.getElementById("err-subject"),
    email: document.getElementById("err-email"),
    message: document.getElementById("err-message"),
  };
  let sending = false;

  const setError = (el: HTMLElement | null, box: HTMLElement | null, msg: string) => {
    el?.classList.add("is-invalid");
    if (box) { box.textContent = msg; box.hidden = false; }
  };
  const clearError = (el: HTMLElement | null, box: HTMLElement | null) => {
    el?.classList.remove("is-invalid");
    if (box) { box.textContent = ""; box.hidden = true; }
  };
  const validEmail = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const showStatus = (kind: "success" | "error", title: string, msg: string) => {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.className = `form-status form-status--${kind}`;
    statusEl.innerHTML = `<strong></strong><span></span>`;
    statusEl.querySelector("strong")!.textContent = title;
    statusEl.querySelector("span")!.textContent = msg;
    setTimeout(() => { statusEl.hidden = true; }, 5200);
  };

  const validate = () => {
    let ok = true;
    (["subject", "email", "message"] as const).forEach((k) => clearError(fields[k], errors[k]));
    const s = fields.subject?.value.trim() ?? "";
    const e = fields.email?.value.trim() ?? "";
    const m = fields.message?.value.trim() ?? "";
    if (!s) { ok = false; setError(fields.subject, errors.subject, d.errSubject || ""); }
    if (e && !validEmail(e)) { ok = false; setError(fields.email, errors.email, d.errEmail || ""); }
    if (!m) { ok = false; setError(fields.message, errors.message, d.errMessage || ""); }
    return ok;
  };

  (["subject", "email", "message"] as const).forEach((k) => {
    fields[k]?.addEventListener("input", () => clearError(fields[k], errors[k]));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;
    if (!validate()) return;
    sending = true;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = d.msgSending || "…"; }
    card?.classList.remove("is-highlight");
    void card?.offsetWidth;
    card?.classList.add("is-highlight");
    try {
      const res = await fetch(form.getAttribute("action") || "/", {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "text/html" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showStatus("success", d.msgSuccessTitle || "", d.msgSuccess || "");
      form.reset();
    } catch {
      showStatus("error", d.msgErrorTitle || "", d.msgError || "");
    } finally {
      sending = false;
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = d.msgSend || ""; }
    }
  });
}

export function initHome() {
  initTyping();
  initReveal();
  initToTop();
  initContact();
}

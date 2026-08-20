/**
 * Interacciones específicas de la home (bundleadas por Astro). El typing,
 * el reveal y el botón «arriba» viven en base.ts (todas las páginas).
 */

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
  initContact();
}

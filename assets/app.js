(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- i18n (ES/EN) ---
  const dict = {
    es: {
      eyebrow: "Portafolio profesional",
      title: "Agner Díaz",
      subtitle: "Sitio en construcción. Muy pronto tendrás aquí mi portafolio, proyectos y contacto.",
      ctaLinks: "Ver links",
      ctaCopyEmail: "Copiar email",
      nextTitle: "Próximo",
      next1: "Home completo (proyectos, experiencia, stack).",
      next2: "Formulario de contacto con anti-spam (gratis).",
      next3: "Página /links fija para QR del CV.",
      copied: "Email copiado ✅",
      copyFail: "No se pudo copiar. Intenta de nuevo."
    },
    en: {
      eyebrow: "Professional portfolio",
      title: "Agner Diaz",
      subtitle: "Website under construction. Soon you'll find my portfolio, projects and contact here.",
      ctaLinks: "View links",
      ctaCopyEmail: "Copy email",
      nextTitle: "Next",
      next1: "Full home (projects, experience, stack).",
      next2: "Contact form with anti-spam (free).",
      next3: "Stable /links page for CV QR.",
      copied: "Email copied ✅",
      copyFail: "Copy failed. Please try again."
    }
  };

  const langBtn = document.getElementById("langBtn");
  const themeBtn = document.getElementById("themeBtn");
  const copyBtn = document.getElementById("copyEmailBtn");
  const hintEl = document.getElementById("copyHint");

  const getSaved = (k, fallback) => localStorage.getItem(k) || fallback;
  const setSaved = (k, v) => localStorage.setItem(k, v);

  // Default language based on browser
  const browserLang = (navigator.language || "es").toLowerCase().startsWith("en") ? "en" : "es";
  let lang = getSaved("lang", browserLang);

  const applyLang = () => {
    const t = dict[lang] || dict.es;
    document.documentElement.lang = lang === "en" ? "en" : "es";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (t[key]) el.textContent = t[key];
    });
    if (langBtn) langBtn.textContent = lang.toUpperCase();
    setSaved("lang", lang);
  };

  // --- Theme (dark/light) ---
  let theme = getSaved("theme", "dark");
  const applyTheme = () => {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeBtn) themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
    setSaved("theme", theme);
  };

  langBtn?.addEventListener("click", () => {
    lang = lang === "es" ? "en" : "es";
    applyLang();
  });

  themeBtn?.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    applyTheme();
  });

  // --- Copy email (basic mitigation) ---
  // NOTE: We'll replace this email later with your professional email if you want.
  const email = "agnerdiazenc@gmail.com";

  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(email);
      if (hintEl) hintEl.textContent = (dict[lang] || dict.es).copied;
      setTimeout(() => { if (hintEl) hintEl.textContent = ""; }, 2200);
    } catch {
      if (hintEl) hintEl.textContent = (dict[lang] || dict.es).copyFail;
    }
  });

  applyTheme();
  applyLang();
})();

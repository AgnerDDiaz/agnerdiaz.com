(function () {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  const btn = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");

  function closeMobileMenu() {
    if (!btn || !menu) return;
    menu.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  }

  if (btn && menu) {
    btn.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      const isClickInside = menu.contains(e.target) || btn.contains(e.target);
      if (!isClickInside) closeMobileMenu();
    });

    // Close on ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileMenu();
    });

    // Close when clicking any anchor inside menu (mobile)
    menu.querySelectorAll("a[href^='#']").forEach((a) => {
      a.addEventListener("click", () => closeMobileMenu());
    });
  }

  // Theme toggle
  const themeBtn = document.getElementById("themeToggle");
  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    updateThemeButton();
  }
  function updateThemeButton() {
    if (!themeBtn) return;
    const t = getTheme();
  
    themeBtn.textContent = t === "light" ? "☀" : "☾";
    themeBtn.setAttribute("aria-label", t === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro");
  }
  if (themeBtn) {
    updateThemeButton();
    themeBtn.addEventListener("click", () => {
      const next = getTheme() === "light" ? "dark" : "light";
      setTheme(next);
    });
  }

  // Language toggle
  const langBtn = document.getElementById("langToggle");
  if (window.I18N) {
    window.I18N.init();
  }
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      if (window.I18N) window.I18N.toggleLang();
    });
  }

  // ==============================
  // ✅ Premium smooth scroll + correct offset + contact highlight
  // ==============================
  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function getNavHeight() {
    const nav = document.querySelector(".nav");
    return nav ? Math.round(nav.getBoundingClientRect().height) : 0;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function scrollToSectionWithOffset(selector, extraOffset = 12) {
    return new Promise((resolve) => {
      const target = document.querySelector(selector);
      if (!target) return resolve(false);

      const navH = getNavHeight();
      const startY = window.pageYOffset || document.documentElement.scrollTop || 0;

      const targetTop = target.getBoundingClientRect().top + startY;
      const targetY = Math.max(0, Math.round(targetTop - navH - extraOffset));

      if (prefersReducedMotion()) {
        window.scrollTo(0, targetY);
        return resolve(true);
      }

      const duration = 520;
      const start = performance.now();

      function step(now) {
        const p = Math.min(1, (now - start) / duration);
        const eased = easeOutCubic(p);
        const y = Math.round(startY + (targetY - startY) * eased);
        window.scrollTo(0, y);

        if (p < 1) requestAnimationFrame(step);
        else resolve(true);
      }

      requestAnimationFrame(step);
    });
  }

  function highlightContactCard() {
    const card = document.getElementById("contactCard");
    if (!card) return;
    card.classList.remove("contact-highlight");
    // reflow
    void card.offsetWidth;
    card.classList.add("contact-highlight");
  }

  function highlightWhenArriveToContact() {
    const onScroll = () => {
      const contact = document.getElementById("contact");
      if (!contact) return;

      const navH = getNavHeight();
      const rect = contact.getBoundingClientRect();
      const isInView = rect.top <= navH + 30 && rect.bottom >= navH + 30;

      if (isInView) {
        highlightContactCard();
        window.removeEventListener("scroll", onScroll);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    setTimeout(onScroll, 200);
  }

  // Intercept nav anchors (only those that exist)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    a.addEventListener("click", async (e) => {
      const id = href;
      const target = document.querySelector(id);
      if (!target) return;

      // same-page smooth scroll with offset
      e.preventDefault();
      closeMobileMenu();
      await scrollToSectionWithOffset(id, 14);

      if (id === "#contact") highlightContactCard();
    });
  });

  // Ensure CTA contact behaves like nav
  document.querySelectorAll('a[href="#contact"]').forEach((el) => {
    el.addEventListener("click", () => {
      closeMobileMenu();
      highlightWhenArriveToContact();
    });
  });

  // ==============================
  // ✅ Typing engine (bilingüe, reusable, a11y, reduced-motion)
  // ==============================
  function splitRoles(val) {
    if (typeof val !== "string") return [];
    return val
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function getRolesFromI18n(key) {
    if (!window.I18N || typeof window.I18N.get !== "function") return [];
    const v = window.I18N.get(key);
    return splitRoles(v);
  }

  class TypingRotator {
    constructor(container) {
      this.container = container;
      this.key = container.getAttribute("data-typing-key") || "";
      this.textEl = container.querySelector(".typing");
      this.cursorEl = container.querySelector(".typing__cursor");

      this.phrases = [];
      this.idx = 0;

      this.typeDelayMin = 34;
      this.typeDelayMax = 58;
      this.deleteDelayMin = 20;
      this.deleteDelayMax = 34;

      this.pauseAfterTypedMin = 820;
      this.pauseAfterTypedMax = 1050;
      this.pauseAfterDeletedMin = 240;
      this.pauseAfterDeletedMax = 360;

      this._timer = null;
      this._stopped = false;
    }

    _rand(min, max) {
      return Math.floor(min + Math.random() * (max - min + 1));
    }

    _setCursor(on) {
      if (!this.cursorEl) return;
      this.cursorEl.style.opacity = on ? "1" : "0.7";
    }

    stop() {
      this._stopped = true;
      if (this._timer) clearTimeout(this._timer);
      this._timer = null;
    }

    start(phrases) {
      this.stop();
      this._stopped = false;

      this.phrases = Array.isArray(phrases) ? phrases.filter(Boolean) : [];
      if (!this.phrases.length) {
        if (this.textEl) this.textEl.textContent = "";
        return;
      }

      this.idx = 0;

      if (prefersReducedMotion()) {
        // Reduced motion: show first phrase only, no animation
        if (this.textEl) this.textEl.textContent = this.phrases[0];
        if (this.cursorEl) this.cursorEl.style.display = "none";
        return;
      } else {
        if (this.cursorEl) this.cursorEl.style.display = "";
      }

      // Init empty
      if (this.textEl) this.textEl.textContent = "";
      this._setCursor(true);

      // Begin
      this._typeLoop("", 0, "typing");
    }

    _typeLoop(current, charIndex, mode) {
      if (this._stopped) return;

      const phrase = this.phrases[this.idx] || "";
      if (!this.textEl) return;

      if (mode === "typing") {
        const nextText = phrase.slice(0, charIndex);
        this.textEl.textContent = nextText;

        if (charIndex <= phrase.length) {
          const delay = this._rand(this.typeDelayMin, this.typeDelayMax);
          this._timer = setTimeout(() => {
            this._typeLoop(nextText, charIndex + 1, "typing");
          }, delay);
          return;
        }

        const pause = this._rand(this.pauseAfterTypedMin, this.pauseAfterTypedMax);
        this._timer = setTimeout(() => {
          this._typeLoop(phrase, phrase.length, "deleting");
        }, pause);
        return;
      }

      // deleting
      if (mode === "deleting") {
        const nextLen = Math.max(0, charIndex - 1);
        const nextText = phrase.slice(0, nextLen);
        this.textEl.textContent = nextText;

        if (nextLen > 0) {
          const delay = this._rand(this.deleteDelayMin, this.deleteDelayMax);
          this._timer = setTimeout(() => {
            this._typeLoop(nextText, nextLen, "deleting");
          }, delay);
          return;
        }

        // Next phrase
        this.idx = (this.idx + 1) % this.phrases.length;
        const pause = this._rand(this.pauseAfterDeletedMin, this.pauseAfterDeletedMax);
        this._timer = setTimeout(() => {
          this._typeLoop("", 0, "typing");
        }, pause);
      }
    }
  }

  const typingInstances = new Map();

  function initTypingForAll() {
    document.querySelectorAll('[data-typing-key]').forEach((container) => {
      const key = container.getAttribute("data-typing-key");
      if (!key) return;

      let inst = typingInstances.get(container);
      if (!inst) {
        inst = new TypingRotator(container);
        typingInstances.set(container, inst);
      }

      const roles = getRolesFromI18n(key);
      inst.start(roles);
    });
  }

  // ==============================
  // ✅ Projects — Tech chips renderer (i18n-aware)
  // ==============================
  const PROJECT_TECH_MAP = {
    flutter: {
      label: "Flutter",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flutter/flutter-original.svg",
    },
    dart: {
      label: "Dart",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg",
    },
    sqlite: {
      label: "SQLite",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sqlite/sqlite-original.svg",
    },
    easylocalization: {
      label: "EasyLocalization",
      iconUrl: null, // no devicon — falls back to text
    },
    fastapi: {
      label: "FastAPI",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/fastapi/fastapi-original.svg",
    },
    docker: {
      label: "Docker",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg",
    },
    gcloudrun: {
      label: "Cloud Run",
      // Devicon doesn't have Cloud Run; Google Cloud is a good visual proxy
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg",
    },
    firestore: {
      label: "Firestore",
      // Devicon doesn't have Firestore; Firebase works as a proxy
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-plain.svg",
    },
    supabase: {
      label: "Supabase",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg",
    },
    postgresql: {
      label: "PostgreSQL",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg",
    },
    stripe: {
      label: "Stripe",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/stripe/stripe-original.svg",
    },
    firebase: {
      label: "Firebase",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-plain.svg",
    },
    mapbox: {
      label: "Mapbox",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mapbox/mapbox-original.svg",
    },
    git: {
      label: "Git",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg",
    },
    github: {
      label: "GitHub",
      iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
    },
  };

  function parseProjectTech(val) {
    if (typeof val !== "string") return [];
    return val
      .split("|")
      .map((s) => String(s).trim().toLowerCase())
      .filter(Boolean);
  }

  function titleCaseToken(token) {
    // Keep common acronyms
    if (token === "api") return "API";
    if (token === "ci/cd") return "CI/CD";
    return token
      .split(/[\s\-_]+/g)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
      .join(" ");
  }

  function resolveTechLabel(token) {
    // Optional: allow per-language labels via i18n keys like techLabels.flutter
    if (window.I18N && typeof window.I18N.get === "function") {
      const maybe = window.I18N.get(`techLabels.${token}`);
      if (typeof maybe === "string" && maybe.trim()) return maybe.trim();
    }
    const meta = PROJECT_TECH_MAP[token];
    if (meta && meta.label) return meta.label;
    return titleCaseToken(token);
  }

  function resolveTechIcon(token) {
    const meta = PROJECT_TECH_MAP[token];
    return meta && meta.iconUrl ? meta.iconUrl : null;
  }

  function renderProjectTechChips() {
    const nodes = document.querySelectorAll("[data-project-tech]");
    if (!nodes || nodes.length === 0) return;

    const hasI18n = window.I18N && typeof window.I18N.get === "function";

    nodes.forEach((wrap) => {
      const key = wrap.getAttribute("data-project-tech");
      if (!key) return;

      const raw = hasI18n ? window.I18N.get(key) : "";
      const tokens = parseProjectTech(raw);

      wrap.innerHTML = "";

      if (!tokens.length) {
        wrap.hidden = true;
        return;
      }

      wrap.hidden = false;
      wrap.setAttribute("role", "list");

      tokens.forEach((token) => {
        const label = resolveTechLabel(token);
        const iconUrl = resolveTechIcon(token);

        const chip = document.createElement("div");
        chip.className = "tech-chip" + (iconUrl ? "" : " is-text-only");
        chip.setAttribute("tabindex", "0");
        chip.setAttribute("role", "listitem");
        chip.setAttribute("aria-label", label);

        if (iconUrl) {
          const img = document.createElement("img");
          img.src = iconUrl;
          img.alt = label;
          img.loading = "lazy";
          img.decoding = "async";
          img.onerror = () => {
            // Fallback: remove image if CDN/icon fails
            if (img && img.parentNode) img.parentNode.removeChild(img);
            chip.classList.add("is-text-only");
          };
          chip.appendChild(img);
        }

        const span = document.createElement("span");
        span.textContent = label;
        chip.appendChild(span);

        wrap.appendChild(chip);
      });
    });
  }

  function initProjectTechChips() {
    try {
      renderProjectTechChips();
    } catch (e) {
      // Never break the page if something goes wrong
      console.error("[projects] Tech chips render failed:", e);
    }
  }

  // Init once (when i18n is ready)
  if (window.I18N && typeof window.I18N.onReady === "function") {
    window.I18N.onReady(() => { initTypingForAll(); initProjectTechChips(); });
  } else {
    // fallback: init a bit later
    setTimeout(() => { initTypingForAll(); initProjectTechChips(); }, 80);
  }

  // React to language changes (no reload)
  window.addEventListener("i18n:changed", () => {
    initTypingForAll();
    initProjectTechChips();
  });

  // ==============================
  // ✅ Contact form — Netlify Forms + premium UX (i18n, validation, loading)
  // ==============================
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("contactStatus");
  const submitBtn = document.getElementById("contactSubmit");

  const fieldSubject = document.getElementById("contactSubject");
  const fieldEmail = document.getElementById("contactEmail");
  const fieldMessage = document.getElementById("contactMessage");

  const errSubject = document.getElementById("errSubject");
  const errEmail = document.getElementById("errEmail");
  const errMessage = document.getElementById("errMessage");

  let statusTimer = null;
  let sending = false;

  function t(key, fallback) {
    try {
      const v = window.I18N && typeof window.I18N.get === "function" ? window.I18N.get(key) : null;
      return (typeof v === "string" && v.trim()) ? v : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function clearFieldError(inputEl, errorEl) {
    if (inputEl) inputEl.classList.remove("is-invalid");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.hidden = true;
    }
  }

  function setFieldError(inputEl, errorEl, msg) {
    if (inputEl) inputEl.classList.add("is-invalid");
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
    }
  }

  function clearStatus() {
    if (!statusEl) return;
    statusEl.hidden = true;
    statusEl.classList.remove("form-status--success", "form-status--error");
    statusEl.innerHTML = "";
  }

  function showStatus(type, title, message) {
    if (!statusEl) return;
    if (statusTimer) clearTimeout(statusTimer);

    statusEl.hidden = false;
    statusEl.classList.remove("form-status--success", "form-status--error");
    statusEl.classList.add(type === "success" ? "form-status--success" : "form-status--error");
    statusEl.innerHTML = `<strong>${title}</strong><span>${message}</span>`;

    statusTimer = setTimeout(() => {
      clearStatus();
    }, 5200);
  }

  function isValidEmail(val) {
    // Simple, safe check (avoid over-strict regex)
    const s = String(val || "").trim();
    if (!s) return true; // optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function setSendingState(isSending) {
    sending = isSending;
    if (!submitBtn) return;

    submitBtn.disabled = isSending;

    if (isSending) {
      submitBtn.textContent = t("contact.sending", "Enviando…");
    } else {
      // Use i18n button label if available, else keep current text
      const label = t("contact.form.send", "");
      if (label) submitBtn.textContent = label;
    }
  }

  function validateForm() {
    let ok = true;

    clearFieldError(fieldSubject, errSubject);
    clearFieldError(fieldEmail, errEmail);
    clearFieldError(fieldMessage, errMessage);

    const subjectVal = fieldSubject ? String(fieldSubject.value || "").trim() : "";
    const messageVal = fieldMessage ? String(fieldMessage.value || "").trim() : "";
    const emailVal = fieldEmail ? String(fieldEmail.value || "").trim() : "";

    if (!subjectVal) {
      ok = false;
      setFieldError(
        fieldSubject,
        errSubject,
        t("contact.validation.subjectRequired", "El asunto es obligatorio.")
      );
    }

    if (emailVal && !isValidEmail(emailVal)) {
      ok = false;
      setFieldError(
        fieldEmail,
        errEmail,
        t("contact.validation.emailInvalid", "Escribe un correo válido.")
      );
    }

    if (!messageVal) {
      ok = false;
      setFieldError(
        fieldMessage,
        errMessage,
        t("contact.validation.messageRequired", "El mensaje es obligatorio.")
      );
    }

    return ok;
  }

  async function submitNetlify(formEl) {
    const action = formEl.getAttribute("action") || "/";
    const formData = new FormData(formEl);

    // Ensure form-name matches the form name (Netlify requirement)
    if (!formData.get("form-name")) {
      formData.append("form-name", formEl.getAttribute("name") || "contact");
    }

    const res = await fetch(action, {
      method: "POST",
      body: formData,
      headers: { "Accept": "text/html" },
    });

    // Netlify often responds with 200 even though it stores submission
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;
    clearStatus();

    if (!validateForm()) return;

    try {
      setSendingState(true);

      // UX: keep highlight if user submits
      highlightContactCard();

      await submitNetlify(form);

      showStatus(
        "success",
        t("contact.successTitle", "Mensaje enviado"),
        t("contact.successMessage", "Gracias, te responderé pronto.")
      );

      // Reset fields + clear errors
      form.reset();
      clearFieldError(fieldSubject, errSubject);
      clearFieldError(fieldEmail, errEmail);
      clearFieldError(fieldMessage, errMessage);
    } catch (err) {
      console.error("[contact] submit failed:", err);
      showStatus(
        "error",
        t("contact.errorTitle", "No se pudo enviar"),
        t("contact.errorMessage", "Intenta de nuevo.")
      );
    } finally {
      setSendingState(false);
    }
  }

  function bindLiveValidation() {
    if (fieldSubject) {
      fieldSubject.addEventListener("input", () => clearFieldError(fieldSubject, errSubject));
      fieldSubject.addEventListener("blur", () => {
        const v = String(fieldSubject.value || "").trim();
        if (!v) setFieldError(fieldSubject, errSubject, t("contact.validation.subjectRequired", "El asunto es obligatorio."));
      });
    }

    if (fieldEmail) {
      fieldEmail.addEventListener("input", () => clearFieldError(fieldEmail, errEmail));
      fieldEmail.addEventListener("blur", () => {
        const v = String(fieldEmail.value || "").trim();
        if (v && !isValidEmail(v)) setFieldError(fieldEmail, errEmail, t("contact.validation.emailInvalid", "Escribe un correo válido."));
      });
    }

    if (fieldMessage) {
      fieldMessage.addEventListener("input", () => clearFieldError(fieldMessage, errMessage));
      fieldMessage.addEventListener("blur", () => {
        const v = String(fieldMessage.value || "").trim();
        if (!v) setFieldError(fieldMessage, errMessage, t("contact.validation.messageRequired", "El mensaje es obligatorio."));
      });
    }
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
    bindLiveValidation();

    // Update button label on language change (if not sending)
    window.addEventListener("i18n:changed", () => {
      if (!sending) setSendingState(false);
      // Also clear status text (avoid mixing languages)
      clearStatus();
    });
  }

})();

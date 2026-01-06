(function () {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  const btn = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");

  if (btn && menu) {
    btn.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });

    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        menu.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      });
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
    langBtn.addEventListener("click", async () => {
      if (window.I18N) await window.I18N.toggleLang();
    });
  }

  // Show form success message if ?sent=1
  try {
    const params = new URLSearchParams(window.location.search);
    const sent = params.get("sent");
    const success = document.getElementById("formSuccess");
    if (sent === "1" && success) success.hidden = false;
  } catch (_) {}
})();

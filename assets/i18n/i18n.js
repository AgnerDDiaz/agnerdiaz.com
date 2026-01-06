(function () {
    const SUPPORTED = ["es", "en"];
    const DEFAULT = "es";
  
    const cache = new Map();
    let currentLang = getSavedLang();
  
    function getSavedLang() {
      const saved = localStorage.getItem("lang");
      return SUPPORTED.includes(saved) ? saved : DEFAULT;
    }
  
    async function fetchFirstOk(urls) {
      let lastErr = null;
  
      for (const url of urls) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) {
            lastErr = new Error(`HTTP ${res.status} for ${url}`);
            continue;
          }
          return await res.json();
        } catch (e) {
          lastErr = e;
        }
      }
  
      throw lastErr || new Error("No translation URL worked.");
    }
  
    async function loadDict(lang) {
      if (cache.has(lang)) return cache.get(lang);
  
      // Rutas robustas para:
      // - /index.html (raíz)
      // - /links/index.html (subcarpeta)
      // - despliegues en subpath (GitHub Pages / hosting con carpeta)
      const candidates = [
        `./assets/i18n/${lang}.json`,
        `/assets/i18n/${lang}.json`,
        `../assets/i18n/${lang}.json`,
        `./${lang}.json`,
        `../${lang}.json`,
      ];
  
      try {
        const dict = await fetchFirstOk(candidates);
        cache.set(lang, dict);
        return dict;
      } catch (error) {
        console.error(
          `[i18n] No pude cargar el diccionario "${lang}". Probé:`,
          candidates,
          "Error:",
          error
        );
        return null;
      }
    }
  
    function getByPath(obj, path) {
      if (!obj) return null;
      return path
        .split(".")
        .reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);
    }
  
    function applyTranslations(dict) {
      if (!dict) return;
  
      // Text nodes
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        const val = getByPath(dict, key);
        if (typeof val === "string") {
            el.textContent = val;
          } else if (Array.isArray(val)) {
            // Renderiza párrafos dentro del contenedor actual
            el.innerHTML = "";
            val.forEach((paragraph) => {
              const p = document.createElement("p");
              p.textContent = paragraph;
              p.style.margin = "0 0 12px";
              el.appendChild(p);
            });
            // Quita el margen del último
            const last = el.lastElementChild;
            if (last) last.style.margin = "0";
          }
          
      });
  
      // Placeholders
      document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        const val = getByPath(dict, key);
        if (typeof val === "string") el.setAttribute("placeholder", val);
      });
    }
  
    async function setLang(lang) {
      if (!SUPPORTED.includes(lang)) lang = DEFAULT;
  
      const dict = await loadDict(lang);
      applyTranslations(dict);
  
      currentLang = lang;
      localStorage.setItem("lang", lang);
      document.documentElement.setAttribute("lang", lang);
  
      const btn = document.getElementById("langToggle");
      if (btn) btn.textContent = lang.toUpperCase();
    }
  
    async function toggleLang() {
      const next = currentLang === "es" ? "en" : "es";
      await setLang(next);
    }
  
    async function init() {
      await setLang(currentLang);
    }
  
    window.I18N = { init, setLang, toggleLang };
  })();
  
(function () {
  const SUPPORTED = ["es", "en"];
  const DEFAULT = "es";

  const cache = new Map();
  let currentLang = getSavedLang();
  let currentDict = null;

  const readyCallbacks = [];
  let readyFired = false;

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

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = getByPath(dict, key);
      if (typeof val === "string") {
        el.textContent = val;
      } else if (Array.isArray(val)) {
        el.innerHTML = "";
        val.forEach((paragraph) => {
          const p = document.createElement("p");
          p.textContent = paragraph;
          p.style.margin = "0 0 12px";
          el.appendChild(p);
        });
        const last = el.lastElementChild;
        if (last) last.style.margin = "0";
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const val = getByPath(dict, key);
      if (typeof val === "string") el.setAttribute("placeholder", val);
    });
  }

  function fireReady() {
    if (readyFired) return;
    readyFired = true;
    readyCallbacks.splice(0).forEach((cb) => {
      try { cb(); } catch (_) {}
    });
  }

  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT;

    const dict = await loadDict(lang);
    applyTranslations(dict);

    currentLang = lang;
    currentDict = dict;

    localStorage.setItem("lang", lang);
    document.documentElement.setAttribute("lang", lang);

    const btn = document.getElementById("langToggle");
    if (btn) btn.textContent = lang.toUpperCase();

    // ✅ Notify listeners (typing, etc.)
    try {
      window.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang, dict } }));
    } catch (_) {}

    // ✅ Ready hook (first load)
    if (dict) fireReady();
  }

  async function toggleLang() {
    const next = currentLang === "es" ? "en" : "es";
    await setLang(next);
  }

  async function init() {
    await setLang(currentLang);
  }

  // ✅ Public helpers (needed for typing engine without hardcoding)
  function get(key) {
    return getByPath(currentDict, key);
  }

  function onReady(cb) {
    if (readyFired) {
      try { cb(); } catch (_) {}
      return;
    }
    readyCallbacks.push(cb);
  }

  window.I18N = { init, setLang, toggleLang, get, onReady };
})();

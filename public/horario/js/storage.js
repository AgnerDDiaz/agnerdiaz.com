/*
 * Horario UASD — storage.js
 * Local persistence (localStorage). The user's schedule, types and settings
 * are saved on THIS device/browser only — never sent to any server (more
 * private than cookies, and not transmitted with requests).
 *
 * The store is deliberately tiny and defensive: it tolerates unavailable
 * storage (private mode / disabled), corrupt JSON and quota errors without
 * breaking the app (it just falls back to in-memory).
 *
 * Attaches to window.Horario.storage.
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});
  var KEY = "horario-uasd:v1";
  var SCHEMA = 1;

  function ls() {
    try { return root.localStorage || null; } catch (e) { return null; }
  }

  function available() {
    var store = ls();
    if (!store) return false;
    try {
      var k = "__hz_probe__";
      store.setItem(k, "1");
      store.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Returns { items, types, settings } (any may be null/[]), or null if nothing
  // usable is stored.
  function load() {
    var store = ls();
    if (!store) return null;
    var raw;
    try { raw = store.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return null; }
    if (!data || typeof data !== "object") return null;
    return {
      version: data.v || 1,
      items: Array.isArray(data.items) ? data.items : [],
      types: Array.isArray(data.types) ? data.types : null,
      settings: data.settings && typeof data.settings === "object" ? data.settings : null
    };
  }

  // Persist a payload { items, types, settings }. Returns true on success.
  function save(payload) {
    var store = ls();
    if (!store) return false;
    try {
      store.setItem(KEY, JSON.stringify({
        v: SCHEMA,
        savedAt: Date.now(),
        items: payload.items || [],
        types: payload.types || [],
        settings: payload.settings || {}
      }));
      return true;
    } catch (e) {
      return false; // quota exceeded / private mode
    }
  }

  function clear() {
    var store = ls();
    if (!store) return;
    try { store.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  H.storage = {
    KEY: KEY,
    SCHEMA: SCHEMA,
    available: available,
    load: load,
    save: save,
    clear: clear
  };
})(window);

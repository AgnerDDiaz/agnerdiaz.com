/*
 * Horario UASD — types.js
 * Activity type registry (decoupled from the activities themselves) plus
 * color derivation used to paint event cards with enough contrast in both
 * light and dark themes. Attaches to window.Horario.types.
 *
 * A type is: { id, name, color }.
 * The engine never assumes a fixed set — custom types can be added later
 * without touching layout/render code.
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});

  var DEFAULTS = [
    { id: "uasd", name: "Dentro UASD", color: "#D90429" },
    { id: "external", name: "Hospital / Fuera UASD", color: "#3A86FF" },
    { id: "virtual", name: "Virtual", color: "#2A9D8F" },
    { id: "personal", name: "Personal", color: "#E9A100" }
  ];

  function createDefaults() {
    return DEFAULTS.map(function (t) {
      return { id: t.id, name: t.name, color: t.color };
    });
  }

  function hexToRgb(hex) {
    if (typeof hex !== "string") return null;
    var value = hex.trim().replace(/^#/, "");
    if (value.length === 3) {
      value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
    }
    if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  /**
   * Derive the CSS custom properties for an event card from a base color.
   * We keep the card text on the theme's own text color (guaranteed contrast)
   * and use the type color for the accent bar, tint and border only.
   */
  function deriveStyle(color) {
    var rgb = hexToRgb(color) || { r: 141, g: 153, b: 174 };
    var base = rgb.r + "," + rgb.g + "," + rgb.b;
    return {
      accent: color,
      bg: "rgba(" + base + ",0.16)",
      border: "rgba(" + base + ",0.55)",
      strong: "rgba(" + base + ",0.95)"
    };
  }

  /** Find a type by id, falling back to the first type or a neutral default. */
  function findType(types, typeId) {
    var list = types || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === typeId) return list[i];
    }
    return list[0] || { id: "", name: "", color: "#8D99AE" };
  }

  H.types = {
    DEFAULTS: DEFAULTS,
    createDefaults: createDefaults,
    deriveStyle: deriveStyle,
    findType: findType,
    hexToRgb: hexToRgb
  };
})(window);

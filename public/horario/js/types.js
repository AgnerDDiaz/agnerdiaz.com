/*
 * Horario UASD — types.js
 * Activity type registry. A type separates its FUNCTIONAL IDENTITY from its
 * VISIBLE NAME:
 *
 *   { id, semanticRole, name, color, system }
 *
 * - id           immutable internal id.
 * - semanticRole immutable functional role ("uasd" | "hospital" | "virtual"
 *                | "personal" | ""). The importer classifies by semanticRole,
 *                never by name — so a user can rename/recolor a type and the
 *                importer keeps assigning the right activities to it.
 * - name         user-visible label (editable).
 * - color        base color (editable); tint/border/text are derived for
 *                contrast in both light and dark.
 * - system       true for uasd/hospital/virtual: cannot be deleted or have
 *                their role changed (only name + color).
 *
 * Attaches to window.Horario.types.
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});

  var DEFAULTS = [
    { id: "type-uasd", semanticRole: "uasd", name: "Dentro UASD", color: "#3A86FF", system: true },
    { id: "type-hospital", semanticRole: "hospital", name: "Hospital / Fuera UASD", color: "#E9A100", system: true },
    { id: "type-virtual", semanticRole: "virtual", name: "Virtual", color: "#2A9D8F", system: true },
    { id: "type-personal", semanticRole: "personal", name: "Personal", color: "#9B5DE5", system: false }
  ];

  // Short, non-technical explanations shown when editing a system type.
  var ROLE_MESSAGES = {
    uasd: "Tipo utilizado por el importador. Puedes cambiar su nombre y color. El importador seguirá utilizando este tipo para identificar las clases que se imparten dentro de la UASD.",
    hospital: "Tipo utilizado por el importador. Puedes cambiar su nombre y color. El importador seguirá utilizando este tipo para las clases detectadas fuera de la UASD, como hospitales y maternidades.",
    virtual: "Tipo utilizado por el importador. Puedes cambiar su nombre y color. El importador seguirá utilizando este tipo para las clases virtuales o con ubicación PA."
  };

  function createDefaults() {
    return DEFAULTS.map(function (t) {
      return { id: t.id, semanticRole: t.semanticRole, name: t.name, color: t.color, system: t.system };
    });
  }

  function hexToRgb(hex) {
    if (typeof hex !== "string") return null;
    var value = hex.trim().replace(/^#/, "");
    if (value.length === 3) value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
    if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  // Relative luminance (0..1) for contrast decisions.
  function luminance(rgb) {
    var ch = [rgb.r, rgb.g, rgb.b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }

  function mix(rgb, other, weight) {
    return {
      r: Math.round(rgb.r * (1 - weight) + other.r * weight),
      g: Math.round(rgb.g * (1 - weight) + other.g * weight),
      b: Math.round(rgb.b * (1 - weight) + other.b * weight)
    };
  }

  /**
   * CSS custom properties for an on-screen event card. Card text stays on the
   * theme's own text color; the type color drives the accent bar, tint and
   * border. Returns strings ready for inline CSS vars.
   */
  function deriveStyle(color) {
    var rgb = hexToRgb(color) || { r: 141, g: 153, b: 174 };
    var base = rgb.r + "," + rgb.g + "," + rgb.b;
    return {
      accent: color,
      bg: "rgba(" + base + ",0.20)",
      border: "rgba(" + base + ",0.60)",
      strong: "rgba(" + base + ",0.95)"
    };
  }

  /**
   * Print-friendly palette for a color (light background). Returns rgb tuples
   * for a pastel tint, a solid border, an accent bar and a readable text color.
   */
  function derivePrintStyle(color) {
    var rgb = hexToRgb(color) || { r: 141, g: 153, b: 174 };
    var white = { r: 255, g: 255, b: 255 };
    var black = { r: 26, g: 26, b: 26 };
    var tint = mix(rgb, white, 0.82); // soft pastel
    var border = mix(rgb, white, 0.15);
    // Text: dark by default (light tint); keep dark unless tint is very dark.
    var text = luminance(tint) < 0.4 ? white : black;
    return {
      fill: [tint.r, tint.g, tint.b],
      border: [border.r, border.g, border.b],
      accent: [rgb.r, rgb.g, rgb.b],
      text: [text.r, text.g, text.b]
    };
  }

  function findType(types, typeId) {
    var list = types || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === typeId) return list[i];
    return list[0] || { id: "", name: "", color: "#8D99AE", semanticRole: "" };
  }

  function findBySemanticRole(types, role) {
    var list = types || [];
    for (var i = 0; i < list.length; i++) if (list[i].semanticRole === role) return list[i];
    return null;
  }

  H.types = {
    DEFAULTS: DEFAULTS,
    ROLE_MESSAGES: ROLE_MESSAGES,
    createDefaults: createDefaults,
    deriveStyle: deriveStyle,
    derivePrintStyle: derivePrintStyle,
    findType: findType,
    findBySemanticRole: findBySemanticRole,
    hexToRgb: hexToRgb,
    luminance: luminance
  };
})(window);

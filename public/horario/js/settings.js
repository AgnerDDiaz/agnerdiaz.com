/*
 * Horario UASD — settings.js
 * Settings state shape + validation. Kept pure so it can be persisted later
 * (storage.js) without any UI rewrite. Attaches to window.Horario.settings.
 *
 * Settings shape:
 *   { hourFormat: "24" | "12", rangeStart: "HH:mm", rangeEnd: "HH:mm" }
 *
 * The visible range is snapped to whole hours so the hour grid lines always
 * align with the axis labels. Event times themselves stay minute-precise.
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});

  function createDefault() {
    return { hourFormat: "24", rangeStart: "07:00", rangeEnd: "22:00" };
  }

  /** Floor a minutes value down to the hour. */
  function floorHour(min) {
    return Math.floor(min / 60) * 60;
  }

  /** Ceil a minutes value up to the hour. */
  function ceilHour(min) {
    return Math.ceil(min / 60) * 60;
  }

  /**
   * Validate + normalize a visible range.
   * Snaps start down and end up to whole hours and enforces start < end.
   * Returns { ok, startMin, endMin, rangeStart, rangeEnd } or { ok:false, error }.
   */
  function normalizeRange(startHHmm, endHHmm) {
    var s = H.utils.timeToMinutes(startHHmm);
    var e = H.utils.timeToMinutes(endHHmm);
    if (isNaN(s) || isNaN(e)) {
      return { ok: false, error: "Introduce horas válidas para el rango." };
    }
    var startMin = H.utils.clamp(floorHour(s), 0, 23 * 60);
    var endMin = H.utils.clamp(ceilHour(e), 60, 24 * 60);
    if (startMin >= endMin) {
      return { ok: false, error: "La hora de inicio debe ser menor que la de fin." };
    }
    return {
      ok: true,
      startMin: startMin,
      endMin: endMin,
      rangeStart: H.utils.minutesToTime(startMin),
      rangeEnd: H.utils.minutesToTime(endMin)
    };
  }

  H.settings = {
    createDefault: createDefault,
    normalizeRange: normalizeRange,
    floorHour: floorHour,
    ceilHour: ceilHour
  };
})(window);

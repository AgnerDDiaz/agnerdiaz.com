/*
 * Horario UASD — events.js
 * The ScheduleItem model + collection helpers (create / validate / duplicate).
 * This is the shared model for BOTH manual items (source: "manual") and, in a
 * later iteration, imported UASD items (source: "uasd"). It holds no DOM.
 * Attaches to window.Horario.model.
 *
 * ScheduleItem:
 * {
 *   id, title, section, code, location, professor, description,
 *   day, startTime, endTime, typeId, source, autoScheduled
 * }
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});

  var DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  var DAY_LABELS = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo"
  };

  var DAY_SHORT = {
    monday: "Lun",
    tuesday: "Mar",
    wednesday: "Mié",
    thursday: "Jue",
    friday: "Vie",
    saturday: "Sáb",
    sunday: "Dom"
  };

  function str(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function isValidDay(day) {
    return DAYS.indexOf(day) >= 0;
  }

  /**
   * Build a normalized ScheduleItem from raw form/data input.
   * Only `title` is required conceptually; everything else gets safe defaults.
   */
  function createItem(data) {
    data = data || {};
    return {
      id: data.id || H.utils.uid("item"),
      title: str(data.title),
      section: str(data.section),
      code: str(data.code),
      location: str(data.location),
      professor: str(data.professor),
      description: str(data.description),
      day: isValidDay(data.day) ? data.day : "monday",
      startTime: str(data.startTime) || "07:00",
      endTime: str(data.endTime) || "08:00",
      typeId: str(data.typeId) || "type-uasd",
      source: str(data.source) || "manual",
      autoScheduled: !!data.autoScheduled,
      // Optional import metadata (empty for manual items). Lets a later
      // import replace/update/group UASD activities without touching manuals.
      importId: str(data.importId),
      courseKey: str(data.courseKey),
      meetingKey: str(data.meetingKey)
    };
  }

  /**
   * Validate raw input. Returns { ok, errors } where errors maps field -> msg.
   * Rules: title required; valid times; endTime > startTime; valid day.
   */
  function validate(data) {
    var errors = {};
    data = data || {};

    if (!str(data.title)) {
      errors.title = "El título es obligatorio.";
    }

    var start = H.utils.timeToMinutes(data.startTime);
    var end = H.utils.timeToMinutes(data.endTime);

    if (isNaN(start)) errors.startTime = "Introduce una hora de inicio válida.";
    if (isNaN(end)) errors.endTime = "Introduce una hora de fin válida.";
    if (!isNaN(start) && !isNaN(end) && end <= start) {
      errors.endTime = "La hora final debe ser posterior a la inicial.";
    }

    if (!isValidDay(data.day)) {
      errors.day = "Selecciona un día de la semana.";
    }

    return { ok: Object.keys(errors).length === 0, errors: errors };
  }

  /** Duplicate an item, generating a brand-new id (data preserved). */
  function duplicate(item) {
    var copy = createItem(item);
    copy.id = H.utils.uid("item");
    return copy;
  }

  H.model = {
    DAYS: DAYS,
    DAY_LABELS: DAY_LABELS,
    DAY_SHORT: DAY_SHORT,
    isValidDay: isValidDay,
    createItem: createItem,
    validate: validate,
    duplicate: duplicate
  };
})(window);

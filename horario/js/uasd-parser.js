/*
 * Horario UASD — uasd-parser.js
 * PURE parser: DocumentText (from pdf-reader.js) -> UasdImportResult.
 * No DOM, no PDF.js, no ScheduleItem. This is where the testable format
 * knowledge lives. Rules — never course names — drive every decision.
 *
 * Input DocumentText:
 *   { pages: [ { pageNumber, lines: [ { y, tokens:[{text,x,y,width,height}], text } ] } ] }
 *
 * Output UasdImportResult:
 *   { documentType, courses:[Course], stats, warnings:[Diag], errors:[Diag] }
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});

  // ---- Day codes (UASD): I = Miércoles. Never use X. -------------------
  var DAY_CODE_MAP = {
    L: "monday",
    M: "tuesday",
    I: "wednesday",
    J: "thursday",
    V: "friday",
    S: "saturday",
    D: "sunday"
  };

  // ---- Rule constant: "Por Asignar" placeholder used across the PDF ----
  var PA = "PA";

  // ---- Auto-schedule slot for courses without a defined time -----------
  var AUTO_DAY = "sunday";
  var AUTO_START = "08:00";
  var AUTO_END = "09:00";

  function normalizeWhitespace(str) {
    return String(str == null ? "" : str).replace(/\s+/g, " ").trim();
  }

  // Course header: "Título - CÓDIGO - SECCIÓN". Interpreted from the end so
  // titles may contain spaces, accents, parentheses, "Lab", roman numerals.
  // Section preserved as a string (e.g. "02" stays "02", "W05" stays "W05").
  var HEADER_RE = /^(.+?)\s-\s([A-Z]{2,4}\s+\d{3,4})\s-\s([A-Za-z0-9]+)$/;

  function parseCourseHeader(text) {
    var line = normalizeWhitespace(text);
    var m = HEADER_RE.exec(line);
    if (!m) return null;
    return {
      title: normalizeWhitespace(m[1]),
      code: normalizeWhitespace(m[2]),
      section: m[3] // keep exactly, never Number()
    };
  }

  // 12h clock token -> "HH:mm" (24h). Handles 12 AM (00) and 12 PM (12).
  function parseClock(token) {
    var m = /(\d{1,2}):(\d{2})\s*([AaPp])\.?\s*[Mm]\.?/.exec(String(token));
    if (!m) return null;
    var h = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    var isPm = /[Pp]/.test(m[3]);
    if (h < 1 || h > 12 || min < 0 || min > 59) return null;
    if (isPm && h !== 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return (h < 10 ? "0" : "") + h + ":" + (min < 10 ? "0" : "") + min;
  }

  // "7:00 PM - 9:50 PM" (any spacing / line-break artifacts) -> {startTime,endTime}
  // Returns null when it is not a real time range (e.g. "PA").
  function parseTimeRange(raw) {
    var text = normalizeWhitespace(raw);
    if (!text || text.toUpperCase() === PA) return null;
    var parts = text.split(/\s-\s/);
    if (parts.length !== 2) {
      // Fallback: split on the dash between two clock tokens.
      var m = /(\d{1,2}:\d{2}\s*[AaPp]\.?\s*[Mm]\.?)\s*-\s*(\d{1,2}:\d{2}\s*[AaPp]\.?\s*[Mm]\.?)/.exec(text);
      if (!m) return null;
      parts = [m[1], m[2]];
    }
    var start = parseClock(parts[0]);
    var end = parseClock(parts[1]);
    if (!start || !end) return null;
    return { startTime: start, endTime: end };
  }

  // "LMI" -> ["monday","tuesday","wednesday"]; reports unknown codes.
  function expandDayCodes(raw) {
    var text = normalizeWhitespace(raw).replace(/\s+/g, "");
    var days = [];
    var unknown = [];
    if (!text || text.toUpperCase() === PA) return { days: days, unknown: unknown };
    for (var i = 0; i < text.length; i++) {
      var ch = text[i].toUpperCase();
      if (DAY_CODE_MAP[ch]) {
        if (days.indexOf(DAY_CODE_MAP[ch]) < 0) days.push(DAY_CODE_MAP[ch]);
      } else {
        unknown.push(text[i]);
      }
    }
    return { days: days, unknown: unknown };
  }

  // Remove only the trailing "( P )" / "(P)" marker; keep real names intact.
  function stripInstructorMarker(raw) {
    var text = normalizeWhitespace(raw);
    return normalizeWhitespace(text.replace(/\(\s*P\s*\)\s*$/i, ""));
  }

  // Classification. Rules only — never titles.
  //  virtual  : method mentions Virtual/Internet OR location === "PA"
  //  hospital : location mentions HOSP / HOSPITAL / MATERNIDAD
  //  uasd     : anything else
  function classifyUasdCourse(course, meeting) {
    var method = normalizeWhitespace((course && course.educationalMethod) || "").toUpperCase();
    var location = normalizeWhitespace((meeting && meeting.location) || "").toUpperCase();

    if (/VIRTUAL|INTERNET/.test(method) || location === PA) return "virtual";
    if (/\bHOSP\b|HOSPITAL|MATERNIDAD/.test(location)) return "hospital";
    return "uasd";
  }

  // ---- Noise / structural line detectors --------------------------------
  function isNoiseLine(text) {
    var t = normalizeWhitespace(text);
    if (!t) return true;
    if (/^Página\s+\d+\s+de\s+\d+$/i.test(t)) return true;
    if (/^https?:\/\//i.test(t)) return true;
    if (/^Horario de Detalle de Alumno$/i.test(t)) return true;
    if (/^MAPA DE SITIO$/i.test(t)) return true;
    if (/^Regresar a Anterior$/i.test(t)) return true;
    if (/^Mostrar Inscripciones/i.test(t)) return true;
    if (/^Registros de Alumnos/i.test(t)) return true;
    if (/^Total horas$/i.test(t)) return true;
    return false;
  }

  function isHorasReunionLine(text) {
    return /^Horas de Reuni[oó]n Programadas$/i.test(normalizeWhitespace(text));
  }

  function isScheduleWrapLine(text) {
    return /^Horario$/i.test(normalizeWhitespace(text));
  }

  // A meeting-table header line contains the column labels.
  function isTableHeaderLine(line) {
    var texts = (line.tokens || []).map(function (t) { return normalizeWhitespace(t.text); });
    var hasTipo = texts.indexOf("Tipo") >= 0;
    var hasHora = texts.indexOf("Hora") >= 0;
    var hasDias = texts.some(function (s) { return /^D[ií]as$/.test(s); });
    var hasDonde = texts.some(function (s) { return /^D[óo]nde$/.test(s); });
    return hasTipo && hasHora && hasDias && hasDonde;
  }

  // Column x-starts from a table header line.
  function detectColumns(headerTokens) {
    var cols = {};
    (headerTokens || []).forEach(function (t) {
      var s = normalizeWhitespace(t.text);
      if (s === "Tipo" && cols.type == null) cols.type = t.x;
      else if (s === "Hora" && cols.time == null) cols.time = t.x;
      else if (/^D[ií]as$/.test(s)) cols.days = t.x;
      else if (/^D[óo]nde$/.test(s)) cols.where = t.x;
      else if (/^Rango/.test(s)) cols.dateRange = t.x;
      else if (/^Tipo de/.test(s)) cols.scheduleType = t.x;
      else if (/^Instructor/.test(s)) cols.instructor = t.x;
    });
    var order = ["type", "time", "days", "where", "dateRange", "scheduleType", "instructor"];
    var list = [];
    order.forEach(function (name) {
      if (cols[name] != null) list.push({ name: name, x: cols[name] });
    });
    list.sort(function (a, b) { return a.x - b.x; });
    return list; // [{name, x}] sorted by x
  }

  // Assign a token to the nearest column start (cells are left-aligned).
  function columnFor(tokenX, columns) {
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < columns.length; i++) {
      var d = Math.abs(tokenX - columns[i].x);
      if (d < bestDist) { bestDist = d; best = columns[i].name; }
    }
    return best;
  }

  // Build cell strings for a meeting from its accumulated tokens.
  // tokensByCol: { colName: [ {text,x,order} ] }
  function buildCells(tokensByCol) {
    var cells = {};
    Object.keys(tokensByCol).forEach(function (col) {
      var toks = tokensByCol[col].slice().sort(function (a, b) {
        if (a.order !== b.order) return a.order - b.order; // line order (top->bottom)
        return a.x - b.x;
      });
      cells[col] = normalizeWhitespace(toks.map(function (t) { return t.text; }).join(" "));
    });
    return cells;
  }

  function diag(code, severity, message, extra) {
    var d = { code: code, severity: severity, message: message };
    if (extra) Object.keys(extra).forEach(function (k) { d[k] = extra[k]; });
    return d;
  }

  // ---- Main entry -------------------------------------------------------
  function parseUasdDocument(documentText) {
    var warnings = [];
    var errors = [];
    var courses = [];

    var lines = flattenLines(documentText);

    var current = null;      // current course
    var columns = null;      // current table columns
    var inTable = false;
    var meeting = null;      // current meeting (accumulating tokens)

    function finalizeMeetingTokens() { /* cells are built lazily below */ }

    lines.forEach(function (line) {
      var text = normalizeWhitespace(line.text);

      if (isNoiseLine(text)) return;

      var header = parseCourseHeader(text);
      if (header) {
        current = {
          title: header.title,
          code: header.code,
          section: header.section,
          nrc: "",
          assignedInstructor: "",
          educationalMethod: "",
          credits: "",
          campus: "",
          page: line.page,
          meetings: []
        };
        courses.push(current);
        columns = null;
        inTable = false;
        meeting = null;
        return;
      }

      if (!current) return; // ignore anything before the first course

      if (isHorasReunionLine(text)) {
        inTable = false;
        meeting = null;
        return;
      }

      if (isTableHeaderLine(line)) {
        columns = detectColumns(line.tokens);
        inTable = true;
        meeting = null;
        return;
      }

      if (isScheduleWrapLine(text)) return; // "Horario" (wrapped header label)

      if (inTable && columns && columns.length) {
        handleTableRow(line, columns, current, function (m) { meeting = m; }, function () { return meeting; });
        return;
      }

      // Otherwise: academic block field.
      parseBlockField(text, current);
    });

    // Build meeting cells + interpret, generate diagnostics.
    courses.forEach(function (course) {
      if (!course.meetings.length) {
        warnings.push(diag("COURSE_WITHOUT_MEETINGS", "warning",
          course.title + " — Sección " + course.section + ": sin reuniones detectadas.",
          { courseKey: courseKey(course), page: course.page }));
      }
      course.meetings.forEach(function (m) {
        interpretMeeting(course, m, warnings, errors);
      });
    });

    var stats = computeStats(courses, warnings, errors);

    return {
      documentType: "uasd-student-schedule",
      courses: courses,
      stats: stats,
      warnings: warnings,
      errors: errors
    };
  }

  function handleTableRow(line, columns, course, setMeeting, getMeeting) {
    var typeX = null;
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].name === "type") typeX = columns[i].x;
    }
    // A new meeting starts when a token sits in the "Tipo" column.
    var hasType = (line.tokens || []).some(function (t) {
      return columnFor(t.x, columns) === "type";
    });

    var meeting = getMeeting();
    if (hasType || !meeting) {
      meeting = { tokensByCol: {}, _order: 0, page: line.page };
      course.meetings.push(meeting);
      setMeeting(meeting);
    }
    meeting._order += 1;
    (line.tokens || []).forEach(function (t) {
      var col = columnFor(t.x, columns);
      if (!col) return;
      if (!meeting.tokensByCol[col]) meeting.tokensByCol[col] = [];
      meeting.tokensByCol[col].push({ text: t.text, x: t.x, order: meeting._order });
    });
  }

  function interpretMeeting(course, m, warnings, errors) {
    var cells = buildCells(m.tokensByCol || {});
    m.type = cells.type || "";
    m.rawTime = cells.time || "";
    m.rawDays = cells.days || "";
    m.location = cells.where || "";
    m.scheduleType = cells.scheduleType || "";
    m.instructor = stripInstructorMarker(cells.instructor || "");

    var time = parseTimeRange(m.rawTime);
    var dayInfo = expandDayCodes(m.rawDays);

    m.classification = classifyUasdCourse(course, m);

    // Unscheduled: no parseable time (UASD marks it "PA").
    if (!time) {
      m.unscheduled = true;
      m.autoScheduled = true;
      m.startTime = AUTO_START;
      m.endTime = AUTO_END;
      m.days = [AUTO_DAY];
      warnings.push(diag("UNSCHEDULED_AUTO_ASSIGNED", "warning",
        course.title + " — Sección " + course.section +
        " no tiene horario definido. Se colocó automáticamente el domingo de 08:00 a 09:00.",
        { courseKey: courseKey(course), page: m.page }));
      return;
    }

    m.unscheduled = false;
    m.autoScheduled = false;
    m.startTime = time.startTime;
    m.endTime = time.endTime;

    if (dayInfo.unknown.length) {
      warnings.push(diag("UNKNOWN_DAY_CODE", "warning",
        course.title + " — código de día no reconocido: “" + dayInfo.unknown.join("") + "”.",
        { courseKey: courseKey(course), page: m.page }));
    }
    if (!dayInfo.days.length) {
      m.days = [];
      errors.push(diag("UNRECOGNIZED_MEETING_ROW", "error",
        course.title + " — Sección " + course.section + ": no se pudo interpretar el día (“" + m.rawDays + "”).",
        { courseKey: courseKey(course), page: m.page }));
    } else {
      m.days = dayInfo.days;
    }
  }

  function parseBlockField(text, course) {
    var m;
    if ((m = /^NRC\s*:\s*(.+)$/i.exec(text))) course.nrc = normalizeWhitespace(m[1]);
    else if ((m = /^Instructor asignado\s*:\s*(.+)$/i.exec(text))) course.assignedInstructor = stripInstructorMarker(m[1]);
    else if ((m = /^M[eé]todo Educativo\s+(.+)$/i.exec(text))) course.educationalMethod = normalizeWhitespace(m[1]);
    else if ((m = /^Cr[eé]ditos\s*:\s*(.+)$/i.exec(text))) course.credits = normalizeWhitespace(m[1]);
    else if ((m = /^Campus\s*:\s*(.+)$/i.exec(text))) course.campus = normalizeWhitespace(m[1]);
  }

  function courseKey(course) {
    return normalizeWhitespace(course.code).replace(/\s+/g, "-") + "-" + course.section;
  }

  function computeStats(courses, warnings, errors) {
    var meetingRows = 0;
    var scheduleItems = 0;
    var autoScheduled = 0;
    courses.forEach(function (c) {
      c.meetings.forEach(function (m) {
        meetingRows += 1;
        var count = m.autoScheduled ? 1 : (m.days ? m.days.length : 0);
        if (m.autoScheduled) autoScheduled += 1;
        scheduleItems += count || 0;
      });
    });
    return {
      coursesDetected: courses.length,
      meetingRowsDetected: meetingRows,
      scheduleItemsGenerated: scheduleItems,
      autoScheduled: autoScheduled,
      warnings: warnings.length,
      errors: errors.length
    };
  }

  function flattenLines(documentText) {
    var out = [];
    var pages = (documentText && documentText.pages) || [];
    pages.forEach(function (page) {
      (page.lines || []).forEach(function (line) {
        out.push({ page: page.pageNumber, y: line.y, tokens: line.tokens || [], text: line.text });
      });
    });
    return out;
  }

  // ---- Document recognition (several independent signals) ---------------
  function detectUasdDocument(documentText) {
    var lines = flattenLines(documentText);
    var signals = { title: false, meetings: false, period: false, header: false, course: false };
    lines.forEach(function (l) {
      var t = normalizeWhitespace(l.text);
      if (/^Horario de Detalle de Alumno/i.test(t)) signals.title = true;
      if (isHorasReunionLine(t)) signals.meetings = true;
      if (/^Periodo asociado\s*:/i.test(t)) signals.period = true;
      if (isTableHeaderLine(l)) signals.header = true;
      if (parseCourseHeader(t)) signals.course = true;
    });
    var score = Object.keys(signals).reduce(function (acc, k) { return acc + (signals[k] ? 1 : 0); }, 0);
    return { isUasd: score >= 3, score: score, signals: signals };
  }

  H.uasdParser = {
    DAY_CODE_MAP: DAY_CODE_MAP,
    normalizeWhitespace: normalizeWhitespace,
    parseCourseHeader: parseCourseHeader,
    parseClock: parseClock,
    parseTimeRange: parseTimeRange,
    expandDayCodes: expandDayCodes,
    stripInstructorMarker: stripInstructorMarker,
    classifyUasdCourse: classifyUasdCourse,
    detectColumns: detectColumns,
    columnFor: columnFor,
    isTableHeaderLine: isTableHeaderLine,
    isNoiseLine: isNoiseLine,
    courseKey: courseKey,
    parseUasdDocument: parseUasdDocument,
    detectUasdDocument: detectUasdDocument
  };
})(window);

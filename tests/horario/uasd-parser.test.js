/*
 * Node test harness for the UASD parser + adapter (DOM-free).
 * Shims `window`, loads the browser modules, runs unit tests for the pure
 * functions and an integration test against the sanitized fixture.
 *
 *   node horario/tests/uasd-parser.test.js
 *   node horario/tests/uasd-parser.test.js <path-to-fixture.json>
 */
global.window = {};
var fs = require("fs");
var path = require("path");

var JS = path.join(__dirname, "..", "..", "public", "horario", "js");
require(path.join(JS, "utils.js"));
require(path.join(JS, "types.js"));
require(path.join(JS, "events.js"));
require(path.join(JS, "uasd-parser.js"));
require(path.join(JS, "uasd-import.js"));

var H = global.window.Horario;
var P = H.uasdParser;

var pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.log("FAIL: " + name); }
}
function eq(name, a, b) { ok(name + " => " + JSON.stringify(a), JSON.stringify(a) === JSON.stringify(b)); }

// Expand the compact fixture ({tokens:[{t,x}]}) into a DocumentText,
// rebuilding line text exactly like pdf-reader.js does.
function expandFixture(compact) {
  return {
    pages: compact.pages.map(function (pg) {
      return {
        pageNumber: pg.pageNumber,
        lines: pg.lines.map(function (l) {
          var tokens = l.tokens.map(function (tk) { return { text: tk.t, x: tk.x, y: 0, width: 0, height: 0 }; });
          var text = tokens.map(function (t) { return t.text; }).join(" ").replace(/\s+/g, " ").trim();
          return { y: 0, tokens: tokens, text: text };
        })
      };
    })
  };
}

// ---------------------------------------------------------------------
// Unit tests — pure functions
// ---------------------------------------------------------------------
(function headers() {
  eq("header Fisiopatología", P.parseCourseHeader("Fisiopatología II - CFI 1560 - W05"),
    { title: "Fisiopatología II", code: "CFI 1560", section: "W05" });
  eq("header zero-padded section", P.parseCourseHeader("Sexología Médica - MED 1360 - 02"),
    { title: "Sexología Médica", code: "MED 1360", section: "02" });
  eq("header parens title", P.parseCourseHeader("Nutrición (Medicina) - FAR 3510 - W12"),
    { title: "Nutrición (Medicina)", code: "FAR 3510", section: "W12" });
  eq("header truncated title", P.parseCourseHeader("Medicina de Urgencias y Desast - SAP 1180 - 07"),
    { title: "Medicina de Urgencias y Desast", code: "SAP 1180", section: "07" });
  ok("non-header rejected", P.parseCourseHeader("Instructor asignado: Fulano") === null);
  ok("section stays string 02", P.parseCourseHeader("X - MED 1360 - 02").section === "02");
})();

(function times() {
  eq("AM range", P.parseTimeRange("7:00 AM - 9:50 AM"), { startTime: "07:00", endTime: "09:50" });
  eq("PM range", P.parseTimeRange("7:00 PM - 9:50 PM"), { startTime: "19:00", endTime: "21:50" });
  eq("12 PM noon", P.parseTimeRange("12:00 PM - 3:50 PM"), { startTime: "12:00", endTime: "15:50" });
  eq("8 PM", P.parseTimeRange("8:00 PM - 9:50 PM"), { startTime: "20:00", endTime: "21:50" });
  eq("linebreak PM artifact", P.parseTimeRange("7:00 PM - 9:50 PM"), { startTime: "19:00", endTime: "21:50" });
  eq("12 AM midnight", P.parseClock("12:00 AM"), "00:00");
  ok("PA is not a time", P.parseTimeRange("PA") === null);
  ok("garbage time null", P.parseTimeRange("mañana") === null);
})();

(function days() {
  eq("LMI expands", P.expandDayCodes("LMI").days, ["monday", "tuesday", "wednesday"]);
  eq("single V", P.expandDayCodes("V").days, ["friday"]);
  eq("I is wednesday", P.expandDayCodes("I").days, ["wednesday"]);
  eq("JV", P.expandDayCodes("JV").days, ["thursday", "friday"]);
  eq("PA -> no days", P.expandDayCodes("PA").days, []);
  eq("unknown code reported", P.expandDayCodes("X").unknown, ["X"]);
})();

(function instructors() {
  eq("strip ( P )", P.stripInstructorMarker("Petronila Martinez P ( P )"), "Petronila Martinez P");
  eq("strip (P)", P.stripInstructorMarker("Juan Perez (P)"), "Juan Perez");
  eq("no marker keeps name", P.stripInstructorMarker("Marlene Núñez Rodríguez"), "Marlene Núñez Rodríguez");
})();

(function classify() {
  function at(location, method) {
    return P.classifyUasdCourse({ educationalMethod: method || "Presencial" }, { location: location });
  }

  eq("virtual by method", P.classifyUasdCourse({ educationalMethod: "Virtual o por Internet" }, { location: "PA" }), "virtual");
  eq("virtual by PA location", P.classifyUasdCourse({ educationalMethod: "Presencial" }, { location: "PA" }), "virtual");
  eq("virtual by method wins over a campus room", at("ESCUELA DE MEDICINA 207", "Virtual o por Internet"), "virtual");

  // Campus buildings -> inside the UASD.
  eq("campus: escuela de medicina", at("ESCUELA DE MEDICINA 207"), "uasd");
  eq("campus: facultad de ciencias", at("FACULTAD DE CIENCIAS 185"), "uasd");
  eq("campus: ciencias juridicas", at("CIENCIAS JURIDICAS A 206"), "uasd");
  eq("campus: edificio marion", at("EDIFICIO MARION 005"), "uasd");
  eq("campus: laboratorio de medicina", at("LABORATORIO DE MEDICINA 177"), "uasd");

  // The rule looks at the building, not at the word "instituto".
  eq("instituto INSIDE: anatomia (abbrev)", at("INST DE ANATOMIA 032"), "uasd");
  eq("instituto INSIDE: anatomia (full)", at("INSTITUTO DE ANATOMIA 005"), "uasd");
  eq("instituto INSIDE: geografico universitario", at("INSTITUTO GEOGRAFICO UNIVERSITARIO 12"), "uasd");
  eq("instituto INSIDE: sexualidad humana", at("INSTITUTO DE SEXUALIDAD HUMANA 3"), "uasd");
  eq("instituto OUTSIDE: cardiologia", at("INSTITUTO DE CARDIOLOGIA 101"), "hospital");
  eq("instituto OUTSIDE: dermatologico", at("INSTITUTO DERMATOLOGICO 2"), "hospital");
  eq("instituto OUTSIDE: oncologico", at("INSTITUTO ONCOLOGICO 4"), "hospital");
  eq("instituto OUTSIDE: forense", at("INSTITUTO NACIONAL DE CIENCIAS FORENSES"), "hospital");

  // Hospitals and health centres stay outside.
  eq("hospital: maternidad", at("HOSP MATERNIDAD ALTAGRAC 101"), "hospital");
  eq("hospital: padre billini", at("HOSPITAL PADRE BILLINI 12"), "hospital");
  eq("centro de salud outside", at("CENTRO DE SALUD LOS MINA"), "hospital");

  // Unknown building -> outside (allowlist, not blocklist).
  eq("unknown venue is outside", at("EDIFICIO DESCONOCIDO 99"), "hospital");

  // Accents and spacing must not change the verdict.
  eq("accents normalized", at("Instituto de Anatomía 005"), "uasd");
  eq("extra whitespace normalized", at("  INST   DE   ANATOMIA  032 "), "uasd");
  eq("accented outside venue", at("Instituto de Cardiología 101"), "hospital");

  // Without a location we never assert the class is off campus.
  eq("empty location defaults to uasd", at(""), "uasd");
  eq("missing meeting defaults to uasd", P.classifyUasdCourse({ educationalMethod: "Presencial" }, null), "uasd");
})();

(function semanticRoleStability() {
  // Renaming/recoloring a type must NOT change how the importer classifies:
  // it resolves by semanticRole, so activities still land on the same type id.
  var types = H.types.createDefaults();
  var uasd = H.types.findBySemanticRole(types, "uasd");
  uasd.name = "Campus UASD";
  uasd.color = "#112233";
  var hospital = H.types.findBySemanticRole(types, "hospital");
  hospital.name = "Rotaciones / Hospital";

  eq("uasd classification -> uasd type id", H.uasdImport.typeIdForClassification(types, "uasd"), "type-uasd");
  eq("hospital classification -> hospital type id", H.uasdImport.typeIdForClassification(types, "hospital"), "type-hospital");
  eq("virtual classification -> virtual type id", H.uasdImport.typeIdForClassification(types, "virtual"), "type-virtual");
  ok("renamed uasd keeps role", H.types.findBySemanticRole(types, "uasd").semanticRole === "uasd");

  var doc = {
    pages: [{ pageNumber: 1, lines: [
      { y: 100, tokens: [{ text: "X - MED 1360 - 02", x: 60 }], text: "X - MED 1360 - 02" },
      { y: 90, tokens: [{ text: "Método Educativo Presencial", x: 60 }], text: "Método Educativo Presencial" },
      { y: 80, tokens: [{ text: "Horas de Reunión Programadas", x: 60 }], text: "Horas de Reunión Programadas" },
      { y: 70, tokens: [
        { text: "Tipo", x: 90 }, { text: "Hora", x: 116 }, { text: "Días", x: 175 },
        { text: "Dónde", x: 202 }, { text: "Rango de Fecha", x: 289 }, { text: "Tipo de", x: 368 }, { text: "Instructores", x: 423 }
      ], text: "Tipo Hora Días Dónde Rango de Fecha Tipo de Instructores" },
      { y: 60, tokens: [
        { text: "Class", x: 90 }, { text: "7:00 AM - 8:50 AM", x: 116 }, { text: "L", x: 175 },
        { text: "HOSP MATERNIDAD ALTAGRAC 101", x: 202 }, { text: "Ago", x: 289 }, { text: "Teoria", x: 368 }, { text: "Docente", x: 423 }
      ], text: "Class 7:00 AM - 8:50 AM L HOSP MATERNIDAD ALTAGRAC 101 Ago Teoria Docente" }
    ] }]
  };
  var conv = H.uasdImport.convertToScheduleItems(P.parseUasdDocument(doc), types);
  eq("renamed hospital still assigned to hospital type", conv.items[0].typeId, "type-hospital");
})();

(function pageBreak() {
  // Course header on page 1, its meeting table on page 2 — relationship kept.
  var doc = {
    pages: [
      { pageNumber: 1, lines: [
        { y: 100, tokens: [{ text: "Lab X - BAN 3170 - 56", x: 60 }], text: "Lab X - BAN 3170 - 56" },
        { y: 80, tokens: [{ text: "Método Educativo Presencial", x: 60 }], text: "Método Educativo Presencial" },
        { y: 60, tokens: [{ text: "Horas de Reunión Programadas", x: 60 }], text: "Horas de Reunión Programadas" }
      ] },
      { pageNumber: 2, lines: [
        { y: 200, tokens: [
          { text: "Tipo", x: 90 }, { text: "Hora", x: 116 }, { text: "Días", x: 175 },
          { text: "Dónde", x: 202 }, { text: "Rango de Fecha", x: 289 }, { text: "Tipo de", x: 368 }, { text: "Instructores", x: 423 }
        ], text: "Tipo Hora Días Dónde Rango de Fecha Tipo de Instructores" },
        { y: 180, tokens: [
          { text: "Class", x: 90 }, { text: "7:00 AM -", x: 116 }, { text: "M", x: 175 },
          { text: "LAB 1", x: 202 }, { text: "Ago", x: 289 }, { text: "Laboratorio", x: 368 }, { text: "Docente", x: 423 }
        ], text: "Class 7:00 AM - M LAB 1 Ago Laboratorio Docente" },
        { y: 170, tokens: [ { text: "9:50 AM", x: 116 } ], text: "9:50 AM" }
      ] }
    ]
  };
  var res = P.parseUasdDocument(doc);
  ok("page-break: 1 course", res.courses.length === 1);
  ok("page-break: meeting linked across pages", res.courses[0].meetings.length === 1);
  var m = res.courses[0].meetings[0];
  eq("page-break: day", m.days, ["tuesday"]);
  eq("page-break: time", [m.startTime, m.endTime], ["07:00", "09:50"]);
})();

// ---------------------------------------------------------------------
// Integration test — sanitized fixture
// ---------------------------------------------------------------------
var fixturePath = process.argv[2] || path.join(__dirname, "fixtures", "uasd-sanitized.json");
if (fs.existsSync(fixturePath)) {
  var compact = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  var docText = expandFixture(compact);
  var parsed = P.parseUasdDocument(docText);

  eq("stats.coursesDetected", parsed.stats.coursesDetected, 12);
  eq("stats.meetingRowsDetected", parsed.stats.meetingRowsDetected, 15);
  eq("stats.scheduleItemsGenerated", parsed.stats.scheduleItemsGenerated, 17);
  eq("stats.autoScheduled", parsed.stats.autoScheduled, 1);
  eq("stats.errors", parsed.stats.errors, 0);

  var conv = H.uasdImport.convertToScheduleItems(parsed);
  eq("items length", conv.items.length, 17);

  var expected = [
    ["Hematología Médica", "BAN 3160", "19", "friday", "12:00", "15:50", "FACULTAD DE INGENIERIA 104", "type-uasd", false],
    ["Lab Hematología Médica", "BAN 3170", "56", "tuesday", "07:00", "09:50", "LABORATORIO DE MEDICINA 177", "type-uasd", false],
    ["Fisiopatología II", "CFI 1560", "W05", "thursday", "19:00", "21:50", "PA", "type-virtual", false],
    ["Lab Fisiopatología II", "CFI 1570", "35", "thursday", "10:00", "12:50", "INSTITUTO DE CARDIOLOGIA 101", "type-hospital", false],
    ["Farmacología", "CFI 2460", "25", "monday", "14:00", "15:50", "ESCUELA DE MEDICINA 207", "type-uasd", false],
    ["Farmacología", "CFI 2460", "25", "tuesday", "20:00", "21:50", "INST DE ANATOMIA 005", "type-uasd", false],
    ["Lab Farmacología", "CFI 2470", "23", "thursday", "07:00", "09:50", "INST DE ANATOMIA 032", "type-uasd", false],
    ["Anatomía Patológica I", "CMO 2280", "16", "thursday", "14:00", "15:50", "ESCUELA DE MEDICINA 209", "type-uasd", false],
    ["Anatomía Patológica I", "CMO 2280", "16", "friday", "16:00", "17:50", "ESCUELA DE MEDICINA 210", "type-uasd", false],
    ["Nutrición (Medicina)", "FAR 3510", "W12", "sunday", "08:00", "09:00", "", "type-virtual", true],
    ["Sexología Médica", "MED 1360", "02", "monday", "07:00", "08:50", "HOSP MATERNIDAD ALTAGRAC 101", "type-hospital", false],
    ["Parasitología", "MIP 1240", "08", "monday", "18:00", "19:50", "CIENCIAS JURIDICAS A 206", "type-uasd", false],
    ["Parasitología", "MIP 1240", "08", "wednesday", "18:00", "19:50", "CIENCIAS MODERNAS 112", "type-uasd", false],
    ["LAB Parasitología", "MIP 1240", "42", "monday", "10:00", "11:50", "FACULTAD DE CIENCIAS 185", "type-uasd", false],
    ["LAB Parasitología", "MIP 1240", "42", "tuesday", "10:00", "11:50", "FACULTAD DE CIENCIAS 185", "type-uasd", false],
    ["LAB Parasitología", "MIP 1240", "42", "wednesday", "10:00", "11:50", "FACULTAD DE CIENCIAS 185", "type-uasd", false],
    ["Medicina de Urgencias y Desast", "SAP 1180", "07", "tuesday", "16:00", "18:50", "EDIFICIO MARION 005", "type-uasd", false]
  ];

  expected.forEach(function (exp, i) {
    var it = conv.items[i];
    var got = [it.title, it.code, it.section, it.day, it.startTime, it.endTime, it.location, it.typeId, it.autoScheduled];
    eq("item[" + i + "] " + exp[0] + " " + exp[3], got, exp);
  });

  // Campus-allowlist distribution over the 17 items.
  var dist = conv.items.reduce(function (acc, it) {
    acc[it.typeId] = (acc[it.typeId] || 0) + 1;
    return acc;
  }, {});
  eq("distribution uasd", dist["type-uasd"], 13);
  eq("distribution hospital", dist["type-hospital"], 2);
  eq("distribution virtual", dist["type-virtual"], 2);
} else {
  console.log("SKIP integration: fixture not found at " + fixturePath);
}

console.log("\n=== " + pass + " passed, " + fail + " failed ===");
process.exit(fail ? 1 : 0);

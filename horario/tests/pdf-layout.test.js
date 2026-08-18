/*
 * Node tests for the pure PDF layout engine (pdf-layout.js).
 * Uses a mock text measurer (no jsPDF) — width ~ chars, wrap greedily by words
 * and NEVER truncates.
 *
 *   node horario/tests/pdf-layout.test.js
 */
global.window = {};
var path = require("path");
var JS = path.join(__dirname, "..", "js");
require(path.join(JS, "utils.js"));
require(path.join(JS, "types.js"));
require(path.join(JS, "settings.js"));
require(path.join(JS, "events.js"));
require(path.join(JS, "schedule.js"));
require(path.join(JS, "pdf-layout.js"));

var H = global.window.Horario;
var pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.log("FAIL: " + name); } }

var CHAR = 0.5; // width per char per pt
var measure = {
  width: function (t, f) { return String(t).length * f * CHAR; },
  wrap: function (t, maxW, f) {
    var words = String(t).split(/\s+/).filter(Boolean);
    var lines = [], cur = "";
    words.forEach(function (w) {
      var trial = cur ? cur + " " + w : w;
      if (trial.length * f * CHAR <= maxW || !cur) cur = trial;
      else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  }
};

var types = H.types.createDefaults();
var settings = { hourFormat: "24", rangeStart: "07:00", rangeEnd: "22:00" };

var items = [
  H.model.createItem({ title: "Hematología Médica", section: "19", location: "FACULTAD DE INGENIERIA 104", professor: "Docente Uno", day: "friday", startTime: "12:00", endTime: "15:50", typeId: "type-uasd" }),
  H.model.createItem({ title: "Nutrición (Medicina)", section: "W12", day: "sunday", startTime: "08:00", endTime: "09:00", typeId: "type-virtual", autoScheduled: true }),
  // overlap on monday
  H.model.createItem({ title: "A corta", day: "monday", startTime: "18:00", endTime: "19:00", typeId: "type-uasd" }),
  H.model.createItem({ title: "B corta", day: "monday", startTime: "18:30", endTime: "20:00", typeId: "type-personal" }),
  // out of range (before 07:00) -> range must expand
  H.model.createItem({ title: "Madrugada", day: "tuesday", startTime: "05:00", endTime: "06:00", typeId: "type-uasd" }),
  // very long title + long location, short duration -> forces bigger scale
  H.model.createItem({
    title: "Laboratorio de Anatomía Patológica y Procedimientos Diagnósticos",
    location: "HOSPITAL DOCENTE UNIVERSITARIO DR DARIO CONTRERAS EDIFICIO PRINCIPAL 204",
    professor: "María Fernanda Rodríguez González",
    day: "wednesday", startTime: "08:00", endTime: "09:00", typeId: "type-hospital"
  })
];

// Range expansion
var range = H.pdfLayout.computeRange(items, settings);
ok("range starts at 05:00 (300) due to out-of-range item", range.startMin === 300);
ok("range ends at 22:00 (1320)", range.endMin === 1320);

function run(orientation) {
  var L = H.pdfLayout.computeLayout({ items: items, types: types, settings: settings, orientation: orientation, measure: measure });
  ok(orientation + ": 7 day columns", L.days.length === 7);
  ok(orientation + ": all 7 day labels present", L.days.map(function (d) { return d.label; }).join(",") === "Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo");
  ok(orientation + ": page has positive size", L.page.width > 0 && L.page.height > 0);
  ok(orientation + ": events = items count", L.events.length === items.length);
  ok(orientation + ": scale >= min", L.scale >= (orientation === "portrait" ? 0.9 : 0.62) - 1e-9);
  // No truncation: every event box is at least as tall as its required text height.
  var allFit = L.events.every(function (e) { return e.h >= e.requiredH - 0.01; });
  ok(orientation + ": every event box fits its full text (no truncation)", allFit);
  // The long-title event wrapped to multiple lines
  var longEv = L.events.filter(function (e) { return e.item.title.indexOf("Anatomía Patológica y Procedimientos") >= 0; })[0];
  ok(orientation + ": long title wrapped to >1 line", longEv && longEv.titleLines.length > 1);
  ok(orientation + ": long location wrapped to >1 line", longEv && longEv.locLines.length > 1);
  // Overlap: A and B share the day -> 2 columns, narrower boxes
  var monA = L.events.filter(function (e) { return e.day === "monday" && e.item.title === "A corta"; })[0];
  ok(orientation + ": overlap gives columnCount 2", monA && monA.columnCount === 2);
  // Sunday present with its event
  var sun = L.events.filter(function (e) { return e.day === "sunday"; });
  ok(orientation + ": Sunday event present", sun.length === 1);
  return L;
}

var land = run("landscape");
var port = run("portrait");
ok("landscape day columns wider than portrait", land.days[0].width > port.days[0].width);
ok("legend lists used types", land.legend.length >= 3);

console.log("\n=== " + pass + " passed, " + fail + " failed ===");
process.exit(fail ? 1 : 0);

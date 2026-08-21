/*
 * Node harness for the DOM-free calendar engine (Iteration 01).
 * Shim `window`, load the modules, assert the layout/geometry/time logic.
 *
 *   node horario/tests/engine.test.js
 */
global.window = {};
var path = require("path");
var JS = path.join(__dirname, "..", "..", "public", "horario", "js");
require(path.join(JS, "utils.js"));
require(path.join(JS, "types.js"));
require(path.join(JS, "settings.js"));
require(path.join(JS, "events.js"));
require(path.join(JS, "schedule.js"));

var H = global.window.Horario;
var pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.log("FAIL:", name); } }
function eq(name, a, b) { ok(name + " (" + JSON.stringify(a) + " == " + JSON.stringify(b) + ")", a === b); }

// time helpers
eq("timeToMinutes 07:00", H.utils.timeToMinutes("07:00"), 420);
eq("timeToMinutes 21:50", H.utils.timeToMinutes("21:50"), 1310);
ok("timeToMinutes invalid", isNaN(H.utils.timeToMinutes("25:00")));
eq("formatClock 24h", H.utils.formatClock(1170, false), "19:30");
eq("formatClock 12h", H.utils.formatClock(1170, true), "7:30 PM");
eq("formatRange", H.utils.formatRange(600, 770, false), "10:00 – 12:50");

// layout: two overlapping
var lay = H.schedule.layoutDayEvents([
  { id: "A", startMin: 1080, endMin: 1140 },
  { id: "B", startMin: 1110, endMin: 1200 }
]);
eq("2ovl columnCount", lay.A.columnCount, 2);
ok("2ovl distinct columns", lay.A.column !== lay.B.column);

// layout: three identical
lay = H.schedule.layoutDayEvents([
  { id: "X", startMin: 480, endMin: 540 },
  { id: "Y", startMin: 480, endMin: 540 },
  { id: "Z", startMin: 480, endMin: 540 }
]);
eq("3id columnCount", lay.X.columnCount, 3);

// touching edges do not overlap
lay = H.schedule.layoutDayEvents([
  { id: "P", startMin: 420, endMin: 480 },
  { id: "Q", startMin: 480, endMin: 540 }
]);
eq("touch not overlap", lay.P.columnCount, 1);

// geometry
var res = H.schedule.computeDayPositions([{ id: "g", startTime: "07:00", endTime: "09:50" }], 420, 1320, 60);
eq("geo top", res.positioned[0].top, 0);
eq("geo height", res.positioned[0].height, 170);

// model validation
ok("empty title fails", H.model.validate({ title: "", startTime: "07:00", endTime: "08:00", day: "monday" }).ok === false);
ok("end<=start fails", H.model.validate({ title: "X", startTime: "08:00", endTime: "08:00", day: "monday" }).ok === false);
ok("good passes", H.model.validate({ title: "X", startTime: "07:00", endTime: "08:00", day: "monday" }).ok === true);

// settings range snapping
var r = H.settings.normalizeRange("07:30", "21:10");
ok("range snaps to hours", r.ok && r.rangeStart === "07:00" && r.rangeEnd === "22:00");

// duplicate new id
var orig = H.model.createItem({ title: "Dup", day: "monday", startTime: "07:00", endTime: "08:00" });
ok("duplicate new id", H.model.duplicate(orig).id !== orig.id);

console.log("\n=== " + pass + " passed, " + fail + " failed ===");
process.exit(fail ? 1 : 0);

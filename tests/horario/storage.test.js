/*
 * Node tests for storage.js using a mock localStorage.
 *   node horario/tests/storage.test.js
 */
function makeLS() {
  var m = {};
  return {
    _fail: false,
    setItem: function (k, v) { if (this._fail) throw new Error("QuotaExceeded"); m[k] = String(v); },
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
    removeItem: function (k) { delete m[k]; },
    _raw: m
  };
}

var mock = makeLS();
global.window = { localStorage: mock };

var path = require("path");
require(path.join(__dirname, "..", "..", "public", "horario", "js", "storage.js"));
var S = global.window.Horario.storage;

var pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.log("FAIL: " + name); } }

ok("available true with working storage", S.available() === true);

var payload = {
  items: [{ id: "a", title: "X", day: "monday", startTime: "07:00", endTime: "08:00", typeId: "type-uasd" }],
  types: [{ id: "type-uasd", semanticRole: "uasd", name: "Campus", color: "#112233", system: true }],
  settings: { hourFormat: "12", rangeStart: "05:00", rangeEnd: "23:00" }
};
ok("save returns true", S.save(payload) === true);

var loaded = S.load();
ok("load returns items", loaded && loaded.items.length === 1 && loaded.items[0].title === "X");
ok("load returns types", loaded && loaded.types && loaded.types[0].name === "Campus");
ok("load returns settings", loaded && loaded.settings.hourFormat === "12");
ok("stored payload has schema version", JSON.parse(mock.getItem(S.KEY)).v === S.SCHEMA);

// Corrupt JSON -> null, no throw
mock.setItem(S.KEY, "{not valid json");
ok("corrupt json -> null", S.load() === null);

// Quota / failing setItem -> save returns false, no throw
S.save(payload); // restore something first is fine
mock._fail = true;
ok("save on quota error returns false", S.save(payload) === false);
mock._fail = false;

// clear removes the key
S.save(payload);
S.clear();
ok("clear removes stored data", mock.getItem(S.KEY) === null);
ok("load after clear -> null", S.load() === null);

// Unavailable storage (throwing accessor) -> graceful
global.window = { get localStorage() { throw new Error("blocked"); } };
delete require.cache[require.resolve(path.join(__dirname, "..", "..", "public", "horario", "js", "storage.js"))];
require(path.join(__dirname, "..", "..", "public", "horario", "js", "storage.js"));
var S2 = global.window.Horario.storage;
ok("available false when storage blocked", S2.available() === false);
ok("load null when storage blocked", S2.load() === null);
ok("save false when storage blocked", S2.save(payload) === false);

console.log("\n=== " + pass + " passed, " + fail + " failed ===");
process.exit(fail ? 1 : 0);

/*
 * Horario UASD — uasd-import.js
 * Adapter: UasdImportResult -> ScheduleItem[] and the import-coordination
 * rules (replace vs add, duplicate detection). No DOM, no PDF.js.
 * Attaches to window.Horario.uasdImport.
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});

  // Resolve a parser classification ("virtual"|"hospital"|"uasd") to a type id
  // by matching the type's semanticRole — never its (renameable) name.
  function typeIdForClassification(types, classification) {
    var t = H.types.findBySemanticRole(types, classification);
    if (t) return t.id;
    var fallback = H.types.findBySemanticRole(types, "uasd");
    return fallback ? fallback.id : (types[0] && types[0].id) || "type-uasd";
  }

  // UasdImportResult -> { items: ScheduleItem[], importId }.
  // One meeting can produce several items (e.g. days "LMI" -> 3 items),
  // linked by a shared courseKey and importId. `types` (defaults if omitted)
  // is used to resolve classification -> type id via semanticRole.
  function convertToScheduleItems(uasdResult, types) {
    types = types && types.length ? types : H.types.createDefaults();
    var importId = H.utils.uid("import");
    var items = [];
    var courses = (uasdResult && uasdResult.courses) || [];

    courses.forEach(function (course) {
      var cKey = H.uasdParser.courseKey(course);
      (course.meetings || []).forEach(function (meeting, mi) {
        var days = meeting.days && meeting.days.length ? meeting.days : [];
        if (!days.length) return; // unrenderable meeting; already diagnosed by parser

        var typeId = typeIdForClassification(types, meeting.classification);
        var professor = meeting.instructor || course.assignedInstructor || "";
        // Auto-scheduled meetings have no real place; keep "PA" only when scheduled.
        var location = meeting.autoScheduled ? "" : (meeting.location || "");

        days.forEach(function (day) {
          items.push(
            H.model.createItem({
              title: course.title,
              code: course.code,
              section: course.section,
              location: location,
              professor: professor,
              description: "",
              day: day,
              startTime: meeting.startTime,
              endTime: meeting.endTime,
              typeId: typeId,
              source: "uasd",
              autoScheduled: !!meeting.autoScheduled,
              importId: importId,
              courseKey: cKey,
              meetingKey: cKey + "-m" + mi + "-" + day
            })
          );
        });
      });
    });

    return { items: items, importId: importId };
  }

  // Stable academic identity for duplicate detection.
  function identityKey(item) {
    return [
      item.courseKey || "",
      item.day,
      item.startTime,
      item.endTime,
      String(item.location || "").toUpperCase()
    ].join("|");
  }

  function hasUasdItems(items) {
    return (items || []).some(function (it) { return it.source === "uasd"; });
  }

  // Duplicate detection against existing UASD items (never against manual ones).
  function dedupe(existingItems, incomingItems) {
    var existingKeys = {};
    (existingItems || []).forEach(function (it) {
      if (it.source === "uasd") existingKeys[identityKey(it)] = true;
    });
    var seen = {};
    var toAdd = [];
    var skipped = 0;
    (incomingItems || []).forEach(function (it) {
      var k = identityKey(it);
      if (existingKeys[k] || seen[k]) { skipped += 1; return; }
      seen[k] = true;
      toAdd.push(it);
    });
    return { toAdd: toAdd, skipped: skipped };
  }

  // Pure import planner.
  //  mode "replace": drop existing source==="uasd", keep manual, add incoming.
  //  mode "add"    : keep everything, skip exact UASD duplicates.
  function planImport(existingItems, incomingItems, mode) {
    existingItems = existingItems || [];
    incomingItems = incomingItems || [];

    if (mode === "replace") {
      var kept = existingItems.filter(function (it) { return it.source !== "uasd"; });
      return {
        nextItems: kept.concat(incomingItems),
        added: incomingItems.length,
        skipped: 0,
        removed: existingItems.length - kept.length
      };
    }

    var d = dedupe(existingItems, incomingItems);
    return {
      nextItems: existingItems.concat(d.toAdd),
      added: d.toAdd.length,
      skipped: d.skipped,
      removed: 0
    };
  }

  H.uasdImport = {
    typeIdForClassification: typeIdForClassification,
    convertToScheduleItems: convertToScheduleItems,
    identityKey: identityKey,
    hasUasdItems: hasUasdItems,
    dedupe: dedupe,
    planImport: planImport
  };
})(window);

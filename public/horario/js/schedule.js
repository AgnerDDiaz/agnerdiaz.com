/*
 * Horario UASD — schedule.js
 * The geometry engine. Pure, DOM-free, and independent from the (future) UASD
 * parser. It centralizes every math operation: minutes -> pixels, event
 * heights, hour marks, and the deterministic overlap (lane) assignment.
 * Attaches to window.Horario.schedule.
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});

  // Minimum rendered height so very short events stay readable.
  var MIN_EVENT_PX = 26;

  /**
   * Deterministic column / lane assignment for a set of same-day events.
   * Pure and testable: input items only need { id, startMin, endMin }.
   *
   * Returns a map: id -> { column, columnCount } where columnCount is the
   * number of columns in that event's overlap cluster. Width per event is
   * therefore 1 / columnCount and horizontal offset is column / columnCount.
   *
   * Two events overlap iff a.start < b.end && b.start < a.end (touching edges
   * such as 09:00 end / 09:00 start do NOT overlap).
   */
  function layoutDayEvents(items) {
    var events = (items || [])
      .map(function (it) {
        return { id: it.id, startMin: it.startMin, endMin: it.endMin };
      })
      .sort(function (a, b) {
        if (a.startMin !== b.startMin) return a.startMin - b.startMin;
        if (a.endMin !== b.endMin) return a.endMin - b.endMin;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

    var layout = {};
    var cluster = [];
    var clusterEnd = -Infinity;

    function pack(group) {
      // Greedy: place each event in the first column whose last event has
      // already ended; otherwise open a new column.
      var columns = [];
      group.forEach(function (ev) {
        var placed = false;
        for (var i = 0; i < columns.length; i++) {
          var last = columns[i][columns[i].length - 1];
          if (ev.startMin >= last.endMin) {
            columns[i].push(ev);
            ev.column = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([ev]);
          ev.column = columns.length - 1;
        }
      });
      var count = columns.length;
      group.forEach(function (ev) {
        layout[ev.id] = { column: ev.column, columnCount: count };
      });
    }

    events.forEach(function (ev) {
      // A new event that starts at/after the max end of the current cluster
      // cannot overlap any event in it -> close the cluster.
      if (cluster.length && ev.startMin >= clusterEnd) {
        pack(cluster);
        cluster = [];
        clusterEnd = -Infinity;
      }
      cluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev.endMin);
    });
    if (cluster.length) pack(cluster);

    return layout;
  }

  /** Total pixel height of the visible range at the given hour height. */
  function totalHeight(rangeStartMin, rangeEndMin, hourHeight) {
    return ((rangeEndMin - rangeStartMin) / 60) * hourHeight;
  }

  /**
   * Compute pixel boxes for every renderable item on a single day.
   * Returns { positioned:[...], totalHeight, pxPerMin }.
   *
   * Each positioned entry: { id, item, startMin, endMin, top, height,
   * column, columnCount, outOfRange, clipped }.
   *  - outOfRange: the event lies entirely outside the visible range.
   *  - clipped: the event is partially outside and was trimmed to the range.
   */
  function computeDayPositions(items, rangeStartMin, rangeEndMin, hourHeight) {
    var pxPerMin = hourHeight / 60;
    var total = totalHeight(rangeStartMin, rangeEndMin, hourHeight);

    var valid = (items || [])
      .map(function (it) {
        return {
          id: it.id,
          item: it,
          startMin: H.utils.timeToMinutes(it.startTime),
          endMin: H.utils.timeToMinutes(it.endTime)
        };
      })
      .filter(function (x) {
        return !isNaN(x.startMin) && !isNaN(x.endMin) && x.endMin > x.startMin;
      });

    var lanes = layoutDayEvents(valid);

    var positioned = valid.map(function (x) {
      var rawTop = (x.startMin - rangeStartMin) * pxPerMin;
      var rawBottom = (x.endMin - rangeStartMin) * pxPerMin;
      var outOfRange = rawBottom <= 0 || rawTop >= total;

      var top = H.utils.clamp(rawTop, 0, total);
      var bottom = H.utils.clamp(rawBottom, 0, total);
      var height = Math.max(bottom - top, MIN_EVENT_PX);

      // Keep the min-height card inside the grid bottom edge.
      if (top + height > total) top = Math.max(0, total - height);

      var lane = lanes[x.id] || { column: 0, columnCount: 1 };

      return {
        id: x.id,
        item: x.item,
        startMin: x.startMin,
        endMin: x.endMin,
        top: top,
        height: height,
        column: lane.column,
        columnCount: lane.columnCount,
        outOfRange: outOfRange,
        clipped: !outOfRange && (rawTop < 0 || rawBottom > total)
      };
    });

    return { positioned: positioned, totalHeight: total, pxPerMin: pxPerMin };
  }

  /** Hour boundary marks (in minutes) within a whole-hour visible range. */
  function buildHourMarks(rangeStartMin, rangeEndMin) {
    var marks = [];
    var first = Math.ceil(rangeStartMin / 60) * 60;
    for (var m = first; m <= rangeEndMin; m += 60) marks.push(m);
    return marks;
  }

  H.schedule = {
    MIN_EVENT_PX: MIN_EVENT_PX,
    layoutDayEvents: layoutDayEvents,
    totalHeight: totalHeight,
    computeDayPositions: computeDayPositions,
    buildHourMarks: buildHourMarks
  };
})(window);

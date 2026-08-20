/*
 * Horario UASD — pdf-layout.js
 * PURE geometry for the PDF export (points, no jsPDF, no DOM). Given the items,
 * types and settings it computes: page size, the fixed hour gutter, the 7 day
 * columns, the overlap columns per day, the wrapped text lines per event, and a
 * GLOBAL vertical scale grown until every event has room for its full text.
 *
 * Text measurement is injected so this stays testable:
 *   measure = {
 *     width(text, fontPt) -> number,
 *     wrap(text, maxWidthPt, fontPt) -> string[]   // never truncates
 *   }
 *
 * Attaches to window.Horario.pdfLayout.
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});

  var PT = {
    margin: 30,
    headerH: 48,
    dayHeadH: 24,
    footerH: 24,
    gutterPad: 10,
    cardGap: 4,
    cardPadX: 5,
    cardPadY: 5,
    blockGap: 2,
    legendRowH: 18,
    bottomPad: 16
  };

  var FONT = {
    header: 19, sub: 10.5, dayHead: 9.5, hour: 8.5,
    title: 9.5, meta: 8, time: 8, legend: 8.5, brand: 8
  };

  // Landscape aims at a target PAGE width (so the sheet is no wider than a
  // 100% screen) and derives the day column from it; portrait keeps a fixed
  // column. minDayCol is the floor that protects legibility.
  var ORIENT = {
    landscape: { targetPageWidth: 960, minDayCol: 112, minScale: 0.62 },
    portrait: { dayCol: 96, minScale: 0.9 }
  };

  var MIN_FONT = 8; // never smaller than this (§34)

  function lineH(fontPt) { return fontPt * 1.2; }

  function computeRange(items, settings) {
    var s = H.settings.floorHour(H.utils.timeToMinutes(settings.rangeStart));
    var e = H.settings.ceilHour(H.utils.timeToMinutes(settings.rangeEnd));
    items.forEach(function (it) {
      var a = H.utils.timeToMinutes(it.startTime);
      var b = H.utils.timeToMinutes(it.endTime);
      if (!isNaN(a) && !isNaN(b) && b > a) {
        s = Math.min(s, H.settings.floorHour(a));
        e = Math.max(e, H.settings.ceilHour(b));
      }
    });
    s = H.utils.clamp(s, 0, 23 * 60);
    e = H.utils.clamp(e, 60, 24 * 60);
    if (e <= s) e = s + 60;
    return { startMin: s, endMin: e };
  }

  // Build the per-event content (wrapped lines) at a given inner width.
  function buildEventContent(item, type, innerWidth, measure, use12) {
    var titleText = item.title + (item.section ? " — " + item.section : "");
    var titleLines = measure.wrap(titleText, innerWidth, FONT.title);
    var locLines = item.location ? measure.wrap(item.location, innerWidth, FONT.meta) : [];
    var profLines = item.professor ? measure.wrap(item.professor, innerWidth, FONT.meta) : [];
    var descLines = item.description ? measure.wrap(item.description, innerWidth, FONT.meta) : [];
    var timeText = H.utils.formatRange(
      H.utils.timeToMinutes(item.startTime),
      H.utils.timeToMinutes(item.endTime),
      use12
    );

    var needed =
      PT.cardPadY * 2 +
      titleLines.length * lineH(FONT.title) +
      (locLines.length ? PT.blockGap + locLines.length * lineH(FONT.meta) : 0) +
      (profLines.length ? PT.blockGap + profLines.length * lineH(FONT.meta) : 0) +
      (descLines.length ? PT.blockGap + descLines.length * lineH(FONT.meta) : 0) +
      PT.blockGap + lineH(FONT.time);

    return {
      item: item, type: type,
      titleLines: titleLines, locLines: locLines, profLines: profLines,
      descLines: descLines, timeText: timeText, requiredH: needed
    };
  }

  /**
   * Compute the full PDF layout spec.
   * opts: { items, types, settings, orientation, measure }
   */
  function computeLayout(opts) {
    var items = opts.items || [];
    var types = opts.types || H.types.createDefaults();
    var settings = opts.settings || H.settings.createDefault();
    var orientation = opts.orientation === "portrait" ? "portrait" : "landscape";
    var measure = opts.measure;
    var use12 = settings.hourFormat === "12";
    var conf = ORIENT[orientation];

    var DAYS = H.model.DAYS;
    var range = computeRange(items, settings);
    var startMin = range.startMin;
    var endMin = range.endMin;

    // Gutter width from the widest hour label.
    var hourLabels = [];
    for (var m = Math.ceil(startMin / 60) * 60; m <= endMin; m += 60) {
      hourLabels.push({ min: m, label: H.utils.formatClock(m, use12) });
    }
    var gutterW = 0;
    hourLabels.forEach(function (h) {
      gutterW = Math.max(gutterW, measure.width(h.label, FONT.hour));
    });
    gutterW = Math.ceil(gutterW + PT.gutterPad * 2);

    var dayColW = orientation === "landscape"
      ? Math.max(conf.minDayCol, (conf.targetPageWidth - 2 * PT.margin - gutterW) / DAYS.length)
      : conf.dayCol;
    var contentW = gutterW + DAYS.length * dayColW;
    var pageW = contentW + PT.margin * 2;

    // Group events by day, compute overlap columns and wrapped content.
    var byDay = {};
    DAYS.forEach(function (d) { byDay[d] = []; });
    items.forEach(function (it) {
      var a = H.utils.timeToMinutes(it.startTime);
      var b = H.utils.timeToMinutes(it.endTime);
      if (isNaN(a) || isNaN(b) || b <= a) return;
      if (byDay[it.day]) byDay[it.day].push({ id: it.id, item: it, startMin: a, endMin: b });
    });

    var events = [];
    var scale = conf.minScale;

    DAYS.forEach(function (day, dayIndex) {
      var dayItems = byDay[day];
      var lanes = H.schedule.layoutDayEvents(dayItems);
      dayItems.forEach(function (ev) {
        var lane = lanes[ev.id] || { column: 0, columnCount: 1 };
        var colW = (dayColW - (lane.columnCount - 1) * PT.cardGap) / lane.columnCount;
        var innerWidth = colW - PT.cardPadX * 2;
        var type = H.types.findType(types, ev.item.typeId);
        var content = buildEventContent(ev.item, type, innerWidth, measure, use12);
        var durationMin = ev.endMin - ev.startMin;
        content.dayIndex = dayIndex;
        content.day = day;
        content.startMin = ev.startMin;
        content.endMin = ev.endMin;
        content.column = lane.column;
        content.columnCount = lane.columnCount;
        content.colW = colW;
        content.innerWidth = innerWidth;
        content.durationMin = durationMin;
        // Grow the global scale so this event's box fits its text.
        scale = Math.max(scale, content.requiredH / durationMin);
        events.push(content);
      });
    });

    // Breathing room under the last hour so it never touches the legend/edge.
    var bodyH = (endMin - startMin) * scale + PT.bottomPad;

    // Legend rows (wrap chips within content width).
    var usedIds = {};
    items.forEach(function (it) { usedIds[it.typeId] = true; });
    var legendTypes = types.filter(function (t) { return usedIds[t.id]; });
    var legend = [];
    var lx = 0, lrow = 0;
    legendTypes.forEach(function (t) {
      var chipW = 12 + 5 + measure.width(t.name, FONT.legend) + 18;
      if (lx + chipW > contentW && lx > 0) { lx = 0; lrow += 1; }
      legend.push({ name: t.name, color: t.color, xRel: lx, row: lrow });
      lx += chipW;
    });
    var legendRows = legendTypes.length ? lrow + 1 : 0;
    var legendH = legendRows * PT.legendRowH;

    var gridTop = PT.margin + PT.headerH;
    var bodyTop = gridTop + PT.dayHeadH;
    var pageH = bodyTop + bodyH + (legendH ? legendH + 10 : 0) + PT.footerH + PT.margin;

    // Absolute positions.
    var daysX0 = PT.margin + gutterW;

    var marks = hourLabels.map(function (h) {
      return { min: h.min, label: h.label, y: bodyTop + (h.min - startMin) * scale };
    });

    var days = DAYS.map(function (d, i) {
      return {
        index: i, key: d,
        label: H.model.DAY_LABELS[d],
        short: H.model.DAY_SHORT[d],
        x: daysX0 + i * dayColW,
        width: dayColW,
        headY: gridTop
      };
    });

    events.forEach(function (ev) {
      var x = daysX0 + ev.dayIndex * dayColW + ev.column * (dayColW / ev.columnCount);
      ev.x = x + PT.cardGap / 2;
      ev.w = dayColW / ev.columnCount - PT.cardGap;
      ev.y = bodyTop + (ev.startMin - startMin) * scale;
      ev.h = ev.durationMin * scale; // >= requiredH by construction
    });

    var legendY = bodyTop + bodyH + 10;
    legend.forEach(function (l) {
      l.x = PT.margin + l.xRel;
      l.y = legendY + l.row * PT.legendRowH;
    });

    return {
      page: { width: pageW, height: pageH, orientation: orientation },
      range: range,
      use12: use12,
      scale: scale,
      margin: PT.margin,
      font: FONT,
      pt: PT,
      header: {
        x: PT.margin, y: PT.margin,
        title: "Horario semanal",
        subtitle: ""
      },
      gutter: { x: PT.margin, width: gutterW, marks: marks },
      grid: { top: bodyTop, bottom: bodyTop + bodyH, left: daysX0, right: daysX0 + DAYS.length * dayColW, dayHeadTop: gridTop },
      days: days,
      events: events,
      legend: legend,
      legendRows: legendRows,
      footer: {
        x: PT.margin, y: pageH - PT.margin - 4,
        text: "Creado con Horario UASD · AgnerDiaz.com"
      }
    };
  }

  H.pdfLayout = {
    FONT: FONT,
    PT: PT,
    MIN_FONT: MIN_FONT,
    computeRange: computeRange,
    buildEventContent: buildEventContent,
    computeLayout: computeLayout
  };
})(window);

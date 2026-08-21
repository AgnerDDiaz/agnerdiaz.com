/*
 * Horario UASD — pdf-export.js
 * Builds the PDF from ScheduleItem[] using jsPDF (vector text + shapes). It
 * asks pdf-layout.js for the geometry, then draws. The PDF is a dedicated
 * document — never a screenshot of the DOM — so it has no browser chrome, no
 * URLs, no page numbers, and never truncates academic text.
 *
 * Attaches to window.Horario.pdfExport.
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});

  var JSPDF_VERSION = "2.5.2";
  var CDN = "https://cdn.jsdelivr.net/npm/jspdf@" + JSPDF_VERSION + "/dist/jspdf.umd.min.js";
  var VENDOR = "/horario/vendor/jspdf/jspdf.umd.min.js";

  var jsPDFRef = null;

  function loadJsPDF() {
    if (jsPDFRef) return Promise.resolve(jsPDFRef);
    if (root.jspdf && root.jspdf.jsPDF) { jsPDFRef = root.jspdf.jsPDF; return Promise.resolve(jsPDFRef); }
    var wantVendor = !!(root.HORARIO_JSPDF && root.HORARIO_JSPDF.vendor);
    var src = wantVendor ? VENDOR : CDN;
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () {
        if (root.jspdf && root.jspdf.jsPDF) { jsPDFRef = root.jspdf.jsPDF; resolve(jsPDFRef); }
        else reject(new Error("jsPDF no disponible tras la carga."));
      };
      s.onerror = function () { reject(new Error("No se pudo cargar jsPDF.")); };
      document.head.appendChild(s);
    });
  }

  // Measurement backed by a throwaway jsPDF instance (bold = widest, so text
  // never overflows when drawn).
  function makeMeasure(JsPDF) {
    var mdoc = new JsPDF({ unit: "pt", format: [200, 200] });
    mdoc.setFont("helvetica", "bold");
    return {
      width: function (text, fontPt) {
        mdoc.setFontSize(fontPt);
        return mdoc.getTextWidth(String(text == null ? "" : text));
      },
      wrap: function (text, maxWidth, fontPt) {
        mdoc.setFontSize(fontPt);
        var w = Math.max(12, maxWidth);
        return mdoc.splitTextToSize(String(text == null ? "" : text), w);
      }
    };
  }

  function setFill(doc, rgb) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
  function setText(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
  function setDraw(doc, rgb) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }

  var INK = [26, 26, 26];
  var GRAY = [90, 100, 114];
  var LINE = [223, 226, 232];
  var LINE_STRONG = [200, 205, 214];

  function drawTextLines(doc, lines, x, y, fontPt) {
    var lh = fontPt * 1.2;
    for (var i = 0; i < lines.length; i++) {
      doc.text(lines[i], x, y + lh * i, { baseline: "alphabetic" });
    }
    return y + lh * lines.length;
  }

  function draw(doc, layout) {
    var F = layout.font;
    var PTc = layout.pt;

    // White background (explicit, in case a viewer paints otherwise).
    setFill(doc, [255, 255, 255]);
    doc.rect(0, 0, layout.page.width, layout.page.height, "F");

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(F.header);
    setText(doc, INK);
    doc.text(layout.header.title, layout.header.x, layout.header.y + F.header);
    if (layout.header.subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(F.sub);
      setText(doc, GRAY);
      doc.text(layout.header.subtitle, layout.header.x, layout.header.y + F.header + F.sub + 4);
    }

    var grid = layout.grid;

    // Hour gridlines across the body
    setDraw(doc, LINE);
    doc.setLineWidth(0.5);
    layout.gutter.marks.forEach(function (mk) {
      doc.line(grid.left, mk.y, grid.right, mk.y);
    });

    // Day header row background + labels
    setFill(doc, [246, 248, 251]);
    doc.rect(grid.left, grid.dayHeadTop, grid.right - grid.left, PTc.dayHeadH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(F.dayHead);
    setText(doc, INK);
    layout.days.forEach(function (d) {
      var tw = doc.getTextWidth(d.label);
      doc.text(d.label, d.x + d.width / 2 - tw / 2, d.headY + PTc.dayHeadH / 2 + F.dayHead / 3);
    });

    // Vertical separators (gutter + between days) and body border
    setDraw(doc, LINE_STRONG);
    doc.setLineWidth(0.6);
    doc.line(grid.left, grid.dayHeadTop, grid.left, grid.bottom); // gutter/day divider
    layout.days.forEach(function (d) {
      doc.line(d.x + d.width, grid.dayHeadTop, d.x + d.width, grid.bottom);
    });
    doc.line(layout.margin, grid.dayHeadTop, grid.right, grid.dayHeadTop); // under header row
    doc.line(layout.margin, grid.bottom, grid.right, grid.bottom);

    // Hour labels in the gutter (right-aligned, nowrap by construction)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(F.hour);
    setText(doc, GRAY);
    layout.gutter.marks.forEach(function (mk) {
      var tw = doc.getTextWidth(mk.label);
      var gx = layout.gutter.x + layout.gutter.width - PTc.gutterPad - tw;
      doc.text(mk.label, gx, mk.y + F.hour / 3);
    });

    // Events
    layout.events.forEach(function (ev) {
      var ps = H.types.derivePrintStyle(ev.type.color);
      // Card
      setFill(doc, ps.fill);
      setDraw(doc, ps.border);
      doc.setLineWidth(0.7);
      if (doc.roundedRect) doc.roundedRect(ev.x, ev.y, ev.w, ev.h, 4, 4, "FD");
      else doc.rect(ev.x, ev.y, ev.w, ev.h, "FD");
      // Accent bar (left)
      setFill(doc, ps.accent);
      doc.rect(ev.x, ev.y, 3, ev.h, "F");

      var tx = ev.x + PTc.cardPadX + 2;
      var y = ev.y + PTc.cardPadY + F.title;

      // Title (bold, ink)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(F.title);
      setText(doc, ps.text);
      y = drawTextLines(doc, ev.titleLines, tx, y, F.title);

      // Location / professor / description (normal, gray)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(F.meta);
      setText(doc, GRAY);
      if (ev.locLines.length) { y += PTc.blockGap; y = drawTextLines(doc, ev.locLines, tx, y, F.meta); }
      if (ev.profLines.length) { y += PTc.blockGap; y = drawTextLines(doc, ev.profLines, tx, y, F.meta); }
      if (ev.descLines.length) { y += PTc.blockGap; y = drawTextLines(doc, ev.descLines, tx, y, F.meta); }

      // Time pinned near the bottom (always visible)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(F.time);
      setText(doc, ps.text);
      doc.text(ev.timeText, tx, ev.y + ev.h - PTc.cardPadY);
    });

    // Legend
    doc.setFont("helvetica", "bold");
    doc.setFontSize(F.legend);
    layout.legend.forEach(function (l) {
      var ps = H.types.derivePrintStyle(l.color);
      setFill(doc, ps.accent);
      doc.rect(l.x, l.y - 8, 10, 10, "F");
      setText(doc, INK);
      doc.text(l.name, l.x + 15, l.y);
    });

    // Footer branding (small, discreet)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(F.brand);
    setText(doc, GRAY);
    doc.text(layout.footer.text, layout.footer.x, layout.footer.y);
  }

  function filenameFor(settings) {
    return "Horario-UASD.pdf";
  }

  // Build the PDF and return { blob, filename, layout, doc }.
  function generate(opts) {
    return loadJsPDF().then(function (JsPDF) {
      var measure = makeMeasure(JsPDF);
      var layout = H.pdfLayout.computeLayout({
        items: opts.items, types: opts.types, settings: opts.settings,
        orientation: opts.orientation, measure: measure
      });
      // Choose jsPDF orientation/format from the actual page shape. A wide
      // page MUST be created as landscape, otherwise jsPDF swaps it to portrait
      // dimensions and clips the right-most day columns (Sábado/Domingo).
      var w = layout.page.width;
      var h = layout.page.height;
      var wide = w >= h;
      var doc = new JsPDF({
        unit: "pt",
        orientation: wide ? "landscape" : "portrait",
        format: wide ? [h, w] : [w, h]
      });
      doc.setFont("helvetica", "normal");
      draw(doc, layout);
      return { blob: doc.output("blob"), filename: filenameFor(opts.settings), layout: layout, doc: doc };
    });
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function generateAndDownload(opts) {
    return generate(opts).then(function (res) {
      download(res.blob, res.filename);
      return res;
    });
  }

  H.pdfExport = {
    JSPDF_VERSION: JSPDF_VERSION,
    loadJsPDF: loadJsPDF,
    generate: generate,
    download: download,
    generateAndDownload: generateAndDownload
  };
})(window);

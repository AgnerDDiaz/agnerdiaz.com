/*
 * Horario UASD — pdf-reader.js
 * ONLY: PDF -> structured text (DocumentText). Knows nothing about UASD,
 * courses, PA, hospitals or sections. Attaches to window.Horario.pdfReader.
 *
 * Loads PDF.js from a vendored copy when present
 * (/horario/vendor/pdfjs/build/pdf.min.mjs) and otherwise falls back to the
 * pinned CDN build, so the tool works today and becomes fully static once the
 * vendor/ folder is added.
 *
 * DocumentText:
 *   { pages: [ { pageNumber, lines: [ { y, tokens:[{text,x,y,width,height}], text } ] } ] }
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});

  var PDFJS_VERSION = "5.7.284";
  var CDN_BASE = "https://cdn.jsdelivr.net/npm/pdfjs-dist@" + PDFJS_VERSION + "/";
  var VENDOR_BASE = "/horario/vendor/pdfjs/";

  var Y_TOLERANCE = 3.5; // group tokens into a visual line within this Y delta
  var cached = null;

  // Group text items into visual lines by Y (with tolerance), tokens sorted by X.
  // Pure and exported for tests. items: [{text,x,y,width,height}]
  function reconstructLines(items, tolerance) {
    var tol = tolerance || Y_TOLERANCE;
    var sorted = items
      .filter(function (it) { return it.text && String(it.text).trim() !== ""; })
      .slice()
      .sort(function (a, b) { return b.y - a.y || a.x - b.x; });

    var lines = [];
    sorted.forEach(function (it) {
      var line = null;
      for (var i = 0; i < lines.length; i++) {
        if (Math.abs(lines[i].y - it.y) <= tol) { line = lines[i]; break; }
      }
      if (!line) { line = { y: it.y, tokens: [] }; lines.push(line); }
      line.tokens.push(it);
    });

    lines.forEach(function (l) {
      l.tokens.sort(function (a, b) { return a.x - b.x; });
      l.y = Math.round(l.y);
      l.text = l.tokens
        .map(function (t) { return t.text; })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    });
    return lines; // already top -> bottom (source was Y descending)
  }

  async function loadPdfjs() {
    if (cached) return cached;

    var vendorBuild = VENDOR_BASE + "build/pdf.min.mjs";
    var cdnBuild = CDN_BASE + "build/pdf.min.mjs";

    // Vendored PDF.js is used only when explicitly enabled via
    // window.HORARIO_PDFJS = { vendor: true } (set it after adding the vendor/
    // folder). This keeps the console clean when the vendor copy is absent and
    // makes the site fully static once vendored. Default: CDN.
    var wantVendor = !!(root.HORARIO_PDFJS && root.HORARIO_PDFJS.vendor);
    var usedVendor = false;
    if (wantVendor) {
      try {
        var probe = await fetch(vendorBuild, { method: "HEAD" });
        usedVendor = probe.ok;
      } catch (e) {
        usedVendor = false;
      }
    }

    var mod = await import(usedVendor ? vendorBuild : cdnBuild);

    var base = usedVendor ? VENDOR_BASE : CDN_BASE;
    var workerUrl = base + "build/pdf.worker.min.mjs";

    if (usedVendor) {
      mod.GlobalWorkerOptions.workerSrc = workerUrl;
    } else {
      // Same-origin blob worker avoids cross-origin worker restrictions.
      try {
        var resp = await fetch(workerUrl);
        var text = await resp.text();
        var blob = new Blob([text], { type: "text/javascript" });
        mod.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
      } catch (e2) {
        mod.GlobalWorkerOptions.workerSrc = workerUrl;
      }
    }

    cached = { pdfjs: mod, usedVendor: usedVendor, base: base, version: mod.version || PDFJS_VERSION };
    return cached;
  }

  // PDF bytes -> DocumentText. `onProgress(pageNumber, totalPages)` optional.
  async function extractPdfDocument(data, opts) {
    opts = opts || {};
    var loaded = await loadPdfjs();
    var pdfjs = loaded.pdfjs;

    var params = {
      data: data,
      cMapUrl: loaded.base + "cmaps/",
      cMapPacked: true,
      standardFontDataUrl: loaded.base + "standard_fonts/",
      isEvalSupported: false
    };

    var doc = await pdfjs.getDocument(params).promise;
    var pages = [];
    try {
      for (var p = 1; p <= doc.numPages; p++) {
        if (typeof opts.onProgress === "function") opts.onProgress(p, doc.numPages);
        var page = await doc.getPage(p);
        var tc = await page.getTextContent();
        var items = tc.items
          .filter(function (it) { return it.str && it.str.trim() !== ""; })
          .map(function (it) {
            return {
              text: it.str,
              x: it.transform[4],
              y: it.transform[5],
              width: it.width || 0,
              height: it.height || Math.abs(it.transform[3]) || 0
            };
          });
        pages.push({ pageNumber: p, lines: reconstructLines(items, Y_TOLERANCE) });
        if (typeof page.cleanup === "function") page.cleanup();
      }
    } finally {
      try { await doc.destroy(); } catch (e) { /* ignore */ }
    }

    return { pages: pages, meta: { pdfjsVersion: loaded.version, usedVendor: loaded.usedVendor } };
  }

  // Validate a File before touching PDF.js. Checks extension, MIME, size and
  // the %PDF- signature (never trusting file.type alone).
  async function validatePdfFile(file, opts) {
    opts = opts || {};
    var maxBytes = opts.maxBytes || 20 * 1024 * 1024;
    if (!file) return { ok: false, message: "No se seleccionó ningún archivo." };
    if (file.size === 0) return { ok: false, message: "El archivo está vacío." };
    if (file.size > maxBytes) {
      return { ok: false, message: "El archivo supera el tamaño máximo permitido (" + Math.round(maxBytes / 1048576) + " MB)." };
    }
    var nameOk = /\.pdf$/i.test(file.name || "");
    var mimeOk = !file.type || /pdf/i.test(file.type);
    if (!nameOk && !mimeOk) {
      return { ok: false, message: "El archivo no parece ser un PDF." };
    }
    // Signature check on the first bytes.
    try {
      var head = await file.slice(0, 5).arrayBuffer();
      var sig = String.fromCharCode.apply(null, new Uint8Array(head));
      if (sig.indexOf("%PDF-") !== 0) {
        return { ok: false, message: "El archivo no tiene una firma PDF válida." };
      }
    } catch (e) {
      return { ok: false, message: "No se pudo leer el archivo." };
    }
    return { ok: true };
  }

  H.pdfReader = {
    PDFJS_VERSION: PDFJS_VERSION,
    reconstructLines: reconstructLines,
    loadPdfjs: loadPdfjs,
    extractPdfDocument: extractPdfDocument,
    validatePdfFile: validatePdfFile
  };
})(window);

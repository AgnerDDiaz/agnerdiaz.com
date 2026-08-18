/*
 * Horario UASD — utils.js
 * Pure helpers: unique ids, time parsing/formatting, small DOM builder.
 * No DOM state, no dependencies. Attaches to window.Horario.utils.
 */
(function (root) {
  "use strict";

  var H = (root.Horario = root.Horario || {});

  var idCounter = 0;

  /** Generate a process-unique id with an optional prefix. */
  function uid(prefix) {
    idCounter += 1;
    var rnd = Math.random().toString(36).slice(2, 8);
    return (prefix || "id") + "-" + Date.now().toString(36) + "-" + idCounter.toString(36) + rnd;
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  /**
   * Parse "HH:mm" into minutes since midnight.
   * Returns NaN when the string is not a valid 24h time.
   */
  function timeToMinutes(hhmm) {
    if (typeof hhmm !== "string") return NaN;
    var match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
    if (!match) return NaN;
    var h = parseInt(match[1], 10);
    var m = parseInt(match[2], 10);
    if (h < 0 || h > 24 || m < 0 || m > 59) return NaN;
    if (h === 24 && m !== 0) return NaN;
    return h * 60 + m;
  }

  /** Convert minutes since midnight into internal "HH:mm" (24h). */
  function minutesToTime(min) {
    var total = clamp(Math.round(min), 0, 24 * 60);
    var h = Math.floor(total / 60);
    var m = total % 60;
    if (h === 24) return "24:00";
    return pad2(h) + ":" + pad2(m);
  }

  /**
   * Format a minutes-since-midnight value for display.
   * use12 === true -> "7:30 PM", otherwise "19:30".
   */
  function formatClock(min, use12) {
    var total = Math.round(min);
    // Keep 24:00 as an explicit boundary label for the axis.
    if (total === 24 * 60) return use12 ? "12:00 AM" : "24:00";
    total = ((total % 1440) + 1440) % 1440;
    var h = Math.floor(total / 60);
    var m = total % 60;
    if (use12) {
      var period = h < 12 ? "AM" : "PM";
      var h12 = h % 12;
      if (h12 === 0) h12 = 12;
      return h12 + ":" + pad2(m) + " " + period;
    }
    return pad2(h) + ":" + pad2(m);
  }

  /** Format a start/end pair like "10:00 AM – 12:50 PM" (en dash). */
  function formatRange(startMin, endMin, use12) {
    return formatClock(startMin, use12) + " – " + formatClock(endMin, use12);
  }

  /**
   * Small, XSS-safe element builder.
   * All text goes through textContent; attributes are set explicitly.
   * opts: { class, text, attrs:{}, html:false (never), children:[] }
   */
  function el(tag, opts) {
    opts = opts || {};
    var node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.text != null) node.textContent = String(opts.text);
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach(function (key) {
        var val = opts.attrs[key];
        if (val == null || val === false) return;
        node.setAttribute(key, val === true ? "" : String(val));
      });
    }
    if (opts.children) {
      opts.children.forEach(function (child) {
        if (child) node.appendChild(child);
      });
    }
    return node;
  }

  /** Remove all children of a node without using innerHTML. */
  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  /** Simple leading-edge debounce for resize handlers. */
  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var ctx = this;
      var args = arguments;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        timer = null;
        fn.apply(ctx, args);
      }, wait);
    };
  }

  H.utils = {
    uid: uid,
    pad2: pad2,
    clamp: clamp,
    timeToMinutes: timeToMinutes,
    minutesToTime: minutesToTime,
    formatClock: formatClock,
    formatRange: formatRange,
    el: el,
    clearNode: clearNode,
    debounce: debounce
  };
})(window);

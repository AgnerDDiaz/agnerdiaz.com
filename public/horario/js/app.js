/*
 * Horario UASD — app.js
 * Controller + view layer. Owns the in-memory state and renders the weekly
 * calendar from the pure engine (schedule.js) and model (events.js). All user
 * text is written with textContent (no innerHTML), so input is never executed.
 *
 * State lives in one object and every mutation goes through small functions,
 * so a later storage.js can wrap them to persist without touching rendering.
 */
(function (root) {
  "use strict";

  var H = root.Horario;
  if (!H) return;

  var U = H.utils;
  var Model = H.model;
  var Engine = H.schedule;
  var Types = H.types;
  var Settings = H.settings;

  // ----------------------------------------------------------------------
  // State
  // ----------------------------------------------------------------------
  var state = {
    items: [],
    types: Types.createDefaults(),
    settings: Settings.createDefault(),
    ui: {
      view: "week", // "week" | "day"
      selectedDay: currentDayKey(),
      viewUserSet: false,
      editingId: null,
      dialogOpener: null
    }
  };

  var els = {};
  var toastTimer = null;
  var confirmResolver = null;

  // ----------------------------------------------------------------------
  // Small helpers
  // ----------------------------------------------------------------------
  function currentDayKey() {
    var map = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return map[new Date().getDay()] || "monday";
  }

  function use12() {
    return state.settings.hourFormat === "12";
  }

  function getHourHeight() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue("--hz-hour-h");
    var n = parseFloat(raw);
    return isFinite(n) && n > 0 ? n : 60;
  }

  function isDev() {
    var host = location.hostname;
    if (location.protocol === "file:") return true;
    if (host === "localhost" || host === "127.0.0.1" || host === "") return true;
    return /(?:^|[?&])dev=1(?:&|$)/.test(location.search);
  }

  function heightTier(h) {
    if (h < 36) return "is-xs";
    if (h < 66) return "is-sm";
    if (h < 108) return "is-md";
    return "";
  }

  function currentRange() {
    var r = Settings.normalizeRange(state.settings.rangeStart, state.settings.rangeEnd);
    if (!r.ok) {
      var d = Settings.createDefault();
      state.settings.rangeStart = d.rangeStart;
      state.settings.rangeEnd = d.rangeEnd;
      r = Settings.normalizeRange(d.rangeStart, d.rangeEnd);
    }
    return r;
  }

  // ----------------------------------------------------------------------
  // Rendering — calendar
  // ----------------------------------------------------------------------
  function render() {
    updateWorkspaceVisibility();
    renderCalendar();
    renderDayChips();
    renderBanner();
    renderLegend();
    syncViewToggle();
    persist();
  }

  // Import-first UX: when the schedule is empty we show the onboarding screen
  // ("¿Quieres importar tu horario de la UASD?"); once there are activities we
  // reveal the workspace (toolbar + calendar).
  function updateWorkspaceVisibility() {
    var empty = state.items.length === 0;
    if (els.onboard) els.onboard.hidden = !empty;
    if (els.workspace) els.workspace.hidden = empty;
  }

  // ----------------------------------------------------------------------
  // Persistence (localStorage) — saved on this device only, never uploaded.
  // Every state mutation is followed by render(), so persisting here captures
  // all changes; a serialized-diff guard skips redundant writes (view toggles).
  // ----------------------------------------------------------------------
  var lastSaved = null;

  function persist() {
    if (!H.storage) return;
    var payload = { items: state.items, types: state.types, settings: state.settings };
    var str = JSON.stringify(payload);
    if (str === lastSaved) return;
    lastSaved = str;
    H.storage.save(payload);
  }

  function loadPersisted() {
    if (!H.storage) return;
    var data = H.storage.load();
    if (!data) return;

    if (data.types) state.types = mergeTypes(data.types);

    if (data.settings) {
      state.settings.hourFormat = data.settings.hourFormat === "12" ? "12" : "24";
      var r = Settings.normalizeRange(data.settings.rangeStart, data.settings.rangeEnd);
      if (r.ok) { state.settings.rangeStart = r.rangeStart; state.settings.rangeEnd = r.rangeEnd; }
    }

    if (data.items && data.items.length) {
      state.items = data.items
        .map(function (d) { return Model.createItem(d); })
        .filter(function (it) {
          return !isNaN(U.timeToMinutes(it.startTime)) &&
            !isNaN(U.timeToMinutes(it.endTime)) &&
            U.timeToMinutes(it.endTime) > U.timeToMinutes(it.startTime);
        });
    }
  }

  // Merge stored types onto the defaults: keep the immutable system types (and
  // their roles) always present, apply stored name/color, then append custom.
  function mergeTypes(stored) {
    var defaults = Types.createDefaults();
    if (!Array.isArray(stored) || !stored.length) return defaults;
    var byId = {};
    stored.forEach(function (p) { if (p && p.id) byId[p.id] = p; });
    var result = defaults.map(function (d) {
      var p = byId[d.id];
      if (p) {
        if (typeof p.name === "string" && p.name.trim()) d.name = p.name.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(p.color || "")) d.color = p.color;
      }
      return d;
    });
    stored.forEach(function (p) {
      if (!p || !p.id || p.system) return;
      if (result.some(function (r) { return r.id === p.id; })) return;
      result.push({
        id: p.id,
        semanticRole: p.semanticRole || "",
        name: (typeof p.name === "string" && p.name.trim()) ? p.name.trim() : "Tipo",
        color: /^#[0-9a-fA-F]{6}$/.test(p.color || "") ? p.color : "#8D99AE",
        system: false
      });
    });
    return result;
  }

  function clearStoredData() {
    confirmAction(
      "Borrar datos guardados",
      "Se eliminará tu horario, tus tipos personalizados y tus ajustes guardados en este dispositivo. Esta acción no se puede deshacer."
    ).then(function (ok) {
      if (!ok) return;
      if (H.storage) H.storage.clear();
      lastSaved = null;
      state.items = [];
      state.types = Types.createDefaults();
      state.settings = Settings.createDefault();
      closeDialog(els.settings);
      populateSelects();
      syncSettingsInputs();
      renderTypeList();
      render();
      toast("Datos guardados borrados.");
    });
  }

  // Legend below the calendar: type name + color for every type currently used.
  function renderLegend() {
    var host = els.legend;
    if (!host) return;
    U.clearNode(host);
    var usedIds = {};
    state.items.forEach(function (it) { usedIds[it.typeId] = true; });
    var used = state.types.filter(function (t) { return usedIds[t.id]; });
    if (!used.length) { host.hidden = true; return; }
    host.hidden = false;
    used.forEach(function (t) {
      var style = Types.deriveStyle(t.color);
      var item = U.el("span", { class: "hz-legend__item" });
      var sw = U.el("span", { class: "hz-legend__swatch" });
      sw.style.setProperty("--ev-accent", style.accent);
      sw.style.setProperty("--ev-bg", style.bg);
      sw.style.setProperty("--ev-border", style.border);
      item.appendChild(sw);
      item.appendChild(U.el("span", { text: t.name }));
      host.appendChild(item);
    });
  }

  function renderCalendar() {
    var cal = els.calendar;
    U.clearNode(cal);

    var range = currentRange();
    var startMin = range.startMin;
    var endMin = range.endMin;
    var hourH = getHourHeight();
    var total = Engine.totalHeight(startMin, endMin, hourH);
    var marks = Engine.buildHourMarks(startMin, endMin);
    var pxPerMin = hourH / 60;

    var view = state.ui.view;
    var days = view === "week" ? Model.DAYS : [state.ui.selectedDay];

    var scroll = U.el("div", { class: "hz-cal__scroll" });
    var grid = U.el("div", { class: "hz-grid" + (view === "day" ? " hz-grid--day" : "") });
    grid.style.gridTemplateColumns =
      "var(--hz-gutter) repeat(" + days.length + ", minmax(var(--hz-colmin), 1fr))";

    // Header row: corner + day headers
    grid.appendChild(U.el("div", { class: "hz-corner", attrs: { "aria-hidden": "true" } }));
    days.forEach(function (day) {
      var head = U.el("div", {
        class: "hz-dayhead",
        attrs: { role: "columnheader" },
        children: [U.el("span", { class: "hz-dayhead__name", text: Model.DAY_LABELS[day] })]
      });
      grid.appendChild(head);
    });

    // Body row: time gutter
    var gutter = U.el("div", { class: "hz-gutter", attrs: { "aria-hidden": "true" } });
    gutter.style.height = total + "px";
    marks.forEach(function (m) {
      var label = U.el("span", { class: "hz-gutter__label", text: U.formatClock(m, use12()) });
      label.style.top = (m - startMin) * pxPerMin + "px";
      gutter.appendChild(label);
    });
    grid.appendChild(gutter);

    // Body row: day columns with positioned event cards
    days.forEach(function (day) {
      var col = U.el("div", { class: "hz-daycol", attrs: { "data-day": day } });
      col.style.height = total + "px";
      col.style.backgroundSize = "100% " + hourH + "px";

      var dayItems = state.items.filter(function (it) {
        return it.day === day;
      });
      var res = Engine.computeDayPositions(dayItems, startMin, endMin, hourH);
      res.positioned.forEach(function (p) {
        if (p.outOfRange) return; // surfaced via the banner instead
        col.appendChild(buildEventCard(p));
      });
      grid.appendChild(col);
    });

    scroll.appendChild(grid);
    // Empty state is handled by the onboarding screen (updateWorkspaceVisibility),
    // so the calendar itself never needs an in-grid empty card.
    cal.appendChild(scroll);
  }

  function buildEventCard(p) {
    var item = p.item;
    var type = Types.findType(state.types, item.typeId);
    var style = Types.deriveStyle(type.color);
    var tier = heightTier(p.height);

    var card = U.el("article", {
      class: "hz-event" + (tier ? " " + tier : ""),
      attrs: {
        "data-id": item.id,
        tabindex: "0",
        role: "button",
        "aria-label": ariaLabelFor(item, p)
      }
    });
    card.style.top = p.top + "px";
    card.style.height = p.height + "px";

    var widthPct = 100 / p.columnCount;
    card.style.left = "calc(" + p.column * widthPct + "% + 3px)";
    card.style.width = "calc(" + widthPct + "% - 6px)";
    card.style.setProperty("--ev-accent", style.accent);
    card.style.setProperty("--ev-bg", style.bg);
    card.style.setProperty("--ev-border", style.border);

    var body = U.el("div", { class: "hz-event__body" });

    var titleEl = U.el("h4", { class: "hz-event__title" });
    titleEl.appendChild(document.createTextNode(item.title || "Sin título"));
    if (item.section) {
      titleEl.appendChild(U.el("span", { class: "hz-event__section", text: " — " + item.section }));
    }
    body.appendChild(titleEl);

    if (item.location) {
      body.appendChild(U.el("p", { class: "hz-event__meta hz-event__loc", text: item.location }));
    }
    if (item.professor) {
      body.appendChild(U.el("p", { class: "hz-event__meta hz-event__prof", text: item.professor }));
    }
    if (item.description) {
      body.appendChild(U.el("p", { class: "hz-event__meta hz-event__desc", text: item.description }));
    }

    body.appendChild(
      U.el("p", { class: "hz-event__time", text: U.formatRange(p.startMin, p.endMin, use12()) })
    );

    // Type tag (color is not the only indicator — the name is shown too).
    var tag = U.el("div", { class: "hz-event__tag" });
    tag.appendChild(U.el("span", { class: "hz-event__dot" }));
    tag.appendChild(U.el("span", { text: type.name || "" }));
    body.appendChild(tag);

    card.appendChild(body);

    // Full detail on hover (desktop) — nothing is hidden, just compacted.
    card.setAttribute("title", fullInfoText(item, p, type));
    return card;
  }

  function fullInfoText(item, p, type) {
    var lines = [];
    lines.push(item.title + (item.section ? " — " + item.section : ""));
    if (item.code) lines.push(item.code);
    if (item.location) lines.push(item.location);
    if (item.professor) lines.push(item.professor);
    lines.push(Model.DAY_LABELS[item.day] + " · " + U.formatRange(p.startMin, p.endMin, use12()));
    if (type && type.name) lines.push(type.name);
    if (item.description) lines.push(item.description);
    return lines.join("\n");
  }

  function ariaLabelFor(item, p) {
    var parts = [item.title || "Actividad"];
    if (item.section) parts.push("Sección " + item.section);
    parts.push(Model.DAY_LABELS[item.day]);
    parts.push(U.formatRange(p.startMin, p.endMin, use12()));
    if (item.location) parts.push(item.location);
    if (item.professor) parts.push(item.professor);
    var type = Types.findType(state.types, item.typeId);
    if (type && type.name) parts.push(type.name);
    return parts.join(", ") + ". Pulsa para editar.";
  }

  function buildEmptyState() {
    var wrap = U.el("div", { class: "hz-empty", attrs: { role: "note" } });
    var card = U.el("div", { class: "hz-empty__card" });
    card.appendChild(U.el("h3", { class: "hz-empty__title", text: "Tu horario está vacío" }));
    card.appendChild(
      U.el("p", {
        class: "hz-empty__text",
        text: "Agrega una actividad o importa tu horario UASD para comenzar."
      })
    );
    var btn = U.el("button", {
      class: "btn btn--primary",
      attrs: { type: "button", id: "hzEmptyAdd" }
    });
    btn.appendChild(document.createTextNode("+ Agregar actividad"));
    btn.addEventListener("click", function () {
      openAdd(btn);
    });
    card.appendChild(btn);
    wrap.appendChild(card);
    return wrap;
  }

  // ----------------------------------------------------------------------
  // Rendering — day chips, banner, view toggle
  // ----------------------------------------------------------------------
  function renderDayChips() {
    var host = els.dayChips;
    if (!host) return;
    U.clearNode(host);

    Model.DAYS.forEach(function (day) {
      var active = day === state.ui.selectedDay;
      var chip = U.el("button", {
        class: "hz-chip" + (active ? " is-active" : ""),
        text: Model.DAY_SHORT[day],
        attrs: {
          type: "button",
          "data-day": day,
          "aria-pressed": active ? "true" : "false",
          "aria-label": Model.DAY_LABELS[day]
        }
      });
      chip.addEventListener("click", function () {
        state.ui.selectedDay = day;
        render();
      });
      host.appendChild(chip);
    });

    host.hidden = state.ui.view !== "day";
  }

  function renderBanner() {
    var banner = els.banner;
    if (!banner) return;
    var range = currentRange();
    var out = state.items.filter(function (it) {
      var s = U.timeToMinutes(it.startTime);
      var e = U.timeToMinutes(it.endTime);
      if (isNaN(s) || isNaN(e) || e <= s) return false;
      return e <= range.startMin || s >= range.endMin;
    });

    if (out.length === 0) {
      banner.hidden = true;
      return;
    }
    banner.hidden = false;
    var word = out.length === 1 ? "actividad queda" : "actividades quedan";
    els.bannerText.textContent =
      out.length +
      " " +
      word +
      " fuera del rango visible (" +
      U.formatClock(range.startMin, use12()) +
      " – " +
      U.formatClock(range.endMin, use12()) +
      ").";
  }

  function autoFitRange() {
    var mins = [];
    var maxs = [];
    state.items.forEach(function (it) {
      var s = U.timeToMinutes(it.startTime);
      var e = U.timeToMinutes(it.endTime);
      if (!isNaN(s) && !isNaN(e) && e > s) {
        mins.push(s);
        maxs.push(e);
      }
    });
    if (!mins.length) return;
    var startMin = Settings.floorHour(Math.min.apply(null, mins));
    var endMin = Settings.ceilHour(Math.max.apply(null, maxs));
    state.settings.rangeStart = U.minutesToTime(U.clamp(startMin, 0, 23 * 60));
    state.settings.rangeEnd = U.minutesToTime(U.clamp(endMin, 60, 24 * 60));
    syncSettingsInputs();
    render();
    toast("Rango ajustado para mostrar todas las actividades.");
  }

  function syncViewToggle() {
    if (!els.viewToggle) return;
    var buttons = els.viewToggle.querySelectorAll("[data-hz-view]");
    Array.prototype.forEach.call(buttons, function (btn) {
      var active = btn.getAttribute("data-hz-view") === state.ui.view;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  // ----------------------------------------------------------------------
  // Activity dialog (add / edit)
  // ----------------------------------------------------------------------
  function populateSelects() {
    var typeSel = els.fType;
    var daySel = els.fDay;
    if (typeSel) {
      U.clearNode(typeSel);
      state.types.forEach(function (t) {
        typeSel.appendChild(U.el("option", { text: t.name, attrs: { value: t.id } }));
      });
    }
    if (daySel && daySel.options.length === 0) {
      Model.DAYS.forEach(function (day) {
        daySel.appendChild(U.el("option", { text: Model.DAY_LABELS[day], attrs: { value: day } }));
      });
    }
  }

  function clearFieldErrors() {
    [els.errTitle, els.errStart, els.errEnd].forEach(function (node) {
      if (node) {
        node.textContent = "";
        node.hidden = true;
      }
    });
    [els.fTitle, els.fStart, els.fEnd].forEach(function (node) {
      if (node) node.classList.remove("is-invalid");
    });
  }

  function showFieldErrors(errors) {
    var mapping = [
      ["title", els.fTitle, els.errTitle],
      ["startTime", els.fStart, els.errStart],
      ["endTime", els.fEnd, els.errEnd]
    ];
    var firstInvalid = null;
    mapping.forEach(function (row) {
      var msg = errors[row[0]];
      if (msg) {
        if (row[1]) row[1].classList.add("is-invalid");
        if (row[2]) {
          row[2].textContent = msg;
          row[2].hidden = false;
        }
        if (!firstInvalid && row[1]) firstInvalid = row[1];
      }
    });
    if (firstInvalid) firstInvalid.focus();
  }

  function fillForm(item) {
    els.fTitle.value = item.title || "";
    els.fType.value = item.typeId || (state.types[0] && state.types[0].id) || "";
    els.fDay.value = item.day || state.ui.selectedDay;
    els.fStart.value = item.startTime || "";
    els.fEnd.value = item.endTime || "";
    els.fLocation.value = item.location || "";
    els.fSection.value = item.section || "";
    els.fCode.value = item.code || "";
    els.fProfessor.value = item.professor || "";
    els.fDescription.value = item.description || "";
  }

  function openAdd(opener) {
    state.ui.editingId = null;
    state.ui.dialogOpener = opener || document.activeElement;
    clearFieldErrors();
    els.dialogTitle.textContent = "Agregar actividad";
    els.saveBtn.textContent = "Guardar";

    var range = currentRange();
    var defaultStart = U.minutesToTime(range.startMin);
    var defaultEnd = U.minutesToTime(Math.min(range.startMin + 60, range.endMin));

    fillForm(
      Model.createItem({
        day: state.ui.view === "day" ? state.ui.selectedDay : currentDayKey(),
        startTime: defaultStart,
        endTime: defaultEnd,
        typeId: state.types[0] ? state.types[0].id : "uasd"
      })
    );

    els.duplicateBtn.hidden = true;
    els.deleteBtn.hidden = true;
    if (els.moreDetails) els.moreDetails.open = false;

    openDialog(els.dialog);
    setTimeout(function () {
      els.fTitle.focus();
      els.fTitle.select();
    }, 30);
  }

  function openEdit(id, opener) {
    var item = findItem(id);
    if (!item) return;
    state.ui.editingId = id;
    state.ui.dialogOpener = opener || document.activeElement;
    clearFieldErrors();
    els.dialogTitle.textContent = "Editar actividad";
    els.saveBtn.textContent = "Guardar cambios";
    fillForm(item);
    els.duplicateBtn.hidden = false;
    els.deleteBtn.hidden = false;
    if (els.moreDetails) {
      els.moreDetails.open = !!(item.section || item.code || item.professor || item.description);
    }
    openDialog(els.dialog);
    setTimeout(function () {
      els.fTitle.focus();
    }, 30);
  }

  function readForm() {
    return {
      id: state.ui.editingId || undefined,
      title: els.fTitle.value,
      typeId: els.fType.value,
      day: els.fDay.value,
      startTime: els.fStart.value,
      endTime: els.fEnd.value,
      location: els.fLocation.value,
      section: els.fSection.value,
      code: els.fCode.value,
      professor: els.fProfessor.value,
      description: els.fDescription.value,
      source: "manual"
    };
  }

  function onFormSubmit(e) {
    e.preventDefault();
    clearFieldErrors();
    var data = readForm();
    var result = Model.validate(data);
    if (!result.ok) {
      showFieldErrors(result.errors);
      return;
    }
    if (state.ui.editingId) {
      updateItem(state.ui.editingId, data);
      toast("Actividad actualizada.");
    } else {
      addItem(data);
      toast("Actividad agregada.");
    }
    closeDialog(els.dialog);
    render();
  }

  function onDuplicateClick() {
    var item = findItem(state.ui.editingId);
    if (!item) return;
    var copy = Model.duplicate(item);
    state.items.push(copy);
    closeDialog(els.dialog);
    render();
    toast("Actividad duplicada.");
  }

  function onDeleteClick() {
    var item = findItem(state.ui.editingId);
    if (!item) return;
    confirmAction(
      "Eliminar actividad",
      "¿Seguro que deseas eliminar “" + (item.title || "esta actividad") + "”? Esta acción no se puede deshacer."
    ).then(function (ok) {
      if (!ok) return;
      removeItem(item.id);
      closeDialog(els.dialog);
      render();
      toast("Actividad eliminada.");
    });
  }

  // ----------------------------------------------------------------------
  // State mutations (single choke points for a future storage.js)
  // ----------------------------------------------------------------------
  function findItem(id) {
    for (var i = 0; i < state.items.length; i++) {
      if (state.items[i].id === id) return state.items[i];
    }
    return null;
  }

  function addItem(data) {
    state.items.push(Model.createItem(data));
  }

  function updateItem(id, data) {
    var idx = -1;
    for (var i = 0; i < state.items.length; i++) {
      if (state.items[i].id === id) {
        idx = i;
        break;
      }
    }
    if (idx < 0) return;
    var merged = Model.createItem(data);
    merged.id = id;
    state.items[idx] = merged;
  }

  function removeItem(id) {
    state.items = state.items.filter(function (it) {
      return it.id !== id;
    });
  }

  // ----------------------------------------------------------------------
  // Generic accessible dialog handling (native <dialog>)
  // ----------------------------------------------------------------------
  function openDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    // Settings are committed as a block when the dialog closes. Done here as
    // well as on the native "close" event because ESC bypasses this path while
    // the buttons bypass the event; commitSettings is idempotent, so whichever
    // fires second is a no-op.
    if (els.settings && dialog === els.settings) commitSettings();
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function restoreOpenerFocus() {
    var opener = state.ui.dialogOpener;
    state.ui.dialogOpener = null;
    if (opener && typeof opener.focus === "function" && document.contains(opener)) {
      opener.focus();
    }
  }

  // ----------------------------------------------------------------------
  // Confirm dialog (promise based)
  // ----------------------------------------------------------------------
  function confirmAction(title, message) {
    return new Promise(function (resolve) {
      confirmResolver = resolve;
      els.confirmTitle.textContent = title;
      els.confirmMsg.textContent = message;
      openDialog(els.confirm);
      setTimeout(function () {
        els.confirmOk.focus();
      }, 30);
    });
  }

  function settleConfirm(value) {
    var resolve = confirmResolver;
    confirmResolver = null;
    closeDialog(els.confirm);
    if (resolve) resolve(value);
  }

  // ----------------------------------------------------------------------
  // Settings dialog
  // ----------------------------------------------------------------------
  function openSettings(opener) {
    state.ui.dialogOpener = opener || document.activeElement;
    syncSettingsInputs();
    renderTypeList();
    if (els.rangeError) {
      els.rangeError.textContent = "";
      els.rangeError.hidden = true;
    }
    openDialog(els.settings);
  }

  function syncSettingsInputs() {
    if (els.formatRadios) {
      Array.prototype.forEach.call(els.formatRadios, function (radio) {
        radio.checked = radio.value === state.settings.hourFormat;
      });
    }
    if (els.rangeStart) els.rangeStart.value = state.settings.rangeStart;
    if (els.rangeEnd) els.rangeEnd.value = state.settings.rangeEnd;
  }

  // Los ajustes se editan libremente dentro del diálogo y se confirman en
  // bloque al cerrarlo ("Listo", la X o ESC). No hay botón "Aplicar": mientras
  // el diálogo está abierto sólo se valida, nunca se toca el estado.
  function onRangeInput() {
    var result = Settings.normalizeRange(els.rangeStart.value, els.rangeEnd.value);
    if (result.ok) {
      els.rangeError.hidden = true;
    } else {
      els.rangeError.textContent = result.error;
      els.rangeError.hidden = false;
    }
  }

  function commitSettings() {
    var changed = false;

    var checked = els.settings.querySelector('input[name="hourFormat"]:checked');
    var format = checked && checked.value === "12" ? "12" : "24";
    if (format !== state.settings.hourFormat) {
      state.settings.hourFormat = format;
      changed = true;
    }

    var result = Settings.normalizeRange(els.rangeStart.value, els.rangeEnd.value);
    if (result.ok &&
        (result.rangeStart !== state.settings.rangeStart ||
         result.rangeEnd !== state.settings.rangeEnd)) {
      state.settings.rangeStart = result.rangeStart;
      state.settings.rangeEnd = result.rangeEnd;
      changed = true;
    }

    els.rangeError.hidden = true;
    syncSettingsInputs(); // descarta un borrador inválido
    if (changed) render(); // render() persiste en localStorage

    if (!result.ok) toast("Rango no válido: se mantuvo el anterior.");
    else if (changed) toast("Ajustes actualizados.");
  }

  function renderTypeList() {
    if (!els.typeList) return;
    U.clearNode(els.typeList);
    state.types.forEach(function (t) {
      var row = U.el("li", { class: "hz-typerow" });
      var swatch = U.el("span", { class: "hz-typerow__swatch" });
      swatch.style.background = t.color;
      row.appendChild(swatch);
      row.appendChild(U.el("span", { class: "hz-typerow__name", text: t.name }));
      if (t.system) row.appendChild(U.el("span", { class: "hz-typerow__role", text: "sistema" }));
      row.appendChild(U.el("span", { class: "hz-typerow__spacer" }));
      var edit = U.el("button", {
        class: "btn btn--soft hz-btn-sm",
        text: "Editar",
        attrs: { type: "button", "aria-label": "Editar tipo " + t.name }
      });
      edit.addEventListener("click", function () { openTypeEditor(t.id, edit); });
      row.appendChild(edit);
      els.typeList.appendChild(row);
    });
  }

  // ---- Type editor (rename / recolor, with live preview) ----------------
  function openTypeEditor(typeId, opener) {
    var type = Types.findType(state.types, typeId);
    if (!type) return;
    state.ui.editingTypeId = typeId;
    state.ui.dialogOpener = opener || document.activeElement;

    els.typeEditName.value = type.name || "";
    els.typeEditColor.value = /^#[0-9a-fA-F]{6}$/.test(type.color) ? type.color : "#3A86FF";

    var msg = type.system ? Types.ROLE_MESSAGES[type.semanticRole] : "";
    if (els.typeMsg) {
      els.typeMsg.textContent = msg || "";
      els.typeMsg.hidden = !msg;
    }
    // Custom (non-system) types can be deleted.
    if (els.typeDelete) els.typeDelete.hidden = !!type.system;

    updateTypePreview();
    openDialog(els.typeEditDialog);
    setTimeout(function () { els.typeEditName.focus(); els.typeEditName.select(); }, 30);
  }

  function updateTypePreview() {
    var color = els.typeEditColor.value || "#3A86FF";
    var name = (els.typeEditName.value || "").trim() || "Tipo";
    var style = Types.deriveStyle(color);
    var pv = els.typePreview;
    if (!pv) return;
    pv.style.setProperty("--ev-accent", style.accent);
    pv.style.setProperty("--ev-bg", style.bg);
    pv.style.setProperty("--ev-border", style.border);
    if (els.previewTagName) els.previewTagName.textContent = name;
    var dot = pv.querySelector(".hz-event__dot");
    if (dot) dot.style.background = style.accent;
  }

  function onTypeEditSubmit(e) {
    e.preventDefault();
    var type = Types.findType(state.types, state.ui.editingTypeId);
    if (!type) return;
    var name = (els.typeEditName.value || "").trim();
    if (!name) { els.typeEditName.focus(); return; }
    type.name = name;
    type.color = els.typeEditColor.value || type.color;
    closeDialog(els.typeEditDialog);
    populateSelects();
    renderTypeList();
    render(); // cards + legend pick up new name/color immediately
    toast("Tipo actualizado.");
  }

  function onTypeDelete() {
    var type = Types.findType(state.types, state.ui.editingTypeId);
    if (!type || type.system) return;
    confirmAction(
      "Eliminar tipo",
      "¿Eliminar el tipo “" + type.name + "”? Las actividades que lo usan pasarán a un tipo por defecto."
    ).then(function (ok) {
      if (!ok) return;
      var fallback = Types.findBySemanticRole(state.types, "uasd") || state.types[0];
      state.items.forEach(function (it) { if (it.typeId === type.id) it.typeId = fallback.id; });
      state.types = state.types.filter(function (t) { return t.id !== type.id; });
      closeDialog(els.typeEditDialog);
      populateSelects();
      renderTypeList();
      render();
      toast("Tipo eliminado.");
    });
  }

  function onAddType() {
    var name = (els.typeName.value || "").trim();
    var color = els.typeColor.value || "#8D99AE";
    if (!name) {
      els.typeName.focus();
      return;
    }
    state.types.push({ id: U.uid("type"), semanticRole: "", name: name, color: color, system: false });
    els.typeName.value = "";
    populateSelects();
    renderTypeList();
    persist(); // adding a type does not re-render the calendar
    toast("Tipo añadido.");
  }

  function onClearAll() {
    if (state.items.length === 0) return;
    confirmAction(
      "Vaciar horario",
      "Se eliminarán todas las actividades del horario. Esta acción no se puede deshacer."
    ).then(function (ok) {
      if (!ok) return;
      state.items = [];
      closeDialog(els.settings);
      render();
      toast("Horario vaciado.");
    });
  }

  // ----------------------------------------------------------------------
  // Toast (non-blocking status messages)
  // ----------------------------------------------------------------------
  function toast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.hidden = false;
    els.toast.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      els.toast.classList.remove("is-visible");
      toastTimer = setTimeout(function () {
        els.toast.hidden = true;
      }, 220);
    }, 3200);
  }

  // ----------------------------------------------------------------------
  // Demo data (development only)
  // ----------------------------------------------------------------------
  function demoItems() {
    var raw = [
      { title: "Fisiología Humana II", day: "monday", startTime: "07:00", endTime: "09:50", location: "Aula 305", professor: "Dr. Pérez", typeId: "type-uasd", section: "W01", code: "FIS 2200" },
      { title: "Laboratorio de Química", day: "monday", startTime: "14:00", endTime: "15:50", location: "Lab 2", typeId: "type-uasd" },
      { title: "Tutoría", day: "monday", startTime: "18:00", endTime: "19:00", location: "Biblioteca", typeId: "type-personal" },
      { title: "Estudio grupal", day: "monday", startTime: "18:30", endTime: "20:00", location: "Cafetería", typeId: "type-personal" },
      { title: "Fisiopatología II", day: "thursday", startTime: "19:00", endTime: "21:50", location: "Instituto de Cardiología 101", professor: "Marlene Núñez Rodríguez", section: "W05", code: "CFI 1560", typeId: "type-hospital" },
      { title: "Materia sin horario A", day: "sunday", startTime: "08:00", endTime: "09:00", typeId: "type-virtual" },
      { title: "Materia sin horario B", day: "sunday", startTime: "08:00", endTime: "09:00", typeId: "type-uasd" },
      { title: "Materia sin horario C", day: "sunday", startTime: "08:00", endTime: "09:00", typeId: "type-personal" }
    ];
    return raw.map(function (d) {
      return Model.createItem(d);
    });
  }

  function loadDemo() {
    state.items = demoItems();
    closeDialog(els.settings);
    render();
    toast("Datos demo cargados.");
  }

  // ----------------------------------------------------------------------
  // Wiring / init
  // ----------------------------------------------------------------------
  // ----------------------------------------------------------------------
  // PDF export
  // ----------------------------------------------------------------------
  function openExportDialog(opener) {
    state.ui.dialogOpener = opener || document.activeElement;
    if (els.exportRangeNote) els.exportRangeNote.textContent = exportRangeNote();
    if (els.exportBusy) els.exportBusy.hidden = true;
    if (els.exportError) els.exportError.hidden = true;
    if (els.exportGo) els.exportGo.disabled = state.items.length === 0;
    openDialog(els.exportDialog);
  }

  function exportRangeNote() {
    if (!state.items.length) return "Agrega o importa actividades para exportar.";
    var range = currentRange();
    var mins = [];
    var maxs = [];
    state.items.forEach(function (it) {
      var s = U.timeToMinutes(it.startTime);
      var e = U.timeToMinutes(it.endTime);
      if (!isNaN(s) && !isNaN(e) && e > s) { mins.push(s); maxs.push(e); }
    });
    if (!mins.length) return "";
    var minStart = Settings.floorHour(Math.min.apply(null, mins));
    var maxEnd = Settings.ceilHour(Math.max.apply(null, maxs));
    if (minStart < range.startMin || maxEnd > range.endMin) {
      return "Hay actividades fuera del rango visible. El PDF ampliará el rango automáticamente para incluirlas (" +
        U.formatClock(Math.min(minStart, range.startMin), use12()) + " – " +
        U.formatClock(Math.max(maxEnd, range.endMin), use12()) + ").";
    }
    return "El PDF incluirá los 7 días y el rango " +
      U.formatClock(range.startMin, use12()) + " – " + U.formatClock(range.endMin, use12()) + ".";
  }

  function onExportGo() {
    if (!state.items.length || !H.pdfExport) return;
    var checked = els.exportDialog.querySelector('input[name="pdfOrientation"]:checked');
    var orientation = checked ? checked.value : "landscape";
    if (els.exportBusy) els.exportBusy.hidden = false;
    if (els.exportError) els.exportError.hidden = true;
    if (els.exportGo) els.exportGo.disabled = true;
    H.pdfExport.generateAndDownload({
      items: state.items, types: state.types, settings: state.settings, orientation: orientation
    }).then(function () {
      closeDialog(els.exportDialog);
      toast("PDF descargado.");
    }).catch(function () {
      if (els.exportError) {
        els.exportError.textContent = "No se pudo generar el PDF. Revisa tu conexión e inténtalo de nuevo.";
        els.exportError.hidden = false;
      }
    }).then(function () {
      if (els.exportBusy) els.exportBusy.hidden = true;
      if (els.exportGo) els.exportGo.disabled = false;
    });
  }

  function cacheEls() {
    els.onboard = document.getElementById("hzOnboard");
    els.workspace = document.getElementById("hzWorkspace");
    els.calendar = document.getElementById("hzCalendar");
    els.dayChips = document.getElementById("hzDayChips");
    els.viewToggle = document.getElementById("hzViewToggle");
    els.banner = document.getElementById("hzBanner");
    els.bannerText = document.getElementById("hzBannerText");
    els.bannerFix = document.getElementById("hzBannerFix");
    els.toast = document.getElementById("hzToast");

    // Activity dialog
    els.dialog = document.getElementById("hzDialog");
    els.form = document.getElementById("hzForm");
    els.dialogTitle = document.getElementById("hzDialogTitle");
    els.fTitle = document.getElementById("fTitle");
    els.fType = document.getElementById("fType");
    els.fDay = document.getElementById("fDay");
    els.fStart = document.getElementById("fStart");
    els.fEnd = document.getElementById("fEnd");
    els.fLocation = document.getElementById("fLocation");
    els.fSection = document.getElementById("fSection");
    els.fCode = document.getElementById("fCode");
    els.fProfessor = document.getElementById("fProfessor");
    els.fDescription = document.getElementById("fDescription");
    els.errTitle = document.getElementById("errTitle");
    els.errStart = document.getElementById("errStart");
    els.errEnd = document.getElementById("errEnd");
    els.saveBtn = document.getElementById("hzSave");
    els.duplicateBtn = document.getElementById("hzDuplicate");
    els.deleteBtn = document.getElementById("hzDelete");
    els.moreDetails = document.getElementById("hzMore");

    // Confirm dialog
    els.confirm = document.getElementById("hzConfirm");
    els.confirmTitle = document.getElementById("hzConfirmTitle");
    els.confirmMsg = document.getElementById("hzConfirmMsg");
    els.confirmOk = document.getElementById("hzConfirmOk");

    // Settings dialog
    els.settings = document.getElementById("hzSettings");
    els.formatRadios = document.querySelectorAll('input[name="hourFormat"]');
    els.rangeStart = document.getElementById("fRangeStart");
    els.rangeEnd = document.getElementById("fRangeEnd");
    els.rangeError = document.getElementById("hzRangeError");
    els.typeList = document.getElementById("hzTypeList");
    els.typeName = document.getElementById("fTypeName");
    els.typeColor = document.getElementById("fTypeColor");
    els.typeAdd = document.getElementById("hzTypeAdd");
    els.clearAll = document.getElementById("hzClearAll");
    els.clearStored = document.getElementById("hzClearStored");
    els.devSection = document.getElementById("hzDevSection");
    els.loadDemo = document.getElementById("hzLoadDemo");

    // Import dialog
    els.importDialog = document.getElementById("hzImportDialog");
    els.importStart = document.getElementById("hzImportStart");
    els.importProgress = document.getElementById("hzImportProgress");
    els.progressText = document.getElementById("hzProgressText");
    els.importError = document.getElementById("hzImportError");
    els.dropzone = document.getElementById("hzDropzone");
    els.pickFile = document.getElementById("hzPickFile");
    els.fileInput = document.getElementById("hzFileInput");

    // Review dialog
    els.reviewDialog = document.getElementById("hzReviewDialog");
    els.reviewSummary = document.getElementById("hzReviewSummary");
    els.reviewList = document.getElementById("hzReviewList");
    els.importModeRow = document.getElementById("hzImportModeRow");
    els.createSchedule = document.getElementById("hzCreateSchedule");
    els.reviewDiag = document.getElementById("hzReviewDiag");
    els.diagOut = document.getElementById("hzDiagOut");

    // Legend
    els.legend = document.getElementById("hzLegend");

    // Type editor dialog
    els.typeEditDialog = document.getElementById("hzTypeEditDialog");
    els.typeEditForm = document.getElementById("hzTypeEditForm");
    els.typeEditName = document.getElementById("fTypeEditName");
    els.typeEditColor = document.getElementById("fTypeEditColor");
    els.typeMsg = document.getElementById("hzTypeMsg");
    els.typePreview = document.getElementById("hzTypePreview");
    els.previewTagName = document.getElementById("hzPreviewTagName");
    els.typeDelete = document.getElementById("hzTypeDelete");

    // Export dialog
    els.exportBtn = document.getElementById("hzExport");
    els.exportDialog = document.getElementById("hzExportDialog");
    els.exportRangeNote = document.getElementById("hzExportRangeNote");
    els.exportBusy = document.getElementById("hzExportBusy");
    els.exportError = document.getElementById("hzExportError");
    els.exportGo = document.getElementById("hzExportGo");
  }

  function bindEvents() {
    // Toolbar / hero
    bindClick("hzAddHero", function (e) { openAdd(e.currentTarget); });
    bindClick("hzAdd", function (e) { openAdd(e.currentTarget); });
    bindClick("hzImportHero", onImportClick);
    bindClick("hzImport", onImportClick);
    bindClick("hzExport", function (e) { openExportDialog(e.currentTarget); });
    bindClick("hzSettingsBtn", function (e) { openSettings(e.currentTarget); });

    if (els.bannerFix) els.bannerFix.addEventListener("click", autoFitRange);

    // View toggle
    if (els.viewToggle) {
      els.viewToggle.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-hz-view]");
        if (!btn) return;
        state.ui.view = btn.getAttribute("data-hz-view") === "day" ? "day" : "week";
        state.ui.viewUserSet = true;
        render();
      });
    }

    // Delegated events on the calendar (single set of listeners)
    if (els.calendar) {
      els.calendar.addEventListener("click", function (e) {
        var card = e.target.closest(".hz-event");
        if (!card) return;
        openEdit(card.getAttribute("data-id"), card);
      });
      els.calendar.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        var card = e.target.closest(".hz-event");
        if (!card) return;
        e.preventDefault();
        openEdit(card.getAttribute("data-id"), card);
      });
    }

    // Activity dialog
    if (els.form) els.form.addEventListener("submit", onFormSubmit);
    if (els.duplicateBtn) els.duplicateBtn.addEventListener("click", onDuplicateClick);
    if (els.deleteBtn) els.deleteBtn.addEventListener("click", onDeleteClick);
    if (els.dialog) {
      els.dialog.addEventListener("close", restoreOpenerFocus);
      els.dialog.addEventListener("cancel", function () { /* native ESC -> close */ });
    }

    // Confirm dialog
    if (els.confirmOk) els.confirmOk.addEventListener("click", function () { settleConfirm(true); });
    if (els.confirm) {
      els.confirm.addEventListener("cancel", function (e) { e.preventDefault(); settleConfirm(false); });
    }

    // Settings dialog
    if (els.rangeStart) els.rangeStart.addEventListener("change", onRangeInput);
    if (els.rangeEnd) els.rangeEnd.addEventListener("change", onRangeInput);
    if (els.settings) els.settings.addEventListener("close", commitSettings);
    if (els.typeAdd) els.typeAdd.addEventListener("click", onAddType);
    if (els.clearAll) els.clearAll.addEventListener("click", onClearAll);
    if (els.clearStored) els.clearStored.addEventListener("click", clearStoredData);
    if (els.loadDemo) els.loadDemo.addEventListener("click", loadDemo);

    // Type editor
    if (els.typeEditForm) els.typeEditForm.addEventListener("submit", onTypeEditSubmit);
    if (els.typeEditColor) els.typeEditColor.addEventListener("input", updateTypePreview);
    if (els.typeEditName) els.typeEditName.addEventListener("input", updateTypePreview);
    if (els.typeDelete) els.typeDelete.addEventListener("click", onTypeDelete);

    // Export
    if (els.exportGo) els.exportGo.addEventListener("click", onExportGo);

    // Import: file picker + drag & drop
    if (els.pickFile && els.fileInput) {
      els.pickFile.addEventListener("click", function () { els.fileInput.click(); });
    }
    if (els.dropzone && els.fileInput) {
      els.dropzone.addEventListener("click", function (e) {
        if (e.target.closest("#hzPickFile")) return; // button handles its own click
        els.fileInput.click();
      });
      els.dropzone.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); els.fileInput.click(); }
      });
      ["dragenter", "dragover"].forEach(function (ev) {
        els.dropzone.addEventListener(ev, function (e) { e.preventDefault(); els.dropzone.classList.add("is-dragover"); });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        els.dropzone.addEventListener(ev, function (e) { e.preventDefault(); els.dropzone.classList.remove("is-dragover"); });
      });
      els.dropzone.addEventListener("drop", function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) handleImportFile(f);
      });
    }
    if (els.fileInput) {
      els.fileInput.addEventListener("change", function () {
        var f = els.fileInput.files && els.fileInput.files[0];
        if (f) handleImportFile(f);
      });
    }
    if (els.createSchedule) els.createSchedule.addEventListener("click", onCreateSchedule);
    if (els.reviewDiag) els.reviewDiag.addEventListener("click", onReviewDiag);

    // Every [data-hz-close] closes its parent dialog. Confirm cancel resolves false.
    document.querySelectorAll("[data-hz-close]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dialog = btn.closest("dialog");
        if (!dialog) return;
        if (dialog === els.confirm) {
          settleConfirm(false);
        } else {
          closeDialog(dialog);
        }
      });
    });

    // Responsive: keep the default view sensible until the user chooses one.
    window.addEventListener(
      "resize",
      U.debounce(function () {
        if (!state.ui.viewUserSet) {
          var next = window.innerWidth <= 760 ? "day" : "week";
          if (next !== state.ui.view) state.ui.view = next;
        }
        render();
      }, 160)
    );
  }

  function bindClick(id, handler) {
    var node = document.getElementById(id);
    if (node) node.addEventListener("click", handler);
  }

  function onImportClick(e) {
    openImportDialog(e && e.currentTarget);
  }

  // ----------------------------------------------------------------------
  // UASD PDF import flow (atomic: state mutates only on "Crear mi horario")
  // ----------------------------------------------------------------------
  var importState = { busy: false, pending: null };

  function openImportDialog(opener) {
    state.ui.dialogOpener = opener || document.activeElement;
    resetImportDialog();
    openDialog(els.importDialog);
    setTimeout(function () { if (els.dropzone) els.dropzone.focus(); }, 30);
  }

  function resetImportDialog() {
    if (els.importStart) els.importStart.hidden = false;
    if (els.importProgress) els.importProgress.hidden = true;
    if (els.importError) { els.importError.hidden = true; els.importError.textContent = ""; }
    if (els.fileInput) els.fileInput.value = "";
  }

  function setProgress(text) {
    if (els.progressText) els.progressText.textContent = text;
  }

  function showImportError(message) {
    if (els.importProgress) els.importProgress.hidden = true;
    if (els.importStart) els.importStart.hidden = false;
    if (els.importError) { els.importError.textContent = message; els.importError.hidden = false; }
    importState.busy = false;
  }

  async function handleImportFile(file) {
    if (importState.busy) return; // block accidental double import
    if (els.importError) els.importError.hidden = true;

    var check = await H.pdfReader.validatePdfFile(file);
    if (!check.ok) { showImportError(check.message); return; }

    importState.busy = true;
    if (els.importStart) els.importStart.hidden = true;
    if (els.importProgress) els.importProgress.hidden = false;
    setProgress("Analizando horario…");

    try {
      var buffer = await file.arrayBuffer();
      var docText = await H.pdfReader.extractPdfDocument(buffer, {
        onProgress: function (p, total) {
          // Con un solo folio el contador no aporta nada y parece decorativo.
          setProgress(total > 1
            ? "Analizando horario… Página " + p + " de " + total
            : "Analizando horario…");
        }
      });

      var detect = H.uasdParser.detectUasdDocument(docText);
      if (!detect.isUasd) {
        showImportError("No pudimos reconocer este archivo como un Horario de Detalle de Alumno de la UASD.");
        return;
      }

      var parsed = H.uasdParser.parseUasdDocument(docText);
      var conv = H.uasdImport.convertToScheduleItems(parsed, state.types);
      importState.pending = { parsed: parsed, items: conv.items };
      importState.busy = false;

      closeDialog(els.importDialog);
      openReview();
    } catch (err) {
      showImportError("Ocurrió un error al leer el PDF. Verifica el archivo e inténtalo de nuevo.");
    }
  }

  function classLabel(classification) {
    // Use the user-configured type name (renaming reflects in the review too).
    var t = Types.findBySemanticRole(state.types, classification);
    if (t) return t.name;
    if (classification === "virtual") return "Virtual";
    if (classification === "hospital") return "Hospital / Fuera UASD";
    return "Dentro UASD";
  }

  function courseReviewState(course) {
    var hasError = false;
    var hasWarn = false;
    if (!course.meetings.length) hasWarn = true;
    course.meetings.forEach(function (m) {
      if (!m.autoScheduled && (!m.days || m.days.length === 0)) hasError = true;
      if (m.autoScheduled) hasWarn = true;
    });
    return hasError ? "error" : hasWarn ? "warn" : "ok";
  }

  function buildCourseReview(course) {
    var st = courseReviewState(course);
    var li = U.el("li", { class: "hz-course" });
    var head = U.el("div", { class: "hz-course__head" });
    head.appendChild(U.el("span", {
      class: "hz-course__icon is-" + st,
      text: st === "ok" ? "✓" : st === "warn" ? "⚠" : "✗"
    }));
    head.appendChild(U.el("span", { text: course.title || "Materia" }));
    head.appendChild(U.el("span", { class: "hz-course__section", text: "— Sección " + course.section }));
    li.appendChild(head);

    course.meetings.forEach(function (m) {
      if (m.autoScheduled) {
        li.appendChild(U.el("div", {
          class: "hz-course__warn",
          text: "Sin horario definido → Domingo · 08:00–09:00 · " + classLabel(m.classification)
        }));
        return;
      }
      if (!m.days || m.days.length === 0) {
        li.appendChild(U.el("div", { class: "hz-course__warn", text: "No se pudo interpretar el día de esta reunión." }));
        return;
      }
      var dayLabels = m.days.map(function (d) { return Model.DAY_LABELS[d]; }).join(", ");
      var timeLabel = U.formatRange(U.timeToMinutes(m.startTime), U.timeToMinutes(m.endTime), use12());
      var row = U.el("div", { class: "hz-course__meeting" });
      row.appendChild(document.createTextNode(dayLabels + " · " + timeLabel));
      if (m.location) row.appendChild(document.createTextNode(" · " + m.location));
      row.appendChild(U.el("span", { class: "hz-tag", text: classLabel(m.classification) }));
      li.appendChild(row);
    });
    return li;
  }

  function renderReview(pending) {
    var s = pending.parsed.stats;
    U.clearNode(els.reviewSummary);
    function stat(text, cls) {
      els.reviewSummary.appendChild(U.el("span", { class: "hz-review__stat" + (cls ? " " + cls : ""), text: text }));
    }
    stat(s.coursesDetected + " materias detectadas");
    stat(s.meetingRowsDetected + " reuniones encontradas");
    stat(s.scheduleItemsGenerated + " bloques para el horario");
    if (s.autoScheduled > 0) stat(s.autoScheduled + " horario automático", "is-auto");

    U.clearNode(els.reviewList);
    pending.parsed.courses.forEach(function (course) {
      els.reviewList.appendChild(buildCourseReview(course));
    });
  }

  function openReview() {
    var pending = importState.pending;
    if (!pending) return;
    renderReview(pending);
    if (els.importModeRow) els.importModeRow.hidden = !H.uasdImport.hasUasdItems(state.items);
    if (els.reviewDiag) els.reviewDiag.hidden = !isDev();
    if (els.diagOut) { els.diagOut.hidden = true; els.diagOut.textContent = ""; }
    openDialog(els.reviewDialog);
    setTimeout(function () { if (els.createSchedule) els.createSchedule.focus(); }, 30);
  }

  function autoFitRangeIfNeeded() {
    var range = currentRange();
    var mins = [];
    var maxs = [];
    state.items.forEach(function (it) {
      var s = U.timeToMinutes(it.startTime);
      var e = U.timeToMinutes(it.endTime);
      if (!isNaN(s) && !isNaN(e) && e > s) { mins.push(s); maxs.push(e); }
    });
    if (!mins.length) return;
    var newStart = Math.min(range.startMin, Settings.floorHour(Math.min.apply(null, mins)));
    var newEnd = Math.max(range.endMin, Settings.ceilHour(Math.max.apply(null, maxs)));
    if (newStart !== range.startMin || newEnd !== range.endMin) {
      state.settings.rangeStart = U.minutesToTime(U.clamp(newStart, 0, 23 * 60));
      state.settings.rangeEnd = U.minutesToTime(U.clamp(newEnd, 60, 24 * 60));
      syncSettingsInputs();
    }
  }

  function onCreateSchedule() {
    var pending = importState.pending;
    if (!pending) return;

    var mode = "add";
    if (H.uasdImport.hasUasdItems(state.items)) {
      var checked = els.reviewDialog.querySelector('input[name="importMode"]:checked');
      mode = checked ? checked.value : "replace";
    }

    var plan = H.uasdImport.planImport(state.items, pending.items, mode);
    state.items = plan.nextItems;
    importState.pending = null;

    closeDialog(els.reviewDialog);
    autoFitRangeIfNeeded();
    render();

    var msg = "Horario importado correctamente. " + plan.added + " actividades agregadas.";
    if (plan.skipped > 0) {
      msg += " " + plan.skipped + (plan.skipped === 1 ? " ya existía y fue omitida." : " ya existían y fueron omitidas.");
    }
    toast(msg);
  }

  function onReviewDiag() {
    var pending = importState.pending;
    if (!pending || !els.diagOut) return;
    var p = pending.parsed;
    // Academic diagnostics only — never the student's header (name/matrícula).
    var safe = {
      stats: p.stats,
      warnings: p.warnings,
      errors: p.errors,
      courses: p.courses.map(function (c) {
        return {
          title: c.title, code: c.code, section: c.section, page: c.page,
          educationalMethod: c.educationalMethod,
          meetings: (c.meetings || []).map(function (m) {
            return {
              type: m.type, rawTime: m.rawTime, startTime: m.startTime, endTime: m.endTime,
              rawDays: m.rawDays, days: m.days, location: m.location,
              classification: m.classification, autoScheduled: m.autoScheduled,
              scheduleType: m.scheduleType, instructor: m.instructor
            };
          })
        };
      })
    };
    var shown = !els.diagOut.hidden;
    els.diagOut.hidden = shown;
    if (!shown) els.diagOut.textContent = JSON.stringify(safe, null, 2);
  }

  function init() {
    cacheEls();
    if (!els.calendar) return;

    loadPersisted(); // restore saved schedule/types/settings before first render

    populateSelects();

    // Initial view based on viewport, before the user picks anything.
    state.ui.view = window.innerWidth <= 760 ? "day" : "week";

    if (els.devSection) els.devSection.hidden = !isDev();

    bindEvents();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose a tiny surface for manual/automated testing without a bundler.
  H.app = {
    _state: state,
    loadDemo: loadDemo,
    addItem: function (data) { addItem(data); render(); },
    render: render,
    _importFile: function (file) { return handleImportFile(file); },
    _openImport: function () { openImportDialog(); },
    _exportPdf: function (orientation) {
      return H.pdfExport.generate({ items: state.items, types: state.types, settings: state.settings, orientation: orientation });
    },
    _renameType: function (semanticRole, name, color) {
      var t = Types.findBySemanticRole(state.types, semanticRole);
      if (t) { t.name = name; if (color) t.color = color; populateSelects(); renderTypeList(); render(); }
      return t;
    }
  };
})(window);

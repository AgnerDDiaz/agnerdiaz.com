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
    renderCalendar();
    renderDayChips();
    renderBanner();
    syncViewToggle();
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

    if (state.items.length === 0) {
      scroll.appendChild(buildEmptyState());
    }

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

    card.appendChild(body);
    return card;
  }

  function ariaLabelFor(item, p) {
    var parts = [item.title || "Actividad"];
    parts.push(Model.DAY_LABELS[item.day]);
    parts.push(U.formatRange(p.startMin, p.endMin, use12()));
    if (item.location) parts.push(item.location);
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

  function onFormatChange(e) {
    var val = e.target.value === "12" ? "12" : "24";
    state.settings.hourFormat = val;
    render();
  }

  function onRangeApply() {
    var result = Settings.normalizeRange(els.rangeStart.value, els.rangeEnd.value);
    if (!result.ok) {
      els.rangeError.textContent = result.error;
      els.rangeError.hidden = false;
      return;
    }
    state.settings.rangeStart = result.rangeStart;
    state.settings.rangeEnd = result.rangeEnd;
    els.rangeError.hidden = true;
    syncSettingsInputs();
    render();
    toast("Rango horario actualizado.");
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
      els.typeList.appendChild(row);
    });
  }

  function onAddType() {
    var name = (els.typeName.value || "").trim();
    var color = els.typeColor.value || "#8D99AE";
    if (!name) {
      els.typeName.focus();
      return;
    }
    state.types.push({ id: U.uid("type"), name: name, color: color });
    els.typeName.value = "";
    populateSelects();
    renderTypeList();
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
      { title: "Fisiología Humana II", day: "monday", startTime: "07:00", endTime: "09:50", location: "Aula 305", professor: "Dr. Pérez", typeId: "uasd", section: "W01", code: "FIS 2200" },
      { title: "Laboratorio de Química", day: "monday", startTime: "14:00", endTime: "15:50", location: "Lab 2", typeId: "uasd" },
      { title: "Tutoría", day: "monday", startTime: "18:00", endTime: "19:00", location: "Biblioteca", typeId: "personal" },
      { title: "Estudio grupal", day: "monday", startTime: "18:30", endTime: "20:00", location: "Cafetería", typeId: "personal" },
      { title: "Fisiopatología II", day: "thursday", startTime: "19:00", endTime: "21:50", location: "Instituto de Cardiología 101", professor: "Marlene Núñez Rodríguez", section: "W05", code: "CFI 1560", typeId: "external" },
      { title: "Materia sin horario A", day: "sunday", startTime: "08:00", endTime: "09:00", typeId: "virtual" },
      { title: "Materia sin horario B", day: "sunday", startTime: "08:00", endTime: "09:00", typeId: "uasd" },
      { title: "Materia sin horario C", day: "sunday", startTime: "08:00", endTime: "09:00", typeId: "personal" }
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
  function cacheEls() {
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
    els.rangeApply = document.getElementById("hzRangeApply");
    els.rangeError = document.getElementById("hzRangeError");
    els.typeList = document.getElementById("hzTypeList");
    els.typeName = document.getElementById("fTypeName");
    els.typeColor = document.getElementById("fTypeColor");
    els.typeAdd = document.getElementById("hzTypeAdd");
    els.clearAll = document.getElementById("hzClearAll");
    els.devSection = document.getElementById("hzDevSection");
    els.loadDemo = document.getElementById("hzLoadDemo");
  }

  function bindEvents() {
    // Toolbar / hero
    bindClick("hzAddHero", function (e) { openAdd(e.currentTarget); });
    bindClick("hzAdd", function (e) { openAdd(e.currentTarget); });
    bindClick("hzImportHero", onImportClick);
    bindClick("hzImport", onImportClick);
    bindClick("hzPrint", function () { window.print(); });
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
    if (els.formatRadios) {
      Array.prototype.forEach.call(els.formatRadios, function (radio) {
        radio.addEventListener("change", onFormatChange);
      });
    }
    if (els.rangeApply) els.rangeApply.addEventListener("click", onRangeApply);
    if (els.typeAdd) els.typeAdd.addEventListener("click", onAddType);
    if (els.clearAll) els.clearAll.addEventListener("click", onClearAll);
    if (els.loadDemo) els.loadDemo.addEventListener("click", loadDemo);

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

  function onImportClick() {
    toast("La importación desde PDF se añadirá en la siguiente etapa.");
  }

  function init() {
    cacheEls();
    if (!els.calendar) return;

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
    render: render
  };
})(window);

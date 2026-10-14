/* PresClick Móvil: phone screens for the proposal and the interactive prototype.
   One renderer draws every screen from a state object, so the still images and
   the live prototype are the same design. All data is demo data. */
(() => {
  'use strict';

  // ───────────────────────── Demo data ─────────────────────────
  const TODAY = new Date(2026, 9, 14, 9, 30);
  const DOCTOR = { first: 'Mateo', last: 'Rivas', email: 'mateo.rivas@correo.com', specialty: 'Medicina interna', license: 'RM 54321' };
  const STATS = {
    small: { rxTotal: 33, rxSent: 29, earnings: 58320, pending: 346598, projected: 404918, balance: 12450 },
    large: { rxTotal: 1284, rxSent: 1247, earnings: 12845600, pending: 115611380, projected: 128456980, balance: 2412450 },
  };
  const TONES = ['teal', 'info', 'vio', 'warn', 'ok', 'neu'];

  const PATIENTS = [
    { id: 41, first: 'Laura', last: 'Gómez', cc: '1.032.456.789', dob: '1993-03-12', phone: '310 555 0142', email: 'laura.gomez@correo.com', address: 'Calle 93 # 11-26', city: 'Bogotá', allergies: 'Penicilina' },
    { id: 40, first: 'Andrés', last: 'Castaño', cc: '80.123.456', dob: '1985-07-02', phone: '315 555 0187', email: 'andres.castano@correo.com', address: 'Carrera 43A # 1-50', city: 'Medellín', allergies: 'Ninguna' },
    { id: 39, first: 'María Fernanda', last: 'López', cc: '52.987.654', dob: '1979-11-23', phone: '300 555 0110', email: 'mafe.lopez@correo.com', address: 'Calle 10 # 4-21', city: 'Cali', allergies: 'Ninguna' },
    { id: 38, first: 'Juan Pablo', last: 'Restrepo', cc: '1.020.304.050', dob: '1990-01-15', phone: '311 555 0199', email: 'jp.restrepo@correo.com', address: 'Calle 72 # 10-07', city: 'Bogotá', allergies: 'Ibuprofeno' },
    { id: 37, first: 'Carolina', last: 'Ruiz', cc: '1.015.778.231', dob: '1996-05-30', phone: '301 555 0163', email: 'caro.ruiz@correo.com', address: 'Carrera 7 # 45-10', city: 'Bogotá', allergies: 'Ninguna' },
    { id: 36, first: 'Santiago', last: 'Herrera', cc: '79.456.112', dob: '1972-09-08', phone: '313 555 0128', email: 'santi.herrera@correo.com', address: 'Calle 50 # 46-36', city: 'Medellín', allergies: 'Ninguna' },
    { id: 35, first: 'Valentina', last: 'Ospina', cc: '1.144.220.981', dob: '2001-02-17', phone: '317 555 0154', email: 'vale.ospina@correo.com', address: 'Avenida 6N # 23-45', city: 'Cali', allergies: 'Ninguna' },
    { id: 34, first: 'Camila', last: 'Torres', cc: '43.876.540', dob: '1988-12-04', phone: '304 555 0191', email: 'camila.torres@correo.com', address: 'Calle 85 # 15-20', city: 'Bogotá', allergies: 'Sulfas' },
  ];

  const PRODUCTS = [
    { id: 901, name: 'Aspirina 100 mg x 28 tabletas', cat: 'Analgésicos', price: 12900, sku: '100030112', invima: 'INVIMA 2016M-0002123', desc: 'Ácido acetilsalicílico 100 mg en tabletas con cubierta entérica.', unit: 'tab', tone: 'teal' },
    { id: 907, name: 'Apronax 550 mg x 10 tabletas', cat: 'Analgésicos', price: 16400, sku: '100071144', invima: 'INVIMA 2017M-0007750', desc: 'Naproxeno sódico 550 mg en tabletas recubiertas.', unit: 'tab', tone: 'info' },
    { id: 902, name: 'Redoxon Vitamina C 1 g x 10 efervescentes', cat: 'Vitaminas', price: 21300, sku: '100041870', invima: 'INVIMA 2018M-0018455', desc: 'Vitamina C 1 g en tabletas efervescentes sabor naranja.', unit: 'tab', tone: 'warn' },
    { id: 904, name: 'Supradyn Energy x 30 tabletas', cat: 'Vitaminas', price: 45900, sku: '100055021', invima: 'INVIMA 2019M-0019147', desc: 'Multivitamínico con minerales y coenzima Q10.', unit: 'tab', tone: 'vio' },
    { id: 903, name: 'Canesten crema 1 % x 20 g', cat: 'Dermatológicos', price: 18650, sku: '100022314', invima: 'INVIMA 2015M-0015922', desc: 'Clotrimazol 1 % en crema de uso tópico.', unit: 'apl', tone: 'ok' },
    { id: 905, name: 'Bepanthen crema x 30 g', cat: 'Dermatológicos', price: 24500, sku: '100061230', invima: 'INVIMA 2017M-0017311', desc: 'Dexpantenol 5 % en crema de uso tópico.', unit: 'apl', tone: 'teal' },
    { id: 906, name: 'Alka-Seltzer x 12 efervescentes', cat: 'Analgésicos', price: 9800, sku: '100012790', invima: 'INVIMA 2014M-0013308', desc: 'Ácido acetilsalicílico con bicarbonato de sodio y ácido cítrico.', unit: 'tab', tone: 'info' },
  ];
  const BRAND = 'Bayer S.A.';
  const CATEGORIES = ['Analgésicos', 'Vitaminas', 'Dermatológicos'];

  const DOSE = { tab: ['1 tableta', '2 tabletas', '½ tableta'], apl: ['1 aplicación', 'capa delgada'] };
  const FREQ = ['cada 8 horas', 'cada 12 horas', 'cada 24 horas'];
  const DUR = ['5 días', '7 días', '14 días', '30 días'];
  const SIG = ['después de comer', 'en ayunas', 'antes de dormir'];
  const DOSE_TYPES = ['Dosis fija', 'Dosis por peso', 'Dosis escalonada', 'Variable por horario', 'PRN', 'Tapering', 'Escala móvil', 'Infusión', 'Ciclos', 'Ajuste renal/hepático'];
  const ID_TYPES = ['Cédula Nacional', 'Pasaporte', 'Licencia de Conducir', 'Otro'];

  const it = (p, q, dose, freq, dur, sig) => ({ p, q, r: 0, type: 'Dosis fija', dose, freq, dur, sig });
  const RX_SEED = [
    { id: 58, pid: 41, status: 'sent', date: '2026-10-14T09:12', items: [it(901, 1, '1 tableta', 'cada 24 horas', '30 días', 'después de comer'), it(902, 1, '1 tableta', 'cada 24 horas', '7 días', '')] },
    { id: 57, pid: 40, status: 'draft', date: '2026-10-13T17:40', items: [it(907, 1, '1 tableta', 'cada 12 horas', '5 días', 'después de comer')] },
    { id: 56, pid: 39, status: 'filled', date: '2026-10-11T11:05', items: [it(904, 1, '1 tableta', 'cada 24 horas', '30 días', 'en ayunas'), it(905, 1, '1 aplicación', 'cada 12 horas', '14 días', '')] },
    { id: 55, pid: 38, status: 'sent', date: '2026-10-06T10:38', items: [it(903, 1, '1 aplicación', 'cada 12 horas', '7 días', '')] },
    { id: 54, pid: 37, status: 'partially_purchased', date: '2026-10-05T15:20', items: [it(902, 2, '1 tableta', 'cada 24 horas', '14 días', ''), it(906, 1, '1 tableta', 'cada 8 horas', '5 días', 'después de comer')] },
    { id: 53, pid: 36, status: 'completed', date: '2026-10-04T09:00', items: [it(901, 1, '1 tableta', 'cada 24 horas', '30 días', 'después de comer')] },
    { id: 52, pid: 41, status: 'filled', date: '2026-09-20T16:10', items: [it(907, 1, '1 tableta', 'cada 12 horas', '5 días', 'después de comer')] },
    { id: 51, pid: 35, status: 'cancelled', date: '2026-09-18T12:00', items: [it(905, 1, '1 aplicación', 'cada 8 horas', '7 días', '')] },
    { id: 50, pid: 41, status: 'completed', date: '2026-08-30T08:45', items: [it(904, 1, '1 tableta', 'cada 24 horas', '30 días', 'en ayunas')] },
  ];

  const APPTS = [
    { day: 'Hoy · 14 oct', items: [
      { time: '9:30', ap: 'a. m.', pid: 41, type: 'Consulta', fee: 80000, video: 'active' },
      { time: '11:00', ap: 'a. m.', pid: 38, type: 'Seguimiento', fee: 0, video: 'none' },
      { time: '4:30', ap: 'p. m.', pid: 34, type: 'Consulta', fee: 80000, video: 'none' },
    ] },
    { day: 'Mañana · 15 oct', items: [
      { time: '8:00', ap: 'a. m.', pid: 40, type: 'Rutina', fee: 60000, video: 'none' },
    ] },
  ];

  const TX = [
    { amt: 4120, sign: '+', status: 'Completada', tone: 'ok', date: '28 sep 2026 · 10:38 a. m.' },
    { amt: 5000, sign: '−', status: 'Completada', tone: 'ok', date: '20 sep 2026 · 4:12 p. m.' },
    { amt: 3330, sign: '+', status: 'Pendiente', tone: 'warn', date: '1 sep 2026 · 10:59 a. m.' },
    { amt: 2980, sign: '+', status: 'Completada', tone: 'ok', date: '25 ago 2026 · 9:15 a. m.' },
  ];

  const DOCS = [
    { id: 1, name: 'Plan de alimentación', type: 'PDF', size: '4,2 MB' },
    { id: 2, name: 'Guía de uso del producto', type: 'PDF', size: '2,8 MB' },
    { id: 3, name: 'Rutina de ejercicios', type: 'JPG', size: '1,5 MB' },
  ];

  const STATUS = {
    draft: ['Borrador', 'neu'], sent: ['Enviada', 'info'], partially_purchased: ['Compra parcial', 'warn'],
    filled: ['Surtida', 'ok'], completed: ['Completada', 'ok'], cancelled: ['Cancelada', 'bad'], expired: ['Vencida', 'neu'],
  };

  // ───────────────────────── Helpers ─────────────────────────
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const I = (n, c) => `<svg class="ic ${c || 'm-ico'}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const product = (id) => PRODUCTS.find((p) => p.id === id);
  const fullName = (p) => `${p.first} ${p.last}`;
  const initials = (p) => (p.first[0] + p.last[0]).toUpperCase();
  const tone = (p) => TONES[(typeof p.id === 'number' ? p.id : 0) % TONES.length];
  const avatar = (p, size) => `<span class="m-avatar tn-${tone(p)}"${size ? ` style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.36)}px"` : ''}>${esc(initials(p))}</span>`;
  const pill = (status) => { const [l, t] = STATUS[status] || [status, 'neu']; return `<span class="m-pill tn-${t}">${l}</span>`; };
  const rxNumber = (id) => `RX-2026-${String(id).padStart(6, '0')}`;
  const total = (items) => items.reduce((sum, i) => sum + product(i.p).price * i.q, 0);
  const sigLine = (i) => (i.dose && i.freq && i.dur ? `${i.dose} ${i.freq} por ${i.dur}${i.sig ? ', ' + i.sig : ''}` : '');

  function age(dob) {
    const d = new Date(dob + 'T00:00');
    let a = TODAY.getFullYear() - d.getFullYear();
    if (TODAY.getMonth() < d.getMonth() || (TODAY.getMonth() === d.getMonth() && TODAY.getDate() < d.getDate())) a -= 1;
    return a;
  }

  function when(iso, withTime) {
    const d = new Date(iso);
    const days = Math.round((new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    let text = days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (withTime) {
      const h = d.getHours();
      text += ` · ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`;
    }
    return text;
  }

  function makeDb() {
    return { rx: clone(RX_SEED), patients: clone(PATIENTS), nextId: 59, created: 0, createdSent: 0 };
  }
  const patientOf = (st, id) => st.db.patients.find((p) => p.id === id);
  const rxOf = (st, id) => st.db.rx.find((r) => r.id === id);

  // ───────────────────────── Chrome ─────────────────────────
  const STATUS_BAR = '<div class="m-sb"><span>9:41</span><i class="m-island"></i><svg class="m-sbi" viewBox="0 0 72 13" aria-hidden="true"><use href="#sb"/></svg></div>';
  const TABS = [['dashboard', 'house', 'Dashboard'], ['recetas', 'doc', 'Recetas'], ['citas', 'cal', 'Citas'], ['mas', 'more', 'Más']];

  function tabBar(st) {
    return `<nav class="m-tabbar" aria-label="Secciones">${TABS.map(([key, icon, label]) => {
      const on = st.menu ? key === 'mas' : key === st.tab;
      return `<button type="button" class="m-tab${on ? ' on' : ''}" data-a="tab" data-v="${key}" data-tid="tab-${key}">${I(key === 'mas' && st.menu ? 'x' : icon)}<span>${label}</span></button>`;
    }).join('')}</nav>`;
  }

  const MENU = [['dashboard', 'house', 'Dashboard'], ['recetas', 'doc', 'Recetas'], ['citas', 'cal', 'Citas'], ['pacientes', 'users', 'Pacientes'], ['billetera', 'card', 'Billetera'], ['perfil', 'user', 'Perfil']];
  // "Más" unfolds as a full screen with the same parts as the tablet sidebar:
  // brand, sections, theme and language, the doctor's account and sign out.
  // The tab bar stays on top to close it.
  function menu(st, enter) {
    const current = st.view === 'todas' || st.view === 'detalle' || (st.view === 'paciente' && st.tab === 'recetas') ? 'recetas'
      : st.view === 'paciente' ? 'pacientes' : st.view;
    const item = ([key, icon, label]) => `<button type="button" class="m-navitem${current === key ? ' on' : ''}" data-a="ir" data-v="${key}" data-tid="menu-${key}">${I(icon)}<span>${label}</span></button>`;
    return `<div class="m-more${enter ? ' enter' : ''}" role="dialog" aria-label="Más">
      <div class="m-more-body">
        <div class="m-more-brand"><span class="m-wordmark">Pres<b>Click</b></span></div>
        <nav class="m-navlist">${MENU.map(item).join('')}</nav>
        <div class="m-more-foot">
          <div class="m-footrow">
            <button type="button" class="m-footbtn sq" data-a="tema" aria-label="Cambiar tema">${I('moon', 'm-ico only-light')}${I('sun', 'm-ico only-dark')}</button>
            <button type="button" class="m-footbtn grow" data-a="aviso" data-v="El idioma cambia entre español e inglés, como en la tablet.">${I('globe', 'm-ico s')}<span>Español</span><span class="code">ES</span></button>
          </div>
          <div class="m-account"><b>Dr. ${DOCTOR.first} ${DOCTOR.last}</b><span>${DOCTOR.email}</span></div>
          <button type="button" class="m-logout" data-a="aviso" data-v="Cerrar sesión no está activo en el prototipo.">${I('out')}<span>Cerrar sesión</span></button>
        </div>
      </div>
    </div>`;
  }

  // ───────────────────────── Page theme ─────────────────────────
  // The page and every phone follow the same light or dark tokens, like the app.
  const THEME_KEY = 'presclick-movil-theme';
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => document.documentElement.dataset.theme || (darkQuery.matches ? 'dark' : 'light');

  function syncThemeControls() {
    const theme = currentTheme();
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const next = theme === 'dark' ? 'claro' : 'oscuro';
      button.setAttribute('aria-label', `Cambiar a modo ${next}`);
      button.querySelector('[data-theme-label]').textContent = theme === 'dark' ? 'Modo claro' : 'Modo oscuro';
    });
    document.querySelectorAll('[data-theme-set]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.themeSet === theme)));
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch (error) { /* storage unavailable: the choice lasts this visit */ }
    syncThemeControls();
  }

  const toggleTheme = () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark');

  function initTheme() {
    try {
      // The page's own choice first; on agnerdiaz.com, the site's theme otherwise.
      const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
    } catch (error) { /* storage unavailable */ }
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-theme-toggle]')) toggleTheme();
      const set = event.target.closest('[data-theme-set]');
      if (set) setTheme(set.dataset.themeSet);
    });
    darkQuery.addEventListener('change', syncThemeControls);
    new MutationObserver(syncThemeControls).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    syncThemeControls();
  }

  // ───────────────────────── Shared pieces ─────────────────────────
  function stat(label, value, caption, icon, t, amountTone) {
    return `<div class="m-stat"><div class="m-stat-top"><span class="m-stat-l">${label}</span><span class="m-tile tn-${t}">${I(icon)}</span></div><div class="m-amt${amountTone ? ' c-' + amountTone : ''}">${value}</div>${caption ? `<div class="m-fn">${caption}</div>` : ''}</div>`;
  }

  function rxMini(st, rx) {
    const p = patientOf(st, rx.pid);
    return `<button type="button" class="m-rxmini" data-a="detalle" data-id="${rx.id}" data-tid="rx-${rx.id}">
      <span class="m-row m-between"><span class="m-hd m-trunc">${esc(fullName(p))}</span>${pill(rx.status)}</span>
      <span class="m-row m-between"><span class="m-fn"><span class="m-rx">${rxNumber(rx.id)}</span> · ${when(rx.date)}</span><span class="m-amt-s">${money(total(rx.items))}</span></span>
    </button>`;
  }

  function primaryAction(rx) {
    return rx.status === 'draft'
      ? { a: 'enviar', label: 'Enviar', icon: 'send', cls: 'pri' }
      : { a: 'enlace', label: 'Enviar enlace', icon: 'share', cls: 'tint' };
  }

  function rxCard(st, rx) {
    const p = patientOf(st, rx.pid);
    const a = primaryAction(rx);
    const n = rx.items.length;
    return `<div class="m-card m-rxcard">
      <button type="button" class="m-rxcard-main" data-a="detalle" data-id="${rx.id}">
        <span class="m-row m-between"><span class="m-hd m-trunc">${esc(fullName(p))}</span>${pill(rx.status)}</span>
        <span class="m-fn"><span class="m-rx">${rxNumber(rx.id)}</span> · ${when(rx.date)}</span>
        <span class="m-row m-between"><span class="m-sub">${n} ${n === 1 ? 'ítem' : 'ítems'}</span><span class="m-amt-s">${money(total(rx.items))}</span></span>
      </button>
      <div class="m-row m-rxcard-actions"><button type="button" class="m-btn sm ${a.cls}" style="flex:1" data-a="${a.a}" data-id="${rx.id}" data-tid="primary-${rx.id}">${I(a.icon, 'm-ico s')}${a.label}</button><button type="button" class="m-btn sm sq" data-a="acciones" data-id="${rx.id}" data-tid="more-${rx.id}" aria-label="Más acciones">${I('more')}</button></div>
    </div>`;
  }

  function patientRow(p, action, tid) {
    return `<button type="button" class="m-li" data-a="${action}" data-id="${p.id}" data-tid="${tid}${p.id}">${avatar(p)}<span class="m-col"><span class="m-hd m-trunc">${esc(fullName(p))}</span><span class="m-fn m-trunc">CC ${p.cc} · ${age(p.dob)} años</span></span>${I('chev-r', 'm-chev')}</button>`;
  }

  function matchPatient(p, q) {
    if (!q) return true;
    const needle = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hay = `${p.first} ${p.last} ${p.cc} ${p.cc.replace(/\./g, '')} ${p.email}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return hay.includes(needle);
  }

  function patientList(st, q, action, tid) {
    const list = st.db.patients.filter((p) => matchPatient(p, q)).sort((a, b) => b.id - a.id);
    if (!list.length) return `<div class="m-empty">No hay pacientes con «${esc(q)}».</div>`;
    return `<div class="m-list">${list.map((p) => patientRow(p, action, tid)).join('')}</div>`;
  }

  function backLabel(st, fallback) {
    const prev = (st.history || [])[st.history ? st.history.length - 1 : 0];
    if (!prev) return fallback;
    if (prev.view === 'paciente') return patientOf(st, prev.patientId).first.split(' ')[0];
    return { dashboard: 'Dashboard', recetas: 'Recetas', todas: 'Todas', pacientes: 'Pacientes' }[prev.view] || fallback;
  }

  const back = (label) => `<button type="button" class="m-back" data-a="atras" data-tid="atras">${I('chev-l')}${esc(label)}</button>`;

  // ───────────────────────── Screens ─────────────────────────
  function vDashboard(st) {
    const base = STATS[st.numbers || 'small'];
    const s = { ...base, rxTotal: base.rxTotal + st.db.created, rxSent: base.rxSent + st.db.createdSent };
    return `<div class="m-body">
      <div class="m-top"><span class="m-wordmark">Pres<b>Click</b></span></div>
      <div><div class="m-sub">Bienvenido,</div><div class="m-h28">Dr. ${DOCTOR.first} ${DOCTOR.last}</div></div>
      <div class="m-pairrow">${stat('Total de recetas', s.rxTotal.toLocaleString('en-US'), `${s.rxSent.toLocaleString('en-US')} enviadas`, 'doc', 'ok')}${stat('Ganancias totales', money(s.earnings), `${money(s.pending)} pendiente`, 'card', 'warn')}</div>
      <div class="m-sechead"><span>Resumen de comisiones</span></div>
      <div class="m-pairrow">${stat('Comisión proyectada', money(s.projected), 'Basada en receta enviada', 'chart', 'info', 'acc')}${stat('Comisión real ganada', money(s.earnings), 'Compras pagadas', 'seal', 'ok', 'ok')}</div>
      <div class="m-pairrow">${stat('Pendiente', money(s.pending), '', 'clock', 'warn', 'warn')}${stat('Balance disponible', money(s.balance), '', 'card', 'ok', 'ok')}</div>
      <img class="m-banner" src="img/banner.jpg" alt="Conectamos: prescribir con orientar y de esta manera apoyamos la adherencia.">
    </div>`;
  }

  function vRecetas(st) {
    const recent = st.db.rx.slice(0, 5);
    const totalRx = STATS[st.numbers || 'small'].rxTotal + st.db.created;
    return `<div class="m-body">
      <div class="m-titleblock"><div class="m-lt">Recetas</div><div class="m-fn">${totalRx.toLocaleString('en-US')} recetas</div></div>
      <button type="button" class="m-hero" data-a="nueva" data-tid="nueva"><span class="m-hero-ic">${I('pen')}</span><span class="m-col"><b>Nueva prescripción</b><small>Paciente, medicamentos y listo</small></span>${I('arrow-r')}</button>
      <button type="button" class="m-btn lg" data-a="buscar" data-tid="buscar">${I('user-search', 'm-ico c-acc')}<span class="grow">Buscar paciente</span>${I('chev-r', 'm-chev')}</button>
      <div class="m-sechead"><span>Recientes</span><button type="button" class="m-link" data-a="todas" data-tid="todas">Ver todas</button></div>
      <div class="m-stack">${recent.map((rx) => rxMini(st, rx)).join('')}</div>
    </div>`;
  }

  function rxListHtml(st) {
    const q = (st.qRx || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const list = st.db.rx.filter((rx) => {
      if (!q) return true;
      const p = patientOf(st, rx.pid);
      return `${fullName(p)} ${rxNumber(rx.id)}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
    });
    if (!list.length) return `<div class="m-empty">No hay recetas con «${esc(st.qRx)}».</div>`;
    return list.map((rx) => rxCard(st, rx)).join('') + '<div class="m-fn m-center">Al bajar se cargan las siguientes</div>';
  }

  function vTodas(st) {
    return `<div class="m-body">
      ${back('Recetas')}
      <div class="m-lt">Todas las recetas</div>
      <label class="m-search">${I('search')}<input data-input="qRx" type="search" placeholder="Paciente o número de receta" value="${esc(st.qRx || '')}" aria-label="Buscar recetas"></label>
      <div class="m-stack" id="rxlist">${rxListHtml(st)}</div>
    </div>`;
  }

  function vPaciente(st) {
    const p = patientOf(st, st.patientId);
    const list = st.db.rx.filter((r) => r.pid === p.id);
    return `<div class="m-body">
      ${back(st.tab === 'mas' ? 'Pacientes' : 'Recetas')}
      <div class="m-card m-pathead">${avatar(p, 56)}<div class="m-col"><span class="m-h22">${esc(fullName(p))}</span><span class="m-fn">CC ${p.cc} · ${age(p.dob)} años</span><span class="m-fn m-trunc">${esc(p.phone)} · ${esc(p.email)}</span></div></div>
      <button type="button" class="m-btn lg pri" data-a="nueva-para" data-id="${p.id}" data-tid="nueva-para">${I('pen')}<span class="grow">Nueva receta para ${esc(p.first.split(' ')[0])}</span>${I('arrow-r')}</button>
      <div class="m-sechead"><span>Recetas de ${esc(p.first.split(' ')[0])} (${list.length})</span></div>
      <div class="m-stack">${list.length ? list.map((rx) => rxMini(st, rx)).join('') : '<div class="m-empty">Todavía no tiene recetas.</div>'}</div>
    </div>`;
  }

  function vDetalle(st) {
    const rx = rxOf(st, st.rxId);
    const p = patientOf(st, rx.pid);
    const a = primaryAction(rx);
    const items = rx.items.map((i) => {
      const prod = product(i.p);
      return `<div class="m-item"><div class="m-row m-between" style="align-items:flex-start"><span class="m-hd" style="font-size:16px">${esc(prod.name)}</span><span class="m-amt-s">${money(prod.price * i.q)}</span></div><span class="m-fn">${BRAND} · Cant. ${i.q}</span><span class="m-fn m-t2">${esc(sigLine(i))}</span><span class="m-fn c-acc" style="font-weight:600">Comisión proyectada: 8 % = ${money(prod.price * i.q * 0.08)}</span></div>`;
    }).join('');
    return `<div class="m-body has-foot2">
      ${back(backLabel(st, 'Recetas'))}
      <div><div class="m-row" style="gap:10px"><span class="m-h22 m-rx">${rxNumber(rx.id)}</span>${pill(rx.status)}</div><div class="m-fn" style="margin-top:4px">${when(rx.date, true)}</div></div>
      <div class="m-card m-stack" style="gap:4px"><span class="m-sec">Paciente</span><span class="m-hd" style="margin:2px 0 4px">${esc(fullName(p))}</span>
        <div class="m-kv"><span>Cédula</span><b>${p.cc}</b></div><div class="m-kv"><span>Teléfono</span><b>${esc(p.phone)}</b></div><div class="m-kv"><span>Correo</span><b>${esc(p.email)}</b></div></div>
      <div class="m-card m-stack" style="gap:12px"><span class="m-sec">Medicamentos (${rx.items.length})</span>${items}</div>
      <div class="m-card m-row m-between"><span class="m-hd">Total receta</span><span class="m-amt-m">${money(total(rx.items))}</span></div>
      ${rx.id === 58 ? `<div class="m-card m-row"><span class="m-tile tn-bad">${I('doc')}</span><div class="m-col"><span class="m-sub m-t1" style="font-weight:600">Plan de alimentación.pdf</span><span class="m-fn">Documento adjunto</span></div><span class="m-link">Ver</span></div>` : ''}
    </div>
    <div class="m-foot above-tabs"><div class="m-row" style="gap:10px"><button type="button" class="m-btn tall pri" style="flex:1" data-a="${a.a}" data-id="${rx.id}" data-tid="detail-primary">${I(a.icon)}${a.label}</button><button type="button" class="m-btn tall sq" style="width:50px" data-a="acciones" data-id="${rx.id}" data-tid="detail-more" aria-label="Más acciones">${I('more')}</button></div></div>`;
  }

  function vCitas(st) {
    const groups = APPTS.map((g) => `<div class="m-row m-between m-dayhead"><span class="m-hd">${g.day}</span><span class="m-fn">${g.items.length} ${g.items.length === 1 ? 'cita' : 'citas'}</span></div>` + g.items.map((c) => {
      const p = patientOf(st, c.pid);
      const video = c.video === 'active'
        ? { pill: '<span class="m-pill tn-ok">Video activo</span>', btn: `<button type="button" class="m-btn sm pri" style="flex:1" data-a="aviso" data-v="Se abre la videoconsulta en el navegador.">${I('video', 'm-ico s')}Unirme</button>` }
        : { pill: '<span class="m-pill tn-neu">Sin videoconsulta</span>', btn: `<button type="button" class="m-btn sm tint" style="flex:1" data-a="aviso" data-v="Se crea el enlace de la videoconsulta.">${I('video', 'm-ico s')}Crear video</button>` };
      return `<div class="m-card m-appt"><div class="m-time"><b>${c.time}</b><span>${c.ap}</span></div><div class="m-col" style="gap:6px"><span class="m-hd">${esc(fullName(p))}</span><span class="m-fn">${c.type} · ${c.fee ? money(c.fee) : 'Sin tarifa'}</span><div class="m-row" style="gap:6px;flex-wrap:wrap"><span class="m-pill tn-info">Programada</span>${video.pill}</div><div class="m-row" style="gap:8px;margin-top:4px">${video.btn}<button type="button" class="m-btn sm sq" data-a="aviso" data-v="Editar, Completar y Cancelar viven en este menú." aria-label="Más acciones">${I('more')}</button></div></div></div>`;
    }).join('')).join('');
    return `<div class="m-body">
      <div class="m-row m-between m-titleblock"><div class="m-lt">Citas</div><button type="button" class="m-btn sm pri" data-a="aviso" data-v="Nueva cita abre su formulario a pantalla completa.">${I('plus', 'm-ico s')}Nueva</button></div>
      <div class="m-seg"><span class="on">Hoy</span><span>Semana</span><span>Mes</span><span>Todo</span></div>
      <div class="m-row" style="gap:8px"><span class="m-search" style="flex:1">${I('search')}<span>Nombre, teléfono…</span></span><button type="button" class="m-btn sm" data-a="aviso" data-v="Los filtros de estado y video se eligen en una hoja.">${I('filter', 'm-ico s')}Filtros</button></div>
      ${groups}
    </div>`;
  }

  function vPacientes(st) {
    return `<div class="m-body">
      <div class="m-row m-between m-titleblock"><div><div class="m-lt">Pacientes</div><div class="m-fn">${st.db.patients.length + 40} pacientes</div></div><button type="button" class="m-btn sq pri" data-a="aviso" data-v="Nuevo paciente abre su formulario a pantalla completa." aria-label="Nuevo paciente">${I('plus')}</button></div>
      <label class="m-search">${I('search')}<input data-input="qPacientes" type="search" placeholder="Nombre, cédula o correo" value="${esc(st.qPacientes || '')}" aria-label="Buscar pacientes"></label>
      <div id="plist2">${patientList(st, st.qPacientes, 'ver-paciente', 'pp-')}</div>
    </div>`;
  }

  function vBilletera() {
    return `<div class="m-body">
      <div class="m-lt m-titleblock">Billetera</div>
      <div class="m-card"><span class="m-fn" style="font-weight:600">Balance disponible</span><div class="m-amt-xl">${money(12450)}</div><div class="m-hr"></div>
        <div class="m-pair"><div class="m-col"><span class="m-fn">Pendiente</span><span class="m-amt-m c-warn">${money(346598)}</span></div><div class="m-col"><span class="m-fn">Total ganado</span><span class="m-amt-m c-ok">${money(58320)}</span></div></div></div>
      <button type="button" class="m-btn tall pri" data-a="aviso" data-v="El canje se confirma en una hoja con el monto.">${I('swap')}Canjear saldo por crédito</button>
      <div class="m-sechead"><span>Transacciones</span></div>
      <div class="m-seg"><span class="on">Todas</span><span>Ganadas</span><span>Pendientes</span></div>
      <div class="m-list flat">${TX.map((t) => `<div class="m-li"><div class="m-col"><span class="m-amt-s ${t.sign === '+' ? 'c-ok' : ''}">${t.sign}${money(t.amt)}</span><span class="m-fn">${t.date}</span></div><span class="m-pill tn-${t.tone}">${t.status}</span>${I('chev-r', 'm-chev')}</div>`).join('')}</div>
    </div>`;
  }

  function vPerfil() {
    const row = (icon, t, label, right) => `<div class="m-li"><span class="m-tile tn-${t}">${I(icon)}</span><div class="m-col"><span class="m-bd">${label}</span></div>${right || I('chev-r', 'm-chev')}</div>`;
    return `<div class="m-body">
      <div class="m-lt m-titleblock">Perfil</div>
      <div class="m-card m-stack" style="gap:2px"><span class="m-h20">Dr. ${DOCTOR.first} ${DOCTOR.last}</span><span class="m-fn">${DOCTOR.email}</span></div>
      <div class="m-sec">Cuenta</div>
      <div class="m-list">${row('user', 'info', 'Información personal')}${row('doc', 'teal', 'Información profesional')}${row('bank', 'warn', 'Cuenta bancaria')}${row('folder', 'vio', 'Galería de documentos', `<span class="m-fn">3</span>${I('chev-r', 'm-chev')}`)}</div>
      <div class="m-sec">Seguridad</div>
      <div class="m-list">${row('lock', 'neu', 'Cambiar contraseña')}${row('face', 'ok', 'Entrar con Face ID', '<span class="m-switch on"></span>')}</div>
    </div>`;
  }

  // ───────────────────────── New prescription flow ─────────────────────────
  function newFlow(extra) {
    return Object.assign({
      step: 'buscar', patientId: null, q: '', np: { email: '', first: '', last: '', phone: '', idType: 'Cédula Nacional', id: '', dob: '', address: '', city: '', state: '' },
      errors: {}, items: [], note: '', docs: { 1: true, 2: false, 3: false }, send: true, catQ: '', cat: null, brand: null, draft: null, createdId: null,
    }, extra || {});
  }

  function flowHead(step) {
    const index = { buscar: 0, nuevo: 0, meds: 1, final: 2, listo: 3 }[step];
    const names = ['Paciente', 'Medicamentos', 'Finalizar'];
    return `<div class="m-fixed">
      <div class="m-fhead"><button type="button" class="m-btn sm sq" data-a="cerrar-flujo" data-tid="cerrar" aria-label="Cerrar">${I('x')}</button><span class="m-hd">Nueva receta</span><span style="width:36px"></span></div>
      <div class="m-steps">${names.map((n, i) => `<div class="${i < index ? 'done' : i === index ? 'on' : ''}"><i></i><span>${i + 1} · ${n}</span></div>`).join('')}</div>
    </div>`;
  }

  function flowPatient(st) {
    const f = st.flow;
    if (f.patientId === 'new') return { id: 'new', first: f.np.first, last: f.np.last, cc: f.np.id, dob: '1990-01-01', email: f.np.email, phone: f.np.phone };
    return patientOf(st, f.patientId);
  }

  function vFlowBuscar(st) {
    const f = st.flow;
    return `${flowHead('buscar')}
    <div class="m-body">
      <div class="m-h22" style="margin-top:4px">¿Para quién es la receta?</div>
      <label class="m-search focus">${I('search')}<input data-input="flowQ" type="search" placeholder="Nombre, cédula o correo" value="${esc(f.q)}" aria-label="Buscar paciente"></label>
      <button type="button" class="m-newpat" data-a="paciente-nuevo" data-tid="nuevo"><span class="m-tile tn-info">${I('user-plus')}</span><span class="m-col"><b>Paciente sin registrar</b><small>Llenar sus datos a mano</small></span>${I('chev-r', 'm-chev')}</button>
      <div class="m-sec">Tus pacientes · del más reciente</div>
      <div id="flowlist">${patientList(st, f.q, 'elegir-paciente', 'pac-')}</div>
    </div>`;
  }

  function field(label, key, value, opts = {}) {
    const err = opts.error ? `<span class="m-err">${opts.error}</span>` : '';
    if (opts.button) {
      return `<div class="m-field"><span class="m-lbl">${label}</span><button type="button" class="m-inp${opts.error ? ' bad' : ''}${value ? '' : ' ph'}" data-a="${opts.button}">${esc(value || opts.placeholder || '')}${I(opts.icon || 'chev-d')}</button>${err}</div>`;
    }
    return `<div class="m-field"><span class="m-lbl">${label}</span><label class="m-inp${opts.error ? ' bad' : ''}"><input data-input="np.${key}" type="${opts.type || 'text'}" ${opts.mode ? `inputmode="${opts.mode}"` : ''} placeholder="${esc(opts.placeholder || '')}" value="${esc(value)}" aria-label="${esc(label)}"></label>${err}</div>`;
  }

  function vFlowNuevo(st) {
    const f = st.flow;
    const e = f.errors;
    return `${flowHead('nuevo')}
    <div class="m-body has-foot">
      <button type="button" class="m-back" data-a="volver-buscar">${I('chev-l')}Buscar paciente</button>
      <div class="m-h22">Paciente nuevo</div>
      <div class="m-card m-stack">
        <span class="m-hd">Datos del paciente</span>
        ${field('Correo electrónico *', 'email', f.np.email, { type: 'email', mode: 'email', placeholder: 'nombre@correo.com', error: e.email })}
        <div class="m-pair">${field('Nombre *', 'first', f.np.first, { error: e.first })}${field('Apellido *', 'last', f.np.last, { error: e.last })}</div>
        ${field('Teléfono *', 'phone', f.np.phone, { type: 'tel', mode: 'tel', placeholder: '300 000 0000', error: e.phone })}
        ${field('Tipo de ID *', 'idType', f.np.idType, { button: 'idtipo' })}
        ${field('Número de ID *', 'id', f.np.id, { mode: 'numeric', error: e.id })}
        ${field('Fecha de nacimiento *', 'dob', f.np.dob, { button: 'fecha', icon: 'cal', placeholder: 'Elegir fecha', error: e.dob })}
      </div>
      <div class="m-card m-stack">
        <span class="m-hd">Dirección</span>
        ${field('Dirección *', 'address', f.np.address, { placeholder: 'Calle, número y barrio', error: e.address })}
        <div class="m-pair">${field('Ciudad', 'city', f.np.city)}${field('Departamento', 'state', f.np.state)}</div>
      </div>
      <div class="m-card m-row"><div class="m-col"><span class="m-hd">Historia médica</span><span class="m-fn">Opcional: género, sangre, peso, alergias</span></div>${I('chev-d', 'm-chev')}</div>
    </div>
    <div class="m-foot"><button type="button" class="m-btn tall pri" data-a="continuar-nuevo" data-tid="continuar-nuevo">Continuar${I('arrow-r')}</button></div>`;
  }

  function productCard(st, prod) {
    const inRx = st.flow.items.some((i) => i.p === prod.id);
    const action = inRx
      ? `<button type="button" class="m-btn sm tint" data-a="editar-item" data-id="${prod.id}" data-tid="add-${prod.id}">${I('check', 'm-ico s')}Agregado</button>`
      : `<button type="button" class="m-btn sm pri" data-a="agregar" data-id="${prod.id}" data-tid="add-${prod.id}">${I('plus', 'm-ico s')}Agregar</button>`;
    return `<div class="m-card m-prod">
      <span class="m-thumb tn-${prod.tone}">${I('pill')}</span>
      <div class="m-col"><span class="m-hd m-prodname">${esc(prod.name)}</span><span class="m-fn">${BRAND} · SKU ${prod.sku}</span>
        <div class="m-row m-between" style="margin-top:8px"><span class="m-amt-p c-ok">${money(prod.price)}</span><div class="m-row" style="gap:6px"><button type="button" class="m-btn sm ghost" data-a="detalles" data-id="${prod.id}" data-tid="det-${prod.id}">Detalles</button>${action}</div></div></div>
    </div>`;
  }

  function catalogHtml(st) {
    const f = st.flow;
    const q = (f.catQ || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const list = PRODUCTS.filter((p) => (!f.cat || p.cat === f.cat) && (!q || p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)));
    if (!list.length) return '<div class="m-empty">No hay medicamentos con ese nombre.</div>';
    return list.map((p) => productCard(st, p)).join('');
  }

  function vFlowMeds(st) {
    const f = st.flow;
    const p = flowPatient(st);
    const count = f.items.length;
    const sum = total(f.items);
    return `${flowHead('meds')}
    <div class="m-body has-foot2">
      <button type="button" class="m-patchip" data-a="cambiar-paciente" data-tid="patchip">${avatar(p, 34)}<span class="m-col"><b>Para ${esc(fullName(p))}</b><small>CC ${esc(p.cc)}</small></span><span class="m-link">Cambiar</span></button>
      <label class="m-search">${I('search')}<input data-input="catQ" type="search" placeholder="Buscar medicamento" value="${esc(f.catQ)}" aria-label="Buscar medicamento"></label>
      <div class="m-row" style="gap:8px"><button type="button" class="m-btn sm${f.cat ? ' tint' : ''}" data-a="filtro" data-v="cat">${esc(f.cat || 'Categoría')}${I('chev-d', 'm-chev')}</button><button type="button" class="m-btn sm${f.brand ? ' tint' : ''}" data-a="filtro" data-v="brand">${esc(f.brand || 'Marca')}${I('chev-d', 'm-chev')}</button></div>
      <div class="m-stack" id="catlist">${catalogHtml(st)}</div>
    </div>
    <div class="m-foot">
      ${count ? `<button type="button" class="m-btn tray" data-a="ver-receta" data-tid="tray"><span class="m-badge">${count}</span><span class="grow">${count === 1 ? 'medicamento' : 'medicamentos'} en la receta</span><span class="m-amt-s">${money(sum)}</span>${I('chev-u', 'm-chev')}</button>` : '<div class="m-fn m-center">Agrega al menos un medicamento para continuar</div>'}
      <button type="button" class="m-btn tall pri" data-a="a-final" data-tid="continuar"${count ? '' : ' disabled'}>Continuar${I('arrow-r')}</button>
    </div>`;
  }

  function vFlowFinal(st) {
    const f = st.flow;
    const p = flowPatient(st);
    const items = f.items.map((i) => `<div class="m-col"><div class="m-row m-between" style="align-items:flex-start"><span class="m-hd" style="font-size:15px">${esc(product(i.p).name)}</span><span class="m-fn">Cant. ${i.q}</span></div><span class="m-fn">${esc(sigLine(i))}</span></div>`).join('');
    const docs = DOCS.map((d) => `<button type="button" class="m-docrow" data-a="doc" data-id="${d.id}"><span class="m-tile tn-${d.type === 'PDF' ? 'bad' : 'info'}">${I('doc')}</span><span class="m-col"><span class="m-sub m-t1" style="font-weight:600">${d.name}</span><span class="m-fn">${d.type} · ${d.size}</span></span><span class="m-switch${f.docs[d.id] ? ' on' : ''}"></span></button>`).join('');
    return `${flowHead('final')}
    <div class="m-body has-foot">
      <div class="m-card m-stack" style="gap:10px">
        <div class="m-row m-between"><span class="m-sec">Para</span><button type="button" class="m-link" data-a="cambiar-paciente">Cambiar</button></div>
        <div class="m-row">${avatar(p, 36)}<div class="m-col"><span class="m-hd">${esc(fullName(p))}</span><span class="m-fn">CC ${esc(p.cc)}</span></div></div>
        <div class="m-hr" style="margin:2px 0"></div>
        <div class="m-row m-between"><span class="m-sec">Medicamentos (${f.items.length})</span><button type="button" class="m-link" data-a="editar-meds">Editar</button></div>
        ${items}
        <div class="m-hr" style="margin:2px 0"></div>
        <div class="m-row m-between"><span class="m-sub">Total</span><span class="m-amt-m">${money(total(f.items))}</span></div>
      </div>
      <div class="m-field"><span class="m-lbl">Nota adicional (opcional)</span><label class="m-inp area"><textarea data-input="note" rows="3" placeholder="Indicaciones para el paciente o la farmacia" aria-label="Nota adicional">${esc(f.note)}</textarea></label></div>
      <div class="m-card m-stack" style="gap:6px">
        <div class="m-row m-between"><span class="m-hd">Documentos adjuntos</span><button type="button" class="m-link" data-a="docs-todos">Incluir todos</button></div>
        <span class="m-fn">De tu galería. Activa los que quieras enviar con esta receta.</span>
        ${docs}
        <button type="button" class="m-btn sm ghost" style="align-self:flex-start;margin-top:4px" data-a="aviso" data-v="Se elige el archivo desde Archivos o Fotos.">${I('clip', 'm-ico s')}Subir otro documento</button>
      </div>
      <button type="button" class="m-card m-sendrow" data-a="toggle-send"><span class="m-col"><span class="m-hd">Enviar al paciente al crearla</span><span class="m-fn">Le llega por correo y WhatsApp</span></span><span class="m-switch${f.send ? ' on' : ''}"></span></button>
    </div>
    <div class="m-foot"><button type="button" class="m-btn tall pri" data-a="crear" data-tid="crear">${I('check')}Crear receta</button></div>`;
  }

  function vFlowListo(st) {
    const f = st.flow;
    const p = flowPatient(st);
    const n = f.items.length;
    return `${flowHead('listo')}
    <div class="m-body m-done">
      <span class="m-donecheck">${I('check')}</span>
      <div class="m-h28">Receta creada</div>
      <div class="m-rx m-donenum">${rxNumber(f.createdId || st.db.nextId)}</div>
      <div class="m-card m-stack" style="gap:6px;width:100%">
        <div class="m-row m-between"><span class="m-hd">${esc(fullName(p))}</span>${pill(f.send ? 'sent' : 'draft')}</div>
        <span class="m-fn">${n} ${n === 1 ? 'medicamento' : 'medicamentos'} · ${money(total(f.items))}</span>
        <span class="m-fn">${f.send ? 'Se envió al paciente.' : 'Quedó como borrador. Puedes enviarla cuando quieras.'}</span>
      </div>
      <button type="button" class="m-btn tall pri" style="width:100%" data-a="ver-creada" data-tid="ver-creada">Ver receta</button>
      <button type="button" class="m-btn tall" style="width:100%" data-a="enlace-creada">${I('share')}Compartir enlace</button>
      <button type="button" class="m-link" data-a="volver-recetas">Volver a Recetas</button>
    </div>`;
  }

  // ───────────────────────── Sheets ─────────────────────────
  function sheetFrame(inner, { tall = false, enter = false, cls = '' } = {}) {
    return `<button type="button" class="m-scrim" data-a="cerrar-hoja" aria-label="Cerrar"></button><div class="m-sheet${tall ? ' tall' : ''}${enter ? ' enter' : ''} ${cls}" role="dialog"><i class="m-grab"></i>${inner}</div>`;
  }
  const sheetHead = (title, right) => `<div class="m-sheethead"><span class="m-h20">${title}</span>${right === undefined ? '<button type="button" class="m-link" data-a="cerrar-hoja">Cerrar</button>' : right}</div>`;

  function sheetBuscar(st) {
    return `${sheetHead('Buscar paciente')}
      <label class="m-search focus">${I('search')}<input data-input="qB" type="search" placeholder="Nombre, cédula o correo" value="${esc(st.qB || '')}" aria-label="Buscar paciente"></label>
      <div class="m-sec">Del más reciente al más antiguo</div>
      <div class="m-sheet-scroll" id="blist">${patientList(st, st.qB, 'ver-paciente', 'bp-')}</div>`;
  }

  function sheetProducto(sh) {
    const p = product(sh.id);
    return `<div class="m-prodhero tn-${p.tone}">${I('pill')}</div>
      <div class="m-sheet-scroll">
        <div class="m-h20">${esc(p.name)}</div>
        <div class="m-fn" style="margin-top:2px">${BRAND} · ${p.cat}</div>
        <div class="m-amt-l c-ok" style="margin:10px 0 6px">${money(p.price)}</div>
        <div class="m-card m-stack" style="gap:4px;box-shadow:none"><div class="m-kv"><span>SKU</span><b>${p.sku}</b></div><div class="m-kv"><span>Registro</span><b>${p.invima}</b></div><div class="m-kv"><span>Tu comisión</span><b>8 % · ${money(p.price * 0.08)}</b></div></div>
        <p class="m-sub" style="margin:12px 2px 0">${esc(p.desc)}</p>
      </div>
      <div class="m-sheet-foot"><button type="button" class="m-btn tall pri" data-a="agregar" data-id="${p.id}" data-tid="det-agregar">${I('plus')}Agregar a la receta</button></div>`;
  }

  function chips(group, options, value, tidPrefix) {
    return `<div class="m-chips">${options.map((o, i) => `<button type="button" class="m-chip${value === o ? ' on' : ''}" data-a="chip" data-f="${group}" data-v="${esc(o)}" data-tid="${tidPrefix}-${i}">${esc(o)}</button>`).join('')}</div>`;
  }

  function sheetDosis(st, sh) {
    const d = st.flow.draft;
    const p = product(d.p);
    const ready = d.dose && d.freq && d.dur;
    const editing = sh.edit;
    return `<div class="m-sheethead"><div class="m-col"><span class="m-hd">${esc(p.name)}</span><span class="m-fn">${BRAND} · ${money(p.price)}</span></div><button type="button" class="m-btn sm sq" data-a="cerrar-hoja" aria-label="Cerrar">${I('x')}</button></div>
      <div class="m-sheet-scroll m-stack">
        <div class="m-pair">
          <div class="m-field"><span class="m-lbl">Cantidad</span><div class="m-stepper"><button type="button" class="m-btn sm sq" data-a="paso" data-f="q" data-v="-1" aria-label="Menos">${I('minus')}</button><b>${d.q}</b><button type="button" class="m-btn sm sq" data-a="paso" data-f="q" data-v="1" aria-label="Más">${I('plus')}</button></div></div>
          <div class="m-field"><span class="m-lbl">Repeticiones</span><div class="m-stepper"><button type="button" class="m-btn sm sq" data-a="paso" data-f="r" data-v="-1" aria-label="Menos">${I('minus')}</button><b>${d.r}</b><button type="button" class="m-btn sm sq" data-a="paso" data-f="r" data-v="1" aria-label="Más">${I('plus')}</button></div></div>
        </div>
        <div class="m-field"><span class="m-lbl">Tipo de dosificación</span><button type="button" class="m-inp" data-a="tipo">${esc(d.type)}${I('chev-d')}</button></div>
        <div class="m-field"><span class="m-lbl">Dosis</span>${chips('dose', DOSE[p.unit], d.dose, 'dose')}</div>
        <div class="m-field"><span class="m-lbl">Frecuencia</span>${chips('freq', FREQ, d.freq, 'freq')}</div>
        <div class="m-field"><span class="m-lbl">Duración</span>${chips('dur', DUR, d.dur, 'dur')}</div>
        <div class="m-field"><span class="m-lbl">Indicación <span class="m-opt-l">(opcional)</span></span>${chips('sig', SIG, d.sig, 'sig')}</div>
        <div class="m-sigbox${ready ? '' : ' empty'}"><span class="m-cap">ASÍ LO LEERÁ EL PACIENTE</span><span>${ready ? esc(sigLine(d)) + '.' : 'Elige dosis, frecuencia y duración.'}</span></div>
      </div>
      <div class="m-sheet-foot">${editing ? `<button type="button" class="m-link red" data-a="quitar-item" data-id="${d.p}">Quitar de la receta</button>` : ''}<button type="button" class="m-btn tall pri" data-a="agregar-receta" data-tid="agregar-receta"${ready ? '' : ' disabled'}>${editing ? 'Guardar cambios' : 'Agregar a la receta'}</button></div>`;
  }

  function sheetTipo(st) {
    const d = st.flow.draft;
    return `${sheetHead('Tipo de dosificación')}<div class="m-sheet-scroll"><div class="m-opts">${DOSE_TYPES.map((t) => `<button type="button" class="m-opt${d.type === t ? ' on' : ''}" data-a="elegir-tipo" data-v="${esc(t)}">${esc(t)}${d.type === t ? I('check') : ''}</button>`).join('')}</div></div>`;
  }

  function sheetFiltro(st, sh) {
    const f = st.flow;
    const isCat = sh.v === 'cat';
    const options = isCat ? CATEGORIES : [BRAND];
    const current = isCat ? f.cat : f.brand;
    const all = isCat ? 'Todas las categorías' : 'Todas las marcas';
    return `${sheetHead(isCat ? 'Categoría' : 'Marca')}<div class="m-opts">
      <button type="button" class="m-opt${current ? '' : ' on'}" data-a="elegir-filtro" data-f="${sh.v}" data-v="">${all}${current ? '' : I('check')}</button>
      ${options.map((o) => `<button type="button" class="m-opt${current === o ? ' on' : ''}" data-a="elegir-filtro" data-f="${sh.v}" data-v="${esc(o)}">${esc(o)}${current === o ? I('check') : ''}</button>`).join('')}</div>`;
  }

  function sheetReceta(st) {
    const f = st.flow;
    const rows = f.items.map((i) => `<button type="button" class="m-li" data-a="editar-item" data-id="${i.p}"><span class="m-tile tn-${product(i.p).tone}">${I('pill')}</span><span class="m-col"><span class="m-hd" style="font-size:16px">${esc(product(i.p).name)}</span><span class="m-fn">Cant. ${i.q} · ${esc(sigLine(i))}</span></span>${I('chev-r', 'm-chev')}</button>`).join('');
    return `${sheetHead(`En la receta (${f.items.length})`, `<button type="button" class="m-btn sm vio" data-a="analizar">${I('spark', 'm-ico s')}Analizar IA</button>`)}
      <div class="m-sheet-scroll"><div class="m-list flat" style="box-shadow:none">${rows}</div></div>
      <div class="m-row m-between" style="padding:0 4px"><span class="m-sub">Total</span><span class="m-amt-m">${money(total(f.items))}</span></div>`;
  }

  function sheetIA() {
    return `${sheetHead('Análisis de interacciones')}
      <div class="m-note tn-ok">${I('checkc')}<div><b>Riesgo bajo estimado</b>Mantener vigilancia clínica y confirmar criterio profesional.</div></div>
      <div class="m-opts"><div class="m-opt"><span>Interacciones</span><span class="m-badge" style="background:var(--a-t3)">0</span></div><div class="m-opt"><span>Contraindicaciones</span><span class="m-badge" style="background:var(--a-t3)">0</span></div><div class="m-opt"><span>Recomendaciones</span><span class="m-badge">2</span></div></div>
      <div class="m-note tn-neu">${I('info')}<div><b>Aviso clínico obligatorio</b>Esta información es educativa y no sustituye el juicio clínico.</div></div>
      <button type="button" class="m-btn tall" data-a="cerrar-hoja">Cerrar</button>`;
  }

  function moreActions(rx) {
    const list = [{ a: 'crear-link', label: 'Crear link', icon: 'link' }];
    if (rx.status === 'draft') list.push({ a: 'whatsapp', label: 'Enviar por WhatsApp', icon: 'chat' });
    if (rx.status === 'sent') list.push({ a: 'reenviar', label: 'Reenviar correo', icon: 'mail' }, { a: 'reenviar-wa', label: 'Reenviar WhatsApp', icon: 'chat' });
    return list;
  }

  function sheetAcciones(st, sh) {
    const rx = rxOf(st, sh.id);
    const p = patientOf(st, rx.pid);
    const canCancel = !['filled', 'completed', 'cancelled', 'expired'].includes(rx.status);
    return `<div class="m-fn m-center" style="padding-top:2px">${rxNumber(rx.id)} · ${esc(fullName(p))}</div>
      <div class="m-opts">${moreActions(rx).map((x) => `<button type="button" class="m-opt start" data-a="${x.a}" data-id="${rx.id}" data-tid="act-${x.a}">${I(x.icon, 'm-ico c-acc')}${x.label}</button>`).join('')}</div>
      ${canCancel ? `<div class="m-opts"><button type="button" class="m-opt start c-bad" data-a="cancelar" data-id="${rx.id}" data-tid="act-cancelar">${I('xc')}Cancelar receta</button></div>` : ''}
      <button type="button" class="m-btn tall" data-a="cerrar-hoja">Cerrar</button>`;
  }

  function sheetEnlace(st, sh) {
    const rx = rxOf(st, sh.id);
    const p = patientOf(st, rx.pid);
    return `<div class="m-center m-stack" style="align-items:center;gap:8px;padding-top:4px"><span class="m-tile tn-ok big">${I('checkc')}</span><span class="m-h20">Enlace de receta listo</span><span class="m-fn">${rxNumber(rx.id)} · ${esc(fullName(p))}</span></div>
      <div class="m-inp locked m-trunc" style="font-size:15px">presclick.app/rx/${(rx.id * 7919).toString(36)}k2f</div>
      <button type="button" class="m-btn tall pri" data-a="copiar">${I('copy')}Copiar enlace</button>
      <div class="m-pair"><button type="button" class="m-btn tall" data-a="compartir">${I('share')}Compartir</button><button type="button" class="m-btn tall" data-a="aviso" data-v="El enlace se abre en el navegador.">${I('ext')}Abrir</button></div>`;
  }

  function sheetCancelar(st, sh) {
    const rx = rxOf(st, sh.id);
    return `<div class="m-center m-stack" style="align-items:center;gap:6px;padding-top:4px"><span class="m-tile tn-bad big">${I('alert')}</span><span class="m-h20">¿Cancelar esta receta?</span><span class="m-sub">La receta ${rxNumber(rx.id)} quedará cancelada.</span></div>
      <button type="button" class="m-btn tall danger" data-a="confirmar-cancelar" data-id="${rx.id}">Cancelar receta</button>
      <button type="button" class="m-btn tall" data-a="cerrar-hoja">Volver</button>`;
  }

  function sheetDescartar() {
    return `<div class="m-center m-stack" style="align-items:center;gap:6px;padding-top:4px"><span class="m-tile tn-warn big">${I('alert')}</span><span class="m-h20">¿Descartar esta receta?</span><span class="m-sub">Se perderá lo que llevas escrito.</span></div>
      <button type="button" class="m-btn tall danger" data-a="confirmar-descartar">Descartar</button>
      <button type="button" class="m-btn tall" data-a="cerrar-hoja">Seguir editando</button>`;
  }

  function sheetIdTipo(st) {
    const v = st.flow.np.idType;
    return `${sheetHead('Tipo de ID')}<div class="m-opts">${ID_TYPES.map((t) => `<button type="button" class="m-opt${v === t ? ' on' : ''}" data-a="elegir-idtipo" data-v="${esc(t)}">${esc(t)}${v === t ? I('check') : ''}</button>`).join('')}</div>`;
  }

  function sheetFecha() {
    return `<div class="m-sheethead"><button type="button" class="m-link muted" data-a="cerrar-hoja">Cancelar</button><span class="m-hd">Fecha de nacimiento</span><button type="button" class="m-link" data-a="listo-fecha">Listo</button></div>
      <div class="m-wheel"><div><span>10</span><span>11</span><span class="on">12</span><span>13</span><span>14</span></div><div><span>enero</span><span>febrero</span><span class="on">marzo</span><span>abril</span><span>mayo</span></div><div><span>1988</span><span>1989</span><span class="on">1990</span><span>1991</span><span>1992</span></div></div>
      <div class="m-fn m-center">36 años</div>`;
  }

  function renderSheets(st, enterTop) {
    const sheets = st.sheets || [];
    return sheets.map((sh, i) => {
      const enter = enterTop && i === sheets.length - 1;
      switch (sh.t) {
        case 'buscar': return sheetFrame(sheetBuscar(st), { tall: true, enter });
        case 'producto': return sheetFrame(sheetProducto(sh), { tall: true, enter });
        case 'dosis': return sheetFrame(sheetDosis(st, sh), { tall: true, enter });
        case 'tipo': return sheetFrame(sheetTipo(st), { enter, cls: 'mid' });
        case 'filtro': return sheetFrame(sheetFiltro(st, sh), { enter });
        case 'receta': return sheetFrame(sheetReceta(st), { enter });
        case 'ia': return sheetFrame(sheetIA(), { enter });
        case 'acciones': return sheetFrame(sheetAcciones(st, sh), { enter });
        case 'enlace': return sheetFrame(sheetEnlace(st, sh), { enter });
        case 'cancelar': return sheetFrame(sheetCancelar(st, sh), { enter });
        case 'descartar': return sheetFrame(sheetDescartar(), { enter });
        case 'idtipo': return sheetFrame(sheetIdTipo(st), { enter });
        case 'fecha': return sheetFrame(sheetFecha(), { enter });
        default: return '';
      }
    }).join('');
  }

  // ───────────────────────── Phone ─────────────────────────
  function screen(st) {
    switch (st.view) {
      case 'dashboard': return vDashboard(st);
      case 'recetas': return vRecetas(st);
      case 'todas': return vTodas(st);
      case 'paciente': return vPaciente(st);
      case 'detalle': return vDetalle(st);
      case 'citas': return vCitas(st);
      case 'pacientes': return vPacientes(st);
      case 'billetera': return vBilletera(st);
      case 'perfil': return vPerfil(st);
      case 'flow': {
        const step = st.flow.step;
        if (step === 'nuevo') return vFlowNuevo(st);
        if (step === 'meds') return vFlowMeds(st);
        if (step === 'final') return vFlowFinal(st);
        if (step === 'listo') return vFlowListo(st);
        return vFlowBuscar(st);
      }
      default: return '';
    }
  }

  function renderPhone(st, o = {}) {
    let h = STATUS_BAR + `<div class="m-view${o.enterView ? ' enter' : ''}">${screen(st)}</div>`;
    if (st.view !== 'flow') h += tabBar(st);
    if (st.menu) h += menu(st, o.enterMenu);
    h += renderSheets(st, o.enterSheet);
    if (st.toast) h += `<div class="m-toast" role="status">${esc(st.toast)}</div>`;
    return h + '<i class="m-home"></i>';
  }

  // Two figures per row while both fit at full size; otherwise one per row.
  function fitRows(root) {
    root.querySelectorAll('.m-pairrow').forEach((row) => {
      row.classList.remove('stack');
      const overflow = [...row.querySelectorAll('.m-amt')].some((el) => el.scrollWidth > el.clientWidth + 0.5);
      if (overflow) row.classList.add('stack');
    });
  }

  function mountPhone(host, scale) {
    host.innerHTML = '<div class="m-wrap"><div class="m-phone"></div></div>';
    if (scale) host.style.setProperty('--s', scale);
    return host.querySelector('.m-phone');
  }

  // ───────────────────────── Still images ─────────────────────────
  const ITEM_901 = it(901, 1, '1 tableta', 'cada 24 horas', '30 días', '');
  const base = (extra) => Object.assign({ view: 'recetas', tab: 'recetas', numbers: 'small', sheets: [], menu: false, db: makeDb() }, extra);
  const flowAt = (extra, more) => base(Object.assign({ view: 'flow', tab: 'recetas', flow: newFlow(extra) }, more || {}));

  const PRESETS = {
    dashSmall: () => base({ view: 'dashboard', tab: 'dashboard' }),
    dashLarge: () => base({ view: 'dashboard', tab: 'dashboard', numbers: 'large' }),
    navMenu: () => base({ view: 'dashboard', tab: 'dashboard', menu: true }),
    navPacientes: () => base({ view: 'pacientes', tab: 'mas' }),
    recetas: () => base(),
    buscar: () => base({ sheets: [{ t: 'buscar' }] }),
    pacienteRx: () => base({ view: 'paciente', patientId: 41 }),
    f1: () => base({ taps: [{ id: 'nueva', n: 1 }] }),
    f2: () => flowAt({ step: 'buscar' }, { taps: [{ id: 'pac-41', n: 2, inside: true }] }),
    f2b: () => flowAt({ step: 'nuevo', np: { email: 'pedro.gil@correo.com', first: 'Pedro', last: 'Gil', phone: '320 555 0175', idType: 'Cédula Nacional', id: '1098765432', dob: '', address: '', city: 'Bogotá', state: 'Cundinamarca' } }),
    f3: () => flowAt({ step: 'meds', patientId: 41 }, { taps: [{ id: 'add-901', n: 3 }] }),
    f3b: () => flowAt({ step: 'meds', patientId: 41 }, { sheets: [{ t: 'producto', id: 901 }] }),
    f4: () => flowAt({ step: 'meds', patientId: 41, draft: { p: 901, q: 1, r: 0, type: 'Dosis fija', dose: '1 tableta', freq: 'cada 24 horas', dur: '30 días', sig: '' } },
      { sheets: [{ t: 'dosis' }], taps: [{ id: 'dose-0', n: 4 }, { id: 'freq-2', n: 5 }, { id: 'dur-3', n: 6 }, { id: 'agregar-receta', n: 7 }] }),
    heroDose: () => flowAt({ step: 'meds', patientId: 41, draft: { p: 901, q: 1, r: 0, type: 'Dosis fija', dose: '1 tableta', freq: 'cada 24 horas', dur: '30 días', sig: 'después de comer' } }, { sheets: [{ t: 'dosis' }] }),
    f4tipo: () => flowAt({ step: 'meds', patientId: 41, draft: { p: 901, q: 1, r: 0, type: 'Dosis fija', dose: '1 tableta', freq: '', dur: '', sig: '' } }, { sheets: [{ t: 'dosis' }, { t: 'tipo' }] }),
    f5: () => flowAt({ step: 'meds', patientId: 41, items: [clone(ITEM_901)] }, { taps: [{ id: 'continuar', n: 8 }] }),
    f6: () => flowAt({ step: 'final', patientId: 41, items: [clone(ITEM_901)] }, { taps: [{ id: 'crear', n: 9 }] }),
    f7: () => flowAt({ step: 'listo', patientId: 41, items: [clone(ITEM_901)], createdId: 59 }),
    todas: () => base({ view: 'todas' }),
    detalle: () => base({ view: 'detalle', rxId: 58 }),
    acciones: () => base({ view: 'detalle', rxId: 58, sheets: [{ t: 'acciones', id: 58 }] }),
    enlace: () => base({ view: 'detalle', rxId: 58, sheets: [{ t: 'enlace', id: 58 }] }),
    citas: () => base({ view: 'citas', tab: 'citas' }),
    pacientes: () => base({ view: 'pacientes', tab: 'mas' }),
    billetera: () => base({ view: 'billetera', tab: 'mas' }),
    perfil: () => base({ view: 'perfil', tab: 'mas' }),
  };

  function drawStill(host) {
    const make = PRESETS[host.dataset.p];
    if (!make) return;
    const st = make();
    const phone = mountPhone(host, host.dataset.s);
    phone.innerHTML = renderPhone(st);
    phone.setAttribute('aria-hidden', 'true');
    phone.querySelectorAll('input, textarea, button').forEach((el) => { el.tabIndex = -1; });
    (st.taps || []).forEach((t) => {
      const el = phone.querySelector(`[data-tid="${t.id}"]`);
      if (!el) return;
      el.classList.add('tap');
      if (t.inside) el.classList.add('tap-in');
      el.setAttribute('data-n', t.n);
    });
    fitRows(phone);
  }

  // ───────────────────────── Prototype ─────────────────────────
  const MAS_VIEWS = ['pacientes', 'billetera', 'perfil'];

  function startState() {
    return base({ view: 'dashboard', tab: 'dashboard', history: [], qB: '', qRx: '', qPacientes: '' });
  }

  function initPrototype(root) {
    const host = root.querySelector('[data-proto]');
    const phone = mountPhone(host);
    const out = {
      taps: root.querySelector('[data-out="taps"]'),
      time: root.querySelector('[data-out="time"]'),
      result: root.querySelector('[data-out="result"]'),
      hint: root.querySelector('[data-out="hint"]'),
    };
    let st = startState();
    let counting = false;
    let taps = 0;
    let t0 = 0;
    let timer = 0;
    let toastTimer = 0;
    let lastKey = '';
    let lastSheets = 0;
    let lastMenu = false;

    const viewKey = () => (st.view === 'flow' ? 'flow-' + st.flow.step : st.view + '-' + (st.rxId || '') + '-' + (st.patientId || ''));
    const fmtTime = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

    function updatePanel() {
      out.taps.textContent = String(taps);
      out.time.textContent = counting ? fmtTime(Date.now() - t0) : out.time.textContent;
      const hints = {
        dashboard: 'Toque «Recetas» en la barra de abajo, o abra «Más» para ver todas las secciones.',
        recetas: 'Toque «Nueva prescripción» para empezar a contar.',
        'flow-buscar': 'Elija a un paciente de la lista, o busque por nombre o cédula.',
        'flow-nuevo': 'Complete los datos del paciente, o use «Completar con datos de prueba».',
        'flow-meds': 'Toque «Agregar» en un medicamento.',
        'flow-final': 'Revise la receta y toque «Crear receta».',
        'flow-listo': 'Listo. Toque «Ver receta» o pruebe «Compartir enlace».',
        detalle: 'Toque ••• para ver el resto de acciones de la receta.',
      };
      const key = st.view === 'flow' ? 'flow-' + st.flow.step : st.view;
      let hint = hints[key] || 'Explore libremente. «Reiniciar» vuelve al principio.';
      if (st.view === 'flow' && st.flow.step === 'meds' && st.sheets.some((s) => s.t === 'dosis')) hint = 'Elija dosis, frecuencia y duración, y toque «Agregar a la receta».';
      if (st.view === 'flow' && st.flow.step === 'meds' && st.flow.items.length && !st.sheets.length) hint = 'Puede agregar otro medicamento o tocar «Continuar».';
      out.hint.textContent = hint;
      root.querySelector('[data-fill]').hidden = !(st.view === 'flow' && st.flow.step === 'nuevo');
      root.querySelectorAll('[data-numbers]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.numbers === st.numbers)));
    }

    function render() {
      const key = viewKey();
      const body = phone.querySelector('.m-view .m-body');
      const keep = body && key === lastKey ? body.scrollTop : 0;
      const topSheet = phone.querySelector('.m-sheet:last-of-type .m-sheet-scroll');
      const sheetKeep = topSheet && st.sheets.length === lastSheets ? topSheet.scrollTop : 0;
      phone.innerHTML = renderPhone(st, {
        enterView: key !== lastKey,
        enterSheet: st.sheets.length > lastSheets,
        enterMenu: st.menu && !lastMenu,
      });
      const nb = phone.querySelector('.m-view .m-body');
      if (nb) nb.scrollTop = keep;
      const ns = phone.querySelector('.m-sheet:last-of-type .m-sheet-scroll');
      if (ns && sheetKeep) ns.scrollTop = sheetKeep;
      lastKey = key;
      lastSheets = st.sheets.length;
      lastMenu = st.menu;
      fitRows(phone);
      updatePanel();
    }

    function toast(text) {
      st.toast = text;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { st.toast = ''; const el = phone.querySelector('.m-toast'); if (el) el.remove(); }, 2200);
    }

    function go(view, extra) {
      st.history.push({ view: st.view, tab: st.tab, rxId: st.rxId, patientId: st.patientId });
      Object.assign(st, { view, sheets: [], menu: false }, extra || {});
    }

    function root_(view) {
      st.history = [];
      st.view = view;
      st.tab = MAS_VIEWS.includes(view) ? 'mas' : view;
      st.sheets = [];
      st.menu = false;
    }

    function startCounting() {
      counting = true;
      taps = 0;
      t0 = Date.now();
      out.result.textContent = '';
      clearInterval(timer);
      timer = setInterval(() => { if (counting) out.time.textContent = fmtTime(Date.now() - t0); }, 500);
    }

    function stopCounting() {
      counting = false;
      clearInterval(timer);
      const ms = Date.now() - t0;
      out.time.textContent = fmtTime(ms);
      const secs = Math.max(1, Math.round(ms / 1000));
      const spent = secs < 60 ? `${secs} segundos` : `${Math.floor(secs / 60)} min ${secs % 60} s`;
      out.result.textContent = `Receta creada en ${taps} toques y ${spent}.`;
    }

    function topSheet() { return st.sheets[st.sheets.length - 1]; }
    function closeSheet() { st.sheets.pop(); }

    function startFlow(extra) {
      st.history.push({ view: st.view, tab: st.tab, rxId: st.rxId, patientId: st.patientId });
      st.view = 'flow';
      st.sheets = [];
      st.menu = false;
      st.flow = newFlow(extra);
    }

    function exitFlow() {
      const prev = st.history.pop() || { view: 'recetas', tab: 'recetas' };
      Object.assign(st, prev);
      st.flow = null;
      st.sheets = [];
      if (counting) { counting = false; clearInterval(timer); out.result.textContent = 'Receta descartada. Toque «Nueva prescripción» para empezar de nuevo.'; }
    }

    const ACTIONS = {
      tab(v) {
        if (v === 'mas') { st.menu = !st.menu; return; }
        root_(v);
      },
      ir(v) { root_(v); },
      'cerrar-menu'() { st.menu = false; },
      tema() { toggleTheme(); },
      aviso(v) { toast(v); },
      atras() {
        const prev = st.history.pop();
        if (prev) Object.assign(st, prev, { sheets: [] });
      },
      nueva() { startFlow(); startCounting(); },
      'nueva-para'(v, id) { startFlow({ patientId: id, step: 'meds' }); startCounting(); },
      buscar() { st.qB = ''; st.sheets.push({ t: 'buscar' }); },
      'ver-paciente'(v, id) { go('paciente', { patientId: id }); },
      todas() { go('todas'); },
      detalle(v, id) { go('detalle', { rxId: id }); },
      enviar(v, id) {
        const rx = rxOf(st, id);
        rx.status = 'sent';
        st.sheets = [];
        toast(`Receta enviada a ${fullName(patientOf(st, rx.pid))}`);
      },
      enlace(v, id) { st.sheets = [{ t: 'enlace', id }]; },
      acciones(v, id) { st.sheets = [{ t: 'acciones', id }]; },
      'crear-link'(v, id) { st.sheets = [{ t: 'enlace', id }]; },
      whatsapp(v, id) { const rx = rxOf(st, id); rx.status = 'sent'; st.sheets = []; toast('Receta enviada por WhatsApp'); },
      reenviar() { st.sheets = []; toast('Correo reenviado al paciente'); },
      'reenviar-wa'() { st.sheets = []; toast('WhatsApp reenviado al paciente'); },
      cancelar(v, id) { st.sheets = [{ t: 'cancelar', id }]; },
      'confirmar-cancelar'(v, id) { rxOf(st, id).status = 'cancelled'; st.sheets = []; toast('Receta cancelada'); },
      copiar() { closeSheet(); toast('Enlace copiado'); },
      compartir() { closeSheet(); toast('Se abre la hoja de compartir del teléfono'); },
      'cerrar-hoja'() { closeSheet(); },
      // Flow
      'cerrar-flujo'() {
        const f = st.flow;
        if (f.step === 'listo') { exitFlow(); return; }
        const dirty = f.patientId || f.items.length || Object.values(f.np).some((x) => x && x !== 'Cédula Nacional');
        if (dirty) st.sheets = [{ t: 'descartar' }]; else exitFlow();
      },
      'confirmar-descartar'() { exitFlow(); },
      'elegir-paciente'(v, id) { st.flow.patientId = id; st.flow.step = 'meds'; },
      'paciente-nuevo'() { st.flow.step = 'nuevo'; },
      'volver-buscar'() { st.flow.step = 'buscar'; },
      'cambiar-paciente'() { st.flow.step = 'buscar'; st.flow.patientId = null; },
      idtipo() { st.sheets.push({ t: 'idtipo' }); },
      'elegir-idtipo'(v) { st.flow.np.idType = v; closeSheet(); },
      fecha() { st.sheets.push({ t: 'fecha' }); },
      'listo-fecha'() { st.flow.np.dob = '12/03/1990'; delete st.flow.errors.dob; closeSheet(); },
      'continuar-nuevo'() {
        const np = st.flow.np;
        const e = {};
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(np.email.trim())) e.email = np.email.trim() ? 'Revisa el correo' : 'Escribe el correo';
        if (!np.first.trim()) e.first = 'Escribe el nombre';
        if (!np.last.trim()) e.last = 'Escribe el apellido';
        if (!np.phone.trim()) e.phone = 'Escribe el teléfono';
        if (!np.id.trim()) e.id = 'Escribe el número';
        if (!np.dob) e.dob = 'Elige la fecha';
        if (!np.address.trim()) e.address = 'Escribe la dirección';
        st.flow.errors = e;
        if (Object.keys(e).length) { toast('Faltan datos obligatorios'); return; }
        st.flow.patientId = 'new';
        st.flow.step = 'meds';
      },
      detalles(v, id) { st.sheets = [{ t: 'producto', id }]; },
      agregar(v, id) {
        st.flow.draft = { p: id, q: 1, r: 0, type: 'Dosis fija', dose: '', freq: '', dur: '', sig: '' };
        st.sheets = [{ t: 'dosis', edit: false }];
      },
      'editar-item'(v, id) {
        const item = st.flow.items.find((i) => i.p === id);
        st.flow.draft = clone(item);
        st.sheets = [{ t: 'dosis', edit: true }];
      },
      chip(v, id, f) {
        const d = st.flow.draft;
        d[f] = d[f] === v && f === 'sig' ? '' : v;
      },
      paso(v, id, f) {
        const d = st.flow.draft;
        const next = d[f] + Number(v);
        d[f] = f === 'q' ? Math.min(9, Math.max(1, next)) : Math.min(12, Math.max(0, next));
      },
      tipo() { st.sheets.push({ t: 'tipo' }); },
      'elegir-tipo'(v) { st.flow.draft.type = v; closeSheet(); },
      'agregar-receta'() {
        const d = st.flow.draft;
        if (!(d.dose && d.freq && d.dur)) return;
        const items = st.flow.items;
        const at = items.findIndex((i) => i.p === d.p);
        if (at >= 0) items[at] = clone(d); else items.push(clone(d));
        st.sheets = [];
        toast(at >= 0 ? 'Cambios guardados' : 'Agregado a la receta');
      },
      'quitar-item'(v, id) { st.flow.items = st.flow.items.filter((i) => i.p !== id); st.sheets = []; toast('Quitado de la receta'); },
      'ver-receta'() { st.sheets = [{ t: 'receta' }]; },
      analizar() { st.sheets.push({ t: 'ia' }); },
      filtro(v) { st.sheets = [{ t: 'filtro', v }]; },
      'elegir-filtro'(v, id, f) { if (f === 'cat') st.flow.cat = v || null; else st.flow.brand = v || null; closeSheet(); },
      'a-final'() { if (st.flow.items.length) st.flow.step = 'final'; },
      'editar-meds'() { st.flow.step = 'meds'; },
      doc(v, id) { st.flow.docs[id] = !st.flow.docs[id]; },
      'docs-todos'() { DOCS.forEach((d) => { st.flow.docs[d.id] = true; }); },
      'toggle-send'() { st.flow.send = !st.flow.send; },
      crear() {
        const f = st.flow;
        let pid = f.patientId;
        if (pid === 'new') {
          pid = Math.max(...st.db.patients.map((p) => p.id)) + 1;
          st.db.patients.unshift({ id: pid, first: f.np.first.trim(), last: f.np.last.trim(), cc: f.np.id.trim(), dob: '1990-03-12', phone: f.np.phone.trim(), email: f.np.email.trim(), address: f.np.address.trim(), city: f.np.city.trim(), allergies: '' });
          f.patientId = pid;
        }
        const id = st.db.nextId++;
        st.db.rx.unshift({ id, pid, status: f.send ? 'sent' : 'draft', date: '2026-10-14T09:41', items: clone(f.items) });
        st.db.created += 1;
        if (f.send) st.db.createdSent += 1;
        f.createdId = id;
        f.step = 'listo';
        if (counting) stopCounting();
      },
      'ver-creada'() {
        const id = st.flow.createdId;
        st.flow = null;
        st.history = [{ view: 'recetas', tab: 'recetas' }];
        Object.assign(st, { view: 'detalle', tab: 'recetas', rxId: id, sheets: [] });
      },
      'enlace-creada'() { st.sheets = [{ t: 'enlace', id: st.flow.createdId }]; },
      'volver-recetas'() { st.flow = null; root_('recetas'); },
    };

    phone.addEventListener('click', (event) => {
      const el = event.target.closest('[data-a]');
      if (!el || !phone.contains(el) || el.disabled) return;
      const action = ACTIONS[el.dataset.a];
      if (!action) return;
      if (counting || el.dataset.a === 'nueva' || el.dataset.a === 'nueva-para') taps += 1;
      const id = el.dataset.id === undefined ? undefined : (Number.isNaN(Number(el.dataset.id)) ? el.dataset.id : Number(el.dataset.id));
      action(el.dataset.v, id, el.dataset.f);
      // A new prescription restarts the counter, so its first tap counts as 1.
      if (el.dataset.a === 'nueva' || el.dataset.a === 'nueva-para') taps = 1;
      render();
    });

    phone.addEventListener('input', (event) => {
      const el = event.target.closest('[data-input]');
      if (!el) return;
      const key = el.dataset.input;
      const value = el.value;
      if (key.startsWith('np.')) {
        const field = key.slice(3);
        st.flow.np[field] = value;
        if (st.flow.errors[field]) {
          delete st.flow.errors[field];
          const wrap = el.closest('.m-field');
          if (wrap) { wrap.querySelector('.m-inp')?.classList.remove('bad'); wrap.querySelector('.m-err')?.remove(); }
        }
        return;
      }
      if (key === 'note') { st.flow.note = value; return; }
      if (key === 'flowQ') { st.flow.q = value; phone.querySelector('#flowlist').innerHTML = patientList(st, value, 'elegir-paciente', 'pac-'); return; }
      if (key === 'qB') { st.qB = value; phone.querySelector('#blist').innerHTML = patientList(st, value, 'ver-paciente', 'bp-'); return; }
      if (key === 'qPacientes') { st.qPacientes = value; phone.querySelector('#plist2').innerHTML = patientList(st, value, 'ver-paciente', 'pp-'); return; }
      if (key === 'qRx') { st.qRx = value; phone.querySelector('#rxlist').innerHTML = rxListHtml(st); return; }
      if (key === 'catQ') { st.flow.catQ = value; phone.querySelector('#catlist').innerHTML = catalogHtml(st); }
    });

    root.addEventListener('click', (event) => {
      const numbers = event.target.closest('[data-numbers]');
      if (numbers) { st.numbers = numbers.dataset.numbers; if (st.view !== 'dashboard') root_('dashboard'); render(); return; }
      if (event.target.closest('[data-reset]')) {
        clearInterval(timer);
        counting = false;
        taps = 0;
        st = startState();
        lastKey = '';
        out.time.textContent = '0:00';
        out.result.textContent = '';
        render();
        return;
      }
      if (event.target.closest('[data-fill]') && st.view === 'flow' && st.flow.step === 'nuevo') {
        Object.assign(st.flow.np, { email: 'pedro.gil@correo.com', first: 'Pedro', last: 'Gil', phone: '320 555 0175', id: '1098765432', dob: '12/03/1990', address: 'Carrera 15 # 88-64', city: 'Bogotá', state: 'Cundinamarca' });
        st.flow.errors = {};
        render();
      }
    });

    function fit() {
      const byHeight = (window.innerHeight - 48) / 874;
      const byWidth = (document.documentElement.clientWidth - 32) / 415;
      const s = Math.max(0.55, Math.min(1, byHeight, byWidth));
      host.style.setProperty('--s', s.toFixed(3));
    }
    window.addEventListener('resize', fit);
    fit();
    render();
  }

  function init() {
    initTheme();
    document.querySelectorAll('[data-p]').forEach(drawStill);
    const proto = document.querySelector('[data-prototype]');
    if (proto) initPrototype(proto);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

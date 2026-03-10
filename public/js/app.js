// AZEDOC — Main Application

(function(global) {
'use strict';

// ── Utilities ──────────────────────────────────────────────

function el(id) { return document.getElementById(id); }

function html(el, content) { el.innerHTML = content; }

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
         d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function news2Class(score) {
  if (score >= 7) return 'news2-high';
  return `news2-${Math.min(score, 5)}`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Toast ──────────────────────────────────────────────────

const Toast = {
  show(msg, type = 'info', duration = 4000) {
    const icons = {
      success: ICONS.check,
      critical: ICONS.warning,
      warning: ICONS.warning,
      info: ICONS.brain,
    };
    const container = el('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-msg">${escHtml(msg)}</span>
      <span class="toast-close">${ICONS.close}</span>
    `;
    t.querySelector('.toast-close').onclick = () => removeToast(t);
    container.appendChild(t);
    if (duration > 0) setTimeout(() => removeToast(t), duration);
  },
};

function removeToast(t) {
  t.classList.add('removing');
  setTimeout(() => t.remove(), 300);
}

// ── Modal ──────────────────────────────────────────────────

function showModal(title, body, actions = []) {
  const root = el('modal-root');
  const actionsHtml = actions.map((a, i) =>
    `<button class="btn ${a.cls || 'btn-secondary'}" data-idx="${i}">${escHtml(a.label)}</button>`
  ).join('');
  root.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal">
        <div class="modal-title">${escHtml(title)}</div>
        <div class="modal-body">${body}</div>
        <div class="modal-actions">
          ${actionsHtml}
          <button class="btn btn-ghost" id="modal-close">Close</button>
        </div>
      </div>
    </div>
  `;
  el('modal-close').onclick = closeModal;
  el('modal-overlay').onclick = e => { if (e.target === el('modal-overlay')) closeModal(); };
  actions.forEach((a, i) => {
    root.querySelector(`[data-idx="${i}"]`).onclick = () => { a.action(); closeModal(); };
  });
}

function closeModal() {
  el('modal-root').innerHTML = '';
}

// ── Router ─────────────────────────────────────────────────

const Router = {
  _current: null,
  _params: {},

  go(page, params = {}) {
    this._current = page;
    this._params = params;
    renderPage(page, params);
    updateNav(page);
  },

  param(k) { return this._params[k]; },
  current() { return this._current; },
};

// ── Sidebar ────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',    icon: 'dashboard' },
  { id: 'patients',   label: 'Patients',     icon: 'patients',  badge: () => PatientStore.getHighRisk().length || null },
  { id: 'scribe',     label: 'AI Scribe',    icon: 'scribe' },
  { id: 'assistant',  label: 'AI Assistant', icon: 'assistant' },
  { id: 'handover',   label: 'Handover',     icon: 'handover' },
  { id: 'analytics',  label: 'Analytics',    icon: 'analytics' },
];

function buildSidebar() {
  const nav = el('sidebar-nav');
  const footer = el('sidebar-footer');
  const s = ShiftState;

  nav.innerHTML = NAV_ITEMS.map(item => {
    const b = item.badge ? item.badge() : null;
    return `
      <div class="nav-item" data-page="${item.id}">
        <span class="nav-icon">${ICONS[item.icon] || ''}</span>
        <span class="nav-label">${item.label}</span>
        ${b ? `<span class="nav-badge">${b}</span>` : ''}
      </div>
    `;
  }).join('') + `
    <div class="nav-item" data-page="settings">
      <span class="nav-icon">${ICONS.settings}</span>
      <span class="nav-label">Settings</span>
    </div>
  `;

  footer.innerHTML = `
    <div class="doctor-chip">
      <div class="doctor-chip-avatar">${escHtml(s.doctor.initials)}</div>
      <div class="sidebar-footer-info">
        <div class="doctor-chip-name">${escHtml(s.doctor.name)}</div>
        <div class="doctor-chip-meta">${escHtml(s.doctor.specialty)} · ${escHtml(s.doctor.grade)}</div>
      </div>
    </div>
  `;

  nav.querySelectorAll('[data-page]').forEach(item => {
    item.addEventListener('click', () => Router.go(item.dataset.page));
  });

  // Toggle sidebar
  el('sidebar-toggle').addEventListener('click', toggleSidebar);
  el('tb-hamburger').addEventListener('click', toggleSidebar);
}

function toggleSidebar() {
  el('sidebar').classList.toggle('collapsed');
}

function updateNav(page) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
}

// ── Topbar ─────────────────────────────────────────────────

function initTopbar() {
  function tick() {
    const now = new Date();
    const t = el('tb-time');
    if (t) t.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  tick();
  setInterval(tick, 10000);

  el('search-input').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    if (Router.current() !== 'patients') Router.go('patients');
    App._searchQuery = q;
    renderPatientsList(q);
  });

  el('search-input').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.target.value = ''; App._searchQuery = ''; renderPatientsList(''); }
  });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      el('search-input').focus();
    }
  });

  el('tb-notif').addEventListener('click', () => showAlertsModal());
}

function showAlertsModal() {
  const critical = PatientStore.getHighRisk();
  const items = critical.map(p =>
    `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">
      <strong style="color:#f9fafb">${escHtml(p.name)}</strong>
      <span style="color:#6b7280;font-size:12px;margin-left:8px">Bed ${p.bed}</span>
      <div style="font-size:12.5px;color:#9ca3af;margin-top:2px">${escHtml(p.diagnosis)}</div>
      <div style="font-size:11.5px;color:#ef4444;margin-top:2px">NEWS2: ${p.news2Score} · ${p.riskLevel.toUpperCase()}</div>
    </div>`
  ).join('');
  showModal('Active Alerts', items || '<p style="color:#6b7280">No active critical alerts.</p>');
}

// ── Page: Dashboard ────────────────────────────────────────

function renderDashboard() {
  const stats = PatientStore.getShiftStats();
  const progress = PatientStore.getShiftProgress();
  const s = ShiftState;
  const patients = PatientStore.getAll();
  const criticalHigh = patients.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');
  const stable = patients.filter(p => p.riskLevel === 'stable' || p.riskLevel === 'low');

  html(el('page-content'), `
    <div class="shift-hero">
      <div class="shift-hero-top">
        <div>
          <div class="shift-greeting">Good ${greeting()}, ${escHtml(s.doctor.name.split(' ')[1])}</div>
          <div class="shift-date">${escHtml(s.date)} · ${escHtml(s.ward)}</div>
          <div class="shift-progress-wrap" style="margin-top:14px">
            <div class="shift-progress-bar">
              <div class="shift-progress-fill" id="shift-fill" style="width:${progress}%"></div>
            </div>
            <span class="shift-progress-label">${progress}% through shift</span>
          </div>
        </div>
        <div id="api-status-badge"></div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat accent-stat">
          <div class="hero-stat-val">${stats.total}</div>
          <div class="hero-stat-lbl">Total Patients</div>
        </div>
        <div class="hero-stat critical-stat">
          <div class="hero-stat-val">${stats.critical + stats.high}</div>
          <div class="hero-stat-lbl">High Risk</div>
        </div>
        <div class="hero-stat warn-stat">
          <div class="hero-stat-val">${stats.pendingActions}</div>
          <div class="hero-stat-lbl">Pending Actions</div>
        </div>
        <div class="hero-stat stable-stat">
          <div class="hero-stat-val">${stats.stable}</div>
          <div class="hero-stat-lbl">Stable</div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div class="card card-pad">
        <div class="chart-wrap-title">Risk Distribution</div>
        <div style="position:relative;height:200px"><canvas id="ward-risk-chart"></canvas></div>
      </div>
      <div class="card card-pad">
        <div class="chart-wrap-title">NEWS2 Score Distribution</div>
        <div style="position:relative;height:200px"><canvas id="news2-bar-chart"></canvas></div>
      </div>
    </div>

    ${criticalHigh.length ? `
    <div class="section-header">
      <span class="section-title critical">${ICONS.warning} Priority Patients</span>
      <span class="section-count">${criticalHigh.length}</span>
      <div class="section-line"></div>
      <button class="btn btn-ghost btn-sm" onclick="Router.go('patients')">View all</button>
    </div>
    <div class="patients-grid" style="margin-bottom:20px">
      ${criticalHigh.map(p => patientCardHtml(p)).join('')}
    </div>
    ` : ''}

    ${stable.length ? `
    <div class="section-header">
      <span class="section-title stable">Stable Patients</span>
      <span class="section-count">${stable.length}</span>
      <div class="section-line"></div>
    </div>
    <div class="patients-grid">
      ${stable.map(p => patientCardHtml(p)).join('')}
    </div>
    ` : ''}
  `);

  // Charts
  setTimeout(() => {
    const rc = document.getElementById('ward-risk-chart');
    const bc = document.getElementById('news2-bar-chart');
    if (rc) Charts.wardRisk(rc, stats);
    if (bc) Charts.news2Bar(bc, patients);
  }, 50);

  // API status
  updateApiStatusBadge();

  // Patient card clicks
  bindPatientCardClicks();
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function updateApiStatusBadge() {
  const badge = document.getElementById('api-status-badge');
  if (!badge) return;
  const isDemo = API.isDemo();
  badge.innerHTML = `
    <div class="ai-badge">
      <span class="ai-badge-dot"></span>
      ${isDemo ? 'Demo Mode — No API Key' : 'AXIOM AI Connected'}
    </div>
  `;
}

// ── Patient Card ───────────────────────────────────────────

function patientCardHtml(p) {
  const v = p.vitals.current;
  const pending = p.pendingActions?.length || 0;
  return `
    <div class="patient-card risk-${p.riskLevel}" data-patient-id="${p.id}">
      <div class="patient-card-header">
        <div>
          <div class="patient-name">${escHtml(p.name)}</div>
          <div class="patient-meta">${p.age}y ${p.gender} · ${p.bed}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
          <span class="news2-badge ${news2Class(p.news2Score)}">NEWS2 ${p.news2Score}</span>
          <span class="patient-bed">${escHtml(p.bed)}</span>
        </div>
      </div>
      <div class="patient-diagnosis">${escHtml(p.diagnosis)}</div>
      <div class="patient-vitals-mini">
        <div class="vital-mini ${v.hr > 100 || v.hr < 50 ? 'abnormal' : ''}">
          <div class="vital-mini-val">${v.hr}</div>
          <div class="vital-mini-lbl">HR</div>
        </div>
        <div class="vital-mini ${v.bp_sys < 100 ? 'critical' : v.bp_sys < 110 ? 'abnormal' : ''}">
          <div class="vital-mini-val">${v.bp_sys}/${v.bp_dia}</div>
          <div class="vital-mini-lbl">BP</div>
        </div>
        <div class="vital-mini ${v.spo2 < 92 ? 'critical' : v.spo2 < 95 ? 'abnormal' : ''}">
          <div class="vital-mini-val">${v.spo2}%</div>
          <div class="vital-mini-lbl">SpO2</div>
        </div>
        <div class="vital-mini ${v.temp > 38 ? 'abnormal' : v.temp > 39 ? 'critical' : ''}">
          <div class="vital-mini-val">${v.temp}°</div>
          <div class="vital-mini-lbl">Temp</div>
        </div>
        <div class="vital-mini ${v.rr > 20 ? 'abnormal' : v.rr > 24 ? 'critical' : ''}">
          <div class="vital-mini-val">${v.rr}</div>
          <div class="vital-mini-lbl">RR</div>
        </div>
      </div>
      <div class="patient-card-footer">
        <span class="last-seen">Seen ${timeAgo(p.lastSeen)}</span>
        ${pending ? `<span class="pending-badge">${ICONS.warning} ${pending} pending</span>` : ''}
        <span class="risk-badge ${p.riskLevel}"><span class="risk-dot ${p.riskLevel === 'critical' ? 'pulse' : ''}"></span>${p.riskLevel}</span>
      </div>
    </div>
  `;
}

function bindPatientCardClicks() {
  document.querySelectorAll('[data-patient-id]').forEach(card => {
    card.addEventListener('click', () => Router.go('patient-detail', { id: card.dataset.patientId }));
  });
}

// ── Page: Patients ─────────────────────────────────────────

function renderPatients() {
  html(el('page-content'), `
    <div class="page-header">
      <div class="page-title">Patient List</div>
      <div class="page-subtitle">${ShiftState.ward} · ${PatientStore.getAll().length} patients</div>
    </div>
    <div class="filter-bar" id="filter-bar">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="critical">Critical</button>
      <button class="filter-btn" data-filter="high">High Risk</button>
      <button class="filter-btn" data-filter="stable">Stable</button>
    </div>
    <div class="patients-grid" id="patients-grid"></div>
  `);

  renderPatientsList(App._searchQuery || '');

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      App._filterActive = btn.dataset.filter;
      renderPatientsList(App._searchQuery || '');
    });
  });
}

function renderPatientsList(q = '') {
  const grid = el('patients-grid');
  if (!grid) return;
  let patients = PatientStore.getAll();

  const filter = App._filterActive || 'all';
  if (filter !== 'all') {
    if (filter === 'critical') patients = patients.filter(p => p.riskLevel === 'critical');
    else if (filter === 'high') patients = patients.filter(p => p.riskLevel === 'high');
    else if (filter === 'stable') patients = patients.filter(p => p.riskLevel === 'stable' || p.riskLevel === 'low');
  }

  if (q) {
    patients = patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.diagnosis.toLowerCase().includes(q) ||
      p.bed.toLowerCase().includes(q) ||
      (p.diagnosisSecondary || []).some(d => d.toLowerCase().includes(q))
    );
  }

  if (!patients.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No patients found</div></div>`;
    return;
  }

  grid.innerHTML = patients.map(p => patientCardHtml(p)).join('');
  bindPatientCardClicks();
}

// ── Page: Patient Detail ───────────────────────────────────

function renderPatientDetail(id) {
  const p = PatientStore.getById(id);
  if (!p) { Router.go('patients'); return; }

  const tabs = ['Overview', 'Vitals', 'Labs', 'Medications', 'Timeline', 'Notes', 'AI Insights'];

  html(el('page-content'), `
    <div class="back-btn" id="back-btn">${ICONS.chevronLeft} Back to patients</div>

    <div class="patient-detail-header">
      <div class="patient-detail-avatar">${p.name.split(' ').map(n => n[0]).join('')}</div>
      <div class="patient-detail-info">
        <div class="patient-detail-name">${escHtml(p.name)}</div>
        <div class="patient-detail-meta">
          <span class="detail-chip">${p.age}y ${p.gender}</span>
          <span class="detail-chip">DOB: ${p.dob}</span>
          <span class="detail-chip">Bed ${p.bed}</span>
          <span class="detail-chip">Admitted: ${fmtDateTime(p.admissionDate)}</span>
          <span class="detail-chip">${escHtml(p.consultant)}</span>
          ${p.allergies?.length ? `<span class="detail-chip" style="color:#ef4444;border-color:rgba(239,68,68,.3)">⚠ ${p.allergies.map(a => a.allergen).join(', ')}</span>` : ''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <span class="news2-badge ${news2Class(p.news2Score)}" style="font-size:14px;padding:5px 12px">NEWS2 ${p.news2Score}</span>
        <span class="risk-badge ${p.riskLevel}"><span class="risk-dot ${p.riskLevel === 'critical' ? 'pulse' : ''}"></span>${p.riskLevel.toUpperCase()}</span>
      </div>
    </div>

    <div style="margin-bottom:16px;padding:14px 18px;background:rgba(0,212,255,.04);border:1px solid rgba(0,212,255,.12);border-radius:10px">
      <div style="font-size:15px;font-weight:700;color:#f9fafb;margin-bottom:4px">${escHtml(p.diagnosis)}</div>
      ${p.diagnosisSecondary?.length ? `<div style="font-size:13px;color:#6b7280">${p.diagnosisSecondary.map(d => escHtml(d)).join(' · ')}</div>` : ''}
      <div style="font-size:12px;color:#4b5563;margin-top:4px">${escHtml(p.admissionReason)}</div>
    </div>

    <div class="tabs" id="detail-tabs">
      ${tabs.map((t, i) => `<div class="tab ${i === 0 ? 'active' : ''}" data-tab="${i}">${t}</div>`).join('')}
    </div>
    <div id="tab-content"></div>
  `);

  el('back-btn').onclick = () => Router.go('patients');

  const tabRenderers = [
    () => renderDetailOverview(p),
    () => renderDetailVitals(p),
    () => renderDetailLabs(p),
    () => renderDetailMeds(p),
    () => renderDetailTimeline(p),
    () => renderDetailNotes(p),
    () => renderDetailInsights(p),
  ];

  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      tabRenderers[+tab.dataset.tab]();
    });
  });

  tabRenderers[0]();
}

function renderDetailOverview(p) {
  const v = p.vitals.current;
  const pending = p.pendingActions || [];
  html(el('tab-content'), `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <div class="vitals-grid" style="margin-bottom:16px">
          ${vitalBox('❤️', v.hr, 'bpm', 'Heart Rate', v.hr > 100 || v.hr < 50 ? (v.hr > 130 ? 'critical' : 'abnormal') : '')}
          ${vitalBox('🩸', `${v.bp_sys}/${v.bp_dia}`, 'mmHg', 'Blood Pressure', v.bp_sys < 100 ? 'critical' : v.bp_sys < 110 ? 'abnormal' : '')}
          ${vitalBox('💧', `${v.spo2}%`, '', 'SpO2', v.spo2 < 92 ? 'critical' : v.spo2 < 95 ? 'abnormal' : '')}
          ${vitalBox('🌡️', `${v.temp}°C`, '', 'Temperature', v.temp > 39 ? 'critical' : v.temp > 38 ? 'abnormal' : '')}
          ${vitalBox('🌬️', v.rr, '/min', 'Resp Rate', v.rr > 24 ? 'critical' : v.rr > 20 ? 'abnormal' : '')}
        </div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:#f9fafb;margin-bottom:10px">Pending Actions</div>
        ${pending.length ? pending.map(a => `
          <div style="display:flex;gap:10px;padding:10px 12px;background:${a.priority === 'urgent' ? 'rgba(239,68,68,.06)' : 'var(--bg-e)'};border:1px solid ${a.priority === 'urgent' ? 'rgba(239,68,68,.2)' : 'rgba(255,255,255,.06)'};border-radius:8px;margin-bottom:8px">
            <div style="flex:1">
              <div style="font-size:13px;color:#f9fafb">${escHtml(a.action)}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:2px">Due: ${escHtml(String(a.due))}</div>
            </div>
            <span style="font-size:10.5px;font-weight:600;color:${a.priority === 'urgent' ? '#ef4444' : '#f59e0b'};background:${a.priority === 'urgent' ? 'rgba(239,68,68,.12)' : 'rgba(245,158,11,.12)'};padding:2px 8px;border-radius:4px;height:fit-content;white-space:nowrap">${a.priority.toUpperCase()}</span>
          </div>
        `).join('') : '<div style="color:#4b5563;font-size:13px">No pending actions</div>'}
      </div>
    </div>
  `);
}

function vitalBox(icon, value, unit, label, status = '') {
  return `
    <div class="vital-box ${status}">
      <div class="vital-icon">${icon}</div>
      <div class="vital-value ${status === 'abnormal' ? 'warn' : status === 'critical' ? 'crit' : ''}">${value}</div>
      ${unit ? `<div class="vital-unit">${unit}</div>` : ''}
      <div class="vital-label">${label}</div>
    </div>
  `;
}

function renderDetailVitals(p) {
  html(el('tab-content'), `
    <div class="chart-wrap">
      <div class="chart-wrap-title">Heart Rate (bpm)</div>
      <div class="chart-canvas-wrap"><canvas id="c-hr"></canvas></div>
    </div>
    <div class="chart-wrap">
      <div class="chart-wrap-title">Blood Pressure (mmHg)</div>
      <div class="chart-canvas-wrap"><canvas id="c-bp"></canvas></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="chart-wrap">
        <div class="chart-wrap-title">SpO2 (%)</div>
        <div class="chart-canvas-wrap"><canvas id="c-spo2"></canvas></div>
      </div>
      <div class="chart-wrap">
        <div class="chart-wrap-title">Temperature (°C)</div>
        <div class="chart-canvas-wrap"><canvas id="c-temp"></canvas></div>
      </div>
    </div>
    <div class="chart-wrap">
      <div class="chart-wrap-title">Respiratory Rate (/min)</div>
      <div class="chart-canvas-wrap"><canvas id="c-rr"></canvas></div>
    </div>
  `);
  setTimeout(() => {
    Charts.vitalsHR(document.getElementById('c-hr'), p);
    Charts.vitalsBP(document.getElementById('c-bp'), p);
    Charts.vitalsSpO2(document.getElementById('c-spo2'), p);
    Charts.vitalsTemp(document.getElementById('c-temp'), p);
    Charts.vitalsRR(document.getElementById('c-rr'), p);
  }, 50);
}

function renderDetailLabs(p) {
  const labs = p.labs || [];
  const statusStyle = { critical: 'lab-critical', high: 'lab-high', low: 'lab-low', normal: 'lab-normal' };
  html(el('tab-content'), `
    <div class="card">
      <table class="data-table">
        <thead>
          <tr><th>Test</th><th>Result</th><th>Unit</th><th>Reference</th><th>Status</th><th>Time</th></tr>
        </thead>
        <tbody>
          ${labs.map(l => `
            <tr>
              <td style="font-weight:500;color:#f9fafb">${escHtml(l.test)}</td>
              <td class="${statusStyle[l.status] || ''}" style="font-family:'JetBrains Mono',monospace;font-weight:${l.status === 'critical' ? '700' : '400'}">${escHtml(String(l.value))}</td>
              <td style="color:#6b7280">${escHtml(l.unit)}</td>
              <td style="color:#4b5563">${escHtml(l.ref)}</td>
              <td><span style="font-size:11px;font-weight:600;color:${l.status === 'critical' ? '#ef4444' : l.status === 'high' ? '#f97316' : l.status === 'low' ? '#3b82f6' : '#10b981'}">${l.status.toUpperCase()}</span></td>
              <td style="color:#4b5563;font-size:12px">${fmtDateTime(l.time)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `);
}

function renderDetailMeds(p) {
  const meds = p.medications || [];
  html(el('tab-content'), `
    <div class="card">
      <table class="data-table">
        <thead><tr><th>Drug</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Prescribed By</th></tr></thead>
        <tbody>
          ${meds.map(m => `
            <tr>
              <td style="font-weight:600;color:#f9fafb">${escHtml(m.name)}</td>
              <td style="font-family:'JetBrains Mono',monospace">${escHtml(m.dose)}</td>
              <td><span style="font-size:11.5px;background:rgba(0,212,255,.1);color:#00d4ff;border-radius:4px;padding:2px 7px">${escHtml(m.route)}</span></td>
              <td style="color:#d1d5db">${escHtml(m.frequency)}</td>
              <td style="color:#6b7280;font-size:12px">${escHtml(m.prescribed_by)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ${p.allergies?.length ? `
      <div style="margin-top:12px;padding:12px 16px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:10px">
        <div style="font-size:12px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">⚠ Allergies</div>
        ${p.allergies.map(a => `<div style="font-size:13px;color:#f9fafb">${escHtml(a.allergen)} <span style="color:#6b7280">— ${escHtml(a.reaction)} (${escHtml(a.severity)})</span></div>`).join('')}
      </div>
    ` : ''}
  `);
}

function renderDetailTimeline(p) {
  const events = p.timeline || [];
  html(el('tab-content'), `
    <div class="timeline">
      ${events.map(e => `
        <div class="timeline-item">
          <div class="timeline-dot ${e.severity}">
            ${e.severity === 'critical' ? '🚨' : e.severity === 'warn' ? '⚠️' : '✓'}
          </div>
          <div class="timeline-content">
            <div class="timeline-event">${escHtml(e.event)}</div>
            <div class="timeline-time">${fmtDateTime(e.time)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `);
}

function renderDetailNotes(p) {
  const notes = p.notes || [];
  html(el('tab-content'), `
    <div style="margin-bottom:16px">
      <button class="btn btn-primary btn-sm" id="add-note-btn">+ Add Note</button>
    </div>
    ${notes.map(n => `
      <div class="note-card">
        <div class="note-header">
          <span class="note-type">${escHtml(n.type)}</span>
          <span class="note-author">${escHtml(n.author)}</span>
          <span class="note-time">${fmtDateTime(n.time)}</span>
        </div>
        <div class="note-content">${escHtml(n.content)}</div>
      </div>
    `).join('')}
  `);

  el('add-note-btn').onclick = () => {
    showModal('Add Clinical Note',
      `<div>
        <div style="margin-bottom:8px">
          <label style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.3px">Note Type</label>
          <select class="form-select" id="note-type-sel" style="width:100%;margin-top:4px">
            <option>Ward Round</option><option>Progress Note</option><option>Procedure</option><option>Referral</option><option>Nursing</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.3px">Note</label>
          <textarea class="form-input" id="note-text" style="width:100%;min-height:120px;margin-top:4px;resize:vertical" placeholder="Enter clinical note..."></textarea>
        </div>
      </div>`,
      [{
        label: 'Save Note',
        cls: 'btn-primary',
        action: () => {
          const type = document.getElementById('note-type-sel')?.value || 'Note';
          const content = document.getElementById('note-text')?.value?.trim();
          if (!content) return;
          PatientStore.addNote(p.id, {
            time: new Date().toISOString(),
            author: ShiftState.doctor.name,
            type,
            content,
          });
          Toast.show('Note saved', 'success');
          renderDetailNotes(p);
        },
      }]
    );
  };
}

function renderDetailInsights(p) {
  const insights = p.patternInsights || [];
  html(el('tab-content'), `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <div class="ai-badge"><span class="ai-badge-dot"></span> AXIOM Analysis</div>
      ${API.isDemo() ? '<span style="font-size:12px;color:#6b7280">Demo mode — connect API key for live AI insights</span>' : ''}
    </div>
    ${insights.length ? insights.map(ins => `
      <div class="insight-card" style="margin-bottom:12px">
        <div class="insight-title">${escHtml(ins.insight)}</div>
        <div class="insight-source" style="margin-bottom:8px">Based on: ${escHtml(ins.based_on)}</div>
        <div class="confidence-bar-wrap">
          <div class="confidence-bar"><div class="confidence-fill" style="width:${ins.confidence}%"></div></div>
          <span class="confidence-label">${ins.confidence}%</span>
        </div>
      </div>
    `).join('') : '<div style="color:#4b5563;font-size:13px">No AI insights available.</div>'}

    <div style="margin-top:20px;border-top:1px solid rgba(255,255,255,.06);padding-top:16px">
      <div style="font-size:13px;font-weight:600;color:#f9fafb;margin-bottom:10px">Ask AXIOM about this patient</div>
      <div style="display:flex;gap:8px">
        <textarea class="form-input" id="insight-query" style="flex:1;min-height:60px;resize:none" placeholder="e.g. What's the most likely cause of rising lactate?"></textarea>
        <button class="btn btn-primary" id="insight-ask-btn" style="align-self:flex-end">Ask</button>
      </div>
      <div id="insight-response" style="margin-top:12px"></div>
    </div>
  `);

  el('insight-ask-btn').onclick = async () => {
    const q = el('insight-query').value.trim();
    if (!q) return;
    const resp = el('insight-response');
    resp.innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:#6b7280"><div class="spinner"></div> AXIOM is thinking...</div>`;
    const patientCtx = {
      name: p.name, age: p.age, diagnosis: p.diagnosis,
      vitals: p.vitals.current, labs: p.labs, news2: p.news2Score,
    };
    const result = await API.chat([{ role: 'user', content: q }], patientCtx);
    if (result.ok) {
      resp.innerHTML = `<div style="background:rgba(0,212,255,.04);border:1px solid rgba(0,212,255,.12);border-radius:10px;padding:14px;font-size:13.5px;color:#d1d5db;line-height:1.7;white-space:pre-wrap">${escHtml(result.data.response)}</div>`;
    } else {
      const errMsg = result.error === 'RATE_LIMIT_EXCEEDED' ? 'Rate limit exceeded. Please try again later.' :
                     result.error === 'AUTHENTICATION_FAILED' ? 'Authentication failed. Please refresh.' :
                     result.error || 'Error querying AXIOM';
      resp.innerHTML = `<div style="color:#ef4444;font-size:13px">⚠ ${escHtml(errMsg)}</div>`;
      Toast.show(errMsg, 'warning', 5000);
    }
  };
}

// ── Page: AI Scribe ────────────────────────────────────────

function renderScribe() {
  html(el('page-content'), `
    <div class="page-header">
      <div class="page-title">AI Scribe</div>
      <div class="page-subtitle">Convert consultation recordings into structured SOAP notes</div>
    </div>
    <div class="scribe-layout">
      <div class="scribe-panel">
        <div class="scribe-panel-header">
          <span style="font-size:16px">🎙️</span>
          <span class="scribe-panel-title">Consultation Recording</span>
        </div>
        <div class="scribe-panel-body">
          <div class="record-section">
            <div class="form-row" style="justify-content:center;gap:16px;margin-bottom:16px">
              <div>
                <div class="form-label">Patient</div>
                <select class="form-select" id="scribe-patient" style="min-width:180px">
                  <option value="">Select patient...</option>
                  ${PatientStore.getAll().map(p => `<option value="${p.id}">${escHtml(p.name)} (${p.bed})</option>`).join('')}
                </select>
              </div>
              <div>
                <div class="form-label">Specialty</div>
                <select class="form-select" id="scribe-specialty">
                  <option>General Medicine</option>
                  <option>Respiratory</option>
                  <option>Cardiology</option>
                  <option>Gastroenterology</option>
                  <option>Neurology</option>
                  <option>Acute Medicine</option>
                </select>
              </div>
            </div>
            <div class="record-btn-wrap" style="margin-bottom:16px">
              <button class="record-btn" id="record-btn">${ICONS.mic}</button>
              <div class="record-ripple"></div>
              <div class="record-ripple"></div>
            </div>
            <div class="record-status" id="record-status">Tap to record</div>
            <div class="record-timer" id="record-timer">0:00</div>
          </div>
          <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Transcript</div>
          <div class="transcript-area" id="transcript-area" contenteditable="true" style="outline:none" data-placeholder="Recording transcript will appear here, or type/paste a consultation transcript..."></div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn btn-primary" id="generate-note-btn" style="flex:1">Generate SOAP Note</button>
            <button class="btn btn-ghost" id="clear-scribe-btn">Clear</button>
          </div>
        </div>
      </div>

      <div class="scribe-panel">
        <div class="scribe-panel-header">
          <div class="ai-badge"><span class="ai-badge-dot"></span>AXIOM</div>
          <span class="scribe-panel-title">SOAP Note Output</span>
          <div style="margin-left:auto;display:flex;gap:6px">
            <button class="btn-icon btn-sm" id="copy-note-btn" title="Copy">${ICONS.copy}</button>
            <button class="btn-icon btn-sm" id="print-note-btn" title="Print">${ICONS.print}</button>
          </div>
        </div>
        <div class="scribe-panel-body">
          <div id="safety-flags-container"></div>
          <div id="note-output" class="note-output">
            <div style="color:#4b5563;font-size:13px;text-align:center;padding:40px 0">Generated note will appear here</div>
          </div>
        </div>
      </div>
    </div>
  `);

  let recording = false;
  let recInterval = null;
  let recSeconds = 0;
  const recBtn = el('record-btn');
  const status = el('record-status');
  const timer = el('record-timer');

  // Voice Recording with Web Speech API - ENHANCED
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let finalTranscript = '';
  let transcriptionSupported = !!SpeechRecognition;

  function initializeRecognition() {
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.language = 'en-US';

    rec.onstart = () => {
      status.textContent = '🎙️ Listening... Speak clearly';
      Toast.show('🎙️ Microphone ACTIVE - Speak your clinical consultation', 'success', 2000);
    };

    rec.onresult = (event) => {
      let interimTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();

        if (event.results[i].isFinal) {
          // Final result - add to transcript
          if (transcript) {
            finalTranscript += transcript + ' ';
          }
        } else {
          // Interim result - show live
          interimTranscript += transcript;
        }
      }

      // Update display with final + interim
      const displayText = (finalTranscript + interimTranscript).trim();
      el('transcript-area').textContent = displayText;

      // Auto-scroll to bottom
      el('transcript-area').scrollTop = el('transcript-area').scrollHeight;
    };

    rec.onerror = (event) => {
      console.log('Speech recognition error:', event.error);

      if (event.error === 'network') {
        Toast.show('⚠️ Network error - Continue speaking, will retry automatically', 'warning', 2000);
      } else if (event.error === 'not-allowed') {
        Toast.show('❌ Microphone permission denied - Paste transcript manually', 'critical', 3000);
        recording = false;
        recBtn.classList.remove('recording');
      } else if (event.error !== 'no-speech' && event.error !== 'audio-capture') {
        // Ignore no-speech and audio-capture errors
        if (recording && event.error !== 'aborted') {
          Toast.show(`⚠️ ${event.error} - Continue speaking...`, 'info', 1000);
        }
      }
    };

    rec.onend = () => {
      // Auto-restart if still recording
      if (recording && rec) {
        try {
          rec.start();
        } catch (e) {
          console.log('Could not restart recognition:', e);
        }
      }
    };

    return rec;
  }

  recBtn.onclick = async () => {
    if (recording) {
      // Stop recording
      recording = false;
      clearInterval(recInterval);
      recBtn.classList.remove('recording');
      timer.classList.remove('active');

      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          console.log('Error stopping recognition:', e);
        }
      }

      status.textContent = '✓ Recording complete';
      Toast.show('✅ Recording stopped. Review and generate SOAP note.', 'success');
    } else {
      // Start recording
      if (!transcriptionSupported) {
        Toast.show('💡 Voice transcription not supported in your browser. Paste transcript manually.', 'info');
        return;
      }

      recording = true;
      finalTranscript = '';  // Reset transcript
      recBtn.classList.add('recording');
      status.textContent = '🎙️ Recording...';
      timer.classList.add('active');
      recSeconds = 0;

      // Start timer
      recInterval = setInterval(() => {
        recSeconds++;
        const m = Math.floor(recSeconds / 60);
        const s = recSeconds % 60;
        timer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      }, 1000);

      // Initialize and start speech recognition
      try {
        recognition = initializeRecognition();
        if (recognition) {
          recognition.start();
        } else {
          Toast.show('💡 Microphone unavailable. Paste transcript manually.', 'info');
          recording = false;
          recBtn.classList.remove('recording');
        }
      } catch (e) {
        console.error('Error starting recognition:', e);
        Toast.show('❌ Could not access microphone. Paste transcript manually.', 'warning');
        recording = false;
        recBtn.classList.remove('recording');
      }
    }
  };

  el('generate-note-btn').onclick = async () => {
    const transcript = el('transcript-area').textContent.trim();
    if (!transcript) {
      Toast.show('Please enter a consultation transcript first', 'warning');
      return;
    }
    const patientId = el('scribe-patient').value;
    const patient = patientId ? PatientStore.getById(patientId) : null;
    const specialty = el('scribe-specialty').value;

    el('note-output').innerHTML = `<div style="display:flex;align-items:center;gap:10px;color:#6b7280"><div class="spinner-lg spinner"></div><span>AXIOM is generating SOAP note...</span></div>`;
    el('safety-flags-container').innerHTML = '';

    const result = await API.scribe(transcript, patient?.name || 'Unknown', specialty);
    if (result.ok) {
      const { note, safety_flags, suggested_codes } = result.data;
      if (safety_flags?.length) {
        el('safety-flags-container').innerHTML = safety_flags.map(f => `
          <div class="note-safety">${ICONS.warning}<span>${escHtml(f)}</span></div>
        `).join('');
      }
      // Format SOAP sections
      const formatted = note
        .replace(/^(SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN|SUGGESTED CODES):/gm, '<div class="soap-head">$1</div>')
        .replace(/\n/g, '<br>');
      el('note-output').innerHTML = formatted;
      if (suggested_codes) {
        el('note-output').innerHTML += `<div style="margin-top:12px;padding:10px 14px;background:rgba(0,212,255,.05);border:1px solid rgba(0,212,255,.1);border-radius:8px;font-size:12px;color:#6b7280"><strong style="color:#00d4ff">Suggested ICD-10 Codes:</strong> ${escHtml(suggested_codes)}</div>`;
      }
      Toast.show('SOAP note generated', 'success');
    } else {
      if (API.isDemo()) {
        el('note-output').innerHTML = demoSoapNote(transcript);
        Toast.show('Demo mode: showing example SOAP note', 'info');
      } else {
        el('note-output').innerHTML = `<div style="color:#ef4444">Error: ${escHtml(result.error)}</div>`;
      }
    }
  };

  el('clear-scribe-btn').onclick = () => {
    el('transcript-area').textContent = '';
    el('note-output').innerHTML = '<div style="color:#4b5563;font-size:13px;text-align:center;padding:40px 0">Generated note will appear here</div>';
    el('safety-flags-container').innerHTML = '';
  };

  el('copy-note-btn').onclick = () => {
    navigator.clipboard.writeText(el('note-output').innerText).then(() => Toast.show('Note copied to clipboard', 'success'));
  };

  el('print-note-btn').onclick = () => window.print();
}

function demoSoapNote(transcript) {
  return `<div class="soap-head">SUBJECTIVE</div>
Patient presents with symptoms as described in transcript. History taken as documented.<br><br>
<div class="soap-head">OBJECTIVE</div>
Vital signs as per chart. Examination findings documented.<br><br>
<div class="soap-head">ASSESSMENT</div>
Clinical impression based on presenting complaint and findings.<br><br>
<div class="soap-head">PLAN</div>
1. Investigations as clinically indicated<br>
2. Treatment as per guidelines<br>
3. Senior review if deterioration<br>
4. Follow-up arranged<br><br>
<div style="margin-top:8px;padding:8px;background:rgba(245,158,11,.08);border-radius:6px;font-size:12px;color:#f59e0b">⚠ Demo mode — connect ANTHROPIC_API_KEY for AI-generated notes</div>`;
}

// ── Page: AI Assistant ─────────────────────────────────────

const ChatState = {
  messages: [],
  patientContext: null,
};

function renderAssistant() {
  const patients = PatientStore.getAll();
  html(el('page-content'), `
    <div class="chat-layout">
      <div class="chat-header">
        <div class="chat-ai-avatar">A</div>
        <div>
          <div class="chat-ai-name">AXIOM</div>
          <div class="chat-ai-meta">Clinical AI Intelligence Engine · AZEDOC v1.0</div>
        </div>
        <div class="chat-model-badge">claude-opus-4-6</div>
      </div>
      <div class="chat-context-bar">
        <span class="chat-context-label">Patient context:</span>
        <select class="chat-context-select" id="chat-patient-sel">
          <option value="">No patient selected (general mode)</option>
          ${patients.map(p => `<option value="${p.id}">${escHtml(p.name)} (${p.bed})</option>`).join('')}
        </select>
        <button class="btn btn-ghost btn-sm" id="clear-chat-btn" style="margin-left:auto">Clear</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        ${ChatState.messages.length === 0 ? welcomeMessage() : ChatState.messages.map(m => msgHtml(m)).join('')}
      </div>
      <div class="chat-suggestions" id="chat-suggestions">
        ${suggestionsHtml()}
      </div>
      <div class="chat-input-area">
        <textarea class="chat-input" id="chat-input" placeholder="Ask about drug interactions, clinical guidelines, patient management..." rows="1"></textarea>
        <button class="btn btn-primary" id="chat-send">${ICONS.send}</button>
      </div>
    </div>
  `);

  el('chat-patient-sel').value = ChatState.patientContext?.id || '';
  el('chat-patient-sel').onchange = (e) => {
    ChatState.patientContext = e.target.value ? PatientStore.getById(e.target.value) : null;
  };

  el('clear-chat-btn').onclick = () => {
    ChatState.messages = [];
    html(el('chat-messages'), welcomeMessage());
  };

  const input = el('chat-input');
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  el('chat-send').onclick = sendChatMessage;

  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.onclick = () => { el('chat-input').value = chip.textContent; sendChatMessage(); };
  });
}

function welcomeMessage() {
  return `
    <div style="text-align:center;padding:32px 20px">
      <div style="font-size:40px;margin-bottom:12px">🧠</div>
      <div style="font-size:16px;font-weight:700;color:#f9fafb;margin-bottom:6px">AXIOM Clinical Intelligence</div>
      <div style="font-size:13px;color:#6b7280;max-width:400px;margin:0 auto;line-height:1.6">Ask about drug interactions, NICE guidelines, differential diagnoses, or patient management. Select a patient for context-aware responses.</div>
    </div>
  `;
}

function suggestionsHtml() {
  const suggestions = [
    'What are the SEPSIS-6 steps?',
    'Drug interactions with warfarin',
    'NEWS2 scoring criteria',
    'CAP severity scoring (CURB-65)',
    'AKI staging and management',
    'Fluid resuscitation in sepsis',
  ];
  return suggestions.map(s => `<span class="suggestion-chip">${escHtml(s)}</span>`).join('');
}

function msgHtml(m) {
  return `
    <div class="msg msg-${m.role === 'user' ? 'user' : 'ai'}">
      <div class="msg-avatar">${m.role === 'user' ? ShiftState.doctor.initials : 'A'}</div>
      <div>
        <div class="msg-bubble">${m.role === 'assistant' ? m.content.replace(/\n/g, '<br>') : escHtml(m.content)}</div>
        <div class="msg-time">${m.time || ''}</div>
      </div>
    </div>
  `;
}

async function sendChatMessage() {
  const input = el('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = '';

  const userMsg = { role: 'user', content: text, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) };
  ChatState.messages.push(userMsg);

  const msgContainer = el('chat-messages');
  msgContainer.innerHTML = ChatState.messages.map(m => msgHtml(m)).join('');

  // Typing indicator
  const typingId = 'typing-' + Date.now();
  msgContainer.insertAdjacentHTML('beforeend', `
    <div class="msg msg-ai" id="${typingId}">
      <div class="msg-avatar" style="background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff">A</div>
      <div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
    </div>
  `);
  msgContainer.scrollTop = msgContainer.scrollHeight;

  const patientCtx = ChatState.patientContext ? {
    name: ChatState.patientContext.name,
    age: ChatState.patientContext.age,
    diagnosis: ChatState.patientContext.diagnosis,
    vitals: ChatState.patientContext.vitals.current,
    labs: ChatState.patientContext.labs,
    medications: ChatState.patientContext.medications,
    news2: ChatState.patientContext.news2Score,
  } : null;

  const apiMessages = ChatState.messages.filter(m => !m._typing).map(m => ({ role: m.role, content: m.content }));
  const result = await API.chat(apiMessages, patientCtx);

  document.getElementById(typingId)?.remove();

  let responseText;
  if (result.ok) {
    responseText = result.data.response;
  } else if (API.isDemo()) {
    responseText = `**Demo Mode** — I'm AXIOM, your clinical AI assistant. In demo mode I cannot access the Claude API. Please set your ANTHROPIC_API_KEY to enable full AI responses.\n\nYour question was: *"${text}"*`;
  } else {
    responseText = `Error connecting to AXIOM: ${result.error}`;
  }

  const aiMsg = { role: 'assistant', content: responseText, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) };
  ChatState.messages.push(aiMsg);
  msgContainer.innerHTML = ChatState.messages.map(m => msgHtml(m)).join('');
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

// ── Page: Handover ─────────────────────────────────────────

function renderHandover() {
  const patients = PatientStore.getForHandover();
  html(el('page-content'), `
    <div class="page-header">
      <div class="page-title">Shift Handover</div>
      <div class="page-subtitle">Generate AI-powered handover summary for the incoming team</div>
    </div>
    <div class="handover-layout">
      <div class="handover-panel">
        <div class="handover-panel-head">
          <div style="font-size:13px;font-weight:700;color:#f9fafb">Patient List (${patients.length})</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px">Add notes for handover</div>
        </div>
        <div class="handover-panel-body" id="handover-patients"></div>
      </div>

      <div class="handover-panel">
        <div class="handover-panel-head" style="display:flex;align-items:center;gap:10px">
          <div class="ai-badge"><span class="ai-badge-dot"></span>AXIOM</div>
          <div style="font-size:13px;font-weight:700;color:#f9fafb">AI Handover Summary</div>
          <button class="btn btn-primary btn-sm" id="gen-handover-btn" style="margin-left:auto">Generate</button>
        </div>
        <div class="handover-panel-body">
          <div style="display:flex;gap:12px;margin-bottom:16px">
            <div style="flex:1">
              <div class="form-label">Handover to</div>
              <input class="form-input" id="handover-doctor" value="Night Team" style="margin-top:4px">
            </div>
            <div>
              <div class="form-label">Shift end</div>
              <input class="form-input" id="handover-time" value="19:00" style="margin-top:4px;width:90px">
            </div>
          </div>
          <div id="handover-summary" class="handover-summary">
            <div style="color:#4b5563;text-align:center;padding:40px 0">Click "Generate" to create AI handover summary</div>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn btn-secondary btn-sm" id="copy-handover-btn">${ICONS.copy} Copy</button>
            <button class="btn btn-secondary btn-sm" id="print-handover-btn">${ICONS.print} Print</button>
          </div>
        </div>
      </div>
    </div>
  `);

  // Render patient rows
  const patientsList = el('handover-patients');
  patientsList.innerHTML = patients.map(p => `
    <div class="handover-patient-row">
      <div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="handover-patient-name">${escHtml(p.name)}</span>
          <span class="news2-badge ${news2Class(p.news2Score)}" style="font-size:10px">N2:${p.news2Score}</span>
        </div>
        <div class="handover-patient-meta">Bed ${p.bed} · ${escHtml(p.diagnosis)}</div>
        <textarea class="handover-notes-input" data-pid="${p.id}" placeholder="Add handover notes...">${escHtml(p.handoverNotes || '')}</textarea>
      </div>
    </div>
  `).join('');

  patientsList.querySelectorAll('.handover-notes-input').forEach(ta => {
    ta.oninput = () => PatientStore.updatePatient(ta.dataset.pid, { handoverNotes: ta.value });
  });

  el('gen-handover-btn').onclick = async () => {
    const doctorName = el('handover-doctor').value || 'Night Team';
    const shiftEnd = el('handover-time').value || '19:00';
    const summaryEl = el('handover-summary');

    summaryEl.innerHTML = `<div style="display:flex;align-items:center;gap:10px;color:#6b7280"><div class="spinner-lg spinner"></div><span>AXIOM generating handover summary...</span></div>`;

    const patientData = PatientStore.getForHandover().map(p => ({
      name: p.name, bed: p.bed, diagnosis: p.diagnosis,
      news2Score: p.news2Score, riskLevel: p.riskLevel,
      pendingActions: p.pendingActions || [],
      handoverNotes: p.handoverNotes || '',
    }));

    const result = await API.handover(patientData, doctorName, shiftEnd);
    if (result.ok) {
      summaryEl.textContent = result.data.summary;
      Toast.show('Handover summary generated', 'success');
    } else if (API.isDemo()) {
      summaryEl.innerHTML = demoHandoverSummary(patientData, doctorName, shiftEnd);
      Toast.show('Demo mode: showing example handover', 'info');
    } else {
      summaryEl.innerHTML = `<div style="color:#ef4444">Error: ${escHtml(result.error)}</div>`;
    }
  };

  el('copy-handover-btn').onclick = () => {
    navigator.clipboard.writeText(el('handover-summary').innerText).then(() => Toast.show('Copied to clipboard', 'success'));
  };
  el('print-handover-btn').onclick = () => window.print();
}

function demoHandoverSummary(patients, doctor, shiftEnd) {
  const critical = patients.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');
  return `<strong style="color:#00d4ff">SHIFT SUMMARY</strong>\n` +
    `End-of-shift handover for ${doctor} at ${shiftEnd}. Ward 7 General Medicine. ` +
    `${patients.length} patients total, ${critical.length} high-priority.\n\n` +
    `<strong style="color:#00d4ff">NIGHT WATCHLIST</strong>\n` +
    critical.slice(0, 5).map(p => `• ${p.name} (Bed ${p.bed}) — ${p.diagnosis} · NEWS2: ${p.news2Score}`).join('\n') + '\n\n' +
    `<strong style="color:#00d4ff">PENDING ACTIONS</strong>\n` +
    patients.flatMap(p => (p.pendingActions || []).filter(a => a.priority === 'urgent').map(a => `• [${p.name}] ${a.action}`)).slice(0, 6).join('\n') + '\n\n' +
    `<div style="padding:8px;background:rgba(245,158,11,.08);border-radius:6px;font-size:12px;color:#f59e0b">⚠ Demo mode — connect ANTHROPIC_API_KEY for AI-generated handover</div>`;
}

// ── Page: Analytics ────────────────────────────────────────

function renderAnalytics() {
  const patients = PatientStore.getAll();
  const stats = PatientStore.getShiftStats();
  const insights = PatientStore.getPatternInsights();

  html(el('page-content'), `
    <div class="page-header">
      <div class="page-title">Ward Analytics</div>
      <div class="page-subtitle">Shift intelligence and pattern analysis</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
      ${statTile('Total Patients', stats.total, '#00d4ff')}
      ${statTile('Critical/High', stats.critical + stats.high, '#ef4444')}
      ${statTile('Pending Actions', stats.pendingActions, '#f59e0b')}
      ${statTile('Discharging', stats.discharging, '#10b981')}
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:20px">
      <div class="card card-pad">
        <div class="chart-wrap-title">NEWS2 Distribution</div>
        <div style="position:relative;height:220px"><canvas id="analytics-news2"></canvas></div>
      </div>
      <div class="card card-pad">
        <div class="chart-wrap-title">Risk Distribution</div>
        <div style="position:relative;height:220px"><canvas id="analytics-risk"></canvas></div>
      </div>
    </div>

    <div class="section-header">
      <div class="ai-badge"><span class="ai-badge-dot"></span>AXIOM</div>
      <span class="section-title" style="margin-left:4px">Pattern Insights</span>
      <span class="section-count">${insights.length}</span>
      <div class="section-line"></div>
    </div>
    <div class="analytics-grid">
      ${insights.map(ins => `
        <div class="insight-card" data-pid="${ins.patientId}" style="cursor:pointer">
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px">Patient: <strong style="color:#9ca3af">${escHtml(ins.patient)}</strong></div>
          <div class="insight-title" style="font-size:13px">${escHtml(ins.insight)}</div>
          <div class="insight-source">Based on: ${escHtml(ins.based_on)}</div>
          <div class="confidence-bar-wrap" style="margin-top:8px">
            <div class="confidence-bar"><div class="confidence-fill" style="width:${ins.confidence}%"></div></div>
            <span class="confidence-label">${ins.confidence}%</span>
          </div>
        </div>
      `).join('')}
    </div>
  `);

  setTimeout(() => {
    const n = document.getElementById('analytics-news2');
    const r = document.getElementById('analytics-risk');
    if (n) Charts.news2Bar(n, patients);
    if (r) Charts.wardRisk(r, stats);
  }, 50);

  document.querySelectorAll('[data-pid]').forEach(card => {
    card.addEventListener('click', () => Router.go('patient-detail', { id: card.dataset.pid }));
  });
}

function statTile(label, value, color) {
  return `
    <div class="card card-pad" style="text-align:center">
      <div style="font-size:32px;font-weight:800;color:${color};font-family:'JetBrains Mono',monospace;letter-spacing:-1px">${value}</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">${label}</div>
    </div>
  `;
}

// ── Page: Settings ─────────────────────────────────────────

function renderSettings() {
  html(el('page-content'), `
    <div class="page-header">
      <div class="page-title">Settings</div>
      <div class="page-subtitle">AZEDOC Clinical AI Platform configuration</div>
    </div>
    <div style="max-width:600px">
      <div class="card card-pad" style="margin-bottom:16px">
        <div style="font-size:14px;font-weight:700;color:#f9fafb;margin-bottom:16px">API Connection</div>
        <div style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--bg-e);border-radius:10px">
          <div class="ai-badge"><span class="ai-badge-dot" style="background:${API.isDemo() ? '#f59e0b' : '#10b981'}"></span>${API.isDemo() ? 'Demo Mode' : 'Connected'}</div>
          <div style="flex:1">
            <div style="font-size:13px;color:#f9fafb">${API.isDemo() ? 'No API key configured' : 'ANTHROPIC_API_KEY active'}</div>
            <div style="font-size:11.5px;color:#6b7280;margin-top:2px">${API.isDemo() ? 'Set ANTHROPIC_API_KEY env var or add to config.json to enable AI features' : 'AI features enabled — Model: claude-opus-4-6'}</div>
          </div>
        </div>
      </div>
      <div class="card card-pad" style="margin-bottom:16px">
        <div style="font-size:14px;font-weight:700;color:#f9fafb;margin-bottom:16px">Doctor Profile</div>
        ${Object.entries(ShiftState.doctor).map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)">
            <span style="font-size:12px;color:#6b7280;text-transform:capitalize">${k.replace('_', ' ')}</span>
            <span style="font-size:13px;color:#d1d5db">${escHtml(v)}</span>
          </div>
        `).join('')}
      </div>
      <div class="card card-pad">
        <div style="font-size:14px;font-weight:700;color:#f9fafb;margin-bottom:16px">About AZEDOC</div>
        <div style="font-size:13px;color:#6b7280;line-height:1.7">
          AZEDOC Clinical AI Platform v2.0 — Production Ready<br>
          Powered by AXIOM (claude-haiku-4-5)<br>
          For professional use by licensed clinicians only.<br>
          AI outputs are advisory and require clinical judgment.<br>
          <br>
          <strong style="color:#9ca3af">Security:</strong> JWT authentication, encrypted audit logging, KVKK compliant<br>
          <strong style="color:#9ca3af">Region:</strong> Turkey-optimized compliance
        </div>
      </div>
    </div>
  `);
}

// ── Page Renderer ──────────────────────────────────────────

function renderPage(page, params) {
  Charts.destroyAll();
  switch (page) {
    case 'dashboard':      renderDashboard(); break;
    case 'patients':       renderPatients(); break;
    case 'patient-detail': renderPatientDetail(params.id); break;
    case 'scribe':         renderScribe(); break;
    case 'assistant':      renderAssistant(); break;
    case 'handover':       renderHandover(); break;
    case 'analytics':      renderAnalytics(); break;
    case 'settings':       renderSettings(); break;
    default:               renderDashboard();
  }
}

// ── Live Vitals Update ─────────────────────────────────────

function startLiveVitals() {
  setInterval(() => {
    PatientStore.simulateLiveVitals();
    // Refresh dashboard stats if on dashboard
    if (Router.current() === 'dashboard') {
      const statsEl = document.querySelectorAll('.hero-stat-val');
      if (statsEl.length) {
        const stats = PatientStore.getShiftStats();
        // Just re-render the hero stats quietly
      }
    }
    // Update nav badge
    const badge = document.querySelector('.nav-item[data-page="patients"] .nav-badge');
    if (badge) badge.textContent = PatientStore.getHighRisk().length;
  }, 15000);
}

// ── App Init ───────────────────────────────────────────────

const App = {
  _searchQuery: '',
  _filterActive: 'all',

  async init() {
    try {
      // Initialize API connection first
      const apiReady = await API.init();
      if (!apiReady) {
        Toast.show('Warning: API connection failed. Running in demo mode.', 'warning', 5000);
      }

      buildSidebar();
      initTopbar();

      // Add logout button listener
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'l') {
          API.logout();
          location.reload();
        }
      });

      Router.go('dashboard');
      startLiveVitals();

      // Welcome toast after a moment
      setTimeout(() => {
        const doc = ShiftState.doctor;
        const stats = PatientStore.getShiftStats();
        Toast.show(`${stats.critical + stats.high} high-risk patients need attention`, 'critical', 6000);
      }, 1500);
    } catch (e) {
      console.error('App initialization failed:', e);
      Toast.show('Application initialization failed', 'critical', 0);
    }
  },
};

global.App = App;
global.Router = Router;

})(window);

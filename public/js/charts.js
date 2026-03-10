// AZEDOC — Charts Engine

(function(global) {
'use strict';

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 600, easing: 'easeInOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a2235',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#f9fafb',
      bodyColor: '#9ca3af',
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
      ticks: { color: '#4b5563', font: { size: 10, family: "'JetBrains Mono', monospace" }, maxTicksLimit: 8 },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
      ticks: { color: '#4b5563', font: { size: 10 } },
    },
  },
};

function timeLabels(vitals) {
  return vitals.map(v => {
    const d = new Date(v.time);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  });
}

const Charts = {
  _instances: {},

  _destroy(id) {
    if (this._instances[id]) {
      this._instances[id].destroy();
      delete this._instances[id];
    }
  },

  vitalsHR(canvas, patient) {
    const id = canvas.id || 'hr';
    this._destroy(id);
    const vitals = patient.vitals.history;
    const labels = timeLabels(vitals);
    this._instances[id] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'HR',
          data: vitals.map(v => v.hr),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: { ...CHART_DEFAULTS.plugins, tooltip: { ...CHART_DEFAULTS.plugins.tooltip, callbacks: { label: ctx => `HR: ${ctx.raw} bpm` } } },
        scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, suggestedMin: 40, suggestedMax: 140 } },
      },
    });
  },

  vitalsBP(canvas, patient) {
    const id = canvas.id || 'bp';
    this._destroy(id);
    const vitals = patient.vitals.history;
    const labels = timeLabels(vitals);
    this._instances[id] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Systolic',
            data: vitals.map(v => v.bp_sys),
            borderColor: '#f97316',
            backgroundColor: 'rgba(249,115,22,0.06)',
            borderWidth: 2, fill: false, tension: 0.4, pointRadius: 0,
          },
          {
            label: 'Diastolic',
            data: vitals.map(v => v.bp_dia),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.06)',
            borderWidth: 1.5, fill: false, tension: 0.4, pointRadius: 0, borderDash: [4, 3],
          },
        ],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          legend: { display: true, labels: { color: '#6b7280', font: { size: 10 }, boxWidth: 12 } },
        },
        scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, suggestedMin: 50, suggestedMax: 200 } },
      },
    });
  },

  vitalsSpO2(canvas, patient) {
    const id = canvas.id || 'spo2';
    this._destroy(id);
    const vitals = patient.vitals.history;
    const labels = timeLabels(vitals);
    this._instances[id] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'SpO2',
          data: vitals.map(v => v.spo2),
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0,212,255,0.08)',
          borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, suggestedMin: 85, suggestedMax: 100 } },
      },
    });
  },

  vitalsTemp(canvas, patient) {
    const id = canvas.id || 'temp';
    this._destroy(id);
    const vitals = patient.vitals.history;
    const labels = timeLabels(vitals);
    this._instances[id] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Temp',
          data: vitals.map(v => v.temp),
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167,139,250,0.08)',
          borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, suggestedMin: 35, suggestedMax: 41 } },
      },
    });
  },

  vitalsRR(canvas, patient) {
    const id = canvas.id || 'rr';
    this._destroy(id);
    const vitals = patient.vitals.history;
    const labels = timeLabels(vitals);
    this._instances[id] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'RR',
          data: vitals.map(v => v.rr),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, suggestedMin: 8, suggestedMax: 35 } },
      },
    });
  },

  wardRisk(canvas, stats) {
    const id = canvas.id || 'ward-risk';
    this._destroy(id);
    this._instances[id] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Stable'],
        datasets: [{
          data: [stats.critical, stats.high, stats.medium || 0, stats.stable],
          backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(249,115,22,0.8)', 'rgba(245,158,11,0.8)', 'rgba(16,185,129,0.8)'],
          borderColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981'],
          borderWidth: 1,
          hoverOffset: 4,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        cutout: '70%',
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: '#6b7280', font: { size: 11 }, padding: 12, boxWidth: 10 } },
          tooltip: { ...CHART_DEFAULTS.plugins.tooltip },
        },
      },
    });
  },

  news2Bar(canvas, patients) {
    const id = canvas.id || 'news2-bar';
    this._destroy(id);
    const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // 0–8+
    patients.forEach(p => {
      const s = Math.min(p.news2Score, 8);
      buckets[s]++;
    });
    const colors = buckets.map((_, i) => {
      if (i <= 1) return 'rgba(16,185,129,0.7)';
      if (i <= 3) return 'rgba(245,158,11,0.7)';
      if (i <= 5) return 'rgba(249,115,22,0.7)';
      return 'rgba(239,68,68,0.7)';
    });
    this._instances[id] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8+'],
        datasets: [{
          label: 'Patients',
          data: buckets,
          backgroundColor: colors,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        scales: {
          ...CHART_DEFAULTS.scales,
          x: { ...CHART_DEFAULTS.scales.x, title: { display: true, text: 'NEWS2 Score', color: '#4b5563', font: { size: 10 } } },
          y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, stepSize: 1 } },
        },
      },
    });
  },

  destroyAll() {
    Object.values(this._instances).forEach(c => c.destroy());
    this._instances = {};
  },
};

global.Charts = Charts;

})(window);

// AZEDOC — API Layer

(function(global) {
'use strict';

const BASE = '';

async function req(path, body) {
  try {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

const API = {
  _status: 'unknown', // 'ok' | 'demo' | 'error'

  async ping() {
    try {
      const res = await fetch(BASE + '/api/ping');
      const data = await res.json();
      this._status = data.ok ? 'ok' : 'demo';
      return data;
    } catch {
      this._status = 'error';
      return { ok: false, demo_mode: true };
    }
  },

  async chat(messages, patientContext = null) {
    return req('/api/chat', { messages, patient_context: patientContext });
  },

  async scribe(transcript, patientName = 'Unknown', specialty = 'General Medicine') {
    return req('/api/scribe', { transcript, patient_name: patientName, specialty });
  },

  async handover(patients, doctorName, shiftEnd) {
    return req('/api/handover', { patients, doctor_name: doctorName, shift_end: shiftEnd });
  },

  isDemo() { return this._status !== 'ok'; },
};

global.API = API;

})(window);

// AZEDOC — API Layer v2.0 (Production Grade)

(function(global) {
'use strict';

const BASE = '';

// ── JWT Token Management ──
class TokenManager {
  constructor() {
    this.token = localStorage.getItem('azedoc_token');
    this.expiresAt = parseInt(localStorage.getItem('azedoc_token_exp') || '0', 10);
  }

  async getValidToken() {
    const now = Date.now();
    if (this.token && this.expiresAt > now + 60000) { // 1min buffer
      return this.token;
    }

    try {
      const res = await fetch(BASE + '/api/auth/token', { method: 'POST' });
      if (!res.ok) throw new Error('Token generation failed');

      const data = await res.json();
      this.token = data.token;
      this.expiresAt = now + (data.expires_in * 1000);

      localStorage.setItem('azedoc_token', this.token);
      localStorage.setItem('azedoc_token_exp', this.expiresAt.toString());

      return this.token;
    } catch (e) {
      console.warn('Token generation error:', e.message);
      return null;
    }
  }

  clear() {
    this.token = null;
    this.expiresAt = 0;
    localStorage.removeItem('azedoc_token');
    localStorage.removeItem('azedoc_token_exp');
  }
}

const tokenMgr = new TokenManager();

// ── Request Handler ──
async function req(path, body) {
  try {
    const token = await tokenMgr.getValidToken();
    if (!token) {
      return { ok: false, error: 'AUTHENTICATION_FAILED' };
    }

    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.message || data.error || `HTTP ${res.status}`;
      throw new Error(errorMsg);
    }

    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── API Object ──
const API = {
  _status: 'unknown', // 'ok' | 'demo' | 'error'
  _initialized: false,

  async init() {
    try {
      const data = await this.health();
      this._status = data.status === 'ok' ? 'ok' : 'error';
      this._initialized = true;
      return true;
    } catch (e) {
      this._status = 'error';
      this._initialized = true;
      return false;
    }
  },

  async health() {
    try {
      const res = await fetch(BASE + '/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      throw e;
    }
  },

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

  isDemo() {
    return this._status !== 'ok';
  },

  logout() {
    tokenMgr.clear();
    this._status = 'unknown';
  },

  async generateSOAP(transcript, patientName, specialty) {
    if (this.isDemo()) {
      return this.generateDemoSOAP(transcript, patientName, specialty);
    }
    return this.scribe(transcript, patientName, specialty);
  },

  generateDemoSOAP(transcript, patientName, specialty) {
    const soapNote = `Xəstə: ${patientName}
Ixtisas: ${specialty}
Vaxt: ${new Date().toLocaleTimeString('az-AZ')}

SUBYEKTIV
Xəstə diş ağrısından şikayət edir. Transkriptsiyaya əsasən:
${transcript.substring(0, 200)}...

OBYEKTİV
Fiziki müayinə aparılmışdır. Cərəyan tərəfindən vital əlamətlər:
- Qan təzyiqi: Normal
- Ürək döyüntüsü: Normal
- Temperatur: Normal

QİYMƏTLƏNDİRMƏ
Klinik baxış diaqnoza uyğun. Əlavə araşdırma mümkün.

PLAN
1. Simptomatik müalicə
2. Izlənmə təmin ediləcəkdir
3. Gərəkçə mütəxəssisə yönləndirmə`;

    return {
      ok: true,
      data: {
        soap_note: soapNote,
        generated_at: new Date().toISOString()
      }
    };
  },

  generateDemoResponse(query, patientContext) {
    const responses = [
      'Bu xəstənin vəziyyəti diqqət tələb edir. Vital əlamətləri izləyin.',
      'Laboratoriya nəticələrinə əsasən, daha ətraflı araşdırma tələb olunur.',
      'Kliniki baxışa əsasən müalicə plani hazırlanmışdır.',
      'Xəstənin izlənməsi davam edilməlidir. Parametrləri qeyd edin.',
      'Bu simptomlar üçün diferensial diaqnoz düşünülsün.'
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    return {
      ok: true,
      data: {
        response: response,
        model: 'demo-mode',
        timestamp: new Date().toISOString()
      }
    };
  }
};

global.API = API;
global.TokenManager = TokenManager;

})(window);

# AZEDOC i18n Implementation Guide

**Turkish to Azerbaijani Localization**

---

## Quick Start

### 1. Add Language Support to app.js

```javascript
// At the top of /public/js/app.js, add:

const TRANSLATIONS = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.patients': 'Patients',
    'nav.scribe': 'AI Scribe',
    'nav.assistant': 'AI Assistant',
    'nav.handover': 'Handover',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    // ... (see az.json for complete list)
  },
  az: {
    'nav.dashboard': 'Paneli',
    'nav.patients': 'Xəstələr',
    'nav.scribe': 'AI Yazıçı',
    'nav.assistant': 'AI Assistenti',
    'nav.handover': 'Cərgə Dəyişdirilməsi',
    'nav.analytics': 'Analitika',
    'nav.settings': 'Tənzimləmələr',
    // ... (see az.json for complete list)
  }
};

let currentLanguage = localStorage.getItem('app-language') || 'en';

function t(key, replacements = {}) {
  let text = TRANSLATIONS[currentLanguage]?.[key] ||
             TRANSLATIONS['en']?.[key] ||
             key;

  // Handle string replacements like {filename}
  Object.keys(replacements).forEach(k => {
    text = text.replace(`{${k}}`, replacements[k]);
  });

  return text;
}

function setLanguage(lang) {
  if (TRANSLATIONS[lang]) {
    currentLanguage = lang;
    localStorage.setItem('app-language', lang);
    location.reload(); // Reload to apply all translations
  }
}
```

---

## 2. Update Navigation Items

**Current code (lines 123-130 in app.js):**

```javascript
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',    icon: 'dashboard' },
  { id: 'patients',   label: 'Patients',     icon: 'patients',  badge: () => PatientStore.getHighRisk().length || null },
  { id: 'scribe',     label: 'AI Scribe',    icon: 'scribe' },
  { id: 'assistant',  label: 'AI Assistant', icon: 'assistant' },
  { id: 'handover',   label: 'Handover',     icon: 'handover' },
  { id: 'analytics',  label: 'Analytics',    icon: 'analytics' },
];
```

**Update to:**

```javascript
const NAV_ITEMS = [
  { id: 'dashboard',  label: () => t('nav.dashboard'),    icon: 'dashboard' },
  { id: 'patients',   label: () => t('nav.patients'),     icon: 'patients',  badge: () => PatientStore.getHighRisk().length || null },
  { id: 'scribe',     label: () => t('nav.scribe'),       icon: 'scribe' },
  { id: 'assistant',  label: () => t('nav.assistant'),    icon: 'assistant' },
  { id: 'handover',   label: () => t('nav.handover'),     icon: 'handover' },
  { id: 'analytics',  label: () => t('nav.analytics'),    icon: 'analytics' },
];
```

**Update buildSidebar() function (line 137-145):**

```javascript
nav.innerHTML = NAV_ITEMS.map(item => {
  const b = item.badge ? item.badge() : null;
  const label = typeof item.label === 'function' ? item.label() : item.label;
  return `
    <div class="nav-item" data-page="${item.id}">
      <span class="nav-icon">${ICONS[item.icon] || ''}</span>
      <span class="nav-label">${label}</span>
      ${b ? `<span class="nav-badge">${b}</span>` : ''}
    </div>
  `;
}).join('') + `
  <div class="nav-item" data-page="settings">
    <span class="nav-icon">${ICONS.settings}</span>
    <span class="nav-label">${t('nav.settings')}</span>
  </div>
`;
```

---

## 3. Update Medical Scribe Page

**Current code (lines 776-777):**

```javascript
<div class="page-title">📋 Medical Scribe — AI Documentation Assistant</div>
<div class="page-subtitle">Convert voice consultation into professional SOAP notes in seconds</div>
```

**Update to:**

```javascript
<div class="page-title">📋 ${t('scribe.title')}</div>
<div class="page-subtitle">${t('scribe.subtitle')}</div>
```

**Form labels (line 823-838):**

Replace:
```javascript
<div class="form-label" style="font-size:11px">Patient</div>
<select class="form-select" id="scribe-patient" style="min-width:150px;font-size:13px">
  <option value="">Select patient</option>
```

With:
```javascript
<div class="form-label" style="font-size:11px">${t('scribe.form.patient')}</div>
<select class="form-select" id="scribe-patient" style="min-width:150px;font-size:13px">
  <option value="">${t('scribe.form.patient.select')}</option>
```

---

## 4. Update AI Assistant Page

**Current placeholder (line 1045):**

```javascript
Toast.show('Please enter a consultation transcript first', 'warning');
```

**Update to:**

```javascript
Toast.show(t('scribe.status.no_transcript'), 'warning');
```

**Chat input (around line 1200 in renderAssistant function):**

Replace:
```javascript
placeholder="Ask about drug interactions, clinical guidelines, patient management..."
```

With:
```javascript
placeholder="${t('assistant.input.placeholder')}"
```

---

## 5. Update Handover Page

**Current (line 1297):**

```javascript
<div class="page-title">Shift Handover</div>
```

**Update to:**

```javascript
<div class="page-title">${t('handover.title')}</div>
```

**Action buttons (line 1313):**

Replace:
```javascript
<button class="btn btn-primary btn-sm" id="gen-handover-btn" style="margin-left:auto">Generate</button>
```

With:
```javascript
<button class="btn btn-primary btn-sm" id="gen-handover-btn" style="margin-left:auto">${t('handover.btn.generate')}</button>
```

---

## 6. Toast and Error Messages

**Create a message translation helper:**

```javascript
const MessageMap = {
  'copy_success': () => t('scribe.status.copied'),
  'copy_failed': () => t('scribe.status.copy_failed'),
  'handover_generated': () => t('msg.generated'),
  'loading': () => t('msg.loading'),
  'error': () => t('msg.error_generic'),
};

// Usage:
Toast.show(MessageMap['copy_success'](), 'success');
```

---

## 7. Loading Sequence

**Current (index.html, lines 156-162):**

```javascript
const steps = [
  [15, 'Loading patient registry...'],
  [35, 'Initializing AI models...'],
  [55, 'Connecting to ward systems...'],
  [70, 'Calibrating NEWS2 engine...'],
  [85, 'Preparing shift intelligence...'],
  [100, 'AZEDOC ready'],
];
```

**Update to (after TRANSLATIONS is defined):**

```javascript
const steps = [
  [15, t('init.step1')],
  [35, t('init.step2')],
  [55, t('init.step3')],
  [70, t('init.step4')],
  [85, t('init.step5')],
  [100, t('init.step6')],
];
```

---

## 8. Settings Page (Language Selector)

**Add new page for settings with language toggle:**

```javascript
function renderSettings() {
  html(el('page-content'), `
    <div class="page-header">
      <div class="page-title">⚙️ ${t('nav.settings')}</div>
      <div class="page-subtitle">User preferences and platform settings</div>
    </div>

    <div class="card card-pad" style="max-width:600px">
      <div style="margin-bottom:24px">
        <div class="form-label" style="margin-bottom:8px">Language / Dil</div>
        <div style="display:flex;gap:8px">
          <button class="btn ${currentLanguage === 'en' ? 'btn-primary' : 'btn-secondary'}"
                  onclick="setLanguage('en')">
            English
          </button>
          <button class="btn ${currentLanguage === 'az' ? 'btn-primary' : 'btn-secondary'}"
                  onclick="setLanguage('az')">
            Azərbaycan
          </button>
        </div>
      </div>

      <div style="padding-top:16px;border-top:1px solid rgba(255,255,255,.06)">
        <button class="btn btn-ghost" onclick="logout()">
          ${t('btn.logout')}
        </button>
      </div>
    </div>
  `);
}
```

---

## 9. Search Placeholder

**Current (index.html, line 91):**

```javascript
<input type="text" class="search-input" id="search-input" placeholder="Search patients, diagnoses, drugs...">
```

**This needs dynamic update. In app.js:**

```javascript
function initTopbar() {
  // ... existing code ...
  el('search-input').placeholder = t('search.placeholder');

  // Re-update when language changes
}

// Call initTopbar again when language changes in setLanguage():
function setLanguage(lang) {
  if (TRANSLATIONS[lang]) {
    currentLanguage = lang;
    localStorage.setItem('app-language', lang);
    // Rebuild UI
    buildSidebar();
    initTopbar();
    renderPage(Router.current(), Router._params);
  }
}
```

---

## 10. Modal Buttons

**Current (line 88 in app.js):**

```javascript
<button class="btn btn-ghost" id="modal-close">Close</button>
```

**Dynamic update needed:**

```javascript
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
          <button class="btn btn-ghost" id="modal-close">${t('btn.cancel')}</button>
        </div>
      </div>
    </div>
  `;
  // ... rest of function
}
```

---

## 11. Testing Checklist

- [ ] Navigation menu items display in Azerbaijani
- [ ] Medical Scribe page all text translated
- [ ] AI Assistant messages translated
- [ ] Handover page translated
- [ ] Analytics labels translated
- [ ] Toast/notification messages translated
- [ ] Form labels translated
- [ ] Error messages translated
- [ ] Loading sequence translated
- [ ] Settings page with language selector works
- [ ] Language persists across page refreshes
- [ ] Characters render correctly (Ə, İ, Ğ, Ş, Ü, Ç)
- [ ] All 200+ strings covered
- [ ] No English text remains in main user flows

---

## 12. File Locations to Update

| File | Lines | Changes |
|------|-------|---------|
| `/public/js/app.js` | 1-10 | Add TRANSLATIONS object and t() function |
| `/public/js/app.js` | 123-130 | Update NAV_ITEMS labels |
| `/public/js/app.js` | 137-150 | Update buildSidebar() |
| `/public/js/app.js` | 229-310 | Update Dashboard page text |
| `/public/js/app.js` | 773-900 | Update Scribe page text |
| `/public/js/app.js` | 1138-1290 | Update Assistant page text |
| `/public/js/app.js` | 1293-1400 | Update Handover page text |
| `/public/js/app.js` | 1400+ | Add Settings page with language selector |
| `/public/index.html` | 156-162 | Update loading sequence |

---

## 13. Import az.json Dynamically (Optional)

For larger applications, load translations from JSON:

```javascript
let TRANSLATIONS = {
  en: {},
  az: {}
};

async function loadTranslations() {
  try {
    const response = await fetch('/locales/az.json');
    const azTranslations = await response.json();
    TRANSLATIONS.az = azTranslations;

    // Default EN translations (can also be loaded from JSON)
    TRANSLATIONS.en = { /* ... */ };
  } catch (e) {
    console.error('Failed to load translations:', e);
  }
}

// Call in initialization
loadTranslations().then(() => App.init());
```

---

## 14. Medical Terminology Reference

| English | Azerbaijani | Context |
|---------|------------|---------|
| Blood Pressure | Qan Təzyiqi | Vital sign |
| Heart Rate | Ürək Tənəffüsü | Vital sign |
| Temperature | İstilik | Vital sign |
| O2 Saturation | O2 Doyması | Vital sign |
| Diagnosis | Diaqnoz | Clinical assessment |
| Vital Signs | Vital işarələri | Patient measurements |
| Transcription | Transkripsiya | Voice-to-text |
| SOAP Note | SOAP Qeyd | Documentation format |
| Patient Name | Xəstənin Adı | Form field |
| Chief Complaint | Əsas Şikayət | Clinical presentation |

---

## 15. Browser Compatibility

**Required for Azerbaijani characters:**

```html
<!-- In index.html <head> -->
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
```

**Font support (already in index.html):**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

The Google Fonts "Inter" family fully supports Azerbaijani characters (Ə, İ, Ğ, Ş, Ü, Ç).

---

## 16. Deployment Notes

1. **Build process:** No changes needed for production build
2. **Cache busting:** Clear browser cache after language updates
3. **CDN:** If using CDN, ensure `/locales/az.json` is cached appropriately
4. **Analytics:** Track language preference in your analytics platform
5. **Database:** Store user language preference if using persistent user accounts

---

## 17. Future Enhancements

- [ ] Turkish (tr) translations for compliance with KVKK
- [ ] Language-specific date/time formatting
- [ ] RTL support (if adding Arabic or Persian later)
- [ ] Pluralization handling (currently not needed)
- [ ] Context-aware translations for medical terms
- [ ] Community translation contributions

---

## 18. Validation Script

Run this JavaScript in browser console to verify all strings are translated:

```javascript
function validateTranslations() {
  const enKeys = Object.keys(TRANSLATIONS.en);
  const azKeys = Object.keys(TRANSLATIONS.az);

  const missing = enKeys.filter(k => !azKeys.includes(k));
  const extra = azKeys.filter(k => !enKeys.includes(k));

  console.log('=== Translation Validation ===');
  console.log(`English keys: ${enKeys.length}`);
  console.log(`Azerbaijani keys: ${azKeys.length}`);

  if (missing.length > 0) {
    console.warn(`Missing in Azerbaijani: ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    console.warn(`Extra in Azerbaijani: ${extra.join(', ')}`);
  }

  console.log(missing.length === 0 && extra.length === 0 ? '✓ All strings translated' : '✗ Issues found');
}

validateTranslations();
```

---

## Summary

This implementation guide provides:
- ✓ Complete translation integration for AZEDOC
- ✓ Step-by-step code updates
- ✓ Testing methodology
- ✓ Azerbaijani language support with proper character handling
- ✓ Professional medical terminology
- ✓ Easy language switching via Settings page
- ✓ Persistent language preference
- ✓ 200+ translated strings covering all UI elements

**Estimated Implementation Time:** 2-3 hours
**Testing Time:** 1-2 hours
**Total Deployment:** Half day


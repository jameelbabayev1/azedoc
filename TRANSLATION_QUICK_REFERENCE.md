# AZEDOC Translation Quick Reference Card

**Turkish → Azerbaijani Localization Cheat Sheet**

---

## Essential Translations at a Glance

### Navigation (7 items)
```
Dashboard     → Paneli
Patients      → Xəstələr
AI Scribe     → AI Yazıçı
AI Assistant  → AI Assistenti
Handover      → Cərgə Dəyişdirilməsi
Analytics     → Analitika
Settings      → Tənzimləmələr
```

### Page Titles
```
Medical Scribe — AI Documentation Assistant
→ Tibbi Yazıçı — AI Sənədsiz Asistan

Clinical AI Intelligence Engine
→ Klinik AI İntellekt Mühərriki

Shift Handover
→ Smena Dəyişdirilməsi

Analytics Dashboard
→ Analitika Paneli
```

### Common Button Labels
```
Save              → Saxlayın
Edit              → Redaktə Edin
Delete            → Silin
Cancel            → Ləğv Edin
Generate          → Yaradın
Copy              → Kopyalayın
Print             → Çap Edin
Download          → Yükləyin
Log Out           → Çıxış Edin
```

### Form Fields
```
Patient Name      → Xəstənin Adı
Age               → Yaş
Gender            → Cinsiyyət
Department        → Şöbə
Date              → Tarix
Time              → Vaxt
Chief Complaint   → Əsas Şikayət
Diagnosis         → Diaqnoz
```

### Severity Levels
```
CRITICAL  → KRİTİK
HIGH      → YÜKSƏK
STABLE    → SABIT
LOW       → AŞAĞ1
```

### Status Messages
```
Loading...        → Yüklənir...
Processing...     → Emallanır...
Error occurred    → Xəta baş verdi
Successfully saved→ Uğurla saxlanıldı
Copied to clipboard→ Bufərə kopyalanmışdır
```

---

## Implementation Quick Steps

### 1. Add Translation Function
```javascript
function t(key) {
  return TRANSLATIONS[currentLanguage][key] || TRANSLATIONS['en'][key] || key;
}
```

### 2. Replace Hard-coded Strings
**Before:**
```javascript
<span class="nav-label">Dashboard</span>
```

**After:**
```javascript
<span class="nav-label">${t('nav.dashboard')}</span>
```

### 3. Language Switch
```javascript
// In Settings page
<button onclick="setLanguage('az')">Azərbaycan</button>
<button onclick="setLanguage('en')">English</button>
```

---

## Most Used Translation Keys (Top 20)

| Key | English | Azerbaijani |
|-----|---------|------------|
| nav.dashboard | Dashboard | Paneli |
| nav.patients | Patients | Xəstələr |
| nav.scribe | AI Scribe | AI Yazıçı |
| nav.assistant | AI Assistant | AI Assistenti |
| nav.handover | Handover | Cərgə Dəyişdirilməsi |
| nav.analytics | Analytics | Analitika |
| nav.settings | Settings | Tənzimləmələr |
| btn.save | Save | Saxlayın |
| btn.delete | Delete | Silin |
| btn.cancel | Cancel | Ləğv Edin |
| btn.generate | Generate | Yaradın |
| msg.loading | Loading... | Yüklənir... |
| msg.error_generic | Error occurred | Xəta baş verdi |
| msg.success | Successfully saved | Uğurla saxlanıldı |
| form.patient_name | Patient Name | Xəstənin Adı |
| form.age | Age | Yaş |
| form.gender | Gender | Cinsiyyət |
| scribe.btn.generate | ⚡ Generate SOAP Note | ⚡ SOAP Qeyd Yaratın |
| scribe.status.copied | ✅ Copied to clipboard | ✅ Bufərə kopyalanmışdır |
| severity.critical | CRITICAL | KRİTİK |

---

## Azerbaijani Character Set

**Unique characters in Azerbaijani:**
```
Ə (Ə) - ə (ə)
İ (I with dot) - i (i)
Ğ (ğ) - ğ (ğ)
Ş (ş) - ş (ş)
Ü (Ü) - ü (ü)
Ç (Ç) - ç (ç)
```

**All supported by UTF-8 encoding (required)**

---

## Medical Terminology (Keep in English)

These should remain in English across all languages:
```
NEWS2       (National Early Warning Score 2)
AXIOM       (AI engine - proper noun)
SOAP        (Subjective, Objective, Assessment, Plan)
HR/BPM      (Heart Rate)
BP          (Blood Pressure)
O2/SpO2     (Oxygen Saturation)
ECG         (Electrocardiogram)
CT/MRI      (Imaging)
CBC         (Complete Blood Count)
```

---

## Date/Time Formatting

**Azerbaijani standard in healthcare:**
```
Date:  DD.MM.YYYY (e.g., 10.03.2026)
Time:  24-hour format (e.g., 14:30)
Decimal: Comma (e.g., 36,5°C for temperature)
```

---

## Professional Tone Checklist

- [ ] Medical terms are accurate
- [ ] Imperative verbs are formal ("Saxlayın" not "Saxla")
- [ ] No colloquialisms
- [ ] Abbreviations preserved (NEWS2, AXIOM, SOAP)
- [ ] Consistency across all pages
- [ ] Clear and concise
- [ ] Professional medical vocabulary

---

## Files to Update

**Priority Order:**
1. `/public/js/app.js` - Main application
2. `/public/index.html` - HTML structure
3. `/public/js/api.js` - API responses
4. `/public/js/data.js` - Data initialization

**No changes needed:**
- CSS files (style is language-agnostic)
- JavaScript utilities
- API endpoints

---

## Testing Commands

**Browser Console:**
```javascript
// Check current language
console.log(currentLanguage);

// Test translation
console.log(t('nav.dashboard'));

// Switch to Azerbaijani
setLanguage('az');

// Validate all strings
validateTranslations();
```

---

## Common Mistakes to Avoid

❌ **Don't:**
- Mix Turkish and Azerbaijani
- Translate acronyms (NEWS2 → NEWS2, not "XƏB2")
- Use informal tone
- Hardcode strings in HTML
- Forget UTF-8 encoding
- Use RTL (Azerbaijani is LTR)

✅ **Do:**
- Use t('key') function for all strings
- Keep medical terms consistent
- Test in real browser
- Verify character rendering
- Store preference in localStorage
- Update all related pages

---

## Example Implementation

**Complete Scribe page translation:**

```javascript
function renderScribe() {
  html(el('page-content'), `
    <div class="page-header">
      <div class="page-title">${t('scribe.title')}</div>
      <div class="page-subtitle">${t('scribe.subtitle')}</div>
    </div>

    <div class="scribe-panel">
      <div class="scribe-panel-header">
        <span class="scribe-panel-title">${t('scribe.guidelines.title')}</span>
      </div>
      <div class="scribe-panel-body">
        <div>
          <strong>${t('scribe.bestformat.title')}:</strong><br>
          ${t('scribe.bestformat.desc')}
        </div>
      </div>
    </div>

    <div class="form-row">
      <div>
        <div class="form-label">${t('scribe.form.patient')}</div>
        <select id="scribe-patient">
          <option>${t('scribe.form.patient.select')}</option>
        </select>
      </div>
      <div>
        <div class="form-label">${t('scribe.form.department')}</div>
        <select id="scribe-specialty">
          <option>${t('dept.general_medicine')}</option>
          <option>${t('dept.cardiology')}</option>
        </select>
      </div>
    </div>

    <button class="btn btn-primary" onclick="generateSOAP()">
      ${t('scribe.btn.generate')}
    </button>
  `);
}
```

---

## Language Persistence

**Store user preference:**
```javascript
function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('app-language', lang);
  location.reload();
}

// On app load
currentLanguage = localStorage.getItem('app-language') || 'en';
```

---

## Deployment Checklist

- [ ] All 200+ translations added
- [ ] t() function integrated throughout app.js
- [ ] Settings page with language selector created
- [ ] /locales/az.json file deployed
- [ ] UTF-8 encoding verified
- [ ] Browser testing completed
- [ ] Character rendering verified (Ə, İ, Ğ, Ş, Ü, Ç)
- [ ] Performance impact assessed (minimal)
- [ ] Translation validation script passes
- [ ] Documentation updated
- [ ] Rollback plan in place

---

## Support Resources

- **Full Documentation:** `TRANSLATION_GUIDE_TR_TO_AZ.md`
- **Implementation Details:** `IMPLEMENTATION_GUIDE_i18n.md`
- **Translation Data:** `/locales/az.json`
- **Azerbaijani Keyboard:** For manual testing

---

## Statistics

- **Total Translation Keys:** 200+
- **Navigation Items:** 7
- **Form Fields:** 15+
- **Medical Terms:** 30+
- **Button Labels:** 20+
- **Error Messages:** 10+
- **Status Messages:** 15+
- **Loading Sequence:** 6 steps
- **Implementation Time:** 2-3 hours
- **Testing Time:** 1-2 hours

---

**Version:** 1.0
**Last Updated:** March 10, 2026
**Language Pair:** Turkish → Azerbaijani
**Application:** AZEDOC v2.0 Clinical AI Platform
**Encoding:** UTF-8 (without BOM)
**Text Direction:** LTR (Left-to-Right)

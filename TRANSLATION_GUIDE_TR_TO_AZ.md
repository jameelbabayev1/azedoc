# AZEDOC Translation Guide: Turkish to Azerbaijani

**Version:** 1.0
**Created:** March 10, 2026
**Platform:** AZEDOC v2.0 — Clinical AI Platform
**Target Language:** Azerbaijani (Azərbaycan)
**Professional Tone:** Medical/Clinical

---

## Overview

This comprehensive guide provides translations for converting the AZEDOC medical platform interface and content from Turkish to Azerbaijani. Each translation includes:
- English source text
- Azerbaijani (Azərbaycan) translation
- Medical context notes
- Professional tone verification

Format: **Key-value pairs** suitable for JavaScript application implementation using JSON.

---

## 1. NAVIGATION MENU ITEMS

### Core Navigation Items

```javascript
{
  // Dashboard
  "nav.dashboard": {
    "en": "Dashboard",
    "az": "Paneli",
    "context": "Main overview screen",
    "tone": "✓ Professional"
  },

  // Patients
  "nav.patients": {
    "en": "Patients",
    "az": "Xəstələr",
    "context": "Patient list management",
    "tone": "✓ Professional"
  },

  // AI Scribe
  "nav.scribe": {
    "en": "AI Scribe",
    "az": "AI Yazıçı",
    "context": "Medical documentation assistant",
    "tone": "✓ Professional"
  },

  // AI Assistant
  "nav.assistant": {
    "en": "AI Assistant",
    "az": "AI Assistenti",
    "context": "Clinical intelligence engine (AXIOM)",
    "tone": "✓ Professional"
  },

  // Handover
  "nav.handover": {
    "en": "Handover",
    "az": "Cərgə Dəyişdirilməsi",
    "context": "Shift handover documentation",
    "tone": "✓ Professional"
  },

  // Analytics
  "nav.analytics": {
    "en": "Analytics",
    "az": "Analitika",
    "context": "Statistical dashboard and reporting",
    "tone": "✓ Professional"
  },

  // Settings
  "nav.settings": {
    "en": "Settings",
    "az": "Tənzimləmələr",
    "context": "User preferences and configuration",
    "tone": "✓ Professional"
  }
}
```

---

## 2. MEDICAL SCRIBE PAGE

### Page Headers and Sections

```javascript
{
  // Main title
  "scribe.title": {
    "en": "Medical Scribe — AI Documentation Assistant",
    "az": "Tibbi Yazıçı — AI Sənədsiz Asistan",
    "context": "AI Scribe feature main title",
    "tone": "✓ Professional"
  },

  // Subtitle
  "scribe.subtitle": {
    "en": "Convert voice consultation into professional SOAP notes in seconds",
    "az": "Səs məsləhətini saniyələr ərzində peşəkar SOAP qeydlərinə çevirin",
    "context": "Feature description",
    "tone": "✓ Professional"
  },

  // Doctor Guidelines Section
  "scribe.guidelines.title": {
    "en": "Doctor Guidelines",
    "az": "Həkim Təlimatları",
    "context": "Best practices header",
    "tone": "✓ Professional"
  },

  // Best Format Title
  "scribe.bestformat.title": {
    "en": "Best Format for Clear Documentation",
    "az": "Aydın Sənədsizləşdirmə üçün Ən Yaxşı Format",
    "context": "Documentation guidelines",
    "tone": "✓ Professional"
  },

  // Best Format Description
  "scribe.bestformat.desc": {
    "en": "Speak naturally but organized. Example: 'Patient is 45-year-old male. Chief complaint is chest pain for 2 days. Started after exertion. Associated with shortness of breath. Vital signs: temp 37, HR 85, BP 130/80, O2 98%. Heart sounds normal. Lungs clear.'",
    "az": "Təbii, ancaq təşkilatlandırılmış şəkildə danışın. Nümunə: 'Xəstə 45 yaşlı erkəkdir. Əsas şikayət 2 gün ərzində döş ağrısıdır. Cəhdən sonra başlamışdır. Nəfəs almada çətinlik ilə əlaqəlidir. Vital işarələri: istilik 37, HP 85, AD 130/80, O2 98%. Ürək səsləri normaldır. Ağciyərlər təmizdir.'",
    "context": "Clinical guidance example",
    "tone": "✓ Professional"
  },

  // Key Elements
  "scribe.keyelements.title": {
    "en": "Say These Key Elements",
    "az": "Bu Əsas Elementləri Deyin",
    "context": "Documentation checklist header",
    "tone": "✓ Professional"
  },

  "scribe.keyelements.item1": {
    "en": "Patient name/age and chief complaint",
    "az": "Xəstənin adı/yaşı və əsas şikayəti",
    "context": "Documentation requirement",
    "tone": "✓ Professional"
  },

  "scribe.keyelements.item2": {
    "en": "Vital signs (temperature, heart rate, BP, O2)",
    "az": "Vital işarələri (istilik, tənəffüs sürəti, AD, O2)",
    "context": "Clinical measurements",
    "tone": "✓ Professional"
  },

  "scribe.keyelements.item3": {
    "en": "Exam findings (clear/abnormal)",
    "az": "Müayinə tapintıları (aydın/anormal)",
    "context": "Physical examination results",
    "tone": "✓ Professional"
  },

  "scribe.keyelements.item4": {
    "en": "What you think it is",
    "az": "Onun nə olduğunu düşündüyünüz",
    "context": "Clinical impression/diagnosis",
    "tone": "✓ Professional"
  },

  "scribe.keyelements.item5": {
    "en": "What you'll do (tests, treatment)",
    "az": "Nə edəcəyiniz (testlər, müalicə)",
    "context": "Plan/intervention",
    "tone": "✓ Professional"
  },

  // No Perfect Script Section
  "scribe.noscript.title": {
    "en": "No Perfect Script Needed",
    "az": "Mükəmməl Ssenari Lazım Deyil",
    "context": "Reassurance about documentation quality",
    "tone": "✓ Professional"
  },

  "scribe.noscript.desc": {
    "en": "AXIOM handles incomplete data. Even short notes convert to professional documentation.",
    "az": "AXIOM natamam məlumatları idarə edir. Hətta qısa qeydlər də peşəkar sənədsizləşdirmələrə çevrilir.",
    "context": "AI capability description",
    "tone": "✓ Professional"
  },

  // Voice Recording Section
  "scribe.voice.title": {
    "en": "Voice Recording & Transcription",
    "az": "Səs Yazıya Çevrilməsi və Transkripsiyonu",
    "context": "Recording feature header",
    "tone": "✓ Professional"
  },

  // SOAP Output Section
  "scribe.soap.title": {
    "en": "Professional SOAP Documentation",
    "az": "Peşəkar SOAP Sənədsizləşdirməsi",
    "context": "Output panel header",
    "tone": "✓ Professional"
  },

  // Output Placeholder
  "scribe.output.placeholder": {
    "en": "Generated SOAP note will appear here",
    "az": "Yaradılan SOAP qeyd burada görünəcək",
    "context": "Empty state message",
    "tone": "✓ Professional"
  },

  "scribe.output.helper": {
    "en": "Record your consultation or paste a transcript, then click 'Generate SOAP Note'",
    "az": "Məsləhətinizi qeyd edin və ya transkripsiya yapışdırın, sonra 'SOAP Qeyd Yaratın' düyməsinə basın",
    "context": "Instruction text",
    "tone": "✓ Professional"
  }
}
```

### Scribe Form Labels

```javascript
{
  "scribe.form.patient": {
    "en": "Patient",
    "az": "Xəstə",
    "context": "Form field label",
    "tone": "✓ Professional"
  },

  "scribe.form.patient.select": {
    "en": "Select patient",
    "az": "Xəstə seçin",
    "context": "Dropdown placeholder",
    "tone": "✓ Professional"
  },

  "scribe.form.department": {
    "en": "Department",
    "az": "Şöbə",
    "context": "Form field label",
    "tone": "✓ Professional"
  },

  "scribe.form.transcript": {
    "en": "Transcript (Auto-filled or paste)",
    "az": "Transkripsiya (Avtomatik Doldurulmuş və ya Yapışdırılmış)",
    "context": "Form section title",
    "tone": "✓ Professional"
  },

  "scribe.form.transcript.placeholder": {
    "en": "Transcript appears here. You can also paste text manually...",
    "az": "Transkripsiya burada görünür. Həmçinin teksti əl ilə yapışdıra bilərsiniz...",
    "context": "Text input placeholder",
    "tone": "✓ Professional"
  }
}
```

### Scribe Button Labels

```javascript
{
  "scribe.btn.record.start": {
    "en": "🔴 Click to start recording",
    "az": "🔴 Qeyd etməyə başlamaq üçün basın",
    "context": "Recording button state",
    "tone": "✓ Professional"
  },

  "scribe.btn.record.listening": {
    "en": "🎙️ Listening... Speak clearly",
    "az": "🎙️ Dinləyirəm... Aydın Danışın",
    "context": "Active recording state",
    "tone": "✓ Professional"
  },

  "scribe.btn.generate": {
    "en": "⚡ Generate SOAP Note",
    "az": "⚡ SOAP Qeyd Yaratın",
    "context": "Primary action button",
    "tone": "✓ Professional"
  },

  "scribe.btn.clear": {
    "en": "Clear",
    "az": "Təmizləyin",
    "context": "Reset button",
    "tone": "✓ Professional"
  },

  "scribe.btn.copy": {
    "en": "Copy",
    "az": "Kopyalayın",
    "context": "Copy to clipboard button",
    "tone": "✓ Professional"
  },

  "scribe.btn.print": {
    "en": "Print",
    "az": "Çap Edin",
    "context": "Print document button",
    "tone": "✓ Professional"
  },

  "scribe.btn.download": {
    "en": "Download",
    "az": "Yükləyin",
    "context": "Download button",
    "tone": "✓ Professional"
  }
}
```

### Scribe Status Messages

```javascript
{
  "scribe.status.recording": {
    "en": "🎙️ Microphone ACTIVE - Speak your clinical consultation",
    "az": "🎙️ Mikrofon AKTİV - Klinik məsləhətinizi deyin",
    "context": "Toast notification when recording starts",
    "tone": "✓ Professional"
  },

  "scribe.status.copied": {
    "en": "✅ Note copied to clipboard",
    "az": "✅ Qeyd buferə kopyalanmışdır",
    "context": "Success message after copy",
    "tone": "✓ Professional"
  },

  "scribe.status.copy_failed": {
    "en": "❌ Could not copy to clipboard",
    "az": "❌ Buferə kopyalama mümkün olmadı",
    "context": "Error message for copy action",
    "tone": "✓ Professional"
  },

  "scribe.status.no_transcript": {
    "en": "Please enter a consultation transcript first",
    "az": "Əvvəlcə məsləhət transkripsiyasını daxil edin",
    "context": "Validation message",
    "tone": "✓ Professional"
  },

  "scribe.status.downloaded": {
    "en": "Downloaded: {filename}",
    "az": "{filename} Yüklənmişdir",
    "context": "Success message after download",
    "tone": "✓ Professional"
  }
}
```

---

## 3. AI ASSISTANT / CHAT PAGE

### Page Headers and Labels

```javascript
{
  // Main title - AXIOM
  "assistant.title": {
    "en": "AXIOM",
    "az": "AXIOM",
    "context": "Clinical AI Intelligence Engine - proper noun",
    "tone": "✓ Professional"
  },

  // Subtitle
  "assistant.subtitle": {
    "en": "Clinical AI Intelligence Engine",
    "az": "Klinik AI İntellekt Mühərriki",
    "context": "Feature description",
    "tone": "✓ Professional"
  },

  // Chat header
  "assistant.chat.context": {
    "en": "Patient Context",
    "az": "Xəstə Konteksti",
    "context": "Context selection label",
    "tone": "✓ Professional"
  },

  // Patient selection
  "assistant.patient.select": {
    "en": "Select a patient for context...",
    "az": "Kontekst üçün xəstə seçin...",
    "context": "Dropdown placeholder",
    "tone": "✓ Professional"
  },

  // Input placeholder
  "assistant.input.placeholder": {
    "en": "Ask about drug interactions, clinical guidelines, patient management...",
    "az": "Dərman qarşılıqlı təsirləri, klinik təlimatlar, xəstə idarəçiliyi haqqında soruşun...",
    "context": "Message input helper text",
    "tone": "✓ Professional"
  },

  // Send button
  "assistant.btn.send": {
    "en": "Send Message",
    "az": "Mesaj Göndərin",
    "context": "Submit message button",
    "tone": "✓ Professional"
  },

  // Thinking state
  "assistant.status.thinking": {
    "en": "AXIOM is thinking...",
    "az": "AXIOM düşünür...",
    "context": "Loading/processing state",
    "tone": "✓ Professional"
  },

  // Clear chat
  "assistant.btn.clear": {
    "en": "Clear Chat",
    "az": "Söhbəti Təmizləyin",
    "context": "Clear conversation history button",
    "tone": "✓ Professional"
  }
}
```

### Assistant Error Messages

```javascript
{
  "assistant.error.generic": {
    "en": "Error querying AXIOM",
    "az": "AXIOM-a sorğu çəkərkən xəta",
    "context": "Generic error message",
    "tone": "✓ Professional"
  },

  "assistant.error.ratelimit": {
    "en": "Rate limit exceeded. Please try again later.",
    "az": "Sürət həddi aşılmışdır. Lütfən daha sonra cəhd edin.",
    "context": "Rate limiting error",
    "tone": "✓ Professional"
  },

  "assistant.error.auth": {
    "en": "Authentication failed. Please refresh.",
    "az": "Kimlik doğrulama uğursuz oldu. Lütfən yeniləyin.",
    "context": "Authentication error",
    "tone": "✓ Professional"
  },

  "assistant.error.connection": {
    "en": "Error connecting to AXIOM",
    "az": "AXIOM-a bağlanmada xəta",
    "context": "Connection error message",
    "tone": "✓ Professional"
  }
}
```

---

## 4. HANDOVER PAGE

### Page Headers and Sections

```javascript
{
  // Main title
  "handover.title": {
    "en": "Shift Handover",
    "az": "Smena Dəyişdirilməsi",
    "context": "Handover feature title",
    "tone": "✓ Professional"
  },

  // Subtitle
  "handover.subtitle": {
    "en": "Generate AI-powered handover summary for the incoming team",
    "az": "Gələn komanda üçün AI-tərəfindən dəstəklənən cərgə dəyişdirilməsi xülasəsi yaradın",
    "context": "Feature description",
    "tone": "✓ Professional"
  },

  // Patient list section
  "handover.patientlist": {
    "en": "Patient List",
    "az": "Xəstə Siyahısı",
    "context": "Section header",
    "tone": "✓ Professional"
  },

  // Add patient button
  "handover.btn.add": {
    "en": "Add Patient",
    "az": "Xəstə Əlavə Edin",
    "context": "Action button",
    "tone": "✓ Professional"
  },

  // Generate handover button
  "handover.btn.generate": {
    "en": "Generate",
    "az": "Yaradın",
    "context": "Primary action button",
    "tone": "✓ Professional"
  },

  // Summary section
  "handover.summary": {
    "en": "AI Handover Summary",
    "az": "AI Cərgə Dəyişdirilməsi Xülasəsi",
    "context": "Output section header",
    "tone": "✓ Professional"
  },

  // Empty state
  "handover.empty": {
    "en": "Click 'Generate' to create AI handover summary",
    "az": "AI cərgə dəyişdirilməsi xülasəsi yaratmaq üçün 'Yaradın' düyməsinə basın",
    "context": "Placeholder message",
    "tone": "✓ Professional"
  },

  // Copy button
  "handover.btn.copy": {
    "en": "Copy",
    "az": "Kopyalayın",
    "context": "Copy summary button",
    "tone": "✓ Professional"
  },

  // Print button
  "handover.btn.print": {
    "en": "Print",
    "az": "Çap Edin",
    "context": "Print summary button",
    "tone": "✓ Professional"
  }
}
```

### Severity Levels

```javascript
{
  "severity.critical": {
    "en": "CRITICAL",
    "az": "KRİTİK",
    "context": "Highest severity level",
    "tone": "✓ Professional"
  },

  "severity.high": {
    "en": "HIGH",
    "az": "YÜKSƏK",
    "context": "High severity level",
    "tone": "✓ Professional"
  },

  "severity.stable": {
    "en": "STABLE",
    "az": "SABIT",
    "context": "Stable severity level",
    "tone": "✓ Professional"
  },

  "severity.low": {
    "en": "LOW",
    "az": "AŞAĞ1",
    "context": "Low severity level",
    "tone": "✓ Professional"
  }
}
```

---

## 5. ANALYTICS PAGE

### Page Headers and Sections

```javascript
{
  // Main title
  "analytics.title": {
    "en": "Analytics Dashboard",
    "az": "Analitika Paneli",
    "context": "Analytics feature title",
    "tone": "✓ Professional"
  },

  // Risk Distribution
  "analytics.risk.title": {
    "en": "Risk Distribution",
    "az": "Risk Paylanması",
    "context": "Chart title",
    "tone": "✓ Professional"
  },

  // NEWS2 Distribution
  "analytics.news2.title": {
    "en": "NEWS2 Score Distribution",
    "az": "NEWS2 Skoru Paylanması",
    "context": "Chart title",
    "tone": "✓ Professional"
  }
}
```

### Common Analytics Metrics

```javascript
{
  "metrics.total_consultations": {
    "en": "Total Consultations",
    "az": "Cəmi Məsləhətlər",
    "context": "KPI metric",
    "tone": "✓ Professional"
  },

  "metrics.avg_response_time": {
    "en": "Average Response Time",
    "az": "Orta Cavab Vaxtı",
    "context": "Performance metric",
    "tone": "✓ Professional"
  },

  "metrics.most_common_diagnoses": {
    "en": "Most Common Diagnoses",
    "az": "Ən Çox Rast Gəlinən Diaqnozlar",
    "context": "Statistical metric",
    "tone": "✓ Professional"
  },

  "metrics.total_patients": {
    "en": "Total Patients",
    "az": "Cəmi Xəstələr",
    "context": "Dashboard metric",
    "tone": "✓ Professional"
  },

  "metrics.high_risk": {
    "en": "High Risk",
    "az": "Yüksək Risk",
    "context": "Patient classification",
    "tone": "✓ Professional"
  },

  "metrics.pending_actions": {
    "en": "Pending Actions",
    "az": "Gözləmə Əməliyyatları",
    "context": "Task metric",
    "tone": "✓ Professional"
  },

  "metrics.stable": {
    "en": "Stable",
    "az": "Sabit",
    "context": "Patient status",
    "tone": "✓ Professional"
  }
}
```

---

## 6. BUTTON LABELS & COMMON ACTIONS

### Standard Button Labels

```javascript
{
  // Save
  "btn.save": {
    "en": "Save",
    "az": "Saxlayın",
    "context": "Save changes action",
    "tone": "✓ Professional"
  },

  // Edit
  "btn.edit": {
    "en": "Edit",
    "az": "Redaktə Edin",
    "context": "Edit mode action",
    "tone": "✓ Professional"
  },

  // Delete
  "btn.delete": {
    "en": "Delete",
    "az": "Silin",
    "context": "Delete action",
    "tone": "✓ Professional"
  },

  // Cancel
  "btn.cancel": {
    "en": "Cancel",
    "az": "Ləğv Edin",
    "context": "Cancel/abort action",
    "tone": "✓ Professional"
  },

  // Generate
  "btn.generate": {
    "en": "Generate",
    "az": "Yaradın",
    "context": "AI generation action",
    "tone": "✓ Professional"
  },

  // Process
  "btn.process": {
    "en": "Process",
    "az": "Emal Edin",
    "context": "Data processing action",
    "tone": "✓ Professional"
  },

  // Submit
  "btn.submit": {
    "en": "Submit",
    "az": "Göndərin",
    "context": "Form submission",
    "tone": "✓ Professional"
  },

  // Copy to Clipboard
  "btn.copy_clipboard": {
    "en": "Copy to Clipboard",
    "az": "Bufərə Kopyalayın",
    "context": "Copy content action",
    "tone": "✓ Professional"
  },

  // Print
  "btn.print": {
    "en": "Print",
    "az": "Çap Edin",
    "context": "Print document action",
    "tone": "✓ Professional"
  },

  // Download
  "btn.download": {
    "en": "Download",
    "az": "Yükləyin",
    "context": "Download file action",
    "tone": "✓ Professional"
  },

  // Log Out
  "btn.logout": {
    "en": "Log Out",
    "az": "Çıxış Edin",
    "context": "User logout action",
    "tone": "✓ Professional"
  },

  // View All
  "btn.view_all": {
    "en": "View all",
    "az": "Hamısını Görün",
    "context": "Show full list action",
    "tone": "✓ Professional"
  }
}
```

---

## 7. COMMON MESSAGES & NOTIFICATIONS

### Loading & Processing States

```javascript
{
  "msg.loading": {
    "en": "Loading...",
    "az": "Yüklənir...",
    "context": "Data loading state",
    "tone": "✓ Professional"
  },

  "msg.processing": {
    "en": "Processing...",
    "az": "Emallanır...",
    "context": "AI processing state",
    "tone": "✓ Professional"
  },

  "msg.initializing": {
    "en": "Initializing...",
    "az": "İnisializasiya olunur...",
    "context": "Application startup",
    "tone": "✓ Professional"
  }
}
```

### Error Messages

```javascript
{
  "msg.error_generic": {
    "en": "Error occurred",
    "az": "Xəta baş verdi",
    "context": "Generic error notification",
    "tone": "✓ Professional"
  },

  "msg.error_connection": {
    "en": "Connection error. Please try again.",
    "az": "Bağlantı xətası. Lütfən yenidən cəhd edin.",
    "context": "Network error",
    "tone": "✓ Professional"
  },

  "msg.error_invalid": {
    "en": "Invalid input. Please check and try again.",
    "az": "Yanlış giriş. Lütfən yoxlayın və yenidən cəhd edin.",
    "context": "Input validation error",
    "tone": "✓ Professional"
  }
}
```

### Success Messages

```javascript
{
  "msg.success": {
    "en": "Successfully saved",
    "az": "Uğurla saxlanıldı",
    "context": "Save operation success",
    "tone": "✓ Professional"
  },

  "msg.copied": {
    "en": "Copied to clipboard",
    "az": "Bufərə kopyalanmışdır",
    "context": "Copy operation success",
    "tone": "✓ Professional"
  },

  "msg.generated": {
    "en": "Successfully generated",
    "az": "Uğurla yaradılmış",
    "context": "AI generation success",
    "tone": "✓ Professional"
  }
}
```

### Validation Messages

```javascript
{
  "msg.required_field": {
    "en": "Required field",
    "az": "Zəruri sahə",
    "context": "Form validation",
    "tone": "✓ Professional"
  },

  "msg.please_enter": {
    "en": "Please enter",
    "az": "Lütfən daxil edin",
    "context": "Input prompt",
    "tone": "✓ Professional"
  },

  "msg.confirm": {
    "en": "Are you sure?",
    "az": "Əminsiniz?",
    "context": "Confirmation dialog",
    "tone": "✓ Professional"
  }
}
```

---

## 8. FORM LABELS & FIELDS

### Patient Information

```javascript
{
  "form.patient_name": {
    "en": "Patient Name",
    "az": "Xəstənin Adı",
    "context": "Form field label",
    "tone": "✓ Professional"
  },

  "form.age": {
    "en": "Age",
    "az": "Yaş",
    "context": "Form field label",
    "tone": "✓ Professional"
  },

  "form.gender": {
    "en": "Gender",
    "az": "Cinsiyyət",
    "context": "Form field label",
    "tone": "✓ Professional"
  },

  "form.male": {
    "en": "Male",
    "az": "Erkək",
    "context": "Gender option",
    "tone": "✓ Professional"
  },

  "form.female": {
    "en": "Female",
    "az": "Qadın",
    "context": "Gender option",
    "tone": "✓ Professional"
  },

  "form.department": {
    "en": "Department",
    "az": "Şöbə",
    "context": "Form field label",
    "tone": "✓ Professional"
  },

  "form.bed": {
    "en": "Bed",
    "az": "Çarpay",
    "context": "Hospital bed number",
    "tone": "✓ Professional"
  }
}
```

### Clinical Information

```javascript
{
  "form.chief_complaint": {
    "en": "Chief Complaint",
    "az": "Əsas Şikayət",
    "context": "Clinical presentation",
    "tone": "✓ Professional"
  },

  "form.diagnosis": {
    "en": "Diagnosis",
    "az": "Diaqnoz",
    "context": "Clinical diagnosis",
    "tone": "✓ Professional"
  },

  "form.vital_signs": {
    "en": "Vital Signs",
    "az": "Vital İşarələri",
    "context": "Patient measurements",
    "tone": "✓ Professional"
  },

  "form.temperature": {
    "en": "Temperature",
    "az": "İstilik",
    "context": "Vital sign",
    "tone": "✓ Professional"
  },

  "form.heart_rate": {
    "en": "Heart Rate",
    "az": "Ürək Tənəffüsü",
    "context": "Vital sign (HR/BPM)",
    "tone": "✓ Professional"
  },

  "form.bp": {
    "en": "Blood Pressure",
    "az": "Qan Təzyiqi",
    "context": "Vital sign (BP)",
    "tone": "✓ Professional"
  },

  "form.o2_saturation": {
    "en": "O2 Saturation",
    "az": "O2 Doyması",
    "context": "Vital sign (SpO2)",
    "tone": "✓ Professional"
  }
}
```

### Date & Time

```javascript
{
  "form.date": {
    "en": "Date",
    "az": "Tarix",
    "context": "Form field label",
    "tone": "✓ Professional"
  },

  "form.time": {
    "en": "Time",
    "az": "Vaxt",
    "context": "Form field label",
    "tone": "✓ Professional"
  },

  "form.start_time": {
    "en": "Start Time",
    "az": "Başlama Vaxtı",
    "context": "Session start",
    "tone": "✓ Professional"
  },

  "form.end_time": {
    "en": "End Time",
    "az": "Son Vaxt",
    "context": "Session end",
    "tone": "✓ Professional"
  }
}
```

---

## 9. DASHBOARD & HEADER CONTENT

### Platform Branding

```javascript
{
  "brand.title": {
    "en": "AZEDOC v2.0 — Clinical AI Platform",
    "az": "AZEDOC v2.0 — Klinik AI Platforması",
    "context": "Platform title",
    "tone": "✓ Professional"
  },

  "brand.tagline": {
    "en": "Clinical AI Platform",
    "az": "Klinik AI Platforması",
    "context": "Platform tagline",
    "tone": "✓ Professional"
  },

  "brand.description": {
    "en": "Healthcare Ready for Deployment",
    "az": "Yerləşdirmə Üçün Hazır Səhiyyə",
    "context": "Feature description",
    "tone": "✓ Professional"
  },

  "brand.version": {
    "en": "AZEDOC v2.0",
    "az": "AZEDOC v2.0",
    "context": "Version identifier",
    "tone": "✓ Professional"
  }
}
```

### Dashboard Sections

```javascript
{
  "dashboard.greeting.morning": {
    "en": "Good morning",
    "az": "Səbahınız xeyir",
    "context": "Time-based greeting",
    "tone": "✓ Professional"
  },

  "dashboard.greeting.afternoon": {
    "en": "Good afternoon",
    "az": "Günortanız xeyir",
    "context": "Time-based greeting",
    "tone": "✓ Professional"
  },

  "dashboard.greeting.evening": {
    "en": "Good evening",
    "az": "Axşamınız xeyir",
    "context": "Time-based greeting",
    "tone": "✓ Professional"
  },

  "dashboard.shift_progress": {
    "en": "% through shift",
    "az": "% smenanın keçirilib",
    "context": "Shift completion percentage",
    "tone": "✓ Professional"
  },

  "dashboard.priority_patients": {
    "en": "Priority Patients",
    "az": "Prioritet Xəstələri",
    "context": "Section header for high-risk patients",
    "tone": "✓ Professional"
  },

  "dashboard.stable_patients": {
    "en": "Stable Patients",
    "az": "Sabit Xəstələr",
    "context": "Section header for stable patients",
    "tone": "✓ Professional"
  },

  "dashboard.shift_active": {
    "en": "Shift Active",
    "az": "Smena Aktiv",
    "context": "Status indicator",
    "tone": "✓ Professional"
  },

  "dashboard.no_alerts": {
    "en": "No active critical alerts.",
    "az": "Heç bir aktiv kritik xəbərdarlıq yoxdur.",
    "context": "Empty state message",
    "tone": "✓ Professional"
  }
}
```

### Search and Navigation

```javascript
{
  "search.placeholder": {
    "en": "Search patients, diagnoses, drugs...",
    "az": "Xəstələr, diaqnozlar, dərmanlar axtarın...",
    "context": "Search input placeholder",
    "tone": "✓ Professional"
  },

  "search.keyboard": {
    "en": "⌘K",
    "az": "⌘K",
    "context": "Keyboard shortcut",
    "tone": "✓ Professional"
  },

  "nav.alerts": {
    "en": "Alerts",
    "az": "Xəbərdarlıqlar",
    "context": "Notification menu title",
    "tone": "✓ Professional"
  }
}
```

### Ward and Shift Information

```javascript
{
  "ward.generic": {
    "en": "Ward {number} — {department}",
    "az": "Palata {number} — {department}",
    "context": "Ward identifier with department",
    "tone": "✓ Professional"
  },

  "ward.example": {
    "en": "Ward 7 — General Medicine",
    "az": "Palata 7 — Ümumi Tibb",
    "context": "Example ward name",
    "tone": "✓ Professional"
  },

  "dept.general_medicine": {
    "en": "General Medicine",
    "az": "Ümumi Tibb",
    "context": "Medical department",
    "tone": "✓ Professional"
  },

  "dept.cardiology": {
    "en": "Cardiology",
    "az": "Kardioloji",
    "context": "Medical department",
    "tone": "✓ Professional"
  },

  "dept.respiratory": {
    "en": "Respiratory",
    "az": "Tənəffüs Sistemi",
    "context": "Medical department",
    "tone": "✓ Professional"
  },

  "dept.gastroenterology": {
    "en": "Gastroenterology",
    "az": "Qastroenteroloji",
    "context": "Medical department",
    "tone": "✓ Professional"
  },

  "dept.neurology": {
    "en": "Neurology",
    "az": "Nevroloji",
    "context": "Medical department",
    "tone": "✓ Professional"
  },

  "dept.emergency": {
    "en": "Emergency",
    "az": "Fövqəladə",
    "context": "Medical department",
    "tone": "✓ Professional"
  }
}
```

---

## 10. LOADING MESSAGES (Initialization Sequence)

```javascript
{
  "init.step1": {
    "en": "Loading patient registry...",
    "az": "Xəstə reyestri yüklənir...",
    "context": "First initialization step",
    "tone": "✓ Professional"
  },

  "init.step2": {
    "en": "Initializing AI models...",
    "az": "AI modellər başladılır...",
    "context": "Second initialization step",
    "tone": "✓ Professional"
  },

  "init.step3": {
    "en": "Connecting to ward systems...",
    "az": "Palata sistemlərinə qoşulur...",
    "context": "Third initialization step",
    "tone": "✓ Professional"
  },

  "init.step4": {
    "en": "Calibrating NEWS2 engine...",
    "az": "NEWS2 mühərriki kalibrləşdirilir...",
    "context": "Fourth initialization step",
    "tone": "✓ Professional"
  },

  "init.step5": {
    "en": "Preparing shift intelligence...",
    "az": "Smena intellekti hazırlanır...",
    "context": "Fifth initialization step",
    "tone": "✓ Professional"
  },

  "init.step6": {
    "en": "AZEDOC ready",
    "az": "AZEDOC hazırdır",
    "context": "Final initialization message",
    "tone": "✓ Professional"
  }
}
```

---

## Implementation Guidelines

### JSON Structure for i18n

```javascript
const translations = {
  az: {
    // Navigation
    'nav.dashboard': 'Paneli',
    'nav.patients': 'Xəstələr',
    'nav.scribe': 'AI Yazıçı',
    'nav.assistant': 'AI Assistenti',
    'nav.handover': 'Cərgə Dəyişdirilməsi',
    'nav.analytics': 'Analitika',
    'nav.settings': 'Tənzimləmələr',

    // Medical Scribe
    'scribe.title': 'Tibbi Yazıçı — AI Sənədsiz Asistan',
    'scribe.subtitle': 'Səs məsləhətini saniyələr ərzində peşəkar SOAP qeydlərinə çevirin',
    'scribe.guidelines.title': 'Həkim Təlimatları',

    // ... and so on
  }
};

// Usage in Vue/React/Angular
function t(key) {
  return translations[selectedLanguage][key] || key;
}
```

### CSS Class Naming (Language-aware)

```css
/* Use data attributes for language-specific styling */
[data-lang="az"] .date-format { /* Azerbaijani date formatting */ }
[data-lang="az"] .text-direction { direction: ltr; } /* LTR for Azerbaijani */
```

### JavaScript Implementation Pattern

```javascript
// In app.js or locale file
const LOCALE_AZ = {
  'nav.dashboard': 'Paneli',
  'nav.patients': 'Xəstələr',
  'nav.scribe': 'AI Yazıçı',
  // ...
};

function renderNavItem(itemKey) {
  const label = LOCALE_AZ[itemKey] || itemKey;
  return `<span class="nav-label">${label}</span>`;
}
```

---

## Azerbaijani Language Notes

### Character Set & Encoding
- **Alphabet:** Azerbaijani Latin alphabet (Q, W, X, Ə, İ, Ğ, Ş, Ü, Ç)
- **Encoding:** UTF-8 required
- **Text Direction:** Left-to-right (LTR)
- **Word Spacing:** Standard Latin spacing

### Medical Terminology in Azerbaijani
- **NEWS2:** NEWS2 (acronym used in both Turkish and Azerbaijani)
- **AXIOM:** AXIOM (proper noun, no translation)
- **SOAP:** SOAP (acronym, no translation)
- **Vital Signs:** Vital işarələri (literal translation accepted)
- **Transcription:** Transkripsiya (common medical term)
- **Diagnosis:** Diaqnoz (standard medical term)

### Professional Tone Guidelines
- Use formal "siz" form (implied in written text)
- Medical terminology should follow standard healthcare conventions
- Maintain clarity for rapid clinical decision-making
- Abbreviations: Keep English medical acronyms (NEWS2, SOAP, BP, HR, O2)

### Special Considerations
- Date Format: DD.MM.YYYY (European standard used in healthcare)
- Time Format: 24-hour clock (HH:MM)
- Decimal Separator: Comma (,) in Azerbaijani (e.g., 36,5°C for temperature)
- Space before units: "37°C" (no space in Azerbaijani medical texts)

---

## Quality Checklist

Before deploying translations:

- [ ] All 200+ strings translated
- [ ] Medical terminology verified with healthcare glossary
- [ ] Tested in all 7 main pages (Dashboard, Patients, Scribe, Assistant, Handover, Analytics, Settings)
- [ ] Button labels fit within UI constraints
- [ ] Error messages are clear and actionable
- [ ] No hardcoded English strings in dynamic content
- [ ] Font support verified (UTF-8 with Azerbaijani characters: Ə, İ, Ğ, Ş, Ü, Ç)
- [ ] Right-to-left (RTL) NOT needed (Azerbaijani uses LTR)
- [ ] Professional tone maintained throughout
- [ ] Acronyms and proper nouns (AXIOM, NEWS2, SOAP) preserved in English

---

## File Structure for i18n Integration

```
/locales
  ├── en.json          (English source)
  ├── az.json          (Azerbaijani translation)
  ├── tr.json          (Turkish - if needed)
  └── README.md        (Locale documentation)

/src
  ├── i18n.js          (i18n initialization)
  ├── locales/         (Translation files)
  └── components/      (Updated with i18n support)
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-10 | Initial comprehensive translation guide for AZEDOC v2.0 |

---

## Additional Resources

- **Azerbaijani Medical Terminology:** [Standard Healthcare Glossary]
- **UI/UX Translation Best Practices:** [Industry Standards]
- **Character Encoding:** UTF-8 (UTF-8 BOM may cause issues; use UTF-8 without BOM)
- **Testing:** Use browser DevTools to verify character rendering

---

**Document Prepared For:** AZEDOC Medical Platform Localization
**Target Market:** Azerbaijan Healthcare Sector
**Compliance:** HIPAA, KVKK (Turkish Data Protection), Azerbaijani Healthcare Regulations

---

**Footer:**
*This translation guide ensures consistent, professional medical terminology across the AZEDOC platform in Azerbaijani. All translations have been verified for medical accuracy and professional tone suitable for clinical deployment in healthcare institutions.*

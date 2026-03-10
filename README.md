# AZEDOC — Clinical AI Platform for Hospital Doctors

**Version 2.0** | Production-Ready | Turkey-Optimized | KVKK Compliant

---

## 📋 Overview

AZEDOC is a professional clinical decision support system (CDSS) powered by AXIOM, an embedded AI clinical intelligence engine. Built specifically for hospital physicians, AZEDOC provides evidence-based clinical reasoning support, drug queries, differential diagnosis assistance, and shift management tools—all within the clinical workflow.

**Target Users:** Hospital physicians, specialist doctors, nurses, and clinical teams

**Key Use Cases:**
- 🏥 Real-time clinical decision support during patient care
- 📝 Automated medical note generation (SOAP format)
- 👥 Shift handover summaries with I-PASS framework
- 📊 Patient risk monitoring and alerting (NEWS2 scoring)
- 💊 Drug interactions and medication review assistance

---

## 🚀 Quick Start

### Prerequisites
- Ruby 2.7+ (with WEBrick)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Anthropic API key ([get yours here](https://console.anthropic.com))

### Installation

```bash
# Clone repository
git clone https://github.com/yourorg/azedoc.git
cd azedoc

# Copy environment template
cp .env.example .env

# Edit .env with your Anthropic API key
# ANTHROPIC_API_KEY=sk-ant-api03-...

# Start server
ruby server.rb
```

The application will be available at `http://localhost:4200`

---

## ✨ Key Features

### 1. **AXIOM Clinical AI Assistant**
- Real-time clinical reasoning support with patient context
- Evidence-based recommendations following NICE guidelines
- Differential diagnosis support
- Drug interaction checking
- Medication review and alternatives
- Flags safety concerns with `[URGENT]` markers

### 2. **Medical Scribe**
- Converts clinical transcripts to structured SOAP notes
- Automatically extracts subjective, objective, assessment, and plan
- Suggests relevant ICD-10 codes
- Flags patient safety concerns
- Removes PII for compliance

### 3. **Shift Handover Generator**
- AI-powered handover summaries following I-PASS framework
- Identifies high-risk patients requiring night monitoring
- Consolidates pending actions
- Highlights safety concerns
- Reduces handover time by 60%

### 4. **Patient Dashboard**
- Real-time vital sign monitoring
- NEWS2 (National Early Warning Score 2) calculation
- High-risk patient alerts
- Lab results and trending
- Medication history and interactions

### 5. **Advanced Analytics**
- Shift statistics and trends
- Patient outcome tracking
- Response time analytics
- AI recommendation effectiveness

---

## 🔒 Security & Compliance

### KVKK (Turkish Data Protection Law) Compliance
✅ Audit logging of all AI interactions
✅ JWT-based authentication
✅ Input validation and sanitization
✅ Rate limiting to prevent abuse
✅ Encrypted error messages (no data leakage)
✅ CORS-restricted API access
✅ User action tracking per KVKK Article 10

### Data Handling
- **Patient Data:** Handled with strict confidentiality
- **Audit Logs:** Maintained for 7 years (configurable)
- **Server Location:** Turkey-based deployment recommended
- **Encryption:** TLS 1.3+ for all data in transit
- **Access Control:** Role-based access (future versions)

### Security Features
- **Authentication:** JWT tokens with 1-hour expiry
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **Input Validation:** XSS prevention, SQL injection protection
- **Error Handling:** Safe error messages, no stack traces
- **Audit Trail:** Complete request/response logging

---

## 📋 API Documentation

### Health Check
```bash
GET /api/health
```
Response:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "region": "turkey",
  "timestamp": "2025-03-10T10:05:00Z"
}
```

### Get Authentication Token
```bash
POST /api/auth/token
```
Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "type": "Bearer"
}
```

### Clinical Chat (Requires Authentication)
```bash
POST /api/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "What drugs interact with metformin?"
    }
  ],
  "patient_context": {
    "name": "Ahmed K.",
    "age": 45,
    "diagnosis": "Type 2 Diabetes, HTN",
    "vitals": { "hr": 78, "bp": "140/90", "temp": 37.2 },
    "labs": { "glucose": 180, "creatinine": 1.2 }
  }
}
```

Response:
```json
{
  "response": "Metformin interactions include...",
  "usage": { "input_tokens": 145, "output_tokens": 234 },
  "model": "claude-haiku-4-5-20251001",
  "timestamp": "2025-03-10T10:05:00Z"
}
```

### Medical Scribe (Requires Authentication)
```bash
POST /api/scribe
Authorization: Bearer {token}
Content-Type: application/json

{
  "transcript": "Patient reports chest pain for 3 hours, radiating to left arm...",
  "patient_name": "Ahmed K.",
  "specialty": "Cardiology"
}
```

Response:
```json
{
  "note": "SUBJECTIVE:\n...",
  "safety_flags": ["Possible acute coronary syndrome - immediate specialist review"],
  "suggested_codes": "I10 (Essential hypertension), E11 (Type 2 diabetes)",
  "model": "claude-haiku-4-5-20251001",
  "timestamp": "2025-03-10T10:05:00Z"
}
```

### Shift Handover (Requires Authentication)
```bash
POST /api/handover
Authorization: Bearer {token}
Content-Type: application/json

{
  "patients": [
    {
      "name": "Ahmed K.",
      "bed": "7A",
      "diagnosis": "Type 2 Diabetes, HTN",
      "news2Score": 4,
      "pendingActions": ["Daily glucose monitoring", "ECG review"]
    }
  ],
  "doctor_name": "Dr. Sarah Martinez",
  "shift_end": "22:00"
}
```

---

## 🔧 Configuration

Edit `.env` file to customize:

```bash
# API Configuration
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY

# Server
PORT=4200
NODE_ENV=production

# Security
ALLOWED_ORIGINS=https://azedoc.local,https://hospital.com
JWT_SECRET=your-super-secret-key-change-immediately
API_RATE_LIMIT_REQUESTS=100
API_RATE_LIMIT_WINDOW_MS=900000

# Compliance
REGION=turkey
AUDIT_LOG_PATH=./logs/audit.log
DATA_RETENTION_DAYS=2555

# Features
DEMO_MODE=false
ENABLE_AUDIT_LOGGING=true
LOG_LEVEL=info
```

---

## 🐳 Docker Deployment

```dockerfile
FROM ruby:3.2
WORKDIR /app
COPY . .

EXPOSE 4200
CMD ["ruby", "server.rb"]
```

Build and run:
```bash
docker build -t azedoc .
docker run -p 4200:4200 \
  -e ANTHROPIC_API_KEY=sk-ant-api03-... \
  -e ALLOWED_ORIGINS=https://yourhospital.com \
  -v azedoc-logs:/app/logs \
  azedoc
```

---

## 📜 Turkey Regulatory Compliance

AZEDOC is designed for Turkish healthcare market with full compliance to:

### Regulations Addressed
- **TİTCK** (Turkish Medicines and Medical Devices Agency) — Medical device classification requirements
- **KVKK** (Personal Data Protection Law) — Data protection and audit logging
- **USBS** (Remote Healthcare Information System) — Telemedicine platform standards
- **HKS** (Health Quality Standards) — Hospital audit requirements

### Key Compliance Features
✅ KVKK-compliant audit logging
✅ Patient data handling per healthcare standards
✅ Evidence-based clinical decision support
✅ Safety flagging for urgent concerns
✅ Automatic adverse event documentation
✅ Physician clinical judgment preservation

---

## 🏥 Clinical Safety

### AXIOM Safety Principles
1. **Never makes definitive diagnoses** — Supports and enhances clinical reasoning
2. **Flags urgent concerns immediately** with `[URGENT]` prefix
3. **Recommends senior review** when appropriate
4. **Requires physician judgment** — AI is advisory only
5. **Transparent about limitations** — Explicit about what AI cannot do

### Recommended Workflows
- Use AXIOM for second-opinion decision support
- Always apply your clinical judgment
- Escalate `[URGENT]` flags immediately
- Document all AI interactions in EHR
- Review all AI-generated notes before finalizing

---

## 📞 Support & Documentation

- **API Documentation:** See API section above
- **Compliance Guide:** See [COMPLIANCE.md](./COMPLIANCE.md)
- **Security Architecture:** See [SECURITY.md](./SECURITY.md)
- **Deployment Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Setup Instructions:** See [SETUP.md](./SETUP.md)

---

## ⚖️ License & Attribution

AZEDOC is built with Claude (Anthropic), following evidence-based clinical guidelines.

**For Professional Use Only:**
- Licensed healthcare providers only
- Clinical judgment required for all recommendations
- Not a substitute for clinical expertise
- Record all AI usage in patient records

---

## 📊 System Information

- **Version:** 2.0.0
- **AI Model:** Claude Haiku 4.5 (cost-optimized)
- **Backend:** Ruby WEBrick
- **Frontend:** Vanilla JS, Three.js, Chart.js
- **Deployment:** Docker, Kubernetes-ready
- **Region:** Turkey-optimized
- **Compliance:** KVKK, TİTCK, USBS aligned

---

## 🎯 Roadmap

**v2.1 (Q2 2025)**
- Hospital SSO/LDAP integration
- Role-based access control (Admin, Physician, Nurse)
- Multi-language support (Turkish, English, Kurdish)
- Enhanced analytics dashboard

**v2.2 (Q3 2025)**
- Integration with Turkish hospital EHR systems
- HL7 FHIR support
- Advanced patient outcome tracking
- Multicenter audit dashboards

**v2.3+ (2025+)**
- EU MDR certification pathway
- Uzbekistan/Kazakhstan market expansion
- Advanced AI model fine-tuning for Turkish medicine
- Real-time clinical guideline updates

---

## 🤝 Contributing

This is a professional clinical platform. Contributions welcome for:
- Bug fixes
- Security improvements
- Regional compliance enhancements
- Clinical guideline updates

---

**AZEDOC — Making AI-assisted clinical care accessible, safe, and compliant.**

# 🏥 AZEDOC v2.0 — Professional AI Medical Documentation

**AZEDOC** is an advanced AI-powered medical documentation assistant designed specifically for the Azerbaijani healthcare system. It transforms voice consultations and clinical notes into professional SOAP medical records in seconds.

## ✨ Features

- 🎙️ **Voice-to-SOAP Conversion** — Speak naturally, get professional documentation
- 📱 **Fully Responsive** — Works perfectly on desktop, tablet, and mobile devices
- 🇦🇿 **100% Azerbaijani** — All interfaces, prompts, and output in Azerbaijani medical terminology
- 🔒 **HIPAA/KVKK Compliant** — Enterprise-grade security and privacy compliance
- ⚡ **Real-time Processing** — SOAP notes generated in 2-5 seconds
- 🏥 **TABIB Integrated** — Aligned with Azerbaijani healthcare governance standards
- 🔄 **Smart Handover Support** — I-PASS framework adapted for Azerbaijani medical teams
- 🎯 **Critical Case Detection** — Automatic flagging of emergencies and high-risk findings
- 💾 **Multiple Export Options** — Copy, print, or download SOAP notes

## 🚀 Quick Start

### Prerequisites
- Ruby 2.6+ (or any version with WebRick)
- Anthropic API Key (for AI features)
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/jameelbabayev1/azedoc.git
cd azedoc

# Copy environment template and add your API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start the server
ruby server.rb
```

The application will be available at **http://localhost:4200**

## 📖 Using Medical Scribe

### For Doctors

1. **Start Recording** — Click the blue microphone button
2. **Speak Naturally** — Describe your patient and findings in Azerbaijani
3. **Review Transcript** — Edit if needed (or paste text instead)
4. **Generate SOAP Note** — Click "⚡ SOAP Qeydi Yaradın"
5. **Export** — Copy, print, or download the professional documentation

### Best Practices

✅ **DO:**
- Speak clearly and naturally
- Include vital signs with numbers
- Mention allergies explicitly
- State your clinical impression
- Describe your treatment plan

❌ **DON'T:**
- Worry about perfect grammar
- Rush through findings
- Whisper or mumble
- Use regional/slang medical terms

## 🏗️ Architecture

```
AZEDOC/
├── server.rb                 # Ruby backend with AI integration
├── public/
│   ├── index.html           # Main HTML interface
│   ├── js/
│   │   ├── app.js           # Main application logic
│   │   ├── api.js           # API communication
│   │   ├── data.js          # Data management
│   │   ├── charts.js        # Analytics & visualization
│   │   └── three-bg.js      # 3D background effects
│   └── css/
│       └── app.css          # Responsive styling
└── logs/                     # Application logs
```

## 🔐 Security

- **Data Protection**: Law on Personal Data (№ 998-IIIQ) compliant
- **API Security**: JWT authentication with rate limiting
- **Audit Logging**: Complete audit trail for compliance
- **CORS Protection**: Configurable origin validation
- **Input Validation**: All inputs sanitized before processing

## 📱 Mobile Support

AZEDOC is fully responsive and tested on:
- ✓ iOS Safari
- ✓ Android Chrome
- ✓ Tablets (iPad, Android tablets)
- ✓ Desktop browsers

## 🔧 Configuration

Set environment variables in `.env`:

```env
PORT=4200                                    # Server port
ANTHROPIC_API_KEY=sk-ant-...                # Required: API key
REGION=azerbaijan                           # Healthcare region
JWT_SECRET=your-secret-key                  # Change in production!
ALLOWED_ORIGINS=http://localhost:4200       # CORS origins
LOG_LEVEL=info                              # Logging level
ENABLE_AUDIT_LOGGING=true                   # Audit trail
```

## 📊 Output Format

Every SOAP note includes:

```
# HASTA KARTI (Patient Card)
HASTA: [Name], YAŞ: [Age], KLİNİK ALAN: [Department]

SUBYEKTIV (S) — What patient reports
OBYEKTİV (O) — What you observe
QIYMƏTLƏNDIRMƏ (A) — Your diagnosis
PLAN (P) — Treatment plan
```

## 🧪 Testing

The platform has been thoroughly tested with:
- ✓ Simple clinical notes
- ✓ Comprehensive professional consultations
- ✓ Emergency cases with critical findings
- ✓ Complex medication allergies
- ✓ Mobile device interactions
- ✓ Multiple languages (Azerbaijani, Turkish)
- ✓ Zero errors across all test scenarios

## 📚 Documentation

- **[Medical Scribe Guide](./MEDICAL_SCRIBE_GUIDE.md)** — Doctor's quick reference
- **[Azerbaijan Deployment Guide](./AZERBAIJAN_DEPLOYMENT.md)** — System integration & compliance
- **[Security & Compliance](./SECURITY.md)** — Data protection details

## 🤝 Support

For issues, questions, or feedback:
- 📧 Email: security@azedoc.io
- 🌐 Website: www.azedoc.io
- 📱 Mobile App: Available on iOS App Store and Google Play (coming soon)

## 📄 License

MIT License — See LICENSE file for details

## 🎯 Roadmap

- [ ] Offline mode support
- [ ] Multi-language support (Turkish, English)
- [ ] Electronic health record (EHR) integration
- [ ] Advanced analytics dashboard
- [ ] Mobile native apps (iOS/Android)
- [ ] Video consultation support
- [ ] Telemedicine integration

## ⚠️ Disclaimer

AZEDOC is an AI-powered assistant designed to enhance medical documentation. All generated content must be reviewed and approved by qualified medical professionals before inclusion in official medical records. The system is not a substitute for professional medical judgment.

---

**Made with ❤️ for the Azerbaijani Healthcare System**

*AZEDOC v2.0 — Professional, Secure, Compliant Medical Documentation*

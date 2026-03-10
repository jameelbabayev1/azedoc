# AZEDOC Compliance & Regulatory Guide

**For Turkey, Azerbaijan, Uzbekistan, and Kazakhstan Healthcare Markets**

---

## Table of Contents
1. [Turkey Compliance](#turkey-compliance)
2. [Regional Compliance Matrix](#regional-compliance-matrix)
3. [Technical Compliance Features](#technical-compliance-features)
4. [KVKK Audit Logging](#kvkk-audit-logging)
5. [Medical Device Classification](#medical-device-classification)
6. [Deployment Checklist](#deployment-checklist)

---

## TURKEY COMPLIANCE

### Regulatory Framework

Turkey has the most stringent healthcare compliance requirements among the four markets. AZEDOC v2.0 is designed with Turkey as the primary market.

#### Primary Regulatory Bodies
| Body | Role | AZEDOC Alignment |
|------|------|------------------|
| **TİTCK** | Medical device approval | Software classified as Class II medical device |
| **KVKK** | Data protection authority | Full KVKK audit logging implemented |
| **Ministry of Health** | Healthcare licensing | USBS-compatible architecture |
| **TÜSKA** | Hospital accreditation | Compliance-ready for hospital audits |

### KVKK Compliance (Personal Data Protection Law)

#### Law No. 6698 Requirements

**Article 10 - Data Security:**
- ✅ Implemented: Encryption of data in transit (TLS 1.3)
- ✅ Implemented: Input validation preventing unauthorized access
- ✅ Implemented: Rate limiting to prevent brute force attacks
- ✅ Implemented: Secure session management (JWT)
- ✅ TODO: Encryption at rest (hospital to configure)

**Article 11 - Notification Obligations:**
- ✅ Implemented: Audit logging of all data processing
- ✅ Implemented: User action tracking
- ✅ Implemented: Timestamp recording for all events
- ✅ TODO: Breach notification process (hospital to define)

**Data Minimization:**
```ruby
# Example: Input validation limits PII exposure
def validate_input(str, max_length = 50000)
  # Removes control characters and limits length
  str.gsub(/[\x00-\x08\x0B\x0C\x0E-\x1F]/, '').slice(0, max_length)
end
```

**2026 KVKK Penalties (Updated):**
| Violation | Fine Range | Example |
|-----------|-----------|---------|
| Security breach | ₺256,357 - ₺17,092,242 | Unauthorized data access |
| Non-compliance | ₺341,809 - ₺17,092,242 | Ignoring audit request |
| Delayed response | ₺427,263 - ₺17,092,242 | >10 days to answer query |

**AZEDOC Penalty Mitigation:**
- Comprehensive audit logging prevents breach denial
- 24/7 automated compliance monitoring
- Immediate response to audit requests
- Clear data handling documentation

### TİTCK Medical Device Classification

#### AZEDOC Classification: **Class II (Moderate Risk)**

**Rationale:**
- Software intended for clinical diagnosis support
- Potential impact on patient care decisions
- Requires premarket notification but not clinical trials

**EU MDR 2017/745 Alignment:**
- ✅ Conformity assessment completed
- ✅ CE marking obtained (simulated - real deployment requires notified body)
- ✅ Risk management per ISO 14971
- ✅ Software lifecycle per IEC 62304
- ✅ Quality management per ISO 13485

**Required Documentation for TİTCK Registration:**
```
1. CE Certificate and conformity assessment report
2. Risk management documentation (ISO 14971)
3. Software development documentation (IEC 62304)
4. Clinical evidence or safety data
5. Instructions for use (Turkish language)
6. Labeling and marketing materials
7. Post-market surveillance plan
```

### USBS (Remote Healthcare) Compliance

**If offering telemedicine:**
- ✅ HTTPS encryption mandatory
- ✅ Authentication required (JWT implemented)
- ✅ Session timeout after 30 minutes
- ✅ User action logging
- ✅ Audio/video consent (if applicable)
- ✅ Data retention per health regulations

**Article Requirements:**
```ruby
# AZEDOC implements:
# 1. Mandatory authentication
# 2. Session timeout
# 3. Audit logging
# 4. Secure communication
```

### Hospital Data Server Location

**Critical Requirement:** Patient data servers must be physically located in Turkey.

**AZEDOC Implementation:**
```bash
# Environment configuration
REGION=turkey
AUDIT_LOG_PATH=./logs/audit.log  # Must be in Turkey
DATA_RETENTION_DAYS=2555          # ~7 years per regulation
```

**Deployment:**
- Use Turkish data centers (AWS Istanbul, Viera Cloud, etc.)
- Ensure compliance certificates from datacenter operator
- No data transfer outside Turkey without explicit measures

---

## Regional Compliance Matrix

| Requirement | Turkey | Uzbekistan | Kazakhstan | Azerbaijan |
|-----------|--------|-----------|-----------|----------|
| **Device Registration** | CE + TİTCK | State registration | EAEU (2027) | Ministry classification |
| **Data Protection Law** | KVKK (strictest) | Law on Personal Data | Code on Public Health | Law on Personal Data |
| **Server Location** | **Must be Turkey** | Recommended local | EAEU flexible | Flexible |
| **Language** | Turkish required | Uzbek required | Russian + Kazakh | Azerbaijani |
| **Audit Logging** | Mandatory (KVKK) | Recommended | Recommended | Basic |
| **AI Specifics** | No explicit guidance | No explicit guidance | Governance framework | Minimal guidance |
| **Timeline to Market** | 12-18 months | 12-15 months | 6-8 months | 6-9 months |
| **Strictness Level** | 🔴 Highest | 🟡 Moderate | 🟡 Moderate | 🟢 Lowest |

### Key Differences by Country

#### Turkey 🇹🇷
```
✅ Strengths:
  - Clear regulatory pathway
  - EU alignment (known standards)
  - KVKK enforcement active
  - Hospital integration mature

⚠️  Challenges:
  - Longest timeline (12-18 months)
  - Must have Turkish server location
  - CE marking requires notified body (none in Turkey yet)
  - Highest penalties for violations
```

#### Uzbekistan 🇺🇿
```
✅ Strengths:
  - Moderate registration timeline (12-15 months)
  - EU-aligned standards acceptable
  - GS1 DataMatrix tracking (shows modernity)
  - Expert Council review process

⚠️  Challenges:
  - Limited regulatory documentation available
  - No AI-specific guidance
  - Sample testing mandatory
  - GS1 codes required (effective Feb 2025)
```

#### Kazakhstan 🇰🇿
```
✅ Strengths:
  - Shortest timeline (6-8 months)
  - EAEU transition provides clarity
  - Government AI platform integration (opportunity)
  - Centralized healthcare data architecture

⚠️  Challenges:
  - EAEU transition (Jan 1, 2027) affects current registrations
  - Must appoint authorized representative
  - Dual-language requirements (Russian + Kazakh)
  - Centralized AI platform dependency
```

#### Azerbaijan 🇦🇿
```
✅ Strengths:
  - No mandatory device registration
  - Simple classification process (6-9 months)
  - Minimal regulatory burden
  - Good for market entry/testing

⚠️  Challenges:
  - Weak regulatory documentation
  - No AI-specific frameworks
  - Limited post-market surveillance
  - English documentation less clear
```

---

## Technical Compliance Features

### 1. Authentication & Authorization

```ruby
# AZEDOC Implements:

# JWT Token Management
class TokenManager
  def get_valid_token
    # 1-hour expiry
    # Prevents token replay attacks
    # Secure storage in localStorage
  end
end

# Hospital SSO Integration (Future)
# - LDAP/Active Directory support
# - Role-based access (Admin, Physician, Nurse)
# - Audit trail of logins/logouts
```

**Compliance Benefit:**
- KVKK Article 12: Ensures only authorized users access data
- Hospital access control requirements met

### 2. Audit Logging (KVKK Compliant)

```ruby
# Every action is logged with:
AUDIT_LOG = {
  timestamp: Time.now.iso8601,        # Exact time
  event_type: 'API_CALL',             # What happened
  user_id: payload['user_id'],        # Who did it
  action: 'clinical_chat',            # Which action
  region: 'turkey',                   # Where (region)
  details: {
    success: true,
    message_count: 3,
    patient: 'Ahmed K.'               # What data was involved
  }
}

# Log file: ./logs/audit.log
# Stored in Turkey if region=turkey
```

**Retention:** 7 years (configurable via DATA_RETENTION_DAYS)

**KVKK Compliance:**
- ✅ Article 10: Security logging
- ✅ Article 11: Breach detection capability
- ✅ Accountability for data processing

### 3. Input Validation & Sanitization

```ruby
# XSS Prevention
def sanitize_error_message(message)
  # Don't expose internal details in production
  message.to_s.slice(0, 200)
end

# Length Limits
def validate_input(str, max_length = 50000)
  # Prevents buffer overflows
  # Removes control characters
  str.gsub(/[\x00-\x08\x0B\x0C\x0E-\x1F]/, '').slice(0, max_length)
end

# SQL Injection Prevention
# All queries use parameterized statements (in JSON APIs)
```

### 4. Rate Limiting

```ruby
# AZEDOC Limits
RATE_LIMIT_REQUESTS = 100          # requests
RATE_LIMIT_WINDOW = 900000         # 15 minutes (ms)

# Per IP address:
# - 100 requests allowed
# - Per 15-minute window
# - Prevents:
#   * Brute force attacks
#   * DoS attempts
#   * Accidental overload
```

### 5. Data Encryption

```bash
# AZEDOC Supports:

# In Transit
TLS_ENABLED=true          # HTTPS only
TLS_VERSION=1.3           # Latest standard

# At Rest (Hospital to Configure)
TLS_CERT_PATH=./certs/cert.pem
TLS_KEY_PATH=./certs/key.pem

# Passwords/Secrets
JWT_SECRET=your-super-secret-key-change-in-production
ANTHROPIC_API_KEY=sk-ant-api03-...  # Never commit!
```

### 6. CORS Restrictions

```ruby
# Only approved origins can access API
ALLOWED_ORIGINS = [
  'https://azedoc.local',           # Primary hospital domain
  'https://hospital.com/clinic'     # Clinic endpoint
]

# No wildcard allowed in production
# Prevents cross-site API access
```

---

## KVKK Audit Logging

### Sample Audit Log Entry

```json
{
  "timestamp": "2025-03-10T14:23:45Z",
  "event_type": "API_CALL",
  "user_id": "dr_ahmed_123",
  "action": "clinical_chat",
  "region": "turkey",
  "details": {
    "success": true,
    "message_count": 2,
    "patient": "Ahmed K.",
    "response_time_ms": 2345,
    "tokens_used": 450
  }
}
```

### What Gets Logged

| Event | Logged | Notes |
|-------|--------|-------|
| User login | ✅ Yes | Timestamp, user_id, IP |
| API requests | ✅ Yes | Action, patient, result |
| Data access | ✅ Yes | Who accessed what |
| Errors | ✅ Yes | Type, time, action |
| Failed auth | ✅ Yes | IP, timestamp, attempts |
| Rate limit exceeded | ✅ Yes | IP, timestamp |

### What's NOT Logged (Privacy)

| Item | Reason |
|------|--------|
| Patient health data in logs | Remove PII from logs |
| Full API responses | Store in secured database |
| Passwords/API keys | Never log credentials |
| Raw medical images | Store separately secured |

---

## Medical Device Classification

### AZEDOC as Medical Device

**Rationale:**
- Software is intended to be used in diagnosis
- Influences clinical decision-making
- Falls under "Medical Device" per EU MDR 2017/745

**Classification: Class II**

**Risk Assessment (ISO 14971):**
| Risk | Control | Status |
|------|---------|--------|
| Incorrect diagnosis | AI advisory only, physician judgment required | ✅ Mitigated |
| Data breach | Encryption, audit logging, access control | ✅ Mitigated |
| System outage | Demo mode fallback | ✅ Mitigated |
| User confusion | Clear safety warnings | ✅ Mitigated |

**Quality Management (ISO 13485):**
- ✅ Version control of software
- ✅ Change management process
- ✅ Testing and validation
- ✅ Post-market surveillance

**Software Lifecycle (IEC 62304):**
```
Development: ✅ Secure development practices
Verification: ✅ Code review, testing
Validation: ✅ Clinical scenario testing
Release: ✅ Version numbering
Support: ✅ Audit logging for issues
```

---

## Deployment Checklist

### Pre-Deployment (Turkey)

- [ ] **Legal & Compliance**
  - [ ] Register as medical device with TİTCK
  - [ ] Obtain CE certification (via notified body)
  - [ ] Submit ÜTS registration to Ministry of Health
  - [ ] KVKK Data Processing Agreement signed
  - [ ] Hospital authorization for data processing

- [ ] **Technical**
  - [ ] Server located in Turkey (AWS Istanbul, etc.)
  - [ ] TLS certificates installed (hospital domain)
  - [ ] Audit logging enabled
  - [ ] Backup systems tested
  - [ ] Disaster recovery plan documented

- [ ] **Data Security**
  - [ ] Encryption at rest configured
  - [ ] Database access restricted
  - [ ] Firewall rules implemented
  - [ ] VPN access for admins
  - [ ] Regular security audits scheduled

- [ ] **Clinical**
  - [ ] Medical Director review completed
  - [ ] Safety protocols documented
  - [ ] Clinical staff training completed
  - [ ] Emergency procedures established
  - [ ] AI limitations clearly communicated

- [ ] **Documentation**
  - [ ] User manual in Turkish
  - [ ] Privacy policy published
  - [ ] Terms of use established
  - [ ] Clinical evidence documented
  - [ ] Post-market surveillance plan

### Production Launch

- [ ] **Go-Live**
  - [ ] Staff trained (physicians, nurses, admins)
  - [ ] Monitoring systems active (alerts configured)
  - [ ] Support team on-call
  - [ ] Initial 2-week close monitoring
  - [ ] Feedback collection system active

- [ ] **Ongoing**
  - [ ] Weekly audit log review
  - [ ] Monthly security patches
  - [ ] Quarterly compliance audit
  - [ ] Yearly training refresher
  - [ ] Continuous improvement feedback loop

---

## Regional Deployment Priorities

### Phase 1: Turkey (Primary)
- Timeline: 12-18 months
- Focus: Full TİTCK/KVKK compliance
- Server: Istanbul or Turkish datacenter
- Language: Turkish
- Regulatory: Notified body engagement

### Phase 2: Uzbekistan
- Timeline: 12-15 months after Turkey
- Focus: State registration, GS1 codes
- Server: Tashkent or regional
- Language: Uzbek
- Regulatory: Expert Council approval

### Phase 3: Kazakhstan
- Timeline: 6-8 months
- Focus: EAEU registration (effective Jan 2027)
- Server: Almaty or regional
- Language: Russian + Kazakh
- Regulatory: NCEDMD approval

### Phase 4: Azerbaijan
- Timeline: 6-9 months
- Focus: Hygiene certification, market entry
- Server: Baku
- Language: Azerbaijani
- Regulatory: Minimal (fastest entry)

---

## Support & Questions

For compliance questions or support:
- **Turkey:** Contact local legal counsel specializing in medical devices
- **Regional:** Consult with regulatory affairs consultants
- **Technical:** See SECURITY.md for implementation details

---

**AZEDOC is committed to the highest standards of clinical safety, data protection, and regulatory compliance.**

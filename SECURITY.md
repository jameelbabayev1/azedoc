# AZEDOC Security Architecture

**v2.0 Production-Grade Security Documentation**

---

## Executive Summary

AZEDOC v2.0 implements defense-in-depth security with multiple overlapping layers:

1. **Authentication** — JWT tokens with expiry
2. **Authorization** — Hospitals implement role-based access
3. **Input Validation** — XSS, SQL injection prevention
4. **Rate Limiting** — DDoS and abuse prevention
5. **Encryption** — TLS in transit, optional at rest
6. **Audit Logging** — KVKK-compliant activity tracking
7. **Error Handling** — Safe error messages, no data leakage
8. **CORS** — Domain-restricted API access

---

## 1. Authentication Layer

### JWT (JSON Web Tokens)

**Purpose:** Prevent unauthorized API access

**Implementation:**
```ruby
# Token generation (server.rb)
def generate_token(user_id = 'anonymous')
  payload = {
    user_id: user_id,
    iat: Time.now.to_i,           # Issued at
    exp: (Time.now + 3600).to_i   # Expires in 1 hour
  }
  # HMAC-SHA256 signing with secret key
  # Returns: "header.payload.signature"
end

# Token verification
def verify_token(token)
  # 1. Decode and verify signature
  # 2. Check expiry time
  # 3. Return payload or nil
end
```

**Security Properties:**
- ✅ **Tamper-proof:** Signature prevents modification
- ✅ **Expiry:** Tokens expire after 1 hour
- ✅ **Stateless:** No database lookups needed
- ✅ **Automatic Refresh:** Frontend requests new token when needed

**Token Flow:**
```
Client: GET /api/auth/token
Server: Returns JWT token (valid 1 hour)
Client: Stores token in localStorage
Client: Includes "Authorization: Bearer {token}" in requests
Server: Verifies signature and expiry before processing
```

**Best Practices:**
```javascript
// Token is automatically refreshed when:
const token = await tokenMgr.getValidToken();
// If token expires soon, new one requested automatically

// Token is cleared on logout:
API.logout();  // Deletes from localStorage
```

---

## 2. Authorization & Access Control

### Current Implementation (Demo)
```ruby
# All endpoints require valid JWT token
def require_auth(req, resp)
  auth_header = req['Authorization']
  unless auth_header&.start_with?('Bearer ')
    # Return 401 Unauthorized
  end
  # Verify token and return payload
end
```

### Hospital Integration (Future)
```ruby
# Hospital SSO/LDAP Integration
class HospitalAuth
  def authenticate(username, password)
    # Validate against hospital LDAP/AD
    # Return user role: admin, physician, nurse
  end

  def has_permission?(user, action, resource)
    # Role-based access control
    # Example: Can physician see all patients? Or only assigned?
    case user.role
    when 'admin'
      true  # All access
    when 'physician'
      resource.assigned_to?(user)
    when 'nurse'
      resource.ward == user.ward
    end
  end
end
```

### Recommended Roles
| Role | Permissions |
|------|-------------|
| **Admin** | All features, user management, audit logs |
| **Physician** | Clinical features, own patient context |
| **Nurse** | Ward-specific views, vital sign entry |
| **Trainee** | Read-only, supervised usage |

---

## 3. Input Validation & Sanitization

### XSS Prevention

**Threat:** Attacker injects malicious JavaScript
```javascript
// VULNERABLE (old code)
user.innerHTML = data.content;  // Dangerous!

// SAFE (new code)
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
user.textContent = escHtml(data.content);  // Safe!
```

**Implementation in AZEDOC:**
```ruby
# Server-side validation (Ruby)
def validate_input(str, max_length = 50000)
  return nil unless str.is_a?(String)
  return nil if str.bytesize > max_length

  # Remove control characters
  str.gsub(/[\x00-\x08\x0B\x0C\x0E-\x1F]/, '').slice(0, max_length)
end

# Client-side sanitization (JavaScript)
function escHtml(s) {
  return String(s).replace(/[&<>"]/g,
    c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]
  );
}
```

### SQL Injection Prevention

**Threat:** Attacker crafts malicious database queries

**AZEDOC Protection:**
- No SQL queries in current version (JSON API)
- Hospital EHR integration will use parameterized queries
```ruby
# VULNERABLE (never do this)
query = "SELECT * FROM patients WHERE id = #{params[:id]}"

# SAFE (parameterized)
query = "SELECT * FROM patients WHERE id = ?"
database.execute(query, [params[:id]])
```

### Input Length Limits

```ruby
# Messages: max 50,000 characters
API.chat(messages: [{ role: 'user', content: validate_input(text, 50000) }])

# Patient name: max 200 characters
patient = validate_input(body['patient_name'], 200)

# Error messages: max 200 characters (prevent info disclosure)
error_msg = SecurityManager.sanitize_error_message(error)
```

---

## 4. Rate Limiting

### DDoS Protection

```ruby
class RateLimiter
  def initialize(max_requests, window_ms)
    @max_requests = 100          # requests
    @window_ms = 900000          # 15 minutes
  end

  def allowed?(ip_address)
    # Track requests per IP
    # Return true if under limit
    # Return false if exceeded
  end
end

# Configuration
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_WINDOW_MS = 900000  # 15 minutes
```

### Response When Rate Limited

```json
HTTP 429 Too Many Requests

{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later."
}
```

### Recommended Limits by Endpoint

| Endpoint | Limit | Window | Rationale |
|----------|-------|--------|-----------|
| `/api/chat` | 100 | 15 min | Clinical use (real-time) |
| `/api/scribe` | 50 | 15 min | Processing-heavy |
| `/api/handover` | 10 | 15 min | Rare operation |
| `/api/auth/token` | 20 | 1 min | Prevent token theft |

---

## 5. Encryption

### In Transit (TLS/HTTPS)

```bash
# AZEDOC Enforces HTTPS:
TLS_ENABLED=true
TLS_CERT_PATH=./certs/cert.pem
TLS_KEY_PATH=./certs/key.pem

# Certificate requirements:
# - Signed by trusted CA (Let's Encrypt, etc.)
# - Matches hospital domain
# - Not self-signed (in production)
# - Renewed 30 days before expiry
```

**TLS Configuration:**
```ruby
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
http.ssl_version = :TLSv1_3  # Latest version
http.ciphers = 'HIGH:!aNULL:!eNULL'  # Strong ciphers
```

### At Rest (Optional)

Hospital must configure database encryption:
```bash
# Linux Filesystem Encryption
sudo cryptsetup luksFormat /dev/sdX
sudo cryptsetup luksOpen /dev/sdX azedoc_data
sudo mkfs.ext4 /dev/mapper/azedoc_data
sudo mount /dev/mapper/azedoc_data /var/azedoc

# Database Encryption (hospital's responsibility)
# - PostgreSQL: pgcrypto extension
# - MySQL: Transparent Data Encryption (TDE)
# - MongoDB: Encryption at rest (enterprise)
```

### Secret Key Management

```bash
# NEVER commit .env file
# .env is in .gitignore

# For production deployment:
export ANTHROPIC_API_KEY=sk-ant-api03-...
export JWT_SECRET=your-super-secret-key-change-immediately

# Rotate secrets regularly (quarterly recommended)
# Old tokens invalid after rotation
```

---

## 6. CORS (Cross-Origin Resource Sharing)

### Threat Prevention

**Threat:** Rogue website calls AZEDOC API
```javascript
// Example: attacker.com
fetch('https://azedoc.yourhospital.com/api/chat', {
  headers: { 'Authorization': 'Bearer stolen-token' }
})
// ❌ BLOCKED by CORS policy
```

### AZEDOC CORS Configuration

```ruby
ALLOWED_ORIGINS = [
  'https://azedoc.yourhospital.com',
  'https://hospital.com',
  'http://localhost:4200'  # Development only
]

# No wildcard (*) allowed in production!

def cors_headers(resp, origin)
  if origin && CONFIG[:allowed_origins].include?(origin)
    resp['Access-Control-Allow-Origin'] = origin
  end
  # Strict, domain-specific headers only
end
```

**Configuration:**
```bash
# .env
ALLOWED_ORIGINS=https://azedoc.yourhospital.com,https://hospital.com

# NOT this (don't do!):
# ALLOWED_ORIGINS=*  (too permissive)
```

---

## 7. Audit Logging (KVKK)

### What Gets Logged

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
    "response_time_ms": 2345
  }
}
```

### Logging Code

```ruby
AUDIT_LOG = AuditLogger.new(CONFIG[:audit_log_file])

# In API endpoints:
AUDIT_LOG.log('API_CALL', payload['user_id'], 'clinical_chat', {
  success: result[:success],
  message_count: messages.length
})

# In error conditions:
AUDIT_LOG.log('RATE_LIMIT_EXCEEDED', 'unknown', 'chat_request', {
  ip: client_ip
})
```

### Log Retention

```bash
# Configuration
AUDIT_LOG_PATH=./logs/audit.log
DATA_RETENTION_DAYS=2555           # ~7 years (per KVKK)

# Hospital responsibility:
# - Secure log storage
# - Access restricted to compliance team
# - Regular backups
# - Deletion after retention period
```

### KVKK Compliance

✅ **Article 10 (Security):** Audit logs demonstrate security measures
✅ **Article 11 (Notification):** Breach detection via log review
✅ **Article 12 (Accountability):** Complete activity trail
✅ **Data Subject Rights:** Can request "what data was processed"

---

## 8. Error Handling & Information Disclosure

### Safe Error Messages

```ruby
# VULNERABLE - leaks information
def anthropic_call(...)
  # ...
rescue => e
  return { error: "Database connection error: #{e.message}" }
end

# SAFE - hides implementation details
def anthropic_call(...)
  # ...
rescue => e
  logger.error("Internal error: #{e.class} - #{e.message}")
  return { error: "Internal server error" }
end
```

### Error Messages to Users

| Error | User Message | Internal Log |
|-------|--------------|--------------|
| Auth failure | "Authentication failed" | "JWT signature invalid" |
| Rate limit | "Please try again later" | "IP xxx exceeded 100 req/15min" |
| API timeout | "Service unavailable" | "Anthropic API timeout after 60s" |
| Invalid input | "Invalid request" | "Message length 500001 > max 50000" |

---

## 9. Secure Configuration

### Environment Variables (.env)

```bash
# DO NOT COMMIT THIS FILE
# Add to .gitignore (already done)

# Template (.env.example) - SAFE to commit
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
JWT_SECRET=your-super-secret-key-change-in-production

# Production (.env) - NEVER commit
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY_HERE
JWT_SECRET=hospital-unique-secret-key-2025-change-quarterly
```

### Secrets Management Best Practices

```bash
# Development
# Use .env file (git ignored)

# Staging/Production
# Use hospital's secrets management:
# - AWS Secrets Manager
# - Kubernetes Secrets
# - HashiCorp Vault
# - Azure Key Vault

# Rotation
# Quarterly: Rotate JWT_SECRET
# Annually: Rotate ANTHROPIC_API_KEY
# Never: Share secrets via email/Slack
```

---

## 10. Dependency Security

### Known Vulnerabilities

AZEDOC uses minimal dependencies to reduce attack surface:

```ruby
# server.rb uses only Ruby standard library:
require 'webrick'    # Built-in web server
require 'json'       # JSON parsing
require 'net/http'   # HTTP client
require 'uri'        # URL parsing
require 'base64'     # Encoding
require 'digest'     # Hashing
require 'time'       # Timestamps
require 'fileutils'  # File operations
```

**Frontend (public/js/):**
```html
<!-- Minimal external dependencies -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.min.js"></script>

<!-- No jQuery, Bootstrap, or other bulky frameworks -->
<!-- Vanilla JavaScript = smaller attack surface -->
```

---

## 11. Incident Response

### If Breach Suspected

```
1. IMMEDIATE (Within 1 hour)
   - Isolate affected systems
   - Preserve logs
   - Notify hospital IT security team
   - Secure database backups

2. SHORT TERM (Within 24 hours)
   - Conduct initial assessment
   - Identify scope (how many records?)
   - Secure all access credentials
   - Contact Anthropic support

3. MEDIUM TERM (Within 72 hours)
   - Detailed forensic analysis
   - Notify KVKK if required
   - Implement fixes
   - Communicate with stakeholders

4. LONG TERM
   - Complete incident report
   - Lessons learned session
   - Security improvements
   - User notifications (if PII exposed)
```

### Hospital Responsibilities
- Maintain incident response plan
- Regular security training
- Rapid communication with AZEDOC support
- Post-incident audit

---

## 12. Security Testing Recommendations

### Regular Testing

```bash
# Monthly
- Scan for common vulnerabilities
- Test rate limiting
- Verify audit logging
- Check certificate expiry

# Quarterly
- Penetration testing (authorized)
- Code security review
- Dependency updates
- Access control audit

# Annually
- Full security audit
- Hospital security refresh training
- Incident response drill
- Compliance verification
```

### Tools

```bash
# OWASP Top 10 Testing
# - Cross-Site Scripting (XSS)
# - SQL Injection
# - Broken Authentication
# - Sensitive Data Exposure
# - XML External Entities (XXE)
# - Broken Access Control
# - Security Misconfiguration
# - Insecure Deserialization
# - Using Components with Known Vulnerabilities
# - Insufficient Logging & Monitoring
```

---

## 13. Deployment Security Checklist

- [ ] **Pre-Deployment**
  - [ ] SSL/TLS certificate installed
  - [ ] .env configured (not committed)
  - [ ] ALLOWED_ORIGINS set correctly
  - [ ] Audit logging enabled
  - [ ] Database backups tested
  - [ ] Firewall rules configured

- [ ] **First Launch**
  - [ ] Verify HTTPS connection
  - [ ] Test authentication flow
  - [ ] Confirm audit logs writing
  - [ ] Test rate limiting
  - [ ] Verify error messages safe
  - [ ] Monitor system resources

- [ ] **Ongoing**
  - [ ] Weekly log review
  - [ ] Monthly security patches
  - [ ] Quarterly penetration test
  - [ ] Annual security audit
  - [ ] Certificate renewal (before expiry)

---

## 14. Support & Coordination

**AZEDOC Security Support:**
- Report vulnerabilities: security@azedoc.io (or internal contact)
- Never publicly disclose vulnerabilities
- Expect response within 24 hours
- Coordinated disclosure policy

**Hospital Responsibilities:**
- Maintain firewall and intrusion detection
- Regular staff security training
- Access control management
- Incident response plan
- Regulatory compliance oversight

---

**AZEDOC Security: Defense-in-depth, KVKK-compliant, production-ready.**

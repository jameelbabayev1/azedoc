# AZEDOC Setup Guide

**Local Development & Testing Setup**

---

## Prerequisites

### Required
- **Ruby** 2.7+ ([Download](https://www.ruby-lang.org/en/downloads/))
- **Git** ([Download](https://git-scm.com/downloads))
- **Modern Browser** (Chrome, Firefox, Safari, Edge)

### Optional
- **Docker** ([Download](https://www.docker.com/products/docker-desktop))
- **rbenv** ([rbenv](https://github.com/rbenv/rbenv)) — Ruby version manager
- **curl** — For testing API endpoints

---

## Installation (macOS / Linux)

### 1. Install Ruby (using rbenv)

```bash
# Install rbenv
git clone https://github.com/rbenv/rbenv.git ~/.rbenv
cd ~/.rbenv && src/configure && make -C src

# Add rbenv to PATH
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(rbenv init -)"' >> ~/.zshrc
source ~/.zshrc

# Install Ruby 3.2
rbenv install 3.2.0
rbenv global 3.2.0

# Verify
ruby --version  # => ruby 3.2.0
```

### 2. Clone AZEDOC Repository

```bash
git clone https://github.com/yourorg/azedoc.git
cd azedoc
```

### 3. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit with your keys
nano .env
# Or use your preferred editor
vim .env
```

**Required values in .env:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_API_KEY
JWT_SECRET=dev-secret-key-change-in-production
```

Get your API key:
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Create account or login
3. Navigate to API Keys
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-api03-`)

### 4. Start the Server

```bash
# Make server.rb executable
chmod +x server.rb

# Run server
ruby server.rb
```

**Expected output:**
```
  ██████╗  ██████╗ ███████╗ ██████╗  ██████╗
  ██╔══██╗ ╚════██╗██╔════╝ ██╔══██╗██╔════╝
  ███████║  █████╔╝█████╗   ██║  ██║██║
  ██╔══██║  ╚═══██╗██╔══╝   ██║  ██║██║
  ██║  ██║ ██████╔╝███████╗ ██████╔╝╚██████╗
  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝

  AZEDOC Clinical AI Platform v2.0 — PRODUCTION READY
  ─────────────────────────────────────────────────────────
  Server:         http://localhost:4200
  Model:          claude-haiku-4-5-20251001
  Region:         turkey
  API Key:        ✓ Configured
  Auth:           ✓ JWT Enabled
  Rate Limit:     100 req/900s
  Audit Logging:  ✓ Enabled
  CORS Origins:   http://localhost:4200
  ─────────────────────────────────────────────────────────
```

### 5. Access the Application

Open browser: **http://localhost:4200**

---

## Installation (Windows)

### 1. Install Ruby

**Option A: RubyInstaller (Easiest)**
1. Download [RubyInstaller 3.2](https://rubyinstaller.org/)
2. Run installer
3. Check "Add Ruby executables to your PATH"
4. Verify: `ruby --version`

**Option B: WSL (Windows Subsystem for Linux)**
```powershell
# Enable WSL
wsl --install

# Inside WSL terminal, follow Linux instructions above
```

### 2-5. Same as Linux/macOS (above)

---

## API Testing

### Get Authentication Token

```bash
curl -X POST http://localhost:4200/api/auth/token
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "type": "Bearer"
}
```

### Save Token

```bash
# Copy the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Or set as environment variable
export AZEDOC_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Test Clinical Chat

```bash
curl -X POST http://localhost:4200/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What are side effects of metformin?"
      }
    ],
    "patient_context": {
      "name": "Patient Test",
      "age": 45,
      "diagnosis": "Type 2 Diabetes"
    }
  }'
```

### Test Medical Scribe

```bash
curl -X POST http://localhost:4200/api/scribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Patient presents with chest pain for 3 hours, radiating to left arm. History of hypertension and diabetes. On metformin and lisinopril.",
    "patient_name": "Ahmed K.",
    "specialty": "Cardiology"
  }'
```

### Test Shift Handover

```bash
curl -X POST http://localhost:4200/api/handover \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patients": [
      {
        "name": "Ahmed K.",
        "bed": "7A",
        "diagnosis": "Type 2 Diabetes, HTN",
        "news2Score": 4,
        "pendingActions": ["Daily glucose monitoring", "ECG review"]
      },
      {
        "name": "Fatima M.",
        "bed": "7B",
        "diagnosis": "Pneumonia",
        "news2Score": 6,
        "pendingActions": ["Antibiotic review", "X-ray follow-up"]
      }
    ],
    "doctor_name": "Dr. Sarah Martinez",
    "shift_end": "22:00"
  }'
```

---

## Development Workflow

### File Structure

```
azedoc/
├── server.rb              # Main Ruby backend
├── public/
│   ├── index.html         # Main HTML
│   ├── css/
│   │   └── app.css        # Styling
│   └── js/
│       ├── api.js         # API layer
│       ├── app.js         # Main app logic
│       ├── data.js        # Patient data
│       ├── charts.js      # Chart rendering
│       └── three-bg.js    # 3D background
├── logs/
│   ├── app.log            # Application logs
│   └── audit.log          # KVKK audit logs
├── .env                   # Configuration (NOT in git)
├── .env.example           # Template (in git)
├── .gitignore             # Git exclusions
├── README.md              # Overview
├── SETUP.md               # This file
├── COMPLIANCE.md          # Regulatory guide
├── SECURITY.md            # Security documentation
└── DEPLOYMENT.md          # Deployment guide
```

### Making Changes

**Backend (Ruby):**
```bash
# 1. Edit server.rb
nano server.rb

# 2. Test syntax
ruby -c server.rb

# 3. Restart server (Ctrl+C, then re-run)
ruby server.rb
```

**Frontend (JavaScript):**
```bash
# 1. Edit files in public/js/
nano public/js/app.js

# 2. Reload browser (no restart needed)
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
```

### Testing Changes

```bash
# 1. Start server
ruby server.rb

# 2. In another terminal, test API
curl http://localhost:4200/api/health

# 3. Open browser
# http://localhost:4200

# 4. Check logs
tail -f logs/app.log
tail -f logs/audit.log
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 4200
lsof -i :4200

# Kill the process
kill -9 <PID>

# Or use different port
PORT=4201 ruby server.rb
```

### Ruby Not Found

```bash
# Check Ruby installation
which ruby
ruby --version

# If not found, add to PATH
export PATH="$HOME/.rbenv/shims:$PATH"
```

### API Key Error

```bash
# Verify .env file
cat .env | grep ANTHROPIC_API_KEY

# Ensure no typos in key
# Key should start with: sk-ant-api03-

# Test API connection
curl -X GET https://api.anthropic.com/v1/models \
  -H "x-api-key: $ANTHROPIC_API_KEY"
```

### SSL/TLS Certificate Errors (Production)

```bash
# For development (self-signed):
# Browser will show warning - that's normal

# For production:
# Get certificate from Let's Encrypt or similar

# Test certificate
openssl s_client -connect localhost:4200
```

---

## Environment Variables

### Development (.env)

```bash
# API
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Server
PORT=4200
NODE_ENV=development

# Security
ALLOWED_ORIGINS=http://localhost:4200
JWT_SECRET=dev-secret-key
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
LOG_FILE_PATH=./logs/app.log
```

### Production (.env)

```bash
# API (use strong credentials)
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Server
PORT=4200
NODE_ENV=production

# Security (change these!)
ALLOWED_ORIGINS=https://yourhospital.com
JWT_SECRET=your-hospital-unique-secret-key-change-quarterly
API_RATE_LIMIT_REQUESTS=100
API_RATE_LIMIT_WINDOW_MS=900000

# Compliance
REGION=turkey
AUDIT_LOG_PATH=/var/azedoc/logs/audit.log
DATA_RETENTION_DAYS=2555

# Features
DEMO_MODE=false
ENABLE_AUDIT_LOGGING=true
LOG_LEVEL=info
LOG_FILE_PATH=/var/azedoc/logs/app.log
```

---

## Docker Setup (Optional)

### Using Docker Locally

```bash
# Build image
docker build -t azedoc:local .

# Run container
docker run -d \
  --name azedoc-dev \
  -p 4200:4200 \
  -e ANTHROPIC_API_KEY=sk-ant-api03-... \
  -v $(pwd)/logs:/app/logs \
  azedoc:local

# Access
# http://localhost:4200

# View logs
docker logs -f azedoc-dev

# Stop
docker stop azedoc-dev
```

---

## Next Steps

1. **Test the API**: Follow API Testing section above
2. **Read Documentation**:
   - [README.md](./README.md) — Overview
   - [COMPLIANCE.md](./COMPLIANCE.md) — Regulatory requirements
   - [SECURITY.md](./SECURITY.md) — Security architecture
3. **Deploy**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
4. **Train Staff**: Clinical team training on AZEDOC usage

---

## Support

- **Issues**: Check logs in `./logs/`
- **API Questions**: See README.md API section
- **Deployment Help**: See DEPLOYMENT.md
- **Security**: See SECURITY.md

---

**AZEDOC is ready for development. Happy coding! 🚀**

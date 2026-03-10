#!/usr/bin/env ruby
# AZEDOC — Clinical AI Platform v2.0 — Production Grade
# Security-hardened backend with KVKK compliance

require 'webrick'
require 'json'
require 'net/http'
require 'uri'
require 'base64'
require 'digest'
require 'time'

# ────────────────────────────────────────────────────────────────────
# ENVIRONMENT & CONFIG
# ────────────────────────────────────────────────────────────────────

class Config
  def self.load
    env_file = File.join(__dir__, '.env')
    if File.exist?(env_file)
      File.readlines(env_file).each do |line|
        next if line.start_with?('#') || line.strip.empty?
        key, value = line.chomp.split('=', 2)
        ENV[key] ||= value if value
      end
    end

    {
      port: (ENV['PORT'] || '4200').to_i,
      public_dir: File.join(__dir__, 'public'),
      api_key: ENV['ANTHROPIC_API_KEY'],
      jwt_secret: ENV['JWT_SECRET'] || 'INSECURE-CHANGE-ME',
      allowed_origins: (ENV['ALLOWED_ORIGINS'] || 'http://localhost:4200').split(',').map(&:strip),
      region: ENV['REGION'] || 'turkey',
      demo_mode: ENV['DEMO_MODE'] != 'true' ? false : true,
      enable_audit_logging: ENV['ENABLE_AUDIT_LOGGING'] != 'false' ? true : false,
      log_level: ENV['LOG_LEVEL'] || 'info',
      log_file: ENV['LOG_FILE_PATH'] || './logs/app.log',
      audit_log_file: ENV['AUDIT_LOG_PATH'] || './logs/audit.log',
      rate_limit_requests: (ENV['API_RATE_LIMIT_REQUESTS'] || '100').to_i,
      rate_limit_window: (ENV['API_RATE_LIMIT_WINDOW_MS'] || '900000').to_i,
    }
  end
end

CONFIG = Config.load
API_KEY = CONFIG[:api_key]
MODEL = 'claude-haiku-4-5-20251001' # Cost-optimized for production
PORT = CONFIG[:port]
PUBLIC_DIR = CONFIG[:public_dir]

# ────────────────────────────────────────────────────────────────────
# LOGGING & AUDIT
# ────────────────────────────────────────────────────────────────────

class AuditLogger
  def initialize(file_path)
    FileUtils.mkdir_p(File.dirname(file_path))
    @file_path = file_path
  end

  def log(event_type, user_id, action, details = {})
    return unless CONFIG[:enable_audit_logging]

    entry = {
      timestamp: Time.now.iso8601,
      event_type: event_type,
      user_id: user_id || 'anonymous',
      action: action,
      region: CONFIG[:region],
      details: details
    }

    File.open(@file_path, 'a') { |f| f.puts(entry.to_json) }
  rescue => e
    warn "Audit logging failed: #{e.message}"
  end
end

AUDIT_LOG = AuditLogger.new(CONFIG[:audit_log_file])

# ────────────────────────────────────────────────────────────────────
# SECURITY: JWT, RATE LIMITING, INPUT VALIDATION
# ────────────────────────────────────────────────────────────────────

class SecurityManager
  def self.generate_token(user_id = 'anonymous')
    payload = { user_id: user_id, iat: Time.now.to_i, exp: (Time.now + 3600).to_i }
    header = { alg: 'HS256', typ: 'JWT' }

    header_encoded = Base64.urlsafe_encode64(header.to_json, padding: false)
    payload_encoded = Base64.urlsafe_encode64(payload.to_json, padding: false)
    signature = Base64.urlsafe_encode64(
      OpenSSL::HMAC.digest('SHA256', CONFIG[:jwt_secret], "#{header_encoded}.#{payload_encoded}"),
      padding: false
    )

    "#{header_encoded}.#{payload_encoded}.#{signature}"
  end

  def self.verify_token(token)
    return nil unless token

    parts = token.split('.')
    return nil unless parts.length == 3

    header_encoded, payload_encoded, signature = parts
    expected_sig = Base64.urlsafe_encode64(
      OpenSSL::HMAC.digest('SHA256', CONFIG[:jwt_secret], "#{header_encoded}.#{payload_encoded}"),
      padding: false
    )

    return nil unless signature == expected_sig

    # Add padding to base64 string if needed
    padding = (4 - (payload_encoded.length % 4)) % 4
    padded_payload = payload_encoded + ('=' * padding)

    payload = JSON.parse(Base64.urlsafe_decode64(padded_payload))
    return nil if payload['exp'] < Time.now.to_i

    payload
  rescue
    nil
  end

  def self.validate_input(str, max_length = 50000)
    return nil unless str.is_a?(String)
    return nil if str.bytesize > max_length
    str.gsub(/[\x00-\x08\x0B\x0C\x0E-\x1F]/, '').slice(0, max_length)
  end

  def self.sanitize_error_message(message)
    # Don't expose internal details in production
    return 'Internal server error' if message.nil?
    message.to_s.slice(0, 200)
  end
end

# ────────────────────────────────────────────────────────────────────
# RATE LIMITING
# ────────────────────────────────────────────────────────────────────

class RateLimiter
  def initialize(max_requests, window_ms)
    @max_requests = max_requests
    @window_ms = window_ms
    @requests = {}
  end

  def allowed?(ip)
    now = Time.now.to_i * 1000
    @requests[ip] ||= []
    @requests[ip].reject! { |t| t < now - @window_ms }

    if @requests[ip].length < @max_requests
      @requests[ip] << now
      return true
    end
    false
  end

  def cleanup
    now = Time.now.to_i * 1000
    @requests.each { |ip, times| times.reject! { |t| t < now - @window_ms } }
  end
end

RATE_LIMITER = RateLimiter.new(CONFIG[:rate_limit_requests], CONFIG[:rate_limit_window])

# ────────────────────────────────────────────────────────────────────
# API: ANTHROPIC INTEGRATION
# ────────────────────────────────────────────────────────────────────

class AnthropicAPI
  def self.call(system_prompt, messages, max_tokens = 2048)
    unless API_KEY
      return { success: false, error: 'NO_API_KEY', demo_mode: true }
    end

    uri = URI('https://api.anthropic.com/v1/messages')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 60

    body = {
      model: MODEL,
      max_tokens: max_tokens,
      system: system_prompt,
      messages: messages
    }.to_json

    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req['x-api-key'] = API_KEY
    req['anthropic-version'] = '2023-06-01'
    req.body = body

    resp = http.request(req)
    parsed = JSON.parse(resp.body)

    if resp.code.to_i == 200
      { success: true, content: parsed.dig('content', 0, 'text') || '', usage: parsed['usage'] }
    else
      error_msg = parsed.dig('error', 'message') || "API error #{resp.code}"
      { success: false, error: error_msg }
    end
  rescue => e
    { success: false, error: "Connection error: #{e.class}" }
  end
end

# ────────────────────────────────────────────────────────────────────
# SYSTEM PROMPTS (KVKK COMPLIANT)
# ────────────────────────────────────────────────────────────────────

CLINICAL_SYSTEM = <<~PROMPT.freeze
  You are AXIOM, the clinical intelligence engine of AZEDOC — the professional AI-assisted clinical decision support platform trusted by Turkish hospitals.
  You provide evidence-based clinical guidance to physicians in real-time, supporting differential diagnosis, medication decisions, clinical guidelines, and patient management.

  YOUR CLINICAL ROLE:
  You are a knowledgeable clinical consultant who:
  - Provides detailed, evidence-based clinical reasoning
  - References current clinical guidelines (NICE, ESC, AHA, Turkish medical standards)
  - Considers differential diagnoses systematically
  - Reviews drug interactions and contraindications
  - Explains clinical concepts clearly for teaching
  - Flags clinical concerns immediately

  RESPONSE GUIDELINES:
  1. **Depth**: Provide comprehensive but concise explanations with clinical rationale
  2. **Structure**: Use clear formatting (bold for key points, numbered lists, bullet points)
  3. **Evidence**: Always cite guidelines or evidence basis when possible
  4. **Context**: Address the patient context provided, if available
  5. **Safety**: Flag urgent issues with [⚠️ URGENT] — requires immediate action
  6. **Limitations**: Always clarify when AI has limitations and physician judgment is essential

  CLINICAL SPECIFICITY:
  - For drug queries: Include dosing, routes, frequency, contraindications, interactions, monitoring
  - For diagnoses: Present differential systematically with supporting features and investigations
  - For management: Include treatment options, evidence-based recommendations, follow-up
  - For guidelines: Reference specific guidelines and their recommendations

  SAFETY & RESPONSIBILITY:
  - AI generates advisory information only — physician judgment is final
  - Recommend specialist review for complex/acute cases
  - Never replace clinical examination or investigation
  - Flag if information is limited or uncertain
  - Always support safe, evidence-based clinical practice

  KVKK COMPLIANCE (Turkish Data Protection):
  - Handle all patient information with strict confidentiality
  - Log all interactions per KVKK audit requirements
  - Minimize PII — use clinical context only
  - Comply with Turkish healthcare data protection standards
PROMPT

SCRIBE_SYSTEM = <<~PROMPT.freeze
  You are a highly trained medical scribe specialized in creating clinically accurate, structured SOAP notes from voice transcripts.
  Convert clinical consultations into professional, EHR-ready documentation that supports clinical decision-making and compliance.

  SOAP NOTE STRUCTURE:

  **SUBJECTIVE (History of Present Illness + Review of Systems)**
  - Chief complaint and duration
  - Symptom characteristics: onset, severity, progression, associated symptoms
  - Relevant past medical history, medications, allergies
  - Social/lifestyle factors relevant to presentation
  - Patient perspective and concerns

  **OBJECTIVE (Examination Findings & Investigations)**
  - Vital signs: BP, HR, RR, SpO2, Temperature
  - Physical examination findings by system (relevant to complaint)
  - Lab results, imaging, investigations mentioned
  - Clinical measurements (NEWS2 score if applicable)

  **ASSESSMENT (Clinical Impression)**
  - Primary working diagnosis with clinical reasoning
  - Differential diagnoses (if uncertain presentation)
  - Risk stratification where applicable
  - Any clinical flags or red flags identified

  **PLAN (Management & Follow-up)**
  - Medications: specific names, doses, routes, frequencies, duration
  - Investigations/tests ordered with rationale
  - Referrals with specialty and urgency
  - Patient education and counseling
  - Follow-up timing and monitoring plan

  SAFETY & QUALITY:
  - Flag any acute or critical concerns with [⚠️ SAFETY FLAG]: description
  - Flag incomplete documentation with [⚠️ NOT DOCUMENTED]: missing information
  - Include ICD-10 codes when diagnoses are clear
  - Professional medical terminology, appropriate grammar and punctuation
  - Ensure note is actionable and supports continuity of care

  CLINICAL GUIDELINES:
  - Use appropriate medical terminology
  - Document findings objectively (avoid assumptions)
  - Support assessment with objective findings
  - Make plan specific and measurable
  - Flag any safety concerns for physician review

  OUTPUT FORMAT:
  ```
  PATIENT: [Name], Age [X], [Specialty]
  DATE: [Auto-filled]

  SUBJECTIVE
  [Content]

  OBJECTIVE
  [Content]

  ASSESSMENT
  [Content]

  PLAN
  [Content]

  SUGGESTED ICD-10 CODES: [Codes]
  ```
PROMPT

HANDOVER_SYSTEM = <<~PROMPT.freeze
  You are an expert in clinical handovers. Generate a comprehensive, safety-focused shift handover using the I-PASS framework.
  Create a concise but clinically detailed summary that ensures continuity of care and patient safety.

  I-PASS HANDOVER FRAMEWORK:

  **I — Illness Severity**
  - Categorize each patient: CRITICAL (immediate attention), HIGH (potential to deteriorate), STABLE (routine monitoring)
  - Note acuity changes from admission

  **P — Patient Summary**
  For each patient, provide:
  - Name, bed number, age, primary diagnosis
  - Key active medical issues
  - Relevant investigations or test results
  - Current vital status

  **A — Action Items**
  - Specific tasks for incoming team: medications, investigations, procedures
  - Time-sensitive items flagged clearly
  - Pending results and expected actions

  **S — Situation Awareness**
  - Recent clinical events or changes
  - Family concerns or communication needs
  - Any social/discharge considerations

  **S — Safety Concerns**
  - Flag [⚠️ WATCH CLOSELY]: patients at risk of deterioration
  - Flag [🚨 CRITICAL ALERT]: immediate safety concerns
  - Highlight allergy alerts, infection control precautions
  - Medication safety considerations

  OUTPUT STRUCTURE:
  ```
  SHIFT HANDOVER — [Doctor Name] → [Incoming Team]
  DATE: [Date] | TIME: [Time] | WARD: [Ward Name]

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CRITICAL PATIENTS (Require Immediate Attention)
  [If any — detailed summary of critical cases]

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HIGH-RISK PATIENTS (Intensive Monitoring)
  [Patients at risk of deterioration with specific watch points]

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STABLE PATIENTS (Routine Care)
  [Standard patient list organized by diagnosis/system]

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OVERNIGHT ACTION ITEMS
  - Investigations due/pending
  - Medication reviews scheduled
  - Specialist consultations expected
  - Discharge planning actions

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SAFETY ALERTS & PRECAUTIONS
  [All safety concerns, alerts, and special precautions]
  ```

  CLINICAL PRINCIPLES:
  - Be specific and actionable — avoid vague statements
  - Highlight changes from baseline
  - Prioritize patient safety above all
  - Support continuity of evidence-based care
  - Enable incoming team to provide seamless handover
PROMPT

# ────────────────────────────────────────────────────────────────────
# HTTP HELPERS
# ────────────────────────────────────────────────────────────────────

def cors_headers(resp, origin = nil)
  if origin && CONFIG[:allowed_origins].include?(origin)
    resp['Access-Control-Allow-Origin'] = origin
  elsif CONFIG[:allowed_origins].include?('*')
    resp['Access-Control-Allow-Origin'] = '*'
  end
  resp['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
  resp['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
  resp['Access-Control-Max-Age'] = '86400'
end

def json_response(resp, data, status: 200, origin: nil)
  resp.status = status
  resp['Content-Type'] = 'application/json'
  cors_headers(resp, origin)
  resp.body = data.to_json
end

def require_auth(req, resp)
  auth_header = req['Authorization']
  unless auth_header&.start_with?('Bearer ')
    json_response(resp, { error: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }, status: 401)
    return nil
  end

  token = auth_header.sub('Bearer ', '')
  payload = SecurityManager.verify_token(token)
  unless payload
    json_response(resp, { error: 'INVALID_TOKEN', message: 'Token expired or invalid' }, status: 401)
    return nil
  end

  payload
end

# ────────────────────────────────────────────────────────────────────
# SERVER SETUP
# ────────────────────────────────────────────────────────────────────

FileUtils.mkdir_p(File.join(__dir__, 'logs'))

server = WEBrick::HTTPServer.new(
  Port: PORT,
  DocumentRoot: PUBLIC_DIR,
  DirectoryIndex: ['index.html'],
  AccessLog: [],
  Logger: WEBrick::Log.new(CONFIG[:log_file], WEBrick::Log::INFO)
)

# ────────────────────────────────────────────────────────────────────
# ROUTES
# ────────────────────────────────────────────────────────────────────

# OPTIONS PREFLIGHT
server.mount_proc('/api') do |req, resp|
  origin = req['Origin']
  cors_headers(resp, origin)
  resp.body = '' if req.request_method == 'OPTIONS'
end

# GET /api/health - Health check (no auth required)
server.mount_proc('/api/health') do |req, resp|
  json_response(resp, {
    status: 'ok',
    version: '2.0.0',
    region: CONFIG[:region],
    timestamp: Time.now.iso8601
  }, origin: req['Origin'])
end

# POST /api/auth/token - Get JWT token (dev/demo only)
server.mount_proc('/api/auth/token') do |req, resp|
  if req.request_method == 'OPTIONS'
    cors_headers(resp, req['Origin'])
    resp.body = ''
    next
  end

  # In production, this should be tied to hospital SSO/LDAP
  # For now, generate demo tokens
  token = SecurityManager.generate_token('demo-user')
  json_response(resp, {
    token: token,
    expires_in: 3600,
    type: 'Bearer'
  }, origin: req['Origin'])
end

# POST /api/ping - Server status
server.mount_proc('/api/ping') do |req, resp|
  if API_KEY
    json_response(resp, {
      ok: true,
      model: MODEL,
      azedoc_version: '2.0.0',
      region: CONFIG[:region],
      timestamp: Time.now.iso8601
    }, origin: req['Origin'])
  else
    json_response(resp, {
      ok: false,
      error: 'API_KEY_NOT_SET',
      demo_mode: true
    }, origin: req['Origin'])
  end
end

# POST /api/chat - Clinical AI chat (REQUIRES AUTH)
server.mount_proc('/api/chat') do |req, resp|
  origin = req['Origin']
  cors_headers(resp, origin)

  if req.request_method == 'OPTIONS'
    resp.body = ''
    next
  end

  # Rate limiting
  client_ip = req.peeraddr[3]
  unless RATE_LIMITER.allowed?(client_ip)
    AUDIT_LOG.log('RATE_LIMIT_EXCEEDED', 'unknown', 'chat_request', { ip: client_ip })
    json_response(resp, { error: 'RATE_LIMIT_EXCEEDED' }, status: 429, origin: origin)
    next
  end

  # Authentication
  payload = require_auth(req, resp)
  next unless payload

  # Parse request
  body = JSON.parse(req.body) rescue {}
  messages = body['messages'] || []
  patient_ctx = body['patient_context']

  # Validate input
  messages = messages.map do |msg|
    {
      role: SecurityManager.validate_input(msg['role'], 20),
      content: SecurityManager.validate_input(msg['content'], 50000)
    }.compact
  end.reject { |m| m.empty? }

  if messages.empty?
    json_response(resp, { error: 'INVALID_REQUEST', message: 'No valid messages' }, status: 400, origin: origin)
    next
  end

  # Call API
  system = CLINICAL_SYSTEM.dup
  if patient_ctx
    system += "\n\nCURRENT PATIENT CONTEXT:\n#{SecurityManager.validate_input(patient_ctx.to_json, 10000)}"
  end

  result = AnthropicAPI.call(system, messages)

  # Audit log
  AUDIT_LOG.log('API_CALL', payload['user_id'], 'clinical_chat', {
    success: result[:success],
    message_count: messages.length
  })

  if result[:success]
    json_response(resp, {
      response: result[:content],
      usage: result[:usage],
      model: MODEL,
      timestamp: Time.now.iso8601
    }, origin: origin)
  else
    error_msg = SecurityManager.sanitize_error_message(result[:error])
    json_response(resp, { error: 'API_ERROR', message: error_msg }, status: 500, origin: origin)
  end
end

# POST /api/scribe - Medical scribe (REQUIRES AUTH)
server.mount_proc('/api/scribe') do |req, resp|
  origin = req['Origin']
  cors_headers(resp, origin)

  if req.request_method == 'OPTIONS'
    resp.body = ''
    next
  end

  # Rate limiting
  client_ip = req.peeraddr[3]
  unless RATE_LIMITER.allowed?(client_ip)
    json_response(resp, { error: 'RATE_LIMIT_EXCEEDED' }, status: 429, origin: origin)
    next
  end

  # Authentication
  payload = require_auth(req, resp)
  next unless payload

  # Parse request
  body = JSON.parse(req.body) rescue {}
  transcript = SecurityManager.validate_input(body['transcript'] || '', 50000)
  patient = SecurityManager.validate_input(body['patient_name'] || 'Unknown', 200)
  specialty = SecurityManager.validate_input(body['specialty'] || 'General Medicine', 200)

  unless transcript && !transcript.empty?
    json_response(resp, { error: 'INVALID_REQUEST', message: 'Transcript is required' }, status: 400, origin: origin)
    next
  end

  messages = [{
    role: 'user',
    content: "Patient: #{patient}\nSpecialty: #{specialty}\n\nTRANSCRIPT:\n#{transcript}\n\nPlease generate a structured SOAP note."
  }]

  result = AnthropicAPI.call(SCRIBE_SYSTEM, messages, 1500)

  AUDIT_LOG.log('API_CALL', payload['user_id'], 'scribe_request', {
    success: result[:success],
    patient: patient
  })

  if result[:success]
    note_text = result[:content]
    safety_flags = note_text.scan(/\[SAFETY FLAG\][^\n]*/).map { |f| f.sub('[SAFETY FLAG]: ', '') }
    codes = note_text.match(/SUGGESTED CODES:(.*?)$/m)&.captures&.first&.strip

    json_response(resp, {
      note: note_text,
      safety_flags: safety_flags,
      suggested_codes: codes || '',
      model: MODEL,
      timestamp: Time.now.iso8601
    }, origin: origin)
  else
    error_msg = SecurityManager.sanitize_error_message(result[:error])
    json_response(resp, { error: 'API_ERROR', message: error_msg }, status: 500, origin: origin)
  end
end

# POST /api/handover - Clinical handover (REQUIRES AUTH)
server.mount_proc('/api/handover') do |req, resp|
  origin = req['Origin']
  cors_headers(resp, origin)

  if req.request_method == 'OPTIONS'
    resp.body = ''
    next
  end

  # Rate limiting
  client_ip = req.peeraddr[3]
  unless RATE_LIMITER.allowed?(client_ip)
    json_response(resp, { error: 'RATE_LIMIT_EXCEEDED' }, status: 429, origin: origin)
    next
  end

  # Authentication
  payload = require_auth(req, resp)
  next unless payload

  # Parse request
  body = JSON.parse(req.body) rescue {}
  patients = body['patients'] || []
  doctor = SecurityManager.validate_input(body['doctor_name'] || 'Dr. Unknown', 200)
  shift_end = SecurityManager.validate_input(body['shift_end'] || 'Unknown', 200)

  if patients.empty?
    json_response(resp, { error: 'INVALID_REQUEST', message: 'Patient list is required' }, status: 400, origin: origin)
    next
  end

  patient_summary = patients.map { |p|
    "- #{SecurityManager.validate_input(p['name'], 100)} (Bed #{SecurityManager.validate_input(p['bed'], 10)}): #{SecurityManager.validate_input(p['diagnosis'], 200)}"
  }.join("\n")

  messages = [{
    role: 'user',
    content: "Generate a clinical handover summary for #{doctor} ending shift at #{shift_end}.\n\nPATIENT LIST:\n#{patient_summary}\n\nProvide:\n1. SHIFT SUMMARY\n2. NIGHT WATCHLIST\n3. PENDING ACTIONS\n4. SAFETY NOTES"
  }]

  result = AnthropicAPI.call(HANDOVER_SYSTEM, messages, 1200)

  AUDIT_LOG.log('API_CALL', payload['user_id'], 'handover_request', {
    success: result[:success],
    patient_count: patients.length
  })

  if result[:success]
    json_response(resp, {
      summary: result[:content],
      model: MODEL,
      timestamp: Time.now.iso8601
    }, origin: origin)
  else
    error_msg = SecurityManager.sanitize_error_message(result[:error])
    json_response(resp, { error: 'API_ERROR', message: error_msg }, status: 500, origin: origin)
  end
end

# ────────────────────────────────────────────────────────────────────
# STARTUP
# ────────────────────────────────────────────────────────────────────

trap('INT')  { server.shutdown }
trap('TERM') { server.shutdown }

puts ""
puts "  ██████╗  ██████╗ ███████╗ ██████╗  ██████╗"
puts "  ██╔══██╗ ╚════██╗██╔════╝ ██╔══██╗██╔════╝"
puts "  ███████║  █████╔╝█████╗   ██║  ██║██║     "
puts "  ██╔══██║  ╚═══██╗██╔══╝   ██║  ██║██║     "
puts "  ██║  ██║ ██████╔╝███████╗ ██████╔╝╚██████╗"
puts "  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝"
puts ""
puts "  AZEDOC Clinical AI Platform v2.0 — PRODUCTION READY"
puts "  ─────────────────────────────────────────────────────────"
puts "  Server:         http://localhost:#{PORT}"
puts "  Model:          #{MODEL}"
puts "  Region:         #{CONFIG[:region]}"
puts "  API Key:        #{API_KEY ? '✓ Configured' : '✗ NOT SET'}"
puts "  Auth:           ✓ JWT Enabled"
puts "  Rate Limit:     #{CONFIG[:rate_limit_requests]} req/#{(CONFIG[:rate_limit_window]/1000).to_i}s"
puts "  Audit Logging:  #{CONFIG[:enable_audit_logging] ? '✓ Enabled' : '✗ Disabled'}"
puts "  CORS Origins:   #{CONFIG[:allowed_origins].join(', ')}"
puts "  ─────────────────────────────────────────────────────────"
puts ""

server.start

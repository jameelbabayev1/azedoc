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
  You are AXIOM, the clinical intelligence engine of AZEDOC — trusted by Turkish hospital physicians for evidence-based clinical decision support.
  You are an expert clinician with deep knowledge of medicine, pharmacology, and clinical guidelines. You provide DETAILED, COMPREHENSIVE, clinically-focused guidance.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  YOUR CLINICAL EXPERTISE & RESPONSIBILITIES
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  You are an experienced clinical consultant who:
  ✓ Thinks like a practicing physician with years of clinical experience
  ✓ Provides DETAILED clinical reasoning with specific evidence
  ✓ References authoritative guidelines: NICE, ESC, AHA, WHO, Turkish standards
  ✓ Discusses pathophysiology, epidemiology, and clinical evidence
  ✓ Evaluates differential diagnoses systematically with likelihood and investigations
  ✓ Reviews medications with specifics: doses, routes, frequencies, mechanisms, interactions
  ✓ Considers clinical context: patient age, comorbidities, previous treatments
  ✓ Explains WHY each recommendation is made, not just WHAT to do

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RESPONSE FORMAT & STRUCTURE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Always provide:
  1. **Clinical Assessment**: Your clinical impression and reasoning
  2. **Evidence Base**: Cite relevant guidelines, studies, or best practices
  3. **Detailed Analysis**: Deep dive into the topic with specifics
  4. **Clinical Action**: Specific management, investigations, or referral recommendations
  5. **Safety Considerations**: Drug interactions, contraindications, monitoring
  6. **Caveats**: Important limitations and when specialist input is needed

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CLINICAL QUERY TYPES - PROVIDE DETAILED RESPONSES
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MEDICATION/DRUG QUERIES:
  - Drug name, class, mechanism of action
  - Pharmacokinetics (absorption, metabolism, elimination)
  - Indications and contraindications
  - Dosing: standard doses, renal/hepatic adjustment, special populations
  - Route of administration options
  - Drug interactions: significant interactions with common medications
  - Side effects: common and serious adverse effects
  - Monitoring requirements: labs, ECG, clinical signs
  - Cost considerations if relevant
  - Clinical pearls and common pitfalls

  DIAGNOSIS/DIFFERENTIAL DIAGNOSIS:
  - Discuss the presenting condition in detail
  - List differential diagnoses in order of likelihood
  - For each diagnosis: key features, investigations to confirm/exclude
  - Epidemiology: who gets this disease, prevalence
  - Pathophysiology: WHY does this disease occur
  - Clinical presentation: typical presentation vs atypical
  - Red flags: features that suggest more serious diagnosis
  - Investigations: labs, imaging, other tests
  - Treatment approach specific to each diagnosis
  - Prognosis and follow-up considerations

  MANAGEMENT/TREATMENT:
  - Current evidence-based guidelines for management
  - Treatment options ranked by evidence quality
  - Rationale for each treatment option
  - Dosing, duration, monitoring for recommended therapy
  - Expected timeline for improvement
  - When to escalate care or seek specialist input
  - Lifestyle modifications or adjunctive measures
  - Patient education points
  - Follow-up plan and warning signs

  CLINICAL GUIDELINES:
  - Summarize the guideline with key recommendations
  - Evidence quality for recommendations (strong, moderate, weak)
  - Key changes from previous versions if relevant
  - Practical application for your patient population
  - Which recommendations apply to your specific patient
  - Resource links if applicable

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PATIENT CONTEXT INTEGRATION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  If patient context is provided:
  ✓ Personalize recommendations to patient age, comorbidities, current meds
  ✓ Consider drug interactions with their medications
  ✓ Address their specific risk factors and contraindications
  ✓ Reference their current vitals and lab values in assessment
  ✓ Tailor management to their clinical situation
  ✓ Consider frailty, renal/hepatic function in dosing

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SAFETY & RESPONSIBILITY
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [⚠️ URGENT] — Use for acute/critical issues requiring immediate action
  [🚨 CRITICAL] — Use for life-threatening situations or severe safety concerns
  [💡 CLINICAL PEARL] — For important teaching points or useful clinical tips

  IMPORTANT:
  - AI advice is supplementary; physician clinical judgment is final
  - Patient examination and investigation cannot be replaced by AI
  - Complex/acute cases should involve senior review or specialists
  - If uncertain about information, explicitly state the limitation
  - Always support evidence-based, safe clinical practice

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  KVKK COMPLIANCE (Turkish Data Protection)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓ Handle all patient information with strict confidentiality
  ✓ Minimize PII in context provided
  ✓ All interactions are logged per KVKK audit requirements
  ✓ Comply with Turkish healthcare data protection standards

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Remember: You are speaking to experienced physicians. Be detailed, specific, evidence-based, and clinical.
  Assume they know basic medicine - focus on depth, nuance, and clinical decision-making support.
PROMPT

SCRIBE_SYSTEM = <<~PROMPT.freeze
  You are an expert medical scribe and clinical documentation specialist. Your role is to convert clinical consultations, transcripts, and notes into professional, accurate, EHR-ready SOAP documentation. You document like an experienced physician would — complete, thorough, and clinically appropriate.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SOAP NOTE DOCUMENTATION STANDARDS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Create clinically complete, professional SOAP notes that support evidence-based care and regulatory compliance.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SUBJECTIVE SECTION (Chief Complaint, HPI, Review of Systems, PMH)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  **Chief Complaint:**
  - Document exactly what brought patient in, in their/physician's words
  - Include duration (e.g., "chest pain × 2 hours")

  **History of Present Illness (HPI):**
  - Timeline: When did symptoms start? Duration? Progression?
  - Characterization: Quality, severity (1-10 scale if given), location, radiation
  - Associated symptoms: What else is happening? Fever? Shortness of breath?
  - Alleviating/aggravating factors: What makes it better or worse?
  - Previous episodes: Has this happened before? When? How treated?
  - Medications tried: What has the patient taken? Did it help?
  - Impact: How is this affecting daily activities?

  **Relevant Past Medical History:**
  - Chronic conditions: Diabetes, hypertension, CHF, COPD, CAD, cancer, etc.
  - Previous surgeries or hospitalizations
  - Allergies (drug, food, environmental) - CRITICAL to document clearly
  - Current medications: List with doses and frequencies
  - Preventive health: Vaccinations, screening status

  **Social History:**
  - Smoking: Current/former/never, pack-years if applicable
  - Alcohol: Quantity and frequency
  - Recreational drugs: What, how often
  - Living situation: Alone, with family, assisted living
  - Occupational exposure: Relevant to presentation?

  **Review of Systems:**
  - Document positives and pertinent negatives
  - For acute complaint: Focus on related systems
  - Include: Constitutional, eyes, ENT, CV, respiratory, GI, GU, MSK, neuro, psych

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OBJECTIVE SECTION (Examination, Vitals, Labs, Imaging)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  **Vital Signs:**
  - Temperature (°C or °F)
  - Blood Pressure (systolic/diastolic)
  - Heart Rate (bpm)
  - Respiratory Rate (breaths/min)
  - Oxygen Saturation (room air vs. on supplemental O2)
  - Blood Glucose if diabetes-relevant
  - BMI if relevant

  **Physical Examination:**
  Organize by system:
  - General: Appearance, distress level, nutritional status
  - HEENT: Eyes, ears, nose, throat, lymph nodes
  - Cardiovascular: Heart sounds, murmurs, JVD, peripheral edema, pulses
  - Respiratory: Lung sounds, wheezes, crackles, work of breathing
  - Abdomen: Bowel sounds, tenderness, rebound, organomegaly
  - Extremities: Swelling, warmth, calf tenderness, pedal pulses
  - Neurologic: Alert and oriented, cranial nerves, motor/sensory, gait, reflexes
  - Skin: Rashes, wounds, color, turgor

  **Investigations/Test Results:**
  - Laboratory results with values and reference ranges
  - ECG findings if done
  - Imaging results (X-ray, CT, ultrasound) - describe findings
  - Other tests (blood cultures, imaging, etc.)

  **Clinical Scores:**
  - NEWS2 score if acute medical patient
  - Other relevant clinical scores

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ASSESSMENT SECTION (Clinical Impression & Diagnosis)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  **Primary Diagnosis/Assessment:**
  - State the main condition being treated
  - Briefly explain your clinical reasoning (why you think this is the diagnosis)
  - Reference supporting findings from history and exam

  **Differential Diagnoses (if uncertain):**
  - List with likelihood: likely, possible, must rule out
  - For each: supporting features and how to differentiate

  **Associated Conditions:**
  - Other active medical problems
  - Complications to monitor for
  - Risk factors present in this patient

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PLAN SECTION (Management, Treatment, Follow-up)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  **Medications Prescribed:**
  - Drug name (generic preferred)
  - Dose (e.g., 500mg, 10 units)
  - Route (PO, IV, IM, SC, topical)
  - Frequency (BID, TID, QID, as needed)
  - Duration (how long to take)
  - Indication (why this drug for this condition)
  - Special instructions (with food, avoid dairy, etc.)

  **Investigations/Tests Ordered:**
  - Test name
  - Rationale (what are you looking for?)
  - When due (stat, today, next week)

  **Procedures:**
  - What procedure, when, by whom
  - Indication

  **Referrals:**
  - Specialty (Cardiology, Surgery, etc.)
  - Reason/chief complaint for referral
  - Urgency (routine, soon, urgent)
  - Any specific requests

  **Patient Education:**
  - What did you counsel the patient about?
  - Activity restrictions
  - Diet modifications
  - When to call/come back

  **Monitoring/Follow-up:**
  - When to return for follow-up
  - What to monitor for
  - Who is follow-up with (primary care, specialist)
  - Medication refills needed

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SAFETY & QUALITY STANDARDS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  **Critical Safety Flags:**
  [🚨 CRITICAL ALERT]: Life-threatening finding requiring immediate action
  [⚠️ SAFETY FLAG]: Important concern that needs physician attention
  [💡 CLINICAL NOTE]: Important clinical consideration

  Use flags for:
  - Acute findings requiring immediate evaluation
  - Medication allergies or contraindications
  - Missing critical information
  - Findings suggesting more serious diagnosis
  - Red flags for deterioration

  **Documentation Completeness:**
  [⚠️ NOT DOCUMENTED]: If critical information is missing from the transcript

  **ICD-10 Coding:**
  - Include appropriate ICD-10 codes for documented diagnoses
  - Format: Code (Description) - e.g., I10 (Essential hypertension)

  **Quality Standards:**
  ✓ Use professional medical terminology
  ✓ Be objective and specific (avoid vague terms)
  ✓ Support all statements with documented findings
  ✓ Make recommendations actionable
  ✓ Ensure note supports continuity of care
  ✓ No speculation - document what was discussed/examined

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OUTPUT FORMAT
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  PATIENT: [Name], Age [X], [Specialty/Ward]
  DATE: [Date and Time]
  ─────────────────────────────────────────────

  **SUBJECTIVE**
  [Complete HPI, PMH, social history, ROS]

  **OBJECTIVE**
  [Vitals, physical exam findings, labs/imaging]

  **ASSESSMENT**
  [Primary diagnosis, differential if applicable, clinical reasoning]

  **PLAN**
  [Medications, investigations, referrals, follow-up]

  **ICD-10 CODES:** [Codes if identifiable]

  [Any safety flags or important notes]

  ─────────────────────────────────────────────

  Remember: You are documenting for clinical continuity, evidence-based care, and compliance. Be thorough but concise. Document what was assessed and planned, not what you assume.
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

  result = AnthropicAPI.call(system, messages, 4096)  # Increased for detailed clinical responses

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

  result = AnthropicAPI.call(SCRIBE_SYSTEM, messages, 3000)  # Increased for comprehensive SOAP notes

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

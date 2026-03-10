require 'webrick'
require 'json'
require 'net/http'
require 'uri'

PORT = 4200
PUBLIC_DIR = File.join(__dir__, 'public')

# Load API key from env or config file
def load_api_key
  return ENV['ANTHROPIC_API_KEY'] if ENV['ANTHROPIC_API_KEY'] && !ENV['ANTHROPIC_API_KEY'].empty?
  config_file = File.join(__dir__, 'config.json')
  if File.exist?(config_file)
    config = JSON.parse(File.read(config_file)) rescue {}
    return config['anthropic_api_key'] if config['anthropic_api_key']
  end
  nil
end

API_KEY = load_api_key
MODEL   = 'claude-opus-4-6'

CLINICAL_SYSTEM = <<~PROMPT.freeze
  You are AXIOM, the embedded AI clinical intelligence engine of AZEDOC — a professional doctor AI assistant platform.
  You assist hospital physicians with evidence-based clinical reasoning, drug queries, differential diagnosis support, medication review, and patient management decisions.
  You have access to the patient context provided in the conversation.

  CORE PRINCIPLES:
  - Always be precise, evidence-based, and concise
  - Use NICE guidelines (UK) and international best practice
  - Flag urgent concerns immediately with [URGENT] prefix
  - Never make definitive diagnoses — support and enhance clinical reasoning
  - Always recommend the physician applies their own clinical judgment
  - Format responses with clear structure (use ** for bold, numbered lists where appropriate)
  - Reference relevant guidelines when giving recommendations
  - Be direct and efficient — doctors are time-pressured

  SAFETY:
  - If a query involves immediate patient safety, flag it clearly
  - Always recommend senior review when appropriate
  - Be explicit about limitations of AI-generated advice
PROMPT

SCRIBE_SYSTEM = <<~PROMPT.freeze
  You are a medical scribe AI. Convert the clinical transcript into a structured SOAP note.

  REQUIREMENTS:
  - Subjective: Patient's history, symptoms, complaints (patient's own words where appropriate)
  - Objective: Examination findings, vital signs, investigations mentioned
  - Assessment: Clinical impression, working diagnoses (differential if appropriate)
  - Plan: Management including medications with doses/routes/frequencies, investigations ordered, referrals, follow-up

  FORMAT:
  - Use clear headings: SUBJECTIVE, OBJECTIVE, ASSESSMENT, PLAN
  - Be medically precise with terminology
  - Flag any patient safety concerns with [SAFETY FLAG]: prefix
  - After the note, add: SUGGESTED CODES: (ICD-10 codes if identifiable)
  - Keep language professional and EHR-appropriate
  - If unclear or missing information, note with [Not documented]
PROMPT

def anthropic_call(system_prompt, messages, max_tokens: 2048)
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
  req['Content-Type']      = 'application/json'
  req['x-api-key']         = API_KEY
  req['anthropic-version'] = '2023-06-01'
  req.body = body

  resp = http.request(req)
  parsed = JSON.parse(resp.body)

  if resp.code.to_i == 200
    { success: true, content: parsed.dig('content', 0, 'text') || '', usage: parsed['usage'] }
  else
    { success: false, error: parsed['error']&.dig('message') || "API error #{resp.code}" }
  end
rescue => e
  { success: false, error: "Connection error: #{e.message}" }
end

def cors_headers(resp)
  resp['Access-Control-Allow-Origin']  = '*'
  resp['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
  resp['Access-Control-Allow-Headers'] = 'Content-Type'
end

def json_response(resp, data, status: 200)
  resp.status = status
  resp['Content-Type'] = 'application/json'
  cors_headers(resp)
  resp.body = data.to_json
end

server = WEBrick::HTTPServer.new(
  Port: PORT,
  DocumentRoot: PUBLIC_DIR,
  DirectoryIndex: ['index.html'],
  AccessLog: [[$stdout, WEBrick::AccessLog::COMMON_LOG_FORMAT]],
  Logger: WEBrick::Log.new($stdout, WEBrick::Log::INFO)
)

# OPTIONS preflight
server.mount_proc('/api') do |req, resp|
  cors_headers(resp)
  resp.body = '' if req.request_method == 'OPTIONS'
end

# /api/ping
server.mount_proc('/api/ping') do |req, resp|
  if API_KEY
    json_response(resp, { ok: true, model: MODEL, azedoc_version: '1.0.0' })
  else
    json_response(resp, { ok: false, error: 'No ANTHROPIC_API_KEY set. Set env var or add to config.json', demo_mode: true })
  end
end

# /api/chat
server.mount_proc('/api/chat') do |req, resp|
  cors_headers(resp)
  if req.request_method == 'OPTIONS'
    resp.body = ''
    next
  end

  unless API_KEY
    json_response(resp, { error: 'NO_API_KEY', demo_mode: true })
    next
  end

  body = JSON.parse(req.body) rescue {}
  messages = body['messages'] || []
  patient_ctx = body['patient_context']

  system = CLINICAL_SYSTEM.dup
  if patient_ctx
    system += "\n\nCURRENT PATIENT CONTEXT:\n#{patient_ctx.to_json}"
  end

  result = anthropic_call(system, messages)
  if result[:success]
    json_response(resp, { response: result[:content], usage: result[:usage], model: MODEL })
  else
    json_response(resp, { error: result[:error] }, status: 500)
  end
end

# /api/scribe
server.mount_proc('/api/scribe') do |req, resp|
  cors_headers(resp)
  if req.request_method == 'OPTIONS'
    resp.body = ''
    next
  end

  unless API_KEY
    json_response(resp, { error: 'NO_API_KEY', demo_mode: true })
    next
  end

  body    = JSON.parse(req.body) rescue {}
  transcript = body['transcript'] || ''
  patient    = body['patient_name'] || 'Unknown'
  specialty  = body['specialty'] || 'General Medicine'

  messages = [{
    role: 'user',
    content: "Patient: #{patient}\nSpecialty: #{specialty}\n\nTRANSCRIPT:\n#{transcript}\n\nPlease generate a structured SOAP note."
  }]

  result = anthropic_call(SCRIBE_SYSTEM, messages, max_tokens: 1500)
  if result[:success]
    note_text = result[:content]
    safety_flags = note_text.scan(/\[SAFETY FLAG\][^\n]*/).map { |f| f.sub('[SAFETY FLAG]: ', '') }
    codes = note_text.match(/SUGGESTED CODES:(.*?)$/m)&.captures&.first&.strip

    json_response(resp, {
      note: note_text,
      safety_flags: safety_flags,
      suggested_codes: codes || '',
      model: MODEL
    })
  else
    json_response(resp, { error: result[:error] }, status: 500)
  end
end

# /api/handover
server.mount_proc('/api/handover') do |req, resp|
  cors_headers(resp)
  if req.request_method == 'OPTIONS'
    resp.body = ''
    next
  end

  unless API_KEY
    json_response(resp, { error: 'NO_API_KEY', demo_mode: true })
    next
  end

  body       = JSON.parse(req.body) rescue {}
  patients   = body['patients'] || []
  doctor     = body['doctor_name'] || 'Dr. Martinez'
  shift_end  = body['shift_end'] || 'Unknown'

  patient_summary = patients.map { |p| "- #{p['name']} (Bed #{p['bed']}): #{p['diagnosis']} | NEWS2: #{p['news2Score']} | Pending: #{Array(p['pendingActions']).length} actions" }.join("\n")

  messages = [{
    role: 'user',
    content: "Generate a clinical handover summary for #{doctor} ending shift at #{shift_end}.\n\nPATIENT LIST:\n#{patient_summary}\n\nProvide:\n1. SHIFT SUMMARY (brief narrative of the shift)\n2. NIGHT WATCHLIST (top 3-5 patients to watch overnight with specific reasons)\n3. PENDING ACTIONS (list of actions the night team must complete)\n4. SAFETY NOTES (any specific concerns)"
  }]

  handover_system = "You are a clinical handover AI. Generate a concise, structured, safety-focused handover summary following I-PASS principles. Be specific and clinically relevant."
  result = anthropic_call(handover_system, messages, max_tokens: 1200)

  if result[:success]
    json_response(resp, { summary: result[:content], model: MODEL })
  else
    json_response(resp, { error: result[:error] }, status: 500)
  end
end

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
puts "  AZEDOC Clinical AI Platform v1.0"
puts "  ─────────────────────────────────────────────"
puts "  Server:  http://localhost:#{PORT}"
puts "  Model:   #{MODEL}"
puts "  API Key: #{API_KEY ? '✓ Configured' : '✗ Not set (Demo mode)'}"
puts "  ─────────────────────────────────────────────"
puts ""

server.start

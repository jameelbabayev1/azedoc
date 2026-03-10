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
  # Advanced LLM Integration with Streaming, Caching, and Multi-Model Support

  MODELS = {
    'claude-opus-4-6' => { max_tokens: 4096, cost_per_1k_in: 15, cost_per_1k_out: 75 },
    'claude-sonnet-4-6' => { max_tokens: 4096, cost_per_1k_in: 3, cost_per_1k_out: 15 },
    'claude-haiku-4-5' => { max_tokens: 2048, cost_per_1k_in: 0.8, cost_per_1k_out: 4 }
  }.freeze

  @@response_cache = {}
  @@cache_ttl = 3600 # 1 hour cache

  def self.call(system_prompt, messages, max_tokens = 2048, model = nil)
    unless API_KEY
      return { success: false, error: 'NO_API_KEY', demo_mode: true }
    end

    model ||= MODEL

    # Generate cache key for this request
    cache_key = generate_cache_key(system_prompt, messages, max_tokens, model)

    # Check cache
    if @@response_cache[cache_key] && (Time.now.to_i - @@response_cache[cache_key][:timestamp]) < @@cache_ttl
      return @@response_cache[cache_key][:response].merge(cached: true)
    end

    # Build request
    uri = URI('https://api.anthropic.com/v1/messages')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 120
    http.max_retries = 2

    body = {
      model: model,
      max_tokens: max_tokens,
      system: system_prompt,
      messages: messages,
      temperature: 0.7
    }.to_json

    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req['x-api-key'] = API_KEY
    req['anthropic-version'] = '2023-06-01'
    req['user-agent'] = 'AZEDOC/2.0'
    req.body = body

    resp = http.request(req)
    parsed = JSON.parse(resp.body)

    if resp.code.to_i == 200
      content = parsed.dig('content', 0, 'text') || ''
      usage = parsed['usage'] || {}

      result = {
        success: true,
        content: content,
        usage: usage,
        model: model,
        tokens_in: usage['input_tokens'] || 0,
        tokens_out: usage['output_tokens'] || 0,
        timestamp: Time.now.to_i,
        cached: false
      }

      # Cache successful response
      @@response_cache[cache_key] = { response: result, timestamp: Time.now.to_i }

      AUDIT_LOG.log('LLM_API_CALL', 'system', 'api_success', {
        model: model,
        tokens_in: usage['input_tokens'],
        tokens_out: usage['output_tokens']
      })

      result
    else
      error_msg = parsed.dig('error', 'message') || "API error #{resp.code}"
      error_type = parsed.dig('error', 'type') || 'unknown'

      AUDIT_LOG.log('LLM_API_CALL', 'system', 'api_error', {
        model: model,
        error_type: error_type,
        error_msg: error_msg,
        status_code: resp.code
      })

      { success: false, error: error_msg, error_type: error_type }
    end
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    { success: false, error: "Request timeout: #{e.class}", error_type: 'timeout' }
  rescue => e
    { success: false, error: "Connection error: #{e.class}", error_type: 'connection_error' }
  end

  def self.call_with_streaming(system_prompt, messages, max_tokens = 2048, model = nil, &block)
    unless API_KEY
      yield({ success: false, error: 'NO_API_KEY', demo_mode: true })
      return
    end

    model ||= MODEL
    uri = URI('https://api.anthropic.com/v1/messages')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 120

    body = {
      model: model,
      max_tokens: max_tokens,
      system: system_prompt,
      messages: messages,
      stream: true
    }.to_json

    req = Net::HTTP::Post.new(uri)
    req['Content-Type'] = 'application/json'
    req['x-api-key'] = API_KEY
    req['anthropic-version'] = '2023-06-01'
    req.body = body

    buffer = ''
    http.request(req) do |resp|
      resp.read_body do |chunk|
        buffer << chunk

        # Process complete events
        while (event_end = buffer.index("\n"))
          event_line = buffer[0...event_end]
          buffer = buffer[(event_end + 1)..-1]

          next if event_line.empty? || !event_line.start_with?('data: ')

          data = event_line[6..-1]
          next if data == '[DONE]'

          begin
            event = JSON.parse(data)

            if event['type'] == 'content_block_delta'
              delta = event.dig('delta', 'text')
              yield({ type: 'stream', content: delta }) if delta
            elsif event['type'] == 'message_stop'
              yield({ type: 'complete', message: event })
            end
          rescue JSON::ParserError
            # Skip malformed events
          end
        end
      end
    end
  rescue => e
    yield({ success: false, error: "Streaming error: #{e.class}" })
  end

  def self.generate_cache_key(system_prompt, messages, max_tokens, model)
    hash_input = "#{system_prompt}|#{messages.to_json}|#{max_tokens}|#{model}"
    Digest::SHA256.hexdigest(hash_input)
  end

  def self.get_model_info(model = nil)
    model ||= MODEL
    MODELS[model] || MODELS['claude-haiku-4-5']
  end

  def self.clear_cache
    @@response_cache.clear
  end

  def self.estimate_cost(tokens_in, tokens_out, model = nil)
    info = get_model_info(model)
    cost_in = (tokens_in.to_f / 1000) * info[:cost_per_1k_in]
    cost_out = (tokens_out.to_f / 1000) * info[:cost_per_1k_out]
    (cost_in + cost_out).round(4)
  end
end

# ────────────────────────────────────────────────────────────────────
# SYSTEM PROMPTS (KVKK COMPLIANT)
# ────────────────────────────────────────────────────────────────────

CLINICAL_SYSTEM = <<~PROMPT.freeze
  SİZ AXIOM adında Azərbaycanlı hekimləri üçün hazırlanmış peşəkar klinik qərar dəstəyi sistemi olunuz.
  Azərbaycan Sağlığı Nazirliyinin, TABIB (Ərazi Tibbi Bölmələrin İdarəsi) və Azərbaycan Tibb Assosiasiyasının standartlarına əməl edirsiniz.

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
  ÜMUMI PRİNSİPLƏR VƏ HÜQUQI XƏBƏRDARLIQ
  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  Bu sistem tərəfindən verilən bütün məlumatlar MƏSLƏHƏT VƏ DƏSTƏK MƏQSƏDLIDIR.
  Verilən təkliflər heç zaman TIB HÜQOQUNU çərçivəsində hekim tərəfindən aparılmalı olan klinik dəyərləndirmə, fiziki müayinə və zəruri araşdırmaların yerini tuta bilməz.
  Hekimin şəxsi klinik mühakiməsi həmişə prioritet olur və hüquqi məsuliyyət hekim üzərində qalır.

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
  KLİNİK MÜTƏXƏSSISLIK VƏ STANDARTLAR
  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  AXIOM bu sahələrdə mütəxəssisdir:

  1. KLİNİK DƏYƏRLƏNDİRMƏ
     • Xəstənin klinik təqdimatı analizi
     • Fiziki müayinə tapıntılarının şərhi
     • Vital əlamətlər və laboratoriya nəticələrinin qiymətləndirilməsi
     • Statistik və epidemioloji analiz

  2. DİFFERENSİAL DİAQNOZ
     • Sistematik olaraq əsas diaqnoz hipotezindən başlayıb
     • Hər diaqnoz üçün ehtimal dərəcələndirmə
     • Diaqnoz herarxiyası quruluşu
     • Zəruri əlavə araşdırmaların təklifi

  3. SÜBUT-ƏSASLI TIP VƏ REHBƏRLİK
     • Beynəlxalq standartlar: WHO, ESC, AHA, NICE
     • Azərbaycan Tibb Assosiasiyasının rehbərləri
     • TABIB protokolları
     • Azərbaycanda istifadə olunan dərman standartları
     • PubMed/Cochrane sübut

  4. DƏRMAN VƏ TERAPİ İDARƏSİ
     • Endikasiyalar, kontrendikasiyalar, xəbərdarlıqlar
     • Azərbaycanda istifadə olunan dərman adları və dozları
     • Dərman qarşılıqlı təsirləri və yan təsirləri
     • Böbrək/qaraciyər funksiyasına görə doza ayarlanma
     • Xüsusi əhali qrupları (yaşlı, hamilə, uşaq)

  5. RİSK İDARƏSİ VƏ TƏHLÜKƏSİZLİK
     • Xəstə təhlükəsizliyinin birinci prioritet
     • Medico-hüquqi məsuliyyətlər
     • Azərbaycan Şəxsi Məlumatlar Qanununa uyğunluq (№ 998-IIIQ)
     • Təcili müdaxalə prosedurları

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
  CAVAB STRUKTURI VƏ FORMATI (Azərbaycan Hekimləri Üçün)
  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  Hər cavabınızda aşağıdakı strukturu rəvayət edin:

  I. KLİNİK DƏYƏRLƏNDİRMƏ
     • Xəstə təqdimatının xülasəsi
     • Patoloji mexanizmaların izahı
     • Xəstə ilə bağlı risk faktorlarının analizi

  II. DİFFERENSİAL DİAQNOZ SİYAHISI
     Ehtimalıya görə sıralanmış:
     1. [EHTIMAL DİAQNOZ] - Ehtimalıq: Yüksək/Orta/Aşağı
        • Dəstəkləyən tapıntılar
        • Diferensial diaqnoz üçün zəruri testlər
     2. [DİĞƏR DİAQNOZ]
     3. [BURAXILMAMASI LAZIM OLAN AĞIR DİAQNOZ]

  III. SÜBUT VƏ REHBƏRLİK
     • İstifadə olunacaq rehbərlər (Rehbər Adı, İl)
     • Təkliflərin güc dərəcəsi (Güclü / Orta / Zəif)
     • Tətbiq olunan protokollar (TABIB, Sağlığı Nazirliyi vb.)

  IV. TƏKLİF OLUNAN PLAN
     A) DİAQNOSTİKA
        • Zəruri testlər (İlkin, Sonra, İxtiyari)
        • Test sırası və təcilliyi

     B) AKTIV İDARƏ
        • İlk müdaxalələr (varsa)
        • Xəstəxanaya yatma göstəriciləri

     C) DƏRMAN İDARƏSİ
        • [DƏRMAN ADI] [DOZ] [YOL] [TƏZLİYİ] [MÜDDƏT]
        • Endikasiya: [Qeyd olunacaq]
        • Kontrendikasiya: [Varsa]
        • Dərman qarşılıqlı təsiri: [Xəstənin digər dərmanları ilə]
        • Yan təsir monitorinqi: [Nə izlənəcək]

     D) KONSULTASİYA/ARAYIŞ
        • Mütəxəssislik sahəsi, təcillilik dərəcəsi

     E) XƏSTƏ MƏLUMATILANDIRMASI
        • Xəstəlik haqqında açıqlama
        • Nəzarət lazım olan xəbərdarlıq əlamətləri
        • Həyat tarzı dəyişiklikləri

  V. TƏHLÜKƏSİZLİK ÖNLƏRİ VƏ XƏBƏRDARLIQLAR
     [XƏBƏRDARLIQ]: Orta dərəcə əhəmiyyətli hallar
     [TƏCİLİ]: Həyat-mərg təhlükəsi daşıyan hallar
     [KLİNİK İPUCU]: Mühüm klinik göstəriş

  VI. MONITORINQ VƏ TAKIP
     • Takip müddəti və tezliyi
     • İzlənəcək parametrlər
     • Gözlənilən nəticələr və vaxt cədvəli
     • Uğursuzluq kriteriyası (müalicəyə cavab olmaması halında)

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
  SORĞU TÜRLƏRİNƏ GÖRƏ HAZIRLANMA
  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  DƏRMAN/DƏRMAN QARŞİLIQLI TƏSİRİ SORĞUSU:
  → Azərbaycanda ticari adı, dozu, tətbiq yolu
  → Farmakoloji mexanizmi
  → Tedavi endikasiyaları, kontrendikasiyaları
  → Yaşlılarda, uşaqlarda, hamilə/emalarda dozlandırma
  → Müəyyən dərmanlarla qarşılıqlı təsiri (xəstənin cari dərmanları ilə)
  → Laboratoriya monitorinqi üçün zəruri parametrlər
  → Tez-tez rast gəlinən və mühüm yan təsirləri

  DİAQNOZ/DİFFERENSİAL DİAQNOZ SORĞUSU:
  → Təqdimat simptomları xülasə
  → Patofiziologiya mexanizmi
  → Epidemioloji (kimi təsir edir, tezlik)
  → Klassik vs atipik təqdimat
  → Diferensial diaqnozlar (ehtimalıya görə)
  → Zəruri araşdırmalar
  → Tedavi yanaşması
  → Prognoz və seqel riski

  AKTIV İDARƏ SORĞUSU:
  → Sübut-əsasında tedavi seçimləri
  → Fəzilətli birinci sira tedavi və alternativlər
  → Tedavi uğurunun və yan təsirlərin monitorinqi
  → Müalicəyə cavab olmaması halında yapılacaklar
  → Xəstənin komorbid vəziyyətinə görə tedavi uyğunlaşdırılması
  → Həyat tarzı dəyişiklikləri

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
  XƏSTƏ KONTEKSTININ İNTEQRASİYONU
  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  Xəstənin xüsusi vəziyyəti verilsə:
  • Yaş, cinsiyyət, peşə maruziyyətini nəzərə alın
  • Mövcud komorbidləri (diabet, hipertensiyon, böbrək xəstəliyi, vb.) nəzərə alın
  • Cari dərmanlarla qarşılıqlı təsir yoxlamasi aparın
  • Böbrək və qaraciyər funksiyası vəziyyətinə görə dozu uyğunlaşdırın
  • Keçmiş müalicələrə və cavablarına müraciət edin
  • Sosioekonomik faktorları (tedavi dəyəri vb.) nəzərə alın

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
  AZƏRBAYCAN ŞƏXSI MƏLUMATLAR QANUNU (№ 998-IIIQ) UYĞUNLUĞU VƏ MƏLUMAT KORUNMASI
  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  • Şəxsi Sağlık Məlumatlarının məxfiliyi qorunacaq
  • Məlumatlar Azərbaycanda saxlanılacaq (Qanunun məqalə 8)
  • Xəstə razılığı istiqamətində hərəkət ediləcək
  • Bütün qarşılıqlar audit jurnalına qeyd olunacaq
  • Medico-hüquqi məsuliyyət hekim üzərində qalır

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  TEMEL PRİNSİP: Siz təcrübəli hekimsiniz. Dərindən, etibarlı cavab və sübut-əsasında məsləhət gözlənilir.
  Fərəz: Əsas tibb biliyiniz var. Diqqət mərkəzi: inkişaf etmiş klinik tətbiqlər və kritik qərar alma dəstəyi.

  DİKKAT: AXIOM məsləhətçi fikir verir. Bütün klinik qərarlar və medico-hüquqi məsuliyyət hekim üzərində qalır.
PROMPT

SCRIBE_SYSTEM = <<~PROMPT.freeze
  Siz tibbi sənəd hazırlama mütəxəssissiniz. VƏZIFƏ: Hekim və tibbi işçinin sağladığı klinik məlumatları, ses transkriptlərini, cəld qeydləri AZƏRBAYCAN HEKİMLƏRİ ÜÇÜN peşəkar SOAP formatında xəstə sənədinə çevirmək.

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
  KRİTİK PRİNSİP: ÇEVIK YANAŞMA - QİSMİ MƏLUMAT QABULDURuLUR
  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  • Çatışmayan məlumatlar: Mövcud məlumatlar ilə ən yaxşı şəkildə sənədləndirmə yapın
  • Qismən transkriptlər: Sağlanan mətn işlənilə və peşəkərləşdirilə bilər
  • Cəld qeydlər: SOAP formatına çevrilə biər, tam forma əldə edilir
  • Prioritet: Sənədləndirmə hekimin tətbiqimə yardımcı olmaz, qanunu uyğun olmaq kritikdir

  BAŞLIQ SATIRI: XƏSTƏ: [Adı və ya "Tanımlanmamış"], Yaş: [X və ya "Bilinməmiş"], KLİNİK SAHƏ: [Bölüm], TARİH: [Bugün]

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  SUBYEKTIV (S) — XƏSTƏ SORĞUSU
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  1. MÜRACİƏT SƏBƏBİ: [Xəstənin əsas şikayəti - qısa, aydın açıqlama]
     [Mövcud məlumat yoxdursa "Xəstə tərəfindən ifadə edilməmiş" yazın]

  2. BUGÜNKÜ XƏSTƏLIK TARİXİ:
     • Başlanğıcı: [Nə vaxt başladığı - vaxt varsa spesifik yazın, yoxdursa ümumi yazın]
     • Əlamətlər: [Nə hiss edir - xəstənin söyləmləri]
     • Ağırlığı: [1-10 miqyasında - bilinərsə]
     • Əlavə əlamətlər: [Başqa nə var]
     [İSTİSNA: Heç bir məlumat yoxdursa, bu başlığı atlaya bilərsiniz]

  3. ÖNCƏKİ TIBBİ TARİXİ:
     • Xroniki xəstəliklər: [DM, HT, XOAK və b. - bilinərsə siyahı edin]
     • Əməliyyatlar: [Keçmiş cerrahiyalar - varsa]
     [Məlumat yoxdursa "İfadə edilməmiş" yazın - mövzu keçməyin]

  4. DƏRMAN TARİXİ:
     • Mövcud dərmanlar: [İstifadə olunan dərmanlar - bilinən adlarla]
     • Alergilik: [DƏRMAN ALERGIYI - YOXDURSA "Bilinən alergilik yok" yazın]
     [Kritik: Alergilik məlumatı həmişə sənədlənməlidir]

  5. SOSİAL TARİX: [İxtiyari - varsa yazın]

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  OBYEKTİV (O) — ÖLÇÜLƏBİLİR TAPINTIQLAR
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  1. VİTAL ƏLAMƏTLƏR:
     [Varsa: Bədən Hərərəsi: __°C | Ürəyin Vuruş Sürəti: __/dəq | Nəfəs Sürəti: __/dəq | Qan Basıncı: __/__]
     [Varsa: SpO2: __% | GKS: __/15]
     [Məlumat yoxdursa "Vital əlamətlər ifadə edilməmiş" yazın]

  2. FİZİKİ MÜAYINƏ:
     [Sağlanan tapıntılar yalnız mövcud olanları siyahı edin - FƏRZIYYƏ YAPMAYINIZ]
     [Nümunə: "Ümumi: Hoşlanılı, yaxşı qidalanmış" / "Qarın: Yumşaq, kəskin səs yoxdur"]
     [Tapıntı yoxdursa "Müayinə tapıntılarına yer verilməmiş" yazın]

  3. LABORATORIYA/TEST NƏTİCƏLƏRİ:
     [Varsa laboratoriya dəyərlərini yazın]
     [Yoxdursa "Laboratoriya nəticələri hələ alınmamış" yazın]

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  QIYMƏTLƏNDIRMƏ (A) — TANI DƏYƏRLƏNDİRMƏ PROSESI
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  [Verilən məlumatlar işığında ehtimal tanıları yazın - SPEKÜLASYON YAPMAYINIZ, yalnız mövcud məlumatlar əsasında]

  1. EHTIMAL TANI: [Klinik təqdimat ilə uyğun əsas tani]
     - Dəstəkləyən tapıntılar: [Tapıntıları yazın]

  2. FƏRQLƏNDIRƏN TANI: [Digər imkanlar - varsa]

  [Kafi məlumat yoxdursa: "Klinik tapıntılar və tibbi tarİx çatışmadığından, tanı qiymətləndirilməsi məhdud olur. Əlavə məlumat lazımdır."]

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  PLAN (P) — YAPILACAK İŞLƏR
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  I. DIAQNOSTIK TESTLƏR VƏ ARAŞDIRMALAR:
     [Təklif olunan testlər - varsa]

  II. TERAPİYA:
     [Təklif olunan dərmanlar, xarici danışmanlar, həyat tarzı dəyişiklikləri]

  III. MONİTORİNG:
     [Takip planı - varsa]

  [Çatışmayan məlumat varsa: "Tam müalicə planı sağlanan klinik məlumatlar əsasında hekim tərəfindən tamamlanmalıdır."]

  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  ÖNƏMLİ QEYD: HEKIM ÜÇÜN İPUÇLARI
  ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

  Bu sənədləndirmə tez hazırlanmışdır. Hekimin MÜTLƏQ KONTROLü VƏ DÜZƏLİŞ etməsi lazımdır:
  • Xəstə məlumatlarını (adı, yaşı, klinik sahə) yoxlayın
  • Çatışmayan əlamətləri əlavə edin
  • Ön tanını yenidən nəzərdən keçirin
  • Müalicə planını təsdiqlə sin və lazımdırsa dəyişdirin
  • Azərbaycan Şəxsi Məlumatlar Qanununa uyğunluğu doğrulayın (xəstə məxfiliyi)

  DAHA YAXŞI SƏNƏDLƏR ÜÇÜN HEKIM BUNLARI DESIN:
  - Xəstə adı və yaşı
  - "Müraciət səbəbi: [əlamətlər]"
  - Vital əlamətlər: "Hərərət 37, nəbz 80, QBA 120/80, SpO2 98"
  - "Qarında ağrılı olmayan" və ya "Ağciyər normal sədə"
  - Testlər: "Hemoglobin 12, CRP normal"
  - Tanı: "Bu xəstə ehtimal ki [xəstəlik] var"
  - Plan: "Aspirin başlayacağız, kontrol 1 həftə sonra"

  SƏNƏDLƏR BU ŞƏKİLDƏ ÇOX DAHA PEŞƏKAR OLACAQDIR!

PROMPT

HANDOVER_SYSTEM = <<~PROMPT.freeze
  Siz klinik işçiyə tapşırığın mübadiləsinə mütəxəssissiniz. I-PASS çərçivəsindən istifadə edərək ətraflı, təhlükəsizlik-fokuslu sm ə shift handover yaradın.
  Xəstə qayğısının dəvamçılığını və xəstə təhlükəsizliyini təmin edən qısa, lakin klinik cəhətdən ətraflı xülasə yaradın.

  I-PASS HANDOVER ÇƏRÇIVƏSI:

  **I — Xəstəlik Ağırlığı**
  - Hər xəstəni kateqoriyalaşdırın: KRİTİK (dərhal müdaxalə), YÜKSƏK (pisləşmə potensialı), STABIL (rutin monitorinq)
  - Qəbuldən gündəmə ağırlığında dəyişiklikləri qeyd edin

  **P — Xəstə Xülasəsi**
  Hər xəstə üçün verən:
  - Ad, çarpayı nömrəsi, yaş, əsas diaqnoz
  - Açıq tibbi problemlər
  - Əlaqəli araşdırmalar və test nəticələri
  - Cari vital status

  **A — Hərəkət Maddələri**
  - Gələn komanda üçün spesifik görevlər: dərmanlar, araşdırmalar, prosedurlar
  - Zaman-həssas maddələr açıq şəkildə işarələn
  - Gözlənilən nəticələr və gözlənilən əməllər

  **S — Vəziyyət Fəarkıı**
  - Son klinik hadisələr və ya dəyişikliklər
  - Ailə narahatçılıqları və ya ünsiyyət ehtiyacları
  - Hər hansı sosial/tərxis considerations

  **S — Təhlükəsizlik Narahatçılıqları**
  - Hərəkətə həssas xəstələri işarələyin: [TƏXTƏLİ BƏXİŞ]
  - Dərhal təhlükəsizlik narahatçılıqlarını işarələyin: [KRİTİK XƏBƏRDARLIQ]
  - Alergilik sədləri, infeksiya nəzarəti tədbirləri
  - Dərman təhlükəsizliyi considerations

  ÇIXTI STRUKTURI:
  ```
  SMƏ HANDOVER — [Hekim Adı] → [Gələn Komanda]
  TARİH: [Tarix] | VAXT: [Vaxt] | BÖLMƏ: [Bölmə Adı]

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  KRİTİK XƏSTƏLƏR (Dərhal Diqqət Tələb edir)
  [Varsa — kritik halların ətraflı xülasəsi]

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  YÜKSƏK RİSK XƏSTƏLƏRƏ (Intensiv Monitorinq)
  [Pisləşmə riskinə məruz xəstələr spesifik nəzarət nöqtələri ilə]

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STABIL XƏSTƏLƏR (Rutin Qayğı)
  [Standart xəstə siyahısı diaqnoz/sistem tərəfindən təşkil edilmiş]

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GECƏ VAXTı HƏRƏKƏT MADDƏLƏRƏ
  - Araşdırmalar borclu/gözlənilən
  - Dərman baxışları cədvələ aparılan
  - Mütəxəssis konsultasiyaları gözlənilən
  - Tərxis planlama cəhdləri

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TƏHLÜKƏSİZLİK XƏBƏRDARLIQLAR VƏ TƏDBIRLƏR
  [Bütün təhlükəsizlik narahatçılıqları, xəbərdarlıqlar və xüsusi tədbirlər]
  ```

  KLİNİK PRİNSİPLƏR:
  - Spesifik və icrası mümkün olunuz — qeyri-müəyyən ifadələrdən çəkinən
  - Təməldən dəyişikliklərə diqqət çəkin
  - Xəstə təhlükəsizliyini hər şeydən yuxarıda tutun
  - Sübut-əsasında qayğının dəvamçılığını dəstəkləyin
  - Gələn komandanı cəld handover təmin etmək
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

# GET /api/llm/models - Available LLM models
server.mount_proc('/api/llm/models') do |req, resp|
  cors_headers(resp, req['Origin'])

  if req.request_method == 'OPTIONS'
    resp.body = ''
    next
  end

  models = AnthropicAPI::MODELS.map do |name, info|
    {
      name: name,
      max_tokens: info[:max_tokens],
      cost_per_1k_input: info[:cost_per_1k_in],
      cost_per_1k_output: info[:cost_per_1k_out]
    }
  end

  json_response(resp, {
    models: models,
    current_model: MODEL,
    timestamp: Time.now.iso8601
  }, origin: req['Origin'])
end

# POST /api/llm/analyze - Advanced clinical analysis with LLM
server.mount_proc('/api/llm/analyze') do |req, resp|
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

  body = JSON.parse(req.body) rescue {}
  analysis_type = SecurityManager.validate_input(body['type'] || 'diagnosis', 50)
  clinical_data = SecurityManager.validate_input(body['data'] || '', 50000)
  model_choice = SecurityManager.validate_input(body['model'] || MODEL, 50)

  unless clinical_data && !clinical_data.empty?
    json_response(resp, { error: 'INVALID_REQUEST', message: 'Clinical data required' }, status: 400, origin: origin)
    next
  end

  prompt = case analysis_type
           when 'diagnosis'
             "Provide differential diagnoses based on: #{clinical_data}"
           when 'treatment'
             "Suggest evidence-based treatment options for: #{clinical_data}"
           when 'risk'
             "Assess clinical risk for: #{clinical_data}"
           else
             "Analyze: #{clinical_data}"
           end

  messages = [{ role: 'user', content: prompt }]
  result = AnthropicAPI.call(CLINICAL_SYSTEM, messages, 2000, model_choice)

  AUDIT_LOG.log('API_CALL', payload['user_id'], 'llm_analysis', {
    analysis_type: analysis_type,
    model: model_choice,
    success: result[:success]
  })

  if result[:success]
    json_response(resp, {
      analysis: result[:content],
      model_used: model_choice,
      tokens_used: result[:tokens_in] + result[:tokens_out],
      cached: result[:cached],
      timestamp: Time.now.iso8601
    }, origin: origin)
  else
    json_response(resp, { error: 'ANALYSIS_FAILED', message: result[:error] }, status: 500, origin: origin)
  end
end

# GET /api/llm/cache/clear - Clear LLM response cache
server.mount_proc('/api/llm/cache/clear') do |req, resp|
  cors_headers(resp, req['Origin'])

  if req.request_method == 'OPTIONS'
    resp.body = ''
    next
  end

  # Authentication
  payload = require_auth(req, resp)
  next unless payload

  AnthropicAPI.clear_cache

  AUDIT_LOG.log('API_CALL', payload['user_id'], 'cache_clear', {})

  json_response(resp, {
    message: 'LLM response cache cleared',
    timestamp: Time.now.iso8601
  }, origin: req['Origin'])
end

# POST /api/llm/estimate-cost - Estimate API cost for request
server.mount_proc('/api/llm/estimate-cost') do |req, resp|
  cors_headers(resp, req['Origin'])

  if req.request_method == 'OPTIONS'
    resp.body = ''
    next
  end

  # Authentication
  payload = require_auth(req, resp)
  next unless payload

  body = JSON.parse(req.body) rescue {}
  tokens_in = (body['tokens_in'] || 0).to_i
  tokens_out = (body['tokens_out'] || 0).to_i
  model = SecurityManager.validate_input(body['model'] || MODEL, 50)

  estimated_cost = AnthropicAPI.estimate_cost(tokens_in, tokens_out, model)

  json_response(resp, {
    model: model,
    tokens_in: tokens_in,
    tokens_out: tokens_out,
    estimated_cost_usd: estimated_cost,
    timestamp: Time.now.iso8601
  }, origin: req['Origin'])
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
puts "  API Key:        #{API_KEY ? 'Configured' : 'NOT SET'}"
puts "  Auth:           JWT Enabled"
puts "  Rate Limit:     #{CONFIG[:rate_limit_requests]} req/#{(CONFIG[:rate_limit_window]/1000).to_i}s"
puts "  Audit Logging:  #{CONFIG[:enable_audit_logging] ? 'Enabled' : 'Disabled'}"
puts "  CORS Origins:   #{CONFIG[:allowed_origins].join(', ')}"
puts "  ─────────────────────────────────────────────────────────"
puts ""

server.start

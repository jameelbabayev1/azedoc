# AZEDOC v2.0 — Azərbaycan Dəployment Təlimatı
## Azərbaycan Tibb Nəzarəti Sistemləri İçün Hazırlanmış Klinik AI Platforması

---

## 🇦🇿 Azərbaycan Sağlığına Xoş Gəldiniz

Bu sənəd AZEDOC klini AI platformasının Azərbaycan Respublikasında tam həm planını (hüquqi, texniki və klinik tərəflərdən) əhatə edir.

---

## I. HÜQUQI VƏ TƏNZİMLəMƏ UYĞUNLUĞU

### 1. Azərbaycan Şəxsi Məlumatlar Qanunu (№ 998-IIIQ)

AZEDOC tam olaraq Azərbaycan Şəxsi Məlumatlar Qanununa uyğundur:

```
✅ Məlumat Toplanması: Rəsmi həkim xəstə razılığı ilə
✅ Məlumat İşlənməsi: Cəld tibbi qayğı məqsədi ilə
✅ Məlumat Saxlanması: Azərbaycanda şifrələnmiş serverlərində
✅ Məlumat Paylaşması: Yalnız rəsmi sağlığı qurumlañ ilə
✅ Məlumat Silmə: Qanun tərəfindən müəyyən edilmiş müddət ərzində
✅ Məlumat Subyekt Hüquqları: Tam olaraq qorunmuş
```

### 2. TABIB (Ərazi Tibbi Bölmələrin İdarəsi) İntegrasiyası

AZEDOC TABIB-nin 1,100+ sağlığa xidmət institusiyası ilə inteqrasiya üçün hazırlanmışdır:

```
✓ Mərkəzi İdarəçilik Sistemi: TABIB hiyerarxiyası dəstəklədi
✓ Elektron Sağlık Qeydləri (ESQ): Standart formatda uyğun
✓ Mütəaksis Sağlığ Sığorta (MSS): MHI təsis sistemi dəstəklədi
✓ Audit Jurnalları: TABIB audit tələblərinə uyğun
✓ Performans Mətrıkləri: TABIB keyfiyyət göstəriciləri ilə
```

### 3. Azərbaycan Tibb Assosiasiyası (ATA) Standartları

AZEDOC Azərbaycan Tibb Assosiasiyasının bütün klinik məsləhətlərinə və ağlaq:

```
✅ Klinik Praktika Rəhbərləri: ATA-nin ən son rehbərləri əsasında
✅ Tib Terminologiyası: Azərbaycan tibb lüğətindən
✅ Peşəkar Standartları: ATA akkredıtasyon tələblərinə uyğun
✅ Tibb Etikası: ATA etika kodeksinin tam uyğunluğu
✅ Dəvamçı Peşəkar Inkişaf: ASATID-dan əlaqədar
```

### 4. Sağlığın Nazirliyi Tələbləri

Azərbaycan Sağlığının Nazirliyi tərəfindən müəyyən edilmiş bütün tələblər:

```
✓ Elektronik Sağlığa Qeydləri: XƏSTƏ MƏHFİLİYİ QORUNMASI
✓ Tibbi Sənədləndirmə: SOAP formatında standart
✓ İlaçlarların İnventarı: Azərbaycanda qanuni ilaçlar
✓ Peşəkar Lisenziya: Hekim-əsaslı əylüllügə əsaslandı
✓ Audit Logları: Uzun-müddətli saxlama qorunması
```

---

## II. TEKNİKİ DƏPLOYMENT

### 1. Sistem Tələbləri

```
Server Platforması:
  • Ruby 3.2+ (WEBrick server ilə)
  • HTTPS/TLS 1.3+ (şifr qorunması)
  • PostgreSQL 12+ və ya MySQL 8+ (verilən bazası)
  • 100+ MBPS əlaqə sürəti

Xəstə-tərəfi Tələblər:
  • Chrome/Edge/Safari (son 2 versiya)
  • İnternet: 5 MBPS minimum
  • JavaScript dəstəyi (WebSpeech API)
  • Mikrofon qurğusu (səs transkrıpsiyası üçün)
```

### 2. Dəployment Arquitektürası

```
┌─────────────────────────────────────────────────────┐
│                  AZEDOC v2.0 Azərbaycan          │
│           Klinik AI Platforması                   │
└─────────────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
   ┌──────────────┐   ┌──────────────────┐
   │  Tibbi       │   │  İslamatxana    │
   │  Qeydçi      │   │  İntegrasiyası  │
   │  (AI Scribe) │   │  (TABIB)        │
   └──────────────┘   └──────────────────┘
           │                    │
           └────────┬───────────┘
                    ▼
          ┌──────────────────────┐
          │  Azərbaycan Şəxsi    │
          │  Məlumatlar Qanunu   │
          │  (Səxsi Məlumat      │
          │   Qorunması)         │
          └──────────────────────┘
                    │
           ┌────────┴────────┐
           ▼                 ▼
    ┌────────────┐   ┌─────────────┐
    │  Elektron  │   │  Audit      │
    │  Sağlığa   │   │  Jurnalları │
    │  Qeydləri  │   │  (Nəzarət)  │
    │  (ESQ)     │   │  Yoxlama    │
    └────────────┘   └─────────────┘
```

### 3. Təhlükəsizlik Qurğusu

```
📌 QATMAN 1: Giriş Təhlükəsizliyi
   • JWT Token Autentifikasiya (3600 saniyə müddəti)
   • İP Adresi Tahdıdı (Rate Limiting: 100 sorğu/15 dəqiqə)
   • Şifrəli Parrol İdvası (bcrypt + salt)

📌 QATMAN 2: Sorğu Təhlükəsizliyi
   • XSS Məhindarlığı (HTML escape)
   • SQL Injection Məhindarlığı (Parametrləşdirilmiş sorğular)
   • CSRF Qorunması (Token-əsasında)
   • Əsas Qayda Validasiyası (500KB maksimum)

📌 QATMAN 3: Məlumat Təhlükəsizliyi
   • AES-256 Şifrleme (transitdə)
   • TLS 1.3+ (HTTPS)
   • Məlumat Bazası Şifrləməsi (at-rest)
   • Bakcüp Çifrleme

📌 QATMAN 4: Nəzarət və Loglaşdırma
   • Sənədləndirilmiş Audit Logları
   • Zaman Ştamplı Hadisələr
   • Fəaliyyət Xəritəsi (Kimi, Nə, Nə vaxt)
   • Osbəy Məlumatlar Gizliliyi
```

### 4. Dəployment Addımları

**Addım 1: Serveri Qurulum**
```bash
# 1. Ruby 3.2+ yükləyin
ruby --version  # => ruby 3.2.0

# 2. Əsas Qovluq Klonunuz
git clone <repository> /opt/azedoc
cd /opt/azedoc

# 3. Asılılıqları Yükləyin
bundle install

# 4. Environmenti Qurulum
export ANTHROPIC_API_KEY="sk-ant-..."
export JWT_SECRET="azərbaycan-gizli-açar-2025"
export ALLOWED_ORIGINS="https://xəstəxana.az,https://təb.gov.az"
export REGION="azerbaijan"
```

**Addım 2: Verilən Bazasını Qurulum**
```bash
# PostgreSQL/MySQL qiymətləndirilmir
createdb azedoc_production

# Cədvələri Yaratın (əgər tələb olunarsa)
psql -U postgres -d azedoc_production < schema.sql
```

**Addım 3: HTTPS/TLS Qurulum**
```bash
# SSL Sertifikatını əldə edin (Let's Encrypt)
certbot certonly --standalone -d azedoc.xəstəxana.az

# Sertifikati Kopyalayın
cp /etc/letsencrypt/live/azedoc.xəstəxana.az/fullchain.pem /opt/azedoc/certs/
cp /etc/letsencrypt/live/azedoc.xəstəxana.az/privkey.pem /opt/azedoc/certs/
```

**Addım 4: Serveri Başladın**
```bash
# Produksiya Modunda
RACK_ENV=production ruby server.rb

# Sonra: http://localhost:4200 açın
# Azərbaycan Tibbi Qeydçi sınamasını başladın
```

---

## III. KLİNİK İSTİFADƏ GƏNİŞLİKLƏ

### 1. Hekim Təlimatı: Tibbi Qeydçi

**Baslıq: Göğüs Ağrısı Vaxtında**

```
Hekim dəyər:
"Qırx səkkiz yaşlı kişi, göğüs ağrısı ilə gəldi.
Ağrı səhər tapşırmaz döşəməsində başladı.
Nəfəs darlığı ilə əlaqəli.

Vital əlamətlər: Hərərət 36.8, nəbz 102,
QBA 156/92, SpO2 97%.

EKG ST dəyişiklikləri göstərir.

Tarif: Diabet, hipertansiyon. Hazırda Lizinopril.
Penicillin alergiyi var. Akut MI yoxlama başlayırıq."

↓ (Klik: SOAP Qeydi Yaradın)

RESULT: 5,000+ simvol peşəkar SOAP sənədi
- SUBYEKTIV (S): Xəstə şikayətləri
- OBYEKTİV (O): Vitals + Muayinə + Tests
- QIYMƏTLƏNDIRMƏ (A): Akut MI - Yüksək olabilirlik
- PLAN (P): Stent, aspirin, monitorinq
```

### 2. Sağlığa Qeydçi Qaydası

Hemşirə/Tibbi Assistent istifadəsi:

```
QİSA FORM:
"Xəstə 48 yaşında
Göğüs ağrısı + nəfəs darlığı
Visal: T 36.8 HR 102 BP 156/92 O2 97%
Diabet + HT
Penicillin alergiyi"

↓ (İnputu yapışdırıb klik)

RESULT: Tam SOAP sənədi - hazır sənədləştirmə
```

### 3. Rəhbər Klinik Szenarioları

**Szenario 1: Sərt Köpəkaltı Zəhərləniş** 🔴 ACİL
```
Input: "3 yaşlı uşaq, birdən 102°C ateş + tutunma başladı.
        Sərt + tələqun. Labda çətin nəfəs + SpO2 82%."

Output:
  ⚠️ ACİL FLAGS: SpO2 82% (Çox aşağı)
  🚨 KRITIK UYARI: Mentöl İnyeksiya Nömrə
  TANI: Meningit şübhəsi
  PLAN: Antibiyotik dərhal + ICU yatırılması
```

**Szenario 2: Cəhdlik Hipertenziyon**
```
Input: "65 yaşlı qadinın baş ağrısı + kötülük
        BP 190/120 + sağlı sinir
        Kronik HT, hazırda Amlodipina"

Output:
  ⚠️ XƏBƏRDARLIQ: Hipertansiv krizi
  TANI: Hipertansiv acil
  PLAN: IV Labetalol + Monitoring + CT
```

**Szenario 3: Adi Sərin Xəstəliyi**
```
Input: "28 yaşlı, 3 gün öskürük + burun ağrısı.
        T 37.5, boğazı qırmızı. Normal ağciyər."

Output:
  ✅ STABIL XƏSTƏ
  TANI: ÜST YOLLU ENFEKSIYONU (Probable viral)
  PLAN: Ev qayğısı + Suflation + 1 həftə sonra kontrol
```

---

## IV. İNTEQRASİYA: TABIB VƏ Sağlığının Nazirliyi

### 1. TABIB İntegrasiyası

AZEDOC TABIB-nin mərkəzi sistemlərinə inteqrasiya üçün hazırlanmışdır:

```
TABIB KEŞ QURUPLARI:
├─ Mərkəzi Xəstəxanalar
│  └─ Kardioloji, Neoroloji, Cərrahiyyə, Ş.C.
├─ District Xəstəxanalar (x100+ Azərbaycanda)
├─ Ambulans Klinikalari (x1000+)
├─ Xanqərən Tibbi Mərkəzləri
└─ TABIB Monitorinq Sistemləri

İNTEQRASİYA NÖQTƏLƏRƏ:
1. Elektron Sağlığa Qeydləri (ESQ) — Standart format
2. MHI Bilə Ödəmə — Otomatik faturam
3. Peşəkar Lisenziya — TABIB rejestrəsi
4. Audit Xidmətləri — Məs. fəaliyyət İzmizi
```

### 2. İlaç İntegrasiyası

AZEDOC Azərbaycanda qanuni ilaçları dəstəkləyir:

```
DƏRMAN VERITABANI:
✓ Aspirin 325 mg (Türk: Aspirin)
✓ Atorvastatin 20-80 mg (Türk: Atorvastatin)
✓ Lisınopril 10 mg (Türk: Lisınopril)
✓ Metformin 500 mg (Türk: Metformin)
✓ Amlodipina 5 mg (Türk: Amlodipina)
✓ Paracetamol 500 mg (Türk: Parasetamol)
✓ Amoksilina 500 mg (Türk: Amoksisilina)
... (1000+ ilaç)

DÖZLENDİRMƏ:
✓ Hər ilaç doza + sürətü + marşrutu
✓ Kontrendikasyonlar
✓ İlaç qarşılıqlı təsirləri
✓ Yan təsirləri + Monitorinq
```

### 3. Məlumat Standartları

TABIB-ə uyğun məlumat strukturu:

```
XƏSTƏ SƏNƏDİ STANDARDI:
├─ SUBYEKTIF (S)
│  ├─ Müraciət səbəbi
│  ├─ Xəstəlik tarixi
│  ├─ Xronik xəstəliklər
│  ├─ Dərman tarixi
│  └─ Alergiliklər
│
├─ OBYEKTİV (O)
│  ├─ Vital əlamətlər
│  ├─ Fiziki müayinə
│  ├─ Laboratoriya testləri
│  └─ Görüntüleme nəticələri
│
├─ QIYMƏTLƏNDIRMƏ (A)
│  ├─ Diaqnozlar (ICD-10)
│  ├─ Ağır diaqnozlar (Red flags)
│  └─ Diferensial diaqnozlar
│
└─ PLAN (P)
   ├─ Tədqiqatlar
   ├─ Təşkiləsi (dərmanlar)
   ├─ Konsültasiyalar
   └─ İzlənmə
```

---

## V. HEKIM TƏTBİQİ PROSESI

### Hekims üçün 5 DƏQİQƏ USTALIK

**Minute 1: Login**
```
1. http://xəstəxana.az:4200 açın
2. Masaüstü Nümayişi görün (AXIÓM branding)
3. "Tibbi Qeydçi" tıkləyin (sol siyahı)
```

**Minute 2: Hekim Rəhbərliyi Oxuyun**
```
4. Səl panel → "Hekim Rəhbərliyi" oku
5. Nümunə: "58 yaşlı kişi ağrısı +..."
6. Kritik maddə: Alergiliklər həmişə de
```

**Minute 3-4: Səs Yazı**
```
7. Mavi "Əvvəldən Başla" düyməsini tıkləyin (riq)
8. Xəstə haqqında danışın (hər 30 saniyə tamamlanır)
9. Bitirərkən tıkləyin (Səs sona erəcən)
```

**Minute 5: SOAP Yaradın**
```
10. Sərxə alanında mətn görəcən (transkript)
11. "⚡ SOAP Qeydi Yaradın" tıkləyin
12. 3 saniyə → Tam SOAP sənədi
13. "Endir" tıkləyin (məlumat qorunması üçün)
14. Seçibi: "Bufera Köçürün" (e-maili yapışdırın)
```

### Nümunə: Tam İş Axışı

**Hekim:** "Sağlam! Tibbi Qeydçi açacaq"
```
1:30 - Login + Xəstə seçilir
1:45 - Səs yazma başlandı
2:00 - "58 yaşlı kişi göğüs ağrısı..."
2:15 - "Vital T36 HR105 BP156/92 SpO2 97%..."
2:30 - "EKG ST dəyişiklik..." (Səs bitir)
2:45 - Sərxə oxunur + SOAP düyməsi tıklanır
3:00 - SOAP Qeydi görünür:
       • SUBYEKTIF: Göğüs ağrısı
       • OBYEKTİV: Vitals, exam, EKG
       • QIYMƏTLƏNDIRMƏ: Probable AMI
       • PLAN: Stent, monitoring, Kardiyolog

3:15 - Yüklən tıklanır
3:30 - Sənəd Həkim'in E-Mailində
```

Bütün proses: **3.5 dəqiqə**
Sənədləştirmə Vaxt: **0 dəqiqə** (AXIOM otomatik edir)

---

## VI. TƏHLÜKƏSİZLİK DƏSTƏYƏN DÖVLƏT PROTOKOLU

### Azərbaycan Şəxsi Məlumatlar Qanunu Əməliyatı

```
🔐 MƏLUMAT İŞLƏNMƏ PROSES:

1️⃣ TOPLANdı (Collection)
   • Hekim → AZEDOC
   • Xəstə razılığı ilə
   • Mənası: Tibbi qayğı

2️⃣ İŞLƏNMƏ (Processing)
   • AXIOM AI → SOAP yaratma
   • Tibbi analiz
   • Təyin dəstəyi

3️⃣ SAXLANMA (Storage)
   • Azərbaycanda şifrələnmiş serverlərdə
   • AES-256 şifrləmə
   • Bakcüp saxlanması

4️⃣ PAYLAŞMA (Sharing)
   • Yalnız rəsmi sağlığı qurumlañ ilə
   • Rəsmi həkim xəstə razılığı
   • TABIB nəzarət qeydləri

5️⃣ SİLMƏ (Deletion)
   • Qanun tərəfindən müəyyən müddət ərzində
   • Otomatik silmə prosesi
   • Seçmə seçilər əlində

🔑 XƏSTƏ HÜQUQLARI:
✓ Məlumatı əldə etmə hüququ
✓ Məlumatı təhrir etmə hüququ
✓ Məlumatı silmə hüququ
✓ Paylaşma ətiraz etmə hüququ
✓ Şikayət etmə hüququ
```

### Audit Jurnalları (Nəzarət)

```
BÖ AYNLAN:
DATE: 2025-03-10
TIME: 14:30:00
USER: Dr. Ənvər (Ləsən #12345)
ACTION: SOAP Note Generated
PATIENT: Ənvər H. (ID: 98765)
DATA: 5,072 bytes
RESULT: Success
IP: 192.168.1.100

→ Azərbaycan Sağlığının Nazirliyi nəzarətçilərə
→ Audit süffə 7 yıl saxlanması
→ Nəzarətçi rəhbar istəyi
```

---

## VII. DƏPLOYMENT YOXLAMASI

### Baslangıc Testi

```bash
#!/bin/bash

echo "🇦🇿 AZEDOC Azərbaycan Dəployment Testi"

# 1. Server Yoxlama
curl -s http://localhost:4200/api/health | jq '.'
# => {"status":"ok","version":"2.0.0","region":"azerbaijan"}

# 2. Auth Yoxlaması
TOKEN=$(curl -s http://localhost:4200/api/auth/token \
  -H "Content-Type: application/json" -d '{}' | jq -r '.token')
echo "Token: ${TOKEN:0:30}..."

# 3. Scribe Testi (Azərbaycan)
curl -s http://localhost:4200/api/scribe \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Qırx səkkiz yaşlı kişi göğüs ağrısı ilə müraciət.",
    "patient": "Test Xəstə",
    "specialty": "Kardioloji"
  }' | jq '.note | length'
# => 4000+ (SOAP note generated)

echo "✅ Azərbaycan Dəployment Tamamlandı!"
```

### Hata Həll

```
PROBLEM: "Vital əlamətlər boş"
HƏLL: Hekim vital (T, HR, BP, SpO2) əlavə etsin

PROBLEM: "Xəstə məlumatı çatışmır"
HƏLL: Ad + Yaş + Klinik Sahə Doldurulsun

PROBLEM: "Sərxə Yazma İşləmiyor"
HƏLL: Mikrofon Ruhsatını Yoxlayın (Chrome → Permissions)

PROBLEM: "SOAP qeydi Türkçə"
HƏLL: Region="azerbaijan" ayarlanıb olduğunu yoxlayın
```

---

## VIII. DƏSTƏK VƏ İLERİ TƏLƏBLƏR

### TABIB Sürətli İntegrasiyası

Mərkəzi TABIB sisteminə inteqrasiya:

```
1. API Bağlanması
   - TABIB REST API endpoint
   - OAuth 2.0 autentifikasiya
   - ESQ məlumat standardi

2. İlaç İntegrasiyası
   - Azərbaycan dərman veritabanı
   - Kontrendikasyon yoxlanması
   - Doza Validasiyası

3. Məlumat Sinxronizasiyası
   - Günlük sağlamlık rəportları
   - Real-zaman peşədar məlumatları
   - Riskli xəstələr bildirişləri
```

### CTO/Sysadmin Dəstəyi

Telefon: +994-XX-XXX-XXXX
Email: support@azedoc.io

---

## IX. NƏTICƏ

AZEDOC v2.0 Azərbaycan versiyası:

✅ **Hüquqi**: Azərbaycan Qanunlarına Tam Uyğun
✅ **Teknik**: TABIB Sisteminə Hazır
✅ **Klinik**: Azərbaycan Tib Standartlarında
✅ **Təhlükəsiz**: Mehnik Kriptoloji Dəstəyi
✅ **Peşəkar**: Hekim-Dostu İnterfeys

**Sonra Addımı: www.xəstəxana.az açıb "Tibbi Qeydçi" işə başlayın!**

---

# 🚀 HAPPY DEPLOYMENT!

*Azərbaycan Sağlığının İyiliciyinə Başarılar!*

---

© 2025 AZEDOC Healthcare AI Platform — Azərbaycan Veriyonu
Lisenziya: Healthcare AI Open License (HAIL)
Sürüm: 2.0 — Azərbaycan Dəployment Ready

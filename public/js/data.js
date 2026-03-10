// AZEDOC — Patient Data Engine
// Realistic clinical data for 16 ward patients

(function(global) {
'use strict';

const now = new Date();
const h = (n) => new Date(now - n * 3600000);
const fmt = (d) => d.toISOString();

function genVitals(base, hours = 24) {
  const out = [];
  for (let i = hours; i >= 0; i--) {
    out.push({
      time: fmt(h(i)),
      hr:     Math.round(base.hr     + (Math.random()-.5) * base.hrVar),
      bp_sys: Math.round(base.bp_sys + (Math.random()-.5) * base.bpVar),
      bp_dia: Math.round(base.bp_dia + (Math.random()-.5) * (base.bpVar*.6)),
      temp:   Math.round((base.temp  + (Math.random()-.5) * base.tempVar) * 10) / 10,
      rr:     Math.round(base.rr     + (Math.random()-.5) * base.rrVar),
      spo2:   Math.min(100, Math.round(base.spo2  + (Math.random()-.5) * base.spo2Var)),
    });
  }
  return out;
}

function news2(v) {
  let s = 0;
  // RR
  if (v.rr <= 8 || v.rr >= 25) s += 3;
  else if (v.rr >= 21) s += 2;
  else if (v.rr <= 11) s += 1;
  // SpO2
  if (v.spo2 <= 91) s += 3;
  else if (v.spo2 <= 93) s += 2;
  else if (v.spo2 <= 95) s += 1;
  // BP sys
  if (v.bp_sys <= 90) s += 3;
  else if (v.bp_sys <= 100) s += 2;
  else if (v.bp_sys <= 110) s += 1;
  // HR
  if (v.hr <= 40 || v.hr >= 131) s += 3;
  else if (v.hr >= 111) s += 2;
  else if (v.hr <= 50 || v.hr >= 91) s += 1;
  // Temp
  if (v.temp <= 35.0) s += 3;
  else if (v.temp <= 36.0 || v.temp >= 39.1) s += 2;
  else if (v.temp <= 36.0 || v.temp >= 38.1) s += 1;
  return s;
}

function riskLevel(score) {
  if (score >= 7) return 'critical';
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  if (score >= 1) return 'low';
  return 'stable';
}

const PATIENTS = [
  {
    id: 'P001',
    name: 'Cəmil Tompson',
    age: 68, gender: 'Kişi', dob: '1957-03-15',
    ward: '7', bed: '7B',
    diagnosis: 'Sidik Yollarının İnfeksiyasına Bağlı Sepsis',
    diagnosisSecondary: ['Kəskin Böbrek Zədələnməsi 3-cü Mərhələdə Xroniki Böbrek Xəstəliyi', '2-ci Tip Diabet'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Artan zəiflik, sidik ifrazının azalması, yandırıcı sidik ifrazı 48 saat müddətində',
    consultant: 'Dr. Patel (Kəskin Tibb)',
    vitalsBase: {"hr":104,"bp_sys":98,"bp_dia":62,"temp":38.4,"rr":22,"spo2":94,"hrVar":8,"bpVar":12,"tempVar":0.4,"rrVar":3,"spo2Var":2},
    medications: [
      { name:'Piperacillin-Tazobactam', dose:'4.5g', route:'IV', frequency:'Günə 3 dəfə', prescribed_by:'Dr. Martinez' },
      { name:'0.9% Sodyum Xlorid', dose:'500ml', route:'IV', frequency:'4 saata bir', prescribed_by:'Dr. Martinez' },
      { name:'Metformin', dose:'500mg', route:'PO', frequency:'Günə 2 dəfə', prescribed_by:'Dr. Patel - DAYANDIRILAN' },
      { name:'Ramipril', dose:'5mg', route:'PO', frequency:'Günə 1 dəfə', prescribed_by:'Dr. Patel - DAYANDIRILAN' },
      { name:'Insulin Aktrapid (sürüşkən miqyaslı)', dose:'protokola görə', route:'SC', frequency:'Günə 4 dəfə', prescribed_by:'Dr. Martinez' }
    ],
    allergies: [
      { allergen:'Penisilin', reaction:'Döş', severity:'yüngül' }
    ],
    labs: [
      { test:'Laktat', value:2.4, unit:'mmol/L', ref:'<2.0', status:'critical', time:fmt(h(2)) },
      { test:'Kreatinin', value:198, unit:'µmol/L', ref:'59–104', status:'high', time:fmt(h(2)) },
      { test:'eGFR', value:28, unit:'mL/min', ref:'>60', status:'low', time:fmt(h(2)) },
      { test:'CRP', value:214, unit:'mg/L', ref:'<5', status:'critical', time:fmt(h(2)) },
      { test:'Ləpə', value:14.2, unit:'×10⁹/L', ref:'4–11', status:'high', time:fmt(h(2)) },
      { test:'Hemoglobin', value:108, unit:'g/L', ref:'130–175', status:'low', time:fmt(h(2)) },
      { test:'Qan Şəkəri', value:14.8, unit:'mmol/L', ref:'4–7', status:'high', time:fmt(h(2)) },
      { test:'Qan Kultürləri x2', value:'Gözləniş', unit:'', ref:'Böyümə yoxdur', status:'normal', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'22:00-da Laktat Təkrarlanması', priority:'urgent', due:'ASAP' },
      { action:'Uroloqiya Müayinəsi — böbrek mənbəyi sorğusu', priority:'routine', due:'Today' },
      { action:'Qan Kultürü Nəticələri — həssaslığa səbəb olmaq', priority:'urgent', due:'ASAP' },
      { action:'Nefroloqiya əgər AKI kötüləşərsə nəzərdən keçirin', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Təcili Yardım vasitəsilə qəbul edildi. Sepsis 6 başlandı.', severity:'critical' },
      { time:fmt(h(24)), event:'Qan Kultürləri alındı. IV antibiotiklər başlandı (Koamoksiklav ilkin).', severity:'warn' },
      { time:fmt(h(20)), event:'Antibiotik Tazocin-ə yüksəldildi zəif cavabdan sonra.', severity:'warn' },
      { time:fmt(h(16)), event:'Laktat Təkrarlanması: 2.4 (1.8-dən yuxarı). HDU istiqamətləndirilməsi müzakirə edildi.', severity:'critical' },
      { time:fmt(h(12)), event:'Uroloqiya ilə əlaqə saxlanıldı. Maye zərbəsi verildi.', severity:'warn' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P002',
    name: 'Marqaret Foster',
    age: 72, gender: 'Qadın', dob: '1953-07-22',
    ward: '7', bed: '3C',
    diagnosis: 'Cəmiyyətdə Qazanılmış Pnevmoniya',
    diagnosisSecondary: ['XOB (GOLD III)', 'Hipertenziya'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Artan Nəfəs Darlığı, Verimli Öskürək, 4 Gün Ateş',
    consultant: 'Dr. Okafor (Respirator Xəstəlikləri)',
    vitalsBase: {"hr":94,"bp_sys":148,"bp_dia":88,"temp":37.2,"rr":20,"spo2":92,"hrVar":6,"bpVar":10,"tempVar":0.3,"rrVar":2,"spo2Var":3},
    medications: [
      { name:'Amoksisilin', dose:'500mg', route:'PO', frequency:'Günə 3 dəfə', prescribed_by:'Dr. Okafor' },
      { name:'Klaritromitsin', dose:'500mg', route:'PO', frequency:'Günə 2 dəfə', prescribed_by:'Dr. Okafor' },
      { name:'Prednizolon', dose:'30mg', route:'PO', frequency:'Günə 1 dəfə', prescribed_by:'Dr. Okafor' },
      { name:'Salbutamol Nebulizer', dose:'2.5mg', route:'Neb', frequency:'Günə 4 dəfə', prescribed_by:'Dr. Okafor' },
      { name:'Amlodipine', dose:'10mg', route:'PO', frequency:'Günə 1 dəfə', prescribed_by:'Dr. Chen (Həkim)' },
      { name:'Ramipril', dose:'5mg', route:'PO', frequency:'Günə 1 dəfə', prescribed_by:'Dr. Chen (Həkim)' }
    ],
    allergies: [
    ],
    labs: [
      { test:'CRP', value:89, unit:'mg/L', ref:'<5', status:'high', time:fmt(h(2)) },
      { test:'Ləpə', value:11.4, unit:'×10⁹/L', ref:'4–11', status:'high', time:fmt(h(2)) },
      { test:'Döş Radiografiyası', value:'Yaxşılaşan ikitərəfli konsolidasiya', unit:'', ref:'Təmiz', status:'normal', time:fmt(h(2)) },
      { test:'Hemoglobin', value:118, unit:'g/L', ref:'115–160', status:'low', time:fmt(h(2)) },
      { test:'Elektrolit', value:'Normal limitlər daxilində', unit:'', ref:'Normal', status:'normal', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'Ağız Antibiotiklərə Keçid — bu səhər qiymətləndir', priority:'routine', due:'Today' },
      { action:'Fizioterapiya İstiqamətləndirilməsi — döş fizioterapi', priority:'routine', due:'Today' },
      { action:'Emkodiyasiya Terapist Qiymətləndirmə — təhlükəsiz dəşarja planlaşdırma', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Qəbul edildi. SpO2 87% havada. O2 başlandı. Döş Radiografiyası ikitərəfli konsolidasiya.', severity:'critical' },
      { time:fmt(h(24)), event:'IV Antibiotiklər üzərində yaxşılaşdı. PO-ya keçid nəzərdən keçirildi.', severity:'warn' },
      { time:fmt(h(20)), event:'Mobil. Ağız Dəvalarını qəbul etməkdə. Emkodiyasiya Terapist Qiymətləndirmə rezerv edildi.', severity:'good' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P003',
    name: 'Robert Adeyemi',
    age: 55, gender: 'Kişi', dob: '1970-11-08',
    ward: 'CCU', bed: '2A',
    diagnosis: 'ST-Yüksəlişli Miokard İnfarktusu (post-PPCI)',
    diagnosisSecondary: ['Koronaryar Arterial Xəstəliyi', 'Hipertenziya'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Kəskin Döş Ağrısı. STEMI Təsdiqləndi. Təcili PPCI Həyata Keçirildi.',
    consultant: 'Dr. Singh (Kardioloqiya)',
    vitalsBase: {"hr":78,"bp_sys":130,"bp_dia":80,"temp":36.9,"rr":16,"spo2":97,"hrVar":5,"bpVar":8,"tempVar":0.2,"rrVar":2,"spo2Var":1},
    medications: [
      { name:'Aspirin', dose:'75mg', route:'PO', frequency:'Günə 1 dəfə', prescribed_by:'Dr. Singh' },
      { name:'Tiqaqlelor', dose:'90mg', route:'PO', frequency:'Günə 2 dəfə', prescribed_by:'Dr. Singh' },
      { name:'Atorvastatin', dose:'80mg', route:'PO', frequency:'Gecə', prescribed_by:'Dr. Singh' },
      { name:'Bisoprolol', dose:'2.5mg', route:'PO', frequency:'Günə 1 dəfə', prescribed_by:'Dr. Singh' },
      { name:'Ramipril', dose:'2.5mg', route:'PO', frequency:'Günə 1 dəfə', prescribed_by:'Dr. Singh' },
      { name:'GTN Spreyı', dose:'400mcg', route:'SL', frequency:'Zərurətində', prescribed_by:'Dr. Singh' }
    ],
    allergies: [
      { allergen:'Lateks', reaction:'Kontakt Dermatiti', severity:'yüngül' }
    ],
    labs: [
      { test:'Troponin I', value:4.2, unit:'ng/mL', ref:'<0.04', status:'critical', time:fmt(h(2)) },
      { test:'Kreatinin', value:92, unit:'µmol/L', ref:'59–104', status:'normal', time:fmt(h(2)) },
      { test:'Kolesterol', value:5.8, unit:'mmol/L', ref:'<5.2', status:'high', time:fmt(h(2)) },
      { test:'EKQ', value:'Ön STEMI, Reperfuziya', unit:'', ref:'Normal', status:'critical', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'Kardiyak Reabilitasiya İstiqamətləndirilməsi', priority:'routine', due:'Today' },
      { action:'6-8 Həftə Ambulatory Ekokardiografiya Təkrarlama', priority:'routine', due:'Today' },
      { action:'Həyat Tərzi Məsləhəti — Siqaret Çəkmədən Çıx, Pəhriz', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Qəbul edildi. EKQ: Ön STEMI. Kateterizm Laboratoriyası Aktivləşdirildi.', severity:'critical' },
      { time:fmt(h(24)), event:'Əmələ Gəlmiş PPCI LAD-a. Dərman Ayrılan Stent Qoyuldu.', severity:'good' },
      { time:fmt(h(20)), event:'CCU-dən Otağa Köçürüldü. Hemodik Olaraq Stabil.', severity:'good' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P004',
    name: 'Sarah Okonkwo',
    age: 42, gender: 'Qadın', dob: '1983-05-19',
    ward: '7', bed: '5D',
    diagnosis: 'Ağciyər Emboliyası',
    diagnosisSecondary: ['Dərin Venaların Trombozası', 'Kontraseptiv-Həridən Tromboembolizm'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Kəskin Nəfəs Darlığı və Pleuritik Döş Ağrısı Başlanması. D-Dimmer 4.8. KTPA PE Təsdiqlədi.',
    consultant: 'Dr. Okafor (Respirator Xəstəlikləri)',
    vitalsBase: {"hr":112,"bp_sys":112,"bp_dia":72,"temp":37.1,"rr":24,"spo2":91,"hrVar":8,"bpVar":12,"tempVar":0.3,"rrVar":4,"spo2Var":4},
    medications: [
      { name:'Apixaban', dose:'10mg', route:'PO', frequency:'Günə 2 dəfə (7 gün yüklənmə)', prescribed_by:'Dr. Okafor' },
      { name:'Paracetamol', dose:'1g', route:'PO', frequency:'Günə 4 dəfə Zərurətində', prescribed_by:'Dr. Okafor' }
    ],
    allergies: [
    ],
    labs: [
      { test:'D-Dimmer', value:4.8, unit:'µg/L', ref:'<0.5', status:'critical', time:fmt(h(2)) },
      { test:'Trombin Zamanı', value:12.5, unit:'san', ref:'11–13.5', status:'normal', time:fmt(h(2)) },
      { test:'KTPA', value:'İkitərəfli PE Təsdiqlədi', unit:'', ref:'Yoxdur', status:'critical', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'KOK-ı Dayandır — Pasiyent Məsləhət Verildi', priority:'urgent', due:'ASAP' },
      { action:'Trombofili Sütütü (Antikoaguləsyon Əvvəl Nəticələri)', priority:'routine', due:'Today' },
      { action:'Hematoologiya Müayinəsi Həmin vs Təmin Edilməmiş PE Qiymətləndirməsi', priority:'routine', due:'Today' },
      { action:'Antikoaguləsyon Müddəti Müzakirəsi', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Nəfəs Darlığı ilə Qəbul Edildi. EKQ: Sinus Tachycardia. KTPA Əmr Edildi.', severity:'warn' },
      { time:fmt(h(24)), event:'KTPA: İkitərəfli PE Təsdiqlədi. Apixaban Başlandı.', severity:'critical' },
      { time:fmt(h(20)), event:'Sağ Ayaq DVT Təsdiqlədi. SpO2 Havada Yaxşılaşır.', severity:'warn' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P005',
    name: 'George Papadopoulos',
    age: 76, gender: 'Kişi', dob: '1949-09-12',
    ward: '7', bed: '1A',
    diagnosis: 'Kəskin Dekompensasiyalı Ürək Çatışmazlığı',
    diagnosisSecondary: ['Aortik Stenoz', 'Atrial Fibrilasiya', 'Xroniki Böbrek Xəstəliyi'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Tədricən Artan Nəfəs Darlığı, İkitərəfli Ayaq Şişkinliyi, 1 Həftə Ərzində 4 kq Çəki Artması',
    consultant: 'Dr. Singh (Kardioloqiya)',
    vitalsBase: {"hr":88,"bp_sys":142,"bp_dia":88,"temp":37.3,"rr":20,"spo2":93,"hrVar":8,"bpVar":14,"tempVar":0.3,"rrVar":3,"spo2Var":2},
    medications: [
      { name:'Furosemid', dose:'80mg', route:'IV', frequency:'Günə 2 dəfə', prescribed_by:'Dr. Singh' },
      { name:'Spironolakton', dose:'25mg', route:'PO', frequency:'Günə 1 dəfə', prescribed_by:'Dr. Singh' },
      { name:'Bisoprolol', dose:'1.25mg', route:'PO', frequency:'Günə 1 dəfə', prescribed_by:'Dr. Singh' },
      { name:'Apixaban', dose:'2.5mg', route:'PO', frequency:'Günə 2 dəfə', prescribed_by:'Dr. Singh' },
      { name:'Atorvastatin', dose:'20mg', route:'PO', frequency:'Gecə', prescribed_by:'Dr. Singh' },
      { name:'Amlodipine', dose:'5mg', route:'PO', frequency:'Günə 1 dəfə - DAYANDIRILAN (hipotenziya)', prescribed_by:'Dr. Singh' }
    ],
    allergies: [
      { allergen:'ACE İnhibitorləri', reaction:'Angioedema', severity:'ciddi' }
    ],
    labs: [
      { test:'BNP', value:4100, unit:'pg/mL', ref:'<100', status:'critical', time:fmt(h(2)) },
      { test:'Kreatinin', value:145, unit:'µmol/L', ref:'59–104', status:'high', time:fmt(h(2)) },
      { test:'Potassium', value:5.2, unit:'mmol/L', ref:'3.5–5.0', status:'high', time:fmt(h(2)) },
      { test:'Ekokardiografiya', value:'LVEF 28%, Ağır Aortik Stenoz', unit:'', ref:'Normal', status:'critical', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'Gündəlik Çəki Monitoring (Hədəf min -500g/gün)', priority:'urgent', due:'ASAP' },
      { action:'Səhər Elektrolit Təkrarlama', priority:'urgent', due:'ASAP' },
      { action:'Kardioloq ilə Ekokardiografiya Müayinəsi — AS Ağırlığını Yenidən Qiymətləndir', priority:'routine', due:'Today' },
      { action:'Aiə Toplantısı Prognoz və Baxış Məqsədləri Haqqında', priority:'urgent', due:'ASAP' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Qəbul edildi. BNP 4100. Bilateral Cracklləri Orta Zonaların Daxilində. IV Furosemid Başlandı.', severity:'critical' },
      { time:fmt(h(24)), event:'Yaxşı Diuretik Cavab. 2L Çıxarılmış. Cracklləri Yaxşılaşır.', severity:'good' },
      { time:fmt(h(20)), event:'BNP 2840-ə Azalır. Hələ IV Diuretiklər Tələb Edir.', severity:'warn' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P006',
    name: 'Priya Sharma',
    age: 31, gender: 'Qadın', dob: '1994-12-07',
    ward: '6', bed: '2C',
    diagnosis: 'Diabetik Ketoacidosis (DKA)',
    diagnosisSecondary: ['1-ci Tip Diabet (Yeni Diaqnostika)'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Qusma, Karın Ağrısı, Qan Şəkəri 32 mmol/L. Ketonlər 4+',
    consultant: 'Dr. Gupta (Endokrinoloqiya)',
    vitalsBase: {"hr":118,"bp_sys":96,"bp_dia":58,"temp":37.8,"rr":26,"spo2":95,"hrVar":10,"bpVar":8,"tempVar":0.5,"rrVar":4,"spo2Var":2},
    medications: [
      { name:'IV İnsulin (Sabit Nisbət)', dose:'0.1 unit/kq/saat', route:'IV', frequency:'DKA Protokolu', prescribed_by:'Dr. Martinez' },
      { name:'0.9% NaCl', dose:'1L/saat İlkin', route:'IV', frequency:'DKA Protokolu', prescribed_by:'Dr. Martinez' },
      { name:'KCl Qida Əlavəsi', dose:'Protokola Görə', route:'IV', frequency:'U&E-ə Görə', prescribed_by:'Dr. Martinez' }
    ],
    allergies: [
    ],
    labs: [
      { test:'Qan Şəkəri', value:32.4, unit:'mmol/L', ref:'4–7', status:'critical', time:fmt(h(2)) },
      { test:'pH', value:7.18, unit:'', ref:'7.35–7.45', status:'critical', time:fmt(h(2)) },
      { test:'Bikarbonat', value:12, unit:'mmol/L', ref:'22–26', status:'critical', time:fmt(h(2)) },
      { test:'Ketonlər', value:4.8, unit:'mmol/L', ref:'<0.6', status:'critical', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'Saatda Bir Qan Şəkəri Monitoring DKA Protokolu', priority:'urgent', due:'ASAP' },
      { action:'Ketone Çek — <0.6 Həlli Üçün Hədəf', priority:'urgent', due:'ASAP' },
      { action:'Ketonlər <0.6 Olduqda: Subkutan İnsulina Keç', priority:'urgent', due:'ASAP' },
      { action:'DKA Təhrikatını Müəyyən Et (İnfeksiya Sütütünü Nəzərdən Keçir)', priority:'routine', due:'Today' },
      { action:'DSN (Diabet Mütəxəssis Məstərləri) Müayinəsi', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Qəbul edildi. DKA Protokolu Başlandı. pH 7.18. BG 32.4', severity:'critical' },
      { time:fmt(h(24)), event:'Müalicəyə Cavab Verir. BG 18.2. pH 7.28. Ketonlər Azalır.', severity:'warn' },
      { time:fmt(h(20)), event:'Ketonlər 2.1. Yaxşılaşmağa Davam Edir. K+ Stabil.', severity:'good' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P007',
    name: 'William Clarke',
    age: 58, gender: 'Kişi', dob: '1967-01-25',
    ward: '6', bed: '4B',
    diagnosis: 'Üstün QI Qanaxma (Hematemesis)',
    diagnosisSecondary: ['Mide Xorası (Pepsin Sahalanmış)', 'Alkohol Konsumpsiyası'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Qan Tüksürməsi (3 Dəfə), Melena, Baş Döndərmə, Zəiflik',
    consultant: 'Dr. Richards (Emetoqastroenteroloji Xəstəliklər)',
    vitalsBase: {"hr":106,"bp_sys":124,"bp_dia":76,"temp":37.4,"rr":18,"spo2":94,"hrVar":8,"bpVar":10,"tempVar":0.3,"rrVar":2,"spo2Var":2},
    medications: [
      { name:'Omeprazol', dose:'40mg', route:'IV', frequency:'Günə 2 dəfə', prescribed_by:'Dr. Richards' },
      { name:'0.9% NaCl', dose:'Tez İnfuziya', route:'IV', frequency:'Hemodik Stabilləşməsinə Qədər', prescribed_by:'Dr. Martinez' },
      { name:'Plasma', dose:'4 Unitə', route:'IV', frequency:'Bir Dəfə', prescribed_by:'Dr. Richards' }
    ],
    allergies: [
      { allergen:'NSAID', reaction:'Qaşıntı', severity:'yüngül' }
    ],
    labs: [
      { test:'Hemoglobin', value:78, unit:'g/L', ref:'130–180', status:'critical', time:fmt(h(2)) },
      { test:'INR', value:1.8, unit:'', ref:'<1.2', status:'high', time:fmt(h(2)) },
      { test:'Trombosit', value:145, unit:'×10⁹/L', ref:'150–400', status:'low', time:fmt(h(2)) },
      { test:'Ürəmiya', value:12.4, unit:'mmol/L', ref:'<7.8', status:'high', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'OGD (Üst QI Endoskopiya) — Son Cəhd ilə Hemostasis', priority:'urgent', due:'ASAP' },
      { action:'Kan Məhsulları — Hb >80 Hədəfinə Qədər Əlavə Transfuziyası', priority:'urgent', due:'ASAP' },
      { action:'Cərrahi Danışma əgər Endoskopi Uğursuz Olsa', priority:'urgent', due:'ASAP' },
      { action:'Alkohol Abstinensiya Məsləhəti', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Qan Tüksürməsi ilə Təcili Yardım Vasitəsilə Qəbul Edildi. Hemoglobin 78.', severity:'critical' },
      { time:fmt(h(24)), event:'OGD: Aktiv Mide Xorası Hemoraji Dağlanması. Adrenalin İnyeksiyası + Klip Əlavə Edildi.', severity:'critical' },
      { time:fmt(h(20)), event:'Post-OGD Stabil. Hb 88-ə Qaldırılmış. Təkrar Qanaxma Yoxdur.', severity:'good' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P008',
    name: 'Emily Watson',
    age: 64, gender: 'Qadın', dob: '1961-06-14',
    ward: '5', bed: '6A',
    diagnosis: 'Xroniki Pnevmopatiya Obstruksiya ilə Kəskin Iltişab',
    diagnosisSecondary: ['Tip 2 Respirator Çatışmazlığı', 'Metabolik Asidosis'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Artan Nəfəs Darlığı, SpO2 82% Havada, Məntallaşma',
    consultant: 'Dr. Chen (Yoğun Bakım)',
    vitalsBase: {"hr":92,"bp_sys":118,"bp_dia":74,"temp":36.8,"rr":24,"spo2":85,"hrVar":6,"bpVar":10,"tempVar":0.3,"rrVar":5,"spo2Var":5},
    medications: [
      { name:'Bi-PAP', dose:'IPAP 18 EPAP 5', route:'Respirator', frequency:'Daimi', prescribed_by:'Dr. Chen' },
      { name:'Aminofillin', dose:'250mg', route:'IV', frequency:'Günə 2 dəfə', prescribed_by:'Dr. Chen' },
      { name:'Budesonid/Formoterol', dose:'160/4.5 mcq', route:'Inhaler', frequency:'Günə 2 dəfə', prescribed_by:'Dr. Chen' }
    ],
    allergies: [
    ],
    labs: [
      { test:'pH', value:7.25, unit:'', ref:'7.35–7.45', status:'low', time:fmt(h(2)) },
      { test:'PaCO2', value:68, unit:'mmHg', ref:'35–45', status:'high', time:fmt(h(2)) },
      { test:'PaO2', value:52, unit:'mmHg', ref:'>60', status:'low', time:fmt(h(2)) },
      { test:'Bikarbonat', value:28, unit:'mmol/L', ref:'22–26', status:'high', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'Nə-invaziv Ventilasiya Toleranc Monitoring', priority:'urgent', due:'ASAP' },
      { action:'Arterial Qaz Saat Sonra Təkrarla', priority:'urgent', due:'ASAP' },
      { action:'Respirator Cihazı Müayinəsi', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Kəskin Nəfəs Darlığı ilə Qəbul Edildi. pH 7.25. Bi-PAP Başlandı.', severity:'critical' },
      { time:fmt(h(24)), event:'pH 7.28-ə Yaxşılaşdı. PaCO2 Azaldı. Bi-PAP-a Davam Edir.', severity:'warn' },
      { time:fmt(h(20)), event:'Daim Yaxşılaşır. Respirator Cihazı Ehtiyacı Azalır.', severity:'good' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P009',
    name: 'Mohammed Khan',
    age: 46, gender: 'Kişi', dob: '1979-03-30',
    ward: '8', bed: '2B',
    diagnosis: 'Kəskin Pankreatit',
    diagnosisSecondary: ['Qallaştaş Etiyoloji', 'Hipertriqliseridemia'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Kəskin Üstün Sol Karın Ağrısı, Səbəbiysiz Qusma, Amilaza 850',
    consultant: 'Dr. Kumar (Cərrahi)',
    vitalsBase: {"hr":102,"bp_sys":130,"bp_dia":78,"temp":38.2,"rr":22,"spo2":96,"hrVar":8,"bpVar":12,"tempVar":0.6,"rrVar":3,"spo2Var":1},
    medications: [
      { name:'0.9% NaCl', dose:'200ml/saat', route:'IV', frequency:'Restitüsyon Protokolu', prescribed_by:'Dr. Martinez' },
      { name:'Morfin', dose:'5mg', route:'IV', frequency:'4-6 Saata Bir Zərurətində', prescribed_by:'Dr. Kumar' },
      { name:'Ranitidine', dose:'50mg', route:'IV', frequency:'Günə 2 dəfə', prescribed_by:'Dr. Kumar' },
      { name:'Antibiotik Suportu', dose:'İcra Gərdən', route:'IV', frequency:'Qiymətləndirmə Əsasında', prescribed_by:'Dr. Kumar' }
    ],
    allergies: [
    ],
    labs: [
      { test:'Amilaza', value:850, unit:'U/L', ref:'<100', status:'critical', time:fmt(h(2)) },
      { test:'Lipaza', value:920, unit:'U/L', ref:'<60', status:'critical', time:fmt(h(2)) },
      { test:'Triqliserid', value:8.4, unit:'mmol/L', ref:'<2.3', status:'critical', time:fmt(h(2)) },
      { test:'Kalsium', value:1.8, unit:'mmol/L', ref:'2.1–2.6', status:'low', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'USG/CT - Pankreatiti Dərəcə Qiymətləndir', priority:'routine', due:'Today' },
      { action:'Oral Pəhriz → Maye Pəhriz → Ağır Pəhriz', priority:'routine', due:'Today' },
      { action:'Amilaza/Lipaza Qosunu Gün 2', priority:'routine', due:'Today' },
      { action:'Triqliserid Kontrolü', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Kəskin Karın Ağrısı ilə Qəbul Edildi. Amilaza 850, Lipaza 920. NPO-ya Başlandı.', severity:'critical' },
      { time:fmt(h(24)), event:'Ultrasound: Kəskin Pankreatit, Gallstone Görülər.', severity:'warn' },
      { time:fmt(h(20)), event:'Amilaza Azalır. Maye Pəhrizə Keçidi Başlandı.', severity:'good' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P010',
    name: 'Yuki Tanaka',
    age: 52, gender: 'Qadın', dob: '1973-08-20',
    ward: '5', bed: '3A',
    diagnosis: 'Zəhərlənmə Tıkanma',
    diagnosisSecondary: ['Kiçik Bağırsaq Obstruksiya', 'Xroniki Karın Ağrısı Tarix'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Periodik Karın Ağrısı, Vomitus, Distansion, Həmin Keçməmiş 12 Saat',
    consultant: 'Dr. Kumar (Cərrahi)',
    vitalsBase: {"hr":98,"bp_sys":116,"bp_dia":72,"temp":37.2,"rr":20,"spo2":95,"hrVar":8,"bpVar":10,"tempVar":0.3,"rrVar":3,"spo2Var":2},
    medications: [
      { name:'0.9% NaCl', dose:'1L/4 Saat', route:'IV', frequency:'Restitüsyon', prescribed_by:'Dr. Martinez' },
      { name:'Metoclopramid', dose:'10mg', route:'IV', frequency:'Günə 3 dəfə', prescribed_by:'Dr. Kumar' },
      { name:'Piperacillin-Tazobactam', dose:'4.5g', route:'IV', frequency:'Günə 3 dəfə', prescribed_by:'Dr. Kumar' }
    ],
    allergies: [
      { allergen:'Penisilin', reaction:'Böyük Döş', severity:'ciddi' }
    ],
    labs: [
      { test:'U&E', value:'Hiponatremia 128, Hipokaliemia 3.1', unit:'mmol/L', ref:'136–145, 3.5–5.0', status:'high', time:fmt(h(2)) },
      { test:'Laktat', value:3.2, unit:'mmol/L', ref:'<2.0', status:'high', time:fmt(h(2)) },
      { test:'Leukosit', value:13.8, unit:'×10⁹/L', ref:'4–11', status:'high', time:fmt(h(2)) },
      { test:'CT Abdomen', value:'Kiçik Bağırsaq Tıkanması, Bağlayıcı', unit:'', ref:'Normal', status:'critical', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'Conservative Menecment — NG Tüpü, Maye Restitüsyonu', priority:'urgent', due:'ASAP' },
      { action:'CT Abdomen əgər Saydıcı Tıkanma Əlamətləri', priority:'routine', due:'Today' },
      { action:'Cərrahi Danışma — Cərrahi Əlavələr Əsasında', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Periodik Karın Ağrısı, Vomitus ilə Qəbul Edildi. CT: Tıkanma.', severity:'critical' },
      { time:fmt(h(24)), event:'NG Tüpü Qoyuldu, Maye Restitüsyonu Başlandı.', severity:'warn' },
      { time:fmt(h(20)), event:'İyiləşmə Əlamətləri Yoxdur — Cərrahi Danışma.', severity:'critical' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P011',
    name: 'Patricia Hughes',
    age: 73, gender: 'Qadın', dob: '1952-11-05',
    ward: '4', bed: '1C',
    diagnosis: 'Beyin Zədələnməsi (Ağır Zədələnmə)',
    diagnosisSecondary: ['Epi-Dural Hematoma', 'GCS 9'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Baş Qoxulu Zədələnmə Yüksəkdən Düşməsi. Zəiflik, Hərəkətə Ehtiyac Azalır.',
    consultant: 'Dr. Turner (Neyroloqiya)',
    vitalsBase: {"hr":84,"bp_sys":138,"bp_dia":82,"temp":36.7,"rr":16,"spo2":96,"hrVar":6,"bpVar":10,"tempVar":0.2,"rrVar":2,"spo2Var":1},
    medications: [
      { name:'Mannitol', dose:'1g/kq', route:'IV', frequency:'Infuziya', prescribed_by:'Dr. Turner' },
      { name:'Dexametazon', dose:'8mg', route:'IV', frequency:'Günə 4 dəfə', prescribed_by:'Dr. Turner' },
      { name:'Propofol', dose:'Sedasyon Protokolu', route:'IV', frequency:'Daimi', prescribed_by:'Dr. Turner' }
    ],
    allergies: [
    ],
    labs: [
      { test:'CT Beyin', value:'Epi-dural Hematoma 25mm, Orta Xətt Sətrələrin 8mm', unit:'', ref:'Normal', status:'critical', time:fmt(h(2)) },
      { test:'GCS', value:9, unit:'', ref:'>14', status:'critical', time:fmt(h(2)) },
      { test:'İntracanial Təzyiq', value:'22 mmHg', unit:'', ref:'<15', status:'high', time:fmt(h(2)) },
      { test:'Pupil', value:'Dilated Sağ, Reaktif Sol', unit:'', ref:'Hər İkisində Reaktif', status:'critical', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'Əməliyyathane — Epi-dural Hematoma Evakuasiyası', priority:'emergency', due:'Today' },
      { action:'Neyroloqiya Monitoring — Pupil, GCS, ICP', priority:'urgent', due:'ASAP' },
      { action:'Post-Əməliyyat CT — Hematoma Rezidyu Qiymətləndirmə', priority:'urgent', due:'ASAP' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Yüksək Düşüşdən Sonra Qəbul Edildi. CT: Epi-dural Hematoma 25mm.', severity:'critical' },
      { time:fmt(h(24)), event:'Əməliyyathana Göndərildi Evakuasiya Üçün.', severity:'critical' },
      { time:fmt(h(20)), event:'Əməliyyat Təmamiləndi. Post-əməliyyat GCS 10-a Yaxşılaşdı.', severity:'warn' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P012',
    name: 'Stefan Mueller',
    age: 67, gender: 'Kişi', dob: '1958-07-22',
    ward: '6', bed: '5C',
    diagnosis: 'Terapetik Iltişab ilə Xroniki Böbrek Xəstəliyi 4-5 Mərhələ',
    diagnosisSecondary: ['Hipertenziya', 'Diabet Nefropatiyası'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Nəfəs Darlığı, Kəbiz, Zəiflik, Əvvəli eGFR 18',
    consultant: 'Dr. Nair (Nefroloqiya)',
    vitalsBase: {"hr":76,"bp_sys":142,"bp_dia":86,"temp":37.1,"rr":18,"spo2":94,"hrVar":5,"bpVar":10,"tempVar":0.2,"rrVar":2,"spo2Var":2},
    medications: [
      { name:'Urokinaza', dose:'40mg', route:'PO', frequency:'Günə 3 dəfə', prescribed_by:'Dr. Nair' },
      { name:'Kalsium Karbonat', dose:'1.25g', route:'PO', frequency:'Yemə ilə 3 dəfə', prescribed_by:'Dr. Nair' },
      { name:'Eritropoietin', dose:'4000 Unit', route:'SC', frequency:'Həftədə 3 dəfə', prescribed_by:'Dr. Nair' },
      { name:'Dəmir Sulfat', dose:'200mg', route:'PO', frequency:'Günə 1 dəfə', prescribed_by:'Dr. Nair' }
    ],
    allergies: [
    ],
    labs: [
      { test:'eGFR', value:18, unit:'mL/min', ref:'>90', status:'critical', time:fmt(h(2)) },
      { test:'Kreatinin', value:478, unit:'µmol/L', ref:'59–104', status:'critical', time:fmt(h(2)) },
      { test:'Hemoglobin', value:82, unit:'g/L', ref:'130–175', status:'critical', time:fmt(h(2)) },
      { test:'Potassium', value:6.8, unit:'mmol/L', ref:'3.5–5.0', status:'critical', time:fmt(h(2)) },
      { test:'Fosfat', value:2.8, unit:'mmol/L', ref:'0.8–1.5', status:'high', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'Diyalizə İstiqamətləndir — Vascular Access Əvvəlcədən', priority:'urgent', due:'ASAP' },
      { action:'Nefroloqiya Konsultasyon — Dializ Startı', priority:'urgent', due:'ASAP' },
      { action:'Potassium Pəhriz Məsləhəti', priority:'routine', due:'Today' },
      { action:'Anemia Menecment — Epo Doslaması', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'CKD Mərhələ 4-5-ə Keçid. Kreatinin 478, eGFR 18. Dializ Planlaşdırması.', severity:'critical' },
      { time:fmt(h(24)), event:'Fistula Yaradılması Haqqında Cərrahi Danışma.', severity:'warn' },
      { time:fmt(h(20)), event:'Dializ Startı Gözlənilən. Vascular Access Planlanmış.', severity:'warn' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P013',
    name: 'Angela Rossi',
    age: 59, gender: 'Qadın', dob: '1966-04-17',
    ward: '8', bed: '4A',
    diagnosis: 'Kəskin Karaciyer Çatışmazlığı',
    diagnosisSecondary: ['Fulminant Hepatitis', 'Hepatik Ensefopatiya'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Sarılıq Artması, Hepatik Ensefopatiya (Mərhələ III), Hematuriya, Artan INR',
    consultant: 'Dr. Patel (Hepatoloqiya)',
    vitalsBase: {"hr":96,"bp_sys":126,"bp_dia":78,"temp":37.6,"rr":20,"spo2":94,"hrVar":8,"bpVar":12,"tempVar":0.4,"rrVar":2,"spo2Var":2},
    medications: [
      { name:'Laktuloza', dose:'30ml', route:'PO', frequency:'Günə 3 dəfə', prescribed_by:'Dr. Patel' },
      { name:'N-acetilsistein', dose:'50mg/kq', route:'IV', frequency:'Yüklənmə Sonra Saatda Bir', prescribed_by:'Dr. Patel' },
      { name:'Fresh Frozen Plasma', dose:'1000ml', route:'IV', frequency:'Təkrarlama Əsasında', prescribed_by:'Dr. Patel' },
      { name:'Kanamicin', dose:'1g', route:'PO', frequency:'Günə 3 dəfə', prescribed_by:'Dr. Patel' }
    ],
    allergies: [
    ],
    labs: [
      { test:'INR', value:3.8, unit:'', ref:'<1.2', status:'critical', time:fmt(h(2)) },
      { test:'Bilirubin', value:287, unit:'µmol/L', ref:'<17', status:'critical', time:fmt(h(2)) },
      { test:'ALT', value:1240, unit:'U/L', ref:'<40', status:'critical', time:fmt(h(2)) },
      { test:'Albumin', value:24, unit:'g/L', ref:'35–50', status:'critical', time:fmt(h(2)) },
      { test:'Platelet', value:98, unit:'×10⁹/L', ref:'150–400', status:'low', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'Hepatik Ensefolatiya Qiymətləndirmə — Ammoniya Azaltma', priority:'urgent', due:'ASAP' },
      { action:'Karaciyer Transplantasyon Unit-ə İstiqamətləndir', priority:'urgent', due:'ASAP' },
      { action:'Koagulopatisi Menecment — FFP Əsasında', priority:'urgent', due:'ASAP' },
      { action:'Viral Hepatit Sınaması Əsasında', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Sarılıq, Ensefopatiya (Mərhələ III) ilə Qəbul Edildi. INR 3.8, Bilirubin 287.', severity:'critical' },
      { time:fmt(h(24)), event:'Hepatik Ensefopatiya Menecment Başlandı. Laktuloza, N-acetilsistein.', severity:'critical' },
      { time:fmt(h(20)), event:'Ensefopatiya II-yə Yaxşılaşdı. Transplant Asılı Yaşayış.', severity:'critical' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P014',
    name: 'John MacLeod',
    age: 71, gender: 'Kişi', dob: '1954-02-28',
    ward: '3', bed: '2D',
    diagnosis: 'Kəskin Stroke (İskemik)',
    diagnosisSecondary: ['Atrial Fibrilasiya', 'Hipertenziya'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Kəskin Sağ Tərəfli Zəiflik, Yüz Düşüşü, Danışma Çətinliyi 2 Saat Əvvəl Başladı',
    consultant: 'Dr. O\'Brien (Neyroloqiya)',
    vitalsBase: {"hr":82,"bp_sys":152,"bp_dia":90,"temp":37,"rr":16,"spo2":97,"hrVar":6,"bpVar":10,"tempVar":0.2,"rrVar":2,"spo2Var":1},
    medications: [
      { name:'Alteplaza (tPA)', dose:'0.9mg/kq', route:'IV', frequency:'Bir Dəfə Bolus', prescribed_by:'Dr. O\'Brien' },
      { name:'Aspirin', dose:'300mg', route:'PO', frequency:'Bir Dəfə Yüklənmə', prescribed_by:'Dr. O\'Brien' },
      { name:'Atorvastatin', dose:'80mg', route:'PO', frequency:'Günə 1 dəfə', prescribed_by:'Dr. O\'Brien' },
      { name:'Apixaban', dose:'5mg', route:'PO', frequency:'Günə 2 dəfə', prescribed_by:'Dr. O\'Brien' }
    ],
    allergies: [
      { allergen:'Aspirin (Aşırı Doza)', reaction:'Mədə Ağrısı', severity:'yüngül' }
    ],
    labs: [
      { test:'CT Beyin', value:'Yoxdur Hemoragiya, İskemiya Görülür', unit:'', ref:'Normal', status:'critical', time:fmt(h(2)) },
      { test:'NIHSS', value:16, unit:'', ref:'<4', status:'critical', time:fmt(h(2)) },
      { test:'Qan Şəkəri', value:8.2, unit:'mmol/L', ref:'4–7', status:'high', time:fmt(h(2)) },
      { test:'INR', value:1.1, unit:'', ref:'<1.2', status:'normal', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'NIHSS Qiymətləndirmə Saatda', priority:'urgent', due:'ASAP' },
      { action:'Qan Təzyiqi Ağırlığı — Hemoragik Transformasyon Riski', priority:'urgent', due:'ASAP' },
      { action:'Atrial Fibrilasiya Monitoring', priority:'routine', due:'Today' },
      { action:'Fizioterapi Qiymətləndirmə', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Kəskin Stroke ilə Qəbul Edildi (2 Saat Əvvəl Başlanma). CT: Yoxdur Hemoragiya.', severity:'critical' },
      { time:fmt(h(24)), event:'Alteplaza İnfuziyası Başlandı — Tromboliz Pəncərə İçində.', severity:'critical' },
      { time:fmt(h(20)), event:'NIHSS 16-dan 11-ə Azaldı. Sağ Tərəf Zəifliyi Yaxşılaşdı.', severity:'warn' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P015',
    name: 'Lisa Chen',
    age: 49, gender: 'Qadın', dob: '1976-09-11',
    ward: 'ICU', bed: '1D',
    diagnosis: 'Kəskin Respirator Çatışmazlığı Sendromu (ARDS)',
    diagnosisSecondary: ['Ağır Sepsis - Ağciyər Mənbəyi', 'Multi-organ Disfonksiyası'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Tədricən Nəfəs Darlığı, Tachypnea (RR 28), SpO2 88% O2 40% ilə',
    consultant: 'Dr. Chen (Yoğun Bakım)',
    vitalsBase: {"hr":118,"bp_sys":108,"bp_dia":68,"temp":38.4,"rr":28,"spo2":88,"hrVar":10,"bpVar":8,"tempVar":0.6,"rrVar":6,"spo2Var":4},
    medications: [
      { name:'Ceftriaxone', dose:'2g', route:'IV', frequency:'Günə 2 dəfə', prescribed_by:'Dr. Chen' },
      { name:'Azithromycin', dose:'500mg', route:'IV', frequency:'Günə 1 dəfə', prescribed_by:'Dr. Chen' },
      { name:'Propofol', dose:'Sedasyon', route:'IV', frequency:'Daimi İnfuziya', prescribed_by:'Dr. Chen' },
      { name:'Fentanyl', dose:'2-5 mcq/kq/saat', route:'IV', frequency:'Daimi İnfuziya', prescribed_by:'Dr. Chen' }
    ],
    allergies: [
    ],
    labs: [
      { test:'Arterial Qaz', value:'pH 7.28, PaO2 65, PaCO2 48', unit:'mmHg', ref:'pH 7.35-7.45, PaO2 >80, PaCO2 35-45', status:'critical', time:fmt(h(2)) },
      { test:'Döş Radiografiyası', value:'Diffuz İkitərəfli İnfiltratlar', unit:'', ref:'Təmiz', status:'critical', time:fmt(h(2)) },
      { test:'Laktat', value:4.2, unit:'mmol/L', ref:'<2.0', status:'critical', time:fmt(h(2)) },
      { test:'Troponin', value:0.28, unit:'ng/mL', ref:'<0.04', status:'high', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'Mekanik Ventilasyon — Ağciyər Protektiv Strateji', priority:'emergency', due:'Today' },
      { action:'Sepsis Protokolu — Qan Kultürü, Antibiotiklər', priority:'emergency', due:'Today' },
      { action:'Prone Positioning əgər P/F Nisbəti <150', priority:'urgent', due:'ASAP' },
      { action:'Kritik Xəstəlik Polineuromyopatiyası Riski — Mobilizasyon', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'ARDS ilə Qəbul Edildi, SpO2 88% O2 40% ilə. Mekanik Ventilasyon Başlandı.', severity:'critical' },
      { time:fmt(h(24)), event:'Multi-organ Dəstəyi: Vasopressor Əlavə Edildi. Laktat 4.2.', severity:'critical' },
      { time:fmt(h(20)), event:'Tədricən Yaxşılaşır. P/F 180-ə Yaxşılaşdı. Amilyopatiya Başladı.', severity:'warn' }
    ],
    notes: [],
    patternInsights: []
  },
  {
    id: 'P016',
    name: 'David Ndlovu',
    age: 54, gender: 'Kişi', dob: '1971-10-19',
    ward: '7', bed: '6C',
    diagnosis: 'Tiroid Fırtınası',
    diagnosisSecondary: ['Batıq Graves Xəstəliyi', 'Atrial Fibrilasiya'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Kəskin Tachycardia (HR 145), Əlavə Atermi, İstiləsində Artış (T 39.8°C), Zəiflik, Çaşqınlıq',
    consultant: 'Dr. Gupta (Endokrinoloqiya)',
    vitalsBase: {"hr":145,"bp_sys":138,"bp_dia":82,"temp":39.8,"rr":22,"spo2":95,"hrVar":12,"bpVar":12,"tempVar":0.8,"rrVar":4,"spo2Var":2},
    medications: [
      { name:'Propranolol', dose:'80mg', route:'PO', frequency:'Günə 4 dəfə', prescribed_by:'Dr. Gupta' },
      { name:'Propiltiyourasil (PTU)', dose:'200mg', route:'PO', frequency:'Günə 4 dəfə', prescribed_by:'Dr. Gupta' },
      { name:'İodin Potassium (Lugol)', dose:'1-2 cə', route:'PO', frequency:'Günə 3 dəfə', prescribed_by:'Dr. Gupta' },
      { name:'Paracetamol', dose:'1g', route:'PO', frequency:'Günə 4 dəfə Zərurətində', prescribed_by:'Dr. Gupta' }
    ],
    allergies: [
      { allergen:'PTU', reaction:'Ağırlıq, Qan Disrasiya Riski', severity:'orta' }
    ],
    labs: [
      { test:'Sərbəst T4', value:68, unit:'pmol/L', ref:'11–22', status:'critical', time:fmt(h(2)) },
      { test:'TSH', value:0.01, unit:'mIU/L', ref:'0.4–4.0', status:'critical', time:fmt(h(2)) },
      { test:'Ləpə', value:16.2, unit:'×10⁹/L', ref:'4–11', status:'high', time:fmt(h(2)) },
      { test:'EKQ', value:'Atrial Fibrilasiya, HR 145', unit:'', ref:'Normal Ritm', status:'critical', time:fmt(h(2)) }
    ],
    pendingActions: [
      { action:'β-blocker IV əgər Ağız Toleranc Etməzsə', priority:'urgent', due:'ASAP' },
      { action:'Plazma Ekskənyonu Nəzərdən Keçir — Ağır Tiroid Fırtınası', priority:'urgent', due:'ASAP' },
      { action:'Atrial Fibrilasiya Menecment — Kalsium Blokatori, Antikoaguləsyon', priority:'routine', due:'Today' },
      { action:'Endokrinoloqiya Danışma — Başa Çıxarma Seçim (Tiroidektomiya vs. Radioakif İodin)', priority:'routine', due:'Today' }
    ],
    timeline: [
      { time:fmt(h(28)), event:'Tiroid Fırtınası Əlamətləri ilə Qəbul Edildi. HR 145, T 39.8°C, Free T4 68.', severity:'critical' },
      { time:fmt(h(24)), event:'PTU, Propranolol, İodin Başlandı. HR Tədricən Azalır.', severity:'critical' },
      { time:fmt(h(20)), event:'Atrial Fibrilasiya Stabil. HR 110-a Azaldı. Endokrinoloqiya Danışması Planlandı.', severity:'warn' }
    ],
    notes: [],
    patternInsights: []
  }
];

// ── PatientStore ──────────────────────────────────────────
class PatientStore {
  constructor() {
    this._patients = PATIENTS.map(p => {
      const vt = genVitals(p.vitalsBase);
      const cur = vt[vt.length - 1];
      const n2  = news2(cur);
      return {
        ...p,
        vitals: { history: vt, current: cur },
        news2Score: n2,
        riskLevel: riskLevel(n2),
        _vitalsBase: p.vitalsBase,
      };
    });
  }

  getAll() {
    const order = { critical:0, high:1, medium:2, low:3, stable:4 };
    return [...this._patients].sort((a,b) => (order[a.riskLevel]||5) - (order[b.riskLevel]||5));
  }

  getById(id) { return this._patients.find(p => p.id === id) }

  getHighRisk() { return this._patients.filter(p => p.news2Score >= 5 || p.riskLevel === 'critical' || p.riskLevel === 'high') }

  getStable() { return this._patients.filter(p => p.news2Score <= 2 && p.riskLevel === 'stable') }

  getForHandover() { return this.getAll() }

  getShiftProgress() {
    const start = new Date();
    start.setHours(7, 0, 0, 0);
    const end = new Date();
    end.setHours(19, 0, 0, 0);
    const total = end - start;
    const elapsed = Date.now() - start;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  getShiftStats() {
    const all = this.getAll();
    return {
      total: all.length,
      critical: all.filter(p => p.riskLevel === 'critical').length,
      high: all.filter(p => p.riskLevel === 'high').length,
      medium: all.filter(p => p.riskLevel === 'medium').length,
      low: all.filter(p => p.riskLevel === 'low').length,
      stable: all.filter(p => p.riskLevel === 'stable').length,
      pendingActions: all.reduce((sum, p) => sum + (p.pendingActions ? p.pendingActions.length : 0), 0),
      discharging: Math.floor(Math.random() * 3),
    };
  }

  getPatternInsights() {
    const all = this.getAll();
    const insights = [];
    all.forEach(p => {
      if (p.news2Score >= 5) {
        insights.push({
          patientId: p.id,
          patient: p.name,
          insight: p.riskLevel === 'critical' ? 'Kritik sağlamlıq göstəricilərində təhlükəli trend' : 'Yüksək riskli vəziyyətdə monitorinq tələb olunur',
          based_on: 'Real-time vital signs',
          confidence: 75 + Math.floor(Math.random() * 20),
        });
      }
    });
    return insights.slice(0, 6);
  }
}

const ShiftState = {
  doctor: { name:'Dr. Sərdar Mərtinəz', specialty:'Daxili Xəstəliklər', grade:'ST5', initials:'SM', startTime:'07:00', endTime:'19:00' },
  ward: '7-ci Bölmə — Daxili Xəstəliklər',
  date: new Date().toLocaleDateString('az-AZ', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
};

global.PatientStore = new PatientStore();
global.ShiftState   = ShiftState;

})(window);

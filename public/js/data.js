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
    name: 'James Thompson',
    age: 68, gender: 'Male', dob: '1957-03-15',
    ward: '7', bed: '7B',
    diagnosis: 'Sepsis secondary to UTI',
    diagnosisSecondary: ['AKI on CKD stage 3', 'Type 2 Diabetes'],
    admissionDate: fmt(h(28)),
    admissionReason: 'Worsening malaise, reduced urine output, dysuria over 48h',
    consultant: 'Dr. Patel (Acute Medicine)',
    vitalsBase: { hr:104,bp_sys:98,bp_dia:62,temp:38.4,rr:22,spo2:94, hrVar:8,bpVar:12,tempVar:.4,rrVar:3,spo2Var:2 },
    medications: [
      { name:'Piperacillin-Tazobactam',  dose:'4.5g',  route:'IV',  frequency:'TDS',     prescribed_by:'Dr. Martinez' },
      { name:'0.9% Sodium Chloride',     dose:'500ml', route:'IV',  frequency:'over 4h', prescribed_by:'Dr. Martinez' },
      { name:'Metformin',                dose:'500mg', route:'PO',  frequency:'BD',       prescribed_by:'Dr. Patel - HELD' },
      { name:'Ramipril',                 dose:'5mg',   route:'PO',  frequency:'OD',       prescribed_by:'Dr. Patel - HELD' },
      { name:'Insulin Actrapid (sliding scale)', dose:'per protocol', route:'SC', frequency:'QDS', prescribed_by:'Dr. Martinez' },
    ],
    allergies: [{ allergen:'Penicillin', reaction:'Rash', severity:'mild' }],
    labs: [
      { test:'Lactate',       value:2.4,   unit:'mmol/L', ref:'<2.0',       status:'critical', time:fmt(h(2)) },
      { test:'Creatinine',    value:198,   unit:'µmol/L', ref:'59–104',      status:'high',     time:fmt(h(2)) },
      { test:'eGFR',          value:28,    unit:'mL/min', ref:'>60',         status:'low',      time:fmt(h(2)) },
      { test:'CRP',           value:214,   unit:'mg/L',   ref:'<5',          status:'critical', time:fmt(h(2)) },
      { test:'WBC',           value:14.2,  unit:'×10⁹/L', ref:'4–11',       status:'high',     time:fmt(h(2)) },
      { test:'Haemoglobin',   value:108,   unit:'g/L',    ref:'130–175',     status:'low',      time:fmt(h(2)) },
      { test:'Blood glucose', value:14.8,  unit:'mmol/L', ref:'4–7',         status:'high',     time:fmt(h(1)) },
      { test:'Blood cultures x2', value:'Pending', unit:'', ref:'No growth', status:'normal',   time:fmt(h(1)) },
    ],
    pendingActions: [
      { action:'Repeat lactate at 22:00', priority:'urgent', due:fmt(new Date(now.getTime() + 3600000)) },
      { action:'Urology review — query renal source', priority:'routine', due:'Today' },
      { action:'Blood culture results — act on sensitivity', priority:'urgent', due:'ASAP when available' },
      { action:'Consider nephrology if AKI worsens', priority:'routine', due:'Tomorrow' },
    ],
    timeline: [
      { time:fmt(h(28)), event:'Admitted via ED. Sepsis 6 initiated.', severity:'critical' },
      { time:fmt(h(20)), event:'Blood cultures taken. IV antibiotics started (Co-amoxiclav initially).', severity:'warn' },
      { time:fmt(h(12)), event:'Antibiotic escalated to Tazocin after poor response.', severity:'warn' },
      { time:fmt(h(6)),  event:'Repeat lactate: 2.4 (up from 1.8). HDU referral discussed.', severity:'critical' },
      { time:fmt(h(2)),  event:'Urology contacted. Fluid challenge given.', severity:'warn' },
    ],
    notes: [
      { time:fmt(h(6)), author:'Dr. Martinez', type:'Ward Round', content:'68M with sepsis secondary to UTI on background AKI. Lactate rising (1.1→2.4). HR 104. On Tazocin. BP borderline at 98/62. Given 500ml fluid challenge with modest response. Urology review requested. To discuss HDU review if further deterioration. Blood cultures pending. Holding ACE inhibitor and metformin given AKI.' },
      { time:fmt(h(24)), author:'Dr. Chen (Night)', type:'Night Note', content:'Seen at 01:00. Patient stable overnight. No fever spikes. HR 98–110 range. Urine output 20-25ml/hr — low. MSU pending.' },
    ],
    patternInsights: [
      { insight:'Lactate trajectory suggests inadequate source control. Consider repeat imaging if cultures negative.', confidence:82, based_on:'Vitals trend + lab trajectory over 6h' },
      { insight:'AKI likely prerenal component given sepsis. Monitor closely for intrinsic AKI progression.', confidence:78, based_on:'Creatinine trend + eGFR + urine output' },
    ],
    handoverNotes: '',
    lastSeen: fmt(h(2)),
    nextReview: fmt(new Date(now.getTime() + 3600000)),
  },

  {
    id: 'P002',
    name: 'Margaret Foster',
    age: 72, gender: 'Female', dob: '1953-07-22',
    ward: '7', bed: '3C',
    diagnosis: 'Community-acquired pneumonia',
    diagnosisSecondary: ['COPD (GOLD III)', 'Hypertension'],
    admissionDate: fmt(h(72)),
    admissionReason: 'Worsening SOB, productive cough, fever x4 days',
    consultant: 'Dr. Okafor (Respiratory)',
    vitalsBase: { hr:88,bp_sys:138,bp_dia:82,temp:37.6,rr:18,spo2:93, hrVar:6,bpVar:10,tempVar:.3,rrVar:2,spo2Var:2 },
    medications: [
      { name:'Amoxicillin', dose:'500mg', route:'PO', frequency:'TDS', prescribed_by:'Dr. Okafor' },
      { name:'Clarithromycin', dose:'500mg', route:'PO', frequency:'BD', prescribed_by:'Dr. Okafor' },
      { name:'Prednisolone', dose:'30mg', route:'PO', frequency:'OD', prescribed_by:'Dr. Okafor' },
      { name:'Salbutamol nebuliser', dose:'2.5mg', route:'Neb', frequency:'QDS', prescribed_by:'Dr. Okafor' },
      { name:'Amlodipine', dose:'10mg', route:'PO', frequency:'OD', prescribed_by:'Dr. Chen (GP)' },
      { name:'Ramipril', dose:'5mg', route:'PO', frequency:'OD', prescribed_by:'Dr. Chen (GP)' },
    ],
    allergies: [],
    labs: [
      { test:'CRP',         value:89,  unit:'mg/L',   ref:'<5',       status:'high',   time:fmt(h(12)) },
      { test:'WBC',         value:11.4, unit:'×10⁹/L', ref:'4–11',    status:'high',   time:fmt(h(12)) },
      { test:'CXR',         value:'Improving bilateral consolidation', unit:'', ref:'Clear', status:'normal', time:fmt(h(24)) },
      { test:'Haemoglobin', value:118, unit:'g/L',    ref:'115–160',  status:'low',    time:fmt(h(12)) },
      { test:'U&E',         value:'Within normal limits', unit:'', ref:'Normal',       status:'normal', time:fmt(h(12)) },
    ],
    pendingActions: [
      { action:'Step-down to oral antibiotics — assess this morning', priority:'routine', due:'Morning' },
      { action:'Physiotherapy referral — chest physio', priority:'routine', due:'Today' },
      { action:'OT assessment — safe discharge planning', priority:'routine', due:'Today' },
    ],
    timeline: [
      { time:fmt(h(72)), event:'Admitted. SpO2 87% on air. O2 started. CXR bilateral consolidation.', severity:'critical' },
      { time:fmt(h(60)), event:'Improved on IV antibiotics. Step-down to PO considered.', severity:'warn' },
      { time:fmt(h(36)), event:'Ambulating. Tolerating oral medications. OT assessment booked.', severity:'good' },
    ],
    notes: [
      { time:fmt(h(12)), author:'Dr. Martinez', type:'Ward Round', content:'72F D3 CAP on COPD background. Good clinical improvement. SpO2 93% on 2L O2. CXR improving. CRP down from 186 to 89. Step-down to PO ABx today. Physio assessment booked. Discharge target D5-6 if continues to improve.' },
    ],
    patternInsights: [
      { insight:'Response consistent with CAP. CRP trajectory suggests resolution. Safe for discharge in 2-3 days if maintains current trajectory.', confidence:88, based_on:'CRP trend + SpO2 + CXR progression' },
    ],
    handoverNotes: 'Expected discharge D5. Social work confirmed home is suitable.',
    lastSeen: fmt(h(12)),
    nextReview: fmt(new Date(now.getTime() + 7200000)),
  },

  {
    id: 'P003',
    name: 'Robert Adeyemi',
    age: 54, gender: 'Male', dob: '1971-11-08',
    ward: '7', bed: '1A',
    diagnosis: 'ST-Elevation Myocardial Infarction (post-PPCI)',
    diagnosisSecondary: ['Hypertension', 'Hypercholesterolaemia', 'Ex-smoker'],
    admissionDate: fmt(h(48)),
    admissionReason: 'Acute chest pain. STEMI confirmed. Emergency PPCI performed.',
    consultant: 'Dr. Singh (Cardiology)',
    vitalsBase: { hr:72,bp_sys:118,bp_dia:74,temp:36.8,rr:14,spo2:98, hrVar:5,bpVar:8,tempVar:.2,rrVar:1,spo2Var:1 },
    medications: [
      { name:'Aspirin',     dose:'75mg',  route:'PO', frequency:'OD', prescribed_by:'Dr. Singh' },
      { name:'Ticagrelor',  dose:'90mg',  route:'PO', frequency:'BD', prescribed_by:'Dr. Singh' },
      { name:'Atorvastatin',dose:'80mg',  route:'PO', frequency:'ON', prescribed_by:'Dr. Singh' },
      { name:'Bisoprolol',  dose:'2.5mg', route:'PO', frequency:'OD', prescribed_by:'Dr. Singh' },
      { name:'Ramipril',    dose:'2.5mg', route:'PO', frequency:'OD', prescribed_by:'Dr. Singh' },
      { name:'GTN spray',   dose:'400mcg',route:'SL', frequency:'PRN', prescribed_by:'Dr. Singh' },
    ],
    allergies: [{ allergen:'Latex', reaction:'Contact dermatitis', severity:'mild' }],
    labs: [
      { test:'Troponin I peak', value:4820, unit:'ng/L', ref:'<34', status:'critical', time:fmt(h(46)) },
      { test:'Troponin I (6h)', value:3100, unit:'ng/L', ref:'<34', status:'critical', time:fmt(h(40)) },
      { test:'Troponin I (12h)',value:1840, unit:'ng/L', ref:'<34', status:'high',     time:fmt(h(34)) },
      { test:'ECG',            value:'Normal sinus rhythm. No ST changes.',  unit:'', ref:'Normal', status:'normal', time:fmt(h(12)) },
      { test:'Echo (post-PPCI)', value:'EF 45%. Anterior wall hypokinesia.', unit:'', ref:'EF>55%', status:'high', time:fmt(h(36)) },
    ],
    pendingActions: [
      { action:'Cardiac rehab referral', priority:'routine', due:'Before discharge' },
      { action:'Repeat echo in 6-8 weeks outpatient', priority:'routine', due:'Arrange before discharge' },
      { action:'Lifestyle counselling — smoking cessation, diet', priority:'routine', due:'Today' },
    ],
    timeline: [
      { time:fmt(h(48)), event:'Admitted. ECG: anterior STEMI. Activated cath lab.', severity:'critical' },
      { time:fmt(h(46)), event:'Successful PPCI to LAD. Drug-eluting stent inserted.', severity:'good' },
      { time:fmt(h(24)), event:'Transferred from CCU to ward. Haemodynamically stable.', severity:'good' },
    ],
    notes: [
      { time:fmt(h(8)), author:'Dr. Martinez', type:'Ward Round', content:'54M D2 post-PPCI for anterior STEMI. Haemodynamically stable. HR 72 SR. BP 118/74. No chest pain. Troponin trending down appropriately. Echo shows EF 45% with anterior WMA. DAPT, statin, ACEi, BB all prescribed. For cardiac rehab referral and repeat echo as outpatient.' },
    ],
    patternInsights: [
      { insight:'Troponin trend consistent with successful reperfusion. EF likely to improve with medical therapy at 6 weeks.', confidence:84, based_on:'Troponin trajectory + echo findings + PPCI success' },
    ],
    handoverNotes: 'Discharge planned D3 with cardiology follow-up.',
    lastSeen: fmt(h(8)),
    nextReview: fmt(new Date(now.getTime() + 10800000)),
  },

  {
    id: 'P004',
    name: 'Sarah Okonkwo',
    age: 45, gender: 'Female', dob: '1980-05-12',
    ward: '7', bed: '12A',
    diagnosis: 'Pulmonary Embolism',
    diagnosisSecondary: ['OCP use', 'Right DVT'],
    admissionDate: fmt(h(36)),
    admissionReason: 'Sudden onset SOB and pleuritic chest pain. D-dimer 4.8. CTPA confirmed PE.',
    consultant: 'Dr. Okafor (Respiratory)',
    vitalsBase: { hr:96,bp_sys:122,bp_dia:76,temp:37.2,rr:20,spo2:95, hrVar:8,bpVar:10,tempVar:.3,rrVar:2,spo2Var:2 },
    medications: [
      { name:'Apixaban', dose:'10mg', route:'PO', frequency:'BD (loading x7 days)', prescribed_by:'Dr. Okafor' },
      { name:'Paracetamol', dose:'1g', route:'PO', frequency:'QDS PRN', prescribed_by:'Dr. Okafor' },
    ],
    allergies: [],
    labs: [
      { test:'D-dimer',    value:4.8,  unit:'mg/L FEU', ref:'<0.5', status:'critical', time:fmt(h(36)) },
      { test:'CTPA',       value:'Bilateral PE — right lower lobe & left lower lobe. No RV strain.', unit:'', ref:'No PE', status:'high', time:fmt(h(34)) },
      { test:'Troponin I', value:18,   unit:'ng/L',     ref:'<34',   status:'normal',   time:fmt(h(34)) },
      { test:'BNP',        value:120,  unit:'pg/mL',    ref:'<100',  status:'high',     time:fmt(h(34)) },
      { test:'Lower limb doppler', value:'Right femoral DVT confirmed', unit:'', ref:'No DVT', status:'high', time:fmt(h(20)) },
    ],
    pendingActions: [
      { action:'Stop OCP — patient counselled', priority:'urgent',  due:'Done — document' },
      { action:'Thrombophilia screen (pre-anticoagulation results)', priority:'routine', due:'Check results' },
      { action:'Haematology review for provoked vs unprovoked PE assessment', priority:'routine', due:'Tomorrow' },
      { action:'Duration of anticoagulation discussion', priority:'routine', due:'Before discharge' },
    ],
    timeline: [
      { time:fmt(h(36)), event:'Admitted with SOB. ECG: sinus tachycardia. CTPA ordered.', severity:'warn' },
      { time:fmt(h(34)), event:'CTPA: bilateral PE confirmed. Apixaban started.', severity:'critical' },
      { time:fmt(h(20)), event:'DVT confirmed right leg. SpO2 improving on room air.', severity:'warn' },
    ],
    notes: [
      { time:fmt(h(10)), author:'Dr. Martinez', type:'Ward Round', content:'45F D1 bilateral PE. Haemodynamically stable — no RV strain on echo. On Apixaban loading. SpO2 95% on 2L O2. HR 96. OCP stopped. Thrombophilia screen taken prior to anticoagulation. Haematology review booked re: duration of treatment. Target discharge D2-3 once stable on room air.' },
    ],
    patternInsights: [
      { insight:'No RV strain and haemodynamically stable — good prognostic sign. Suitable for home anticoagulation after stabilisation.', confidence:90, based_on:'CTPA findings + troponin + haemodynamics' },
    ],
    handoverNotes: '',
    lastSeen: fmt(h(10)),
    nextReview: fmt(new Date(now.getTime() + 14400000)),
  },

  {
    id: 'P005',
    name: 'George Papadopoulos',
    age: 81, gender: 'Male', dob: '1944-01-30',
    ward: '7', bed: '5D',
    diagnosis: 'Acute decompensated heart failure',
    diagnosisSecondary: ['AF (permanent)', 'CKD stage 3', 'Hypertension', 'Aortic stenosis (moderate)'],
    admissionDate: fmt(h(60)),
    admissionReason: 'Progressive SOB, bilateral ankle oedema, weight gain 4kg in 1 week',
    consultant: 'Dr. Singh (Cardiology)',
    vitalsBase: { hr:82,bp_sys:108,bp_dia:66,temp:36.7,rr:19,spo2:92, hrVar:6,bpVar:12,tempVar:.2,rrVar:2,spo2Var:2 },
    medications: [
      { name:'Furosemide',    dose:'80mg',   route:'IV',  frequency:'BD',      prescribed_by:'Dr. Singh' },
      { name:'Spironolactone',dose:'25mg',   route:'PO',  frequency:'OD',      prescribed_by:'Dr. Singh' },
      { name:'Bisoprolol',    dose:'1.25mg', route:'PO',  frequency:'OD',      prescribed_by:'Dr. Singh' },
      { name:'Apixaban',      dose:'2.5mg',  route:'PO',  frequency:'BD',      prescribed_by:'Dr. Singh' },
      { name:'Atorvastatin',  dose:'20mg',   route:'PO',  frequency:'ON',      prescribed_by:'Dr. Singh' },
      { name:'Amlodipine',    dose:'5mg',    route:'PO',  frequency:'OD - HELD (hypotension)', prescribed_by:'Dr. Singh' },
    ],
    allergies: [{ allergen:'ACE inhibitors', reaction:'Angioedema', severity:'severe' }],
    labs: [
      { test:'BNP',         value:2840, unit:'pg/mL',  ref:'<100',    status:'critical', time:fmt(h(12)) },
      { test:'BNP (admit)', value:4100, unit:'pg/mL',  ref:'<100',    status:'critical', time:fmt(h(60)) },
      { test:'Creatinine',  value:148,  unit:'µmol/L', ref:'59–104',  status:'high',     time:fmt(h(12)) },
      { test:'Sodium',      value:131,  unit:'mmol/L', ref:'135–145', status:'low',      time:fmt(h(12)) },
      { test:'Potassium',   value:4.8,  unit:'mmol/L', ref:'3.5–5.0', status:'normal',   time:fmt(h(12)) },
      { test:'Urine output','value':'800ml/8h (improving)', unit:'', ref:'>0.5ml/kg/h',  status:'normal', time:fmt(h(8)) },
    ],
    pendingActions: [
      { action:'Daily weight monitoring (target -500g/day minimum)', priority:'urgent', due:'Daily' },
      { action:'Repeat U&E in AM', priority:'urgent', due:'Tomorrow 07:00' },
      { action:'Echo review with cardiologist — reassess AS severity', priority:'routine', due:'This week' },
      { action:'Family meeting re: prognosis and goals of care', priority:'urgent', due:'Tomorrow' },
    ],
    timeline: [
      { time:fmt(h(60)), event:'Admitted. BNP 4100. Bilateral crackles to mid-zones. IV furosemide started.', severity:'critical' },
      { time:fmt(h(36)), event:'Good diuretic response. 2L out. Crackles improving.', severity:'good' },
      { time:fmt(h(12)), event:'BNP trending down to 2840. Still requiring IV diuretics.', severity:'warn' },
    ],
    notes: [
      { time:fmt(h(8)), author:'Dr. Martinez', type:'Ward Round', content:'81M D2 decompensated CCF. Good response to IV furosemide — 2.5L negative balance. Crackles to bases only. BNP trending down but still very elevated. Sodium 131 — hyponatraemia watch. SpO2 92% on 2L O2. Family coming in today — need to have honest conversation about prognosis and LT management. Cardiology review for echo and dose optimisation.' },
    ],
    patternInsights: [
      { insight:'BNP trend suggests partial response to diuresis. Hyponatraemia may indicate neurohormonal activation — consider fluid restriction.', confidence:79, based_on:'BNP trajectory + sodium + urine output' },
    ],
    handoverNotes: 'Family meeting tomorrow re: prognosis. Son is primary contact. Son is aware diagnosis is serious.',
    lastSeen: fmt(h(8)),
    nextReview: fmt(new Date(now.getTime() + 5400000)),
  },

  {
    id: 'P006',
    name: 'Priya Sharma',
    age: 32, gender: 'Female', dob: '1993-08-25',
    ward: '7', bed: '9B',
    diagnosis: 'Diabetic Ketoacidosis (DKA)',
    diagnosisSecondary: ['Type 1 Diabetes Mellitus'],
    admissionDate: fmt(h(18)),
    admissionReason: 'Vomiting, abdominal pain, blood glucose 32mmol/L. Ketones 4+',
    consultant: 'Dr. Gupta (Endocrinology)',
    vitalsBase: { hr:98,bp_sys:108,bp_dia:68,temp:37.1,rr:20,spo2:98, hrVar:8,bpVar:10,tempVar:.3,rrVar:2,spo2Var:1 },
    medications: [
      { name:'IV Insulin (fixed rate)',  dose:'0.1 units/kg/h', route:'IV', frequency:'per DKA protocol', prescribed_by:'Dr. Martinez' },
      { name:'0.9% NaCl',               dose:'1L/h initially',  route:'IV', frequency:'per DKA protocol', prescribed_by:'Dr. Martinez' },
      { name:'KCl supplements',         dose:'per protocol',    route:'IV', frequency:'per U&E',           prescribed_by:'Dr. Martinez' },
    ],
    allergies: [],
    labs: [
      { test:'Blood glucose',  value:32.4, unit:'mmol/L', ref:'4–7',         status:'critical', time:fmt(h(18)) },
      { test:'Blood glucose (6h)', value:18.2, unit:'mmol/L', ref:'4–7',     status:'high',     time:fmt(h(12)) },
      { test:'Blood glucose (now)', value:11.4, unit:'mmol/L', ref:'4–7',    status:'high',     time:fmt(h(1)) },
      { test:'pH',             value:7.18,  unit:'',       ref:'7.35–7.45',   status:'critical', time:fmt(h(18)) },
      { test:'pH (6h)',        value:7.28,  unit:'',       ref:'7.35–7.45',   status:'low',      time:fmt(h(12)) },
      { test:'Ketones (blood)',value:4.2,   unit:'mmol/L', ref:'<0.6',        status:'critical', time:fmt(h(18)) },
      { test:'Ketones (3h)',   value:2.1,   unit:'mmol/L', ref:'<0.6',        status:'high',     time:fmt(h(3)) },
      { test:'Potassium',      value:3.6,   unit:'mmol/L', ref:'3.5–5.0',     status:'normal',   time:fmt(h(1)) },
    ],
    pendingActions: [
      { action:'Hourly blood glucose monitoring on DKA protocol', priority:'urgent', due:'Ongoing' },
      { action:'Ketone check — target <0.6 for resolution', priority:'urgent', due:'2-hourly' },
      { action:'When ketones <0.6: switch to subcutaneous insulin', priority:'urgent', due:'Per protocol' },
      { action:'Identify precipitant for DKA (consider infection screen)', priority:'routine', due:'Today' },
      { action:'DSN (Diabetes Specialist Nurse) review', priority:'routine', due:'Tomorrow' },
    ],
    timeline: [
      { time:fmt(h(18)), event:'Admitted. DKA protocol started. pH 7.18. BG 32.4', severity:'critical' },
      { time:fmt(h(12)), event:'Responding to treatment. BG 18.2. pH 7.28. Ketones decreasing.', severity:'warn' },
      { time:fmt(h(3)),  event:'Ketones 2.1. Continuing to improve. K+ stable.', severity:'good' },
    ],
    notes: [
      { time:fmt(h(3)), author:'Dr. Martinez', type:'Ward Round', content:'32F T1DM, DKA D1. Responding well. Ketones 2.1 (down from 4.2). BG 11.4. pH now 7.32 on repeat ABG. K+ 3.6 — supplement per protocol. Antiemetics helping. Will review in 2h — if ketones <0.6, switch to SC insulin with meal. DSN to review tomorrow re: sick day rules and precipitant identification.' },
    ],
    patternInsights: [
      { insight:'Ketone clearance rate suggests resolution expected within 4-6 hours. Monitor K+ closely with insulin therapy.', confidence:87, based_on:'Ketone trajectory + glucose response + pH trend' },
    ],
    handoverNotes: '',
    lastSeen: fmt(h(3)),
    nextReview: fmt(new Date(now.getTime() + 7200000)),
  },

  {
    id: 'P007',
    name: 'William Clarke',
    age: 76, gender: 'Male', dob: '1949-04-12',
    ward: '7', bed: '2B',
    diagnosis: 'Upper GI Bleed (Haematemesis)',
    diagnosisSecondary: ['Peptic ulcer disease', 'NSAID use', 'Hypertension'],
    admissionDate: fmt(h(14)),
    admissionReason: 'Two episodes haematemesis. Coffee ground vomiting. Dizziness.',
    consultant: 'Dr. Tan (Gastroenterology)',
    vitalsBase: { hr:90,bp_sys:106,bp_dia:64,temp:36.9,rr:16,spo2:97, hrVar:8,bpVar:14,tempVar:.2,rrVar:2,spo2Var:1 },
    medications: [
      { name:'Omeprazole',   dose:'40mg', route:'IV', frequency:'BD',       prescribed_by:'Dr. Tan' },
      { name:'0.9% NaCl',   dose:'1L',   route:'IV', frequency:'4-hourly', prescribed_by:'Dr. Martinez' },
      { name:'Tranexamic acid', dose:'1g', route:'IV', frequency:'TDS',    prescribed_by:'Dr. Tan' },
    ],
    allergies: [{ allergen:'NSAIDs', reaction:'GI bleed (this admission)', severity:'severe' }],
    labs: [
      { test:'Haemoglobin (admit)', value:72,  unit:'g/L',   ref:'130–175',  status:'critical', time:fmt(h(14)) },
      { test:'Haemoglobin (post-TX)', value:89, unit:'g/L',  ref:'130–175',  status:'low',      time:fmt(h(6)) },
      { test:'Platelets',    value:186, unit:'×10⁹/L', ref:'150–400', status:'normal',   time:fmt(h(14)) },
      { test:'INR',          value:1.2, unit:'',       ref:'0.8–1.2', status:'normal',   time:fmt(h(14)) },
      { test:'Urea',         value:14.8, unit:'mmol/L', ref:'2.5–7.8', status:'high',    time:fmt(h(14)) },
    ],
    pendingActions: [
      { action:'Gastroscopy — booked for tomorrow 09:00', priority:'urgent', due:'Tomorrow 09:00' },
      { action:'Keep NBM from midnight tonight', priority:'urgent', due:'Tonight' },
      { action:'Repeat FBC in 4 hours', priority:'urgent', due:fmt(new Date(now.getTime() + 14400000)) },
      { action:'Crossmatch 2 units PRBC available', priority:'urgent', due:'Done — check status' },
    ],
    timeline: [
      { time:fmt(h(14)), event:'Admitted. Hb 72. 2 units PRBC transfused. NBM.', severity:'critical' },
      { time:fmt(h(8)),  event:'Post-transfusion Hb 89. Haemodynamically more stable.', severity:'warn' },
      { time:fmt(h(4)),  event:'No further haematemesis. Gastroscopy booked tomorrow.', severity:'good' },
    ],
    notes: [
      { time:fmt(h(4)), author:'Dr. Martinez', type:'Ward Round', content:'76M UGIB D1. Haematemesis x2 at home. Likely peptic ulcer — on NSAIDs (ibuprofen for back pain). Hb 72 on admission — transfused 2 units, now 89. Haemodynamically improving. Gastroscopy booked tomorrow 09:00. NBM from midnight. NSAID allergy documented. Omeprazole IV BD. Ensure crossmatch available.' },
    ],
    patternInsights: [
      { insight:'Rockford score suggests intermediate risk. Post-endoscopy management will guide discharge timing.', confidence:75, based_on:'Hb trend + haemodynamic response + history' },
    ],
    handoverNotes: 'NBM from midnight. Gastroscopy 09:00 tomorrow. Ensure NBM status maintained overnight.',
    lastSeen: fmt(h(4)),
    nextReview: fmt(new Date(now.getTime() + 7200000)),
  },

  {
    id: 'P008',
    name: 'Helen Murphy',
    age: 58, gender: 'Female', dob: '1967-09-04',
    ward: '7', bed: '4A',
    diagnosis: 'Cellulitis — left leg',
    diagnosisSecondary: ['Type 2 Diabetes', 'Obesity (BMI 38)'],
    admissionDate: fmt(h(48)),
    admissionReason: 'Spreading cellulitis left leg. Failed 48h oral antibiotics at GP.',
    consultant: 'Dr. Martinez (Acute)',
    vitalsBase: { hr:78,bp_sys:136,bp_dia:84,temp:37.4,rr:14,spo2:98, hrVar:5,bpVar:8,tempVar:.3,rrVar:1,spo2Var:1 },
    medications: [
      { name:'Flucloxacillin', dose:'2g', route:'IV', frequency:'QDS',  prescribed_by:'Dr. Martinez' },
      { name:'Metformin',      dose:'1g', route:'PO', frequency:'BD',   prescribed_by:'Dr. Chen (GP)' },
      { name:'Paracetamol',    dose:'1g', route:'PO', frequency:'QDS PRN', prescribed_by:'Dr. Martinez' },
    ],
    allergies: [],
    labs: [
      { test:'CRP',           value:84,  unit:'mg/L',   ref:'<5',      status:'high',   time:fmt(h(12)) },
      { test:'CRP (admit)',   value:142, unit:'mg/L',   ref:'<5',      status:'high',   time:fmt(h(48)) },
      { test:'WBC',           value:10.8, unit:'×10⁹/L', ref:'4–11',  status:'normal', time:fmt(h(12)) },
      { test:'Blood glucose', value:8.4, unit:'mmol/L', ref:'4–7',    status:'high',   time:fmt(h(6)) },
      { test:'Wound swab',    value:'Staph aureus — sensitive to Flucloxacillin', unit:'', ref:'Normal flora', status:'high', time:fmt(h(24)) },
    ],
    pendingActions: [
      { action:'Mark cellulitis borders — reassess spread q8h', priority:'routine', due:'Ongoing' },
      { action:'Consider step-down to oral Flucloxacillin if improving at 48h', priority:'routine', due:'Tomorrow' },
      { action:'Podiatry review — entry wound assessment', priority:'routine', due:'Today' },
    ],
    timeline: [
      { time:fmt(h(48)), event:'Admitted. Cellulitis extending beyond marker line. IV ABx started.', severity:'warn' },
      { time:fmt(h(24)), event:'Border stable. Wound swab: Staph aureus — sensitive to Fluclox.', severity:'good' },
      { time:fmt(h(12)), event:'Erythema reducing. CRP down from 142 to 84. Improving.', severity:'good' },
    ],
    notes: [
      { time:fmt(h(12)), author:'Dr. Martinez', type:'Ward Round', content:'58F D2 cellulitis L leg. Clear improvement — border stable, erythema reducing. CRP 84 (down from 142). Wound swab Staph aureus sensitive to Flucloxacillin — continue current ABx. Plan to step down to oral D3 if maintains improvement. Podiatry for entry wound review. Glucose slightly elevated but monitoring.' },
    ],
    patternInsights: [
      { insight:'CRP trajectory and clinical response suggest good response to IV Flucloxacillin. Step-down to oral antibiotic appropriate if trend continues.', confidence:91, based_on:'CRP trend + cellulitis border progress' },
    ],
    handoverNotes: '',
    lastSeen: fmt(h(12)),
    nextReview: fmt(new Date(now.getTime() + 10800000)),
  },

  {
    id: 'P009',
    name: 'David Kowalski',
    age: 63, gender: 'Male', dob: '1962-12-19',
    ward: '7', bed: '8C',
    diagnosis: 'Acute pancreatitis',
    diagnosisSecondary: ['Gallstones', 'Alcohol excess'],
    admissionDate: fmt(h(30)),
    admissionReason: 'Severe epigastric pain radiating to back, vomiting. Lipase 3× ULN.',
    consultant: 'Dr. Wilson (Surgery)',
    vitalsBase: { hr:94,bp_sys:114,bp_dia:72,temp:37.9,rr:18,spo2:96, hrVar:8,bpVar:10,tempVar:.4,rrVar:2,spo2Var:2 },
    medications: [
      { name:'0.9% NaCl',    dose:'150ml/h', route:'IV', frequency:'continuous', prescribed_by:'Dr. Martinez' },
      { name:'Morphine',     dose:'5mg',      route:'IV', frequency:'PRN 4-hourly', prescribed_by:'Dr. Wilson' },
      { name:'Ondansetron',  dose:'8mg',      route:'IV', frequency:'TDS',         prescribed_by:'Dr. Wilson' },
      { name:'Paracetamol',  dose:'1g',       route:'IV', frequency:'QDS',         prescribed_by:'Dr. Wilson' },
      { name:'Thiamine',     dose:'100mg',    route:'IV', frequency:'TDS (alcohol history)', prescribed_by:'Dr. Wilson' },
    ],
    allergies: [],
    labs: [
      { test:'Lipase',        value:1840, unit:'U/L', ref:'<60',       status:'critical', time:fmt(h(30)) },
      { test:'Lipase (12h)',  value:1240, unit:'U/L', ref:'<60',       status:'critical', time:fmt(h(18)) },
      { test:'CRP',           value:186,  unit:'mg/L', ref:'<5',       status:'critical', time:fmt(h(12)) },
      { test:'Calcium',       value:2.08, unit:'mmol/L', ref:'2.2–2.6', status:'low',    time:fmt(h(12)) },
      { test:'CT Abdomen',    value:'Moderately enlarged pancreas. Peri-pancreatic fat stranding. No necrosis.', unit:'', ref:'Normal', status:'high', time:fmt(h(24)) },
    ],
    pendingActions: [
      { action:'Strict fluid balance — target 2ml/kg/h urine output', priority:'urgent', due:'Ongoing' },
      { action:'Pain score Q4H — adjust analgesia', priority:'routine', due:'Ongoing' },
      { action:'CT severity score: CTSI 4 (moderate) — surgical review if worsens', priority:'routine', due:'As needed' },
      { action:'NBM — may introduce clear fluids if improving by D3', priority:'routine', due:'D3 review' },
    ],
    timeline: [
      { time:fmt(h(30)), event:'Admitted. Severe pain. NBM. IV fluids started. CT arranged.', severity:'critical' },
      { time:fmt(h(24)), event:'CT: no necrosis. CTSI 4. Continue aggressive fluid resus.', severity:'warn' },
      { time:fmt(h(12)), event:'Pain improving. Fluid balance improving. Lipase trending down.', severity:'warn' },
    ],
    notes: [
      { time:fmt(h(6)), author:'Dr. Martinez', type:'Ward Round', content:'63M D1 acute pancreatitis — gallstone likely given imaging. Alcohol history. Moderately severe (CTSI 4) — no necrosis. Pain improving on morphine PRN. Aggressive IVF. Lipase 1240 (down from 1840). CRP 186. Surgical aware. NBM. Thiamine given (alcohol history). Calcium low-normal — monitor. Plan CT review D3 if not improving.' },
    ],
    patternInsights: [
      { insight:'No necrosis on imaging is a positive prognostic sign. CRP trajectory will guide severity assessment at 48h (APACHE-II threshold: CRP>150 at 48h = severe).', confidence:82, based_on:'CT findings + lipase trend + CRP trajectory' },
    ],
    handoverNotes: '',
    lastSeen: fmt(h(6)),
    nextReview: fmt(new Date(now.getTime() + 10800000)),
  },

  {
    id: 'P010',
    name: 'Agnes Blackwood',
    age: 84, gender: 'Female', dob: '1941-06-08',
    ward: '7', bed: '6A',
    diagnosis: 'Falls + left NOF fracture (pre-operative)',
    diagnosisSecondary: ['Osteoporosis', 'Dementia (moderate)', 'Hypertension', 'AF'],
    admissionDate: fmt(h(20)),
    admissionReason: 'Found on floor at care home. X-ray confirmed NOF fracture.',
    consultant: 'Mr. Brown (Orthopaedics)',
    vitalsBase: { hr:76,bp_sys:128,bp_dia:74,temp:36.9,rr:15,spo2:97, hrVar:5,bpVar:10,tempVar:.2,rrVar:1,spo2Var:1 },
    medications: [
      { name:'Enoxaparin',  dose:'40mg',  route:'SC', frequency:'OD (pre-op)',  prescribed_by:'Mr. Brown' },
      { name:'Morphine',    dose:'2.5mg', route:'IV', frequency:'PRN 4-hourly', prescribed_by:'Mr. Brown' },
      { name:'Paracetamol', dose:'1g',    route:'PO', frequency:'QDS',          prescribed_by:'Mr. Brown' },
      { name:'Rivaroxaban', dose:'20mg',  route:'PO', frequency:'OD - HELD pre-op', prescribed_by:'Dr. Chen (GP)' },
      { name:'Bisoprolol',  dose:'5mg',   route:'PO', frequency:'OD',           prescribed_by:'Dr. Chen (GP)' },
    ],
    allergies: [],
    labs: [
      { test:'Hb',          value:112, unit:'g/L',   ref:'115–160', status:'low',    time:fmt(h(18)) },
      { test:'INR',         value:1.1, unit:'',       ref:'0.8–1.2', status:'normal', time:fmt(h(18)) },
      { test:'U&E',         value:'Normal', unit:'', ref:'Normal',   status:'normal', time:fmt(h(18)) },
      { test:'X-ray hip',   value:'Left intracapsular NOF fracture confirmed', unit:'', ref:'Intact', status:'critical', time:fmt(h(20)) },
      { test:'ECG',         value:'AF — rate-controlled 76bpm', unit:'', ref:'Sinus rhythm', status:'normal', time:fmt(h(18)) },
    ],
    pendingActions: [
      { action:'Theatre list — on emergency list for hemiarthroplasty', priority:'urgent', due:'Tomorrow AM' },
      { action:'Anaesthetic review pre-operative', priority:'urgent', due:'Today' },
      { action:'Geriatric medicine review — capacity assessment', priority:'urgent', due:'Today' },
      { action:'Contact NOK — son David Blackwood +44 7xxx xxxxxx', priority:'urgent', due:'Today' },
      { action:'Nutritional assessment — likely malnourished', priority:'routine', due:'Today' },
    ],
    timeline: [
      { time:fmt(h(20)), event:'Admitted from care home. Pain++. Morphine given. NOF confirmed.', severity:'critical' },
      { time:fmt(h(12)), event:'Anaesthetic review. Pain managed. On theatre list for tomorrow.', severity:'warn' },
    ],
    notes: [
      { time:fmt(h(8)), author:'Dr. Martinez', type:'Ward Round', content:'84F intracapsular L NOF fracture. On theatre list for hemiarthroplasty tomorrow AM. Pain managed on morphine PRN. Cognitive baseline — moderate dementia per care home notes. Capacity likely impaired — Geri review for formal assessment. NOK contacted — son aware. Rivaroxaban held. Last dose 2 days ago per care home. Anaesthetic review done.' },
    ],
    patternInsights: [
      { insight:'Delay to surgery >24h increases 30-day mortality. Priority for theatre list. Consider perioperative frailty scoring.', confidence:94, based_on:'Clinical guidelines NOF + age + comorbidities' },
    ],
    handoverNotes: 'On theatre list tomorrow AM. NOK son David to be contacted if theatre confirmed. Pain management ongoing.',
    lastSeen: fmt(h(8)),
    nextReview: fmt(new Date(now.getTime() + 7200000)),
  },

  {
    id: 'P011',
    name: 'Thomas Eriksson',
    age: 48, gender: 'Male', dob: '1977-03-22',
    ward: '7', bed: '11B',
    diagnosis: 'COPD Exacerbation',
    diagnosisSecondary: ['COPD GOLD IV', 'Type 2 respiratory failure (chronic)', 'Cor pulmonale'],
    admissionDate: fmt(h(42)),
    admissionReason: 'Increased SOB, purulent sputum, reduced exercise tolerance',
    consultant: 'Dr. Okafor (Respiratory)',
    vitalsBase: { hr:88,bp_sys:128,bp_dia:78,temp:37.3,rr:22,spo2:89, hrVar:6,bpVar:8,tempVar:.3,rrVar:3,spo2Var:2 },
    medications: [
      { name:'Doxycycline',   dose:'200mg',  route:'PO', frequency:'OD day 1, then 100mg OD', prescribed_by:'Dr. Okafor' },
      { name:'Prednisolone',  dose:'30mg',   route:'PO', frequency:'OD x5 days', prescribed_by:'Dr. Okafor' },
      { name:'Salbutamol',    dose:'2.5mg',  route:'Neb', frequency:'QDS + PRN',  prescribed_by:'Dr. Okafor' },
      { name:'Ipratropium',   dose:'500mcg', route:'Neb', frequency:'QDS',         prescribed_by:'Dr. Okafor' },
      { name:'Theophylline',  dose:'200mg',  route:'PO', frequency:'BD',           prescribed_by:'Dr. Okafor' },
    ],
    allergies: [],
    labs: [
      { test:'ABG pH',    value:7.34, unit:'',       ref:'7.35–7.45', status:'low',      time:fmt(h(6)) },
      { test:'pCO2',      value:7.1,  unit:'kPa',    ref:'4.7–6.0',   status:'high',     time:fmt(h(6)) },
      { test:'pO2',       value:8.4,  unit:'kPa',    ref:'>10',       status:'low',      time:fmt(h(6)) },
      { test:'Sputum MC&S', value:'Haemophilus influenzae — sensitive to Doxycycline', unit:'', ref:'Normal', status:'high', time:fmt(h(18)) },
      { test:'CXR',       value:'Hyperinflated. No consolidation. Cor pulmonale changes.', unit:'', ref:'Normal', status:'normal', time:fmt(h(42)) },
    ],
    pendingActions: [
      { action:'Controlled O2 — target SpO2 88-92% (Type 2 RF)', priority:'urgent', due:'Ongoing — check O2 delivery' },
      { action:'NIV assessment if pH worsens (<7.30)', priority:'urgent', due:'Monitor ABG 4-hourly' },
      { action:'Smoking cessation counselling', priority:'routine', due:'When well enough' },
    ],
    timeline: [
      { time:fmt(h(42)), event:'Admitted. SpO2 82% on air. Controlled O2 started.', severity:'critical' },
      { time:fmt(h(24)), event:'Antibiotics and steroids started. SpO2 improving.', severity:'warn' },
      { time:fmt(h(6)),  event:'ABG improved but still type 2 RF. Monitoring.', severity:'warn' },
    ],
    notes: [
      { time:fmt(h(6)), author:'Dr. Martinez', type:'Ward Round', content:'48M COPD GOLD IV exacerbation. SpO2 89% on controlled 28% O2. ABG pH 7.34, pCO2 7.1 — compensated type 2 RF. Sputum — H.flu, Doxy appropriate. Continue current plan. Strict controlled O2 28% — do not increase without ABG check. NIV ready if pH drops. Steroids D1. Review tomorrow.' },
    ],
    patternInsights: [
      { insight:'pCO2 trending — monitor closely for decompensated T2RF. NIV criteria: pH <7.35, pCO2 >6 on controlled O2.', confidence:88, based_on:'ABG trend + SpO2 + respiratory mechanics' },
    ],
    handoverNotes: 'Controlled O2 ONLY — 28% mask. Check O2 delivery each handover. NIV criteria: pH <7.30.',
    lastSeen: fmt(h(6)),
    nextReview: fmt(new Date(now.getTime() + 7200000)),
  },

  {
    id: 'P012',
    name: 'Linda Osei',
    age: 39, gender: 'Female', dob: '1986-11-14',
    ward: '7', bed: '10C',
    diagnosis: 'DVT — left femoral',
    diagnosisSecondary: ['Pregnancy (28 weeks)'],
    admissionDate: fmt(h(16)),
    admissionReason: 'Left leg pain and swelling. Doppler confirmed DVT.',
    consultant: 'Dr. King (Haematology/Obstetrics liaison)',
    vitalsBase: { hr:84,bp_sys:116,bp_dia:72,temp:36.8,rr:16,spo2:99, hrVar:6,bpVar:8,tempVar:.2,rrVar:1,spo2Var:1 },
    medications: [
      { name:'Dalteparin (LMWH)', dose:'per weight chart', route:'SC', frequency:'OD', prescribed_by:'Dr. King' },
      { name:'Compression stocking', dose:'left leg', route:'External', frequency:'Continuous', prescribed_by:'Dr. King' },
    ],
    allergies: [],
    labs: [
      { test:'D-dimer', value:3.4, unit:'mg/L FEU', ref:'<0.5 (elevated in pregnancy)', status:'high', time:fmt(h(16)) },
      { test:'Lower limb doppler', value:'Left femoral DVT confirmed', unit:'', ref:'Normal', status:'critical', time:fmt(h(14)) },
      { test:'FBC', value:'Normal. Hb 110 (expected in pregnancy)', unit:'g/L', ref:'115–160', status:'normal', time:fmt(h(14)) },
      { test:'U&E + LFT', value:'Normal', unit:'', ref:'Normal', status:'normal', time:fmt(h(14)) },
      { test:'Fetal USS (obstetrics)', value:'28 weeks. Normal fetal movements. Placenta normal.', unit:'', ref:'Normal', status:'normal', time:fmt(h(12)) },
    ],
    pendingActions: [
      { action:'Anti-Xa level 4h post-LMWH dose', priority:'urgent', due:fmt(new Date(now.getTime() + 3600000)) },
      { action:'Obstetric review — delivery planning with anticoagulation', priority:'urgent', due:'Today' },
      { action:'Patient education — injection technique, self-monitoring', priority:'routine', due:'Before discharge' },
      { action:'Haematology plan for duration of anticoagulation', priority:'routine', due:'Today' },
    ],
    timeline: [
      { time:fmt(h(16)), event:'Admitted. Left leg pain/swelling. DVT confirmed.', severity:'warn' },
      { time:fmt(h(14)), event:'LMWH started. Obstetrics review — fetus normal.', severity:'good' },
    ],
    notes: [
      { time:fmt(h(8)), author:'Dr. Martinez', type:'Ward Round', content:'39F 28/40 pregnant with left femoral DVT. On LMWH (Dalteparin) — dose per weight chart. Fetal wellbeing confirmed on obstetric review. Anti-Xa level due in 1h. Obstetrics plan for delivery: planned LMWH management. Discharge when Anti-Xa therapeutic and patient trained on self-injection.' },
    ],
    patternInsights: [
      { insight:'DVT in pregnancy — LMWH preferred over warfarin/DOACs. Anti-Xa monitoring essential in pregnancy due to volume of distribution changes.', confidence:96, based_on:'Clinical guidelines RCOG + NICE NG158' },
    ],
    handoverNotes: '',
    lastSeen: fmt(h(8)),
    nextReview: fmt(new Date(now.getTime() + 10800000)),
  },

  {
    id: 'P013',
    name: 'Charles Hammond',
    age: 70, gender: 'Male', dob: '1955-08-17',
    ward: '7', bed: '13D',
    diagnosis: 'Small Bowel Obstruction',
    diagnosisSecondary: ['Previous abdominal surgery (appendicectomy 1998)', 'Hypertension'],
    admissionDate: fmt(h(22)),
    admissionReason: 'Absolute constipation, colicky abdominal pain, distension, vomiting.',
    consultant: 'Mr. Ahmed (Colorectal Surgery)',
    vitalsBase: { hr:92,bp_sys:118,bp_dia:74,temp:37.2,rr:18,spo2:97, hrVar:7,bpVar:10,tempVar:.3,rrVar:2,spo2Var:1 },
    medications: [
      { name:'0.9% NaCl', dose:'1L', route:'IV', frequency:'4-hourly', prescribed_by:'Mr. Ahmed' },
      { name:'Morphine',  dose:'5mg', route:'IV', frequency:'PRN 4h',  prescribed_by:'Mr. Ahmed' },
      { name:'Metoclopramide', dose:'10mg', route:'IV', frequency:'TDS', prescribed_by:'Mr. Ahmed' },
    ],
    allergies: [],
    labs: [
      { test:'AXR',         value:'Dilated small bowel loops. Air-fluid levels.', unit:'', ref:'Normal', status:'critical', time:fmt(h(22)) },
      { test:'CT Abdomen',  value:'Adhesional SBO — transition point at right iliac fossa. No perforation.', unit:'', ref:'Normal', status:'high', time:fmt(h(20)) },
      { test:'Lactate',     value:1.4, unit:'mmol/L', ref:'<2.0', status:'normal', time:fmt(h(8)) },
      { test:'U&E',         value:'Na 134, K 3.2 (low) — replace', unit:'', ref:'Normal', status:'low', time:fmt(h(8)) },
    ],
    pendingActions: [
      { action:'NG tube — check position and aspirate', priority:'urgent', due:'Now' },
      { action:'KCl replacement per U&E', priority:'urgent', due:'Now' },
      { action:'Surgical review every 12h — conservative vs theatre', priority:'urgent', due:'12h review' },
      { action:'Reassess for signs of ischaemia (increasing pain, peritonism, fever)', priority:'urgent', due:'Ongoing' },
    ],
    timeline: [
      { time:fmt(h(22)), event:'Admitted. AXR — SBO. NBM. IV fluids. NG tube inserted.', severity:'critical' },
      { time:fmt(h(20)), event:'CT: adhesional SBO. No strangulation. Conservative management plan.', severity:'warn' },
      { time:fmt(h(8)),  event:'Flatus passed — partial resolution. Monitoring.', severity:'good' },
    ],
    notes: [
      { time:fmt(h(8)), author:'Dr. Martinez', type:'Ward Round', content:'70M adhesional SBO D1. CT no perforation. Conservative management. NG tube aspirating 300ml bile-stained. Passed flatus this morning — encouraging. Lactate 1.4 — not ischaemic. K 3.2 — replace. Surgical review at 18:00. If no improvement by D2, surgical team will consider theatre.' },
    ],
    patternInsights: [
      { insight:'Flatus is a positive sign — may resolve conservatively. 80% of adhesional SBO resolve non-operatively. Monitor for ischaemia signs.', confidence:77, based_on:'Clinical guidelines + CT findings + clinical progress' },
    ],
    handoverNotes: 'Surgical review 18:00. Watch for signs of strangulation — increasing pain, fever, peritonism.',
    lastSeen: fmt(h(8)),
    nextReview: fmt(new Date(now.getTime() + 14400000)),
  },

  {
    id: 'P014',
    name: 'Fatima Al-Hassan',
    age: 29, gender: 'Female', dob: '1996-04-30',
    ward: '7', bed: '14B',
    diagnosis: 'Ischemic Stroke (NIHSS 4)',
    diagnosisSecondary: ['Patent foramen ovale (confirmed)', 'Migraine with aura (history)'],
    admissionDate: fmt(h(26)),
    admissionReason: 'Acute right arm weakness, speech slurring. NIHSS 6 on arrival. tPA given.',
    consultant: 'Dr. Al-Farsi (Stroke)',
    vitalsBase: { hr:74,bp_sys:148,bp_dia:86,temp:37.0,rr:14,spo2:99, hrVar:5,bpVar:12,tempVar:.2,rrVar:1,spo2Var:1 },
    medications: [
      { name:'Aspirin',       dose:'300mg', route:'PO', frequency:'OD x14 days', prescribed_by:'Dr. Al-Farsi' },
      { name:'Atorvastatin',  dose:'80mg',  route:'PO', frequency:'ON',          prescribed_by:'Dr. Al-Farsi' },
      { name:'Amlodipine',    dose:'5mg',   route:'PO', frequency:'OD',          prescribed_by:'Dr. Al-Farsi' },
    ],
    allergies: [],
    labs: [
      { test:'CT head (initial)', value:'No haemorrhage. No early infarct sign.', unit:'', ref:'Normal', status:'normal', time:fmt(h(26)) },
      { test:'MRI head (D1)',     value:'Acute left MCA territory infarct confirmed. DWI positive.', unit:'', ref:'Normal', status:'critical', time:fmt(h(20)) },
      { test:'Echo (bubble)',     value:'PFO confirmed on bubble contrast.', unit:'', ref:'Normal', status:'high', time:fmt(h(12)) },
      { test:'Lipids',            value:'LDL 3.8 mmol/L', unit:'', ref:'<2.0 post-stroke', status:'high', time:fmt(h(24)) },
    ],
    pendingActions: [
      { action:'Stroke unit observation protocol — BP monitoring Q1h', priority:'urgent', due:'Ongoing' },
      { action:'SALT assessment — swallowing screen', priority:'urgent', due:'Today' },
      { action:'Physiotherapy assessment', priority:'routine', due:'Today' },
      { action:'Cardiology referral re: PFO closure decision', priority:'routine', due:'This week' },
    ],
    timeline: [
      { time:fmt(h(26)), event:'Admitted. NIHSS 6. tPA given within 3h of onset.', severity:'critical' },
      { time:fmt(h(20)), event:'NIHSS improving to 4. MRI confirms left MCA infarct.', severity:'warn' },
      { time:fmt(h(12)), event:'Echo — PFO confirmed. Cardiology referral made.', severity:'warn' },
    ],
    notes: [
      { time:fmt(h(8)), author:'Dr. Martinez', type:'Ward Round', content:'29F ischaemic stroke — left MCA territory. NIHSS improved to 4 (from 6). tPA given within 3h. PFO confirmed on echo — referral to cardiology for closure discussion. BP 148/86 — allow permissive hypertension acute phase (target <180/105). SALT review today. Aspirin + statin started. No anticoagulation until repeat imaging D14.' },
    ],
    patternInsights: [
      { insight:'PFO in young stroke patient strongly suggests paradoxical embolism pathway. PFO closure likely after 6 months antiplatelet therapy.', confidence:88, based_on:'Echo findings + age + cryptogenic stroke diagnosis' },
    ],
    handoverNotes: '',
    lastSeen: fmt(h(8)),
    nextReview: fmt(new Date(now.getTime() + 10800000)),
  },

  {
    id: 'P015',
    name: 'Patricia Nguyen',
    age: 56, gender: 'Female', dob: '1969-02-11',
    ward: '7', bed: '15A',
    diagnosis: 'AKI (Stage 2) on background CKD',
    diagnosisSecondary: ['CKD stage 3 (baseline Cr 140)', 'Hypertension', 'NSAID overuse'],
    admissionDate: fmt(h(40)),
    admissionReason: 'Oliguria, creatinine 380 on GP blood test.',
    consultant: 'Dr. Davies (Nephrology)',
    vitalsBase: { hr:78,bp_sys:158,bp_dia:94,temp:36.8,rr:15,spo2:97, hrVar:5,bpVar:12,tempVar:.2,rrVar:1,spo2Var:1 },
    medications: [
      { name:'0.9% NaCl', dose:'500ml', route:'IV', frequency:'over 4h (if tolerated)', prescribed_by:'Dr. Davies' },
      { name:'Amlodipine', dose:'10mg', route:'PO', frequency:'OD', prescribed_by:'Dr. Davies' },
      { name:'Ramipril — HELD', dose:'10mg', route:'PO', frequency:'OD - HELD', prescribed_by:'Dr. Chen (GP)' },
    ],
    allergies: [],
    labs: [
      { test:'Creatinine (admit)', value:380, unit:'µmol/L', ref:'59–104', status:'critical', time:fmt(h(40)) },
      { test:'Creatinine (24h)',   value:310, unit:'µmol/L', ref:'59–104', status:'critical', time:fmt(h(16)) },
      { test:'Creatinine (now)',   value:268, unit:'µmol/L', ref:'59–104', status:'critical', time:fmt(h(4)) },
      { test:'Potassium',          value:5.4, unit:'mmol/L', ref:'3.5–5.0', status:'high',   time:fmt(h(4)) },
      { test:'Renal USS',          value:'No obstruction. Bilateral small kidneys consistent with CKD.', unit:'', ref:'Normal', status:'normal', time:fmt(h(30)) },
    ],
    pendingActions: [
      { action:'Strict fluid balance — target euvolaemia', priority:'urgent', due:'Ongoing' },
      { action:'Repeat U&E in AM', priority:'urgent', due:'Tomorrow 07:00' },
      { action:'If K+ worsens (>6.0) — medical emergency management', priority:'urgent', due:'Ongoing' },
      { action:'Nephrology review re: dialysis threshold if no improvement', priority:'routine', due:'Tomorrow' },
    ],
    timeline: [
      { time:fmt(h(40)), event:'Admitted. Cr 380. NSAID nephrotoxicity. NSAIDs stopped.', severity:'critical' },
      { time:fmt(h(16)), event:'Cr improving to 310. Urine output improving with IVF.', severity:'warn' },
      { time:fmt(h(4)),  event:'Cr 268. K+ 5.4 — monitoring. Trend encouraging.', severity:'warn' },
    ],
    notes: [
      { time:fmt(h(4)), author:'Dr. Martinez', type:'Ward Round', content:'56F AKI stage 2 on CKD — likely NSAID nephrotoxicity + dehydration. Cr improving (380→268). Urine output >0.5ml/kg/h. K+ 5.4 — no treatment needed yet but watch. ACEi held. NSAIDs stopped and documented as contraindicated. Continue IVF cautiously. Nephrology review tomorrow if Cr not continuing to improve.' },
    ],
    patternInsights: [
      { insight:'Creatinine trajectory suggests reversible AKI. NSAIDs documented as contraindicated. Ensure this is in discharge letter and GP informed.', confidence:89, based_on:'Creatinine trajectory + response to IVF + clinical history' },
    ],
    handoverNotes: '',
    lastSeen: fmt(h(4)),
    nextReview: fmt(new Date(now.getTime() + 7200000)),
  },

  {
    id: 'P016',
    name: 'Oliver Marsh',
    age: 22, gender: 'Male', dob: '2003-09-01',
    ward: '7', bed: '16C',
    diagnosis: 'Asthma exacerbation (moderate)',
    diagnosisSecondary: ['Asthma (not well-controlled)', 'Viral URTI trigger'],
    admissionDate: fmt(h(10)),
    admissionReason: 'Wheeze, SOB, unable to complete sentences. PEFR 48% predicted.',
    consultant: 'Dr. Okafor (Respiratory)',
    vitalsBase: { hr:94,bp_sys:118,bp_dia:72,temp:37.1,rr:20,spo2:94, hrVar:7,bpVar:8,tempVar:.3,rrVar:3,spo2Var:2 },
    medications: [
      { name:'Salbutamol',    dose:'5mg',   route:'Neb', frequency:'Q20min x3, then QDS', prescribed_by:'Dr. Okafor' },
      { name:'Ipratropium',   dose:'500mcg', route:'Neb', frequency:'TDS x3 doses',       prescribed_by:'Dr. Okafor' },
      { name:'Prednisolone',  dose:'40mg',   route:'PO',  frequency:'OD x5 days',         prescribed_by:'Dr. Okafor' },
      { name:'Hydrocortisone', dose:'100mg', route:'IV',  frequency:'QDS (initial 24h)',  prescribed_by:'Dr. Okafor' },
    ],
    allergies: [{ allergen:'Aspirin', reaction:'Bronchoconstriction (NSAID-exacerbated)', severity:'severe' }],
    labs: [
      { test:'PEFR (admit)',    value:'48% predicted', unit:'', ref:'>75%', status:'critical', time:fmt(h(10)) },
      { test:'PEFR (6h)',       value:'62% predicted', unit:'', ref:'>75%', status:'high',     time:fmt(h(4)) },
      { test:'SpO2 on air',     value:94, unit:'%', ref:'>95%', status:'low', time:fmt(h(2)) },
      { test:'ABG (on admission)', value:'Respiratory alkalosis. No hypercapnia.', unit:'', ref:'Normal', status:'normal', time:fmt(h(10)) },
      { test:'CXR',             value:'Hyperinflated. No consolidation.', unit:'', ref:'Normal', status:'normal', time:fmt(h(10)) },
    ],
    pendingActions: [
      { action:'PEFR Q4H — target >75% before discharge', priority:'urgent', due:'Ongoing' },
      { action:'Asthma action plan before discharge', priority:'routine', due:'Before discharge' },
      { action:'Step up regular inhaled therapy — GP follow-up', priority:'routine', due:'Discharge letter' },
      { action:'Check inhaler technique before discharge', priority:'routine', due:'Before discharge' },
    ],
    timeline: [
      { time:fmt(h(10)), event:'Admitted. Moderate exacerbation. Nebs started. IV hydrocortisone.', severity:'critical' },
      { time:fmt(h(4)),  event:'PEFR improving to 62%. SpO2 94%. Continuing nebs.', severity:'warn' },
    ],
    notes: [
      { time:fmt(h(2)), author:'Dr. Martinez', type:'Ward Round', content:'22M moderate asthma exacerbation. PEFR improving to 62% from 48%. Still below discharge threshold of >75%. SpO2 94% on room air. No hypercapnia on ABG. Continue steroids and nebs. Aspirin allergy documented. If PEFR >75% sustained by evening, consider discharge tomorrow with asthma action plan and GP follow-up arranged.' },
    ],
    patternInsights: [
      { insight:'PEFR trajectory suggests discharge possible within 12-24h. Ensure step-up of preventer inhaler and written action plan before discharge.', confidence:85, based_on:'PEFR trajectory + SpO2 + BTS asthma guidelines' },
    ],
    handoverNotes: '',
    lastSeen: fmt(h(2)),
    nextReview: fmt(new Date(now.getTime() + 7200000)),
  },
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

  updatePatient(id, updates) {
    const idx = this._patients.findIndex(p => p.id === id);
    if (idx >= 0) this._patients[idx] = { ...this._patients[idx], ...updates };
  }

  addNote(id, note) {
    const p = this.getById(id);
    if (!p) return;
    p.notes = [note, ...p.notes];
  }

  getShiftStats() {
    const all = this._patients;
    return {
      total:    all.length,
      critical: all.filter(p => p.riskLevel === 'critical').length,
      high:     all.filter(p => p.riskLevel === 'high').length,
      medium:   all.filter(p => p.riskLevel === 'medium').length,
      stable:   all.filter(p => p.riskLevel === 'stable' || p.riskLevel === 'low').length,
      pendingActions: all.reduce((s, p) => s + (p.pendingActions?.length || 0), 0),
      discharging: all.filter(p => p.handoverNotes?.includes('discharge') || p.pendingActions?.some(a => a.action.includes('discharge'))).length,
    };
  }

  getPatternInsights() {
    const all = [];
    this._patients.forEach(p => {
      (p.patternInsights || []).forEach(ins => {
        all.push({ ...ins, patient: p.name, patientId: p.id });
      });
    });
    return all.sort((a,b) => b.confidence - a.confidence);
  }

  simulateLiveVitals() {
    this._patients.forEach(p => {
      const b = p._vitalsBase;
      const cur = {
        time: new Date().toISOString(),
        hr:     Math.round(b.hr     + (Math.random()-.5) * b.hrVar),
        bp_sys: Math.round(b.bp_sys + (Math.random()-.5) * b.bpVar),
        bp_dia: Math.round(b.bp_dia + (Math.random()-.5) * (b.bpVar*.6)),
        temp:   Math.round((b.temp  + (Math.random()-.5) * b.tempVar) * 10) / 10,
        rr:     Math.round(b.rr     + (Math.random()-.5) * b.rrVar),
        spo2:   Math.min(100, Math.round(b.spo2  + (Math.random()-.5) * b.spo2Var)),
      };
      p.vitals.current = cur;
      p.vitals.history.push(cur);
      if (p.vitals.history.length > 30) p.vitals.history.shift();
      p.news2Score = news2(cur);
      p.riskLevel  = riskLevel(p.news2Score);
    });
  }

  getShiftProgress() {
    const start = new Date();
    start.setHours(7, 0, 0, 0);
    const end = new Date();
    end.setHours(19, 0, 0, 0);
    const total = end - start;
    const elapsed = Date.now() - start;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }
}

const ShiftState = {
  doctor: { name:'Dr. Sarah Martinez', specialty:'Internal Medicine', grade:'ST5', initials:'SM', startTime:'07:00', endTime:'19:00' },
  ward: 'Ward 7 — General Medicine',
  date: new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
};

global.PatientStore = new PatientStore();
global.ShiftState   = ShiftState;

})(window);

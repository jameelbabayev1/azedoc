#!/usr/bin/env node

/**
 * AZEDOC Translation Verification Tool
 * Uses Claude API to verify and correct all English text to proper Azerbaijani
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// English strings that need translation
const TRANSLATION_STRINGS = {
  // Time formatting
  'just now': { context: 'Time ago display', category: 'time' },

  // UI Buttons & Modal
  'Close': { context: 'Modal close button', category: 'button' },

  // Alerts & Messages
  'Active Alerts': { context: 'Modal title for critical alerts', category: 'title' },
  'No active critical alerts.': { context: 'Empty state message', category: 'message' },
  'No patients found': { context: 'Empty search state', category: 'message' },
  'No pending actions': { context: 'Empty pending actions state', category: 'message' },
  'No AI insights available.': { context: 'Empty insights state', category: 'message' },

  // Page titles & headers
  'Patient List': { context: 'Page title for patient list', category: 'title' },
  'patients': { context: 'Subtitle showing patient count', category: 'subtitle' },
  'Back to patients': { context: 'Back button text', category: 'button' },

  // Greeting
  'Good': { context: 'Part of greeting (Good morning/afternoon/evening)', category: 'greeting' },

  // Tab names
  'Overview': { context: 'Patient detail tab', category: 'tab' },
  'Vitals': { context: 'Patient vital signs tab', category: 'tab' },
  'Labs': { context: 'Laboratory results tab', category: 'tab' },
  'Medications': { context: 'Medications tab', category: 'tab' },
  'Timeline': { context: 'Timeline events tab', category: 'tab' },
  'Notes': { context: 'Clinical notes tab', category: 'tab' },
  'AI Insights': { context: 'AI analysis tab', category: 'tab' },

  // Patient info labels
  'DOB:': { context: 'Date of birth label', category: 'label' },
  'Bed': { context: 'Hospital bed number', category: 'label' },
  'Admitted:': { context: 'Admission date label', category: 'label' },

  // Vital signs labels
  'Heart Rate': { context: 'HR vital sign label', category: 'vital' },
  'Blood Pressure': { context: 'BP vital sign label', category: 'vital' },
  'SpO2': { context: 'Oxygen saturation vital sign', category: 'vital' },
  'Temperature': { context: 'Body temperature vital sign', category: 'vital' },
  'Resp Rate': { context: 'Respiratory rate vital sign', category: 'vital' },

  // Chart titles
  'Heart Rate (bpm)': { context: 'Chart title for heart rate', category: 'chart' },
  'Blood Pressure (mmHg)': { context: 'Chart title for blood pressure', category: 'chart' },
  'SpO2 (%)': { context: 'Chart title for oxygen saturation', category: 'chart' },
  'Temperature (°C)': { context: 'Chart title for temperature', category: 'chart' },
  'Respiratory Rate (/min)': { context: 'Chart title for respiratory rate', category: 'chart' },

  // Table headers
  'Test': { context: 'Lab test name column header', category: 'header' },
  'Result': { context: 'Lab result value column header', category: 'header' },
  'Unit': { context: 'Lab unit column header', category: 'header' },
  'Reference': { context: 'Lab reference range column header', category: 'header' },
  'Status': { context: 'Lab status column header', category: 'header' },
  'Time': { context: 'Time column header', category: 'header' },

  // Medication table headers
  'Drug': { context: 'Medication name column header', category: 'header' },
  'Dose': { context: 'Medication dose column header', category: 'header' },
  'Route': { context: 'Medication route column header (IV, PO, etc)', category: 'header' },
  'Frequency': { context: 'Medication frequency column header', category: 'header' },
  'Prescribed By': { context: 'Prescriber column header', category: 'header' },

  // Allergies
  'Allergies': { context: 'Allergies section header', category: 'section' },

  // Clinical notes
  '+ Add Note': { context: 'Button to add new clinical note', category: 'button' },
  'Add Clinical Note': { context: 'Modal title for adding note', category: 'title' },
  'Note Type': { context: 'Note type selection label', category: 'label' },
  'Note': { context: 'Note content label', category: 'label' },
  'Save Note': { context: 'Save note button', category: 'button' },
  'Ward Round': { context: 'Type of clinical note', category: 'option' },
  'Progress Note': { context: 'Type of clinical note', category: 'option' },
  'Procedure': { context: 'Type of clinical note', category: 'option' },
  'Referral': { context: 'Type of clinical note', category: 'option' },
  'Nursing': { context: 'Type of clinical note', category: 'option' },
  'Enter clinical note...': { context: 'Textarea placeholder', category: 'placeholder' },

  // AI Insights
  'Ask AXIOM about this patient': { context: 'Section title for asking AI questions', category: 'section' },
  'e.g. What\'s the most likely cause of rising lactate?': { context: 'Placeholder example for AI query', category: 'placeholder' },
  'Ask': { context: 'Button to send query to AXIOM', category: 'button' },

  // AI Status
  'AXIOM is thinking...': { context: 'Loading message while AI processes', category: 'loading' },
  'Rate limit exceeded. Please try again later.': { context: 'Error message for API rate limiting', category: 'error' },
  'Authentication failed. Please refresh.': { context: 'Error message for auth failure', category: 'error' },
  'Error querying AXIOM': { context: 'Generic error message', category: 'error' },

  // Voice recording
  'Listening... Speak clearly': { context: 'Status message while recording', category: 'status' },
  'Microphone ACTIVE - Speak your clinical consultation': { context: 'Toast message when recording starts', category: 'status' },
  'Speech recognition error:': { context: 'Error log prefix', category: 'error' },
  'Network error - Continue speaking, will retry automatically': { context: 'Network error message', category: 'error' },
  'Microphone permission denied - Paste transcript manually': { context: 'Permission error message', category: 'error' },
  'Could not restart recognition:': { context: 'Logging error', category: 'error' },
  'Recording complete': { context: 'Status after recording stopped', category: 'status' },

  // SOAP Note instructions
  'Generated SOAP note will appear here': { context: 'Placeholder for generated note', category: 'placeholder' },
  'Record your consultation or paste a transcript, then click "Generate SOAP Note"': { context: 'Instructions for using scribe', category: 'instruction' },
};

// Correct Azerbaijani translations with verification
const AZERBAIJANI_TRANSLATIONS = {
  'just now': 'az əvvəl',
  'Close': 'Bağla',
  'Active Alerts': 'Fəal Xəbərdarlıqlar',
  'No active critical alerts.': 'Aktiv kritik xəbərdarlıq yoxdur.',
  'No patients found': 'Xəstə tapılmadı',
  'No pending actions': 'Gözləyən əməliyyat yoxdur',
  'No AI insights available.': 'AI təhlili mövcud deyil.',
  'Patient List': 'Xəstə Siyahısı',
  'patients': 'xəstə',
  'Back to patients': 'Xəstələrə qayıt',
  'Good': 'Salam', // Will be used in greeting context
  'Overview': 'Ümumi Nəzardən Keçirmə',
  'Vitals': 'Vital Göstəricilər',
  'Labs': 'Laboratoriya',
  'Medications': 'Dərmanlar',
  'Timeline': 'Vaxt Xətti',
  'Notes': 'Qeydlər',
  'AI Insights': 'AI Təhliləri',
  'DOB:': 'Doğum Tarixi:',
  'Bed': 'Çarpayı',
  'Admitted:': 'Qəbul Tarixi:',
  'Heart Rate': 'Ürək Döyüntüsü',
  'Blood Pressure': 'Qan Təzyiqi',
  'SpO2': 'Oksigen Satürasyonu',
  'Temperature': 'Temperatur',
  'Resp Rate': 'Tənəffüs Tezliyi',
  'Heart Rate (bpm)': 'Ürək Döyüntüsü (dəfə/dəq)',
  'Blood Pressure (mmHg)': 'Qan Təzyiqi (mmHg)',
  'SpO2 (%)': 'Oksigen Satürasyonu (%)',
  'Temperature (°C)': 'Temperatur (°C)',
  'Respiratory Rate (/min)': 'Tənəffüs Tezliyi (/dəq)',
  'Test': 'Test',
  'Result': 'Nəticə',
  'Unit': 'Vahid',
  'Reference': 'Referens',
  'Status': 'Status',
  'Time': 'Vaxt',
  'Drug': 'Dərman',
  'Dose': 'Doza',
  'Route': 'Yol',
  'Frequency': 'Tezlik',
  'Prescribed By': 'Təyin edən',
  'Allergies': 'Allergilər',
  '+ Add Note': '+ Qeyd Əlavə Et',
  'Add Clinical Note': 'Klinik Qeyd Əlavə Et',
  'Note Type': 'Qeyd Tipi',
  'Note': 'Qeyd',
  'Save Note': 'Qeydi Saxla',
  'Ward Round': 'Bölmə Viziti',
  'Progress Note': 'İrəliləmə Qeydi',
  'Procedure': 'Prosedura',
  'Referral': 'Yönləndirmə',
  'Nursing': 'Sestrə',
  'Enter clinical note...': 'Klinik qeyd daxil edin...',
  'Ask AXIOM about this patient': 'AXIOM-a bu xəstə haqqında soruş',
  'e.g. What\'s the most likely cause of rising lactate?': 'Məs. Artan laktanın ən ehtimal səbəbi nədir?',
  'Ask': 'Soruş',
  'AXIOM is thinking...': 'AXIOM fikirləşir...',
  'Rate limit exceeded. Please try again later.': 'Limit aşılmışdır. Sonra yenidən cəhd edin.',
  'Authentication failed. Please refresh.': 'Autentifikasiya uğursuz oldu. Yenilə.',
  'Error querying AXIOM': 'AXIOM sorğusunda xəta',
  'Listening... Speak clearly': 'Dinləyir... Aydın danışın',
  'Microphone ACTIVE - Speak your clinical consultation': 'Mikrofon AKTIV - Klinik məsləhətinizi danışın',
  'Speech recognition error:': 'Səs tanıması xətası:',
  'Network error - Continue speaking, will retry automatically': 'Şəbəkə xətası - Danışmağa davam edin, avtomatik yenidən cəhd olunacaq',
  'Microphone permission denied - Paste transcript manually': 'Mikrofon icazəsi verilmədi - Transkripsiyonu əl ilə yapışdırın',
  'Could not restart recognition:': 'Tanıması yenidən başlamadım:',
  'Recording complete': '✓ Qeydiyyat tamamlandı',
  'Generated SOAP note will appear here': 'Yaradılan SOAP qeydi burada görünəcək',
  'Record your consultation or paste a transcript, then click "Generate SOAP Note"': 'Məsləhətinizi qeyd edin və ya transkriptsiyonu yapışdırın, sonra "SOAP Qeydi Yaradın" düyməsinə tıklayın',
};

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function verifyTranslations() {
  console.log('🔍 AZEDOC Translation Verification Tool');
  console.log('========================================\n');

  // Prepare strings for verification
  const stringsToCheck = Object.entries(TRANSLATION_STRINGS).map(([english, info]) => ({
    english,
    azerbaijani: AZERBAIJANI_TRANSLATIONS[english],
    context: info.context,
    category: info.category,
  }));

  console.log(`Found ${stringsToCheck.length} strings to verify\n`);

  // Group by category for better organization
  const byCategory = {};
  stringsToCheck.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  // Verify translations using Claude
  const prompt = `You are an expert in Azerbaijani medical terminology and grammar. Verify the following translations from English to Azerbaijani medical software context. For each translation, check:

1. **Grammar correctness**: Is the Azerbaijani grammatically correct?
2. **Medical terminology**: Is the medical term accurate and commonly used in Azerbaijan?
3. **Context appropriateness**: Does it fit the UI context (buttons, labels, messages)?
4. **Consistency**: Is it consistent with other similar terms?

Format your response as JSON with this structure:
{
  "translations": [
    {
      "english": "...",
      "proposed": "...",
      "verdict": "correct" | "needs_fix" | "alternative",
      "suggestion": "...",
      "reasoning": "...",
      "confidence": 85
    }
  ]
}

Here are the translations to verify:\n\n${stringsToCheck.map(s => `English: "${s.english}"\nContext: ${s.context}\nProposed Azerbaijani: "${s.azerbaijani}"\n---`).join('\n')}`;

  try {
    console.log('📡 Sending to Claude Opus 4.6 for verification...\n');
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse response
    let content = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      }
    }

    // Extract JSON - try to find valid JSON
    let result;
    try {
      // Try direct JSON parsing first
      result = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON object from response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ Could not parse Claude response');
        console.log('Raw response:', content.substring(0, 1000));
        return;
      }
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        result = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('❌ Invalid JSON in response:', parseError.message);
        console.log('Content near error:', content.substring(Math.max(0, parseError.message.match(/position (\d+)/)?.[1] - 100 || 0), parseError.message.match(/position (\d+)/)?.[1] + 100 || content.length));
        return;
      }
    }

    // Display results grouped by verdict
    let correctCount = 0;
    let needsFixCount = 0;
    let alternativeCount = 0;

    console.log('\n📋 VERIFICATION RESULTS\n');
    console.log('='.repeat(80));

    // Show correct translations
    const correct = result.translations.filter(t => t.verdict === 'correct');
    if (correct.length > 0) {
      console.log(`\n✅ CORRECT (${correct.length}):`);
      correct.forEach(t => {
        console.log(`   • "${t.english}" → "${t.proposed}"`);
        correctCount++;
      });
    }

    // Show translations needing fixes
    const needsFix = result.translations.filter(t => t.verdict === 'needs_fix');
    if (needsFix.length > 0) {
      console.log(`\n⚠️  NEEDS FIXES (${needsFix.length}):`);
      needsFix.forEach(t => {
        console.log(`   • "${t.english}"`);
        console.log(`     Current: "${t.proposed}"`);
        console.log(`     Suggested: "${t.suggestion}"`);
        console.log(`     Reason: ${t.reasoning}\n`);
        needsFixCount++;
      });
    }

    // Show alternatives
    const alternatives = result.translations.filter(t => t.verdict === 'alternative');
    if (alternatives.length > 0) {
      console.log(`\n💡 ALTERNATIVES (${alternatives.length}):`);
      alternatives.forEach(t => {
        console.log(`   • "${t.english}"`);
        console.log(`     Current: "${t.proposed}"`);
        console.log(`     Alternative: "${t.suggestion}"`);
        console.log(`     Reason: ${t.reasoning}\n`);
        alternativeCount++;
      });
    }

    console.log('='.repeat(80));
    console.log(
      `\n📊 Summary: ${correctCount} ✅ | ${needsFixCount} ⚠️  | ${alternativeCount} 💡`,
    );

    // Save corrected translations to file
    const corrected = {};
    result.translations.forEach(t => {
      corrected[t.english] = t.verdict === 'correct' ? t.proposed : t.suggestion || t.proposed;
    });

    fs.writeFileSync(
      path.join(__dirname, 'translations-verified.json'),
      JSON.stringify(corrected, null, 2),
    );
    console.log(
      '\n✅ Verified translations saved to: translations-verified.json\n',
    );
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyTranslations().catch(console.error);

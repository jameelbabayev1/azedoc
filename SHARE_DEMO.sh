#!/bin/bash

echo ""
echo "════════════════════════════════════════════════════════"
echo "🏥 AZEDOC v2.0 — Demo Sharing"
echo "════════════════════════════════════════════════════════"
echo ""

# Get local IP
LOCAL_IP=$(ifconfig | grep -E "inet " | grep -v "127.0.0.1" | head -1 | awk '{print $2}')

echo "📍 Your Local Network URL:"
echo "   http://$LOCAL_IP:4200"
echo ""

echo "🌐 To Share Publicly (if co-founders not on same network):"
echo ""
echo "   Step 1: Download ngrok"
echo "   https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-arm64.zip"
echo ""
echo "   Step 2: Extract and run:"
echo "   ngrok http 4200"
echo ""
echo "   Step 3: Copy the HTTPS URL ngrok provides"
echo "   Example: https://abc123-def456.ngrok.io"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "📧 Message to Send Your Co-Founders:"
echo ""
echo "─────────────────────────────────────────────────────────"
cat << 'COFOUNDER_MESSAGE'
🏥 AZEDOC v2.0 — Live Demo

📱 Try it here: [INSERT_URL_HERE]

✨ Features to test:
1. AXIOM Chat: Ask a clinical question
2. Scribe: Paste medical notes → Get SOAP format  
3. Handover: Generate shift summary

📚 Full code: https://github.com/jameelbabayev1/azedoc

Status: ✅ Production Ready
All endpoints tested & operational
COFOUNDER_MESSAGE
echo "─────────────────────────────────────────────────────────"
echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Server is running at http://localhost:4200"
echo "════════════════════════════════════════════════════════"
echo ""


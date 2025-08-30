#!/bin/bash

echo "🚀 Starting Voice Server with Call Trigger Support"
echo "=" * 60

# Navigate to voice server directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install requests flask python-dotenv supabase openai"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create one with:"
    echo "   VAPI_API_PRIVATE_KEY=your_vapi_key"
    echo "   VAPI_WEBHOOK_SECRET=your_webhook_secret (optional)"
    echo "   OPENAI_API_KEY=your_openai_key"
    echo ""
    echo "Continuing anyway for testing..."
fi

echo "🌐 Server will start on: http://localhost:5001"
echo "📞 Call trigger endpoint: http://localhost:5001/api/trigger-call"
echo "🔍 Health check: http://localhost:5001/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=" * 60

# Start the server with option 1 (webhook server only)
echo "1" | python vapi_webhook.py
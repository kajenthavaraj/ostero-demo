#!/usr/bin/env python3
"""Simple script to start the VAPI webhook server without interactive prompts"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from vapi_webhook import VapiWebHookServer

if __name__ == "__main__":
    print("🎯 VAPI Webhook Server - Starting directly")
    print("🌐 Server running on port 5001")
    print("=" * 50)
    
    try:
        server = VapiWebHookServer()
        server.run()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"\n❌ Error: {e}")
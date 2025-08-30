#!/usr/bin/env python3
"""
Test script for the call trigger API endpoint
"""

import requests
import json
import time

def test_call_trigger_api():
    """Test the /api/trigger-call endpoint"""
    
    url = "http://localhost:5001/api/trigger-call"
    
    # Test data - using the same format as the frontend will send (unformatted number)
    test_data = {
        "application_id": "test-app-123",
        "first_name": "John",
        "last_name": "Doe", 
        "phone": "4167009468",  # Testing with unformatted number like user would enter
        "email": "john.doe@example.com"
    }
    
    print("🧪 Testing Call Trigger API")
    print("=" * 50)
    print(f"🌐 URL: {url}")
    print(f"📊 Test Data: {json.dumps(test_data, indent=2)}")
    print()
    
    try:
        print("📡 Sending POST request...")
        response = requests.post(
            url, 
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"📋 Response Status: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
        try:
            result = response.json()
            print(f"📊 Response Data: {json.dumps(result, indent=2)}")
            
            if response.status_code == 200 and result.get('success'):
                print(f"\n✅ SUCCESS! Call triggered with ID: {result.get('call_id')}")
                return result.get('call_id')
            else:
                print(f"\n❌ FAILED: {result.get('message', 'Unknown error')}")
                return None
                
        except json.JSONDecodeError:
            print(f"📄 Raw Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR: Is the voice server running on port 5001?")
        print("💡 Start it with: python vapi_webhook.py")
        return None
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT: Request took too long")
        return None
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None

def test_server_health():
    """Test if the server is running"""
    try:
        response = requests.get("http://localhost:5001/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Server is running: {data}")
            return True
        else:
            print(f"❌ Server unhealthy: {response.status_code}")
            return False
    except:
        print("❌ Server not reachable")
        return False

if __name__ == "__main__":
    print("🚀 Call Trigger API Test Suite")
    print("=" * 50)
    
    # Test server health first
    print("\n1️⃣ Testing server health...")
    if test_server_health():
        print("\n2️⃣ Testing call trigger API...")
        call_id = test_call_trigger_api()
        
        if call_id:
            print(f"\n🎯 Test completed successfully!")
            print(f"📞 Monitor the call in your VAPI dashboard with ID: {call_id}")
        else:
            print(f"\n❌ Test failed")
    else:
        print("\n💡 Start the voice server first with:")
        print("   cd /application_form/form-app/voice_server/")
        print("   python vapi_webhook.py")
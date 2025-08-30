#!/usr/bin/env python3
"""
Test script to simulate a Vapi webhook for call completion.
This will test the webhook body printing functionality in the end_call function.
"""

import requests
import json
import time

def test_call_completion_webhook():
    """Test the webhook endpoint with a simulated call completion webhook"""
    base_url = "http://localhost:5001"
    
    print("🧪 Testing Call Completion Webhook")
    print("=" * 50)
    
    # Simulate a Vapi webhook for call completion
    webhook_data = {
        "type": "call.ended",
        "call": {
            "id": "test-call-completion-123",
            "status": "ended",
            "duration": 180,
            "startedAt": "2024-01-15T10:00:00Z",
            "endedAt": "2024-01-15T10:03:00Z"
        },
        "message": {
            "artifact": {
                "messages": [
                    {
                        "role": "bot",
                        "message": "Hello! How can I help you today?",
                        "timestamp": "2024-01-15T10:00:05Z"
                    },
                    {
                        "role": "customer",
                        "message": "I'm interested in a mortgage application",
                        "timestamp": "2024-01-15T10:00:15Z"
                    },
                    {
                        "role": "bot",
                        "message": "Great! Let me help you with that. What's your name?",
                        "timestamp": "2024-01-15T10:00:25Z"
                    },
                    {
                        "role": "customer",
                        "message": "My name is John Smith",
                        "timestamp": "2024-01-15T10:00:35Z"
                    }
                ]
            }
        },
        "metadata": {
            "assistantId": "14f907e7-b3b2-43aa-aa33-9f8c14212bd3",
            "phoneNumberId": "8c320a63-2ae0-4a5f-bbf4-9d33cede10e6",
            "customer": {
                "number": "+1234567890"
            }
        }
    }
    
    print("📋 Sending simulated call completion webhook:")
    print(f"   Call ID: {webhook_data['call']['id']}")
    print(f"   Status: {webhook_data['call']['status']}")
    print(f"   Duration: {webhook_data['call']['duration']} seconds")
    print(f"   Messages: {len(webhook_data['message']['artifact']['messages'])}")
    
    try:
        print(f"\n📡 Sending webhook to {base_url}/vapi/webhook...")
        response = requests.post(f"{base_url}/vapi/webhook", json=webhook_data)
        
        if response.status_code == 200:
            print(f"✅ Webhook sent successfully!")
            print(f"📊 Response: {response.json()}")
            
            print(f"\n🎯 Check the server console to see:")
            print(f"   1. Call completion detection")
            print(f"   2. end_call function execution")
            print(f"   3. Complete webhook body printed")
            
        else:
            print(f"❌ Webhook failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Server not running. Start the server first with: python vapi_server.py")
        return False
    except Exception as e:
        print(f"❌ Error sending webhook: {e}")
        return False
    
    return True

def test_manual_end_call():
    """Test the manual end_call endpoint to see the difference"""
    base_url = "http://localhost:5001"
    
    print("\n🧪 Testing Manual End Call (No Webhook Data)")
    print("=" * 50)
    
    test_call_id = "manual-test-call-456"
    
    try:
        print(f"📡 Testing /end-call/{test_call_id} endpoint...")
        response = requests.post(f"{base_url}/end-call/{test_call_id}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Manual end call endpoint working: {data}")
            print(f"📋 Check server console - should show 'No webhook data provided'")
        else:
            print(f"❌ Manual end call endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Manual end call endpoint error: {e}")

if __name__ == "__main__":
    print("🚀 Vapi Webhook Body Printing Test")
    print("=" * 50)
    print("💡 This test simulates a Vapi webhook for call completion")
    print("💡 The server should automatically call end_call and print the webhook body")
    print("=" * 50)
    
    # Test call completion webhook (should trigger end_call with webhook data)
    if test_call_completion_webhook():
        print(f"\n⏳ Waiting 3 seconds for processing...")
        time.sleep(3)
        
        # Test manual end call (should show no webhook data)
        test_manual_end_call()
    
    print(f"\n🎯 Test completed!")
    print(f"💡 Check your server console to see the webhook body printing in action")
    print(f"📋 The end_call function should now print the complete webhook data")

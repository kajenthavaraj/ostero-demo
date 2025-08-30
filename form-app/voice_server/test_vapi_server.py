#!/usr/bin/env python3
"""
Test script for the Vapi server.
This script tests basic functionality without making actual Vapi calls.
"""

import requests
import json
import time

def test_server_endpoints():
    """Test the basic server endpoints"""
    base_url = "http://localhost:5001"
    
    print("🧪 Testing Vapi Server Endpoints")
    print("=" * 50)
    
    # Test health endpoint
    try:
        print("📡 Testing /health endpoint...")
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Server not running. Start the server first with: python vapi_server.py")
        return False
    
    # Test stats endpoint
    try:
        print("\n📡 Testing /stats endpoint...")
        response = requests.get(f"{base_url}/stats")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Stats endpoint working: {data}")
        else:
            print(f"❌ Stats endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Stats endpoint error: {e}")
    
    # Test transcripts endpoint
    try:
        print("\n📡 Testing /transcripts endpoint...")
        response = requests.get(f"{base_url}/transcripts")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Transcripts endpoint working: {data}")
        else:
            print(f"❌ Transcripts endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Transcripts endpoint error: {e}")
    
    # Test test-webhook endpoint
    try:
        print("\n📡 Testing /test-webhook endpoint...")
        test_data = {
            "test": "data",
            "timestamp": time.time(),
            "message": "This is a test webhook"
        }
        response = requests.post(f"{base_url}/test-webhook", json=test_data)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Test webhook endpoint working: {data}")
        else:
            print(f"❌ Test webhook endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Test webhook endpoint error: {e}")
    
    print("\n✅ All endpoint tests completed!")
    return True

def test_manual_end_call():
    """Test the manual end_call endpoint"""
    base_url = "http://localhost:5001"
    
    print("\n🧪 Testing Manual End Call Endpoint")
    print("=" * 50)
    
    # Test with a dummy call ID
    test_call_id = "test-call-123"
    
    try:
        print(f"📡 Testing /end-call/{test_call_id} endpoint...")
        response = requests.post(f"{base_url}/end-call/{test_call_id}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Manual end call endpoint working: {data}")
        else:
            print(f"❌ Manual end call endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Manual end call endpoint error: {e}")

if __name__ == "__main__":
    print("🚀 Vapi Server Test Suite")
    print("=" * 50)
    print("💡 Make sure the server is running first:")
    print("   python vapi_server.py")
    print("=" * 50)
    
    # Test basic endpoints
    if test_server_endpoints():
        # Test manual end call
        test_manual_end_call()
    
    print("\n🎯 Test suite completed!")
    print("💡 The server is ready to receive Vapi webhooks")
    print("🌐 Configure this URL in your Vapi dashboard:")
    print("   http://localhost:5001/vapi/webhook")

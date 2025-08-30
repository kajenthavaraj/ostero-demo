#!/usr/bin/env python3
"""
Simple VAPI Webhook Debug Server

This is a minimal webhook server that receives VAPI webhook events
and prints them to the terminal for debugging purposes.
"""

import os
import json
import time
import requests
from datetime import datetime
from flask import Flask, request, jsonify
import hmac
import hashlib
from db import DatabaseManager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Global transcript cache indexed by call ID
transcript_cache = {}  # {call_id: [{"role": "bot/user", "message": "...", "timestamp": "...", "secondsFromStart": 0}, ...]}

db_manager = DatabaseManager()


def add_to_transcript_cache(call_id: str, messages: list):
    """Add transcript messages to the global cache for a specific call ID"""
    print(f"    🔧 add_to_transcript_cache called with:")
    print(f"      Call ID: {call_id}")
    print(f"      Messages to add: {len(messages)}")
    
    if call_id not in transcript_cache:
        transcript_cache[call_id] = []
        print(f"      Created new cache array for call {call_id}")

        # Find the application id from the call id
        application_id = db_manager.find_application_id_by_call_id(call_id)
        
    else:
        print(f"      Using existing cache array for call {call_id}")
    
    added_count = 0
    for msg in messages:
        role = msg.get('role', 'unknown')
        if role in ['bot', 'user', 'assistant', 'customer']:
            # Create cache entry in the specified format
            cache_entry = {
                "role": role,
                "message": msg.get('message', msg.get('content', ''))
            }
            
            # Check if this message already exists to avoid duplicates
            existing_messages = [entry["message"] for entry in transcript_cache[call_id]]
            if cache_entry["message"] not in existing_messages:
                transcript_cache[call_id].append(cache_entry)
                added_count += 1
                print(f"      Added message: role='{role}', message='{cache_entry['message'][:50]}...'")
            else:
                print(f"      Skipped duplicate message: '{cache_entry['message'][:50]}...'")
        else:
            print(f"      Skipped message with role '{role}' (not in allowed roles)")
    
    print(f"      Total messages added: {added_count}")
    print(f"      Final cache size for {call_id}: {len(transcript_cache[call_id])}")

def get_transcript_cache(call_id: str) -> list:
    """Get the transcript cache for a specific call ID"""
    return transcript_cache.get(call_id, [])

def display_transcript_cache(call_id: str):
    """Display the current transcript cache for a call ID"""
    messages = get_transcript_cache(call_id)
    if not messages:
        print(f"📭 No transcript cached yet for call {call_id}")
        return
    
    print(f"\n🎯 TRANSCRIPT CACHE - Call {call_id}")
    print(f"📊 Total Messages: {len(messages)}")
    print("=" * 80)
    
    for i, msg in enumerate(messages, 1):
        role = msg["role"]
        message_text = msg["message"]
        
        # Format role for display
        if role == 'bot':
            display_role = "🤖 Jamie (AI)"
        elif role == 'user':
            display_role = "👤 Customer"
        elif role == 'assistant':
            display_role = "🤖 Assistant"
        elif role == 'customer':
            display_role = "👤 Customer"
        else:
            display_role = f"❓ {role.title()}"
        
        print(f"{i:2d}. {display_role}:")
        print(f"    {message_text}")
        print()
    
    print("=" * 80)

def clear_transcript_cache(call_id: str):
    """Clear transcript cache for a specific call ID"""
    if call_id in transcript_cache:
        del transcript_cache[call_id]
        print(f"🗑️  Cleared transcript cache for call {call_id}")

def list_cached_calls():
    """List all call IDs that have cached transcripts"""
    if not transcript_cache:
        print("📭 No calls have cached transcripts")
        return
    
    print(f"\n📋 CACHED CALLS ({len(transcript_cache)}):")
    for call_id, messages in transcript_cache.items():
        print(f"   📞 {call_id}: {len(messages)} messages")
    print()

def display_complete_cache():
    """Display the complete cache structure with all call IDs and their transcript arrays"""
    if not transcript_cache:
        print("📭 No calls have cached transcripts")
        return
    
    print(f"\n🗂️  COMPLETE CACHE STRUCTURE:")
    print("=" * 100)
    
    for call_id, messages in transcript_cache.items():
        print(f"📞 CALL ID: {call_id}")
        print(f"📊 Messages: {len(messages)}")
        print("-" * 80)
        
        if messages:
            for i, msg in enumerate(messages, 1):
                role = msg["role"]
                message_text = msg["message"]
                print(f"  {i:2d}. Role: {role}")
                print(f"      Message: {message_text}")
                print()
        else:
            print("  No messages")
        
        print("=" * 80)

def print_raw_cache_data():
    """Print the exact raw cache data structure"""
    if not transcript_cache:
        print("📭 No calls have cached transcripts")
        return
    
    print(f"\n🔍 RAW CACHE DATA STRUCTURE:")
    print("=" * 100)
    
    for call_id, messages in transcript_cache.items():
        print(f"📞 CALL ID: {call_id}")
        print(f"📊 Messages: {len(messages)}")
        print("-" * 80)
        
        if messages:
            for i, msg in enumerate(messages, 1):
                print(f"  {i:2d}. Raw message object:")
                print(f"      {json.dumps(msg, indent=6)}")
                print()
        else:
            print("  No messages")
        
        print("=" * 80)

class VapiWebHookServer:
    """Simple webhook server to debug VAPI webhook events"""
    
    def __init__(self, port=5001):
        self.app = Flask(__name__)
        self.port = 5001  # Always use port 5001
        self.webhook_count = 0
        self.setup_routes()
        
        # Suppress Flask logging except errors
        import logging
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)
    
    def setup_routes(self):
        """Setup webhook routes"""
        
        @self.app.route('/vapi/webhook', methods=['POST'])
        def handle_webhook():
            try:
                self.webhook_count += 1
                current_time = datetime.now().strftime('%H:%M:%S.%f')[:-3]
                
                # Get raw body for signature verification
                raw_body = request.get_data()
                
                # DEBUG: Print webhook headers and basic info
                print(f"\n🔥 WEBHOOK #{self.webhook_count} RECEIVED [{current_time}]")
                print(f"📦 Body size: {len(raw_body)} bytes")
                print(f"\n📋 HEADERS:")
                for header, value in request.headers.items():
                    print(f"   {header}: {value}")
                
                # Verify signature if webhook secret is configured
                signature = request.headers.get('x-vapi-signature', '')
                if signature:
                    if not self.verify_signature(raw_body, signature):
                        print(f"\n🔐 ❌ Signature verification failed!")
                        return jsonify({'error': 'Invalid signature'}), 401
                    else:
                        print(f"\n🔐 ✅ Signature verified successfully")
                else:
                    print(f"\n🔐 ⚠️  No signature present (VAPI_WEBHOOK_SECRET not configured)")
                
                # Parse webhook data
                webhook_data = request.get_json()
                if not webhook_data:
                    return jsonify({'error': 'No JSON data'}), 400
                
                print(f"\n📋 WEBHOOK DATA STRUCTURE:")
                print(f"   Type: {type(webhook_data)}")
                print(f"   Top-level keys: {list(webhook_data.keys())}")
                print(f"   Data preview: {str(webhook_data)[:200]}...")
                

                
                # Extract call ID - prioritize the root 'call.id' field
                print(f"\n🔍 CALL ID EXTRACTION DEBUG:")
                print(f"   Root webhook keys: {list(webhook_data.keys())}")
                
                if 'call' in webhook_data:
                    call_data = webhook_data['call']
                    print(f"   Call object keys: {list(call_data.keys())}")
                    if 'id' in call_data:
                        print(f"   Call ID found in root: {call_data['id']}")
                    else:
                        print(f"   No 'id' field in call object")
                else:
                    print(f"   No 'call' field in root webhook")
                
                call_id = webhook_data.get('call', {}).get('id', 'unknown')
                call_id_source = "root 'call.id'"
                
                # If not found in root, check in message.artifact.call.id as fallback
                if not call_id or call_id == 'unknown':
                    print(f"   Checking message.artifact.call.id fallback...")
                    if 'message' in webhook_data and 'artifact' in webhook_data['message']:
                        artifact = webhook_data['message']['artifact']
                        print(f"   Artifact keys: {list(artifact.keys())}")
                        if 'call' in artifact:
                            call_id = artifact['call'].get('id', 'unknown')
                            call_id_source = "message.artifact.call.id"
                            print(f"   Call ID found in artifact: {call_id}")
                        else:
                            print(f"   No 'call' field in artifact")
                    else:
                        print(f"   No 'message' or 'artifact' fields found")
                
                print(f"🔍 FINAL EXTRACTED CALL ID: {call_id} (from {call_id_source})")
                
                # Additional call ID search in other possible locations
                if not call_id or call_id == 'unknown':
                    print(f"   🔍 SEARCHING FOR CALL ID IN OTHER LOCATIONS...")
                    
                    # Check for call ID in headers
                    call_id_header = request.headers.get('X-Call-Id', '')
                    if call_id_header:
                        print(f"   Found call ID in X-Call-Id header: {call_id_header}")
                        call_id = call_id_header
                        call_id_source = "X-Call-Id header"
                    
                    # Check for call ID in cookie
                    cookie_call_id = request.cookies.get('callId', '')
                    if cookie_call_id:
                        print(f"   Found call ID in cookie: {cookie_call_id}")
                        if not call_id or call_id == 'unknown':
                            call_id = cookie_call_id
                            call_id_source = "cookie"
                    
                    # Check for call ID in message object
                    if 'message' in webhook_data:
                        message_obj = webhook_data['message']
                        print(f"   Message object keys: {list(message_obj.keys())}")
                        
                        # Check if call ID is directly in message
                        if 'callId' in message_obj:
                            print(f"   Found call ID in message.callId: {message_obj['callId']}")
                            if not call_id or call_id == 'unknown':
                                call_id = message_obj['callId']
                                call_id_source = "message.callId"
                
                print(f"🔍 ULTIMATE CALL ID: {call_id} (from {call_id_source})")
                
                # Process transcript messages if available
                print(f"\n🔍 PARSING WEBHOOK DATA...")
                print(f"   Call ID: {call_id}")
                print(f"   Has 'message': {'message' in webhook_data}")
                print(f"   Has 'artifact': {'artifact' in webhook_data.get('message', {})}")
                
                if 'message' in webhook_data and 'artifact' in webhook_data['message']:
                    artifact = webhook_data['message']['artifact']
                    print(f"   Has 'messages' in artifact: {'messages' in artifact}")
                    
                    if 'messages' in artifact:
                        messages = artifact['messages']
                        print(f"   Total messages in artifact: {len(messages)}")
                        
                        # Filter out system messages and show only conversation
                        conversation_messages = []
                        for msg in messages:
                            role = msg.get('role', 'unknown')
                            print(f"      Message role: {role}")
                            if role in ['bot', 'user', 'assistant', 'customer']:
                                conversation_messages.append(msg)
                        
                        print(f"   Conversation messages found: {len(conversation_messages)}")
                        
                        # Add to transcript cache if we have valid messages and call ID
                        if conversation_messages and call_id and call_id != 'unknown':
                            print(f"\n🔧 DEBUGGING CACHE OPERATION:")
                            print(f"   Call ID: {call_id}")
                            print(f"   Conversation messages: {len(conversation_messages)}")
                            
                            # Show what we're about to add
                            for i, msg in enumerate(conversation_messages):
                                role = msg.get('role', 'unknown')
                                message = msg.get('message', msg.get('content', ''))
                                print(f"   Message {i+1}: role='{role}', message='{message[:50]}...'")
                            
                            # Get previous cache state
                            previous_count = len(get_transcript_cache(call_id))
                            print(f"   Previous cache size: {previous_count}")
                            
                            # Add new messages to cache
                            print(f"   Calling add_to_transcript_cache...")
                            add_to_transcript_cache(call_id, conversation_messages)
                            
                            # Get updated cache state
                            current_count = len(get_transcript_cache(call_id))
                            new_messages = current_count - previous_count
                            print(f"   After cache update: {current_count} messages")
                            print(f"   New messages added: {new_messages}")
                            
                            print(f"\n🆕 WEBHOOK #{self.webhook_count} PROCESSED - Call {call_id}")
                            print(f"📊 Messages in webhook: {len(conversation_messages)}")
                            print(f"📊 New messages added: {new_messages}")
                            print(f"📊 Total in cache: {current_count}")
                            print("=" * 80)
                            
                            # ALWAYS display the current cache after updating
                            display_transcript_cache(call_id)
                            
                            # Display the complete cache structure
                            display_complete_cache()
                            
                            # Print the exact raw cache data
                            print_raw_cache_data()
                        else:
                            print(f"\n⚠️  Webhook #{self.webhook_count} - No valid conversation messages found")
                            print(f"   Call ID: {call_id}")
                            print(f"   Conversation messages: {len(conversation_messages) if 'conversation_messages' in locals() else 'Not defined'}")
                            if call_id and call_id != 'unknown':
                                print(f"📊 Current cache size: {len(get_transcript_cache(call_id))}")
                else:
                    print(f"\n⚠️  Webhook #{self.webhook_count} - No transcript data found")
                    print(f"   Has 'message': {'message' in webhook_data}")
                    print(f"   Has 'artifact': {'artifact' in webhook_data.get('message', {})}")
                    if call_id and call_id != 'unknown':
                        print(f"📊 Current cache size: {len(get_transcript_cache(call_id))}")
                
                # Show final cache status
                print(f"\n📊 FINAL CACHE STATUS:")
                if call_id and call_id != 'unknown':
                    cache_size = len(get_transcript_cache(call_id))
                    print(f"   Call {call_id}: {cache_size} messages cached")
                else:
                    print(f"   No valid call ID found")
                
                return jsonify({'status': 'success', 'webhook_number': self.webhook_count}), 200
                
            except Exception as e:
                print(f"\n❌ Webhook error: {e}")
                import traceback
                traceback.print_exc()
                return jsonify({'error': str(e)}), 500
        
        @self.app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({
                'status': 'healthy', 
                'webhooks_received': self.webhook_count,
                'timestamp': datetime.now().isoformat()
            }), 200
        
        @self.app.route('/test-webhook', methods=['POST'])
        def test_webhook():
            print("\n🧪 TEST WEBHOOK ENDPOINT HIT!")
            print(f"📋 Headers: {dict(request.headers)}")
            print("📄 COMPLETE TEST BODY:")
            print("=" * 50)
            try:
                test_data = request.get_json()
                if test_data:
                    print(json.dumps(test_data, indent=2))
                else:
                    print("Raw body:", request.get_data().decode())
            except Exception as e:
                print("Raw body:", request.get_data().decode())
                print(f"Parse error: {e}")
            print("=" * 50)
            return jsonify({'status': 'test success'}), 200
        
        @self.app.route('/stats', methods=['GET'])
        def stats():
            return jsonify({
                'webhooks_received': self.webhook_count,
                'server_uptime': time.time() - self.start_time,
                'last_webhook': getattr(self, 'last_webhook_time', 'Never'),
                'status': 'running'
            }), 200
        
        @self.app.route('/transcript/<call_id>', methods=['GET'])
        def get_transcript(call_id):
            """Get cached transcript for a specific call ID"""
            messages = get_transcript_cache(call_id)
            if not messages:
                return jsonify({'error': f'No transcript found for call {call_id}'}), 404
            
            return jsonify({
                'call_id': call_id,
                'message_count': len(messages),
                'transcript': messages
            }), 200
        
        @self.app.route('/transcripts', methods=['GET'])
        def list_transcripts():
            """List all cached transcripts"""
            if not transcript_cache:
                return jsonify({'message': 'No transcripts cached', 'calls': []}), 200
            
            calls = []
            for call_id, messages in transcript_cache.items():
                calls.append({
                    'call_id': call_id,
                    'message_count': len(messages),
                    'last_message_time': max([msg['secondsFromStart'] for msg in messages]) if messages else 0
                })
            
            return jsonify({
                'total_calls': len(calls),
                'calls': calls
            }), 200
        
        @self.app.route('/transcript/<call_id>/clear', methods=['DELETE'])
        def clear_transcript(call_id):
            """Clear transcript cache for a specific call ID"""
            if call_id in transcript_cache:
                clear_transcript_cache(call_id)
                return jsonify({'message': f'Transcript cache cleared for call {call_id}'}), 200
            else:
                return jsonify({'error': f'No transcript found for call {call_id}'}), 404
    
    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify VAPI webhook signature"""
        webhook_secret = os.getenv('VAPI_WEBHOOK_SECRET')
        if not webhook_secret:
            return False
        
        try:
            expected_signature = hmac.new(
                webhook_secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            # Remove 'sha256=' prefix if present
            signature = signature.replace('sha256=', '')
            
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            print(f"Signature verification error: {e}")
            return False
    
    def run(self):
        """Run the webhook server"""
        self.start_time = time.time()
        print(f"🚀 Starting Simple VAPI Webhook Server on port {self.port}")
        print(f"📡 Webhook URL: http://localhost:{self.port}/vapi/webhook")
        print(f"🧪 Test URL: http://localhost:{self.port}/test-webhook")
        print(f"📊 Stats URL: http://localhost:{self.port}/stats")
        print(f"❤️  Health URL: http://localhost:{self.port}/health")
        print(f"📝 Transcripts: http://localhost:{self.port}/transcripts")
        print(f"📄 Get Transcript: http://localhost:{self.port}/transcript/<call_id>")
        print(f"🗑️  Clear Transcript: http://localhost:{self.port}/transcript/<call_id>/clear")
        print("=" * 80)
        print("💡 Configure this URL in your VAPI dashboard:")
        print(f"   Local: http://localhost:{self.port}/vapi/webhook")
        print("   External: http://your-ngrok-url.ngrok.io/vapi/webhook")
        print("=" * 80)
        print("🔄 Waiting for webhook events...")
        print("Press Ctrl+C to stop\n")
        
        try:
            self.app.run(host='0.0.0.0', port=self.port, debug=False, use_reloader=False)
        except KeyboardInterrupt:
            print(f"\n👋 Server stopped. Total webhooks received: {self.webhook_count}")
        except Exception as e:
            print(f"\n❌ Server error: {e}")

def make_test_call():
    """Make a test VAPI call using the same parameters as test.py"""
    print("\n🚀 MAKING TEST VAPI CALL...")
    print("=" * 70)
    
    # Test call parameters (same as test.py)
    customer_phone = "+16477667841"
    assistant_id = "14f907e7-b3b2-43aa-aa33-9f8c14212bd3"
    phone_number_id = "8c320a63-2ae0-4a5f-bbf4-9d33cede10e6"
    
    print(f"📞 Customer Phone: {customer_phone}")
    print(f"🤖 Assistant ID: {assistant_id}")
    print(f"📱 Phone Number ID: {phone_number_id}")
    print()
    
    # Get API key from environment
    api_key = os.getenv('VAPI_API_PRIVATE_KEY')
    if not api_key:
        print("❌ VAPI_API_PRIVATE_KEY environment variable is required")
        print("💡 Set this in your .env file")
        return None
    
    # Make the call
    url = "https://api.vapi.ai/call/phone"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "assistantId": assistant_id,
        "phoneNumberId": phone_number_id,
        "customer": {
            "number": customer_phone
        }
    }
    
    try:
        print("📡 Sending call request to VAPI...")
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        call_data = response.json()
        call_id = call_data.get('id')
        
        if call_id:
            print(f"✅ Call initiated successfully!")
            print(f"📋 Call ID: {call_id}")
            print(f"📊 Status: {call_data.get('status', 'unknown')}")
            print()
            print("🎯 Now watch this terminal for webhook events!")
            print("💡 The webhook server will display all data VAPI sends")
            return call_id
        else:
            print("❌ No call ID in response")
            print(f"Response: {json.dumps(call_data, indent=2)}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Call request failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def main():
    """Main function to run the webhook server"""
    print("🎯 VAPI Webhook Debug Server")
    print("📝 This server will print ALL webhook data received from VAPI")
    print("=" * 70)
    
    # Check if VAPI webhook secret is configured
    webhook_secret = os.getenv('VAPI_WEBHOOK_SECRET')
    if webhook_secret:
        print("✅ VAPI_WEBHOOK_SECRET configured - signature verification enabled")
    else:
        print("⚠️  VAPI_WEBHOOK_SECRET not configured - signature verification disabled")
        print("   Set VAPI_WEBHOOK_SECRET in your .env file for security")
    
    print("🌐 Server will run on port 5001")
    print("=" * 70)
    
    # Ask user if they want to make a test call
    print("\n🧪 TEST CALL OPTIONS:")
    print("1. Start webhook server only (wait for existing calls)")
    print("2. Make a test call + start webhook server")
    print()
    
    try:
        choice = input("Enter your choice (1 or 2): ").strip()
        
        if choice == "2":
            print("\n🎬 Making test call first...")
            call_id = make_test_call()
            if call_id:
                print(f"\n⏳ Waiting 5 seconds for call to start...")
                time.sleep(5)
                print("🚀 Starting webhook server to monitor the call...")
            else:
                print("❌ Test call failed, starting webhook server anyway...")
        else:
            print("🚀 Starting webhook server only...")
        
        # Start the server
        server = VapiWebHookServer()
        server.run()
        
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    main()

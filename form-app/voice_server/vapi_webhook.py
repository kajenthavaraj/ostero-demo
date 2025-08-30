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
import test_calls
import fill_application
from call_logger import handle_vapi_webhook


# Load environment variables
load_dotenv()

# Global transcript cache indexed by call ID
transcript_cache = {}  # {call_id: [{"role": "bot/user", "message": "...", "timestamp": "...", "secondsFromStart": 0}, ...]}

# Global call status tracker - tracks which calls are active vs completed
call_status_cache = {}  # {call_id: {"status": "active/completed", "ended_at": "timestamp"}}

db_manager = DatabaseManager()


def add_to_transcript_cache(call_id: str, messages: list):
    """Add transcript messages to the global cache for a specific call ID with intelligent deduplication"""
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
    updated_count = 0
    
    for msg in messages:
        role = msg.get('role', 'unknown')
        if role in ['bot', 'user', 'assistant', 'customer']:
            # Normalize role names
            normalized_role = 'bot' if role in ['bot', 'assistant'] else 'user'
            message_text = msg.get('message', msg.get('content', ''))
            
            # Create cache entry in the specified format
            cache_entry = {
                "role": normalized_role,
                "message": message_text
            }
            
            # Smart deduplication: handle progressive speech updates
            existing_cache = transcript_cache[call_id]
            found_similar = False
            
            # Look for existing messages from the same role that might be partial versions
            for i, existing_entry in enumerate(existing_cache):
                if existing_entry["role"] == normalized_role:
                    existing_msg = existing_entry["message"]
                    
                    # Check if the new message is an extension of an existing message
                    if message_text.startswith(existing_msg) and len(message_text) > len(existing_msg):
                        # Update the existing message with the longer version
                        existing_cache[i]["message"] = message_text
                        updated_count += 1
                        found_similar = True
                        print(f"      Updated message: role='{normalized_role}', message='{message_text[:50]}...'")
                        break
                    # Check if the existing message is an extension of the new message (ignore shorter version)
                    elif existing_msg.startswith(message_text) and len(existing_msg) > len(message_text):
                        # Keep the longer existing message, ignore the shorter new one
                        found_similar = True
                        print(f"      Kept longer existing message: '{existing_msg[:50]}...'")
                        break
                    # Check for exact match
                    elif existing_msg == message_text:
                        found_similar = True
                        print(f"      Skipped duplicate message: '{message_text[:50]}...'")
                        break
            
            # If no similar message found, add as new
            if not found_similar:
                transcript_cache[call_id].append(cache_entry)
                added_count += 1
                print(f"      Added new message: role='{normalized_role}', message='{message_text[:50]}...'")
                
        else:
            print(f"      Skipped message with role '{role}' (not in allowed roles)")
    
    print(f"      Total new messages added: {added_count}")
    print(f"      Total messages updated: {updated_count}")
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
        
        # Add CORS support for frontend calls
        @self.app.after_request
        def after_request(response):
            # Allow requests from localhost during development
            origin = request.headers.get('Origin')
            if origin and ('localhost' in origin or '127.0.0.1' in origin):
                response.headers['Access-Control-Allow-Origin'] = origin
            else:
                # For production, you might want to be more specific
                response.headers['Access-Control-Allow-Origin'] = '*'
            
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, DELETE'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-vapi-signature'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response
        
        self.setup_routes()
        
        # Suppress Flask logging except errors
        import logging
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)
    
    def setup_routes(self):
        """Setup webhook routes"""
        
        @self.app.route('/vapi/webhook', methods=['GET', 'POST'])
        def handle_webhook():
            try:
                # Handle GET requests (VAPI health check or misconfiguration)
                if request.method == 'GET':
                    print(f"\n🔍 GET REQUEST RECEIVED at /vapi/webhook")
                    print(f"📋 Headers: {dict(request.headers)}")
                    print(f"📋 Query params: {dict(request.args)}")
                    return jsonify({
                        'status': 'webhook endpoint ready',
                        'message': 'This endpoint expects POST requests for VAPI webhooks',
                        'method_received': 'GET',
                        'expected_method': 'POST'
                    }), 200
                
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
                
                # Check if this is a call end event - VAPI sends "end-of-call-report" in message.type
                message_data = webhook_data.get('message', {})
                webhook_type = message_data.get('type', '')
                print(f"   Message Type: {webhook_type}")
                
                # Print the entire webhook body from VAPI
                print(f"\n📋 COMPLETE WEBHOOK BODY FROM VAPI:")
                print("=" * 80)
                print(json.dumps(webhook_data, indent=2))
                print("=" * 80)
                
                # ✅ INTEGRATE CALL LOGGING - Handle all webhook types (call-start, transcript, end-of-call-report)
                print(f"\n🗃️ INTEGRATING CALL LOGGING - Processing {webhook_type}")
                try:
                    logging_result = handle_vapi_webhook(webhook_data)
                    if logging_result.get('success'):
                        print(f"✅ Call logging completed successfully: {logging_result.get('message')}")
                    else:
                        print(f"⚠️ Call logging issue: {logging_result.get('error')}")
                except Exception as e:
                    print(f"❌ Error in call logging: {e}")
                    import traceback
                    traceback.print_exc()
                
                if webhook_type == 'end-of-call-report':
                    print(f"\n🎯 CALL END DETECTED - Calling fill_application.handle_end_call() function")
                    try:
                        # Call the handle_end_call function from fill_application with the end call body
                        fill_application.handle_end_call(webhook_data)
                        print(f"✅ fill_application.handle_end_call() completed successfully")
                    except Exception as e:
                        print(f"❌ Error calling fill_application.handle_end_call(): {e}")
                        import traceback
                        traceback.print_exc()
                

                
                # Extract call ID from the correct location in VAPI webhook structure
                print(f"\n🔍 CALL ID EXTRACTION DEBUG:")
                print(f"   Root webhook keys: {list(webhook_data.keys())}")
                
                # First try to get call ID from message.call.id (the correct location)
                call_id = message_data.get('call', {}).get('id', 'unknown')
                call_id_source = "message.call.id"
                
                if call_id != 'unknown':
                    print(f"   Call ID found in message.call.id: {call_id}")
                else:
                    print(f"   No call ID found in message.call.id")
                    # Fallback to root level
                    if 'call' in webhook_data:
                        call_data = webhook_data['call']
                        print(f"   Call object keys: {list(call_data.keys())}")
                        if 'id' in call_data:
                            call_id = call_data['id']
                            call_id_source = "root 'call.id'"
                            print(f"   Call ID found in root: {call_id}")
                        else:
                            print(f"   No 'id' field in call object")
                    else:
                        print(f"   No 'call' field in root webhook")
                
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
                
                # ✅ UPDATE CALL STATUS TRACKING
                if call_id and call_id != 'unknown':
                    if webhook_type == 'end-of-call-report':
                        # Mark call as completed
                        call_status_cache[call_id] = {
                            "status": "completed",
                            "ended_at": datetime.now().isoformat()
                        }
                        print(f"📋 CALL STATUS: {call_id} marked as COMPLETED")
                    elif call_id not in call_status_cache:
                        # Mark call as active (for first time we see it)
                        call_status_cache[call_id] = {
                            "status": "active", 
                            "started_at": datetime.now().isoformat()
                        }
                        print(f"📋 CALL STATUS: {call_id} marked as ACTIVE")
                
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
            """List all cached transcripts - ONLY ACTIVE CALLS"""
            if not transcript_cache:
                return jsonify({'message': 'No transcripts cached', 'calls': []}), 200
            
            active_calls = []
            for call_id, messages in transcript_cache.items():
                # Check if call is still active (not completed)
                call_status = call_status_cache.get(call_id, {}).get('status', 'active')
                
                # Only include active calls in live transcript view
                if call_status == 'active':
                    active_calls.append({
                        'call_id': call_id,
                        'message_count': len(messages),
                        'last_message_time': max([msg.get('secondsFromStart', 0) for msg in messages]) if messages else 0,
                        'status': call_status
                    })
            
            if not active_calls:
                return jsonify({'message': 'No active calls', 'calls': []}), 200
            
            return jsonify({
                'total_calls': len(active_calls),
                'calls': active_calls
            }), 200
        
        @self.app.route('/completed-calls', methods=['GET'])
        def list_completed_calls():
            """List all completed calls from transcript cache"""
            if not transcript_cache:
                return jsonify({'message': 'No completed calls cached', 'calls': []}), 200
            
            completed_calls = []
            for call_id, messages in transcript_cache.items():
                # Check if call is completed
                call_info = call_status_cache.get(call_id, {})
                call_status = call_info.get('status', 'active')
                
                # Only include completed calls
                if call_status == 'completed':
                    completed_calls.append({
                        'call_id': call_id,
                        'message_count': len(messages),
                        'ended_at': call_info.get('ended_at'),
                        'status': call_status
                    })
            
            # Sort by ended_at (most recent first)
            completed_calls.sort(key=lambda x: x.get('ended_at', ''), reverse=True)
            
            return jsonify({
                'total_calls': len(completed_calls),
                'calls': completed_calls
            }), 200
        
        @self.app.route('/transcript/<call_id>/clear', methods=['DELETE'])
        def clear_transcript(call_id):
            """Clear transcript cache for a specific call ID"""
            if call_id in transcript_cache:
                clear_transcript_cache(call_id)
                return jsonify({'message': f'Transcript cache cleared for call {call_id}'}), 200
            else:
                return jsonify({'error': f'No transcript found for call {call_id}'}), 404
        
        @self.app.route('/api/trigger-call', methods=['POST', 'OPTIONS'])
        def trigger_application_call():
            """Trigger a call for a new application"""
            # Handle CORS preflight request
            if request.method == 'OPTIONS':
                return '', 200
            
            try:
                data = request.json
                if not data:
                    return jsonify({
                        'success': False,
                        'message': 'No data provided'
                    }), 400
                
                # Extract required parameters
                application_id = data.get('application_id')
                first_name = data.get('first_name', '')
                last_name = data.get('last_name', '')
                phone = data.get('phone', '')
                email = data.get('email', '')
                
                # Validate required fields
                if not all([application_id, first_name, last_name, phone]):
                    return jsonify({
                        'success': False,
                        'message': 'Missing required fields: application_id, first_name, last_name, phone'
                    }), 400
                
                print(f"\n📞 CALL TRIGGER REQUEST")
                print(f"Application ID: {application_id}")
                print(f"Customer: {first_name} {last_name}")
                print(f"Phone: {phone}")
                print(f"Email: {email}")
                
                # Default values for voice call
                mortgage_agent_name = "Sarah Johnson"  # Could be made dynamic later
                brokerage_name = "Premier Mortgage Group"
                interest = "Mortgage application follow-up"
                
                # Import and call the voice function
                from voice import make_call
                
                print(f"🎯 Initiating call via VAPI...")
                call_id = make_call(
                    application_id=application_id,
                    mortgage_agent_name=mortgage_agent_name,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    phone_number=phone,
                    interest=interest,
                    brokerage_name=brokerage_name
                )
                
                if call_id:
                    print(f"✅ Call triggered successfully! Call ID: {call_id}")
                    return jsonify({
                        'success': True,
                        'call_id': call_id,
                        'message': 'Call initiated successfully'
                    })
                else:
                    print(f"❌ Failed to initiate call")
                    return jsonify({
                        'success': False,
                        'message': 'Failed to initiate call'
                    }), 500
                    
            except Exception as e:
                print(f"❌ Error triggering call: {e}")
                import traceback
                traceback.print_exc()
                return jsonify({
                    'success': False,
                    'message': f'Internal server error: {str(e)}'
                }), 500
    
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
            call_id = test_calls.test_make_call()
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
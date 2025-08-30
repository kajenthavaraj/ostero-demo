import db
import requests
import os
import json
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def make_call(application_id: str, mortgage_agent_name: str, first_name: str, 
                last_name: str, email: str, phone_number: str, interest: str, brokerage_name: str) -> Optional[str]:
    
    # Get API key from environment
    api_key = os.getenv('VAPI_API_PRIVATE_KEY')
    if not api_key:
        print("❌ VAPI_API_PRIVATE_KEY environment variable is required")
        print("💡 Set this in your .env file")
        return None
    
    # Vapi configuration - these should ideally come from environment variables or database
    # For now, using the values from the template code
    assistant_id = "14f907e7-b3b2-43aa-aa33-9f8c14212bd3"
    phone_number_id = "8c320a63-2ae0-4a5f-bbf4-9d33cede10e6"
    
    # Ensure phone number is in E.164 format
    if not phone_number.startswith('+'):
        phone_number = '+' + phone_number
    
    # Make the call using Vapi API
    url = "https://api.vapi.ai/call/phone"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Prepare the call payload for the /call/phone endpoint
    payload = {
        "assistantId": assistant_id,
        "phoneNumberId": phone_number_id,
        "customer": {
            "number": phone_number
        },
        "assistantOverrides": {
            "variableValues": {
                "application_id": application_id,
                "mortgage_agent_name": mortgage_agent_name,
                "brokerage_name": brokerage_name,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "phone_number": phone_number,
                "interest": interest
            }
        }
    }
    
    try:
        print("📡 Sending call request to Vapi...")
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        call_data = response.json()
        call_id = call_data.get('id')
        
        if call_id:
            print(f"✅ Call initiated successfully!")
            print(f"📋 Call ID: {call_id}")
            print(f"📊 Status: {call_data.get('status', 'unknown')}")
            print()
            print("🎯 Call is now being processed by Vapi!")
            return call_id
        else:
            print("❌ No call ID in response")
            print(f"Response: {json.dumps(call_data, indent=2)}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Call request failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response Status: {e.response.status_code}")
            print(f"Response Body: {e.response.text}")
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    print(f"Error Details: {error_data['error']}")
            except:
                pass
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None


def schedule_call(application_id: str, earliest_at: str, mortgage_agent_name: str, first_name: str, 
                last_name: str, email: str, phone_number: str, interest: str, brokerage_name: str) -> Optional[str]:
    
    # Get API key from environment
    api_key = os.getenv('VAPI_API_PRIVATE_KEY')
    if not api_key:
        print("❌ VAPI_API_PRIVATE_KEY environment variable is required")
        print("💡 Set this in your .env file")
        return None
    
    # Vapi configuration - these should ideally come from environment variables or database
    # For now, using the values from the template code
    assistant_id = "14f907e7-b3b2-43aa-aa33-9f8c14212bd3"
    phone_number_id = "8c320a63-2ae0-4a5f-bbf4-9d33cede10e6"
    
    # Ensure phone number is in E.164 format
    if not phone_number.startswith('+'):
        phone_number = '+' + phone_number
    
    # Make the call using Vapi API
    url = "https://api.vapi.ai/call/phone"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Prepare the call payload for scheduling with schedulePlan
    payload = {
        "assistantId": assistant_id,
        "phoneNumberId": phone_number_id,
        "customer": {
            "number": phone_number
        },
        "schedulePlan": {
            "earliestAt": earliest_at
        },
        "assistantOverrides": {
            "variableValues": {
                "application_id": application_id,
                "mortgage_agent_name": mortgage_agent_name,
                "brokerage_name": brokerage_name,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "phone_number": phone_number,
                "interest": interest
            }
        }
    }
    
    try:
        print("📡 Scheduling call request to Vapi...")
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        call_data = response.json()
        call_id = call_data.get('id')
        
        if call_id:
            print(f"✅ Call scheduled successfully!")
            print(f"📋 Call ID: {call_id}")
            print(f"📊 Status: {call_data.get('status', 'unknown')}")
            print(f"📅 Scheduled for earliest: {earliest_at}")
            print()
            print("🎯 Call is now scheduled with Vapi!")
            return call_id
        else:
            print("❌ No call ID in response")
            print(f"Response: {json.dumps(call_data, indent=2)}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Call scheduling failed: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response Status: {e.response.status_code}")
            print(f"Response Body: {e.response.text}")
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    print(f"Error Details: {error_data['error']}")
            except:
                pass
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None
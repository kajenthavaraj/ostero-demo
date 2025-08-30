from voice import schedule_call
from datetime import datetime, timedelta

def test_schedule_call():
    """Test the schedule_call function with sample data."""
    
    # Sample application data
    application_id = "test-app-456"
    mortgage_agent_name = "Sarah Johnson"
    first_name = "Michael"
    last_name = "Smith"
    email = "michael.smith@example.com"
    phone_number = "16477667841"  # The function will automatically add the + prefix
    interest = "Home refinancing"
    brokerage_name = "Premier Mortgage Group"
    
    # Schedule the call for 2 minutes from now (ISO 8601 format)
    earliest_at = (datetime.utcnow() + timedelta(minutes=2)).isoformat() + "Z"
    
    print("🧪 Testing schedule_call function...")
    print("=" * 50)
    print(f"📋 Application ID: {application_id}")
    print(f"👤 Customer: {first_name} {last_name}")
    print(f"📧 Email: {email}")
    print(f"📞 Phone: {phone_number}")
    print(f"🎯 Interest: {interest}")
    print(f"🤖 Agent: {mortgage_agent_name}")
    print(f"🏢 Brokerage: {brokerage_name}")
    print(f"📅 Earliest Schedule Time: {earliest_at} (2 minutes from now)")
    print()
    
    # Schedule the call
    call_id = schedule_call(
        application_id=application_id,
        earliest_at=earliest_at,
        mortgage_agent_name=mortgage_agent_name,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        interest=interest,
        brokerage_name=brokerage_name
    )
    
    if call_id:
        print(f"✅ Test successful! Call ID: {call_id}")
    else:
        print("❌ Test failed - no call ID returned")
    
    return call_id

def test_schedule_call_future_date():
    """Test scheduling a call for a specific future date and time."""
    
    # Sample application data
    application_id = "test-app-789"
    mortgage_agent_name = "David Wilson"
    first_name = "Emily"
    last_name = "Brown"
    email = "emily.brown@example.com"
    phone_number = "16477667841"
    interest = "First-time home buying"
    brokerage_name = "Elite Mortgage Solutions"
    
    # Schedule for tomorrow at 10:00 AM UTC
    tomorrow = datetime.utcnow() + timedelta(days=1)
    scheduled_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
    earliest_at = scheduled_time.isoformat() + "Z"
    
    print("🧪 Testing schedule_call function with specific future date...")
    print("=" * 60)
    print(f"📋 Application ID: {application_id}")
    print(f"👤 Customer: {first_name} {last_name}")
    print(f"📅 Scheduled for: {earliest_at}")
    print()
    
    # Schedule the call
    call_id = schedule_call(
        application_id=application_id,
        earliest_at=earliest_at,
        mortgage_agent_name=mortgage_agent_name,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        interest=interest,
        brokerage_name=brokerage_name
    )
    
    if call_id:
        print(f"✅ Future scheduling test successful! Call ID: {call_id}")
    else:
        print("❌ Future scheduling test failed - no call ID returned")
    
    return call_id



#!/usr/bin/env python3
"""
Test script for the make_call function.
This demonstrates how to use the make_call function with sample application data.
"""

from voice import make_call

def test_make_call():
    """Test the make_call function with sample data."""
    
    # Sample application data
    application_id = "e9e3bfcc-d27e-4201-af7e-3d634bf14afd"
    mortgage_agent_name = "John Smith"
    first_name = "Oreo"
    last_name = "Minis"
    email = "oreo.minis@example.com"
    phone_number = "16477667841"  # The function will automatically add the + prefix
    interest = "Mortgage refinancing"
    brokerage_name = "ABC Mortgage Company"
    
    print("🧪 Testing make_call function...")
    print("=" * 50)
    
    # Make the call
    call_id = make_call(
        application_id=application_id,
        mortgage_agent_name=mortgage_agent_name,
        brokerage_name=brokerage_name,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
        interest=interest
    )
    
    if call_id:
        print(f"✅ Test successful! Call ID: {call_id}")
    else:
        print("❌ Test failed - no call ID returned")
    
    return call_id




if __name__ == "__main__":
    print("🚀 Testing Schedule Call Function")
    print("=" * 50)
    
    # Test 1: Schedule for 2 minutes from now
    print("\n📞 Test 1: Schedule call for 2 minutes from now")
    # test_schedule_call()
    test_make_call()

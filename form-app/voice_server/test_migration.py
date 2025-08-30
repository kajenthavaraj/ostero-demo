#!/usr/bin/env python3
"""
Test script to verify the call_logs table migration was successful
"""

from db import DatabaseManager
from analytics import AnalyticsService
import json
from datetime import datetime

def test_database_connection():
    """Test basic database connection"""
    print("🔍 Testing database connection...")
    
    try:
        db = DatabaseManager()
        
        # Test basic connection with applications table
        result = db.client.table('applications').select('id').limit(1).execute()
        
        if result.data is not None:
            print("✅ Database connection successful")
            print(f"   Applications table accessible: {len(result.data)} records found")
            return True
        else:
            print("❌ Database connection failed")
            return False
            
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

def test_call_logs_table():
    """Test if call_logs table was created successfully"""
    print("\n🔍 Testing call_logs table...")
    
    try:
        db = DatabaseManager()
        
        # Try to query the call_logs table structure
        result = db.client.table('call_logs').select('id').limit(0).execute()
        
        if result.data is not None:
            print("✅ call_logs table exists and is accessible")
            
            # Test inserting a sample call log
            test_call_data = {
                'vapi_call_id': 'test-call-' + str(int(datetime.now().timestamp())),
                'status': 'test',
                'phone_number': '+1234567890',
                'duration_seconds': 120,
                'transcript_summary': 'Test call for migration verification',
                'cost_total': 0.05
            }
            
            insert_result = db.create_call_log(test_call_data)
            
            if insert_result.get('success'):
                print("✅ call_logs table insert test successful")
                
                # Clean up test record
                test_call_id = insert_result['data']['id']
                db.client.table('call_logs').delete().eq('id', test_call_id).execute()
                print("✅ Test record cleaned up")
                
                return True
            else:
                print(f"❌ call_logs table insert failed: {insert_result.get('error')}")
                return False
        else:
            print("❌ call_logs table not found or not accessible")
            return False
            
    except Exception as e:
        print(f"❌ call_logs table test error: {e}")
        return False

def test_analytics_service():
    """Test analytics service functionality"""
    print("\n🔍 Testing analytics service...")
    
    try:
        analytics = AnalyticsService()
        
        # Test getting dashboard metrics
        metrics = analytics.get_dashboard_metrics('30d')
        
        if metrics.get('success'):
            print("✅ Analytics service working")
            data = metrics['data']
            print(f"   Total applications: {data.get('total_applications', 0)}")
            print(f"   Completion rate: {data.get('completion_rate', 0)}%")
            print(f"   Average call duration: {data.get('average_call_duration', 0)} min")
            print(f"   Recent activities: {len(data.get('recent_activity', []))}")
            return True
        else:
            print(f"❌ Analytics service failed: {metrics.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Analytics service error: {e}")
        return False

def test_database_schema():
    """Test database schema by checking table structure"""
    print("\n🔍 Testing database schema...")
    
    try:
        db = DatabaseManager()
        
        # Check applications table structure
        apps_result = db.client.table('applications').select('*').limit(1).execute()
        
        if apps_result.data is not None:
            print("✅ applications table schema verified")
            if apps_result.data:
                sample_app = apps_result.data[0]
                print(f"   Sample fields: {list(sample_app.keys())[:5]}...")
        
        # Check call_logs table structure  
        calls_result = db.client.table('call_logs').select('*').limit(1).execute()
        
        if calls_result.data is not None:
            print("✅ call_logs table schema verified")
            print(f"   Table is ready for call logging")
            return True
        else:
            print("❌ call_logs table schema issue")
            return False
            
    except Exception as e:
        print(f"❌ Database schema test error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Running Database Migration Verification Tests")
    print("=" * 60)
    
    tests = [
        ("Database Connection", test_database_connection),
        ("call_logs Table", test_call_logs_table), 
        ("Analytics Service", test_analytics_service),
        ("Database Schema", test_database_schema)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<20} {status}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - Migration was successful!")
        print("🚀 Ready to build the dashboard!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed - Check the issues above")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
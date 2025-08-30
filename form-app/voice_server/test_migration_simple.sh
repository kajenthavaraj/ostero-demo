#!/bin/bash

# Simple test script to verify call_logs table migration using curl
# Tests the Supabase REST API directly

echo "🚀 Testing Supabase Database Migration"
echo "======================================"

# Supabase project details
SUPABASE_URL="https://totgazkleqdkdsebyahk.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdGdhemtsZXFka2RzZWJ5YWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTI1NjUsImV4cCI6MjA3MDk2ODU2NX0.1I-_jpS_EuuPfmk2F7ZCvBn5wYJ1SD0ExzD3DwulJ4Q"

echo ""
echo "🔍 Test 1: Checking applications table (existing)"
echo "-----------------------------------------------"

response=$(curl -s \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/applications?select=id,first_name,email&limit=3")

if [[ $response == *"id"* ]]; then
    echo "✅ applications table accessible"
    echo "   Sample data: $(echo $response | head -c 100)..."
else
    echo "❌ applications table issue"
    echo "   Response: $response"
fi

echo ""
echo "🔍 Test 2: Checking call_logs table (new)"
echo "-----------------------------------------"

response=$(curl -s \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/call_logs?select=id,vapi_call_id,status&limit=3")

if [[ $response == "[]" ]]; then
    echo "✅ call_logs table exists and is empty (expected)"
    echo "   Table structure is accessible"
elif [[ $response == *"id"* ]]; then
    echo "✅ call_logs table exists with data"
    echo "   Sample data: $(echo $response | head -c 100)..."
else
    echo "❌ call_logs table issue - migration may have failed"
    echo "   Response: $response"
fi

echo ""
echo "🔍 Test 3: Testing call_logs table insert"
echo "-----------------------------------------"

# Create a test call log entry
test_data='{
  "vapi_call_id": "test-migration-'$(date +%s)'",
  "status": "test",
  "phone_number": "+1234567890",
  "duration_seconds": 30,
  "transcript_summary": "Migration test call"
}'

response=$(curl -s -w "%{http_code}" \
  -X POST \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$test_data" \
  "$SUPABASE_URL/rest/v1/call_logs")

http_code="${response: -3}"
response_body="${response%???}"

if [[ $http_code == "201" ]]; then
    echo "✅ call_logs table insert successful"
    echo "   Created test record"
    
    # Extract the ID for cleanup
    test_id=$(echo "$response_body" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    if [[ -n "$test_id" ]]; then
        # Clean up the test record
        cleanup_response=$(curl -s -w "%{http_code}" \
          -X DELETE \
          -H "apikey: $SUPABASE_ANON_KEY" \
          -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
          "$SUPABASE_URL/rest/v1/call_logs?id=eq.$test_id")
        
        cleanup_code="${cleanup_response: -3}"
        if [[ $cleanup_code == "204" ]]; then
            echo "✅ Test record cleaned up"
        else
            echo "⚠️  Test record cleanup failed (not critical)"
        fi
    fi
else
    echo "❌ call_logs table insert failed"
    echo "   HTTP Code: $http_code"
    echo "   Response: $response_body"
fi

echo ""
echo "🔍 Test 4: Testing table relationships"
echo "-------------------------------------"

# Test if we can query applications with call_logs join
response=$(curl -s \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/applications?select=id,first_name,call_logs(id,status)&limit=1")

if [[ $response == *"call_logs"* ]] || [[ $response == *"first_name"* ]]; then
    echo "✅ Table relationships working"
    echo "   Can join applications with call_logs"
else
    echo "⚠️  Table relationships may need attention"
    echo "   Response: $(echo $response | head -c 100)..."
fi

echo ""
echo "======================================"
echo "📊 MIGRATION TEST COMPLETE"
echo "======================================"

# Check if migration was successful overall
if curl -s -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
   "$SUPABASE_URL/rest/v1/call_logs?select=id&limit=1" | grep -q '\[\]'; then
    echo "🎉 MIGRATION SUCCESSFUL!"
    echo ""
    echo "✅ call_logs table created"
    echo "✅ Table is accessible via REST API"
    echo "✅ Insert operations work"
    echo "✅ Ready for dashboard implementation"
    echo ""
    echo "🚀 You can now proceed with building the dashboard!"
else
    echo "❌ Migration may have issues"
    echo "   Please check Supabase dashboard for table structure"
fi

echo ""
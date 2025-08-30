# Vapi Server Documentation

## Overview
The `vapi_server.py` file contains a Flask webhook server that receives Vapi webhook events and automatically calls the `end_call` function whenever a call is completed.

## Key Features

### 🔚 **Automatic Call Completion Detection**
- Monitors Vapi webhooks for call status changes
- Automatically calls `end_call` function when calls are completed
- Supports multiple completion statuses: `ended`, `completed`, `failed`, `cancelled`

### 📝 **Transcript Management**
- Caches conversation transcripts in memory
- Stores messages by call ID for easy retrieval
- Handles duplicate message prevention

### 🔐 **Security Features**
- Webhook signature verification (when `VAPI_WEBHOOK_SECRET` is configured)
- Secure endpoint handling

## Setup

### 1. Environment Variables
Create a `.env` file in the `voice_server` directory:

```bash
# Required: Your Vapi API private key
VAPI_API_PRIVATE_KEY=your_vapi_api_private_key_here

# Optional: Webhook secret for signature verification
VAPI_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Dependencies
Ensure you have the required packages installed:
```bash
pip install -r requirements.txt
```

## Usage

### Starting the Server
```bash
cd voice_server
python vapi_server.py
```

The server will start on port 5001 and display:
- Webhook URL: `http://localhost:5001/vapi/webhook`
- Test endpoints and health check URLs
- Configuration instructions

### Configuring Vapi Dashboard
In your Vapi dashboard, set the webhook URL to:
```
http://localhost:5001/vapi/webhook
```

For external access (e.g., using ngrok):
```
http://your-ngrok-url.ngrok.io/vapi/webhook
```

## How It Works

### 1. **Webhook Reception**
- Server listens for POST requests to `/vapi/webhook`
- Receives real-time updates from Vapi about call status and transcripts

### 2. **Call Completion Detection**
```python
def check_call_status(webhook_data: dict) -> tuple:
    # Checks if webhook indicates call completion
    call_data = webhook_data.get('call', {})
    status = call_data.get('status')
    
    # Define completed statuses
    completed_statuses = ['ended', 'completed', 'failed', 'cancelled']
    is_completed = status in completed_statuses
    
    return is_completed, call_id, status
```

### 3. **Automatic end_call Execution**
When a call completion is detected:
```python
# If call is completed, call the end_call function
if is_completed and call_id and call_id != 'unknown':
    print(f"\n🎯 CALL COMPLETION DETECTED - Calling end_call function")
    end_call(call_id)
```

### 4. **end_call Function**
The `end_call` function is called automatically and handles:
- Retrieving the call transcript
- Finding the associated application ID
- Processing call completion logic

```python
def end_call(call_id: str):
    """
    Handle call completion - this function is called when Vapi sends a webhook
    indicating the call is complete.
    """
    # Get the transcript for this call
    transcript = get_transcript_cache(call_id)
    
    # Find the application ID from the call ID
    application_id = db_manager.find_application_id_by_call_id(call_id)
    
    # TODO: Add your application-specific logic here
    # - Update application status in database
    # - Send notifications
    # - Process collected information
    # - Trigger follow-up actions
```

## API Endpoints

### Webhook Endpoint
- **URL**: `/vapi/webhook`
- **Method**: POST
- **Purpose**: Receives Vapi webhook events
- **Authentication**: Optional signature verification

### Health Check
- **URL**: `/health`
- **Method**: GET
- **Purpose**: Server health status

### Statistics
- **URL**: `/stats`
- **Method**: GET
- **Purpose**: Server statistics and uptime

### Transcript Management
- **URL**: `/transcripts`
- **Method**: GET
- **Purpose**: List all cached transcripts

- **URL**: `/transcript/<call_id>`
- **Method**: GET
- **Purpose**: Get transcript for specific call

- **URL**: `/transcript/<call_id>/clear`
- **Method**: DELETE
- **Purpose**: Clear transcript cache for specific call

### Manual End Call
- **URL**: `/end-call/<call_id>`
- **Method**: POST
- **Purpose**: Manually trigger end_call function
- **Use Case**: Testing or manual intervention

### Test Webhook
- **URL**: `/test-webhook`
- **Method**: POST
- **Purpose**: Test webhook endpoint functionality

## Testing

### Test the Server
```bash
# Start the server
python vapi_server.py

# In another terminal, test the endpoints
python test_vapi_server.py
```

### Test Manual End Call
```bash
# Test with a specific call ID
curl -X POST http://localhost:5001/end-call/test-call-123
```

## Customization

### Modifying end_call Function
The `end_call` function is where you add your application-specific logic:

```python
def end_call(call_id: str):
    try:
        # Get transcript and application ID
        transcript = get_transcript_cache(call_id)
        application_id = db_manager.find_application_id_by_call_id(call_id)
        
        # Add your custom logic here:
        # 1. Update application status
        # 2. Send notifications
        # 3. Process collected information
        # 4. Trigger follow-up actions
        # 5. Update database records
        
        print(f"✅ end_call processing completed for call {call_id}")
        
    except Exception as e:
        print(f"❌ Error in end_call function: {e}")
        import traceback
        traceback.print_exc()
```

### Adding New Webhook Handlers
To handle additional webhook events, modify the webhook handler:

```python
@self.app.route('/vapi/webhook', methods=['POST'])
def handle_webhook():
    # ... existing code ...
    
    # Add custom webhook handling logic here
    webhook_type = webhook_data.get('type')
    if webhook_type == 'call.started':
        # Handle call start
        pass
    elif webhook_type == 'call.ended':
        # Handle call end
        pass
    elif webhook_type == 'transcript.updated':
        # Handle transcript updates
        pass
```

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if port 5001 is available
   - Verify all dependencies are installed
   - Check for syntax errors in the code

2. **Webhooks not received**
   - Verify webhook URL in Vapi dashboard
   - Check server is running and accessible
   - Verify network/firewall settings

3. **end_call not executing**
   - Check webhook data structure
   - Verify call status values
   - Check server logs for errors

4. **Signature verification fails**
   - Ensure `VAPI_WEBHOOK_SECRET` is set correctly
   - Verify webhook secret matches Vapi dashboard

### Debug Mode
The server provides extensive logging:
- Webhook data structure
- Call completion detection
- Transcript processing
- Cache operations

### Manual Testing
Use the test endpoints to verify functionality:
- `/test-webhook` - Test webhook reception
- `/end-call/<call_id>` - Test end_call function
- `/health` - Verify server status

## Security Considerations

- **Webhook Secret**: Always configure `VAPI_WEBHOOK_SECRET` for production
- **HTTPS**: Use HTTPS in production environments
- **Access Control**: Consider adding authentication for admin endpoints
- **Input Validation**: Validate all webhook data before processing

## Production Deployment

For production use:
1. Use a production WSGI server (Gunicorn, uWSGI)
2. Configure HTTPS
3. Set up proper logging
4. Add monitoring and health checks
5. Use environment-specific configuration
6. Consider load balancing for high traffic

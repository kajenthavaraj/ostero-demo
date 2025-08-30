from fastapi import FastAPI, Form, Request
from fastapi.responses import Response
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Twilio configuration
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '+16473603089')

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def send_sms(phone_number: str, message: str) -> bool:
    """Send SMS message to user"""
    try:
        message = client.messages.create(
            to=phone_number,
            from_=TWILIO_PHONE_NUMBER,
            body=message
        )
        print(f"SMS sent successfully. SID: {message.sid}")
        return True
    except Exception as e:
        print(f"Error sending SMS: {e}")
        return False

@app.post("/send-first-message")
async def send_first_message(phone_number: str, message: str = "Hello! Welcome to our SMS chatbot. How can I help you today?"):
    """API endpoint to send the first message to a user"""
    success = send_sms(phone_number, message)
    
    if success:
        return {"status": "success", "message": "First message sent successfully"}
    else:
        return {"status": "error", "message": "Failed to send SMS"}

@app.post("/sms-webhook")
async def sms_webhook(
    From: str = Form(...),
    Body: str = Form(...),
    MessageSid: str = Form(...),
    AccountSid: str = Form(...),
    To: str = Form(...)
):
    """Webhook endpoint to handle incoming SMS messages"""
    
    # Log the incoming message
    print(f"Received SMS from {From}: {Body}")
    
    # Create TwiML response
    twiml_response = MessagingResponse()
    
    # Process the user's message and generate a response
    response_message = process_user_message(From, Body)
    
    # Add the response to TwiML
    twiml_response.message(response_message)
    
    return Response(content=str(twiml_response), media_type="application/xml")

def process_user_message(phone_number: str, user_message: str) -> str:
    """Process the user's message and generate an appropriate response"""
    user_message_lower = user_message.lower().strip()
    
    # Simple chatbot responses based on keywords
    if "hello" in user_message_lower or "hi" in user_message_lower:
        return "Hello! How can I assist you today?"
    elif "help" in user_message_lower:
        return "I'm here to help! You can ask me questions or type 'menu' to see available options."
    elif "menu" in user_message_lower:
        return "Here are your options:\n1. Get information\n2. Contact support\n3. Schedule appointment\n\nJust type the number or option name!"
    elif "information" in user_message_lower or "1" == user_message_lower:
        return "Here's some helpful information about our services. What specific information are you looking for?"
    elif "support" in user_message_lower or "2" == user_message_lower:
        return "I'll connect you with our support team. Please describe your issue and we'll get back to you shortly."
    elif "schedule" in user_message_lower or "appointment" in user_message_lower or "3" == user_message_lower:
        return "I'd be happy to help you schedule an appointment. What day and time works best for you?"
    elif "bye" in user_message_lower or "goodbye" in user_message_lower:
        return "Thank you for chatting with us! Have a great day!"
    else:
        return "I understand you said: '" + user_message + "'. How can I help you with that? Type 'help' for more options."

@app.get("/")
async def root():
    return {"message": "SMS Chatbot API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
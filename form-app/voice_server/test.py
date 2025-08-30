import requests
import os
from typing import Dict, Any
from dotenv import load_dotenv

def get_call_body(call_id: str) -> Dict[str, Any]:
    """
    Get the entire call body from Vapi using the call_id.
    
    Args:
        call_id (str): The unique identifier for the call
        
    Returns:
        Dict[str, Any]: The complete call response body from Vapi
        
    Raises:
        Exception: If the API request fails or API key is not configured
    """
    # Get the Vapi API key from environment variables
    api_key = os.getenv('VAPI_API_PRIVATE_KEY')
    if not api_key:
        raise Exception("VAPI_API_PRIVATE_KEY environment variable not set")
    
    # Vapi API endpoint for getting call details
    url = f"https://api.vapi.ai/call/{call_id}"
    
    # Headers with Bearer token authentication
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        # Make GET request to Vapi API
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        # Return the complete call body
        return response.json()
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch call data from Vapi: {str(e)}")
    except ValueError as e:
        raise Exception(f"Failed to parse response from Vapi: {str(e)}")



def find_application_id_by_call_id(self, call_id: str) -> str:
    # Get the email and phone number from call id using Vapi
    # Search supabase applications using email and phone number, find the most recent application
    # Return the application id
    return



load_dotenv()
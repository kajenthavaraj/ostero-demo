from test import get_call_body
import db
from db import db_manager
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


def handle_end_call(end_call_body):
    
    for i in range(20):
        print()

    print("🔍 Starting fill_application...")

    print(end_call_body)

    for i in range(20):
        print()

    # Extract call_id from the VAPI webhook structure (message.call.id)
    call_id = end_call_body.get('message', {}).get('call', {}).get('id', 'unknown')
    print(f"📞 Extracted Call ID: {call_id}")
    
    # Extract transcript from call body
    transcript = (end_call_body.get("message", {}).get("artifact", {}).get("transcript") or end_call_body.get("transcript"))
    print(f"📝 End Call Transcript: {transcript}")

    variable_values =  _find_last_variable_values(end_call_body)

    print(f"📝 Variable Values: {variable_values}")

    # Extract structured information from transcript using OpenAI
    extracted_info = extract_information_from_transcript(transcript)
    print(f"🎯 Extracted Information: {json.dumps(extracted_info, indent=2)}")
    
    # Fill the database
    fill_database(extracted_info, variable_values, call_id)

    return


def _find_last_variable_values(obj):
    last = None
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "variableValues" and isinstance(v, dict):
                last = v  # keep overwriting; the final one wins
            sub = _find_last_variable_values(v)
            if sub is not None:
                last = sub
    elif isinstance(obj, list):
        for item in obj:
            sub = _find_last_variable_values(item)
            if sub is not None:
                last = sub
    return last


def extract_information_from_transcript(transcript):
    """
    Extract structured information from a transcript using OpenAI.
    
    Args:
        transcript (str): The call transcript to analyze
        
    Returns:
        dict: Dictionary with extracted information, blank values for items not found
    """
    # Initialize OpenAI client
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    if not transcript:
        # Return blank structure if no transcript
        return {
            "date_of_birth": "",
            "loan_amount": "",
            "property_address": "",
            "property_value": "",
            "mortgage_balance": "",
            "property_usage": "",
            "employment_type": "",
            "annual_income": "",
            "what_looking_to_do": ""
        }
    
    prompt = """
You are an expert at extracting structured information from call transcripts. 
Analyze the following transcript and extract the requested information with exact formatting requirements.

TRANSCRIPT:
{transcript}

Extract the following information. If any piece of information cannot be found in the transcript, leave that field blank ("").

EXTRACTION REQUIREMENTS:

1. Date of birth: Format as MM/DD/YYYY. For "April first 2004" write "04/01/2004". Be very careful with month/day conversion.
2. Loan amount: Extract as a number only (e.g., "250000" for $250,000)  
3. Property address: Full address as mentioned (e.g., "123 Main Street, Boston, MA 02101")
4. Property value: Extract as a number only (e.g., "450000" for $450,000)
5. Mortgage balance: Extract as a number only (e.g., "180000" for $180,000)  
6. Property usage: Must be exactly one of: "I live in it", "Second home", "Rented", "Other"
7. Employment type: Must be exactly one of: "Employed", "Self employed", "Retired", "Pension", "Unemployed"
8. Annual income: Extract as a number only (e.g., "75000" for $75,000)
9. What looking to do: Extract purpose like "Mortgage application", "Refinance", "Purchase", etc.

Return ONLY a valid JSON object with these exact keys:
{{
    "date_of_birth": "",
    "loan_amount": "", 
    "property_address": "",
    "property_value": "",
    "mortgage_balance": "",
    "property_usage": "",
    "employment_type": "",
    "annual_income": "",
    "what_looking_to_do": ""
}}

Important: 
- Use empty string "" for any information not found
- Numbers should be digits only (no commas, dollar signs, or decimals)
- Dates must be MM/DD/YYYY format
- Property usage and employment type must match the exact options provided
- Return only the JSON object, no other text
""".format(transcript=transcript)

    try:
        response = client.chat.completions.create(
            model="gpt-5",
            messages=[
                {"role": "system", "content": "You are a precise information extraction assistant. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=2000
        )
        
        # Parse the JSON response
        extracted_info = json.loads(response.choices[0].message.content.strip())
        
        # Validate the structure and ensure all required keys exist
        required_keys = [
            "date_of_birth", "loan_amount", "property_address", "property_value",
            "mortgage_balance", "property_usage", "employment_type", "annual_income", "what_looking_to_do"
        ]
        
        for key in required_keys:
            if key not in extracted_info:
                extracted_info[key] = ""
        
        return extracted_info
        
    except Exception as e:
        print(f"❌ Error extracting information from transcript: {e}")
        # Return blank structure on error
        return {
            "date_of_birth": "",
            "loan_amount": "",
            "property_address": "",
            "property_value": "",
            "mortgage_balance": "",
            "property_usage": "",
            "employment_type": "",
            "annual_income": "",
            "what_looking_to_do": ""
        }


def fill_database(extracted_info, variable_values, call_id):
    """
    Fill the Supabase applications table with extracted information from the call.
    
    Args:
        extracted_info (dict): Information extracted from transcript by OpenAI
        variable_values (dict): Variable values from VAPI call
        call_id (str): The VAPI call ID
        
    Returns:
        bool: True if successful, False if failed
    """
    try:
        # Get application_id from variable_values if available
        application_id = variable_values.get('application_id') if variable_values else None
        
        print(f"📝 Filling database for call {call_id}")
        print(f"📊 Application ID: {application_id}")
        print(f"🎯 Extracted Info: {json.dumps(extracted_info, indent=2)}")
        
        # Prepare the data mapping from extracted_info to database columns
        update_data = {}
        
        # Map date_of_birth - convert MM/DD/YYYY to YYYY-MM-DD format for PostgreSQL
        if extracted_info.get('date_of_birth'):
            try:
                # Parse MM/DD/YYYY format and convert to YYYY-MM-DD
                from datetime import datetime
                date_obj = datetime.strptime(extracted_info['date_of_birth'], '%m/%d/%Y')
                update_data['date_of_birth'] = date_obj.strftime('%Y-%m-%d')
                print(f"📅 Date of birth: {extracted_info['date_of_birth']} -> {update_data['date_of_birth']}")
            except ValueError as e:
                print(f"❌ Error parsing date of birth '{extracted_info['date_of_birth']}': {e}")
        
        # Map other fields directly
        field_mappings = {
            'loan_amount': 'loan_amount_requested',
            'property_address': 'property_address', 
            'property_value': 'property_value',
            'mortgage_balance': 'mortgage_balance',
            'property_usage': 'property_use',
            'employment_type': 'employment_type',
            'annual_income': 'annual_income',
            'what_looking_to_do': 'what_looking_to_do'
        }
        
        for extracted_key, db_column in field_mappings.items():
            if extracted_info.get(extracted_key):
                update_data[db_column] = extracted_info[extracted_key]
                print(f"📝 {extracted_key}: {extracted_info[extracted_key]}")
        
        # Only proceed if we have data to update and an application_id
        if not update_data:
            print("⚠️  No data extracted from transcript to update")
            return False
            
        if not application_id:
            print("⚠️  No application_id found in variable_values - cannot update database")
            return False
        
        # Update the database using the existing db module
        print(f"🔄 Updating application {application_id} with extracted data...")
        
        # Use the database manager to update the application
        result = db_manager.update_application(application_id, update_data)
        
        if result.get('success'):
            print(f"✅ Successfully updated application {application_id} in database")
            print(f"📊 Updated data: {result.get('data', {})}")
            return True
        else:
            error_msg = result.get('error', 'Unknown error')
            print(f"❌ Failed to update application {application_id} in database: {error_msg}")
            return False
            
    except Exception as e:
        print(f"❌ Error filling database: {e}")
        import traceback
        traceback.print_exc()
        return False
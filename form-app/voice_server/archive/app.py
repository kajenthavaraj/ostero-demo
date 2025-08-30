import os
import json
import time
import requests
from datetime import datetime
from flask import Flask, request, jsonify
import hmac
import hashlib
from dotenv import load_dotenv
import db









def webhook_handler(call_id:str):
    # Decide which function to call based on the webhook type
        # If call is ongoing: live_transcript
        # If call is ended: handle_end_call
    return


def live_transcript(call_id:str):
    # Get call id from TRANSCRIPT_CACHE
    application_id = APPLICATION_ID_MAP[call_id]
    fill_application(TRANSCRIPT_CACHE[call_id],application_id)
    return


def fill_application(transcript:str,application_id:str):
    return

def get_remaining_questions(application_id:str) -> str:
    return

def handle_end_call(call_id:str):
    return
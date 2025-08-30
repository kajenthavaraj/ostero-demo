#!/usr/bin/env python3
"""
Test phone number formatting
"""

def format_phone_to_e164(phone: str) -> str:
    """JavaScript version ported to Python for testing"""
    import re
    
    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', phone)
    
    # If it's already 11 digits and starts with 1, it's likely US/Canada format
    if len(digits_only) == 11 and digits_only.startswith('1'):
        return f"+{digits_only}"
    
    # If it's 10 digits, assume US/Canada and add +1
    if len(digits_only) == 10:
        return f"+1{digits_only}"
    
    # If it already starts with +, return as is
    if phone.startswith('+'):
        return phone
    
    # Default: assume US/Canada and add +1
    return f"+1{digits_only}"

def test_phone_formatting():
    """Test various phone number formats"""
    
    test_cases = [
        "4167009468",           # Should become +14167009468
        "(416) 700-9468",       # Should become +14167009468
        "416-700-9468",         # Should become +14167009468
        "416 700 9468",         # Should become +14167009468
        "1-416-700-9468",       # Should become +14167009468
        "14167009468",          # Should become +14167009468
        "+14167009468",         # Should stay +14167009468
    ]
    
    print("📞 Phone Number Formatting Tests")
    print("=" * 50)
    
    for test_input in test_cases:
        result = format_phone_to_e164(test_input)
        print(f"Input:  '{test_input}'")
        print(f"Output: '{result}'")
        print()

if __name__ == "__main__":
    test_phone_formatting()
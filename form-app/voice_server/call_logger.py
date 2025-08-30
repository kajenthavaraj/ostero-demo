"""
Call Logger for VAPI Integration
Handles call logging and database integration
"""

from typing import Dict, Any, Optional
from datetime import datetime
from db import DatabaseManager
import json


class CallLogger:
    def __init__(self):
        self.db = DatabaseManager()
    
    def log_call_start(self, webhook_data: Dict[str, Any]) -> Optional[str]:
        """
        Log the start of a VAPI call
        Returns call_log_id if successful
        """
        try:
            # Handle both root-level call data and VAPI webhook structure (message.call)
            call_data = webhook_data.get('call', {})
            message_data = webhook_data.get('message', {})
            
            # VAPI sends call data in message.call
            if not call_data and message_data.get('call'):
                call_data = message_data['call']
            
            call_id = call_data.get('id', 'unknown')
            phone_number = self._extract_phone_number(call_data)
            
            # Try to link to application by phone number
            application_id = None
            if phone_number:
                application_id = self.db.link_call_to_application_by_phone(call_id, phone_number)
            
            # Also check variable values for application_id
            if not application_id:
                variable_values = self._extract_variable_values(webhook_data)
                application_id = variable_values.get('application_id')
            
            # Create call log entry
            call_log_data = {
                'vapi_call_id': call_id,
                'application_id': application_id,
                'phone_number': phone_number,
                'status': call_data.get('status', 'started'),
                'started_at': call_data.get('createdAt') or datetime.utcnow().isoformat(),
                'full_transcript': [],
                'performance_metrics': {},
                'cost_breakdown': {}
            }
            
            result = self.db.create_call_log(call_log_data)
            if result.get('success'):
                print(f"✅ Started logging call: {call_id}")
                if application_id:
                    print(f"   📋 Linked to application: {application_id}")
                return result['data']['id']
            else:
                print(f"❌ Failed to create call log: {result.get('error')}")
                return None
                
        except Exception as e:
            print(f"❌ Error logging call start: {e}")
            return None
    
    def update_call_transcript(self, call_id: str, transcript_messages: list):
        """Update call with new transcript messages"""
        try:
            # Get existing call log
            existing_log = self.db.get_call_log_by_vapi_id(call_id)
            
            if existing_log.get('success'):
                # Merge new messages with existing transcript
                existing_transcript = existing_log['data'].get('full_transcript', [])
                
                # Add new messages (avoid duplicates)
                for new_msg in transcript_messages:
                    message_text = new_msg.get('message', '')
                    # Check if message already exists
                    if not any(msg.get('message', '') == message_text for msg in existing_transcript):
                        existing_transcript.append(new_msg)
                
                # Update call log
                update_data = {
                    'full_transcript': existing_transcript,
                    'updated_at': datetime.utcnow().isoformat()
                }
                
                result = self.db.update_call_log(call_id, update_data)
                if result.get('success'):
                    print(f"📝 Updated transcript for call: {call_id} ({len(existing_transcript)} messages)")
                
        except Exception as e:
            print(f"❌ Error updating call transcript: {e}")
    
    def update_call_status(self, call_id: str, status: str, webhook_data: Dict[str, Any]):
        """Update call status from status-update webhook"""
        try:
            call_data = webhook_data.get('message', {}).get('call', {})
            
            # Prepare update data
            update_data = {
                'status': status,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Add cost if available
            cost = call_data.get('cost', 0)
            if cost > 0:
                update_data['cost_total'] = cost
            
            # Add any transcript messages if available in this webhook
            artifact = webhook_data.get('message', {}).get('artifact', {})
            if artifact.get('messages'):
                update_data['full_transcript'] = artifact['messages']
            
            # Update call log
            result = self.db.update_call_log(call_id, update_data)
            
            if result.get('success'):
                print(f"🔄 Updated call status: {call_id} -> {status}")
                if cost > 0:
                    print(f"   💰 Cost: ${cost}")
            else:
                print(f"❌ Failed to update call status: {result.get('error')}")
                
        except Exception as e:
            print(f"❌ Error updating call status: {e}")
    
    def finalize_call(self, call_id: str, end_call_data: Dict[str, Any]) -> bool:
        """
        Finalize call with end-of-call data including costs and analysis
        """
        try:
            # Extract relevant data from end-of-call webhook
            message = end_call_data.get('message', {})
            artifact = message.get('artifact', {})
            call_info = message.get('call', {})
            
            # Prepare update data - cost data is at message level, not artifact level
            update_data = {
                'status': 'completed',
                'ended_at': message.get('endedAt') or datetime.utcnow().isoformat(),
                'transcript_summary': message.get('summary', ''),
                'cost_total': message.get('cost', 0),
                'cost_breakdown': message.get('costBreakdown', {}),
                'performance_metrics': message.get('performanceMetrics', {}),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Add duration if available (try both locations)
            duration = message.get('durationSeconds') or artifact.get('durationSeconds')
            if duration:
                update_data['duration_seconds'] = duration
            
            # Add full transcript if available (try both locations)
            transcript = message.get('messages') or artifact.get('messages')
            if transcript:
                update_data['full_transcript'] = transcript
            
            # Update call log
            result = self.db.update_call_log(call_id, update_data)
            
            if result.get('success'):
                print(f"✅ Finalized call log: {call_id}")
                print(f"   ⏱️  Duration: {update_data.get('duration_seconds', 0)} seconds")
                print(f"   💰 Cost: ${update_data.get('cost_total', 0)}")
                return True
            else:
                print(f"❌ Failed to finalize call: {result.get('error')}")
                return False
                
        except Exception as e:
            print(f"❌ Error finalizing call: {e}")
            return False
    
    def _extract_phone_number(self, call_data: Dict[str, Any]) -> Optional[str]:
        """Extract phone number from call data"""
        try:
            # Try different possible locations for phone number
            customer = call_data.get('customer', {})
            if isinstance(customer, dict) and customer.get('number'):
                return customer['number']
            
            # Try from phoneNumberId or other fields
            # This might need adjustment based on actual VAPI webhook structure
            return None
            
        except Exception:
            return None
    
    def _extract_variable_values(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract variable values from webhook data"""
        try:
            # Look for variableValues in various locations
            variable_locations = [
                webhook_data.get('message', {}).get('call', {}).get('assistantOverrides', {}).get('variableValues', {}),
                webhook_data.get('call', {}).get('assistantOverrides', {}).get('variableValues', {}),
                webhook_data.get('message', {}).get('variableValues', {}),
                webhook_data.get('variableValues', {})
            ]
            
            for variables in variable_locations:
                if variables and isinstance(variables, dict):
                    return variables
            
            return {}
            
        except Exception:
            return {}
    
    def get_call_analytics(self, time_range: str = '30d') -> Dict[str, Any]:
        """Get call analytics for dashboard"""
        try:
            # This will be used by the analytics service
            all_calls = self.db.get_all_call_logs(limit=1000)
            
            if not all_calls.get('success'):
                return {"success": False, "error": "Failed to fetch call logs"}
            
            calls = all_calls['data']
            
            # Calculate basic metrics
            total_calls = len(calls)
            completed_calls = len([c for c in calls if c.get('status') in ['completed', 'ended']])
            total_duration = sum(c.get('duration_seconds', 0) for c in calls if c.get('duration_seconds'))
            total_cost = sum(float(c.get('cost_total', 0)) for c in calls)
            
            analytics = {
                'total_calls': total_calls,
                'completed_calls': completed_calls,
                'success_rate': (completed_calls / total_calls * 100) if total_calls > 0 else 0,
                'total_duration_minutes': total_duration / 60,
                'average_duration_minutes': (total_duration / completed_calls / 60) if completed_calls > 0 else 0,
                'total_cost': total_cost,
                'average_cost_per_call': (total_cost / total_calls) if total_calls > 0 else 0
            }
            
            return {"success": True, "data": analytics}
            
        except Exception as e:
            return {"success": False, "error": str(e)}


# Global call logger instance
call_logger = CallLogger()


def handle_vapi_webhook(webhook_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main webhook handler for VAPI events
    Integrates with call logging
    """
    try:
        message_type = webhook_data.get('message', {}).get('type', 'unknown')
        call_id = webhook_data.get('message', {}).get('call', {}).get('id', 'unknown')
        
        # For status-update webhooks, get status from message level
        # For other webhooks, get status from call object  
        if message_type == 'status-update':
            call_status = webhook_data.get('message', {}).get('status', 'unknown')
        else:
            call_status = webhook_data.get('message', {}).get('call', {}).get('status', 'unknown')
        
        print(f"📞 VAPI Webhook: {message_type} for call {call_id} (status: {call_status})")
        
        # Check if call log exists
        existing_log = call_logger.db.get_call_log_by_vapi_id(call_id)
        
        if message_type in ['call-start', 'status-update']:
            if not existing_log.get('success'):
                # Create new call log if one doesn't exist yet
                call_logger.log_call_start(webhook_data)
            else:
                # Update existing call log with new status
                call_logger.update_call_status(call_id, call_status, webhook_data)
        
        elif message_type == 'transcript':
            # Update transcript
            transcript_data = webhook_data.get('message', {}).get('transcript', [])
            if transcript_data:
                call_logger.update_call_transcript(call_id, transcript_data)
        
        elif message_type == 'end-of-call-report':
            # Finalize call
            call_logger.finalize_call(call_id, webhook_data)
            
            # Also trigger the existing end_call processing for application filling
            try:
                from fill_application import handle_end_call
                handle_end_call(webhook_data)
            except ImportError:
                print("⚠️  fill_application module not found, skipping end_call processing")
        
        return {"success": True, "message": f"Processed {message_type}"}
        
    except Exception as e:
        print(f"❌ Error in VAPI webhook handler: {e}")
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    # Test the call logger
    logger = CallLogger()
    
    # Test analytics
    analytics = logger.get_call_analytics()
    print(f"Call analytics: {analytics}")
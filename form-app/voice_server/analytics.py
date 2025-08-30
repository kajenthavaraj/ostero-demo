"""
Analytics Service for Dashboard
Provides metrics and data analysis for applications and calls
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from db import DatabaseManager
import json


class AnalyticsService:
    def __init__(self):
        self.db = DatabaseManager()
    
    def get_dashboard_metrics(self, time_range: str = '30d') -> Dict[str, Any]:
        """
        Get comprehensive dashboard metrics for a given time range
        
        Args:
            time_range: '7d', '30d', '90d', or 'all'
        
        Returns:
            Dictionary with all dashboard metrics
        """
        try:
            # Get date range filter
            from_date = self._get_date_from_range(time_range)
            
            # Gather all metrics
            metrics = {
                'total_applications': self._get_total_applications(from_date),
                'completion_rate': self._get_completion_rate(from_date),
                'average_call_duration': self._get_average_call_duration(from_date),
                'conversion_rate': self._get_conversion_rate(from_date),
                'applications_over_time': self._get_applications_over_time(from_date, time_range),
                'call_success_rate': self._get_call_success_rate(from_date),
                'recent_activity': self._get_recent_activity(limit=10),
                'source_breakdown': self._get_source_breakdown(from_date),
                'status_breakdown': self._get_status_breakdown(from_date)
            }
            
            return {"success": True, "data": metrics}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _get_date_from_range(self, time_range: str) -> Optional[datetime]:
        """Convert time range string to datetime"""
        if time_range == 'all':
            return None
        
        days_map = {'7d': 7, '30d': 30, '90d': 90}
        days = days_map.get(time_range, 30)
        return datetime.now() - timedelta(days=days)
    
    def _get_total_applications(self, from_date: Optional[datetime]) -> int:
        """Get total number of applications in time range"""
        try:
            query = """
            SELECT COUNT(*) as total
            FROM applications
            WHERE ($1::timestamptz IS NULL OR created_at >= $1)
            """
            
            result = self.db.client.rpc('exec_sql', {
                'sql': query,
                'params': [from_date.isoformat() if from_date else None]
            }).execute()
            
            return result.data[0]['total'] if result.data else 0
            
        except Exception as e:
            print(f"Error getting total applications: {e}")
            return 0
    
    def _get_completion_rate(self, from_date: Optional[datetime]) -> float:
        """Calculate application completion rate"""
        try:
            query = """
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE completed = true) as completed
            FROM applications
            WHERE ($1::timestamptz IS NULL OR created_at >= $1)
            """
            
            result = self.db.client.rpc('exec_sql', {
                'sql': query,
                'params': [from_date.isoformat() if from_date else None]
            }).execute()
            
            if result.data and result.data[0]['total'] > 0:
                total = result.data[0]['total']
                completed = result.data[0]['completed']
                return round((completed / total) * 100, 1)
            
            return 0.0
            
        except Exception as e:
            print(f"Error calculating completion rate: {e}")
            return 0.0
    
    def _get_average_call_duration(self, from_date: Optional[datetime]) -> float:
        """Calculate average call duration in minutes"""
        try:
            query = """
            SELECT AVG(duration_seconds) as avg_duration
            FROM call_logs
            WHERE status IN ('completed', 'ended')
            AND ($1::timestamptz IS NULL OR created_at >= $1)
            AND duration_seconds > 0
            """
            
            result = self.db.client.rpc('exec_sql', {
                'sql': query,
                'params': [from_date.isoformat() if from_date else None]
            }).execute()
            
            if result.data and result.data[0]['avg_duration']:
                # Convert seconds to minutes
                avg_seconds = float(result.data[0]['avg_duration'])
                return round(avg_seconds / 60, 1)
            
            return 0.0
            
        except Exception as e:
            print(f"Error calculating average call duration: {e}")
            return 0.0
    
    def _get_conversion_rate(self, from_date: Optional[datetime]) -> float:
        """Calculate lead to completed application conversion rate"""
        try:
            # This assumes applications with calls are leads that converted
            query = """
            SELECT 
                COUNT(DISTINCT a.id) as total_with_calls,
                COUNT(DISTINCT a.id) FILTER (WHERE a.completed = true) as completed_with_calls
            FROM applications a
            INNER JOIN call_logs c ON a.id = c.application_id
            WHERE ($1::timestamptz IS NULL OR a.created_at >= $1)
            """
            
            result = self.db.client.rpc('exec_sql', {
                'sql': query,
                'params': [from_date.isoformat() if from_date else None]
            }).execute()
            
            if result.data and result.data[0]['total_with_calls'] > 0:
                total = result.data[0]['total_with_calls']
                completed = result.data[0]['completed_with_calls']
                return round((completed / total) * 100, 1)
            
            return 0.0
            
        except Exception as e:
            print(f"Error calculating conversion rate: {e}")
            return 0.0
    
    def _get_applications_over_time(self, from_date: Optional[datetime], time_range: str) -> List[Dict]:
        """Get applications created over time for charting"""
        try:
            # Determine grouping interval
            if time_range == '7d':
                interval = 'day'
                date_format = 'YYYY-MM-DD'
            elif time_range == '30d':
                interval = 'day'
                date_format = 'YYYY-MM-DD'
            else:
                interval = 'week'
                date_format = 'YYYY-"W"WW'
            
            query = f"""
            SELECT 
                DATE_TRUNC('{interval}', created_at) as period,
                TO_CHAR(DATE_TRUNC('{interval}', created_at), '{date_format}') as label,
                COUNT(*) as applications,
                COUNT(*) FILTER (WHERE completed = true) as completed
            FROM applications
            WHERE ($1::timestamptz IS NULL OR created_at >= $1)
            GROUP BY DATE_TRUNC('{interval}', created_at)
            ORDER BY period
            """
            
            result = self.db.client.rpc('exec_sql', {
                'sql': query,
                'params': [from_date.isoformat() if from_date else None]
            }).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            print(f"Error getting applications over time: {e}")
            return []
    
    def _get_call_success_rate(self, from_date: Optional[datetime]) -> List[Dict]:
        """Get call success rate data for charting"""
        try:
            query = """
            SELECT 
                status,
                COUNT(*) as count
            FROM call_logs
            WHERE ($1::timestamptz IS NULL OR created_at >= $1)
            GROUP BY status
            ORDER BY count DESC
            """
            
            result = self.db.client.rpc('exec_sql', {
                'sql': query,
                'params': [from_date.isoformat() if from_date else None]
            }).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            print(f"Error getting call success rate: {e}")
            return []
    
    def _get_recent_activity(self, limit: int = 10) -> List[Dict]:
        """Get recent activity feed"""
        try:
            query = """
            SELECT 
                'application_created' as type,
                a.id,
                a.first_name || ' ' || a.last_name as name,
                a.email,
                a.created_at as timestamp,
                'Created new application' as description
            FROM applications a
            
            UNION ALL
            
            SELECT 
                'application_completed' as type,
                a.id,
                a.first_name || ' ' || a.last_name as name,
                a.email,
                a.updated_at as timestamp,
                'Completed application' as description
            FROM applications a
            WHERE a.completed = true
            
            UNION ALL
            
            SELECT 
                'call_completed' as type,
                c.application_id as id,
                a.first_name || ' ' || a.last_name as name,
                a.email,
                c.ended_at as timestamp,
                'Completed voice call (' || ROUND(c.duration_seconds::decimal / 60, 1) || ' min)' as description
            FROM call_logs c
            LEFT JOIN applications a ON c.application_id = a.id
            WHERE c.status IN ('completed', 'ended') AND c.ended_at IS NOT NULL
            
            ORDER BY timestamp DESC
            LIMIT $1
            """
            
            result = self.db.client.rpc('exec_sql', {
                'sql': query,
                'params': [limit]
            }).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            print(f"Error getting recent activity: {e}")
            return []
    
    def _get_source_breakdown(self, from_date: Optional[datetime]) -> List[Dict]:
        """Get breakdown of application sources (voice vs web)"""
        try:
            query = """
            SELECT 
                CASE 
                    WHEN c.id IS NOT NULL THEN 'Voice'
                    ELSE 'Web'
                END as source,
                COUNT(*) as count,
                COUNT(*) FILTER (WHERE a.completed = true) as completed
            FROM applications a
            LEFT JOIN call_logs c ON a.id = c.application_id
            WHERE ($1::timestamptz IS NULL OR a.created_at >= $1)
            GROUP BY (c.id IS NOT NULL)
            ORDER BY count DESC
            """
            
            result = self.db.client.rpc('exec_sql', {
                'sql': query,
                'params': [from_date.isoformat() if from_date else None]
            }).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            print(f"Error getting source breakdown: {e}")
            return []
    
    def _get_status_breakdown(self, from_date: Optional[datetime]) -> List[Dict]:
        """Get breakdown of application statuses"""
        try:
            query = """
            SELECT 
                CASE 
                    WHEN completed = true THEN 'Completed'
                    WHEN current_step >= 2 THEN 'In Progress'
                    ELSE 'Started'
                END as status,
                COUNT(*) as count
            FROM applications
            WHERE ($1::timestamptz IS NULL OR created_at >= $1)
            GROUP BY (
                CASE 
                    WHEN completed = true THEN 'Completed'
                    WHEN current_step >= 2 THEN 'In Progress'
                    ELSE 'Started'
                END
            )
            ORDER BY count DESC
            """
            
            result = self.db.client.rpc('exec_sql', {
                'sql': query,
                'params': [from_date.isoformat() if from_date else None]
            }).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            print(f"Error getting status breakdown: {e}")
            return []
    
    def get_application_details_with_calls(self, application_id: str) -> Dict[str, Any]:
        """Get application with associated call logs"""
        try:
            # Get application details
            app_result = self.db.get_application_by_id(application_id)
            if not app_result.get('success'):
                return app_result
            
            # Get associated call logs
            query = """
            SELECT 
                id,
                vapi_call_id,
                status,
                duration_seconds,
                started_at,
                ended_at,
                transcript_summary,
                cost_total,
                created_at
            FROM call_logs
            WHERE application_id = $1
            ORDER BY created_at DESC
            """
            
            call_result = self.db.client.rpc('exec_sql', {
                'sql': query,
                'params': [application_id]
            }).execute()
            
            application = app_result['data']
            application['call_logs'] = call_result.data if call_result.data else []
            
            return {"success": True, "data": application}
            
        except Exception as e:
            return {"success": False, "error": str(e)}


# Helper functions for the analytics service
def calculate_progress_percentage(application: Dict) -> int:
    """Calculate application completion percentage"""
    if application.get('completed'):
        return 100
    
    # Count filled fields (basic progress calculation)
    fields_to_check = [
        'first_name', 'last_name', 'email', 'phone', 
        'date_of_birth', 'loan_amount_requested', 'property_address',
        'employment_type', 'annual_income'
    ]
    
    filled_fields = sum(1 for field in fields_to_check if application.get(field))
    return int((filled_fields / len(fields_to_check)) * 100)


def format_relative_time(timestamp_str: str) -> str:
    """Format timestamp as relative time (e.g., '2 hours ago')"""
    try:
        timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        now = datetime.now(timestamp.tzinfo)
        diff = now - timestamp
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
            
    except Exception:
        return "Unknown"


if __name__ == "__main__":
    # Test the analytics service
    analytics = AnalyticsService()
    
    # Test dashboard metrics
    print("Testing dashboard metrics...")
    metrics = analytics.get_dashboard_metrics('30d')
    print(f"Metrics result: {metrics}")
    
    # Test individual application details
    print("\nTesting application details...")
    # Note: Replace with actual application ID for testing
    # details = analytics.get_application_details_with_calls('some-uuid')
    # print(f"Application details: {details}")
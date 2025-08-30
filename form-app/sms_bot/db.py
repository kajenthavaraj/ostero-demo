# Database functions for app.py
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from supabase import create_client, Client
from datetime import datetime
import os
import json


SUPABASE_URL = os.getenv("SUPABASE_URL", "https://totgazkleqdkdsebyahk.supabase.co")
SUPABASE_PUBLIC_KEY = os.getenv("SUPABASE_PUBLIC_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdGdhemtsZXFka2RzZWJ5YWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTI1NjUsImV4cCI6MjA3MDk2ODU2NX0.1I-_jpS_EuuPfmk2F7ZCvBn5wYJ1SD0ExzD3DwulJ4Q")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_PUBLIC_KEY)


class ApplicationRecord(BaseModel):
    id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    user_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_legal_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    marital_status: Optional[str] = None
    what_looking_to_do: Optional[str] = None
    property_address: Optional[str] = None
    property_type: Optional[str] = None
    property_value: Optional[str] = None
    mortgage_balance: Optional[str] = None
    property_use: Optional[str] = None
    loan_amount_requested: Optional[str] = None
    loan_purpose: Optional[str] = None
    employment_type: Optional[str] = None
    annual_income: Optional[str] = None
    other_income_sources: Optional[List[Dict[str, Any]]] = None
    current_bank: Optional[str] = None
    current_step: Optional[int] = None
    completed: Optional[bool] = None


class DatabaseManager:
    def __init__(self):
        self.client = supabase
    
    def create_application(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if 'other_income_sources' in application_data and isinstance(application_data['other_income_sources'], str):
                try:
                    application_data['other_income_sources'] = json.loads(application_data['other_income_sources'])
                except json.JSONDecodeError:
                    application_data['other_income_sources'] = []
            
            result = self.client.table('applications').insert(application_data).execute()
            return {"success": True, "data": result.data[0] if result.data else None}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_application_by_id(self, application_id: str) -> Dict[str, Any]:
        try:
            result = self.client.table('applications').select("*").eq('id', application_id).execute()
            if result.data:
                return {"success": True, "data": result.data[0]}
            else:
                return {"success": False, "error": "Application not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_application_by_email(self, email: str) -> Dict[str, Any]:
        try:
            result = self.client.table('applications').select("*").eq('email', email).execute()
            if result.data:
                return {"success": True, "data": result.data[0]}
            else:
                return {"success": False, "error": "Application not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_application_by_phone(self, phone: str) -> Dict[str, Any]:
        try:
            result = self.client.table('applications').select("*").eq('phone', phone).execute()
            if result.data:
                return {"success": True, "data": result.data[0]}
            else:
                return {"success": False, "error": "Application not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_application(self, application_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if 'other_income_sources' in update_data and isinstance(update_data['other_income_sources'], str):
                try:
                    update_data['other_income_sources'] = json.loads(update_data['other_income_sources'])
                except json.JSONDecodeError:
                    update_data['other_income_sources'] = []
            
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            result = self.client.table('applications').update(update_data).eq('id', application_id).execute()
            if result.data:
                return {"success": True, "data": result.data[0]}
            else:
                return {"success": False, "error": "Application not found or no changes made"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_application_field(self, application_id: str, field_name: str, field_value: Any) -> Dict[str, Any]:
        try:
            update_data = {field_name: field_value, 'updated_at': datetime.utcnow().isoformat()}
            
            if field_name == 'other_income_sources' and isinstance(field_value, str):
                try:
                    update_data[field_name] = json.loads(field_value)
                except json.JSONDecodeError:
                    update_data[field_name] = []
            
            result = self.client.table('applications').update(update_data).eq('id', application_id).execute()
            if result.data:
                return {"success": True, "data": result.data[0]}
            else:
                return {"success": False, "error": "Application not found or no changes made"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_application_field(self, application_id: str, field_name: str) -> Dict[str, Any]:
        try:
            result = self.client.table('applications').select(field_name).eq('id', application_id).execute()
            if result.data and result.data[0]:
                return {"success": True, "data": result.data[0].get(field_name)}
            else:
                return {"success": False, "error": "Application not found or field not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def delete_application(self, application_id: str) -> Dict[str, Any]:
        try:
            result = self.client.table('applications').delete().eq('id', application_id).execute()
            return {"success": True, "message": "Application deleted successfully"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_applications(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        try:
            result = self.client.table('applications').select("*").range(offset, offset + limit - 1).execute()
            return {"success": True, "data": result.data, "count": len(result.data)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def search_applications(self, search_params: Dict[str, Any]) -> Dict[str, Any]:
        try:
            query = self.client.table('applications').select("*")
            
            for field, value in search_params.items():
                if value is not None:
                    if isinstance(value, str) and field in ['first_name', 'last_name', 'email', 'property_address']:
                        query = query.ilike(field, f"%{value}%")
                    else:
                        query = query.eq(field, value)
            
            result = query.execute()
            return {"success": True, "data": result.data, "count": len(result.data)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_applications_by_status(self, completed: bool = None) -> Dict[str, Any]:
        try:
            query = self.client.table('applications').select("*")
            if completed is not None:
                query = query.eq('completed', completed)
            
            result = query.execute()
            return {"success": True, "data": result.data, "count": len(result.data)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_missing_fields(self, application_id: str) -> Dict[str, Any]:
        try:
            result = self.client.table('applications').select("*").eq('id', application_id).execute()
            if not result.data:
                return {"success": False, "error": "Application not found"}
            
            application_data = result.data[0]
            
            required_fields = [
                'first_name',
                'last_name', 
                'email',
                'phone',
                'date_of_birth',
                'marital_status',
                'what_looking_to_do',
                'property_address',
                'property_type',
                'property_value',
                'property_use',
                'loan_amount_requested',
                'loan_purpose',
                'employment_type',
                'annual_income',
                'current_bank'
            ]
            
            missing_fields = []
            for field in required_fields:
                value = application_data.get(field)
                if value is None or (isinstance(value, str) and value.strip() == ""):
                    missing_fields.append(field)
            
            return {"success": True, "missing_fields": missing_fields, "total_missing": len(missing_fields)}
        except Exception as e:
            return {"success": False, "error": str(e)}


db_manager = DatabaseManager()


def create_application(application_data: Dict[str, Any]) -> Dict[str, Any]:
    return db_manager.create_application(application_data)

def get_application(application_id: str) -> Dict[str, Any]:
    return db_manager.get_application_by_id(application_id)

def update_application(application_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    return db_manager.update_application(application_id, update_data)

def update_field(application_id: str, field_name: str, field_value: Any) -> Dict[str, Any]:
    return db_manager.update_application_field(application_id, field_name, field_value)

def get_field(application_id: str, field_name: str) -> Dict[str, Any]:
    return db_manager.get_application_field(application_id, field_name)

def delete_application(application_id: str) -> Dict[str, Any]:
    return db_manager.delete_application(application_id)

def search_applications(**kwargs) -> Dict[str, Any]:
    return db_manager.search_applications(kwargs)

def list_all_applications(limit: int = 50, offset: int = 0) -> Dict[str, Any]:
    return db_manager.list_applications(limit, offset)

def get_missing_fields(application_id: str) -> Dict[str, Any]:
    return db_manager.get_missing_fields(application_id)



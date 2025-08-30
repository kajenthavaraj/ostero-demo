// Supabase Database Types
// This matches the existing database schema

export interface Database {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          user_id?: string
          first_name?: string
          last_name?: string
          full_legal_name?: string
          email?: string
          phone?: string
          date_of_birth?: string
          marital_status?: string
          what_looking_to_do?: string
          property_address?: string
          property_type?: string
          property_value?: string
          mortgage_balance?: string
          property_use?: string
          loan_amount_requested?: string
          loan_purpose?: string
          employment_type?: string
          annual_income?: string
          other_income_sources?: any
          current_bank?: string
          current_step?: number
          completed?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          full_legal_name?: string
          email?: string
          phone?: string
          date_of_birth?: string
          marital_status?: string
          what_looking_to_do?: string
          property_address?: string
          property_type?: string
          property_value?: string
          mortgage_balance?: string
          property_use?: string
          loan_amount_requested?: string
          loan_purpose?: string
          employment_type?: string
          annual_income?: string
          other_income_sources?: any
          current_bank?: string
          current_step?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          full_legal_name?: string
          email?: string
          phone?: string
          date_of_birth?: string
          marital_status?: string
          what_looking_to_do?: string
          property_address?: string
          property_type?: string
          property_value?: string
          mortgage_balance?: string
          property_use?: string
          loan_amount_requested?: string
          loan_purpose?: string
          employment_type?: string
          annual_income?: string
          other_income_sources?: any
          current_bank?: string
          current_step?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      call_logs: {
        Row: {
          id: string
          application_id?: string
          vapi_call_id: string
          phone_number?: string
          status: string
          duration_seconds?: number
          started_at?: string
          ended_at?: string
          transcript_summary?: string
          full_transcript?: any
          extracted_data?: any
          cost_total?: number
          cost_breakdown?: any
          performance_metrics?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id?: string
          vapi_call_id: string
          phone_number?: string
          status?: string
          duration_seconds?: number
          started_at?: string
          ended_at?: string
          transcript_summary?: string
          full_transcript?: any
          extracted_data?: any
          cost_total?: number
          cost_breakdown?: any
          performance_metrics?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          vapi_call_id?: string
          phone_number?: string
          status?: string
          duration_seconds?: number
          started_at?: string
          ended_at?: string
          transcript_summary?: string
          full_transcript?: any
          extracted_data?: any
          cost_total?: number
          cost_breakdown?: any
          performance_metrics?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
// Core application types for the dashboard

export interface Application {
  id: string
  user_id?: string
  
  // Basic Information
  first_name?: string
  last_name?: string
  full_legal_name?: string
  email?: string
  phone?: string
  
  // Personal Information
  date_of_birth?: string
  ssn?: string
  marital_status?: string
  what_looking_to_do?: string
  
  // Property & Loan Details
  property_address?: string
  property_type?: string
  property_value?: string
  mortgage_balance?: string
  property_use?: string
  loan_amount_requested?: string
  loan_purpose?: string
  
  // Employment & Financial
  employment_status?: string
  employment_type?: string
  employer_name?: string
  job_title?: string
  annual_income?: string
  other_income_sources?: OtherIncomeSource[]
  current_bank?: string
  current_address?: string
  previous_address?: string
  desired_loan_amount?: string
  credit_score?: string
  
  // Application State
  current_step?: number
  completed?: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface OtherIncomeSource {
  description: string
  amount: string
}

export interface CallLog {
  id: string
  application_id?: string
  vapi_call_id: string
  phone_number?: string
  status: CallStatus
  duration_seconds?: number
  started_at?: string
  ended_at?: string
  transcript_summary?: string
  full_transcript?: TranscriptMessage[]
  extracted_data?: Record<string, any>
  cost_total?: number
  cost_breakdown?: Record<string, any>
  performance_metrics?: Record<string, any>
  created_at: string
  updated_at: string
  
  // Joined application data
  applications?: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
  }
}

export type CallStatus = 
  | 'queued' 
  | 'ringing' 
  | 'in-progress' 
  | 'completed' 
  | 'ended' 
  | 'failed' 
  | 'cancelled'
  | 'unknown'

export interface TranscriptMessage {
  role: 'bot' | 'user' | 'assistant' | 'customer'
  message: string
  time?: number
  endTime?: number
  secondsFromStart?: number
  duration?: number
}

// Dashboard Analytics Types
export interface DashboardMetrics {
  total_applications: number
  completion_rate: number
  average_call_duration: number
  conversion_rate: number
  applications_over_time: TimeSeriesData[]
  call_success_rate: CallStatusData[]
  recent_activity: ActivityItem[]
  source_breakdown: SourceData[]
  status_breakdown: StatusData[]
}

export interface TimeSeriesData {
  period: string
  label: string
  applications: number
  completed: number
}

export interface CallStatusData {
  status: string
  count: number
}

export interface ActivityItem {
  type: 'application_created' | 'application_completed' | 'call_completed'
  id: string
  name: string
  email: string
  timestamp: string
  description: string
}

export interface SourceData {
  source: 'Voice' | 'Web'
  count: number
  completed: number
}

export interface StatusData {
  status: 'Completed' | 'In Progress' | 'Started'
  count: number
}

// Filter Types
export interface ApplicationFilters {
  status: 'all' | 'completed' | 'in_progress' | 'started'
  dateRange: '7d' | '30d' | '90d' | 'all'
  source: 'all' | 'voice' | 'web'
  searchTerm?: string
}

export interface CallFilters {
  status: CallStatus | 'all'
  dateRange: '7d' | '30d' | '90d' | 'all'
  applicationId?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  count?: number
  total?: number
  page?: number
  limit?: number
}

// Form Types
export interface ApplicationFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  full_legal_name?: string
  date_of_birth?: Date
  marital_status: string
  what_looking_to_do: string
  loan_amount_requested: string
  property_address: string
  property_type: string
  property_value: string
  property_use: string
  employment_type: string
  annual_income: string
  other_income_sources: OtherIncomeSource[]
}
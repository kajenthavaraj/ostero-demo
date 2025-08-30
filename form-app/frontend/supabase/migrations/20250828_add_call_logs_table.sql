-- Create call_logs table for tracking VAPI voice calls
-- Migration: 20250828_add_call_logs_table.sql

CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Link to application
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  
  -- VAPI call information
  vapi_call_id TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  
  -- Call status and metadata
  status TEXT NOT NULL DEFAULT 'unknown', 
  -- Possible values: 'queued', 'ringing', 'in-progress', 'completed', 'ended', 'failed', 'cancelled'
  
  -- Call timing
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Call content and analysis
  transcript_summary TEXT,
  full_transcript JSONB, -- Store the complete transcript messages array
  extracted_data JSONB, -- Store the AI-extracted information
  
  -- Cost tracking
  cost_total DECIMAL(10,4) DEFAULT 0,
  cost_breakdown JSONB, -- Store detailed cost information
  
  -- Performance metrics
  performance_metrics JSONB, -- Store latency and other performance data
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_call_logs_application_id ON public.call_logs(application_id);
CREATE INDEX idx_call_logs_vapi_call_id ON public.call_logs(vapi_call_id);
CREATE INDEX idx_call_logs_status ON public.call_logs(status);
CREATE INDEX idx_call_logs_phone_number ON public.call_logs(phone_number);
CREATE INDEX idx_call_logs_created_at ON public.call_logs(created_at DESC);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for now (can be restricted later)
CREATE POLICY "Enable all operations for call_logs" ON public.call_logs
    FOR ALL USING (true);

-- Update trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_call_logs_updated_at 
  BEFORE UPDATE ON public.call_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some helpful comments
COMMENT ON TABLE public.call_logs IS 'Tracks all VAPI voice calls and their outcomes';
COMMENT ON COLUMN public.call_logs.vapi_call_id IS 'Unique identifier from VAPI system';
COMMENT ON COLUMN public.call_logs.full_transcript IS 'Complete transcript with role and message objects';
COMMENT ON COLUMN public.call_logs.extracted_data IS 'AI-extracted structured data from the call';
COMMENT ON COLUMN public.call_logs.cost_breakdown IS 'Detailed cost information from VAPI';
COMMENT ON COLUMN public.call_logs.performance_metrics IS 'Latency and performance data from VAPI';
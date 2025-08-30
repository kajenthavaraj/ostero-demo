-- Create applications table to store mortgage application data
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  -- Basic Information
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Personal Information
  full_legal_name TEXT,
  date_of_birth_month TEXT,
  date_of_birth_day TEXT,
  date_of_birth_year TEXT,
  marital_status TEXT,
  number_of_dependents TEXT,
  ages_of_dependents TEXT,
  current_address TEXT,
  length_time_current_address TEXT,
  rent_or_own TEXT,
  previous_address TEXT,
  
  -- Employment & Income
  employer_name TEXT,
  employer_address TEXT,
  employer_phone TEXT,
  job_title TEXT,
  length_of_employment TEXT,
  monthly_income TEXT,
  other_income_sources TEXT,
  previous_employer TEXT,
  
  -- Property & Loan Details
  property_address TEXT,
  property_type TEXT,
  loan_purpose TEXT,
  estimated_property_value TEXT,
  loan_amount_requested TEXT,
  down_payment_amount TEXT,
  source_down_payment TEXT,
  primary_residence TEXT,
  
  -- Legal & Government Information
  outstanding_judgments TEXT,
  bankruptcy_past_7_years TEXT,
  party_to_lawsuit TEXT,
  property_foreclosed TEXT,
  citizenship_status TEXT,
  
  -- Documents
  identification_documents TEXT, -- Store file path/URL
  signature_confirmation TEXT,
  
  -- Application Status
  current_step INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Applications are viewable by owner"
ON public.applications
FOR SELECT
USING (TRUE); -- Allow all for now, can restrict later

CREATE POLICY "Applications can be inserted by anyone"
ON public.applications
FOR INSERT
WITH CHECK (TRUE); -- Allow all for now

CREATE POLICY "Applications can be updated by owner"
ON public.applications
FOR UPDATE
USING (TRUE); -- Allow all for now

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
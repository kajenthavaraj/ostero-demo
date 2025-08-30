-- Update applications table to match new form structure
-- Remove old fields that are not needed
ALTER TABLE applications 
DROP COLUMN IF EXISTS date_of_birth_year,
DROP COLUMN IF EXISTS date_of_birth_month,
DROP COLUMN IF EXISTS date_of_birth_day,
DROP COLUMN IF EXISTS number_of_dependents,
DROP COLUMN IF EXISTS ages_of_dependents,
DROP COLUMN IF EXISTS current_address,
DROP COLUMN IF EXISTS length_time_current_address,
DROP COLUMN IF EXISTS rent_or_own,
DROP COLUMN IF EXISTS previous_address,
DROP COLUMN IF EXISTS employer_name,
DROP COLUMN IF EXISTS employer_address,
DROP COLUMN IF EXISTS employer_phone,
DROP COLUMN IF EXISTS job_title,
DROP COLUMN IF EXISTS length_of_employment,
DROP COLUMN IF EXISTS monthly_income,
DROP COLUMN IF EXISTS other_income_sources,
DROP COLUMN IF EXISTS previous_employer,
DROP COLUMN IF EXISTS property_address,
DROP COLUMN IF EXISTS estimated_property_value,
DROP COLUMN IF EXISTS down_payment_amount,
DROP COLUMN IF EXISTS source_down_payment,
DROP COLUMN IF EXISTS primary_residence,
DROP COLUMN IF EXISTS outstanding_judgments,
DROP COLUMN IF EXISTS bankruptcy_past_7_years,
DROP COLUMN IF EXISTS party_to_lawsuit,
DROP COLUMN IF EXISTS property_foreclosed,
DROP COLUMN IF EXISTS citizenship_status,
DROP COLUMN IF EXISTS signature_confirmation,
DROP COLUMN IF EXISTS identification_documents;

-- Add new fields for the updated form structure
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS what_looking_to_do TEXT,
ADD COLUMN IF NOT EXISTS property_address TEXT,
ADD COLUMN IF NOT EXISTS property_value TEXT,
ADD COLUMN IF NOT EXISTS mortgage_balance TEXT,
ADD COLUMN IF NOT EXISTS property_use TEXT,
ADD COLUMN IF NOT EXISTS employment_type TEXT,
ADD COLUMN IF NOT EXISTS annual_income TEXT,
ADD COLUMN IF NOT EXISTS other_income_sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS current_bank TEXT;

-- Update trigger to handle updated_at
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
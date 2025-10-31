-- Create client_intake table for new client submissions
CREATE TABLE IF NOT EXISTS client_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_website TEXT,
  business_description TEXT,
  industry TEXT,
  primary_clinic TEXT NOT NULL,
  secondary_clinics TEXT[],
  lead_consultant TEXT,
  semester TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_client_intake_clinic ON client_intake(primary_clinic);
CREATE INDEX IF NOT EXISTS idx_client_intake_status ON client_intake(status);
CREATE INDEX IF NOT EXISTS idx_client_intake_semester ON client_intake(semester);

-- Enable Row Level Security
ALTER TABLE client_intake ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on client_intake" ON client_intake
  FOR ALL USING (true) WITH CHECK (true);

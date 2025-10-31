-- Create debriefs table to store student weekly debrief submissions
CREATE TABLE IF NOT EXISTS debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student information
  student_id UUID REFERENCES students(id),
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  
  -- Client and clinic information
  client_name TEXT NOT NULL,
  clinic TEXT NOT NULL,
  
  -- Debrief details
  hours_worked DECIMAL(5,2) NOT NULL,
  work_summary TEXT NOT NULL,
  questions TEXT,
  
  -- Metadata
  week_ending DATE NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status tracking
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_debriefs_student_id ON debriefs(student_id);
CREATE INDEX IF NOT EXISTS idx_debriefs_student_email ON debriefs(student_email);
CREATE INDEX IF NOT EXISTS idx_debriefs_client_name ON debriefs(client_name);
CREATE INDEX IF NOT EXISTS idx_debriefs_clinic ON debriefs(clinic);
CREATE INDEX IF NOT EXISTS idx_debriefs_week_ending ON debriefs(week_ending);
CREATE INDEX IF NOT EXISTS idx_debriefs_date_submitted ON debriefs(date_submitted);
CREATE INDEX IF NOT EXISTS idx_debriefs_status ON debriefs(status);

-- Create composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_debriefs_week_clinic ON debriefs(week_ending, clinic);

-- Enable Row Level Security
ALTER TABLE debriefs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Students can view their own debriefs
CREATE POLICY "Students can view own debriefs"
  ON debriefs FOR SELECT
  USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Students can insert their own debriefs
CREATE POLICY "Students can insert own debriefs"
  ON debriefs FOR INSERT
  WITH CHECK (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Students can update their own draft debriefs
CREATE POLICY "Students can update own draft debriefs"
  ON debriefs FOR UPDATE
  USING (
    student_email = current_setting('request.jwt.claims', true)::json->>'email'
    AND status = 'draft'
  );

-- Directors can view all debriefs (for now, allow all reads for the app)
CREATE POLICY "Allow all reads for app"
  ON debriefs FOR SELECT
  USING (true);

-- Allow all inserts for the app (we'll handle auth in the API layer)
CREATE POLICY "Allow all inserts for app"
  ON debriefs FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_debriefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_debriefs_updated_at
  BEFORE UPDATE ON debriefs
  FOR EACH ROW
  EXECUTE FUNCTION update_debriefs_updated_at();

-- Add comment to table
COMMENT ON TABLE debriefs IS 'Stores student weekly debrief submissions for the SEED program';

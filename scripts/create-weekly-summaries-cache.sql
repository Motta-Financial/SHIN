-- Create table for caching weekly AI-generated summaries
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  week_ending DATE NOT NULL,
  clinic TEXT NOT NULL,
  summary TEXT NOT NULL,
  student_count INTEGER NOT NULL,
  total_hours DECIMAL NOT NULL,
  activity_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_name, week_ending)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week ON weekly_summaries(week_ending);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_client ON weekly_summaries(client_name);

-- Enable Row Level Security
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on weekly_summaries" ON weekly_summaries
  FOR ALL
  USING (true)
  WITH CHECK (true);

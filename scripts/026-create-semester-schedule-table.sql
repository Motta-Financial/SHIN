-- Create semester_schedule table for weekly schedule data
CREATE TABLE IF NOT EXISTS semester_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  semester TEXT NOT NULL,
  week_number INTEGER,
  week_label TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  class_number INTEGER,
  session_focus TEXT,
  time_breakdown TEXT,
  in_class_activity TEXT,
  assignments TEXT,
  is_break BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_semester_schedule_semester ON semester_schedule(semester);
CREATE INDEX IF NOT EXISTS idx_semester_schedule_week_end ON semester_schedule(week_end);

-- Enable RLS
ALTER TABLE semester_schedule ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to semester_schedule" ON semester_schedule
  FOR SELECT USING (true);

-- Allow admins full access
CREATE POLICY "Allow admins full access to semester_schedule" ON semester_schedule
  FOR ALL USING (true);

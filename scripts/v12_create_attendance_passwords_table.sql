-- Create attendance_passwords table to store weekly unique passwords
CREATE TABLE IF NOT EXISTS attendance_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL,
  semester_id UUID REFERENCES semester_config(id),
  password TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(semester_id, week_number)
);

-- Enable RLS
ALTER TABLE attendance_passwords ENABLE ROW LEVEL SECURITY;

-- Allow admins and directors to manage passwords
CREATE POLICY "admins_manage_attendance_passwords" ON attendance_passwords
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_user_meta_data->>'role' = 'director'
      )
    )
  );

-- Allow students to read passwords (for validation)
CREATE POLICY "students_read_attendance_passwords" ON attendance_passwords
  FOR SELECT USING (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_attendance_passwords_semester_week 
  ON attendance_passwords(semester_id, week_number);

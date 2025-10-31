-- Create attendance table in Supabase
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  student_name TEXT NOT NULL,
  student_email TEXT,
  clinic TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  class_date DATE NOT NULL,
  week_ending DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_week ON attendance(week_ending);
CREATE INDEX IF NOT EXISTS idx_attendance_clinic ON attendance(clinic);

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth setup)
CREATE POLICY "Allow all operations on attendance" ON attendance
  FOR ALL USING (true) WITH CHECK (true);

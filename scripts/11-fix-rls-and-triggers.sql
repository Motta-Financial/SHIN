-- Fix RLS policies for weekly_client_agenda table
ALTER TABLE weekly_client_agenda ENABLE ROW LEVEL SECURITY;

-- Allow public read access to weekly agenda
CREATE POLICY "Allow public read access to weekly_client_agenda" ON weekly_client_agenda
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert on weekly_client_agenda" ON weekly_client_agenda
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on weekly_client_agenda" ON weekly_client_agenda
  FOR UPDATE TO authenticated USING (true);

-- Create profile trigger function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student', -- default role
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add indexes for performance on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_debriefs_week_ending ON debriefs(week_ending);
CREATE INDEX IF NOT EXISTS idx_debriefs_student_email ON debriefs(student_email);
CREATE INDEX IF NOT EXISTS idx_debriefs_clinic ON debriefs(clinic);
CREATE INDEX IF NOT EXISTS idx_attendance_week_ending ON attendance(week_ending);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_clinic ON students(clinic);
CREATE INDEX IF NOT EXISTS idx_directors_email ON directors(email);

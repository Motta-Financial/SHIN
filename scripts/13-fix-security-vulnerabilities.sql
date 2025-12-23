-- SECURITY ENHANCEMENT SCRIPT
-- This script fixes critical security vulnerabilities in the database

-- 1. Fix weekly_client_agenda table - NO RLS POLICIES (Critical vulnerability!)
ALTER TABLE weekly_client_agenda ENABLE ROW LEVEL SECURITY;

-- Allow admins and directors full access
CREATE POLICY "admins_full_access_agenda" ON weekly_client_agenda
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Students can only read their clinic's agenda
CREATE POLICY "students_read_clinic_agenda" ON weekly_client_agenda
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.user_id = auth.uid()
      AND students.clinic = weekly_client_agenda.clinic
    )
  );

-- 2. Strengthen profiles table policies
DROP POLICY IF EXISTS "Public read profiles" ON profiles;

CREATE POLICY "authenticated_read_own_profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin = true);

-- 3. Add missing indexes for better query performance and security
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_debriefs_user_id ON debriefs(user_id);
CREATE INDEX IF NOT EXISTS idx_debriefs_student_id ON debriefs(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_user_id ON agenda_items(created_by_user_id);

-- 4. Add data validation constraints
ALTER TABLE students 
  ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE directors
  ADD CONSTRAINT valid_director_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 5. Enable RLS on all public tables (double-check)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE debriefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_dates ENABLE ROW LEVEL SECURITY;

-- 6. Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "admins_read_audit_logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 7. Create function to log sensitive changes
CREATE OR REPLACE FUNCTION log_sensitive_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers on sensitive tables
DROP TRIGGER IF EXISTS audit_profiles_changes ON profiles;
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_change();

DROP TRIGGER IF EXISTS audit_students_changes ON students;
CREATE TRIGGER audit_students_changes
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_change();

DROP TRIGGER IF EXISTS audit_directors_changes ON directors;
CREATE TRIGGER audit_directors_changes
  AFTER INSERT OR UPDATE OR DELETE ON directors
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_change();

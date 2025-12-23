CREATE TABLE IF NOT EXISTS public.team_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  note_text text NOT NULL,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_pinned boolean DEFAULT false,
  category text DEFAULT 'general' -- 'general', 'meeting', 'deliverable', 'question'
);

-- Enable RLS
ALTER TABLE public.team_notes ENABLE ROW LEVEL SECURITY;

-- Students can read notes for their assigned clients
CREATE POLICY "students_read_team_notes" ON public.team_notes
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM public.client_assignments
      WHERE student_id IN (
        SELECT id FROM public.students WHERE email = auth.jwt()->>'email'
      )
    )
  );

-- Students can insert notes for their assigned clients
CREATE POLICY "students_insert_team_notes" ON public.team_notes
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM public.client_assignments
      WHERE student_id IN (
        SELECT id FROM public.students WHERE email = auth.jwt()->>'email'
      )
    )
  );

-- Students can update their own notes
CREATE POLICY "students_update_own_team_notes" ON public.team_notes
  FOR UPDATE
  USING (created_by_user_id = auth.uid());

-- Students can delete their own notes
CREATE POLICY "students_delete_own_team_notes" ON public.team_notes
  FOR DELETE
  USING (created_by_user_id = auth.uid());

-- Directors can read all team notes
CREATE POLICY "directors_read_all_team_notes" ON public.team_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'director' OR is_admin = true)
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_notes_client_id ON public.team_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_team_notes_created_by ON public.team_notes(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_team_notes_created_at ON public.team_notes(created_at DESC);

-- Add audit trigger
CREATE TRIGGER audit_team_notes
  AFTER INSERT OR UPDATE OR DELETE ON public.team_notes
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

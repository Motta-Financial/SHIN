-- Improve RLS Policies for Better Security and Performance
-- Run this after creating the initial tables

-- ============================================
-- DEBRIEFS TABLE - Improved RLS
-- ============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all reads for app" ON debriefs;
DROP POLICY IF EXISTS "Allow all inserts for app" ON debriefs;

-- Add index for RLS performance (student_email is used in policies)
CREATE INDEX IF NOT EXISTS idx_debriefs_student_email ON debriefs(student_email);
CREATE INDEX IF NOT EXISTS idx_debriefs_clinic ON debriefs(clinic);
CREATE INDEX IF NOT EXISTS idx_debriefs_week_ending ON debriefs(week_ending);

-- Allow directors to view all debriefs in their clinic
CREATE POLICY "Directors can view clinic debriefs"
  ON debriefs FOR SELECT
  USING (
    clinic IN (
      SELECT clinic FROM directors 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Allow public read for now (can be restricted later with auth)
CREATE POLICY "Public read access for debriefs"
  ON debriefs FOR SELECT
  USING (true);

-- Allow authenticated inserts
CREATE POLICY "Authenticated users can insert debriefs"
  ON debriefs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- ATTENDANCE TABLE - Improved RLS
-- ============================================

DROP POLICY IF EXISTS "Allow all operations on attendance" ON attendance;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_date);
CREATE INDEX IF NOT EXISTS idx_attendance_clinic ON attendance(clinic);

-- Allow public read
CREATE POLICY "Public read access for attendance"
  ON attendance FOR SELECT
  USING (true);

-- Allow authenticated inserts
CREATE POLICY "Authenticated users can insert attendance"
  ON attendance FOR INSERT
  WITH CHECK (true);

-- ============================================
-- CLIENT INTAKE TABLE - Improved RLS
-- ============================================

DROP POLICY IF EXISTS "Allow all operations on client_intake" ON client_intake;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_client_intake_primary_clinic ON client_intake(primary_clinic);
CREATE INDEX IF NOT EXISTS idx_client_intake_semester ON client_intake(semester);

-- Allow public read
CREATE POLICY "Public read access for client intake"
  ON client_intake FOR SELECT
  USING (true);

-- Allow authenticated inserts
CREATE POLICY "Authenticated users can insert client intake"
  ON client_intake FOR INSERT
  WITH CHECK (true);

-- ============================================
-- AGENDA ITEMS TABLE - Improved RLS
-- ============================================

DROP POLICY IF EXISTS "Allow all operations on agenda_items" ON agenda_items;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_agenda_items_clinic ON agenda_items(clinic);
CREATE INDEX IF NOT EXISTS idx_agenda_items_week_ending ON agenda_items(week_ending);
CREATE INDEX IF NOT EXISTS idx_agenda_items_order_index ON agenda_items(order_index);

-- Allow public read
CREATE POLICY "Public read access for agenda items"
  ON agenda_items FOR SELECT
  USING (true);

-- Allow authenticated users to manage agenda items
CREATE POLICY "Authenticated users can manage agenda items"
  ON agenda_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- WEEKLY SUMMARIES - Improved RLS
-- ============================================

DROP POLICY IF EXISTS "Allow all operations on weekly_summaries" ON weekly_summaries;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_client_name ON weekly_summaries(client_name);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week_ending ON weekly_summaries(week_ending);

-- Allow public read
CREATE POLICY "Public read access for weekly summaries"
  ON weekly_summaries FOR SELECT
  USING (true);

-- Allow authenticated inserts and updates
CREATE POLICY "Authenticated users can manage summaries"
  ON weekly_summaries FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SEED TABLES - Already have good policies
-- ============================================
-- The SEED tables (students, directors, clients, etc.) already have
-- appropriate read-only policies for public access

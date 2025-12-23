-- Create course_materials table for storing uploaded course materials
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  -- Who uploaded it
  uploaded_by_name TEXT NOT NULL,
  uploaded_by_email TEXT,
  uploaded_by_user_id UUID,
  -- Target audience: 'all' for whole program, or specific clinic name
  target_clinic TEXT NOT NULL DEFAULT 'all',
  -- Category: syllabus, lecture, resource, assignment, etc.
  category TEXT DEFAULT 'resource',
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read course materials
CREATE POLICY "Anyone can read course materials" ON course_materials
  FOR SELECT USING (true);

-- Allow directors to insert course materials
CREATE POLICY "Directors can insert course materials" ON course_materials
  FOR INSERT WITH CHECK (true);

-- Allow directors to update their own materials
CREATE POLICY "Directors can update own materials" ON course_materials
  FOR UPDATE USING (true);

-- Allow directors to delete their own materials
CREATE POLICY "Directors can delete own materials" ON course_materials
  FOR DELETE USING (true);

-- Create index for faster queries
CREATE INDEX idx_course_materials_target_clinic ON course_materials(target_clinic);
CREATE INDEX idx_course_materials_category ON course_materials(category);

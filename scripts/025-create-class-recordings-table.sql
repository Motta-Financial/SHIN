-- Create class_recordings table for storing weekly zoom recordings
CREATE TABLE IF NOT EXISTS class_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  week_number INTEGER NOT NULL,
  semester TEXT NOT NULL DEFAULT 'Spring 2025',
  duration_minutes INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE,
  uploaded_by TEXT NOT NULL,
  uploader_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE class_recordings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to class recordings" ON class_recordings FOR SELECT USING (true);
CREATE POLICY "Allow insert for directors" ON class_recordings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete for uploaders" ON class_recordings FOR DELETE USING (true);

-- Create published_agendas table for storing posted weekly agendas
CREATE TABLE IF NOT EXISTS published_agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_date DATE NOT NULL,
  director_name TEXT,
  zoom_link TEXT,
  schedule_data JSONB NOT NULL,
  notes TEXT,
  published_by TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  semester TEXT NOT NULL DEFAULT 'Spring 2025',
  is_current BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE published_agendas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to published agendas" ON published_agendas FOR SELECT USING (true);
CREATE POLICY "Allow insert for directors" ON published_agendas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for directors" ON published_agendas FOR UPDATE USING (true);

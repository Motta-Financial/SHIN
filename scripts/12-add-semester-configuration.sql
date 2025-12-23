-- Create semester configuration table for tracking academic calendar
CREATE TABLE IF NOT EXISTS semester_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_name TEXT NOT NULL, -- e.g., "Fall 2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create key dates table for important semester milestones
CREATE TABLE IF NOT EXISTS key_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID REFERENCES semester_config(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT, -- 'midterm', 'presentation', 'deadline', 'break', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add week_number helper function
CREATE OR REPLACE FUNCTION get_week_number(check_date DATE, semester_start DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(EXTRACT(DAY FROM (check_date - semester_start)) / 7) + 1;
END;
$$ LANGUAGE plpgsql;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_semester_config_active ON semester_config(is_active);
CREATE INDEX IF NOT EXISTS idx_key_dates_semester ON key_dates(semester_id);
CREATE INDEX IF NOT EXISTS idx_key_dates_date ON key_dates(date);

-- Enable RLS
ALTER TABLE semester_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies - everyone can read, only admins can modify
CREATE POLICY "Anyone can read semester config"
  ON semester_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage semester config"
  ON semester_config FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

CREATE POLICY "Anyone can read key dates"
  ON key_dates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage key dates"
  ON key_dates FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

-- Insert default Fall 2025 semester
INSERT INTO semester_config (semester_name, start_date, end_date, is_active)
VALUES ('Fall 2025', '2025-09-01', '2025-12-20', true)
ON CONFLICT DO NOTHING;

-- Add week_number column to existing tables if not present
ALTER TABLE debriefs 
  ADD COLUMN IF NOT EXISTS week_number INTEGER;

ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS week_number INTEGER;

-- Create trigger to auto-calculate week numbers
CREATE OR REPLACE FUNCTION set_week_number()
RETURNS TRIGGER AS $$
DECLARE
  semester_start DATE;
BEGIN
  -- Get the active semester start date
  SELECT start_date INTO semester_start
  FROM semester_config
  WHERE is_active = true
  LIMIT 1;
  
  -- Calculate week number if we have a week_ending date
  IF NEW.week_ending IS NOT NULL AND semester_start IS NOT NULL THEN
    NEW.week_number := get_week_number(NEW.week_ending, semester_start);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-set week numbers
DROP TRIGGER IF EXISTS set_debrief_week_number ON debriefs;
CREATE TRIGGER set_debrief_week_number
  BEFORE INSERT OR UPDATE ON debriefs
  FOR EACH ROW
  EXECUTE FUNCTION set_week_number();

DROP TRIGGER IF EXISTS set_attendance_week_number ON attendance;
CREATE TRIGGER set_attendance_week_number
  BEFORE INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION set_week_number();

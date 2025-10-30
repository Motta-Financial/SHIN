-- Create agenda items table
CREATE TABLE IF NOT EXISTS agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  type TEXT DEFAULT 'event', -- 'event', 'deadline', 'meeting', 'reminder'
  clinic TEXT, -- null means all clinics
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_agenda_date ON agenda_items(date);
CREATE INDEX IF NOT EXISTS idx_agenda_clinic ON agenda_items(clinic);

-- Enable Row Level Security
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth needs)
CREATE POLICY "Allow all operations on agenda_items" ON agenda_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

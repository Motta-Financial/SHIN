-- Drop the old agenda table and create a new weekly_client_agenda table
DROP TABLE IF EXISTS agenda;

CREATE TABLE IF NOT EXISTS weekly_client_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  week_ending DATE NOT NULL,
  clinic TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_name, week_ending, clinic)
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_client_agenda_week_clinic ON weekly_client_agenda(week_ending, clinic);

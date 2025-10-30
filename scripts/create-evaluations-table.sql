-- Create evaluations table for midterm presentation evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  director_name TEXT NOT NULL,
  question_1_rating INTEGER CHECK (question_1_rating >= 1 AND question_1_rating <= 5),
  question_2_rating INTEGER CHECK (question_2_rating >= 1 AND question_2_rating <= 5),
  question_3_rating INTEGER CHECK (question_3_rating >= 1 AND question_3_rating <= 5),
  question_4_rating INTEGER CHECK (question_4_rating >= 1 AND question_4_rating <= 5),
  question_5_rating INTEGER CHECK (question_5_rating >= 1 AND question_5_rating <= 5),
  additional_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, director_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_evaluations_document_id ON evaluations(document_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_director_name ON evaluations(director_name);

-- Add RLS policies
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read evaluations (visible to everyone)
CREATE POLICY "Allow public read access" ON evaluations
  FOR SELECT USING (true);

-- Allow anyone to insert evaluations
CREATE POLICY "Allow public insert access" ON evaluations
  FOR INSERT WITH CHECK (true);

-- Allow directors to update their own evaluations
CREATE POLICY "Allow directors to update own evaluations" ON evaluations
  FOR UPDATE USING (true);

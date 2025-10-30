-- Add notes columns to evaluations table
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS question_1_notes TEXT,
ADD COLUMN IF NOT EXISTS question_2_notes TEXT,
ADD COLUMN IF NOT EXISTS question_3_notes TEXT,
ADD COLUMN IF NOT EXISTS question_4_notes TEXT,
ADD COLUMN IF NOT EXISTS question_5_notes TEXT;

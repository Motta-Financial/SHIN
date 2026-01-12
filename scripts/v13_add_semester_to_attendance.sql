-- Add semester_id column to attendance table if it doesn't exist
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS semester_id UUID;

-- Set default semester_id to Spring 2026 for existing records
UPDATE attendance 
SET semester_id = 'a1b2c3d4-e5f6-7890-abcd-202601120000'
WHERE semester_id IS NULL;

-- Add foreign key constraint
ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_semester
FOREIGN KEY (semester_id) REFERENCES semesters(id)
ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_semester_id ON attendance(semester_id);

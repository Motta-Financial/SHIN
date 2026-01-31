-- Make student_id nullable in notifications table
-- This allows director-targeted notifications which don't have a student_id

ALTER TABLE notifications 
ALTER COLUMN student_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'student_id';

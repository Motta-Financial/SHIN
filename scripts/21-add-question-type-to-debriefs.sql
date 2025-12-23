-- Add question_type column to debriefs table
-- question_type: 'clinic' (for clinic director) or 'client' (for client primary director/all directors)
ALTER TABLE debriefs ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'clinic';

-- Create index for filtering by question type
CREATE INDEX IF NOT EXISTS idx_debriefs_question_type ON debriefs(question_type);

-- Update the notification trigger to handle question routing
CREATE OR REPLACE FUNCTION create_question_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_director_id uuid;
    target_clinic text;
BEGIN
    IF NEW.questions IS NOT NULL AND NEW.questions != '' THEN
        -- Get the appropriate director based on question type
        IF NEW.question_type = 'client' THEN
            -- For client/general questions, get the client's primary director
            SELECT c.primary_director_id INTO target_director_id
            FROM clients c
            JOIN students s ON s.client_id = c.id
            WHERE s.id = NEW.student_id;
            
            -- Create notification for primary client director
            IF target_director_id IS NOT NULL THEN
                INSERT INTO notifications (
                    type,
                    title,
                    message,
                    related_id,
                    student_name,
                    student_email,
                    clinic,
                    director_id,
                    created_by_user_id
                )
                VALUES (
                    'question',
                    'Client Engagement Question',
                    NEW.student_name || ' asked about client engagement: ' || LEFT(NEW.questions, 100),
                    NEW.id,
                    NEW.student_name,
                    NEW.student_email,
                    NEW.clinic,
                    target_director_id,
                    NEW.user_id
                );
            END IF;
        ELSE
            -- For clinic-specific questions, get the clinic director(s)
            -- Create notifications for all clinic directors
            INSERT INTO notifications (
                type,
                title,
                message,
                related_id,
                student_name,
                student_email,
                clinic,
                director_id,
                created_by_user_id
            )
            SELECT 
                'question',
                'Clinic Question',
                NEW.student_name || ' asked (clinic-specific): ' || LEFT(NEW.questions, 100),
                NEW.id,
                NEW.student_name,
                NEW.student_email,
                NEW.clinic,
                cd.director_id,
                NEW.user_id
            FROM clinic_directors cd
            JOIN clinics cl ON cl.id = cd.clinic_id
            WHERE cl.name = NEW.clinic;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_question_notification ON debriefs;
CREATE TRIGGER trigger_question_notification
    AFTER INSERT OR UPDATE ON debriefs
    FOR EACH ROW
    WHEN (NEW.questions IS NOT NULL AND NEW.questions != '')
    EXECUTE FUNCTION create_question_notification();

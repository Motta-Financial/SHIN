-- Create notifications table for director alerts
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('document_upload', 'question', 'meeting_request')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- document_id, debrief_id, or meeting_request_id
    student_name TEXT,
    student_email TEXT,
    clinic TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by_user_id UUID,
    director_id UUID
);

-- Create meeting_requests table
CREATE TABLE IF NOT EXISTS meeting_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_id UUID,
    clinic TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    preferred_dates TEXT[], -- Array of preferred date/times
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_director ON notifications(director_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_status ON meeting_requests(status);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_student ON meeting_requests(student_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY directors_read_own_notifications ON notifications
    FOR SELECT
    USING (
        director_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY directors_update_own_notifications ON notifications
    FOR UPDATE
    USING (
        director_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- RLS Policies for meeting_requests
CREATE POLICY students_insert_own_meeting_requests ON meeting_requests
    FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY students_read_own_meeting_requests ON meeting_requests
    FOR SELECT
    USING (student_id = auth.uid());

CREATE POLICY directors_read_all_meeting_requests ON meeting_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'director' OR profiles.is_admin = true)
        )
    );

CREATE POLICY directors_update_meeting_requests ON meeting_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'director' OR profiles.is_admin = true)
        )
    );

-- Function to auto-create notifications for new documents
CREATE OR REPLACE FUNCTION create_document_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (
        type,
        title,
        message,
        related_id,
        student_name,
        student_email,
        clinic,
        created_by_user_id
    )
    VALUES (
        'document_upload',
        'New Document Upload',
        NEW.student_name || ' uploaded ' || NEW.file_name,
        NEW.id,
        NEW.student_name,
        NULL,
        NEW.clinic,
        NEW.uploaded_by_user_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for document uploads
DROP TRIGGER IF EXISTS trigger_document_notification ON documents;
CREATE TRIGGER trigger_document_notification
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION create_document_notification();

-- Function to auto-create notifications for questions in debriefs
CREATE OR REPLACE FUNCTION create_question_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.questions IS NOT NULL AND NEW.questions != '' THEN
        INSERT INTO notifications (
            type,
            title,
            message,
            related_id,
            student_name,
            student_email,
            clinic,
            created_by_user_id
        )
        VALUES (
            'question',
            'Student Question',
            NEW.student_name || ' asked: ' || LEFT(NEW.questions, 100),
            NEW.id,
            NEW.student_name,
            NEW.student_email,
            NEW.clinic,
            NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for debrief questions
DROP TRIGGER IF EXISTS trigger_question_notification ON debriefs;
CREATE TRIGGER trigger_question_notification
    AFTER INSERT OR UPDATE ON debriefs
    FOR EACH ROW
    WHEN (NEW.questions IS NOT NULL AND NEW.questions != '')
    EXECUTE FUNCTION create_question_notification();

-- Function to auto-create notifications for meeting requests
CREATE OR REPLACE FUNCTION create_meeting_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (
        type,
        title,
        message,
        related_id,
        student_name,
        student_email,
        clinic,
        created_by_user_id
    )
    VALUES (
        'meeting_request',
        'Meeting Request',
        NEW.student_name || ' requested a meeting: ' || NEW.subject,
        NEW.id,
        NEW.student_name,
        NEW.student_email,
        NEW.clinic,
        NEW.student_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for meeting requests
DROP TRIGGER IF EXISTS trigger_meeting_notification ON meeting_requests;
CREATE TRIGGER trigger_meeting_notification
    AFTER INSERT ON meeting_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_meeting_notification();

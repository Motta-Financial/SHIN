-- Create discussion_posts table for client and clinic discussions
CREATE TABLE IF NOT EXISTS discussion_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type text NOT NULL, -- 'client' or 'clinic'
  context_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  author_type text NOT NULL, -- 'student', 'director', 'client'
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create discussion_replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES discussion_posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  author_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_discussion_posts_context ON discussion_posts(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_post ON discussion_replies(post_id);

-- Enable RLS
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for discussion_posts
CREATE POLICY "Allow all reads on discussion_posts" ON discussion_posts FOR SELECT USING (true);
CREATE POLICY "Allow inserts on discussion_posts" ON discussion_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow updates on discussion_posts" ON discussion_posts FOR UPDATE USING (true);

-- Create policies for discussion_replies
CREATE POLICY "Allow all reads on discussion_replies" ON discussion_replies FOR SELECT USING (true);
CREATE POLICY "Allow inserts on discussion_replies" ON discussion_replies FOR INSERT WITH CHECK (true);

-- Add student_notifications table for director announcements to students
CREATE TABLE IF NOT EXISTS student_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id),
  clinic_id uuid REFERENCES clinics(id),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'announcement', -- 'announcement', 'reminder', 'alert'
  is_read boolean DEFAULT false,
  created_by text,
  created_by_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_notifications_student ON student_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notifications_clinic ON student_notifications(clinic_id);

ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reads on student_notifications" ON student_notifications FOR SELECT USING (true);
CREATE POLICY "Allow inserts on student_notifications" ON student_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow updates on student_notifications" ON student_notifications FOR UPDATE USING (true);

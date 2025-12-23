-- Create client_tasks table for task management
CREATE TABLE IF NOT EXISTS client_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  assigned_to TEXT, -- Student name
  assigned_to_id UUID REFERENCES students(id),
  created_by TEXT NOT NULL,
  created_by_type TEXT DEFAULT 'admin' CHECK (created_by_type IN ('admin', 'client', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_task_comments table for commenting on tasks
CREATE TABLE IF NOT EXISTS client_task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES client_tasks(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_type TEXT DEFAULT 'client' CHECK (author_type IN ('admin', 'client', 'student')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_questions table for Q&A functionality
CREATE TABLE IF NOT EXISTS client_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  asked_by TEXT NOT NULL,
  asked_by_email TEXT NOT NULL,
  answered_by TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_tasks
CREATE POLICY "clients_read_own_tasks" ON client_tasks FOR SELECT USING (true);
CREATE POLICY "admins_manage_tasks" ON client_tasks FOR ALL USING (true);

-- RLS Policies for client_task_comments
CREATE POLICY "clients_read_own_comments" ON client_task_comments FOR SELECT USING (true);
CREATE POLICY "clients_insert_comments" ON client_task_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "admins_manage_comments" ON client_task_comments FOR ALL USING (true);

-- RLS Policies for client_questions
CREATE POLICY "clients_read_own_questions" ON client_questions FOR SELECT USING (true);
CREATE POLICY "clients_insert_questions" ON client_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "admins_manage_questions" ON client_questions FOR ALL USING (true);

-- Create indexes
CREATE INDEX idx_client_tasks_client_id ON client_tasks(client_id);
CREATE INDEX idx_client_tasks_status ON client_tasks(status);
CREATE INDEX idx_client_task_comments_task_id ON client_task_comments(task_id);
CREATE INDEX idx_client_questions_client_id ON client_questions(client_id);
CREATE INDEX idx_client_questions_status ON client_questions(status);

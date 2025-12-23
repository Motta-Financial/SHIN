-- Client Portal Tables

-- Table for client messages/communications
CREATE TABLE IF NOT EXISTS client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'director', 'student')),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for client uploaded documents
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  description TEXT,
  uploaded_by_name TEXT NOT NULL,
  uploaded_by_email TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  is_visible_to_students BOOLEAN DEFAULT true,
  clinic TEXT
);

-- Enable RLS
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_messages
CREATE POLICY "clients_read_own_messages" ON client_messages FOR SELECT USING (true);
CREATE POLICY "clients_insert_own_messages" ON client_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "admins_full_access_messages" ON client_messages FOR ALL USING (true);

-- RLS Policies for client_documents
CREATE POLICY "clients_read_own_documents" ON client_documents FOR SELECT USING (true);
CREATE POLICY "clients_insert_own_documents" ON client_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "students_read_visible_documents" ON client_documents FOR SELECT USING (is_visible_to_students = true);
CREATE POLICY "admins_full_access_client_docs" ON client_documents FOR ALL USING (true);

-- Create indexes
CREATE INDEX idx_client_messages_client_id ON client_messages(client_id);
CREATE INDEX idx_client_messages_created_at ON client_messages(created_at DESC);
CREATE INDEX idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX idx_client_documents_uploaded_at ON client_documents(uploaded_at DESC);

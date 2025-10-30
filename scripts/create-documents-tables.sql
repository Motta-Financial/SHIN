-- Create documents table to store uploaded files
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  clinic TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_reviews table for director comments and grades
CREATE TABLE IF NOT EXISTS document_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  director_name TEXT NOT NULL,
  comment TEXT,
  grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_name);
CREATE INDEX IF NOT EXISTS idx_documents_student ON documents(student_name);
CREATE INDEX IF NOT EXISTS idx_document_reviews_document ON document_reviews(document_id);

-- Add new columns to documents table for chunked uploads
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS submission_type TEXT,
ADD COLUMN IF NOT EXISTS chunk_urls JSONB,
ADD COLUMN IF NOT EXISTS upload_id TEXT;

-- Add index on upload_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_upload_id ON documents(upload_id);

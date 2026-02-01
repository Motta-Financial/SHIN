-- Add debrief and tracking columns to meeting_requests table
ALTER TABLE meeting_requests 
ADD COLUMN IF NOT EXISTS debrief_notes TEXT,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Add index for faster querying by status
CREATE INDEX IF NOT EXISTS idx_meeting_requests_status ON meeting_requests(status);

-- Add index for faster ordering by creation date
CREATE INDEX IF NOT EXISTS idx_meeting_requests_created_at ON meeting_requests(created_at);

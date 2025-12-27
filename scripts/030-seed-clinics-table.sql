-- Seed the clinics table with all four clinics
-- This ensures the clinic filter dropdown has all options

INSERT INTO clinics (id, name, created_at)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Accounting', NOW()),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Marketing', NOW()),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Consulting', NOW()),
  ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Resource Acquisition', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  created_at = COALESCE(clinics.created_at, EXCLUDED.created_at);

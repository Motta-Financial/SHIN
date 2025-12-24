-- Migration: Create comprehensive mapping view
-- This view is the SINGLE SOURCE OF TRUTH for all entity relationships
-- It contains ALL necessary IDs for filtering, not text-based matching

-- Drop existing view if it exists
DROP VIEW IF EXISTS v_complete_mapping;

-- Create the comprehensive mapping view
CREATE OR REPLACE VIEW v_complete_mapping AS
SELECT 
  -- Student info (IDs and display names)
  s.id AS student_id,
  s.full_name AS student_name,
  s.email AS student_email,
  
  -- Student's Clinic (via clinic_students junction table)
  cs.clinic_id AS student_clinic_id,
  c_student.name AS student_clinic_name,
  
  -- Student's Client (via client_assignments junction table)
  ca.client_id,
  cl.name AS client_name,
  ca.role AS student_role,
  
  -- Clinic Director (via clinic_directors junction table)
  -- A clinic can have multiple directors, so we get the first one or use a specific role
  cd.director_id AS clinic_director_id,
  d_clinic.full_name AS clinic_director_name,
  d_clinic.email AS clinic_director_email,
  
  -- Client Primary Director (via clients.primary_director_id)
  cl.primary_director_id AS client_director_id,
  d_client.full_name AS client_director_name,
  d_client.email AS client_director_email,
  
  -- Semester for filtering by term
  COALESCE(cs.semester, ca.semester, s.semester) AS semester,
  
  -- Client status for filtering active engagements
  cl.status AS client_status,
  
  -- Timestamps
  s.created_at AS student_created_at

FROM students s

-- Join to get student's clinic via clinic_students
LEFT JOIN clinic_students cs ON s.id = cs.student_id

-- Join to get clinic details
LEFT JOIN clinics c_student ON cs.clinic_id = c_student.id

-- Join to get student's client assignment
LEFT JOIN client_assignments ca ON s.id = ca.student_id

-- Join to get client details
LEFT JOIN clients cl ON ca.client_id = cl.id

-- Join to get clinic director (via clinic_directors table)
-- Using DISTINCT ON to get one director per clinic if multiple exist
LEFT JOIN LATERAL (
  SELECT director_id 
  FROM clinic_directors 
  WHERE clinic_id = cs.clinic_id 
  ORDER BY created_at ASC
  LIMIT 1
) cd ON true

-- Join to get clinic director details
LEFT JOIN directors d_clinic ON cd.director_id = d_clinic.id

-- Join to get client's primary director
LEFT JOIN directors d_client ON cl.primary_director_id = d_client.id;

-- Add comment to the view
COMMENT ON VIEW v_complete_mapping IS 'LOCKED: Single source of truth for all student-clinic-client-director relationships. Use IDs for filtering, text fields for display only.';

-- Grant appropriate permissions
GRANT SELECT ON v_complete_mapping TO authenticated;
GRANT SELECT ON v_complete_mapping TO anon;

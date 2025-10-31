-- Create client assignments based on student client_team assignments

INSERT INTO client_assignments (client_id, student_id, clinic, role)
SELECT 
  c.id as client_id,
  s.id as student_id,
  s.clinic,
  CASE 
    WHEN s.is_team_leader THEN 'Team Leader'
    ELSE 'Team Member'
  END as role
FROM students s
JOIN clients c ON c.name = s.client_team
WHERE s.client_team IS NOT NULL
ON CONFLICT (client_id, student_id) DO UPDATE SET
  clinic = EXCLUDED.clinic,
  role = EXCLUDED.role;

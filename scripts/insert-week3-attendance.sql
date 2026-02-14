-- Insert week 3 attendance for all current semester students
-- All students present except: Tisila Binte Khalil Etu, Han Dao, Aaron Blatt

-- First, get the week 3 schedule entry and current semester
WITH week3 AS (
  SELECT ss.id AS schedule_id, ss.semester_id, ss.week_number, ss.week_start, ss.week_end
  FROM semester_schedule ss
  JOIN app_settings a ON a.current_semester_id = ss.semester_id
  WHERE ss.week_number = 3
  AND ss.is_break = false
  LIMIT 1
),
-- Get all students in the current semester via v_complete_mapping
current_students AS (
  SELECT DISTINCT
    s.id AS student_id,
    s.name AS student_name,
    s.email AS student_email,
    cm.clinic_id
  FROM students s
  JOIN clinic_memberships cm ON cm.student_id = s.id
  JOIN week3 w ON cm.semester_id = w.semester_id
  WHERE cm.role IN ('Student', 'Team Leader')
)
INSERT INTO attendance (
  student_id,
  student_name,
  student_email,
  clinic_id,
  semester_id,
  week_number,
  week_ending,
  status,
  submitted_at,
  password_verified
)
SELECT
  cs.student_id,
  cs.student_name,
  cs.student_email,
  cs.clinic_id,
  w.semester_id,
  w.week_number,
  w.week_end,
  CASE
    WHEN cs.student_email IN (
      'TisilaBinteKhalil.Etu@su.suffolk.edu',
      'Han.Dao@su.suffolk.edu',
      'Aaron.Blatt@su.suffolk.edu'
    ) THEN 'absent'
    ELSE 'present'
  END,
  NOW(),
  true
FROM current_students cs
CROSS JOIN week3 w
WHERE NOT EXISTS (
  SELECT 1 FROM attendance a
  WHERE a.student_id = cs.student_id
  AND a.week_number = w.week_number
  AND a.semester_id = w.semester_id
);

-- Insert week 3 attendance for all current semester students
-- All students present except: Tisila Binte Khalil Etu, Han Dao, Aaron Blatt

WITH current_sem AS (
  SELECT value AS semester_id
  FROM app_settings
  WHERE key = 'current_semester_id'
  LIMIT 1
),
week3 AS (
  SELECT ss.id AS schedule_id, ss.semester_id, ss.week_number, ss.week_start, ss.week_end
  FROM semester_schedule ss
  JOIN current_sem cs ON cs.semester_id = ss.semester_id
  WHERE ss.week_number = 3
    AND ss.is_break = false
  LIMIT 1
),
current_students AS (
  SELECT DISTINCT
    s.id AS student_id,
    s.full_name AS student_name,
    s.email AS student_email,
    s.clinic AS student_clinic,
    s.user_id AS student_user_id
  FROM students_current s
)
INSERT INTO attendance (
  student_id,
  student_name,
  student_email,
  clinic,
  semester_id,
  week_number,
  week_ending,
  class_date,
  is_present,
  is_excused,
  user_id
)
SELECT
  cs.student_id,
  cs.student_name,
  cs.student_email,
  cs.student_clinic,
  w.semester_id,
  w.week_number,
  w.week_end,
  w.week_start,
  CASE
    WHEN cs.student_email IN (
      'TisilaBinteKhalil.Etu@su.suffolk.edu',
      'Han.Dao@su.suffolk.edu',
      'Aaron.Blatt@su.suffolk.edu'
    ) THEN false
    ELSE true
  END,
  false,
  cs.student_user_id
FROM current_students cs
CROSS JOIN week3 w
WHERE NOT EXISTS (
  SELECT 1 FROM attendance a
  WHERE a.student_id = cs.student_id
    AND a.week_number = w.week_number
    AND a.semester_id = w.semester_id
);

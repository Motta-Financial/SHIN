-- Insert directors data from SEED-Roster CSV

INSERT INTO directors (full_name, email, clinic, job_title, role) VALUES
  ('Dat Le', 'dmle@suffolk.edu', 'Accounting Clinic', 'CLINIC DIRECTOR (ACCT)', 'Clinic Director'),
  ('Mark Dwyer', 'Mark.Dwyer@suffolk.edu', 'Accounting Clinic', 'CLINIC DIRECTOR (ACCT)', 'Clinic Director'),
  ('Ken Mooney', 'kmooney@suffolk.edu', 'Resource Clinic', 'CLINIC DIRECTOR (FUND)', 'Clinic Director'),
  ('Nick Vadala', 'nvadala@suffolk.edu', 'Consulting Clinic', 'CLINIC DIRECTOR (CONSULT)', 'Clinic Director'),
  ('Beth DiRusso', 'Elizabeth.DiRusso@suffolk.edu', 'Legal Clinic', 'CLINIC DIRECTOR (SEED)', 'Clinic Director'),
  ('Chris Hill', 'Christopher.Hill@suffolk.edu', 'Marketing Clinic', 'CLINIC DIRECTOR (MKTING)', 'Clinic Director'),
  ('Grace Cha', 'HyeeEun.Cha@su.suffolk.edu', 'Accounting Clinic', 'CLINIC SUPPORT (ACCT)', 'Related Personnel'),
  ('Dmitri Tcherevik', 'Dmitri.Tcherevik@suffolk.edu', 'Other', 'CLINIC DIRECTOR (AnyQuest)', 'Related Personnel'),
  ('Chaim Letwin', 'cletwin@suffolk.edu', 'Other', 'CLINIC DIRECTOR (SEED)', 'Related Personnel'),
  ('Boris Lazic', 'blazic@suffolk.edu', 'Other', 'CLINIC DIRECTOR (SEED)', 'Related Personnel')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  clinic = EXCLUDED.clinic,
  job_title = EXCLUDED.job_title,
  role = EXCLUDED.role;

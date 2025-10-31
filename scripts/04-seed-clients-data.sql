-- Insert clients data from SEED-Assignments CSV

INSERT INTO clients (name, contact_name, email, website, project_type) VALUES
  ('Sawyer Parks', 'Hanna Parks', 'hanadenise@gmail.com', NULL, 'Full'),
  ('The Downtown Paw', 'Katherine Cruickshank', 'woof@thedowntownpaw.com', 'https://thedowntownpaw.com/', 'Full'),
  ('City of Malden', 'Alex Pratt', 'apratt@cityofmalden.org', 'https://www.cityofmalden.org/', 'Full'),
  ('REWRITE', 'Alik Christianian', 'alik@rewritebio.com', 'https://rewritebio.com/', 'Full'),
  ('Crown Legends', 'Al Objio', 'alvis1986@gmail.com', 'https://shopcrownlegends.com/', 'Full'),
  ('Marabou Café', 'Paulette & Kishla Firmin', 'kishlafirmin@gmail.com', NULL, 'Full'),
  ('Serene Cycle', 'Jamie Jasmin', 'jamiejasmin@serenecycleco.com', 'https://www.serenecycleco.com/', 'Full'),
  ('Intriguing Hair', 'Nikia Londy', 'nikia.londy@gmail.com', 'https://intriguinghair.com/', 'Full'),
  ('SEED', 'Chaim Letwin, Boris Lazic, Nick Vadala', 'nvadala@suffolk.edu', 'https://boston.suffolk.edu/seed/', 'Full'),
  ('Muffy White', 'Muffy White', 'muffy.l.white@gmail.com', 'https://www.muffywhite.com/', 'Accounting Project'),
  ('Future Masters of Chess Academy', 'Lawyer & Angela Times', 'info@futurechessmasters.com', 'https://futurechessmasters.com/', 'Consulting')
ON CONFLICT (name) DO UPDATE SET
  contact_name = EXCLUDED.contact_name,
  email = EXCLUDED.email,
  website = EXCLUDED.website,
  project_type = EXCLUDED.project_type;

-- Link clients to their primary directors
UPDATE clients SET primary_director_id = (SELECT id FROM directors WHERE full_name = 'Nick Vadala') WHERE name = 'Sawyer Parks';
UPDATE clients SET primary_director_id = (SELECT id FROM directors WHERE full_name = 'Chris Hill') WHERE name = 'The Downtown Paw';
UPDATE clients SET primary_director_id = (SELECT id FROM directors WHERE full_name = 'Nick Vadala') WHERE name = 'City of Malden';
UPDATE clients SET primary_director_id = (SELECT id FROM directors WHERE full_name = 'Chris Hill') WHERE name = 'REWRITE';
UPDATE clients SET primary_director_id = (SELECT id FROM directors WHERE full_name = 'Mark Dwyer') WHERE name = 'Crown Legends';
UPDATE clients SET primary_director_id = (SELECT id FROM directors WHERE full_name = 'Ken Mooney') WHERE name = 'Marabou Café';
UPDATE clients SET primary_director_id = (SELECT id FROM directors WHERE full_name = 'Beth DiRusso') WHERE name = 'Serene Cycle';
UPDATE clients SET primary_director_id = (SELECT id FROM directors WHERE full_name = 'Nick Vadala') WHERE name = 'Intriguing Hair';
UPDATE clients SET primary_director_id = (SELECT id FROM directors WHERE full_name = 'Ken Mooney') WHERE name = 'SEED';
UPDATE clients SET primary_director_id = (SELECT id FROM directors WHERE full_name = 'Mark Dwyer') WHERE name = 'Muffy White';
UPDATE clients SET primary_director_id = (SELECT id FROM directors WHERE full_name = 'Beth DiRusso') WHERE name = 'Future Masters of Chess Academy';

-- Insert the current_semester_id into app_settings
-- The app_settings table is a key-value store with columns: key (text), value (uuid)

INSERT INTO app_settings (key, value)
VALUES ('current_semester_id', 'a1b2c3d4-e5f6-7890-abcd-202601120000')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

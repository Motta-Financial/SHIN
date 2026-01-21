-- Seed the current_semester_id in app_settings
-- The app_settings table is a key-value store with columns: key (text), value (uuid)

-- Insert the current semester ID if it doesn't exist
INSERT INTO app_settings (key, value)
VALUES ('current_semester_id', 'a1b2c3d4-e5f6-7890-abcd-202601120000')
ON CONFLICT (key) DO NOTHING;

-- Verify the setting was created
SELECT * FROM app_settings WHERE key = 'current_semester_id';

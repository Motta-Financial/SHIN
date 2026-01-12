-- STEP 1: Clear the corrupted debriefs data
-- WARNING: This will delete ALL existing debriefs
TRUNCATE TABLE debriefs;

-- Verify it's empty
SELECT COUNT(*) as debrief_count FROM debriefs;

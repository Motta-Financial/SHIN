-- Migration Script: Import Debriefs from CSV
-- This script imports debrief records with proper UUID mappings

-- First, let's create a temporary table to hold the raw CSV data
CREATE TEMP TABLE IF NOT EXISTS temp_debriefs_import (
    date_str TEXT,
    clinic_name TEXT,
    client_name TEXT,
    hours_worked TEXT,
    work_summary TEXT,
    student_name TEXT,
    questions TEXT,
    action_items TEXT
);

-- Note: The actual CSV data will be inserted via the Node.js script below
-- This SQL file is for reference on the table structure

-- Clinic name mappings for data consistency:
-- "Funding" -> "Resource Acquisition"
-- "Consulting" -> "Consulting"
-- "Marketing" -> "Marketing"
-- "Accounting" -> "Accounting"

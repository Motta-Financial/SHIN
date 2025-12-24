-- Migration Script: Import Debriefs from CSV
-- This script migrates debrief data into the debriefs table with proper ID linkages
-- Run this AFTER uploading the CSV data to a temporary table or use the Node.js script below

-- First, let's see the existing students, clients, and clinics to ensure proper mapping
-- SELECT id, full_name, email FROM students;
-- SELECT id, name FROM clients;
-- SELECT id, name FROM clinics;

-- The actual migration will be done via a Node.js script that can:
-- 1. Parse the CSV
-- 2. Look up student_id by student name
-- 3. Look up client_id by client name  
-- 4. Determine week_number from semester_schedule based on date
-- 5. Insert with proper foreign key relationships

-- Clear any duplicate/test data first (optional - uncomment if needed)
-- DELETE FROM debriefs WHERE semester = 'Fall 2025';

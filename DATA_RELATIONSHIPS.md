# SHIN Platform Data Relationships

This document outlines how all data entities in the SHIN platform are connected and mapped to each other.

## Core Entity Relationships

### 1. Students ↔ Clients (Team Assignments)

**Tables Involved:**
- `students` - Contains student information
- `clients` - Contains client/project information  
- `client_assignments` - Junction table linking students to clients

**How They Connect:**
```
students.client_team → clients.name
students.id ↔ client_assignments.student_id
clients.id ↔ client_assignments.client_id
```

**Key Fields:**
- `students.client_team` - Name of the client the student is assigned to
- `students.is_team_leader` - Boolean indicating if student leads the team
- `client_assignments.role` - 'Team Leader' or 'Team Member'

**Example Query:**
```sql
-- Get all students working on a specific client
SELECT s.*, ca.role 
FROM students s
JOIN client_assignments ca ON s.id = ca.student_id
JOIN clients c ON ca.client_id = c.id
WHERE c.name = 'Serene Cycle';
```

---

### 2. Directors ↔ Clients (Oversight)

**Tables Involved:**
- `directors` - Contains director information
- `clients` - Contains client information
- `client_directors` - Junction table linking directors to clients

**How They Connect:**
```
directors.id ↔ client_directors.director_id
clients.id ↔ client_directors.client_id
clients.primary_director_id → directors.id
```

**Key Fields:**
- `client_directors.is_primary` - Boolean indicating primary director
- `clients.primary_director_id` - Direct reference to primary director

---

### 3. Students → Debriefs (Work Tracking)

**Tables Involved:**
- `students` - Student information
- `debriefs` - Weekly work summaries

**How They Connect:**
```
students.id → debriefs.student_id
students.email → debriefs.student_email
students.full_name → debriefs.student_name
```

**Key Fields:**
- `debriefs.week_ending` - Date for the week being reported
- `debriefs.week_number` - Auto-calculated week number (from semester start)
- `debriefs.hours_worked` - Hours logged for that week
- `debriefs.status` - 'draft', 'submitted', 'reviewed'

---

### 4. Students → Attendance (Class Participation)

**Tables Involved:**
- `students` - Student information
- `attendance` - Attendance records

**How They Connect:**
```
students.id → attendance.student_id
students.email → attendance.student_email
students.full_name → attendance.student_name
```

---

### 5. Students → Documents (File Uploads)

**Tables Involved:**
- `students` - Student information
- `documents` - Uploaded files
- `document_reviews` - Director feedback on documents

**How They Connect:**
```
students.full_name → documents.student_name
students.id → documents.uploaded_by_user_id
documents.id ↔ document_reviews.document_id
directors.full_name → document_reviews.director_name
```

---

### 6. Clinic Groupings

**How Clinics Connect Everything:**
All major tables have a `clinic` field that groups entities:

```
students.clinic
clients.clinic (implied through client_assignments)
directors.clinic
debriefs.clinic
attendance.clinic
documents.clinic
```

**Clinic Values:**
- Marketing
- Accounting
- Consulting
- Resource Acquisition

---

### 7. Semester & Week Tracking

**Tables Involved:**
- `semester_config` - Semester date ranges
- `key_dates` - Important dates in the semester

**How Week Numbers Are Calculated:**
```sql
-- Automatic calculation via trigger
week_number = FLOOR((week_ending_date - semester_start_date) / 7) + 1
```

---

## API Endpoints for Data Access

- `GET /api/seed-data` - Students, directors, clients
- `GET /api/supabase/debriefs` - Weekly work submissions
- `GET /api/supabase/roster` - Student roster
- `GET /api/supabase/clients` - Client information
- `GET /api/documents` - Uploaded files
- `GET /api/documents/reviews?documentId=X` - Reviews for a specific document
- `GET /api/semester-config` - Active semester and week calculation
- `GET /api/weekly-client-agenda` - Weekly agenda items by client

---

This structure ensures that all student work is properly tracked, assigned to the right clients and directors, and organized by semester week for easy reporting and review.

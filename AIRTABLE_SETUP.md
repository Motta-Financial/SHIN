# Airtable Setup Guide for SEED| Work Submissions Table

## Create the Work Submissions Table

1. Go to your Airtable base: https://airtable.com/appv3eSA0Ab2lJLe0
2. Click the "+" button to add a new table
3. Name it: **SEED| Work Submissions**

## Required Fields

Create these fields in the following order:

### 1. Student Name (Single line text)
- Field type: Single line text
- Description: Name of the student submitting work

### 2. Student Email (Email)
- Field type: Email
- Description: Student's email address

### 3. Client (Single line text)
- Field type: Single line text
- Description: Client the work is for

### 4. Document URL (URL)
- Field type: URL
- Description: Link to the document (Google Drive, Dropbox, etc.)

### 5. Description (Long text)
- Field type: Long text
- Description: Description of the work and what feedback is needed

### 6. Date Submitted (Date)
- Field type: Date
- Include time: Yes
- Description: When the submission was made

### 7. Status (Single select)
- Field type: Single select
- Options:
  - Pending Review (color: yellow/amber)
  - Reviewed (color: green)
- Default: Pending Review

### 8. Related Clinic (Single select)
- Field type: Single select
- Options:
  - Consulting
  - Accounting
  - Funding
  - Marketing

### 9. Feedback (Long text) - Optional
- Field type: Long text
- Description: Director's feedback on the submission

### 10. Reviewed By (Single line text) - Optional
- Field type: Single line text
- Description: Name of director who reviewed

### 11. Review Date (Date) - Optional
- Field type: Date
- Include time: Yes
- Description: When the work was reviewed

## After Creating the Table

Once you've created the table with all these fields, the document submission feature will work automatically. Students will be able to submit work for feedback, and directors will see the submissions on their dashboard.

## Notes

- The table name must be exactly: **SEED| Work Submissions**
- Field names should match exactly as listed above
- The Status field should default to "Pending Review"
\`\`\`

\`\`\`typescript file="" isHidden

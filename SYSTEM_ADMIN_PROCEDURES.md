All tasks in this document are performed by the SEED Program Director (System Admin) and will follow more specific escalation procedures as applicable in each section.

## User Management

Review annually and/or on staff turnover.

### New User Access

- Requested by the SEED Program Director or designated Clinic Director. Requests are submitted via email to the System Admin with the user's full name, Suffolk email address, and assigned role (Admin, Director, Student, or Client). Role assignment is determined by job function within the SEED program (e.g., students enrolled in the current semester clinic, directors overseeing specific clinics, clients engaged for the semester). Approval is granted by the SEED Program Director.
- Instructions: Adding a New User
  1. Navigate to the Supabase Authentication dashboard (https://supabase.com/dashboard) for the SHIN project.
  2. Create a new user via Supabase Auth using the user's Suffolk email address.
  3. Assign the appropriate role (Admin, Director, Student, or Client) in the `profiles` table, which is automatically created on signup.
  4. For Students: Add the student record to the `students` table with clinic assignment (Marketing, Accounting, Consulting, or Resource Acquisition), client team assignment, and team leader status.
  5. For Directors: Add the director record to the `directors` table with clinic assignment and link to assigned clients via the `client_directors` junction table.
  6. For Clients: Add the client record to the `clients` table and link to assigned students via `client_assignments` and directors via `client_directors`.
  7. Verify the user can log in and access only the data permitted by their role via Row Level Security (RLS) policies.
  8. Document the new user creation via email confirmation to the requesting party.

### Remove User Access

- Requested by the SEED Program Director or designated Clinic Director. Requests are submitted via email to the System Admin with the user's name and reason for removal.
- Instructions: Removing a User
  1. Navigate to the Supabase Authentication dashboard for the SHIN project.
  2. Disable or delete the user's Supabase Auth account (disabling is preferred to preserve audit trail).
  3. Update the user's `profiles` record to mark as inactive if soft-deleting.
  4. If a student: Update the `students` table to set `is_active = false` and remove from `client_assignments`.
  5. Verify the user can no longer authenticate or access any SHIN resources.
  6. Confirm removal via email to the requesting party.

### User Role/Permission Modification

- Requested by the SEED Program Director. Requests are submitted via email to the System Admin specifying the user, current role, and requested new role or permission change. Role modifications are determined by changes in job function (e.g., a student becoming a team leader, or a director taking on additional clinic oversight). Approval is granted by the SEED Program Director.
- Instructions: Modifying a User
  1. Navigate to the Supabase dashboard and locate the user in the `profiles` table.
  2. Update the `role` field to the new role (admin, director, student, or client) and/or update the `is_admin` flag as appropriate.
  3. If modifying student assignments: Update the `students` table (e.g., `is_team_leader`, `client_team`, `clinic`) and the `client_assignments` junction table.
  4. If modifying director assignments: Update the `directors` table and the `client_directors` junction table.
  5. RLS policies will automatically enforce the new access level on the user's next request.
  6. Confirm the modification via email to the requesting party.

## System Administrator Review

- Primary System Admin (SEED Program Director): Review privileged access users annually at the start of each academic year and at the beginning of each semester.
  - The System Admin reviews all users with `is_admin = true` in the `profiles` table and all users with the `director` role. The review is documented via email confirmation to the department head listing all privileged users and their access levels. Any discrepancies are resolved immediately by modifying or removing access.
- Secondary System Admin (designated Clinic Director or ITS liaison):
  - The secondary System Admin is reviewed by the Primary System Admin annually. Review is documented via email confirmation that the secondary admin's access is still appropriate for their current role.

## System Administrator Transition

- In the event of a change in staff for the System Admin role:
  1. The outgoing System Admin's Supabase Auth account is disabled (not deleted, to preserve audit trail).
  2. The outgoing admin's `is_admin` flag in the `profiles` table is set to `false`.
  3. A new Supabase Auth account is created for the incoming System Admin (or their existing account is elevated).
  4. The incoming admin's `is_admin` flag is set to `true` in the `profiles` table.
  5. Vercel project ownership/access is transferred to the incoming admin in the Vercel dashboard.
  6. Supabase project access is updated to grant the incoming admin Owner or Admin access in the Supabase organization settings.
  7. All environment variable access (Clerk keys, Supabase service role key, Vercel Blob token) is rotated and shared securely with the incoming admin.
  8. The transition is documented via email to ITS and the department head with date of transition and names of outgoing/incoming admins.

## System Change Requests

As requested.

### Application Additions/Modifications

- Requested by the SEED Program Director or Clinic Directors. Feature requests and modifications are submitted via email or GitHub Issues on the SHIN repository.
- Instructions:
  1. The requestor submits a description of the desired feature or modification.
  2. The System Admin (or development team) evaluates the request for feasibility and impact.
  3. Approval is granted by the SEED Program Director.
  4. Changes are developed on a feature branch in the GitHub repository connected to the v0/Vercel project.
  5. Changes are previewed in a Vercel Preview Deployment for validation and testing.
  6. The System Admin verifies the feature works as expected, including: data integrity, RLS policy enforcement, no regressions to existing functionality.
  7. Once validated, changes are merged to the main branch and automatically deployed to production via Vercel.
  8. Database schema changes (new tables, columns, RLS policies) are applied via SQL migration scripts in the `/scripts` directory, executed against the Supabase database.
  9. The change is documented in the GitHub commit history and communicated to affected users via email or announcement within the SHIN platform.

### Regularly Scheduled & Emergency Updates

- Regularly scheduled updates are initiated by the development team and approved by the SEED Program Director.
- Instructions:
  1. Platform dependencies (Next.js, Supabase client libraries, shadcn/ui components) are reviewed for updates quarterly.
  2. Updates are applied on a feature branch and tested in a Vercel Preview Deployment.
  3. Supabase platform updates are managed by Supabase and applied automatically to the hosted database; the System Admin monitors the Supabase status page (https://status.supabase.com) and release notes.
  4. Vercel platform updates are managed by Vercel and applied automatically to the hosting infrastructure; the System Admin monitors the Vercel status page (https://www.vercel-status.com).
  5. After testing, updates are merged and deployed to production.
  6. Emergency updates (security patches) are applied immediately following the same branch/preview/merge workflow, with expedited review.
- More Info: Supabase publishes release notes at https://supabase.com/changelog. Vercel publishes release notes at https://vercel.com/changelog. Next.js publishes release notes at https://nextjs.org/blog.
- Error Reconciliation: If an update causes errors, the deployment is rolled back to the previous version via Vercel's instant rollback feature. A GitHub issue is opened to document the error, and the development team investigates. For Supabase-side issues, a support ticket is opened at https://supabase.com/dashboard/support.
- Escalation: If issues are not resolved within 24 hours, escalate to Vercel support (https://vercel.com/help) or Supabase support. For critical production outages affecting student or client access, escalate immediately to ITS and the SEED Program Director.

## System Outages

- Notification comes from automated status monitoring:
  - Vercel sends automated email alerts for deployment failures and downtime via the Vercel dashboard.
  - Supabase sends automated email alerts for database outages via the Supabase dashboard.
  - Application-level errors are surfaced via browser console logs and user-reported issues.
- Instructions: Based on scope of impact as determined by the SEED Program Director, notify SHIN users (students, directors, clients) via email and/or announcement. For outages affecting Suffolk SSO (Clerk authentication), notify Suffolk ITS.
- Continuity Plan:
  - Vercel maintains the most recent successful deployment and can instantly roll back to it.
  - Supabase provides automatic daily database backups with point-in-time recovery.
  - File uploads are stored in Vercel Blob, which has built-in redundancy.
  - In the event of extended outage, directors may use manual tracking (spreadsheets) for attendance and debriefs until the platform is restored. Data can be imported back into SHIN via the admin import tools (`/admin/import-debriefs`, `/admin/schedule`).

## System Log Review

On-going monitoring and/or on significant event(s).

### Integrations

The SHIN platform has the following integrations:

1. **Supabase (Database & Auth)**: PostgreSQL database with Row Level Security. All data reads/writes go through Supabase client libraries. Auth handles user sessions via JWT tokens and HTTP-only cookies. Errors are logged server-side and surfaced as API error responses. The System Admin monitors the Supabase dashboard for database health, slow queries, and auth errors.

2. **Clerk (SSO Authentication)**: Handles user sign-in/sign-up flows and session management. Integrated via `@clerk/nextjs` middleware. Errors are visible in the Clerk Dashboard (https://dashboard.clerk.com). Clerk provides webhooks for user lifecycle events.

3. **Vercel Blob (File Storage)**: Stores uploaded documents (SOWs, presentations, deliverables, profile photos). Files are uploaded via `/api/upload-blob`, `/api/upload-sow`, `/api/upload-presentation`, and `/api/upload-deliverable` routes. File type and size validation is enforced server-side (10MB max, allowed MIME types only). Errors are logged in the Vercel function logs.

4. **Vercel (Hosting & Deployment)**: Next.js application hosted on Vercel. Automatic deployments from the connected GitHub repository. Vercel function logs capture all API route errors and are accessible via the Vercel dashboard.

- Instructions: Review Supabase database logs via the Supabase Dashboard > Logs section. Review Vercel function logs via the Vercel Dashboard > Deployments > Function Logs. Review the `audit_logs` table in Supabase for application-level audit events (data changes, sensitive operations).
- More Info: Supabase logs documentation: https://supabase.com/docs/guides/platform/logs. Vercel logs documentation: https://vercel.com/docs/observability/runtime-logs.
- Error Reconciliation: Review API error logs in Vercel, cross-reference with Supabase logs for database-level errors. For rate limiting issues (HTTP 429), review the rate limiter configuration in `/lib/security/rate-limiter.ts`. Document resolution via GitHub issue or email.
- Escalation: Submit a support ticket to Supabase via the dashboard for database errors. Submit a support ticket to Vercel via https://vercel.com/help for hosting errors. Report to Suffolk ITS Service Desk for authentication errors related to Suffolk SSO.

### Unauthorized User Login / Login Issues

- Instructions: The SHIN application logs all authentication events via Supabase Auth logs and the `audit_logs` table. Admin users can review audit logs via the Supabase dashboard by querying the `audit_logs` table filtered by action type. Clerk provides a dashboard with login activity, failed attempts, and suspicious activity alerts. The System Admin should review Clerk's user activity logs monthly and immediately upon any reported suspicious activity. RLS policies silently exclude unauthorized data from query results; 401/403 HTTP responses are returned for unauthorized API access attempts.
- Error Reconciliation: Review Supabase Auth logs and Clerk Dashboard logs. If required, work with Suffolk ITS to review Suffolk SSO logs. Document resolution and validation via email to the SEED Program Director.
- Escalation: If unauthorized access is confirmed, immediately disable the affected user account in Supabase Auth, notify the SEED Program Director and Suffolk ITS, and follow the Security Incident Response procedure documented in SECURITY_GUIDE.md.

## Data Retention Procedure

Conducted annually.

- The SHIN platform is subject to FERPA regulations (student educational records), Suffolk University's data retention policy, and any contractual obligations with external clients.
- Instructions:
  1. At the end of each academic year, the System Admin reviews all data from completed semesters.
  2. Student records, debriefs, attendance, and documents from prior semesters are retained in the database with their `semester_id` association. The `*_current` views automatically filter to the active semester, so historical data does not appear in day-to-day operations.
  3. Per Suffolk University retention policy, student educational records are retained for the required period (typically 5 years after graduation or last attendance).
  4. Client data (SOWs, deliverables, meeting notes) is retained for the duration of the client engagement plus any contractual retention period.
  5. When data reaches end-of-retention, the System Admin exports the data for archival (if required) and then removes it from the database via SQL scripts with appropriate logging to the `audit_logs` table.
  6. File uploads in Vercel Blob are deleted when the corresponding database records are purged.
- More Info: Data purge scripts should be documented in the `/scripts` directory. All deletions must be logged in the `audit_logs` table with before/after snapshots.

## Contacts

### Department Application Owner

- SEED Program Director
  - Suffolk University, Sawyer Business School
  - Email: [SEED Program Director email]
  - Phone: [Office phone number]

### Suffolk

- ITS Service Desk
  - servicedesk@suffolk.edu
  - 617-557-2000
  - Escalation: ITS as appropriate

### Providers

- **Supabase (Database & Auth)**
  - https://supabase.com/dashboard/support
  - support@supabase.io
  - Escalation: Supabase Enterprise Support (if applicable) or Community Discord

- **Vercel (Hosting & Deployment)**
  - https://vercel.com/help
  - Escalation: Vercel Support Team via dashboard ticket

- **Clerk (SSO Authentication)**
  - https://clerk.com/support
  - support@clerk.com
  - Escalation: Clerk Support Team via dashboard ticket

## Document History

| Date | Description | Owner |
|------|-------------|-------|
| 02/07/2026 | Initial draft based on SHIN platform architecture | SEED Program Director |

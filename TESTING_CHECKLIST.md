# SHIN Platform - Testing Checklist

## Authentication Testing

### Sign Up Flow
- [ ] Navigate to `/auth/sign-up`
- [ ] Enter email and password
- [ ] Verify email confirmation sent
- [ ] Check confirmation link works
- [ ] Verify profile created in database
- [ ] Confirm default role assigned

### Sign In Flow
- [ ] Navigate to `/auth/login`
- [ ] Enter valid credentials
- [ ] Verify successful login redirect to `/`
- [ ] Check user button shows in navigation
- [ ] Verify role displayed in user menu
- [ ] Test sign out functionality

### Session Management
- [ ] Refresh page, verify session persists
- [ ] Wait for token expiration, verify auto-refresh
- [ ] Close browser, reopen, verify session restored
- [ ] Sign out, verify redirect to login

## Role-Based Access Control

### Admin Role Testing
- [ ] Sign in as admin
- [ ] Verify all navigation items visible
- [ ] Access `/admin/setup` page
- [ ] Access all form submission pages
- [ ] View all dashboard data
- [ ] Verify can create/edit/delete all records

### Director Role Testing
- [ ] Sign in as director
- [ ] Verify navigation shows director items
- [ ] Submit debrief form
- [ ] Submit attendance form
- [ ] Submit evaluation form
- [ ] View client dashboard
- [ ] Verify cannot access `/admin/setup`

### Student Role Testing
- [ ] Sign in as student
- [ ] Verify limited navigation items
- [ ] Submit debrief form
- [ ] View own submissions only
- [ ] Verify cannot access director features
- [ ] Verify cannot see other students' data

### Client Role Testing
- [ ] Sign in as client
- [ ] Verify appropriate access level
- [ ] View relevant client information
- [ ] Verify limited data access

## Form Submissions

### Debrief Form (`/submit-debrief`)
- [ ] Password protection works ("SEED2025")
- [ ] All required fields validated
- [ ] Student dropdown populated
- [ ] Client dropdown populated
- [ ] Hours input accepts decimals
- [ ] Summary textarea works
- [ ] Questions field optional
- [ ] Submission creates record
- [ ] Success message displayed
- [ ] Data appears in dashboard

### Attendance Form (`/submit-attendance`)
- [ ] Password protection works
- [ ] Week selector populated
- [ ] Student list displayed
- [ ] Checkboxes work correctly
- [ ] Notes field optional
- [ ] Submission creates records
- [ ] Multiple students can be marked
- [ ] Data saved to Supabase

### Evaluation Form (`/submit-evaluation`)
- [ ] Password protection works
- [ ] Evaluator name required
- [ ] Presentation dropdown populated
- [ ] All 5 rating questions displayed
- [ ] Ratings 1-5 selectable
- [ ] Notes fields optional
- [ ] Submission creates record
- [ ] Data linked to presentation

### Client Intake Form (`/submit-client`)
- [ ] Password protection works
- [ ] Client name required
- [ ] Primary clinic dropdown works
- [ ] Secondary clinics multi-select works
- [ ] All fields save correctly
- [ ] Submission creates client record

## Dashboard Components

### Overview Cards
- [ ] Total hours calculated correctly
- [ ] Active students count accurate
- [ ] Active clients count accurate
- [ ] Metrics update with filters

### Clinic Performance
- [ ] Chart displays data
- [ ] Weekly filter works
- [ ] Clinic filter works
- [ ] Data accurate against source

### Weekly Program Summary
- [ ] AI summaries generate
- [ ] Cached summaries load fast
- [ ] Client order matches agenda
- [ ] Team members displayed
- [ ] Active/inactive colors correct

### Recent Activity
- [ ] Shows latest debriefs
- [ ] Student names correct
- [ ] Client names correct
- [ ] Hours displayed accurately

### Student Hours Chart
- [ ] Chart renders correctly
- [ ] Data sorted properly
- [ ] Clinic colors accurate
- [ ] Tooltips work

### Agenda Widget
- [ ] Shows 11 clients in order
- [ ] Director badges colored
- [ ] Compact single-line format
- [ ] Order matches screenshot

## Database Operations

### Read Operations
- [ ] Students table query works
- [ ] Directors table query works
- [ ] Clients table query works
- [ ] Debriefs table query works
- [ ] Attendance table query works
- [ ] Evaluations table query works

### Write Operations
- [ ] Insert debrief works
- [ ] Insert attendance works
- [ ] Insert evaluation works
- [ ] Insert client intake works
- [ ] Update operations work
- [ ] Delete operations work (if applicable)

### Row Level Security
- [ ] Students cannot see others' debriefs
- [ ] Students cannot edit others' data
- [ ] Directors can see all data
- [ ] Admins have full access
- [ ] Public cannot access without auth

## API Endpoints

### `/api/seed-data`
- [ ] Returns students array
- [ ] Returns directors array
- [ ] Returns clients array
- [ ] Returns assignments array
- [ ] Stats calculated correctly
- [ ] Handles missing tables gracefully

### `/api/debriefs`
- [ ] GET returns filtered debriefs
- [ ] POST creates new debrief
- [ ] PATCH updates existing debrief
- [ ] Error handling works
- [ ] Returns proper status codes

### `/api/attendance`
- [ ] POST creates attendance records
- [ ] Links to students correctly
- [ ] Week ending calculated correctly
- [ ] Bulk creation works

### `/api/evaluations`
- [ ] POST creates evaluation
- [ ] Links to document/presentation
- [ ] All ratings saved correctly
- [ ] Director name captured

## Error Handling

### Network Errors
- [ ] Lost connection handled gracefully
- [ ] Retry logic works
- [ ] User-friendly error messages
- [ ] Console logs useful info

### Validation Errors
- [ ] Required fields enforced
- [ ] Email format validated
- [ ] Number inputs validated
- [ ] Date inputs validated

### Database Errors
- [ ] Missing tables detected
- [ ] RLS violations caught
- [ ] Foreign key errors handled
- [ ] Unique constraint errors handled

## Performance

### Page Load Times
- [ ] Dashboard loads < 3 seconds
- [ ] Forms load < 1 second
- [ ] Navigation instant
- [ ] API responses < 500ms

### Caching
- [ ] Weekly summaries cached
- [ ] Cache invalidation works
- [ ] Browser client singleton works
- [ ] Session persists correctly

## Security Audit

### Authentication
- [ ] Passwords not visible in logs
- [ ] Tokens stored securely
- [ ] Sessions expire appropriately
- [ ] CSRF protection enabled

### Authorization
- [ ] All routes check permissions
- [ ] API endpoints validate roles
- [ ] RLS policies enforced
- [ ] No privilege escalation possible

### Data Protection
- [ ] PII not exposed in logs
- [ ] Sensitive data encrypted
- [ ] API keys not committed
- [ ] Environment variables secure

## Browser Compatibility

### Desktop
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest

### Mobile
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive design works
- [ ] Touch interactions work

## Accessibility

### Navigation
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] ARIA labels present

### Forms
- [ ] Labels associated with inputs
- [ ] Error messages announced
- [ ] Required fields indicated
- [ ] Submit feedback provided

---

## Test Results Summary

**Date Tested**: ___________
**Tester Name**: ___________
**Environment**: Production / Staging / Development

**Total Tests**: _____ / _____
**Passed**: _____
**Failed**: _____
**Blocked**: _____

**Critical Issues**: _____
**High Priority**: _____
**Medium Priority**: _____
**Low Priority**: _____

**Notes**:

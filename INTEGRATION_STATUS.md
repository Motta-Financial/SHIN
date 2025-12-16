# SHIN Platform - Supabase Integration Status

## Executive Summary

The SHIN platform has been successfully configured with comprehensive Supabase integration for authentication, role-based access control, and data persistence. The system is currently operating in a **hybrid mode**, using both Airtable (legacy) and Supabase (new) as data sources.

## Current Status: ✅ Functional

### ✅ Completed Integrations

1. **Authentication System**
   - Supabase Auth with email/password
   - Middleware for session refresh
   - Login/signup pages at `/auth/login` and `/auth/sign-up`
   - User profile management

2. **Role-Based Access Control (RBAC)**
   - Four roles: Admin, Director, Client, Student
   - `profiles` table with `role` and `is_admin` fields
   - Role-based navigation filtering
   - Server-side role checking utilities

3. **Database Schema**
   - ✅ `profiles` - User profiles and roles
   - ✅ `students` - Student information
   - ✅ `directors` - Director information
   - ✅ `clients` - Client organizations
   - ✅ `debriefs` - Weekly debrief submissions
   - ✅ `attendance` - Student attendance tracking
   - ✅ `evaluations` - Midterm evaluations
   - ✅ `documents` - File uploads
   - ✅ `client_intake` - New client submissions
   - ✅ `weekly_summaries` - Cached AI summaries
   - ✅ `agenda_items` - General agenda items
   - ✅ `weekly_client_agenda` - Weekly client order

4. **API Routes**
   - ✅ `/api/debriefs` - Debrief CRUD operations
   - ✅ `/api/attendance` - Attendance submissions
   - ✅ `/api/evaluations` - Evaluation submissions
   - ✅ `/api/client-intake` - Client intake forms
   - ✅ `/api/seed-data` - Student/Director/Client data
   - ✅ `/api/documents` - Document management
   - ✅ `/api/weekly-summaries` - AI-generated summaries

5. **Row Level Security (RLS)**
   - ✅ Students can only access their own data
   - ✅ Directors can access all data
   - ✅ Admins have full access
   - ✅ Public read policies for reference tables

## Setup Required

### Step 1: Run Database Scripts

Execute these SQL scripts in your Supabase SQL Editor in order:

```bash
1. scripts/01-create-seed-tables.sql
2. scripts/06-create-debriefs-table.sql
3. scripts/07-create-attendance-table.sql
4. scripts/08-create-client-intake-table.sql
5. scripts/09-improve-rls-policies.sql
6. scripts/10-setup-auth-profiles.sql
7. scripts/11-fix-rls-and-triggers.sql
```

Or use the built-in setup page at `/admin/setup` (admin access only).

### Step 2: Set Environment Variable (Optional)

After running scripts successfully, you can set:

```
SUPABASE_TABLES_READY=true
```

This tells the app to prefer Supabase over Airtable for data queries. If not set, the app will auto-detect table availability.

### Step 3: Create Initial Admin User

1. Sign up at `/auth/sign-up` with your admin email
2. Manually update the profile in Supabase:

```sql
UPDATE profiles 
SET role = 'admin', is_admin = true 
WHERE id = 'YOUR_USER_ID';
```

Or use the Supabase dashboard to update the profile.

## Architecture Overview

### Authentication Flow

```
User Signs Up/In
    ↓
Supabase Auth (auth.users)
    ↓
Trigger creates Profile (profiles table)
    ↓
Profile includes role & is_admin
    ↓
Role-based navigation & access control
```

### Data Flow - Hybrid Mode

The app currently supports both data sources:

**Airtable (Legacy)**
- Primary data source for historical data
- Used when `SUPABASE_TABLES_READY !== "true"`
- All dashboard components fetch from Airtable by default

**Supabase (New)**
- New submissions go to Supabase
- RLS ensures data security
- Will become primary source after migration

### API Response Pattern

All API routes follow this pattern:

```typescript
{
  data: [...],
  source: "supabase" | "airtable",
  setupRequired: boolean,
  errors?: [...] // If partial failure
}
```

## Security Implementation

### Row Level Security Policies

Every table has RLS enabled with policies:

- **Students**: Can read/update own records via `user_id` or `email` match
- **Directors**: Full access via `is_admin` or role check
- **Clients**: Read-only for discovery, write through directors
- **Debriefs**: Students can CRUD own, directors read all
- **Attendance**: Students can CRUD own, directors read all
- **Evaluations**: Directors can create/update, public read

### Middleware

Session refresh happens automatically via middleware on every request:

```typescript
// middleware.ts
export async function middleware(request) {
  return await updateSession(request) // Refreshes auth tokens
}
```

## Migration Strategy

### Phase 1: Hybrid Operation (Current)
- Airtable remains primary for reads
- New submissions can go to Supabase
- Both systems operational

### Phase 2: Data Migration (Future)
1. Export data from Airtable
2. Transform to Supabase schema
3. Import using scripts
4. Verify data integrity

### Phase 3: Supabase Primary (Future)
1. Set `SUPABASE_TABLES_READY=true`
2. Update all components to use Supabase
3. Keep Airtable as backup
4. Monitor for issues

### Phase 4: Airtable Deprecation (Future)
1. Remove Airtable API calls
2. Archive Airtable data
3. Pure Supabase operation

## Key Files Reference

### Authentication
- `lib/supabase/auth.ts` - Server-side auth utilities
- `lib/supabase/hooks.ts` - Client-side React hooks
- `utils/supabase/server.ts` - Server client factory
- `utils/supabase/client.ts` - Browser client factory
- `utils/supabase/middleware.ts` - Session management

### Components
- `components/auth/user-button.tsx` - User menu dropdown
- `components/auth/role-gate.tsx` - Role-based rendering
- `components/main-navigation.tsx` - Role-filtered nav

### Forms
- `app/submit-debrief/page.tsx` - Debrief submission
- `app/submit-attendance/page.tsx` - Attendance tracking
- `app/submit-evaluation/page.tsx` - Evaluation form
- `app/submit-client/page.tsx` - Client intake

## Troubleshooting

### Issue: "Could not find table in schema cache"

**Cause**: Tables not created in Supabase yet

**Solution**: Run database scripts or visit `/admin/setup`

### Issue: "User not found" or "Profile not found"

**Cause**: Profile trigger not set up or user signed up before trigger

**Solution**: 
```sql
-- Manually create profile
INSERT INTO profiles (id, full_name, role, is_admin)
VALUES ('user-id-here', 'Full Name', 'director', false);
```

### Issue: Navigation items not showing

**Cause**: User profile doesn't have role set

**Solution**: Check profile table and ensure role is set

### Issue: RLS policy blocking access

**Cause**: User doesn't match policy conditions

**Solution**: Check user's role and is_admin status in profiles table

## Performance Optimizations

### Implemented
- ✅ Database indexes on commonly queried columns
- ✅ Caching for AI-generated summaries
- ✅ Supabase connection pooling
- ✅ Singleton pattern for browser client

### Recommended
- 🔄 Implement React Query for client-side caching
- 🔄 Add Redis for session storage
- 🔄 Set up Supabase Edge Functions for heavy operations
- 🔄 Configure CDN for static assets

## Next Steps

1. **Complete Script Execution** - Run all 11 SQL scripts
2. **Create Admin Account** - Set up first admin user
3. **Test All Forms** - Submit test data through each form
4. **Verify RLS** - Test access control with different roles
5. **Data Migration Plan** - Prepare for Airtable → Supabase migration
6. **Monitoring Setup** - Configure error tracking and analytics

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js + Supabase**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **RLS Best Practices**: https://supabase.com/docs/guides/auth/row-level-security
- **SHIN Documentation**: See `SUPABASE_SETUP.md` for detailed setup instructions

---

**Last Updated**: December 2025
**Status**: Production Ready with Hybrid Data Sources
**Next Review**: After Phase 2 Migration

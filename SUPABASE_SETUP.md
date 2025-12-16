# Supabase Integration Setup Guide

This guide will help you set up the complete Supabase integration for the SHIN dashboard.

## Prerequisites

- Supabase account and project created
- Project URL and API keys from Supabase dashboard

## Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Storage Configuration (optional)
SUPABASE_STORAGE_ACCESS_KEY_ID=your-access-key-id
SUPABASE_STORAGE_SECRET_ACCESS_KEY=your-secret-access-key

# Feature Flags
SUPABASE_TABLES_READY=false  # Set to true after running SQL scripts
```

## Step 1: Create Database Tables

Run the SQL scripts in order in your Supabase SQL Editor:

1. `scripts/01-create-seed-tables.sql` - Creates students, directors, clients tables
2. `scripts/02-seed-directors-data.sql` - Populates directors data
3. `scripts/03-seed-students-data.sql` - Populates students data
4. `scripts/04-seed-clients-data.sql` - Populates clients data
5. `scripts/05-seed-client-assignments.sql` - Creates client assignments
6. `scripts/06-create-debriefs-table.sql` - Creates debriefs table
7. `scripts/07-create-attendance-table.sql` - Creates attendance table
8. `scripts/08-create-client-intake-table.sql` - Creates client intake table
9. `scripts/09-improve-rls-policies.sql` - Improves RLS policies and adds indexes

**OR** use the automated setup page at `/admin/setup` (requires password: SEED2025)

## Step 2: Configure Storage Buckets

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `documents` for file uploads
3. Set bucket to public or configure RLS policies as needed
4. Note the access credentials if using S3-compatible storage

## Step 3: Enable Row Level Security

RLS is automatically enabled by the SQL scripts. The policies allow:

- **Public read access** to most tables (students, directors, clients, debriefs)
- **Authenticated write access** for form submissions
- **Director-specific access** for clinic-related data

To customize RLS policies, edit `scripts/09-improve-rls-policies.sql`

## Step 4: Set Up Authentication (Optional)

If you want to add user authentication:

1. Go to Supabase Dashboard → Authentication
2. Enable Email/Password provider
3. Configure email templates
4. Update RLS policies to use `auth.uid()` for user-specific access

## Step 5: Enable Supabase Integration

Once all tables are created and populated:

1. Set `SUPABASE_TABLES_READY=true` in your `.env.local`
2. Restart your development server
3. The app will now use Supabase instead of Airtable

## Architecture Overview

### Client Setup

- **Browser Client** (`utils/supabase/client.ts`) - For Client Components
- **Server Client** (`utils/supabase/server.ts`) - For Server Components, API Routes
- **Admin Client** (`lib/supabase-admin.ts`) - For admin operations (bypasses RLS)
- **Middleware** (`middleware.ts`) - Refreshes auth tokens automatically

### Storage Helpers

Use the storage utilities in `utils/supabase/storage.ts`:

```typescript
import { uploadFile, getPublicUrl, downloadFile } from '@/utils/supabase/storage'

// Upload a file
const data = await uploadFile({
  bucket: 'documents',
  path: 'folder/filename.pdf',
  file: fileObject
})

// Get public URL
const url = getPublicUrl({
  bucket: 'documents',
  path: 'folder/filename.pdf'
})
```

### Database Queries

```typescript
import { createClient } from '@/utils/supabase/server'

// In Server Components or API Routes
const supabase = await createClient()
const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('clinic', 'Accounting')
```

## Performance Best Practices

1. **Indexes** - All RLS-related columns have indexes for performance
2. **Caching** - Use Next.js caching strategies for frequently accessed data
3. **Batch Operations** - Use `.insert()` with arrays for bulk inserts
4. **Select Specific Columns** - Only select columns you need

## Security Best Practices

1. **Never expose service role key** - Only use in server-side code
2. **Use RLS policies** - Don't rely on client-side filtering for security
3. **Validate input** - Always validate and sanitize user input
4. **Use prepared statements** - Supabase client handles this automatically

## Troubleshooting

### Tables not found error
- Make sure all SQL scripts have been run
- Check that `SUPABASE_TABLES_READY=true` is set
- Verify table names match in your queries

### RLS policy errors
- Check that policies allow the operation you're trying to perform
- Use the admin client for operations that need to bypass RLS
- Review policies in Supabase Dashboard → Database → Policies

### Authentication issues
- Ensure middleware is properly configured
- Check that cookies are being set correctly
- Verify environment variables are set

## Migration from Airtable

The app currently uses Airtable as the primary data source. To migrate:

1. Complete all setup steps above
2. Set `SUPABASE_TABLES_READY=true`
3. The app will automatically use Supabase for new data
4. Historical Airtable data will still be accessible
5. Gradually migrate historical data using the admin tools

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review the SQL scripts for table structures
- Check the debug logs in the browser console

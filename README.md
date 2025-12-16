# SHIN Dashboard - SEED Hub & Information Nexus

A comprehensive dashboard for SEED clinic directors to monitor student progress, client engagements, and clinic performance.

## Features

- **Real-time Overview**: Track active students, clients, total hours, and weekly growth
- **Clinic Performance**: Visual breakdown of hours logged by each clinic (Consulting, Accounting, Funding, Marketing)
- **Student Hours Tracking**: Daily breakdown of student hours with trends
- **Client Engagements**: Monitor progress on each client project with status indicators
- **Recent Activity Feed**: Stay updated with latest student submissions and milestones
- **Filtering**: Filter by clinic and time range for focused insights
- **Prospect Interview Dashboard**: Track interview schedules, completion status, and form submissions
- **Authentication**: Secure access with Clerk authentication

## Setup

1. **Configure Airtable Integration**:
   - Copy `.env.example` to `.env.local`
   - Add your Airtable API key and Base ID
   - Get your API key from: https://airtable.com/account
   - Find your Base ID in the Airtable URL

2. **Configure Clerk Authentication**:
   - Sign up for a free account at https://clerk.com
   - Create a new application in the Clerk Dashboard
   - Copy your Publishable Key and Secret Key
   - Add them to your `.env.local` file:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
     CLERK_SECRET_KEY=sk_test_...
     ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Access the Dashboard**:
   - Navigate to http://localhost:3000
   - Sign up or sign in with Clerk
   - Access the Clinic Dashboard and Prospect Interviews

## Airtable Integration

The dashboard connects to your Airtable base to pull real-time data from:
- Student Debrief Forms
- Weekly Attendance Forms
- Pre-SEED Interview Forms (PRESEED| Prospects table)
- Client Information
- Clinic Assignments
- Student Roster (SEED | Roster table)

### API Endpoints

- `GET /api/airtable/debriefs` - Fetch student debrief data
- `GET /api/airtable/roster` - Fetch student roster
- `GET /api/airtable/prospects` - Fetch prospect interview data
- `GET /api/airtable/clients` - Fetch client information
- `GET /api/airtable/tables` - List all available tables

## Authentication

The dashboard uses Clerk for authentication, providing:
- Secure sign-in/sign-up flows
- User profile management
- Session management
- Protected routes (all pages require authentication)

## Customization

The dashboard uses an elegant color palette:
- Navy Blue (#1A2332) - Primary headers
- Medium Blue (#4A6FA5) - Accents
- Slate Blue (#5B7C99) - Secondary elements
- Muted Purple (#8B7B8B) - Subtle accents
- Light Lavender (#C4B5C4) - Soft backgrounds

Update `app/globals.css` to customize the color scheme.

## Next Steps

1. ~~Add authentication for clinic directors~~ ✓ Completed with Clerk
2. Implement data export functionality
3. Add email notifications for at-risk clients
4. Create detailed student and client profile pages
5. Add role-based access control for different user types

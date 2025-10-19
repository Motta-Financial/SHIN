# SHIN Dashboard - SEED Hub & Information Nexus

A comprehensive dashboard for SEED clinic directors to monitor student progress, client engagements, and clinic performance.

## Features

- **Real-time Overview**: Track active students, clients, total hours, and weekly growth
- **Clinic Performance**: Visual breakdown of hours logged by each clinic (Consulting, Accounting, Funding, Marketing)
- **Student Hours Tracking**: Daily breakdown of student hours with trends
- **Client Engagements**: Monitor progress on each client project with status indicators
- **Recent Activity Feed**: Stay updated with latest student submissions and milestones
- **Filtering**: Filter by clinic and time range for focused insights

## Setup

1. **Configure Airtable Integration**:
   - Copy `.env.example` to `.env.local`
   - Add your Airtable API key and Base ID
   - Get your API key from: https://airtable.com/account
   - Find your Base ID in the Airtable URL

2. **Install Dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Run Development Server**:
   \`\`\`bash
   npm run dev
   \`\`\`

## Airtable Integration

The dashboard connects to your Airtable base to pull real-time data from:
- Student Debrief Forms
- Weekly Attendance Forms
- Pre-SEED Interview Forms
- Client Information
- Clinic Assignments

### API Endpoints

- `GET /api/airtable?table=TableName` - Fetch data from specific Airtable table

## Customization

The dashboard uses the SHIN brand colors:
- Navy Blue (#0A2240) - Primary
- Teal (#00B4D8) - Secondary
- Bright Green (#00F5A0) - Accent

Update `app/globals.css` to customize the color scheme.

## Next Steps

1. Replace mock data in components with actual Airtable API calls
2. Add authentication for clinic directors
3. Implement data export functionality
4. Add email notifications for at-risk clients
5. Create detailed student and client profile pages

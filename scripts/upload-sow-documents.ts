import { put } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// SOW documents data
const sowDocuments = [
  {
    clientName: "Sawyer Parks Enterprises",
    studentName: "Adam Calnan",
    fileName: "Statement of Work - Sawyer Parks.pdf",
    content: `Statement of Work (SOW)
Client: Sawyer Parks Enterprises
Consulting Partner: Adam Calnan's SEED Team
Date: 22 October 2025

1. Project Summary
Project Description
Sawyer Parks Enterprises, a generational family-owned real estate holding company, seeks to reposition the 5th floor of the Pledge Building at 209 Columbus Avenue into a high-performing, flexible office environment tailored to post-pandemic tenant expectations. The 5th floor will serve as a prototype for a new leasing model blending the appeal of boutique private offices with the functionality of shared workspace environments.

This project aims to deliver a data-driven repositioning strategy that defines suite sizes, floor configurations, design features, and leasing structures aligned with the preferences and psychographics of modern Class B tenants. The SEED Team will determine what tenants want in terms of space size, lease duration, and buildout features to create an actionable blueprint for repositioning.

Objective
To develop a tenant-informed prototype for the 5th floor that maximizes utilization, reduces vacancy, and positions Sawyer Parks for sustainable revenue growth through a flexible, hybrid leasing model.

Context
Boston's Class B office sector remains under pressure from persistent vacancy and changing work patterns. Tenant demand has shifted toward smaller, flexible footprints emphasizing community, cost-efficiency, and immediate usability. Unlike REITs or large developers, Sawyer Parks' family-owned model provides agility to capitalize on niche opportunities ignored by institutional players.

2. Expected Outcomes
1. Market Intelligence Report: Summarizes demand for small class-B office suites
2. Ideal tenant profile identifying size, lease term, and feature preferences
3. Prototype floor plan with 3 viable configuration options
4. Cost-benefit and ROI comparison between in-house leasing and shared workspace provider

3. Project Scope and Deliverables

Phase 1: Market Intelligence Development
• Survey development and distribution
• Conduct industry interviews
• Identify value drivers
Deliverable: Market Intelligence Report summarizing insights and implications for the project.

Phase 2: Concept & Recommendation Development
• Develop 3 office suite concepts
• Conduct forecast analysis for suites
• Multi scenario cost-benefit analysis
• Integrate marketing and leasing strategy recommendations
Deliverable: Conceptual rollout plan, financial logic, and promotion strategy.

SEED Team & Roles:
- Adam Calnan - Consulting Lead
- Courage Chakanza - Finance & Resource Expert
- Rayah Sibunga - Marketing Expert
- Sara Marmoucha - Accounting Expert`,
  },
  {
    clientName: "Intriguing Hair",
    studentName: "Shubhangi Srivastava",
    fileName: "Statement of Work - Intriguing Hair.pdf",
    content: `STATEMENT OF WORK
For Intriguing Hair

Project Summary
Intriguing Hair Boston is a Boston-based luxury wig and hair-extension retailer founded by Nikia Londy. The brand specializes in custom wigs for medical and fashion purposes, catering to clients experiencing hair loss as well as those seeking premium styling options.

Project Specific Objectives:
- Develop actionable financial insights and a QuickBooks integration plan
- Conduct targeted customer research to uncover purchasing behaviors
- Evaluate brand communications and digital presence
- Create a financial projection and funding strategy

Project Scope and Deliverables

Business Model & Financial Analysis
Activity: Review financial statements, explore QuickBooks integration
Deliverables: Financial insights, cost-saving strategies, QuickBooks integration plan

Marketing Strategy & Brand Growth
Activity: Design marketing survey, develop customer personas, conduct marketing audit
Deliverables: Survey, AI-backed persona one-pagers, marketing audit report

Operational & Event Optimization
Activity: Analyze inventory management, research medical channel accreditation
Deliverables: Sales analysis, inventory management strategy, insurance accreditation guidelines

Funding & Expansion Planning
Activity: Assess funding needs and evaluate sources
Deliverables: Funding strategy roadmap, financial projections

SEED Team & Roles:
- Shubhangi Srivastava - Consulting Team & Team Leader
- Keya Patel & Ishani Rana - Resource Acquisition
- Collin Merwin - Accounting
- Sophia Emile - Marketing`,
  },
  {
    clientName: "Serene Cycle Co.",
    studentName: "Annalise Fosnight",
    fileName: "Statement of Work - Serene Cycle.pdf",
    content: `STATEMENT OF WORK
Prepared for Serene Cycle Co.

1. PROJECT SUMMARY
Serene Cycle Co. is an early-stage boutique wellness and retail brand focused on creating natural, handcrafted products that promote comfort and confidence during the menstrual cycle.

Project Specific Objectives:
1. Legal & Compliance
   • Protect proprietary formulations
   • FDA compliance review
   • Employee compliance guidance

2. Marketing & Brand Development
   • Affiliate Program Setup
   • Website Optimization
   • Email Marketing
   • Training & Enablement

3. Finance & Accounting
   • QuickBooks Implementation
   • Training for bookkeeping and expense tracking

4. Resource Acquisition
   • Grant & Funding Strategy

PROJECT SCOPE & DELIVERABLES

Accounting
Activity: Implement bookkeeping system, get books up to date
Deliverables: QuickBooks setup, training sessions, GAAP-compliant records

Marketing
Activity: Marketing audit, influencer affiliate program, reviews guide
Deliverables: Website audit, affiliate program toolkit, Squarespace reviews guide

Resource Acquisition
Activity: Funding research and application support
Deliverables: Funding tracker, application drafts, continuation plan

Legal
Activity: IP protection, FDA compliance, employment compliance
Deliverables: IP protection recommendations, compliance checklist, employment guidelines

SEED Team & Roles:
- Annalise Fosnight - Team Leader & Consulting
- Ashley Gonzalez - Resource Acquisition
- Riley DiBiase - Accounting & Financial Systems
- Nicole Nessim - Marketing & Brand Strategy`,
  },
  {
    clientName: "Marabou Cafe",
    studentName: "Marian O'Brien",
    fileName: "Statement of Work - Marabou Cafe.pdf",
    content: `STATEMENT OF WORK
For Marabou Cafe

Project Summary
Marabou Cafe is a family-owned, full-service Haitian restaurant located in Mattapan, MA. The mother-daughter team is seeking to bring a community gathering space to Mattapan Square.

Project Specific Objectives
1. Develop sustainable marketing strategy
2. Develop comprehensive financial strategy
3. Formalize partnership agreements and loan documentation
4. Optimize operations and growth capacity

Project Scope and Deliverables

Marketing and Engagement Strategy
Activities: Marketing research, community engagement strategy
Deliverables: SEO review, email/social media campaigns, catering expansion analysis, partnership strategy

Financial Strategy
Activities: Financial assessment, structure and management systems, funding optimization
Deliverables: Financial analysis, QuickBooks integration, debt management strategy, business plan

Legal Governance
Activities: Review partnership agreements, evaluate entity structure
Deliverables: Partnership agreement review, entity structure analysis

Operational Optimization
Activities: Outdoor dining development, liquor license acquisition
Deliverables: Outdoor space development plan, liquor license feasibility report

SEED Team & Roles:
- Marian O'Brien - Team Leader
- Mahekdeep Kaur Abrol - Marketing
- Nyasha Absolomon Mukwata - Finance
- Aline Silva - Accounting
- Paige Moscow and Grace Fucci - Legal`,
  },
]

async function uploadSOWDocuments() {
  console.log("[v0] Starting SOW document upload...")

  for (const doc of sowDocuments) {
    try {
      console.log(`[v0] Uploading SOW for ${doc.clientName}...`)

      // Create a blob from the text content
      const blob = new Blob([doc.content], { type: "text/plain" })

      // Upload to Vercel Blob
      const { url } = await put(doc.fileName, blob, {
        access: "public",
        addRandomSuffix: true,
      })

      console.log(`[v0] Uploaded to Blob: ${url}`)

      // Insert into Supabase
      const { data, error } = await supabase.from("documents").insert({
        client_name: doc.clientName,
        file_name: doc.fileName,
        file_url: url,
        file_type: "text/plain",
        submission_type: "Student Submit",
        student_name: doc.studentName,
        uploaded_at: new Date().toISOString(),
        clinic: "SEED",
        description: "Statement of Work document submitted by student team",
      })

      if (error) {
        console.error(`[v0] Error inserting document for ${doc.clientName}:`, error)
      } else {
        console.log(`[v0] Successfully added SOW for ${doc.clientName}`)
      }
    } catch (error) {
      console.error(`[v0] Error processing ${doc.clientName}:`, error)
    }
  }

  console.log("[v0] SOW document upload complete!")
}

uploadSOWDocuments()

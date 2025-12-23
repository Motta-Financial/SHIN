import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// CSV data from MIGRATION_DEBRIEFS.csv - parsed and mapped
const csvData = [
  // Week 1 - 2025-09-14
  {
    date: "2025-09-14",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.5,
    summary: "Reviewed PO and Invoice processes",
    student: "Aline Silva",
  },
  {
    date: "2025-09-14",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.5,
    summary: "Reviewed PO and Invoice processes",
    student: "Collin Merwin",
  },
  {
    date: "2025-09-14",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.5,
    summary: "Reviewed PO and Invoice processes",
    student: "Morgan Labbe",
  },
  {
    date: "2025-09-14",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.5,
    summary: "Reviewed PO and Invoice processes",
    student: "Simarjeet Kaur",
  },
  {
    date: "2025-09-14",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.5,
    summary: "Reviewed PO and Invoice processes",
    student: "Pranav Aditya Mereddy",
  },
  {
    date: "2025-09-14",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.0,
    summary: "Met with client, discussed bookkeeping needs",
    student: "Danny Nguyen",
  },
  {
    date: "2025-09-14",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.0,
    summary: "Met with client, discussed bookkeeping needs",
    student: "Hannah Vo",
  },
  {
    date: "2025-09-14",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.0,
    summary: "Met with client, discussed bookkeeping needs",
    student: "Isabella Perez",
  },
  {
    date: "2025-09-14",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.0,
    summary: "Met with client, discussed bookkeeping needs",
    student: "Sophia Chen",
  },
  {
    date: "2025-09-14",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.0,
    summary: "Initial client meeting and needs assessment",
    student: "Adam Calnan",
  },
  {
    date: "2025-09-14",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.0,
    summary: "Initial client meeting and needs assessment",
    student: "Annalise Fosnight",
  },
  {
    date: "2025-09-14",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.0,
    summary: "Initial client meeting and needs assessment",
    student: "Evan Moore",
  },
  {
    date: "2025-09-14",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 2.5,
    summary: "Business model review and strategy session",
    student: "Fatema Sayyed",
  },
  {
    date: "2025-09-14",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 2.5,
    summary: "Business model review and strategy session",
    student: "Julia Chen",
  },
  {
    date: "2025-09-14",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 2.5,
    summary: "Business model review and strategy session",
    student: "Kara Melvin",
  },
  {
    date: "2025-09-14",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.0,
    summary: "Social media audit and content planning",
    student: "Elaine Lara",
  },
  {
    date: "2025-09-14",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.0,
    summary: "Social media audit and content planning",
    student: "Krysthal Velarde",
  },
  {
    date: "2025-09-14",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.0,
    summary: "Social media audit and content planning",
    student: "Mike Chen",
  },
  {
    date: "2025-09-14",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 2.5,
    summary: "Brand identity review and website analysis",
    student: "Sarah Johnson",
  },
  {
    date: "2025-09-14",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 2.5,
    summary: "Brand identity review and website analysis",
    student: "Tyler Brown",
  },
  {
    date: "2025-09-14",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.0,
    summary: "Grant research and prospect identification",
    student: "Abednego Nakoma",
  },
  {
    date: "2025-09-14",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.0,
    summary: "Grant research and prospect identification",
    student: "Arianna Godinho",
  },
  {
    date: "2025-09-14",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.0,
    summary: "Grant research and prospect identification",
    student: "Brandon Lee",
  },
  {
    date: "2025-09-14",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 2.5,
    summary: "Funding strategy development",
    student: "Carlos Martinez",
  },
  {
    date: "2025-09-14",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 2.5,
    summary: "Funding strategy development",
    student: "Diana Wilson",
  },

  // Week 2 - 2025-09-21
  {
    date: "2025-09-21",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 3.0,
    summary: "Continued process documentation, identified improvement areas",
    student: "Aline Silva",
  },
  {
    date: "2025-09-21",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 3.0,
    summary: "Continued process documentation, identified improvement areas",
    student: "Collin Merwin",
  },
  {
    date: "2025-09-21",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 3.0,
    summary: "Continued process documentation, identified improvement areas",
    student: "Morgan Labbe",
  },
  {
    date: "2025-09-21",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.5,
    summary: "Set up QuickBooks, began transaction entry",
    student: "Danny Nguyen",
  },
  {
    date: "2025-09-21",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.5,
    summary: "Set up QuickBooks, began transaction entry",
    student: "Hannah Vo",
  },
  {
    date: "2025-09-21",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.5,
    summary: "Competitive analysis and market research",
    student: "Adam Calnan",
  },
  {
    date: "2025-09-21",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.5,
    summary: "Competitive analysis and market research",
    student: "Annalise Fosnight",
  },
  {
    date: "2025-09-21",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 3.0,
    summary: "Financial projections and business plan drafting",
    student: "Fatema Sayyed",
  },
  {
    date: "2025-09-21",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 3.0,
    summary: "Financial projections and business plan drafting",
    student: "Julia Chen",
  },
  {
    date: "2025-09-21",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.5,
    summary: "Created content calendar, designed initial posts",
    student: "Elaine Lara",
  },
  {
    date: "2025-09-21",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.5,
    summary: "Created content calendar, designed initial posts",
    student: "Krysthal Velarde",
  },
  {
    date: "2025-09-21",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 3.0,
    summary: "Developed brand guidelines and logo concepts",
    student: "Sarah Johnson",
  },
  {
    date: "2025-09-21",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 3.0,
    summary: "Developed brand guidelines and logo concepts",
    student: "Tyler Brown",
  },
  {
    date: "2025-09-21",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.5,
    summary: "Drafted initial grant proposal",
    student: "Abednego Nakoma",
  },
  {
    date: "2025-09-21",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.5,
    summary: "Drafted initial grant proposal",
    student: "Arianna Godinho",
  },
  {
    date: "2025-09-21",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 3.0,
    summary: "Identified 5 potential funding sources",
    student: "Carlos Martinez",
  },
  {
    date: "2025-09-21",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 3.0,
    summary: "Identified 5 potential funding sources",
    student: "Diana Wilson",
  },

  // Week 3 - 2025-09-28
  {
    date: "2025-09-28",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 3.5,
    summary: "Presented initial findings to department heads",
    student: "Aline Silva",
  },
  {
    date: "2025-09-28",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 3.5,
    summary: "Presented initial findings to department heads",
    student: "Collin Merwin",
  },
  {
    date: "2025-09-28",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 3.0,
    summary: "Completed Q3 bookkeeping, prepared financial statements",
    student: "Danny Nguyen",
  },
  {
    date: "2025-09-28",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 3.0,
    summary: "Completed Q3 bookkeeping, prepared financial statements",
    student: "Hannah Vo",
  },
  {
    date: "2025-09-28",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 4.0,
    summary: "Developed pricing strategy recommendations",
    student: "Adam Calnan",
  },
  {
    date: "2025-09-28",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 4.0,
    summary: "Developed pricing strategy recommendations",
    student: "Annalise Fosnight",
  },
  {
    date: "2025-09-28",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 3.5,
    summary: "Finalized business plan, prepared investor pitch",
    student: "Fatema Sayyed",
  },
  {
    date: "2025-09-28",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 3.5,
    summary: "Finalized business plan, prepared investor pitch",
    student: "Julia Chen",
  },
  {
    date: "2025-09-28",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 3.0,
    summary: "Launched social media campaign, tracked metrics",
    student: "Elaine Lara",
  },
  {
    date: "2025-09-28",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 3.0,
    summary: "Launched social media campaign, tracked metrics",
    student: "Krysthal Velarde",
  },
  {
    date: "2025-09-28",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 3.5,
    summary: "Delivered brand package, began website redesign",
    student: "Sarah Johnson",
  },
  {
    date: "2025-09-28",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 3.5,
    summary: "Delivered brand package, began website redesign",
    student: "Tyler Brown",
  },
  {
    date: "2025-09-28",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 4.0,
    summary: "Submitted grant application, researched additional opportunities",
    student: "Abednego Nakoma",
  },
  {
    date: "2025-09-28",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 4.0,
    summary: "Submitted grant application, researched additional opportunities",
    student: "Arianna Godinho",
  },
  {
    date: "2025-09-28",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 3.5,
    summary: "Prepared funding presentation materials",
    student: "Carlos Martinez",
  },
  {
    date: "2025-09-28",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 3.5,
    summary: "Prepared funding presentation materials",
    student: "Diana Wilson",
  },

  // Week 4 - 2025-10-05
  {
    date: "2025-10-05",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 3.0,
    summary: "Implemented process improvements, trained staff",
    student: "Aline Silva",
  },
  {
    date: "2025-10-05",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 3.0,
    summary: "Implemented process improvements, trained staff",
    student: "Collin Merwin",
  },
  {
    date: "2025-10-05",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.5,
    summary: "Reconciled accounts, identified discrepancies",
    student: "Danny Nguyen",
  },
  {
    date: "2025-10-05",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.5,
    summary: "Reconciled accounts, identified discrepancies",
    student: "Hannah Vo",
  },
  {
    date: "2025-10-05",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.5,
    summary: "Presented strategic recommendations to client",
    student: "Adam Calnan",
  },
  {
    date: "2025-10-05",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.5,
    summary: "Presented strategic recommendations to client",
    student: "Annalise Fosnight",
  },
  {
    date: "2025-10-05",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 3.0,
    summary: "Delivered investor pitch deck, practiced presentation",
    student: "Fatema Sayyed",
  },
  {
    date: "2025-10-05",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 3.0,
    summary: "Delivered investor pitch deck, practiced presentation",
    student: "Julia Chen",
  },
  {
    date: "2025-10-05",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.5,
    summary: "Analyzed campaign performance, optimized content",
    student: "Elaine Lara",
  },
  {
    date: "2025-10-05",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.5,
    summary: "Analyzed campaign performance, optimized content",
    student: "Krysthal Velarde",
  },
  {
    date: "2025-10-05",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 3.0,
    summary: "Completed website mockups, began development",
    student: "Sarah Johnson",
  },
  {
    date: "2025-10-05",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 3.0,
    summary: "Completed website mockups, began development",
    student: "Tyler Brown",
  },
  {
    date: "2025-10-05",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.5,
    summary: "Followed up on grant application, prepared backup plans",
    student: "Abednego Nakoma",
  },
  {
    date: "2025-10-05",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.5,
    summary: "Followed up on grant application, prepared backup plans",
    student: "Arianna Godinho",
  },
  {
    date: "2025-10-05",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 3.0,
    summary: "Met with potential funders, refined pitch",
    student: "Carlos Martinez",
  },
  {
    date: "2025-10-05",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 3.0,
    summary: "Met with potential funders, refined pitch",
    student: "Diana Wilson",
  },

  // Week 5 - 2025-10-12
  {
    date: "2025-10-12",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.5,
    summary: "Documented new procedures, created training materials",
    student: "Aline Silva",
  },
  {
    date: "2025-10-12",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.5,
    summary: "Documented new procedures, created training materials",
    student: "Collin Merwin",
  },
  {
    date: "2025-10-12",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.0,
    summary: "Resolved discrepancies, updated records",
    student: "Danny Nguyen",
  },
  {
    date: "2025-10-12",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.0,
    summary: "Resolved discrepancies, updated records",
    student: "Hannah Vo",
  },
  {
    date: "2025-10-12",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.0,
    summary: "Implementation planning and timeline development",
    student: "Adam Calnan",
  },
  {
    date: "2025-10-12",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.0,
    summary: "Implementation planning and timeline development",
    student: "Annalise Fosnight",
  },
  {
    date: "2025-10-12",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 2.5,
    summary: "Investor meeting preparation and rehearsal",
    student: "Fatema Sayyed",
  },
  {
    date: "2025-10-12",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 2.5,
    summary: "Investor meeting preparation and rehearsal",
    student: "Julia Chen",
  },
  {
    date: "2025-10-12",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.0,
    summary: "Created promotional materials for fall campaign",
    student: "Elaine Lara",
  },
  {
    date: "2025-10-12",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.0,
    summary: "Created promotional materials for fall campaign",
    student: "Krysthal Velarde",
  },
  {
    date: "2025-10-12",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 2.5,
    summary: "Website development progress, added content",
    student: "Sarah Johnson",
  },
  {
    date: "2025-10-12",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 2.5,
    summary: "Website development progress, added content",
    student: "Tyler Brown",
  },
  {
    date: "2025-10-12",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.0,
    summary: "Received positive grant feedback, began second application",
    student: "Abednego Nakoma",
  },
  {
    date: "2025-10-12",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.0,
    summary: "Received positive grant feedback, began second application",
    student: "Arianna Godinho",
  },
  {
    date: "2025-10-12",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 2.5,
    summary: "Secured initial funding commitment",
    student: "Carlos Martinez",
  },
  {
    date: "2025-10-12",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 2.5,
    summary: "Secured initial funding commitment",
    student: "Diana Wilson",
  },

  // Oct Break - 2025-10-19
  {
    date: "2025-10-19",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 1.5,
    summary: "Light work during break, reviewed materials",
    student: "Aline Silva",
  },
  {
    date: "2025-10-19",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 1.0,
    summary: "Async work on implementation docs",
    student: "Adam Calnan",
  },
  {
    date: "2025-10-19",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 1.5,
    summary: "Scheduled posts for the week",
    student: "Elaine Lara",
  },
  {
    date: "2025-10-19",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 1.0,
    summary: "Grant paperwork review",
    student: "Abednego Nakoma",
  },

  // Week 6 - 2025-10-26
  {
    date: "2025-10-26",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 3.0,
    summary: "Final process documentation and handoff",
    student: "Aline Silva",
  },
  {
    date: "2025-10-26",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 3.0,
    summary: "Final process documentation and handoff",
    student: "Collin Merwin",
  },
  {
    date: "2025-10-26",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.5,
    summary: "Monthly closing procedures, financial review",
    student: "Danny Nguyen",
  },
  {
    date: "2025-10-26",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.5,
    summary: "Monthly closing procedures, financial review",
    student: "Hannah Vo",
  },
  {
    date: "2025-10-26",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.5,
    summary: "Began implementation support",
    student: "Adam Calnan",
  },
  {
    date: "2025-10-26",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.5,
    summary: "Began implementation support",
    student: "Annalise Fosnight",
  },
  {
    date: "2025-10-26",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 3.0,
    summary: "Post-investor meeting follow-up",
    student: "Fatema Sayyed",
  },
  {
    date: "2025-10-26",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 3.0,
    summary: "Post-investor meeting follow-up",
    student: "Julia Chen",
  },
  {
    date: "2025-10-26",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.5,
    summary: "Holiday campaign planning",
    student: "Elaine Lara",
  },
  {
    date: "2025-10-26",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.5,
    summary: "Holiday campaign planning",
    student: "Krysthal Velarde",
  },
  {
    date: "2025-10-26",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 3.0,
    summary: "Website testing and refinements",
    student: "Sarah Johnson",
  },
  {
    date: "2025-10-26",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 3.0,
    summary: "Website testing and refinements",
    student: "Tyler Brown",
  },
  {
    date: "2025-10-26",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.5,
    summary: "Grant awarded, began second application",
    student: "Abednego Nakoma",
  },
  {
    date: "2025-10-26",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.5,
    summary: "Grant awarded, began second application",
    student: "Arianna Godinho",
  },
  {
    date: "2025-10-26",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 3.0,
    summary: "Funding agreement finalization",
    student: "Carlos Martinez",
  },
  {
    date: "2025-10-26",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 3.0,
    summary: "Funding agreement finalization",
    student: "Diana Wilson",
  },

  // Week 7 - 2025-11-02
  {
    date: "2025-11-02",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.5,
    summary: "Training city staff on new procedures",
    student: "Aline Silva",
  },
  {
    date: "2025-11-02",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.5,
    summary: "Training city staff on new procedures",
    student: "Collin Merwin",
  },
  {
    date: "2025-11-02",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.0,
    summary: "Tax preparation assistance",
    student: "Danny Nguyen",
  },
  {
    date: "2025-11-02",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.0,
    summary: "Tax preparation assistance",
    student: "Hannah Vo",
  },
  {
    date: "2025-11-02",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.0,
    summary: "Monitored implementation progress",
    student: "Adam Calnan",
  },
  {
    date: "2025-11-02",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 3.0,
    summary: "Monitored implementation progress",
    student: "Annalise Fosnight",
  },
  {
    date: "2025-11-02",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 2.5,
    summary: "Investor negotiations support",
    student: "Fatema Sayyed",
  },
  {
    date: "2025-11-02",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 2.5,
    summary: "Investor negotiations support",
    student: "Julia Chen",
  },
  {
    date: "2025-11-02",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.0,
    summary: "Executed holiday campaign",
    student: "Elaine Lara",
  },
  {
    date: "2025-11-02",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.0,
    summary: "Executed holiday campaign",
    student: "Krysthal Velarde",
  },
  {
    date: "2025-11-02",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 2.5,
    summary: "Website launch preparation",
    student: "Sarah Johnson",
  },
  {
    date: "2025-11-02",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 2.5,
    summary: "Website launch preparation",
    student: "Tyler Brown",
  },
  {
    date: "2025-11-02",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.0,
    summary: "Second grant application in progress",
    student: "Abednego Nakoma",
  },
  {
    date: "2025-11-02",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 3.0,
    summary: "Second grant application in progress",
    student: "Arianna Godinho",
  },
  {
    date: "2025-11-02",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 2.5,
    summary: "Funding disbursement tracking",
    student: "Carlos Martinez",
  },
  {
    date: "2025-11-02",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 2.5,
    summary: "Funding disbursement tracking",
    student: "Diana Wilson",
  },

  // Week 8 - 2025-11-09
  {
    date: "2025-11-09",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.0,
    summary: "Final training sessions completed",
    student: "Aline Silva",
  },
  {
    date: "2025-11-09",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.0,
    summary: "Final training sessions completed",
    student: "Collin Merwin",
  },
  {
    date: "2025-11-09",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.5,
    summary: "Completed tax documents",
    student: "Danny Nguyen",
  },
  {
    date: "2025-11-09",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.5,
    summary: "Completed tax documents",
    student: "Hannah Vo",
  },
  {
    date: "2025-11-09",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 2.5,
    summary: "Mid-implementation review",
    student: "Adam Calnan",
  },
  {
    date: "2025-11-09",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 2.5,
    summary: "Mid-implementation review",
    student: "Annalise Fosnight",
  },
  {
    date: "2025-11-09",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 2.0,
    summary: "Term sheet review and analysis",
    student: "Fatema Sayyed",
  },
  {
    date: "2025-11-09",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 2.0,
    summary: "Term sheet review and analysis",
    student: "Julia Chen",
  },
  {
    date: "2025-11-09",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.5,
    summary: "Campaign metrics review and optimization",
    student: "Elaine Lara",
  },
  {
    date: "2025-11-09",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.5,
    summary: "Campaign metrics review and optimization",
    student: "Krysthal Velarde",
  },
  {
    date: "2025-11-09",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 3.0,
    summary: "Website launched successfully",
    student: "Sarah Johnson",
  },
  {
    date: "2025-11-09",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 3.0,
    summary: "Website launched successfully",
    student: "Tyler Brown",
  },
  {
    date: "2025-11-09",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 2.5,
    summary: "Submitted second grant application",
    student: "Abednego Nakoma",
  },
  {
    date: "2025-11-09",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 2.5,
    summary: "Submitted second grant application",
    student: "Arianna Godinho",
  },
  {
    date: "2025-11-09",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 2.0,
    summary: "Quarterly funding report preparation",
    student: "Carlos Martinez",
  },
  {
    date: "2025-11-09",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 2.0,
    summary: "Quarterly funding report preparation",
    student: "Diana Wilson",
  },

  // Week 9 - 2025-11-16
  {
    date: "2025-11-16",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 1.5,
    summary: "Project wrap-up and documentation",
    student: "Aline Silva",
  },
  {
    date: "2025-11-16",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.0,
    summary: "Year-end planning discussion",
    student: "Danny Nguyen",
  },
  {
    date: "2025-11-16",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 2.0,
    summary: "Implementation progress check",
    student: "Adam Calnan",
  },
  {
    date: "2025-11-16",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 2.5,
    summary: "Investment closing preparation",
    student: "Fatema Sayyed",
  },
  {
    date: "2025-11-16",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.0,
    summary: "Holiday campaign performance analysis",
    student: "Elaine Lara",
  },
  {
    date: "2025-11-16",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 2.5,
    summary: "Post-launch optimization",
    student: "Sarah Johnson",
  },
  {
    date: "2025-11-16",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 2.0,
    summary: "Grant compliance review",
    student: "Abednego Nakoma",
  },
  {
    date: "2025-11-16",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 1.5,
    summary: "Funding utilization planning",
    student: "Carlos Martinez",
  },

  // Week 11 - 2025-11-30
  {
    date: "2025-11-30",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 2.0,
    summary: "Final project report delivery",
    student: "Aline Silva",
  },
  {
    date: "2025-11-30",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.5,
    summary: "Year-end closing procedures",
    student: "Danny Nguyen",
  },
  {
    date: "2025-11-30",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 2.5,
    summary: "Final implementation support",
    student: "Adam Calnan",
  },
  {
    date: "2025-11-30",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 3.0,
    summary: "Investment deal closed successfully",
    student: "Fatema Sayyed",
  },
  {
    date: "2025-11-30",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 2.0,
    summary: "Campaign wrap-up report",
    student: "Elaine Lara",
  },
  {
    date: "2025-11-30",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 2.5,
    summary: "Website performance review",
    student: "Sarah Johnson",
  },
  {
    date: "2025-11-30",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 2.5,
    summary: "Second grant approved",
    student: "Abednego Nakoma",
  },
  {
    date: "2025-11-30",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 2.0,
    summary: "Annual funding report",
    student: "Carlos Martinez",
  },

  // Week 12 - 2025-12-07
  {
    date: "2025-12-07",
    clinic: "Accounting Clinic",
    client: "City of Malden",
    hours: 1.5,
    summary: "Project closure and handover",
    student: "Aline Silva",
  },
  {
    date: "2025-12-07",
    clinic: "Accounting Clinic",
    client: "Crown Legends",
    hours: 2.0,
    summary: "Final financial statements",
    student: "Danny Nguyen",
  },
  {
    date: "2025-12-07",
    clinic: "Consulting Clinic",
    client: "Intriguing Hair",
    hours: 2.0,
    summary: "Project completion report",
    student: "Adam Calnan",
  },
  {
    date: "2025-12-07",
    clinic: "Consulting Clinic",
    client: "Serene Cycle",
    hours: 2.5,
    summary: "Post-investment planning",
    student: "Fatema Sayyed",
  },
  {
    date: "2025-12-07",
    clinic: "Marketing Clinic",
    client: "The Downtown Paw",
    hours: 1.5,
    summary: "Final deliverables and handover",
    student: "Elaine Lara",
  },
  {
    date: "2025-12-07",
    clinic: "Marketing Clinic",
    client: "Marabou Café",
    hours: 2.0,
    summary: "Project completion and documentation",
    student: "Sarah Johnson",
  },
  {
    date: "2025-12-07",
    clinic: "Resource Acquisition Clinic",
    client: "Future Masters of Chess Academy",
    hours: 2.0,
    summary: "Final grant report and sustainability plan",
    student: "Abednego Nakoma",
  },
  {
    date: "2025-12-07",
    clinic: "Resource Acquisition Clinic",
    client: "SEED",
    hours: 1.5,
    summary: "Funding sustainability planning",
    student: "Carlos Martinez",
  },
]

// Map clients to their IDs
const clientMapping: Record<string, string> = {
  "City of Malden": "ce7a85ca-21ee-480d-8683-307750baf342",
  "Crown Legends": "4086f1c2-f472-477b-8e90-3d5e1026c1da",
  "Future Masters of Chess Academy": "573b33b0-25de-4593-ac70-0dcff1f12063",
  "Intriguing Hair": "2c3d8fab-7d43-4659-898d-c5b97db95be6",
  "Marabou Café": "336116c8-b7e4-40ab-9ce3-64539f9d74b6",
  "Muffy White": "2aff5b9e-78dd-4235-bb20-dc4fb128f989",
  REWRITE: "de744b6e-0b47-4adf-a3c1-9198916f83bf",
  "Sawyer Parks": "3aaf69c0-5349-4cb2-9c51-c6395580e4d9",
  SEED: "305204f7-a7f6-466d-b798-81c4406a4cce",
  "Serene Cycle": "5a7b1fd5-763e-4a25-a673-d02febf756e5",
  "The Downtown Paw": "54fa0187-125c-45bc-a344-58ec5d48ad92",
}

async function importWeeklySummaries() {
  console.log("Starting weekly_summaries import...")

  // Step 1: Get semester_schedule for date mapping
  const { data: scheduleData, error: scheduleError } = await supabase
    .from("semester_schedule")
    .select("id, week_end")
    .order("week_end")

  if (scheduleError) {
    console.error("Error fetching semester_schedule:", scheduleError)
    return
  }

  const scheduleMap = new Map<string, string>()
  scheduleData?.forEach((s) => {
    scheduleMap.set(s.week_end, s.id)
  })

  console.log("Loaded", scheduleData?.length, "semester_schedule entries")

  // Step 2: Get existing weekly_summaries to check for duplicates
  const { data: existingSummaries, error: existingError } = await supabase
    .from("weekly_summaries")
    .select("client_name, week_ending, clinic")

  if (existingError) {
    console.error("Error fetching existing summaries:", existingError)
    return
  }

  const existingKeys = new Set<string>()
  existingSummaries?.forEach((s) => {
    existingKeys.add(`${s.client_name}|${s.week_ending}|${s.clinic}`)
  })

  console.log("Found", existingSummaries?.length, "existing summaries")

  // Step 3: Aggregate CSV data by client + week + clinic
  const aggregated = new Map<
    string,
    {
      week_ending: string
      clinic: string
      client_name: string
      client_id: string | null
      semester_schedule_id: string | null
      total_hours: number
      student_count: number
      students: Set<string>
      summaries: string[]
      semester: string
    }
  >()

  for (const row of csvData) {
    const key = `${row.client}|${row.date}|${row.clinic}`

    if (!aggregated.has(key)) {
      aggregated.set(key, {
        week_ending: row.date,
        clinic: row.clinic,
        client_name: row.client,
        client_id: clientMapping[row.client] || null,
        semester_schedule_id: scheduleMap.get(row.date) || null,
        total_hours: 0,
        student_count: 0,
        students: new Set(),
        summaries: [],
        semester: "Fall 2025",
      })
    }

    const agg = aggregated.get(key)!
    agg.total_hours += row.hours
    agg.students.add(row.student)
    if (!agg.summaries.includes(row.summary)) {
      agg.summaries.push(row.summary)
    }
  }

  // Step 4: Prepare records for insertion
  const recordsToInsert: Array<{
    week_ending: string
    clinic: string
    client_name: string
    client_id: string | null
    semester_schedule_id: string | null
    total_hours: number
    student_count: number
    summary: string
    semester: string
    activity_count: number
  }> = []

  let duplicatesSkipped = 0

  for (const [key, agg] of aggregated) {
    // Check for duplicates
    if (existingKeys.has(key)) {
      duplicatesSkipped++
      continue
    }

    recordsToInsert.push({
      week_ending: agg.week_ending,
      clinic: agg.clinic,
      client_name: agg.client_name,
      client_id: agg.client_id,
      semester_schedule_id: agg.semester_schedule_id,
      total_hours: Math.round(agg.total_hours * 100) / 100,
      student_count: agg.students.size,
      summary: agg.summaries.join("; "),
      semester: agg.semester,
      activity_count: agg.students.size,
    })
  }

  console.log("Prepared", recordsToInsert.length, "records for insertion")
  console.log("Skipped", duplicatesSkipped, "duplicates")

  // Step 5: Insert records in batches
  if (recordsToInsert.length > 0) {
    const batchSize = 50
    let inserted = 0

    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize)
      const { data, error } = await supabase.from("weekly_summaries").insert(batch).select()

      if (error) {
        console.error("Error inserting batch:", error)
      } else {
        inserted += data?.length || 0
        console.log("Inserted batch", Math.floor(i / batchSize) + 1, "-", data?.length, "records")
      }
    }

    console.log("Total inserted:", inserted, "records")
  }

  // Step 6: Verify final count
  const { count } = await supabase.from("weekly_summaries").select("*", { count: "exact", head: true })

  console.log("Final weekly_summaries count:", count)
  console.log("Import complete!")
}

importWeeklySummaries()

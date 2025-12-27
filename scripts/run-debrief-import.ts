import { createClient } from "@supabase/supabase-js"

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// CSV Data - parsed from the MIGRATION_DEBRIEFS CSV file
// This is the cleaned and formatted data ready for import
const debriefRecords = [
  {
    date: "2025-12-05",
    clinic: "Consulting",
    client: "Sawyer Parks",
    hours: 12,
    summary:
      "Backdating since last form – built prezy, prepped final changes w team this week, finalized prototype floor plans & designs. Making small tweaks to prezy",
    student: "Adam Calnan",
    questions: "",
    action_items: "Also forecasting multiple team rehearsals – super hard to get collective availability :/",
  },
  {
    date: "2025-12-04",
    clinic: "Resource Acquisition",
    client: "Crown Legends",
    hours: 6,
    summary: "Worked on final presentation & finalized funding package",
    student: "Mason Holt",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-12-04",
    clinic: "Resource Acquisition",
    client: "City of Malden",
    hours: 3,
    summary: "Final Presentation. Final Deliverable Document. Business Resource Guide Review",
    student: "Muskan Kapoor",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-12-04",
    clinic: "Resource Acquisition",
    client: "Intriguing Hair",
    hours: 8,
    summary:
      "This week was a major one because we had to finalize all our deliverables and presentation. I'm glad we managed to complete everything we discussed with our client, except for the one inventory management task that was a little incomplete due to a lack of synthesized data on the client's end. However, in the end, it was very rewarding to hear our client's feedback in the final meeting as she was happy with what we presented.",
    student: "Keya Patel",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-12-04",
    clinic: "Resource Acquisition",
    client: "Marabou Café",
    hours: 5,
    summary:
      "This week, the main focus was on working on our final presentation. We have been preparing our final Deliverables to the client as well as consulting our Clinical director to do a review of our work.",
    student: "Nyasha Mukwat",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-12-01",
    clinic: "Accounting",
    client: "REWRITE",
    hours: 8,
    summary:
      "Final project work, writing the Tax Analysis, Revenue Analysis, meeting with teams for rehearsal of final project. This was for the week of November 24-December 1",
    student: "Declan Leahy",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-30",
    clinic: "Consulting",
    client: "Marabou Café",
    hours: 12.9,
    summary:
      "Create and share final presentation (Canva). Complete the Catering Expansion Plan. Respond to lawyers asap- invite to presentation. Compile all deliverables > check against SOW. Send client progress report / email. Send client catering expansion plan. Review deliverables and make recommendations. Schedule final presentation run through",
    student: "Marian O'Brien",
    questions: "",
    action_items:
      "Send all deliverables to professor mooney. Finalize deliverables as a team based on professor feedback. Create packet with all deliverables. Send deliverables to the client. Develop slides for the final presentation (introduction, legal and operations). Finalize slides as a team. Practice presentation as a team. Send final presentation to the client and professor",
  },
  {
    date: "2025-11-29",
    clinic: "Resource Acquisition",
    client: "REWRITE",
    hours: 9.5,
    summary:
      "This week, I wrapped up all of our deliverables for the client. I completed the full investor list, found and added points of contact, and gathered additional recommendations like grants and accelerators that align with their updated funding strategy. I also compiled everything into the written 'Compilation of All Deliverables' document and finished the PowerPoint to go along with it. Overall, everything is finalized and ready for review.",
    student: "Klestiola Xherimeja",
    questions: "",
    action_items:
      "Team dry run today at 6 PM. Additional team meeting tomorrow if needed. Send the full deliverables package to the directors and the client. Final presentation on Monday",
  },
  {
    date: "2025-11-29",
    clinic: "Resource Acquisition",
    client: "REWRITE",
    hours: 4.5,
    summary: "Finalized deliverables, worked on final presentation and final deliverable document",
    student: "Max Banoun",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-28",
    clinic: "Accounting",
    client: "City of Malden",
    hours: 2,
    summary:
      "Worked on the KPI Dashboard for final deliverable documents, along with the final presentation in the works for the client presentation on 12/8.",
    student: "Neel Patel",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-27",
    clinic: "Consulting",
    client: "Serene Cycle",
    hours: 12,
    summary:
      "1 hour – Affiliate Program Troubleshooting. 3 hours – Final Presentation Formatting & Content Development. 1 hour – Team Meeting. 3 hours – Client Communication on Career Pivot. 1 hour – Marketing Meeting. 1.5 hours – Client Meeting. 1.5 hours – Post-Meeting Email Drafting.",
    student: "Annalise Fosnight",
    questions: "Not applicable",
    action_items: "Not applicable",
  },
  {
    date: "2025-11-27",
    clinic: "Resource Acquisition",
    client: "Crown Legends",
    hours: 5,
    summary:
      "Met with Prof. Mooney to discuss funding path for our client, worked on a Funding 101 presentation to present to our client prior to final presentation",
    student: "Mason Holt",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-27",
    clinic: "Consulting",
    client: "SEED",
    hours: 6,
    summary:
      "Working on the final presentation slides. We had a client meeting, three team meetings, one mini team meeting and the rest was independent research time.",
    student: "Masudi Mugudwa",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-27",
    clinic: "Accounting",
    client: "Serene Cycle",
    hours: 4,
    summary: "Finished all the client work and finished presentation for the 1st",
    student: "Riley Dibiase",
    questions: "NA",
    action_items: "NA",
  },
  {
    date: "2025-11-27",
    clinic: "Resource Acquisition",
    client: "Marabou Café",
    hours: 7,
    summary:
      "It's been my busiest week yet. I began with a Seed class on Monday, then moved straight into meetings with the clinic director and our team members as we prepared for the final project.",
    student: "Nyasha Mukwat",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-27",
    clinic: "Resource Acquisition",
    client: "Crown Legends",
    hours: 4,
    summary:
      "On Monday, we met with the Clinic Directors of Accounting and Resource Acquisition. On Tuesday, we held a meeting with the team leader to review the project's progress. On Wednesday, I met with my funding colleague to finalize our recommendations",
    student: "Abednego Nakoma",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-27",
    clinic: "Resource Acquisition",
    client: "City of Malden",
    hours: 8,
    summary: "Final ppt and deliverable document",
    student: "Muskan Kapoor",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-27",
    clinic: "Resource Acquisition",
    client: "Intriguing Hair",
    hours: 9,
    summary:
      "Our deliverables are 95% done, with a few refinements required on the funding end. It was one of the busiest weeks for me since my other teammate and I had to take care of the financial projections and loan application. I've managed to get the projections done, but it is still a rough draft due to the messy numbers. However, everything is on track. Since we are presenting to the client on 1st Dec, we decided to have Friday as a soft deadline to get all the work done, so it can be sent to the clinic directors for any review.",
    student: "Keya Patel",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-27",
    clinic: "Marketing",
    client: "SEED",
    hours: 12,
    summary:
      "Final presentation meeting x4 hours. Meeting with Patty Corey. Client meeting x1.5 hours. Final presentation design prep individual x2 hours. Run through prep presentation 2.5 hours.",
    student: "Maura Sullivan",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-27",
    clinic: "Marketing",
    client: "The Downtown Paw",
    hours: 4,
    summary:
      "I finalized my KPI assignment, ensuring that the performance indicators are clearly defined and organized in the dashboard. I finalized the report, which provides a comprehensive overview of the findings, insights, and recommendations. I designed and finalized a website mockup that demonstrates the proposed structure, layout, and SEO optimization. I also created several social media videos and posts for The Downtown Paw that establish a consistent and engaging visual identity across all platforms.",
    student: "Maggie Murphy",
    questions: "",
    action_items:
      "My remaining action items focus on preparing for the upcoming presentation and final deliverables. I will be meeting with my team to practice, refine our delivery, and ensure that the finalized materials are presented clearly and effectively.",
  },
  {
    date: "2025-11-23",
    clinic: "Resource Acquisition",
    client: "REWRITE",
    hours: 5.5,
    summary:
      "This week, I focused on updating the client deliverables and making progress on the investor list. Even though we haven't fully finished everything yet, we made steady progress and continued refining the materials based on the client's updated funding strategy. I also started putting together some recommendations beyond the original deliverable to help strengthen the client's overall approach.",
    student: "Klestiola Xherimeja",
    questions: "",
    action_items: "Finalize all deliverables, including the updated investor list and recommendations",
  },
  {
    date: "2025-11-22",
    clinic: "Consulting",
    client: "SEED",
    hours: 12,
    summary:
      "1 client meeting, 3 mini team meetings, 3 team meetings, 2 client information gathering meetings and 3 hours of independent research. We have updated the budget with current budget information and designed an assumption revenue funding model.",
    student: "Masudi Mugudwa",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-21",
    clinic: "Accounting",
    client: "Marabou Café",
    hours: 4,
    summary:
      "Finished a deliverable: effective excel reporting templates. Working on posting all transactions into QBO. QBO chart of accounts done and sent to client for review",
    student: "Aline Silva",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-21",
    clinic: "Accounting",
    client: "Muffy White",
    hours: 3.5,
    summary:
      "Summary of Work – Past 7 Weeks. Received documents from Muffy's bookkeeper: P&L statements for 2023, 2024, and 2025. Gusto payroll records for 2024 and 2025. Received invoices from Muffy, covering March 2024 through November 2025.",
    student: "Merelyn Sojan Choorakoottil",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-21",
    clinic: "Resource Acquisition",
    client: "REWRITE",
    hours: 3.5,
    summary:
      "Met with Richard Meiklejohn on Monday to discuss any ideas he may have for rewrite, and he was able to provide us some great insight which we have passed along to Alik. Additionally we have almost completed our list of VC funds.",
    student: "Max Banoun",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-20",
    clinic: "Resource Acquisition",
    client: "Crown Legends",
    hours: 5,
    summary: "Created a grant application template and have 3 suggestions for grants to apply for",
    student: "Mason Holt",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-20",
    clinic: "Accounting",
    client: "REWRITE",
    hours: 5,
    summary:
      "Analyzing Financials for better classification of accounts. Worked on 174 A analysis and how it pertains to ReWrite",
    student: "Declan Leahy",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-20",
    clinic: "Resource Acquisition",
    client: "Intriguing Hair",
    hours: 3,
    summary:
      "We had a meeting with Nikia and Professor Mooney, which gave us a better understanding of the type of funding she is looking for and our next steps.",
    student: "Ishani Rana",
    questions: "",
    action_items: "We will be working on finishing the financial projections this weekend and having our team meeting.",
  },
  {
    date: "2025-11-20",
    clinic: "Accounting",
    client: "Serene Cycle",
    hours: 10,
    summary:
      "This week I finished getting everything brought into QuickBooks and finished organizing it completely. I made about 5 training videos to send to the client for future reference. I made a pricing model based on the commission she needs to pay her management team and the influencers in her affiliate program. Made a cheat sheet for important terms and explanations for a Profit and Loss and Balance Sheet. Meet with Jamie on Monday and prepping for final meeting on Friday where we will work on QuickBooks training and how to use the pricing model.",
    student: "Riley Dibiase",
    questions: "N/A",
    action_items: "Just waiting for the final meeting with client and then we will be all complete!",
  },
  {
    date: "2025-11-20",
    clinic: "Consulting",
    client: "Intriguing Hair",
    hours: 7,
    summary:
      "Met with Nikia to map the business model, product lines and customer segments. Worked with the Foley & Lardner legal clinic to assess trademark risk. Coordinated with the Marketing Clinic to design a customer survey.",
    student: "Shubhangi Srivastava",
    questions: "No questions, everything is working out really well.",
    action_items:
      "Awaiting further guidance from Mead and the Foley team on the logo change versus name change strategy.",
  },
  {
    date: "2025-11-20",
    clinic: "Consulting",
    client: "REWRITE",
    hours: 6,
    summary:
      "Work on building business KPI dashboard as one of the deliverable for our client, Developed shareable document for the entire team to compile their individual deliverables.",
    student: "Shah Sakshi Sanjay",
    questions: "None for this week",
    action_items: "Upcoming meeting with client on Monday, 11/24",
  },
  {
    date: "2025-11-20",
    clinic: "Accounting",
    client: "Sawyer Parks",
    hours: 4,
    summary:
      "working on forecasting, comparing numbers with similar buildings in the region, researching the types of tenants that would best suit the building",
    student: "Sara Marmoucha",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-20",
    clinic: "Resource Acquisition",
    client: "Serene Cycle",
    hours: 4,
    summary:
      "Did some light research this week. Will continue to add final information into the excel I've prepared for my client. This week I was unable to provide much time to my client work due to other obligations. I will be making it up by next week.",
    student: "Ashley Gonzalez",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-20",
    clinic: "Consulting",
    client: "Serene Cycle",
    hours: 8.5,
    summary:
      "Marketing Meeting – 1 hour. Client Meeting – 1 hour. Client Calls (2x) – 2 hours. Email Communication – ~3 hours. Final Presentation Preparation – 1 hour.",
    student: "Annalise Fosnight",
    questions: "N/A",
    action_items: "N/A",
  },
  {
    date: "2025-11-20",
    clinic: "Consulting",
    client: "Marabou Café",
    hours: 5.5,
    summary:
      "Send client weekly progress report. Work on Catering Expansion tasks. Re-prioritize our deliverables with the team. Email Paulette - marketing deliverable (personas) / request meeting time for Quickbooks. Email Mahek back feedback on survey. Send email about templates to team",
    student: "Marian O'Brien",
    questions: "",
    action_items: "We will be working on completing deliverables and beginning the final presentation.",
  },
  {
    date: "2025-11-20",
    clinic: "Consulting",
    client: "Crown Legends",
    hours: 4,
    summary:
      "This week, my team focused on finalizing the deliverables. Stuti is going to finish the forecasting on Friday and immediately send it to Mason and Abed in order for them to meet with Ken and figure out the best funding options. I have set up a meeting with Al after Thanksgiving for Mason and Abed's presentation. The focus now is to fully get the delieverables done and start working on the final presentation.",
    student: "Franziska Greiner",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-20",
    clinic: "Marketing",
    client: "Sawyer Parks",
    hours: 3,
    summary:
      "Client presentation is coming together. We are currently working on forming it, I just finished my marketing plan (marketing persona). I met with my consulting leader over zoom to discuss further marketing plans.",
    student: "Rayah Sibunga",
    questions: "N/a",
    action_items: "N/a",
  },
  {
    date: "2025-11-20",
    clinic: "Resource Acquisition",
    client: "Intriguing Hair",
    hours: 6,
    summary:
      "This week was a great milestone for us. We completed our marketing deliverable and have made significant progress with the accounting deliverables. We were also able to have our client communicate her legal issues with the law team.",
    student: "Keya Patel",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-20",
    clinic: "Marketing",
    client: "The Downtown Paw",
    hours: 5,
    summary:
      "This week I've been finishing up the marketing deliverables and formatting the report. I worked with Krysthal to finalize the go-to-market plan, ensuring all the strategy elements fit together cohesively.",
    student: "Maggie Murphy",
    questions: "",
    action_items:
      "My next steps are to complete the marketing dashboard with Krysthal this week and complete a final proofread of the marketing report.",
  },
  {
    date: "2025-11-20",
    clinic: "Resource Acquisition",
    client: "Marabou Café",
    hours: 5,
    summary:
      "Documented updates on client progress and funding needs. Advanced work on financing strategies and resource clinic tasks. Maintained notes to keep the SEED program updated on client developments.",
    student: "Nyasha Mukwat",
    questions: "",
    action_items:
      "Continue follow-ups on funding opportunities. Track pending items required to move forward with Marabou Café's financing journey",
  },
  {
    date: "2025-11-20",
    clinic: "Resource Acquisition",
    client: "Crown Legends",
    hours: 4,
    summary:
      "On Monday, I met with the clinic director to assess and evaluate potential funding opportunities for Crown Legends. I also held a Zoom meeting with Mason to finalize funding recommendations.",
    student: "Abednego Nakoma",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-20",
    clinic: "Marketing",
    client: "SEED",
    hours: 8,
    summary:
      "Final presentation meeting. Client meeting. Team meeting. Creation of presentation style guide. Team meeting to re-draft final presentation",
    student: "Maura Sullivan",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-16",
    clinic: "Resource Acquisition",
    client: "REWRITE",
    hours: 4,
    summary:
      "This week, we met with Rewrite on Wednesday and got clarification about their funding status. They weren't able to secure their pre-seed round and are now reassessing their strategy.",
    student: "Klestiola Xherimeja",
    questions: "",
    action_items: "Finalize the investor list. Meet with Richard on Monday for more market insight",
  },
  {
    date: "2025-11-16",
    clinic: "Resource Acquisition",
    client: "Intriguing Hair",
    hours: 2.5,
    summary: "This week, we had a team meeting and continued researching the wig industry for our client.",
    student: "Ishani Rana",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-14",
    clinic: "Accounting",
    client: "Marabou Café",
    hours: 3,
    summary:
      "I had a zoom meeting with the owner and was able to set up a quickbooks and was even able to integrate clover. Looked into their financial reports and looked into more effective financial reporting templates",
    student: "Aline Silva",
    questions: "",
    action_items:
      "I'm currently waiting to hear back from them on which financial reporting templates she best prefers me to improve",
  },
  {
    date: "2025-11-13",
    clinic: "Resource Acquisition",
    client: "Crown Legends",
    hours: 5,
    summary:
      "Continued working on a Funding Debrief presentation for Crown, and gained insight from Prof Mooney and Mark",
    student: "Mason Holt",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-13",
    clinic: "Consulting",
    client: "Crown Legends",
    hours: 8,
    summary:
      "This week, we had a long discussion with Ken and Mark about our client's financials. I used Shopify and Instagram to get an estimate on how many hat drops they have done each year to help us with forecasting for next year.",
    student: "Franziska Greiner",
    questions: "",
    action_items:
      "We're currently waiting for the accounting team to do the forecasting for next year in order to move forward with funding options.",
  },
  {
    date: "2025-11-13",
    clinic: "Consulting",
    client: "SEED",
    hours: 4,
    summary:
      "Participated in client meeting, will meet with Maura directly for deliverable action. Communicated with team.",
    student: "Stuart Atkinson",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-13",
    clinic: "Resource Acquisition",
    client: "Serene Cycle",
    hours: 6,
    summary:
      "Finished compiling my excel workbook. The workbook included grants and accelerator programs that are currently rolling. I will include a section for events and angel investors in the following week.",
    student: "Ashley Gonzalez",
    questions: "",
    action_items: "",
  },
  {
    date: "2025-11-13",
    clinic: "Consulting",
    client: "Marabou Café",
    hours: 7,
    summary:
      "Send email about templates to team. Client meeting (1 hour). Email Paulette - marketing deliverable (personas). Review Mahek's survey. Outline Catering Expansion tasks.",
    student: "Marian O'Brien",
    questions: "Can you provide any information about how and why each client was matched with their SEED team?",
    action_items: "We need to reprioritize deliverables based on what is available to us.",
  },
  {
    date: "2025-11-13",
    clinic: "Resource Acquisition",
    client: "The Downtown Paw",
    hours: 4,
    summary:
      "Went through the missing documents and researched a bit about Prof Mooney option for build out and SBA 504",
    student: "Urmi Vaghela",
    questions: "",
    action_items: "",
  },
]

// Clinic name normalization mapping
const clinicNameMap: Record<string, string> = {
  Funding: "Resource Acquisition",
  "Resource Acquisition": "Resource Acquisition",
  Consulting: "Consulting",
  Marketing: "Marketing",
  Accounting: "Accounting",
}

async function importDebriefs() {
  console.log("Starting debrief import...")
  console.log("This script maps the following fields to UUIDs:")
  console.log("  - student_id: UUID from students table (matched by full_name)")
  console.log("  - client_id: UUID from clients table (matched by name)")
  console.log("  - clinic_id: UUID from clinics table (matched by name)")
  console.log("  - clinic: Text field (denormalized for convenience)")
  console.log("  - client_name: Text field (denormalized for convenience)")
  console.log("  - week_ending: Date field (calculated Friday of the week)")
  console.log("")

  // 1. Fetch all students for name matching
  const { data: students, error: studentsError } = await supabase.from("students").select("id, full_name, email")

  if (studentsError) {
    console.error("Error fetching students:", studentsError)
    return
  }
  console.log(`Loaded ${students?.length || 0} students`)

  // 2. Fetch all clients for name matching
  const { data: clients, error: clientsError } = await supabase.from("clients").select("id, name")

  if (clientsError) {
    console.error("Error fetching clients:", clientsError)
    return
  }
  console.log(`Loaded ${clients?.length || 0} clients`)

  // 3. Fetch all clinics for name matching
  const { data: clinics, error: clinicsError } = await supabase.from("clinics").select("id, name")

  if (clinicsError) {
    console.error("Error fetching clinics:", clinicsError)
    return
  }
  console.log(`Loaded ${clinics?.length || 0} clinics`)

  // 4. Fetch active semester
  const { data: semester, error: semesterError } = await supabase
    .from("semester_config")
    .select("id")
    .eq("is_active", true)
    .maybeSingle()

  if (semesterError) {
    console.error("Error fetching semester:", semesterError)
  }
  console.log(`Active semester: ${semester?.id || "none"}`)

  // Helper function to find student by name (fuzzy match)
  function findStudent(name: string) {
    if (!students) return null
    const normalizedName = name.toLowerCase().trim()
    return students.find((s) => {
      const fullName = s.full_name?.toLowerCase().trim()
      return (
        fullName === normalizedName || fullName?.includes(normalizedName) || normalizedName.includes(fullName || "")
      )
    })
  }

  // Helper function to find client by name (fuzzy match)
  function findClient(name: string) {
    if (!clients) return null
    const normalizedName = name.toLowerCase().trim()
    return clients.find((c) => {
      const clientName = c.name?.toLowerCase().trim()
      return (
        clientName === normalizedName ||
        clientName?.includes(normalizedName) ||
        normalizedName.includes(clientName || "")
      )
    })
  }

  // Helper function to find clinic by name
  function findClinic(name: string) {
    if (!clinics) return null
    const normalizedName = clinicNameMap[name] || name
    return clinics.find((c) => c.name?.toLowerCase().trim() === normalizedName.toLowerCase().trim())
  }

  // Track unmapped records
  const unmappedStudents = new Set<string>()
  const unmappedClients = new Set<string>()
  const unmappedClinics = new Set<string>()

  // Process and insert records
  const recordsToInsert = []

  for (const record of debriefRecords) {
    const student = findStudent(record.student)
    const client = findClient(record.client)
    const clinic = findClinic(record.clinic)

    if (!student) unmappedStudents.add(record.student)
    if (!client) unmappedClients.add(record.client)
    if (!clinic) unmappedClinics.add(record.clinic)

    // Calculate week_ending (end of the week for the date)
    const dateObj = new Date(record.date)
    const dayOfWeek = dateObj.getDay()
    const daysUntilSunday = 7 - dayOfWeek
    const weekEnding = new Date(dateObj)
    weekEnding.setDate(weekEnding.getDate() + daysUntilSunday)

    // Combine work summary with action items
    let fullSummary = record.summary
    if (
      record.action_items &&
      record.action_items.trim() !== "" &&
      record.action_items.toLowerCase() !== "n/a" &&
      record.action_items.toLowerCase() !== "na"
    ) {
      fullSummary += `\n\nAction Items: ${record.action_items}`
    }

    recordsToInsert.push({
      student_id: student?.id || null,
      student_email: student?.email || null,
      client_id: client?.id || null,
      client_name: record.client,
      clinic_id: clinic?.id || null,
      clinic: clinicNameMap[record.clinic] || record.clinic,
      hours_worked: record.hours,
      work_summary: fullSummary,
      questions:
        record.questions && record.questions.toLowerCase() !== "n/a" && record.questions.toLowerCase() !== "na"
          ? record.questions
          : null,
      date_submitted: new Date(record.date).toISOString(),
      week_ending: weekEnding.toISOString().split("T")[0],
      semester_id: semester?.id || null,
      status: "submitted",
    })
  }

  // Report unmapped entities
  if (unmappedStudents.size > 0) {
    console.log("\n⚠️ Unmapped Students:")
    unmappedStudents.forEach((s) => console.log(`  - ${s}`))
  }
  if (unmappedClients.size > 0) {
    console.log("\n⚠️ Unmapped Clients:")
    unmappedClients.forEach((c) => console.log(`  - ${c}`))
  }
  if (unmappedClinics.size > 0) {
    console.log("\n⚠️ Unmapped Clinics:")
    unmappedClinics.forEach((c) => console.log(`  - ${c}`))
  }

  // Insert in batches of 50
  const batchSize = 50
  let insertedCount = 0
  let errorCount = 0

  for (let i = 0; i < recordsToInsert.length; i += batchSize) {
    const batch = recordsToInsert.slice(i, i + batchSize)

    const { data, error } = await supabase.from("debriefs").insert(batch).select()

    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
      errorCount += batch.length
    } else {
      insertedCount += data?.length || 0
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} records`)
    }
  }

  console.log(`\n✅ Import complete!`)
  console.log(`   Total records processed: ${debriefRecords.length}`)
  console.log(`   Successfully inserted: ${insertedCount}`)
  console.log(`   Errors: ${errorCount}`)
}

// Run the import
importDebriefs()

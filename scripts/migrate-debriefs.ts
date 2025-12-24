// Migration Script: Import Debriefs from CSV to Supabase
// This script properly links each debrief to student_id, client_id, and week from semester_schedule

import { createClient } from "@supabase/supabase-js"

// CSV Data - parsed from the uploaded file
const csvData = `Date,Clinic,Client,Hours Worked,Summary of work,Student Name,Questions,Action Items
12/5/2025,Consulting,Sawyer Parks,12,"Backdating since last form – built prezy, prepped final changes w team this week, finalized prototype floor plans & designs",Adam Calnan,,Also forecasting multiple team rehearsals
12/4/2025,Funding,Crown Legends,6,Worked on final presentation & finalized funding package,Mason Holt,,
12/4/2025,Funding,City of Malden,3,"Final Presentation, Final Deliverable Document, Business Resource Guide Review",Muskan Kapoor,,
12/4/2025,Funding,Intriguing Hair,8,"This week was a major one because we had to finalize all our deliverables and presentation.",Keya Patel,,
12/4/2025,Funding,Marabou Café,5,"This week, the main focus was on working on our final presentation.",Nyasha Mukwat,,
12/4/2025,Marketing,The Downtown Paw,3,"This week, I met with Krysthal on Wednesday to work together on our final presentation slides.",Maggie Murphy,,Our team will be meeting on zoom this weekend
12/1/2025,Accounting,REWRITE,8,"Final project work, writing the Tax Analysis, Revenue Analysis, meeting with teams for rehearsal.",Declan Leahy,,
11/30/2025,Consulting,Marabou Café,12.9,"Create and share final presentation, Complete the Catering Expansion Plan, Respond to lawyers.",Marian O'Brien,,Send all deliverables to professor
11/29/2025,Funding,REWRITE,9.5,"This week, I wrapped up all of our deliverables for the client.",Klestiola Xherimeja,,Team dry run today at 6 PM
11/29/2025,Funding,REWRITE,4.5,"Finalized deliverables, worked on final presentation and final deliverable document",Max Banoun,,
11/28/2025,Accounting,City of Malden,2,"Worked on the KPI Dashboard for final deliverable documents.",Neel Patel,,
11/27/2025,Consulting,Serene Cycle,12,"Affiliate Program Troubleshooting, Final Presentation Formatting, Team Meeting, Client Communication.",Annalise Fosnight,Not applicable,Not applicable
11/27/2025,Funding,Crown Legends,5,"Met with Prof. Mooney to discuss funding path for our client.",Mason Holt,,
11/27/2025,Consulting,SEED,6,"Working on the final presentation slides. We had a client meeting, three team meetings.",Masudi Mugudwa,,
11/27/2025,Accounting,Serene Cycle,4,Finished all the client work and finished presentation for the 1st,Riley Dibiase,NA,NA
11/27/2025,Funding,Marabou Café,7,"It's been my busiest week yet. I began with a Seed class on Monday.",Nyasha Mukwat,,
11/27/2025,Funding,Crown Legends,4,"On Monday, we met with the Clinic Directors of Accounting and Resource Acquisition.",Abednego Nakoma,,
11/27/2025,Funding,City of Malden,8,Final ppt and deliverable document,Muskan Kapoor,,
11/27/2025,Funding,Intriguing Hair,9,"Our deliverables are 95% done, with a few refinements required on the funding end.",Keya Patel,,
11/27/2025,Marketing,SEED,12,"-Final presentation meeting x4 hours, -Meeting with Patty Corey, -Client meeting x1.5 hours",Maura Sullivan,,
11/27/2025,Marketing,The Downtown Paw,4,"I finalized my KPI assignment, ensuring that the performance indicators are clearly defined.",Maggie Murphy,,My remaining action items focus on preparing for the upcoming presentation
11/23/2025,Funding,REWRITE,5.5,"This week, I focused on updating the client deliverables and making progress on the investor list.",Klestiola Xherimeja,,Finalize all deliverables
11/22/2025,Consulting,SEED,12,"1 client meeting, 3 mini team meetings, 3 team meetings, 2 client information gathering meetings.",Masudi Mugudwa,,
11/21/2025,Accounting,Marabou Café,4,"- Finished a deliverable: effective excel reporting templates",Aline Silva,,
11/21/2025,Accounting,Muffy White,3.5,"Summary of Work – Past 7 Weeks",Merelyn Sojan Choorakoottil,,
11/21/2025,Funding,REWRITE,3.5,"Met with Richard Meiklejohn on Monday to discuss any ideas he may have for rewrite.",Max Banoun,,
11/20/2025,Funding,Crown Legends,5,Created a grant application template and have 3 suggestions for grants to apply for,Mason Holt,,
11/20/2025,Accounting,REWRITE,5,Analyzing Financials for better classification of accounts.,Declan Leahy,,
11/20/2025,Funding,Intriguing Hair,3,"We had a meeting with Nikia and Professor Mooney.",Ishani Rana,,We will be working on finishing the financial projections
11/20/2025,Accounting,Serene Cycle,10,This week I finished getting everything brought into QuickBooks and finished organizing it completely.,Riley Dibiase,N/A,Just waiting for the final meeting with client
11/20/2025,Consulting,Intriguing Hair,7,"-Met with Nikia to map the business model, product lines and customer segments.",Shubhangi Srivastava,No questions,
11/20/2025,Consulting,REWRITE,6,"Work on building business KPI dashboard as one of the deliverable for our client.",Shah Sakshi Sanjay,None for this week,Upcoming meeting with client on Monday
11/20/2025,Accounting,Sawyer Parks,4,"working on forecasting, comparing numbers with similar buildings in the region.",Sara Marmoucha,,
11/20/2025,Funding,Serene Cycle,4,Did some light research this week. Will continue to add final information into the excel.,Ashley Gonzalez,,
11/20/2025,Consulting,Serene Cycle,8.5,"Marketing Meeting, Client Meeting, Client Calls, Email Communication, Final Presentation Preparation.",Annalise Fosnight,N/A,N/A
11/20/2025,Consulting,Marabou Café,5.5,"Send client weekly progress report, Work on Catering Expansion tasks.",Marian O'Brien,,We will be working on completing deliverables
11/20/2025,Consulting,Crown Legends,4,"This week, my team focused on finalizing the deliverables.",Franziska Greiner,,
11/20/2025,Marketing,Sawyer Parks,3,"Client presentation is coming together. I just finished my marketing plan.",Rayah Sibunga,N/a,N/a
11/20/2025,Funding,Intriguing Hair,6,"This week was a great milestone for us. We completed our marketing deliverable.",Keya Patel,,
11/20/2025,Marketing,The Downtown Paw,5,"This week I've been finishing up the marketing deliverables and formatting the report.",Maggie Murphy,,My next steps are to complete the marketing dashboard
11/20/2025,Funding,Marabou Café,5,"Documented updates on client progress and funding needs.",Nyasha Mukwat,,Continue follow-ups on funding opportunities
11/20/2025,Funding,Crown Legends,4,"On Monday, I met with the clinic director to assess and evaluate potential funding opportunities.",Abednego Nakoma,,
11/20/2025,Marketing,SEED,8,"-Final presentation meeting, -Client meeting, -Team meeting, -Creation of presentation style guide",Maura Sullivan,,
11/16/2025,Funding,REWRITE,4,"This week, we met with Rewrite on Wednesday and got clarification about their funding status.",Klestiola Xherimeja,,Finalize the investor list
11/16/2025,Funding,Intriguing Hair,2.5,"This week, we had a team meeting and continued researching the wig industry.",Ishani Rana,,
11/14/2025,Accounting,Marabou Café,3,"- Downloaded many reports from Clover",Aline Silva,,
11/13/2025,Funding,Crown Legends,5,"Continued working on a Funding Debrief presentation for Crown.",Mason Holt,,
11/13/2025,Consulting,Crown Legends,8,"This week, we had a long discussion with Ken and Mark about our client's financials.",Franziska Greiner,,
11/13/2025,Consulting,SEED,4,"Participated in client meeting, will meet with Maura directly for deliverable action.",Stuart Atkinson,,
11/13/2025,Funding,Serene Cycle,6,Finished compiling my excel workbook with grants and accelerator programs.,Ashley Gonzalez,,
11/13/2025,Consulting,Marabou Café,7,"Send email about templates to team, Client meeting, Review Mahek's survey.",Marian O'Brien,Can you provide any information about how each client was matched?,
11/13/2025,Funding,The Downtown Paw,4,Went through the missing documents and researched SBA 504,Urmi Vaghela,,
11/13/2025,Marketing,Sawyer Parks,4,"I completed a full marketing plan for Sawyer Parks Enterprises.",Rayah Sibunga,N/a,Response from Hanna
11/13/2025,Consulting,Serene Cycle,10,"Client Communication, Advisor Communication, Team Meeting, Accounting Clinic Meeting.",Annalise Fosnight,N/A,
11/13/2025,Consulting,REWRITE,6,Had meeting with REWRITE team and work on the shareable document.,Shah Sakshi Sanjay,None,Working on the deliverables
11/13/2025,Accounting,REWRITE,2,"Weekly synch with team and worked on financial statement.",Declan Leahy,,
11/13/2025,Accounting,REWRITE,2,"Weekly synch with team, worked on financial statement.",Declan Leahy,Rewrite communicated that are shifting timelines,
11/13/2025,Marketing,SEED,5.5,"-Client meeting with Chaim, -Took notes for my team.",Maura Sullivan,,In-person meeting with group
11/13/2025,Consulting,SEED,5,"3 meetings: one with client, two with team, 2.5 hours of independent research.",Masudi Mugudwa,,
11/13/2025,Marketing,The Downtown Paw,3,"This week, I focused on writing, formatting, and emailing the final copy of the press release.",Maggie Murphy,,I will meet with the team leader on Zoom
11/13/2025,Funding,Intriguing Hair,4,"This week, we had a meeting with the client and the legal team.",Keya Patel,,
11/13/2025,Funding,Marabou Café,5,"This week, I have started working on alternative funding.",Nyasha Mukwat,,
11/13/2025,Funding,REWRITE,3,Continued working on our list and prepared for our call with Professor Mooney.,Max Banoun,,
11/13/2025,Funding,City of Malden,4,Business Resource Guide for Funding,Muskan Kapoor,,
11/13/2025,Funding,Crown Legends,6,"On Monday, I met with the Clinic Director to discuss ongoing initiatives.",Abednego Nakoma,,
11/13/2025,Accounting,The Downtown Paw,5,"Summary of the past 2 weeks: We received the 2023 and 2024 financials.",Merelyn Sojan Choorakoottil,How much financing does Kate plan to request?,Need to start preparing the presentation slides
11/10/2025,Marketing,Serene Cycle,10,"3 client meetings. Website SEO, review section in the webpage, affiliate program.",Nicole Nessim,,
11/9/2025,Funding,REWRITE,4.5,"This week, Max and I reached out to Richard Meiklejohn.",Klestiola Xherimeja,,Meet with Richard on Monday
11/7/2025,Accounting,Marabou Café,3,"- Downloaded many reports from Clover, Looked into their financials.",Aline Silva,,
11/7/2025,Consulting,Sawyer Parks,3.5,"Toured multiple fi-di fast office suites at 265 Franklin and 160 Federal St.",Adam Calnan,,Received SOW sign from Hana
11/7/2025,Accounting,REWRITE,3,Analysis of company financial excel spreadsheet.,Declan Leahy,,
11/7/2025,Funding,Crown Legends,4,"Met with the clinic director on Monday, followed by a meeting with the client.",Abednego Nakoma,,
11/7/2025,Accounting,Serene Cycle,7,Scheduled meeting with Jamie to get on QuickBooks.,Riley Dibiase,N/A,
11/6/2025,Funding,Intriguing Hair,5,"We had our team meeting with the directors this week on Monday.",Keya Patel,,
11/6/2025,Consulting,Crown Legends,6,"At the end of last week, I had 1-1 meetings with each clinic.",Franziska Greiner,,Currently waiting to hear back from our client
11/6/2025,Consulting,Marabou Café,8,"Finish Marabou Cafe templates, Liquor license feasibility report.",Marian O'Brien,,
11/6/2025,Consulting,SEED,3,"Met with Kenneth, scheduled upcoming client meeting.",Stuart Atkinson,,N/A
11/6/2025,Funding,Intriguing Hair,1,"Waiting on some materials from Nikia.",Ishani Rana,,
11/6/2025,Funding,Serene Cycle,5,"Updated excel and continued organizing all of my findings.",Ashley Gonzalez,,
11/6/2025,Consulting,REWRITE,8,"Internal meet with the team to keep track of all deliverables.",Shah Sakshi Sanjay,None,Meeting with client
11/6/2025,Consulting,Serene Cycle,6,"Marketing Clinic - Discussed building out the website.",Annalise Fosnight,,
11/6/2025,Marketing,SEED,5,"-Client meeting with Chaim, -Research for competition slide.",Maura Sullivan,,Work on research with Stuart
11/6/2025,Marketing,The Downtown Paw,2,"This week, I worked on conducting research on local newspapers.",Maggie Murphy,,
11/6/2025,Marketing,Sawyer Parks,2,"I completed my marketing plan.",Rayah Sibunga,,
11/6/2025,Funding,Crown Legends,5,"On Friday, I had a meeting with our clinic director to discuss the status of work.",Abednego Nakoma,,
11/6/2025,Accounting,City of Malden,2,"Worked on KPI Dashboard on the client deliverable.",Neel Patel,,
11/5/2025,Accounting,Sawyer Parks,4,"Made a presentation for the class, added more numbers to our projections.",Sara Marmoucha,,
11/2/2025,Funding,REWRITE,4.5,"This week, Max and I started researching investors.",Klestiola Xherimeja,,Continue developing our potential investor list
10/31/2025,Consulting,Sawyer Parks,8,"Finished the SOW, added more details, met with Purva.",Adam Calnan,,
10/31/2025,Accounting,REWRITE,4,"Reviewed financial documentation, met with CFO.",Declan Leahy,,
10/31/2025,Consulting,Crown Legends,3.5,"This week, I had a meeting with the primary clinic director.",Franziska Greiner,,Next week we will meet with each clinic
10/30/2025,Consulting,REWRITE,6,"Met with team, discussed timelines and deliverables.",Shah Sakshi Sanjay,,
10/30/2025,Funding,City of Malden,2,Research on Grants and low interest loans,Muskan Kapoor,,
10/30/2025,Funding,Serene Cycle,4,Continued working on excel and researching grants.,Ashley Gonzalez,,
10/30/2025,Funding,Crown Legends,4,"On Monday, I met with our team lead to discuss the progress.",Abednego Nakoma,,
10/30/2025,Consulting,SEED,3,"Had a client meeting, discussed budget model.",Masudi Mugudwa,,
10/30/2025,Accounting,Serene Cycle,4,Reached out to Jamie to set up QuickBooks meeting.,Riley Dibiase,N/A,
10/30/2025,Accounting,Marabou Café,2,"Looked into the financial reports from Clover.",Aline Silva,,
10/30/2025,Marketing,The Downtown Paw,2,"This week, I focused on research for the go-to-market plan.",Maggie Murphy,,
10/30/2025,Funding,REWRITE,2,"Met with Alik in class on Monday.",Max Banoun,,
10/30/2025,Funding,Marabou Café,6,"I met with my client, Paulette, on Monday.",Nyasha Mukwat,,
10/30/2025,Consulting,Serene Cycle,5,"Team meeting, client meeting, marketing discussion.",Annalise Fosnight,,
10/30/2025,Marketing,SEED,4,"-Research on competitor demographics.",Maura Sullivan,,
10/30/2025,Funding,Intriguing Hair,3,"This week, we had our first team meeting with all the clinic members.",Keya Patel,,
10/30/2025,Consulting,Marabou Café,4,"Had 1:1 meeting with team members, worked on deliverables.",Marian O'Brien,,
10/24/2025,Funding,The Downtown Paw,2,Researched about Prof. Mooney recommendations for SBA loans,Urmi Vaghela,,
10/24/2025,Accounting,The Downtown Paw,3,"Downloaded financial statements, started financial analysis.",Merelyn Sojan Choorakoottil,,
10/23/2025,Consulting,Crown Legends,4,"Finished the SOW draft for Crown Legends.",Franziska Greiner,,
10/23/2025,Accounting,REWRITE,2,Worked on reviewing financial statements.,Declan Leahy,,
10/23/2025,Funding,Serene Cycle,3,Started researching grants and funding options.,Ashley Gonzalez,,
10/23/2025,Funding,Crown Legends,3,"Had our first team meeting, discussed funding options.",Abednego Nakoma,,
10/23/2025,Consulting,SEED,2,"Had client meeting with Chaim.",Masudi Mugudwa,,
10/23/2025,Marketing,Sawyer Parks,2,"Started working on marketing plan.",Rayah Sibunga,,
10/23/2025,Funding,Marabou Café,4,"Met with Paulette to discuss funding needs.",Nyasha Mukwat,,
10/23/2025,Consulting,Serene Cycle,4,"First week working with the client.",Annalise Fosnight,,
10/23/2025,Marketing,SEED,3,"Started research on target demographics.",Maura Sullivan,,
10/23/2025,Funding,Intriguing Hair,2,"First meeting with client.",Keya Patel,,
10/23/2025,Consulting,Marabou Café,3,"Met with team to discuss deliverables.",Marian O'Brien,,
10/16/2025,Consulting,Sawyer Parks,4,"Initial client meeting, gathered requirements.",Adam Calnan,,
10/16/2025,Accounting,REWRITE,2,"First meeting with client.",Declan Leahy,,`

interface DebiefRecord {
  date: string
  clinic: string
  client: string
  hoursWorked: number
  summary: string
  studentName: string
  questions: string
  actionItems: string
}

function parseCSV(csvText: string): DebiefRecord[] {
  const lines = csvText.trim().split("\n")
  const records: DebiefRecord[] = []

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Parse CSV with proper handling of quoted fields
    const matches = line.match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g)
    if (!matches) continue

    const fields = matches.map((m) => {
      let field = m.startsWith(",") ? m.slice(1) : m
      if (field.startsWith('"') && field.endsWith('"')) {
        field = field.slice(1, -1).replace(/""/g, '"')
      }
      return field.trim()
    })

    if (fields.length >= 6) {
      records.push({
        date: fields[0],
        clinic: fields[1],
        client: fields[2],
        hoursWorked: Number.parseFloat(fields[3]) || 0,
        summary: fields[4] || "",
        studentName: fields[5],
        questions: fields[6] || "",
        actionItems: fields[7] || "",
      })
    }
  }

  return records
}

// Clinic name mapping (CSV clinic name -> database clinic name)
const clinicMapping: Record<string, string> = {
  Accounting: "Accounting Clinic",
  Consulting: "Consulting Clinic",
  Marketing: "Marketing Clinic",
  Funding: "Funding Clinic",
  "Resource Acquisition": "Funding Clinic",
}

async function migrateDebriefs() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Parse CSV data
  const records = parseCSV(csvData)
  console.log(`Parsed ${records.length} debrief records from CSV`)

  // Fetch lookup tables
  const { data: students } = await supabase.from("students").select("id, full_name, email")
  const { data: clients } = await supabase.from("clients").select("id, name")
  const { data: schedule } = await supabase.from("semester_schedule").select("*").order("week_start")

  if (!students || !clients || !schedule) {
    console.error("Failed to fetch lookup data")
    return
  }

  console.log(`Found ${students.length} students, ${clients.length} clients, ${schedule.length} weeks`)

  // Create lookup maps
  const studentMap = new Map(students.map((s) => [s.full_name?.toLowerCase(), s]))
  const clientMap = new Map(clients.map((c) => [c.name?.toLowerCase(), c]))

  // Function to find week info from date
  function findWeekInfo(dateStr: string) {
    const [month, day, year] = dateStr.split("/")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

    for (const week of schedule) {
      const weekStart = new Date(week.week_start)
      const weekEnd = new Date(week.week_end)
      if (date >= weekStart && date <= weekEnd) {
        return { weekNumber: week.week_number, weekEnding: week.week_end }
      }
    }

    // If no match, find closest week
    let closest = schedule[0]
    let minDiff = Number.POSITIVE_INFINITY
    for (const week of schedule) {
      const weekEnd = new Date(week.week_end)
      const diff = Math.abs(date.getTime() - weekEnd.getTime())
      if (diff < minDiff) {
        minDiff = diff
        closest = week
      }
    }
    return { weekNumber: closest.week_number, weekEnding: closest.week_end }
  }

  // Process each record
  const debriefInserts = []
  const unmatchedStudents = new Set<string>()
  const unmatchedClients = new Set<string>()

  for (const record of records) {
    // Find student
    const student = studentMap.get(record.studentName?.toLowerCase())
    if (!student) {
      unmatchedStudents.add(record.studentName)
    }

    // Find client
    const client = clientMap.get(record.client?.toLowerCase())
    if (!client) {
      unmatchedClients.add(record.client)
    }

    // Map clinic name
    const clinicName = clinicMapping[record.clinic] || record.clinic

    // Find week info
    const weekInfo = findWeekInfo(record.date)

    // Parse date for date_submitted
    const [month, day, year] = record.date.split("/")
    const dateSubmitted = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

    debriefInserts.push({
      student_id: student?.id || null,
      student_name: record.studentName,
      student_email: student?.email || null,
      client_id: client?.id || null,
      client_name: record.client,
      clinic: clinicName,
      hours_worked: record.hoursWorked,
      work_summary: record.summary,
      questions: record.questions || null,
      week_number: weekInfo.weekNumber,
      week_ending: weekInfo.weekEnding,
      date_submitted: dateSubmitted.toISOString(),
      status: "submitted",
      semester: "Fall 2025",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  console.log("\nUnmatched students:", Array.from(unmatchedStudents))
  console.log("\nUnmatched clients:", Array.from(unmatchedClients))

  // Insert debriefs in batches
  const batchSize = 50
  let inserted = 0

  for (let i = 0; i < debriefInserts.length; i += batchSize) {
    const batch = debriefInserts.slice(i, i + batchSize)
    const { data, error } = await supabase.from("debriefs").insert(batch)

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
    } else {
      inserted += batch.length
      console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} records`)
    }
  }

  console.log(`\nMigration complete: ${inserted} debriefs inserted`)
}

// Run migration
migrateDebriefs().catch(console.error)

import { createClient } from "@supabase/supabase-js"
import { parse } from "csv-parse/sync"
import * as fs from "fs"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface AirtableDebrief {
  "Date Submitted": string
  "Related Clinic": string
  Client: string
  "Number of Hours Worked": string
  "Summary of Work": string
  "SEED Professional": string
  "Action Items": string
}

async function importDebriefs() {
  // Read the CSV file
  const csvPath = process.argv[2] || "debriefs.csv"
  const csvContent = fs.readFileSync(csvPath, "utf-8")

  const records: AirtableDebrief[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  console.log(`Found ${records.length} debriefs to import`)

  // Get all students from v_complete_mapping for name -> id lookup
  const { data: students, error: studentError } = await supabase
    .from("v_complete_mapping")
    .select("student_id, student_name, student_email, client_name")

  if (studentError) {
    console.error("Failed to fetch students:", studentError)
    return
  }

  console.log(`Found ${students?.length} student mappings`)

  // Create a map of student name -> student info (case-insensitive)
  const studentMap = new Map<string, { id: string; email: string; clientName: string }>()
  for (const s of students || []) {
    if (s.student_name) {
      studentMap.set(s.student_name.toLowerCase().trim(), {
        id: s.student_id,
        email: s.student_email,
        clientName: s.client_name,
      })
    }
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const record of records) {
    const studentName = record["SEED Professional"]?.trim()
    const clientName = record["Client"]?.trim()
    const workSummary = record["Summary of Work"]?.trim()
    const dateSubmitted = record["Date Submitted"]?.trim()
    const hoursWorked = Number.parseFloat(record["Number of Hours Worked"]) || 0
    const clinicName = record["Related Clinic"]?.trim()
    const actionItems = record["Action Items"]?.trim()

    if (!studentName || !clientName || !workSummary) {
      skipped++
      continue
    }

    // Find student by name
    const student = studentMap.get(studentName.toLowerCase())
    if (!student) {
      errors.push(`Student not found: "${studentName}" (Client: ${clientName})`)
      skipped++
      continue
    }

    // Parse the date (format: MM/DD/YYYY)
    let weekEnding: string | null = null
    if (dateSubmitted) {
      const [month, day, year] = dateSubmitted.split("/")
      if (month && day && year) {
        weekEnding = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      }
    }

    // Calculate week number from date
    let weekNumber: number | null = null
    if (weekEnding) {
      const date = new Date(weekEnding)
      const startOfYear = new Date(date.getFullYear(), 0, 1)
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
      weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
    }

    // Insert the debrief
    const { error: insertError } = await supabase.from("debriefs").insert({
      student_id: student.id,
      student_email: student.email,
      client_name: clientName,
      clinic_name: clinicName,
      work_summary: workSummary,
      hours_worked: hoursWorked,
      week_ending: weekEnding,
      week_number: weekNumber,
      questions: actionItems || null,
      question_type: actionItems ? "action_item" : null,
      created_at: weekEnding ? new Date(weekEnding).toISOString() : new Date().toISOString(),
    })

    if (insertError) {
      errors.push(`Failed to insert debrief for ${studentName}: ${insertError.message}`)
      skipped++
    } else {
      imported++
    }
  }

  console.log("\n--- Import Summary ---")
  console.log(`Total records: ${records.length}`)
  console.log(`Imported: ${imported}`)
  console.log(`Skipped: ${skipped}`)

  if (errors.length > 0) {
    console.log("\n--- Errors ---")
    errors.forEach((e) => console.log(`  - ${e}`))
  }
}

importDebriefs().catch(console.error)

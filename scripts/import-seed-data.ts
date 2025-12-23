// This script imports Directors, Students, and Clients from the CSV data
// and sets up proper mappings between them

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Director data from CSV
const directorsData = [
  {
    semester: "FALL 2025",
    firstName: "Mark",
    lastName: "Dwyer",
    clinic: "Accounting",
    role: "Clinic Director",
    email: "Mark.Dwyer@suffolk.edu",
  },
  {
    semester: "FALL 2025",
    firstName: "Nick",
    lastName: "Vadala",
    clinic: "Consulting",
    role: "Clinic Director",
    email: "nvadala@suffolk.edu",
  },
  {
    semester: "FALL 2025",
    firstName: "Chris",
    lastName: "Hill",
    clinic: "Marketing",
    role: "Clinic Director",
    email: "Christopher.Hill@suffolk.edu",
  },
  {
    semester: "FALL 2025",
    firstName: "Ken",
    lastName: "Mooney",
    clinic: "Resource Acquisition",
    role: "Clinic Director",
    email: "kmooney@suffolk.edu",
  },
  {
    semester: "FALL 2025",
    firstName: "Dat",
    lastName: "Le",
    clinic: "Accounting",
    role: "Clinic Director",
    email: "dat.le@mottafinancial.com",
  },
  {
    semester: "FALL 2025",
    firstName: "Grace",
    lastName: "Cha",
    clinic: "Accounting",
    role: "Clinic Director",
    email: "HyeeEun.Cha@su.suffolk.edu",
  },
  {
    semester: "FALL 2025",
    firstName: "Beth",
    lastName: "DiRusso",
    clinic: "Legal",
    role: "Clinic Director",
    email: "Elizabeth.DiRusso@suffolk.edu",
  },
  {
    semester: "FALL 2025",
    firstName: "Dmitri",
    lastName: "Tcherevik",
    clinic: "Artificial Intelligence",
    role: "SEED Support",
    email: "Dmitri.Tcherevik@suffolk.edu",
  },
  {
    semester: "FALL 2025",
    firstName: "Chaim",
    lastName: "Letwin",
    clinic: "Management",
    role: "SEED Support",
    email: "cletwin@suffolk.edu",
  },
  {
    semester: "FALL 2025",
    firstName: "Boris",
    lastName: "Lazic",
    clinic: "Management",
    role: "SEED Support",
    email: "blazic@suffolk.edu",
  },
  {
    semester: "FALL 2025",
    firstName: "Darrell",
    lastName: "Mottley",
    clinic: "Legal",
    role: "SEED Support",
    email: "Darrell.Mottley@suffolk.edu",
  },
]

// Students data from CSV (abbreviated for the main 4 clinics)
const studentsData = [
  // Accounting Students
  {
    firstName: "Stuti",
    lastName: "Adhikari",
    email: "Stuti.Adhikari@su.suffolk.edu",
    clinic: "Accounting",
    clientTeam: "Crown Legends",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007701764",
  },
  {
    firstName: "Merelyn Sojan",
    lastName: "Choorakoottil",
    email: "MerelynSojan.Choorakoottil@su.suffolk.edu",
    clinic: "Accounting",
    clientTeam: "Serene Cycle",
    isTeamLeader: false,
    academicLevel: "Graduate",
    universityId: "UID010036544",
  },
  {
    firstName: "Riley",
    lastName: "Dibiase",
    email: "Riley.Dibiase@su.suffolk.edu",
    clinic: "Accounting",
    clientTeam: "Serene Cycle",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007991998",
  },
  {
    firstName: "Declan",
    lastName: "Leahy",
    email: "Declan.leahy@su.suffolk.edu",
    clinic: "Accounting",
    clientTeam: "REWRITE",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007615686",
  },
  {
    firstName: "Sara",
    lastName: "Marmoucha",
    email: "Sara.Marmoucha@su.suffolk.edu",
    clinic: "Accounting",
    clientTeam: "Sawyer Parks",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007552827",
  },
  {
    firstName: "Collin",
    lastName: "Merwin",
    email: "Collin.Merwin@su.suffolk.edu",
    clinic: "Accounting",
    clientTeam: "Intriguing Hair",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007990412",
  },
  {
    firstName: "Neel",
    lastName: "Patel",
    email: "Neel.Patel@su.suffolk.edu",
    clinic: "Accounting",
    clientTeam: "City of Malden",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007561353",
  },
  {
    firstName: "Ethan",
    lastName: "Shanofsky",
    email: "Ethan.Shanofsky@su.suffolk.edu",
    clinic: "Accounting",
    clientTeam: "SEED",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007190259",
  },
  {
    firstName: "Aline",
    lastName: "Silva",
    email: "Aline.Silva@su.suffolk.edu",
    clinic: "Accounting",
    clientTeam: "Marabou",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007980621",
  },
  {
    firstName: "Trevor",
    lastName: "Nadeau",
    email: "tnadeau@su.suffolk.edu",
    clinic: "Accounting",
    clientTeam: "The Downtown Paw",
    isTeamLeader: false,
    academicLevel: "Graduate",
    universityId: "UID007074671",
  },

  // Consulting Students (Team Leaders)
  {
    firstName: "Adam",
    lastName: "Calnan",
    email: "Adam.Calnan@su.suffolk.edu",
    clinic: "Consulting",
    clientTeam: "Sawyer Parks",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "UID010037589",
  },
  {
    firstName: "Purva Pravin",
    lastName: "Dhuri",
    email: "PurvaPravin.Dhuri@su.suffolk.edu",
    clinic: "Consulting",
    clientTeam: "The Downtown Paw",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "UID007998617",
  },
  {
    firstName: "Annalise",
    lastName: "Fosnight",
    email: "afosnight@su.suffolk.edu",
    clinic: "Consulting",
    clientTeam: "Serene Cycle",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "UID001747288",
  },
  {
    firstName: "Franziska",
    lastName: "Greiner",
    email: "Franziska.Greiner@su.suffolk.edu",
    clinic: "Consulting",
    clientTeam: "Crown Legends",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "UID010028462",
  },
  {
    firstName: "Marian",
    lastName: "O'Brien",
    email: "mfobrien@su.suffolk.edu",
    clinic: "Consulting",
    clientTeam: "Marabou",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "UID001511867",
  },
  {
    firstName: "Kajol Sunil",
    lastName: "Parche",
    email: "KajolSunil.Parche@su.suffolk.edu",
    clinic: "Consulting",
    clientTeam: "City of Malden",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "UID010035553",
  },
  {
    firstName: "Sakshi Sanjay",
    lastName: "Shah",
    email: "SakshiSanjay.Shah@su.suffolk.edu",
    clinic: "Consulting",
    clientTeam: "REWRITE",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "UID010036543",
  },
  {
    firstName: "Shubhangi",
    lastName: "Srivastava",
    email: "Shubhangi.Srivastava@su.suffolk.edu",
    clinic: "Consulting",
    clientTeam: "Intriguing Hair",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "UID010033797",
  },
  {
    firstName: "Stuart",
    lastName: "Atkinson",
    email: "satkinson2@suffolk.edu",
    clinic: "Consulting",
    clientTeam: "SEED",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "UID002626094",
  },
  {
    firstName: "Masudi",
    lastName: "Mugudwa",
    email: "Masudi.Mugudwa@su.suffolk.edu",
    clinic: "Consulting",
    clientTeam: "SEED",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "UID008006690",
  },
  {
    firstName: "Nate",
    lastName: "Weaver",
    email: "nate.weaver@su.suffolk.edu",
    clinic: "Consulting",
    clientTeam: "Future Masters of Chess Academy",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "",
  },

  // Marketing Students
  {
    firstName: "Mahekdeep Kaur",
    lastName: "Abrol",
    email: "Mahek.Abrol@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "Marabou",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007758228",
  },
  {
    firstName: "Margaret",
    lastName: "Distefano",
    email: "Margaret.Distefano@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "City of Malden",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID005427807",
  },
  {
    firstName: "Sophia",
    lastName: "Emile",
    email: "Sophia.Emile@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "Intriguing Hair",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007586047",
  },
  {
    firstName: "Elaine",
    lastName: "Lara",
    email: "Elaine.Lara@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "REWRITE",
    isTeamLeader: false,
    academicLevel: "Graduate",
    universityId: "UID010035567",
  },
  {
    firstName: "Maggie",
    lastName: "Murphy",
    email: "Maggie.Murphy@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "REWRITE",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007545219",
  },
  {
    firstName: "Nicole",
    lastName: "Nessim",
    email: "Nicole.Nessim@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "Serene Cycle",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007157343",
  },
  {
    firstName: "Rayah",
    lastName: "Sibunga",
    email: "Rayah.Sibunga@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "Sawyer Parks",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007584359",
  },
  {
    firstName: "Maura",
    lastName: "Sullivan",
    email: "Maura.Sullivan@suffolk.edu",
    clinic: "Marketing",
    clientTeam: "SEED",
    isTeamLeader: false,
    academicLevel: "Graduate",
    universityId: "UID006752340",
  },
  {
    firstName: "Zachary",
    lastName: "Ullrich",
    email: "Zachary.Ullrich@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "Crown Legends",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007552751",
  },
  {
    firstName: "Krysthal",
    lastName: "Velarde",
    email: "Krysthal.Velarde@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "The Downtown Paw",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007598088",
  },
  {
    firstName: "Natalie",
    lastName: "Perkins",
    email: "natalie.perkins@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "REWRITE",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007552592",
  },

  // Resource Acquisition Students
  {
    firstName: "Kaustubh Sanjiv",
    lastName: "Ambre",
    email: "KaustubhSanjiv.Ambre@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "SEED",
    isTeamLeader: false,
    academicLevel: "Graduate",
    universityId: "UID010005217",
  },
  {
    firstName: "Maxymilian",
    lastName: "Banoun",
    email: "Max.Banoun@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "Sawyer Parks",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID010034224",
  },
  {
    firstName: "Courage",
    lastName: "Chakanza",
    email: "Courage.Chakanza@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "Sawyer Parks",
    isTeamLeader: false,
    academicLevel: "Graduate",
    universityId: "UID008381642",
  },
  {
    firstName: "Arianna",
    lastName: "Godinho",
    email: "Arianna.Godinho@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "The Downtown Paw",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007594086",
  },
  {
    firstName: "Mason",
    lastName: "Holt",
    email: "Mason.Holt@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "Crown Legends",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID010028086",
  },
  {
    firstName: "Muskan",
    lastName: "Kapoor",
    email: "Muskan.Kapoor@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "City of Malden",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007648700",
  },
  {
    firstName: "Nyasha",
    lastName: "Mukwata",
    email: "NyashaAbsolomon.Mukwata@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "Marabou",
    isTeamLeader: false,
    academicLevel: "Graduate",
    universityId: "UID010036179",
  },
  {
    firstName: "Abednego",
    lastName: "Nakoma",
    email: "Abednego.Nakoma@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "Crown Legends",
    isTeamLeader: false,
    academicLevel: "Graduate",
    universityId: "UID010034864",
  },
  {
    firstName: "Keya Vasant",
    lastName: "Patel",
    email: "KeyaVasant.Patel@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "Intriguing Hair",
    isTeamLeader: false,
    academicLevel: "Graduate",
    universityId: "UID008438369",
  },
  {
    firstName: "Ishani",
    lastName: "Rana",
    email: "Ishani.Rana@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "Intriguing Hair",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007721873",
  },
  {
    firstName: "Urmi Nayankumar",
    lastName: "Vaghela",
    email: "UrmiNayankumar.Vaghela@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "The Downtown Paw",
    isTeamLeader: false,
    academicLevel: "Graduate",
    universityId: "UID010004084",
  },
  {
    firstName: "Klestiola",
    lastName: "Xherimeja",
    email: "Klestiola.Xherimeja@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "REWRITE",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007986573",
  },
  {
    firstName: "Ashley",
    lastName: "Marquez-Gonzalez",
    email: "ashley.marquezgonzalez@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "Serene Cycle",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007717534",
  },
]

// Clients data from CSV
const clientsData = [
  {
    name: "Sawyer Parks",
    website: null,
    contactName: "Hanna Parks",
    email: "hanadenise@gmail.com",
    directorLead: "Nick Vadala",
  },
  {
    name: "The Downtown Paw",
    website: "https://thedowntownpaw.com/",
    contactName: "Katherine Cruickshank",
    email: "woof@thedowntownpaw.com",
    directorLead: "Chris Hill",
  },
  {
    name: "City of Malden",
    website: "https://www.cityofmalden.org/",
    contactName: "Alex Pratt",
    email: "apratt@cityofmalden.org",
    directorLead: "Nick Vadala",
  },
  {
    name: "REWRITE",
    website: "https://rewritebio.com/",
    contactName: "Alik Christianian",
    email: "alik@rewritebio.com",
    directorLead: "Chris Hill",
  },
  {
    name: "Crown Legends",
    website: "https://shopcrownlegends.com/",
    contactName: "Al Objio",
    email: "alvis1986@gmail.com",
    directorLead: "Mark Dwyer",
  },
  {
    name: "Marabou Café",
    website: null,
    contactName: "Paulette & Kishla Firmin",
    email: "kishlafirmin@gmail.com",
    directorLead: "Ken Mooney",
  },
  {
    name: "Serene Cycle",
    website: "https://www.serenecycleco.com/",
    contactName: "Jamie Jasmin",
    email: "jamiejasmin@serenecycleco.com",
    directorLead: "Beth DiRusso",
  },
  {
    name: "Intriguing Hair",
    website: "https://intriguinghair.com/",
    contactName: "Nikia Londy",
    email: "nikia.londy@gmail.com",
    directorLead: "Nick Vadala",
  },
  {
    name: "SEED",
    website: "https://boston.suffolk.edu/seed/",
    contactName: "Chaim Letwin, Boris Lazic, Nick Vadala",
    email: "nvadala@suffolk.edu",
    directorLead: "Ken Mooney",
  },
  {
    name: "Muffy White",
    website: "https://www.muffywhite.com/",
    contactName: "Muffy White",
    email: "muffy.l.white@gmail.com",
    directorLead: "Mark Dwyer",
  },
  {
    name: "Future Masters of Chess Academy",
    website: "https://futurechessmasters.com/",
    contactName: "Lawyer & Angela Times",
    email: "info@futurechessmasters.com",
    directorLead: "Beth DiRusso",
  },
]

async function importData() {
  console.log("=== SEED Data Import Script ===\n")

  const audit = {
    directors: { inserted: 0, skipped: 0, errors: 0 },
    students: { inserted: 0, skipped: 0, errors: 0 },
    clients: { inserted: 0, skipped: 0, errors: 0 },
    clientAssignments: { inserted: 0, skipped: 0, errors: 0 },
    clientDirectors: { inserted: 0, skipped: 0, errors: 0 },
  }

  // Step 1: Import Directors
  console.log("Step 1: Importing Directors...")
  const directorIdMap: Record<string, string> = {}

  for (const dir of directorsData) {
    const fullName = `${dir.firstName} ${dir.lastName}`

    // Check if already exists
    const { data: existing } = await supabase.from("directors").select("id").eq("email", dir.email).single()

    if (existing) {
      directorIdMap[fullName] = existing.id
      audit.directors.skipped++
      continue
    }

    const { data, error } = await supabase
      .from("directors")
      .insert({
        full_name: fullName,
        email: dir.email,
        clinic: dir.clinic,
        role: dir.role,
        semester: dir.semester,
      })
      .select("id")
      .single()

    if (error) {
      console.error(`  Error inserting director ${fullName}:`, error.message)
      audit.directors.errors++
    } else {
      directorIdMap[fullName] = data.id
      audit.directors.inserted++
    }
  }
  console.log(
    `  Directors: ${audit.directors.inserted} inserted, ${audit.directors.skipped} skipped, ${audit.directors.errors} errors`,
  )

  // Step 2: Import Students
  console.log("\nStep 2: Importing Students...")
  const studentIdMap: Record<string, string> = {}

  for (const stu of studentsData) {
    const fullName = `${stu.firstName} ${stu.lastName}`

    // Check if already exists
    const { data: existing } = await supabase.from("students").select("id").eq("email", stu.email).single()

    if (existing) {
      studentIdMap[stu.email] = existing.id
      audit.students.skipped++
      continue
    }

    const { data, error } = await supabase
      .from("students")
      .insert({
        first_name: stu.firstName,
        last_name: stu.lastName,
        full_name: fullName,
        email: stu.email,
        clinic: stu.clinic,
        client_team: stu.clientTeam,
        is_team_leader: stu.isTeamLeader,
        academic_level: stu.academicLevel,
        university_id: stu.universityId,
        semester: "FALL 2025",
        status: "active",
      })
      .select("id")
      .single()

    if (error) {
      console.error(`  Error inserting student ${fullName}:`, error.message)
      audit.students.errors++
    } else {
      studentIdMap[stu.email] = data.id
      audit.students.inserted++
    }
  }
  console.log(
    `  Students: ${audit.students.inserted} inserted, ${audit.students.skipped} skipped, ${audit.students.errors} errors`,
  )

  // Step 3: Import Clients
  console.log("\nStep 3: Importing Clients...")
  const clientIdMap: Record<string, string> = {}

  for (const client of clientsData) {
    // Check if already exists
    const { data: existing } = await supabase.from("clients").select("id").eq("name", client.name).single()

    if (existing) {
      clientIdMap[client.name] = existing.id
      audit.clients.skipped++
      continue
    }

    // Get director ID for primary director
    const directorId = directorIdMap[client.directorLead] || null

    const { data, error } = await supabase
      .from("clients")
      .insert({
        name: client.name,
        website: client.website,
        contact_name: client.contactName,
        email: client.email,
        primary_director_id: directorId,
        semester: "FALL 2025",
        status: "active",
      })
      .select("id")
      .single()

    if (error) {
      console.error(`  Error inserting client ${client.name}:`, error.message)
      audit.clients.errors++
    } else {
      clientIdMap[client.name] = data.id
      audit.clients.inserted++
    }
  }
  console.log(
    `  Clients: ${audit.clients.inserted} inserted, ${audit.clients.skipped} skipped, ${audit.clients.errors} errors`,
  )

  // Step 4: Create Client-Director Mappings
  console.log("\nStep 4: Creating Client-Director Mappings...")

  for (const client of clientsData) {
    const clientId = clientIdMap[client.name]
    const directorId = directorIdMap[client.directorLead]

    if (!clientId || !directorId) continue

    // Check if mapping exists
    const { data: existing } = await supabase
      .from("client_directors")
      .select("id")
      .eq("client_id", clientId)
      .eq("director_id", directorId)
      .single()

    if (existing) {
      audit.clientDirectors.skipped++
      continue
    }

    const { error } = await supabase.from("client_directors").insert({
      client_id: clientId,
      director_id: directorId,
      is_primary: true,
    })

    if (error) {
      console.error(`  Error creating client-director mapping for ${client.name}:`, error.message)
      audit.clientDirectors.errors++
    } else {
      audit.clientDirectors.inserted++
    }
  }
  console.log(
    `  Client-Director Mappings: ${audit.clientDirectors.inserted} inserted, ${audit.clientDirectors.skipped} skipped, ${audit.clientDirectors.errors} errors`,
  )

  // Step 5: Create Client-Student Assignments
  console.log("\nStep 5: Creating Client-Student Assignments...")

  for (const stu of studentsData) {
    const studentId = studentIdMap[stu.email]
    const clientId = clientIdMap[stu.clientTeam]

    if (!studentId || !clientId) {
      console.log(
        `  Skipping ${stu.firstName} ${stu.lastName} - missing student or client ID (client: ${stu.clientTeam})`,
      )
      continue
    }

    // Check if assignment exists
    const { data: existing } = await supabase
      .from("client_assignments")
      .select("id")
      .eq("student_id", studentId)
      .eq("client_id", clientId)
      .single()

    if (existing) {
      audit.clientAssignments.skipped++
      continue
    }

    const { error } = await supabase.from("client_assignments").insert({
      student_id: studentId,
      client_id: clientId,
      clinic: stu.clinic,
      role: stu.isTeamLeader ? "Team Leader" : "Member",
    })

    if (error) {
      console.error(`  Error creating assignment for ${stu.firstName} ${stu.lastName}:`, error.message)
      audit.clientAssignments.errors++
    } else {
      audit.clientAssignments.inserted++
    }
  }
  console.log(
    `  Client-Student Assignments: ${audit.clientAssignments.inserted} inserted, ${audit.clientAssignments.skipped} skipped, ${audit.clientAssignments.errors} errors`,
  )

  // Step 6: Audit Report
  console.log("\n=== AUDIT REPORT ===")

  // Count records in each table
  const { count: directorCount } = await supabase.from("directors").select("*", { count: "exact", head: true })
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true })
  const { count: clientCount } = await supabase.from("clients").select("*", { count: "exact", head: true })
  const { count: assignmentCount } = await supabase
    .from("client_assignments")
    .select("*", { count: "exact", head: true })
  const { count: clientDirCount } = await supabase.from("client_directors").select("*", { count: "exact", head: true })

  console.log(`\nTable Counts:`)
  console.log(`  Directors: ${directorCount}`)
  console.log(`  Students: ${studentCount}`)
  console.log(`  Clients: ${clientCount}`)
  console.log(`  Client Assignments: ${assignmentCount}`)
  console.log(`  Client-Director Mappings: ${clientDirCount}`)

  // Verify clinic director mappings
  console.log(`\n=== CLINIC DIRECTOR VERIFICATION ===`)
  const { data: directors } = await supabase
    .from("directors")
    .select("full_name, clinic, role")
    .eq("role", "Clinic Director")
    .in("clinic", ["Accounting", "Consulting", "Marketing", "Resource Acquisition"])

  console.log("Primary Clinic Directors:")
  directors?.forEach((d) => console.log(`  ${d.clinic}: ${d.full_name}`))

  // Verify student-client mappings by clinic
  console.log(`\n=== STUDENT-CLIENT MAPPINGS BY CLINIC ===`)
  for (const clinic of ["Accounting", "Consulting", "Marketing", "Resource Acquisition"]) {
    const { data: clinicStudents } = await supabase
      .from("students")
      .select("full_name, client_team, is_team_leader")
      .eq("clinic", clinic)
      .order("client_team")

    console.log(`\n${clinic} Clinic (${clinicStudents?.length || 0} students):`)
    clinicStudents?.forEach((s) => {
      const leader = s.is_team_leader ? " [TEAM LEADER]" : ""
      console.log(`  ${s.full_name} -> ${s.client_team}${leader}`)
    })
  }

  console.log("\n=== IMPORT COMPLETE ===")
}

importData().catch(console.error)

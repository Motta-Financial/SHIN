import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

// Students data from CSV
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
    clientTeam: "Marabou Café",
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
    clientTeam: "Marabou Café",
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
    clientTeam: "Marabou Café",
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
    clientTeam: "Marabou Café",
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

export async function POST() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const audit = {
    directors: { inserted: 0, skipped: 0, errors: 0, details: [] as string[] },
    students: { inserted: 0, skipped: 0, errors: 0, details: [] as string[] },
    clients: { inserted: 0, skipped: 0, errors: 0, details: [] as string[] },
    clientAssignments: { inserted: 0, skipped: 0, errors: 0, details: [] as string[] },
    clientDirectors: { inserted: 0, skipped: 0, errors: 0, details: [] as string[] },
  }

  // Step 1: Import Directors
  const directorIdMap: Record<string, string> = {}

  for (const dir of directorsData) {
    const fullName = `${dir.firstName} ${dir.lastName}`

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
      audit.directors.errors++
      audit.directors.details.push(`Error: ${fullName} - ${error.message}`)
    } else {
      directorIdMap[fullName] = data.id
      audit.directors.inserted++
    }
  }

  // Step 2: Import Students
  const studentIdMap: Record<string, string> = {}

  for (const stu of studentsData) {
    const fullName = `${stu.firstName} ${stu.lastName}`

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
      audit.students.errors++
      audit.students.details.push(`Error: ${fullName} - ${error.message}`)
    } else {
      studentIdMap[stu.email] = data.id
      audit.students.inserted++
    }
  }

  // Step 3: Import Clients
  const clientIdMap: Record<string, string> = {}

  for (const client of clientsData) {
    const { data: existing } = await supabase.from("clients").select("id").eq("name", client.name).single()

    if (existing) {
      clientIdMap[client.name] = existing.id
      audit.clients.skipped++
      continue
    }

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
      audit.clients.errors++
      audit.clients.details.push(`Error: ${client.name} - ${error.message}`)
    } else {
      clientIdMap[client.name] = data.id
      audit.clients.inserted++
    }
  }

  // Step 4: Create Client-Director Mappings
  for (const client of clientsData) {
    const clientId = clientIdMap[client.name]
    const directorId = directorIdMap[client.directorLead]

    if (!clientId || !directorId) continue

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
      audit.clientDirectors.errors++
      audit.clientDirectors.details.push(`Error: ${client.name} - ${error.message}`)
    } else {
      audit.clientDirectors.inserted++
    }
  }

  // Step 5: Create Client-Student Assignments
  for (const stu of studentsData) {
    const studentId = studentIdMap[stu.email]
    const clientId = clientIdMap[stu.clientTeam]

    if (!studentId || !clientId) {
      audit.clientAssignments.details.push(
        `Skipped: ${stu.firstName} ${stu.lastName} - missing IDs (client: ${stu.clientTeam})`,
      )
      continue
    }

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
      audit.clientAssignments.errors++
      audit.clientAssignments.details.push(`Error: ${stu.firstName} ${stu.lastName} - ${error.message}`)
    } else {
      audit.clientAssignments.inserted++
    }
  }

  // Get final counts
  const { count: directorCount } = await supabase.from("directors").select("*", { count: "exact", head: true })
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true })
  const { count: clientCount } = await supabase.from("clients").select("*", { count: "exact", head: true })
  const { count: assignmentCount } = await supabase
    .from("client_assignments")
    .select("*", { count: "exact", head: true })
  const { count: clientDirCount } = await supabase.from("client_directors").select("*", { count: "exact", head: true })

  // Get clinic director verification
  const { data: clinicDirectors } = await supabase
    .from("directors")
    .select("full_name, clinic, role")
    .eq("role", "Clinic Director")
    .in("clinic", ["Accounting", "Consulting", "Marketing", "Resource Acquisition"])

  // Get student counts by clinic
  const { data: studentsByClinic } = await supabase.from("students").select("clinic")

  const clinicCounts: Record<string, number> = {}
  studentsByClinic?.forEach((s) => {
    clinicCounts[s.clinic] = (clinicCounts[s.clinic] || 0) + 1
  })

  return NextResponse.json({
    success: true,
    audit,
    tableCounts: {
      directors: directorCount,
      students: studentCount,
      clients: clientCount,
      clientAssignments: assignmentCount,
      clientDirectors: clientDirCount,
    },
    clinicDirectors,
    studentsByClinic: clinicCounts,
  })
}

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Audit existing data
  const { data: directors } = await supabase.from("directors").select("*").order("clinic")

  const { data: students } = await supabase.from("students").select("*").order("clinic, client_team")

  const { data: clients } = await supabase
    .from("clients")
    .select("*, primary_director:directors(full_name, clinic)")
    .order("name")

  const { data: assignments } = await supabase
    .from("client_assignments")
    .select("*, student:students(full_name, clinic), client:clients(name)")
    .order("clinic")

  // Verify mappings
  const mappingIssues: string[] = []

  // Check each client has students from all 4 clinics
  for (const client of clients || []) {
    if (client.name === "Muffy White" || client.name === "Future Masters of Chess Academy") continue // Special cases

    const clientAssigns = assignments?.filter((a) => a.client?.name === client.name)
    const clinics = new Set(clientAssigns?.map((a) => a.clinic))

    const expectedClinics = ["Accounting", "Consulting", "Marketing", "Resource Acquisition"]
    for (const clinic of expectedClinics) {
      if (!clinics.has(clinic)) {
        mappingIssues.push(`${client.name} missing ${clinic} student`)
      }
    }
  }

  // Check consulting students are team leaders
  const consultingStudents = students?.filter((s) => s.clinic === "Consulting")
  for (const student of consultingStudents || []) {
    if (!student.is_team_leader) {
      mappingIssues.push(`Consulting student ${student.full_name} should be team leader`)
    }
  }

  return NextResponse.json({
    directors,
    students,
    clients,
    assignments,
    mappingIssues,
    summary: {
      directorCount: directors?.length || 0,
      studentCount: students?.length || 0,
      clientCount: clients?.length || 0,
      assignmentCount: assignments?.length || 0,
    },
  })
}

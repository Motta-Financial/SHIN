import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Directors data from CSV
const directorsData = [
  {
    firstName: "Dat",
    lastName: "Le",
    clinic: "Accounting",
    role: "Clinic Director",
    email: "dat.le@mottafinancial.com",
  },
  {
    firstName: "Grace",
    lastName: "Cha",
    clinic: "Accounting",
    role: "Clinic Director",
    email: "HyeeEun.Cha@su.suffolk.edu",
  },
  {
    firstName: "Mark",
    lastName: "Dwyer",
    clinic: "Accounting",
    role: "Clinic Director",
    email: "Mark.Dwyer@suffolk.edu",
  },
  {
    firstName: "Ken",
    lastName: "Mooney",
    clinic: "Resource Acquisition",
    role: "Clinic Director",
    email: "kmooney@suffolk.edu",
  },
  {
    firstName: "Dmitri",
    lastName: "Tcherevik",
    clinic: "Artificial Intelligence",
    role: "SEED Support",
    email: "Dmitri.Tcherevik@suffolk.edu",
  },
  { firstName: "Chaim", lastName: "Letwin", clinic: "Management", role: "SEED Support", email: "cletwin@suffolk.edu" },
  {
    firstName: "Nick",
    lastName: "Vadala",
    clinic: "Consulting",
    role: "Clinic Director",
    email: "nvadala@suffolk.edu",
  },
  {
    firstName: "Beth",
    lastName: "DiRusso",
    clinic: "Legal",
    role: "Clinic Director",
    email: "Elizabeth.DiRusso@suffolk.edu",
  },
  {
    firstName: "Chris",
    lastName: "Hill",
    clinic: "Marketing",
    role: "Clinic Director",
    email: "Christopher.Hill@suffolk.edu",
  },
  { firstName: "Boris", lastName: "Lazic", clinic: "Management", role: "SEED Support", email: "blazic@suffolk.edu" },
  {
    firstName: "Darrell",
    lastName: "Mottley",
    clinic: "Legal",
    role: "SEED Support",
    email: "Darrell.Mottley@suffolk.edu",
  },
]

// Students data from CSV
const studentsData = [
  {
    firstName: "Mahekdeep Kaur Charanjit Singh",
    lastName: "Abrol",
    email: "Mahek.Abrol@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "Marabou",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007758228",
  },
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
    firstName: "Maxymilian",
    lastName: "Banoun",
    email: "Max.Banoun@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "REWRITE",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID010034224",
  },
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
    firstName: "Ashley",
    lastName: "Marquez-Gonzalez",
    email: "ashley.marquezgonzalez@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "Serene Cycle",
    isTeamLeader: false,
    academicLevel: "",
    universityId: "UID007717534",
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
    firstName: "Nyasha",
    lastName: "Mukwata Absolomon",
    email: "NyashaAbsolomon.Mukwata@su.suffolk.edu",
    clinic: "Resource Acquisition",
    clientTeam: "Marabou",
    isTeamLeader: false,
    academicLevel: "Graduate",
    universityId: "UID010036179",
  },
  {
    firstName: "Maggie",
    lastName: "Murphy",
    email: "Maggie.Murphy@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "The Downtown Paw",
    isTeamLeader: false,
    academicLevel: "Undergraduate",
    universityId: "UID007545219",
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
    firstName: "Natalie",
    lastName: "Perkins",
    email: "natalie.perkins@su.suffolk.edu",
    clinic: "Marketing",
    clientTeam: "REWRITE",
    isTeamLeader: false,
    academicLevel: "",
    universityId: "UID007552592",
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
    firstName: "Nate",
    lastName: "Weaver",
    email: "nate.weaver@su.suffolk.edu",
    clinic: "Consulting",
    clientTeam: "Future Masters of Chess Academy",
    isTeamLeader: true,
    academicLevel: "Graduate",
    universityId: "",
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
]

// Clients data from CSV with director leads
const clientsData = [
  {
    name: "Sawyer Parks",
    website: "",
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
    website: "",
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

export async function POST(request: Request) {
  try {
    const { action } = await request.json()

    const results = {
      directors: { inserted: 0, updated: 0, errors: [] as string[] },
      students: { inserted: 0, updated: 0, errors: [] as string[] },
      clients: { inserted: 0, updated: 0, errors: [] as string[] },
      clientAssignments: { inserted: 0, skipped: 0, errors: [] as string[] },
      clientDirectors: { inserted: 0, skipped: 0, errors: [] as string[] },
    }

    // Step 1: Import Directors
    console.log("[v0] Importing directors...")
    for (const director of directorsData) {
      const fullName = `${director.firstName} ${director.lastName}`

      // Check if director already exists
      const { data: existing } = await supabase.from("directors").select("id").eq("email", director.email).single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("directors")
          .update({
            full_name: fullName,
            clinic: director.clinic,
            role: director.role,
            semester: "FALL 2025",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)

        if (error) {
          results.directors.errors.push(`Update ${fullName}: ${error.message}`)
        } else {
          results.directors.updated++
        }
      } else {
        // Insert new
        const { error } = await supabase.from("directors").insert({
          full_name: fullName,
          email: director.email,
          clinic: director.clinic,
          role: director.role,
          semester: "FALL 2025",
        })

        if (error) {
          results.directors.errors.push(`Insert ${fullName}: ${error.message}`)
        } else {
          results.directors.inserted++
        }
      }
    }

    // Step 2: Import Students
    console.log("[v0] Importing students...")
    for (const student of studentsData) {
      const fullName = `${student.firstName} ${student.lastName}`

      // Check if student already exists
      const { data: existing } = await supabase.from("students").select("id").eq("email", student.email).single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("students")
          .update({
            first_name: student.firstName,
            last_name: student.lastName,
            full_name: fullName,
            clinic: student.clinic,
            client_team: student.clientTeam,
            is_team_leader: student.isTeamLeader,
            academic_level: student.academicLevel,
            university_id: student.universityId,
            semester: "FALL 2025",
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)

        if (error) {
          results.students.errors.push(`Update ${fullName}: ${error.message}`)
        } else {
          results.students.updated++
        }
      } else {
        // Insert new
        const { error } = await supabase.from("students").insert({
          first_name: student.firstName,
          last_name: student.lastName,
          full_name: fullName,
          email: student.email,
          clinic: student.clinic,
          client_team: student.clientTeam,
          is_team_leader: student.isTeamLeader,
          academic_level: student.academicLevel,
          university_id: student.universityId,
          semester: "FALL 2025",
          status: "active",
        })

        if (error) {
          results.students.errors.push(`Insert ${fullName}: ${error.message}`)
        } else {
          results.students.inserted++
        }
      }
    }

    // Step 3: Import Clients with Director Links
    console.log("[v0] Importing clients...")
    for (const client of clientsData) {
      // Find the primary director
      const { data: director } = await supabase
        .from("directors")
        .select("id")
        .ilike("full_name", `%${client.directorLead}%`)
        .single()

      // Check if client already exists
      const { data: existing } = await supabase.from("clients").select("id").eq("name", client.name).single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("clients")
          .update({
            website: client.website || null,
            contact_name: client.contactName,
            email: client.email,
            primary_director_id: director?.id || null,
            semester: "FALL 2025",
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)

        if (error) {
          results.clients.errors.push(`Update ${client.name}: ${error.message}`)
        } else {
          results.clients.updated++
        }
      } else {
        // Insert new
        const { error } = await supabase.from("clients").insert({
          name: client.name,
          website: client.website || null,
          contact_name: client.contactName,
          email: client.email,
          primary_director_id: director?.id || null,
          semester: "FALL 2025",
          status: "active",
        })

        if (error) {
          results.clients.errors.push(`Insert ${client.name}: ${error.message}`)
        } else {
          results.clients.inserted++
        }
      }
    }

    // Step 4: Create Client Assignments (link students to clients)
    console.log("[v0] Creating client assignments...")

    // Get all students and clients
    const { data: allStudents } = await supabase
      .from("students")
      .select("id, full_name, clinic, client_team, is_team_leader")
    const { data: allClients } = await supabase.from("clients").select("id, name")

    if (allStudents && allClients) {
      for (const student of allStudents) {
        if (!student.client_team) continue

        // Find matching client
        const client = allClients.find(
          (c) =>
            c.name.toLowerCase().includes(student.client_team.toLowerCase()) ||
            student.client_team.toLowerCase().includes(c.name.toLowerCase()),
        )

        if (!client) {
          results.clientAssignments.errors.push(
            `No client found for student ${student.full_name} (team: ${student.client_team})`,
          )
          continue
        }

        // Check if assignment already exists
        const { data: existing } = await supabase
          .from("client_assignments")
          .select("id")
          .eq("student_id", student.id)
          .eq("client_id", client.id)
          .single()

        if (existing) {
          results.clientAssignments.skipped++
          continue
        }

        // Create assignment
        const { error } = await supabase.from("client_assignments").insert({
          student_id: student.id,
          client_id: client.id,
          clinic: student.clinic,
          role: student.is_team_leader ? "Team Leader" : "Team Member",
        })

        if (error) {
          results.clientAssignments.errors.push(`Assignment ${student.full_name} -> ${client.name}: ${error.message}`)
        } else {
          results.clientAssignments.inserted++
        }
      }
    }

    // Step 5: Create Client-Director Links
    console.log("[v0] Creating client-director links...")

    const { data: allDirectors } = await supabase.from("directors").select("id, full_name, clinic")
    const { data: clientsWithDirectors } = await supabase.from("clients").select("id, name, primary_director_id")

    if (allDirectors && clientsWithDirectors) {
      for (const client of clientsWithDirectors) {
        if (!client.primary_director_id) continue

        // Check if link already exists
        const { data: existing } = await supabase
          .from("client_directors")
          .select("id")
          .eq("client_id", client.id)
          .eq("director_id", client.primary_director_id)
          .single()

        if (existing) {
          results.clientDirectors.skipped++
          continue
        }

        // Create link
        const { error } = await supabase.from("client_directors").insert({
          client_id: client.id,
          director_id: client.primary_director_id,
          is_primary: true,
        })

        if (error) {
          results.clientDirectors.errors.push(`Link for ${client.name}: ${error.message}`)
        } else {
          results.clientDirectors.inserted++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Stakeholder import completed",
      results,
    })
  } catch (error) {
    console.error("[v0] Import error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Audit the data relationships
    const audit = {
      directors: { total: 0, byClinic: {} as Record<string, number> },
      students: { total: 0, byClinic: {} as Record<string, number>, withClientTeam: 0, teamLeaders: 0 },
      clients: { total: 0, withDirector: 0, withStudents: 0 },
      clientAssignments: { total: 0, byClinic: {} as Record<string, number> },
      clientDirectors: { total: 0 },
      validation: {
        clientsWithAllClinics: [] as string[],
        clientsMissingStudents: [] as { client: string; missingClinics: string[] }[],
        orphanedStudents: [] as string[],
      },
    }

    // Count directors
    const { data: directors } = await supabase.from("directors").select("*")
    if (directors) {
      audit.directors.total = directors.length
      directors.forEach((d) => {
        audit.directors.byClinic[d.clinic] = (audit.directors.byClinic[d.clinic] || 0) + 1
      })
    }

    // Count students
    const { data: students } = await supabase.from("students").select("*")
    if (students) {
      audit.students.total = students.length
      students.forEach((s) => {
        audit.students.byClinic[s.clinic] = (audit.students.byClinic[s.clinic] || 0) + 1
        if (s.client_team) audit.students.withClientTeam++
        if (s.is_team_leader) audit.students.teamLeaders++
      })
    }

    // Count clients
    const { data: clients } = await supabase.from("clients").select("*, primary_director_id")
    if (clients) {
      audit.clients.total = clients.length
      audit.clients.withDirector = clients.filter((c) => c.primary_director_id).length
    }

    // Count client assignments
    const { data: assignments } = await supabase.from("client_assignments").select("*, clients(name)")
    if (assignments) {
      audit.clientAssignments.total = assignments.length
      assignments.forEach((a) => {
        audit.clientAssignments.byClinic[a.clinic] = (audit.clientAssignments.byClinic[a.clinic] || 0) + 1
      })
    }

    // Count client directors
    const { data: clientDirs } = await supabase.from("client_directors").select("*")
    if (clientDirs) {
      audit.clientDirectors.total = clientDirs.length
    }

    // Validate: Check which clients have students from all 4 clinics
    const clinics = ["Accounting", "Consulting", "Marketing", "Resource Acquisition"]
    if (clients && assignments) {
      for (const client of clients) {
        const clientAssignments = assignments.filter((a) => a.client_id === client.id)
        const assignedClinics = [...new Set(clientAssignments.map((a) => a.clinic))]

        const missingClinics = clinics.filter((c) => !assignedClinics.includes(c))

        if (missingClinics.length === 0) {
          audit.validation.clientsWithAllClinics.push(client.name)
        } else if (clientAssignments.length > 0) {
          audit.validation.clientsMissingStudents.push({
            client: client.name,
            missingClinics,
          })
        }
      }
    }

    // Find orphaned students (no client assignment)
    if (students && assignments) {
      const assignedStudentIds = new Set(assignments.map((a) => a.student_id))
      const orphaned = students.filter((s) => !assignedStudentIds.has(s.id))
      audit.validation.orphanedStudents = orphaned.map((s) => `${s.full_name} (${s.clinic})`)
    }

    // Get detailed client view
    const clientDetails = []
    if (clients) {
      for (const client of clients) {
        // Get director
        const { data: director } = await supabase
          .from("directors")
          .select("full_name, clinic")
          .eq("id", client.primary_director_id)
          .single()

        // Get assigned students
        const { data: clientStudents } = await supabase
          .from("client_assignments")
          .select("clinic, role, students(full_name, email, is_team_leader)")
          .eq("client_id", client.id)

        clientDetails.push({
          name: client.name,
          directorLead: director?.full_name || "Not assigned",
          studentCount: clientStudents?.length || 0,
          studentsByClinic: clinics.map((clinic) => ({
            clinic,
            students:
              clientStudents
                ?.filter((s) => s.clinic === clinic)
                .map((s) => ({
                  name: (s.students as any)?.full_name,
                  role: s.role,
                })) || [],
          })),
        })
      }
    }

    return NextResponse.json({
      success: true,
      audit,
      clientDetails,
    })
  } catch (error) {
    console.error("[v0] Audit error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

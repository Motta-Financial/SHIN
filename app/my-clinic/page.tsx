"use client"

import { useState } from "react"
import { ClinicView } from "@/components/clinic-view"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MainNavigation } from "@/components/main-navigation"
import { Building2 } from "lucide-react"

const directors = [
  { name: "Mark Dwyer", clinic: "Accounting" },
  { name: "Dat Le", clinic: "Accounting" },
  { name: "Nick Vadala", clinic: "Consulting" },
  { name: "Ken Mooney", clinic: "Resource Acquisition" },
  { name: "Christopher Hill", clinic: "Marketing" },
  { name: "Beth DiRusso", clinic: "Legal" },
  { name: "Darrell Mottley", clinic: "Legal" },
  { name: "Boris Lazic", clinic: "SEED" },
  { name: "Grace Cha", clinic: "SEED" },
]

export default function MyClinicPage() {
  const [selectedDirector, setSelectedDirector] = useState("Mark Dwyer")

  return (
    <>
      <MainNavigation />
      <main className="min-h-screen bg-slate-50 pt-[48px] pl-12">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Clinic</h1>
                <p className="text-sm text-slate-500">Manage your clinic team, clients, and materials</p>
              </div>
            </div>

            {/* Director/Clinic Selector - for demo purposes */}
            <Select value={selectedDirector} onValueChange={setSelectedDirector}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select director" />
              </SelectTrigger>
              <SelectContent>
                {directors.map((d) => (
                  <SelectItem key={d.name} value={d.name}>
                    {d.name} ({d.clinic})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clinic View Component - This has all the tabs: Overview, Team, Clients, Schedule, Assignments, Materials */}
          <ClinicView selectedClinic={selectedDirector} selectedWeeks={[]} />
        </div>
      </main>
    </>
  )
}

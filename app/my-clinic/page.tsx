"use client"

import { useState } from "react"
import { ClinicView } from "@/components/clinic-view"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MainNavigation } from "@/components/main-navigation"
import { Building2, Loader2 } from "lucide-react"
import { useDirectors } from "@/hooks/use-directors"

export default function MyClinicPage() {
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>("all")
  const { directors, isLoading } = useDirectors()

  const selectedDirector = directors.find((d) => d.id === selectedDirectorId)
  const displayName =
    selectedDirectorId === "all"
      ? "All Directors"
      : selectedDirector
        ? `${selectedDirector.full_name} (${selectedDirector.clinic})`
        : "Select director"

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <main className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Clinic</h1>
                <p className="text-sm text-slate-500">Manage your clinic team, clients, and materials</p>
              </div>
            </div>

            <Select value={selectedDirectorId} onValueChange={setSelectedDirectorId} disabled={isLoading}>
              <SelectTrigger className="w-[250px]">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading directors...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select director">{displayName}</SelectValue>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directors</SelectItem>
                {directors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.full_name} ({d.clinic})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ClinicView selectedClinic={selectedDirectorId} selectedWeeks={[]} />
        </main>
      </div>
    </div>
  )
}

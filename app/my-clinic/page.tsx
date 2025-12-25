"use client"

import { useState, useEffect } from "react"
import { ClinicView } from "@/components/clinic-view"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MainNavigation } from "@/components/main-navigation"
import { Building2, Loader2 } from "lucide-react"

interface Director {
  id: string
  full_name: string
  clinic: string
  email: string
  job_title?: string
  role?: string
}

export default function MyClinicPage() {
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>("all")
  const [directors, setDirectors] = useState<Director[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDirectors() {
      try {
        const res = await fetch("/api/directors")
        const data = await res.json()
        if (data.directors) {
          setDirectors(data.directors)
        }
      } catch (error) {
        console.error("Error fetching directors:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDirectors()
  }, [])

  const selectedDirector = directors.find((d) => d.id === selectedDirectorId)
  const displayName =
    selectedDirectorId === "all"
      ? "All Directors"
      : selectedDirector
        ? `${selectedDirector.full_name} (${selectedDirector.clinic})`
        : "Select director"

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
        </div>
      </main>
    </>
  )
}

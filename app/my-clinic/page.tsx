"use client"

import { useState, useEffect } from "react"
import { ClinicView } from "@/components/clinic-view"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MainNavigation } from "@/components/main-navigation"
import { Building2, Loader2 } from "lucide-react"
import { useDirectors } from "@/hooks/use-directors"
import { useUserRole } from "@/hooks/use-user-role"

export default function MyClinicPage() {
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>("")
  const { directors, isLoading: directorsLoading } = useDirectors()
  const { userId, email, isLoading: userLoading } = useUserRole()
  const [currentDirectorId, setCurrentDirectorId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!userLoading && !directorsLoading && directors.length > 0 && email) {
      // Find the director matching the logged-in user's email
      const matchingDirector = directors.find((d) => d.email?.toLowerCase() === email.toLowerCase())
      console.log("[v0] MyClinic - Looking for director with email:", email)
      console.log(
        "[v0] MyClinic - Directors available:",
        directors.map((d) => ({ id: d.id, email: d.email, clinic: d.clinic })),
      )
      console.log("[v0] MyClinic - Matching director found:", matchingDirector)

      if (matchingDirector) {
        setCurrentDirectorId(matchingDirector.id)
        setSelectedDirectorId(matchingDirector.id)
        setIsInitialized(true)
      } else {
        // If no matching director (maybe admin viewing), still mark as initialized
        setIsInitialized(true)
      }
    }
  }, [userLoading, directorsLoading, directors, email])

  const isLoading = directorsLoading || userLoading || !isInitialized

  const selectedDirector = directors.find((d) => d.id === selectedDirectorId)
  const displayName = selectedDirector
    ? `${selectedDirector.full_name} (${selectedDirector.clinic})`
    : "Select director"

  // Filter directors to only show the current user's director record
  const visibleDirectors = currentDirectorId ? directors.filter((d) => d.id === currentDirectorId) : directors

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
                <h1 className="text-2xl font-bold text-slate-900">
                  {selectedDirector ? `${selectedDirector.clinic} Clinic` : "My Clinic"}
                </h1>
                <p className="text-sm text-slate-500">Manage your clinic team, clients, and materials</p>
              </div>
            </div>

            {visibleDirectors.length > 1 && (
              <Select value={selectedDirectorId} onValueChange={setSelectedDirectorId} disabled={isLoading}>
                <SelectTrigger className="w-[250px]">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select director">{displayName}</SelectValue>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {visibleDirectors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name} ({d.clinic})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedDirectorId ? (
            <ClinicView selectedClinic={selectedDirectorId} selectedWeeks={[]} />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No clinic assigned to your account
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

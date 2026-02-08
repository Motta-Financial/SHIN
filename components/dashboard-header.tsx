"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Download, ChevronDown, X, Building2, Briefcase, User } from "lucide-react"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDirectors } from "@/hooks/use-directors"
import { useGlobalSemester } from "@/contexts/semester-context"

interface WeekSchedule {
  value: string
  label: string
  weekNumber: number
  isBreak: boolean
  weekStart: string
  weekEnd: string
}

interface Director {
  id: string
  full_name: string
  clinic: string
  email: string
  job_title?: string
  role?: string
}

interface Clinic {
  id: string
  name: string
}

interface Client {
  id: string
  company_name?: string
  name?: string
  clinic?: string
  clinic_id?: string
}

interface DashboardHeaderProps {
  selectedWeeks: string[]
  onWeeksChange: (weeks: string[]) => void
  availableWeeks: string[]
  selectedClinics?: string[]
  onClinicsChange?: (clinics: string[]) => void
  selectedClients?: string[]
  onClientsChange?: (clients: string[]) => void
  selectedDirectorId?: string
  onDirectorChange?: (directorId: string) => void
  showDirectorFilter?: boolean
  onCurrentWeekDetected?: (currentWeek: string) => void
}

// Use global rate-limited fetch
import { fetchWithRateLimit, fetchAllWithRateLimit } from "@/lib/fetch-with-rate-limit"

const fetchSequentially = fetchAllWithRateLimit

export function DashboardHeader({
  selectedWeeks,
  onWeeksChange,
  availableWeeks,
  selectedClinics = [],
  onClinicsChange,
  selectedClients = [],
  onClientsChange,
  selectedDirectorId = "all",
  onDirectorChange,
  showDirectorFilter = false,
  onCurrentWeekDetected,
}: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [schedule, setSchedule] = useState<WeekSchedule[]>([])
  const { directors } = useDirectors()
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [weekPickerOpen, setWeekPickerOpen] = useState(false)
  const [clinicPickerOpen, setClinicPickerOpen] = useState(false)
  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [directorPickerOpen, setDirectorPickerOpen] = useState(false)

  const { selectedSemesterId } = useGlobalSemester()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const semesterParam = selectedSemesterId ? `?semesterId=${selectedSemesterId}` : ""

        const urls = ["/api/supabase/weeks", "/api/supabase/clinics", `/api/clients${semesterParam}`]

        const [scheduleRes, clinicsRes, clientsRes] = await fetchSequentially(urls)

        // Safe JSON parsing helper
        const safeParseJson = async (res: Response, fallback: any = {}) => {
          if (!res.ok) return fallback
          try {
            return await res.json()
          } catch {
            return fallback
          }
        }

        const scheduleData = await safeParseJson(scheduleRes, { success: false })
        if (scheduleData.success && scheduleData.schedule) {
          setSchedule(scheduleData.schedule)

          if (scheduleData.currentWeek && selectedWeeks.length === 0 && onCurrentWeekDetected) {
            onCurrentWeekDetected(scheduleData.currentWeek)
          }
        }

        const clinicsData = await safeParseJson(clinicsRes, { clinics: [] })
        if (clinicsData.clinics && clinicsData.clinics.length > 0) {
          setClinics(clinicsData.clinics)
        } else {
          setClinics([
            { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Accounting" },
            { id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "Marketing" },
            { id: "c3d4e5f6-a7b8-9012-cdef-123456789012", name: "Consulting" },
            { id: "d4e5f6a7-b8c9-0123-def1-234567890123", name: "Resource Acquisition" },
          ])
        }

        const clientsData = await safeParseJson(clientsRes, { clients: [] })
        if (clientsData.clients && clientsData.clients.length > 0) {
          setClients(clientsData.clients)
          setFilteredClients(clientsData.clients)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setClinics([
          { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Accounting" },
          { id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "Marketing" },
          { id: "c3d4e5f6-a7b8-9012-cdef-123456789012", name: "Consulting" },
          { id: "d4e5f6a7-b8c9-0123-def1-234567890123", name: "Resource Acquisition" },
        ])
      }
    }
    fetchData()
  }, [selectedSemesterId])

  useEffect(() => {
    if (selectedClinics.length === 0) {
      setFilteredClients(clients)
    } else {
      const selectedClinicNames = clinics.filter((c) => selectedClinics.includes(c.id)).map((c) => c.name.toLowerCase())

      setFilteredClients(
        clients.filter((c) => {
          if (c.clinic_id && selectedClinics.includes(c.clinic_id)) {
            return true
          }
          const clientClinic = (c.clinic || "").toLowerCase()
          return selectedClinicNames.some((name) => clientClinic.includes(name) || name.includes(clientClinic))
        }),
      )
    }
  }, [selectedClinics, clients, clinics])

  const formatWeekLabel = (weekStart: string) => {
    const week = schedule.find((s) => s.value === weekStart)
    if (week) {
      const startDate = new Date(week.weekStart)
      const endDate = new Date(week.weekEnd)
      return `${week.label} (${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
    }
    const date = new Date(weekStart)
    return `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  }

  const toggleWeek = (week: string) => {
    if (selectedWeeks.includes(week)) {
      onWeeksChange(selectedWeeks.filter((w) => w !== week))
    } else {
      onWeeksChange([...selectedWeeks, week])
    }
  }

  const selectAllWeeks = () => {
    onWeeksChange([...availableWeeks])
  }

  const clearWeekSelection = () => {
    onWeeksChange([])
  }

  const toggleClinic = (clinicId: string) => {
    if (!onClinicsChange) return
    if (selectedClinics.includes(clinicId)) {
      onClinicsChange(selectedClinics.filter((c) => c !== clinicId))
    } else {
      onClinicsChange([...selectedClinics, clinicId])
    }
  }

  const selectAllClinics = () => {
    if (onClinicsChange) {
      onClinicsChange(clinics.map((c) => c.id))
    }
  }

  const clearClinicSelection = () => {
    if (onClinicsChange) {
      onClinicsChange([])
    }
  }

  const toggleClient = (clientId: string) => {
    if (!onClientsChange) return
    if (selectedClients.includes(clientId)) {
      onClientsChange(selectedClients.filter((c) => c !== clientId))
    } else {
      onClientsChange([...selectedClients, clientId])
    }
  }

  const selectAllClients = () => {
    if (onClientsChange) {
      onClientsChange(filteredClients.map((c) => c.id))
    }
  }

  const clearClientSelection = () => {
    if (onClientsChange) {
      onClientsChange([])
    }
  }

  const selectDirector = (directorId: string) => {
    if (onDirectorChange) {
      onDirectorChange(directorId)
      setDirectorPickerOpen(false)
    }
  }

  const getWeekSelectorDisplay = () => {
    if (selectedWeeks.length === 0) {
      return "All Periods"
    }
    if (selectedWeeks.length === 1) {
      return formatWeekLabel(selectedWeeks[0])
    }
    if (selectedWeeks.length === availableWeeks.length) {
      return "All Weeks Selected"
    }
    return `${selectedWeeks.length} weeks selected`
  }

  const getClinicSelectorDisplay = () => {
    if (selectedClinics.length === 0) {
      return "All Clinics"
    }
    if (selectedClinics.length === 1) {
      const clinic = clinics.find((c) => c.id === selectedClinics[0])
      return clinic?.name || "1 clinic"
    }
    if (selectedClinics.length === clinics.length) {
      return "All Clinics Selected"
    }
    return `${selectedClinics.length} clinics selected`
  }

  const getClientSelectorDisplay = () => {
    if (selectedClients.length === 0) {
      return "All Clients"
    }
    if (selectedClients.length === 1) {
      const client = clients.find((c) => c.id === selectedClients[0])
      return client?.name || client?.company_name || "1 client"
    }
    if (selectedClients.length === filteredClients.length && filteredClients.length > 0) {
      return "All Clients Selected"
    }
    return `${selectedClients.length} clients selected`
  }

  const getDirectorSelectorDisplay = () => {
    if (selectedDirectorId === "all") {
      return "All Directors"
    }
    const director = directors.find((d) => d.id === selectedDirectorId)
    return director?.full_name || "Select Director"
  }

  if (!mounted) {
    return (
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {showDirectorFilter && onDirectorChange && (
            <Popover open={directorPickerOpen} onOpenChange={setDirectorPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 min-w-[180px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-400" />
                    <span className="truncate max-w-[120px]">{getDirectorSelectorDisplay()}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Select Director</span>
                    {selectedDirectorId !== "all" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectDirector("all")}
                        className="h-6 px-2 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">View dashboard as a specific director</p>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="p-2 space-y-1">
                    <div
                      className={`flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer ${selectedDirectorId === "all" ? "bg-muted" : ""}`}
                      onClick={() => selectDirector("all")}
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">All Directors</span>
                        <span className="text-xs text-muted-foreground">View aggregate data</span>
                      </div>
                    </div>
                    <div className="border-t my-2" />
                    {directors.map((director) => (
                      <div
                        key={director.id}
                        className={`flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer ${selectedDirectorId === director.id ? "bg-muted" : ""}`}
                        onClick={() => selectDirector(director.id)}
                      >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-medium">
                          {director.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{director.full_name}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {director.clinic} {director.job_title ? `• ${director.job_title}` : ""}
                          </span>
                        </div>
                        {selectedDirectorId === director.id && (
                          <Badge variant="secondary" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}

          {/* Week Selector */}
          <Popover open={weekPickerOpen} onOpenChange={setWeekPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 min-w-[200px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span className="truncate max-w-[150px]">{getWeekSelectorDisplay()}</span>
                </div>
                <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Filter by Week</span>
                  {selectedWeeks.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearWeekSelection} className="h-6 px-2 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Classes are on the week start date (Monday)</p>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="p-2 space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllWeeks}
                    className="w-full justify-start text-sm h-8"
                  >
                    Select All ({availableWeeks.length})
                  </Button>
                  <div className="border-t my-2" />
                  {schedule.map((week) => (
                    <div
                      key={week.value}
                      className={`flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer ${week.isBreak ? "opacity-60" : ""}`}
                      onClick={() => toggleWeek(week.value)}
                    >
                      <Checkbox
                        checked={selectedWeeks.includes(week.value)}
                        onCheckedChange={() => toggleWeek(week.value)}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {week.label}
                          {week.isBreak && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Break
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(week.weekStart).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(week.weekEnd).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Clinic Filter - only show if handlers provided */}
          {onClinicsChange && (
            <Popover open={clinicPickerOpen} onOpenChange={setClinicPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 min-w-[160px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-cyan-400" />
                    <span className="truncate max-w-[100px]">{getClinicSelectorDisplay()}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Filter by Clinic</span>
                    {selectedClinics.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearClinicSelection} className="h-6 px-2 text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="p-2 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllClinics}
                      className="w-full justify-start text-sm h-8"
                    >
                      Select All ({clinics.length})
                    </Button>
                    <div className="border-t my-2" />
                    {clinics.map((clinic) => (
                      <div
                        key={clinic.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => toggleClinic(clinic.id)}
                      >
                        <Checkbox
                          checked={selectedClinics.includes(clinic.id)}
                          onCheckedChange={() => toggleClinic(clinic.id)}
                        />
                        <span className="text-sm">{clinic.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {selectedClinics.length > 0 && (
                  <div className="p-2 border-t bg-muted/50">
                    <div className="flex flex-wrap gap-1">
                      {selectedClinics.slice(0, 3).map((clinicId) => {
                        const clinic = clinics.find((c) => c.id === clinicId)
                        return (
                          <Badge key={clinicId} variant="secondary" className="text-xs">
                            {clinic?.name}
                            <X
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleClinic(clinicId)
                              }}
                            />
                          </Badge>
                        )
                      })}
                      {selectedClinics.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedClinics.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}

          {/* Client Filter - only show if handlers provided */}
          {onClientsChange && (
            <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 min-w-[160px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-400" />
                    <span className="truncate max-w-[100px]">{getClientSelectorDisplay()}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="end">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Filter by Client</span>
                    {selectedClients.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearClientSelection} className="h-6 px-2 text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  {selectedClinics.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Showing clients in selected clinics</p>
                  )}
                </div>
                <ScrollArea className="h-[250px]">
                  <div className="p-2 space-y-1">
                    {filteredClients.length > 0 ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllClients}
                          className="w-full justify-start text-sm h-8"
                        >
                          Select All ({filteredClients.length})
                        </Button>
                        <div className="border-t my-2" />
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                            onClick={() => toggleClient(client.id)}
                          >
                            <Checkbox
                              checked={selectedClients.includes(client.id)}
                              onCheckedChange={() => toggleClient(client.id)}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm">{client.name || client.company_name}</span>
                              {client.clinic && <span className="text-xs text-muted-foreground">{client.clinic}</span>}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No clients found for selected clinics
                      </div>
                    )}
                  </div>
                </ScrollArea>
                {selectedClients.length > 0 && (
                  <div className="p-2 border-t bg-muted/50">
                    <div className="flex flex-wrap gap-1">
                      {selectedClients.slice(0, 2).map((clientId) => {
                        const client = clients.find((c) => c.id === clientId)
                        return (
                          <Badge key={clientId} variant="secondary" className="text-xs">
                            {client?.name || client?.company_name}
                            <X
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleClient(clientId)
                              }}
                            />
                          </Badge>
                        )
                      })}
                      {selectedClients.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedClients.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}

          {/* Export Button */}
          <Button variant="outline" className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </header>
  )
}

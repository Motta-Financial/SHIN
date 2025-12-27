"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Download, ChevronDown, X, Building2, Briefcase } from "lucide-react"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

interface WeekSchedule {
  value: string
  label: string
  weekNumber: number
  isBreak: boolean
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
  selectedClinics: string[]
  onClinicsChange: (clinics: string[]) => void
  selectedClients: string[]
  onClientsChange: (clients: string[]) => void
}

export function DashboardHeader({
  selectedWeeks,
  onWeeksChange,
  availableWeeks,
  selectedClinics,
  onClinicsChange,
  selectedClients,
  onClientsChange,
}: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [schedule, setSchedule] = useState<WeekSchedule[]>([])
  const [directors, setDirectors] = useState<Director[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [weekPickerOpen, setWeekPickerOpen] = useState(false)
  const [clinicPickerOpen, setClinicPickerOpen] = useState(false)
  const [clientPickerOpen, setClientPickerOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [scheduleRes, directorsRes, clinicsRes, clientsRes] = await Promise.all([
          fetch("/api/supabase/weeks"),
          fetch("/api/directors"),
          fetch("/api/supabase/clinics"),
          fetch("/api/clients"),
        ])

        const scheduleData = await scheduleRes.json()
        if (scheduleData.success && scheduleData.schedule) {
          setSchedule(scheduleData.schedule)
        }

        const directorsData = await directorsRes.json()
        if (directorsData.directors) {
          setDirectors(directorsData.directors)
        }

        const clinicsData = await clinicsRes.json()
        if (clinicsData.clinics && clinicsData.clinics.length > 0) {
          setClinics(clinicsData.clinics)
        } else {
          // Fallback to hardcoded clinics if database is empty
          setClinics([
            { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Accounting" },
            { id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "Marketing" },
            { id: "c3d4e5f6-a7b8-9012-cdef-123456789012", name: "Consulting" },
            { id: "d4e5f6a7-b8c9-0123-def1-234567890123", name: "Resource Acquisition" },
          ])
        }

        const clientsData = await clientsRes.json()
        if (clientsData.clients) {
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
  }, [])

  useEffect(() => {
    if (selectedClinics.length === 0) {
      setFilteredClients(clients)
    } else {
      // Get selected clinic names for matching
      const selectedClinicNames = clinics.filter((c) => selectedClinics.includes(c.id)).map((c) => c.name.toLowerCase())

      setFilteredClients(
        clients.filter((c) => {
          // Check by clinic_id first if available
          if (c.clinic_id && selectedClinics.includes(c.clinic_id)) {
            return true
          }
          // Fallback to clinic name matching
          const clientClinic = (c.clinic || "").toLowerCase()
          return selectedClinicNames.some((name) => clientClinic.includes(name) || name.includes(clientClinic))
        }),
      )
    }
  }, [selectedClinics, clients, clinics])

  const formatWeekLabel = (weekEnding: string) => {
    const week = schedule.find((s) => s.value === weekEnding)
    if (week) {
      const date = new Date(weekEnding)
      return `${week.label} (${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
    }
    const date = new Date(weekEnding)
    return `Week ending ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
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
    if (selectedClinics.includes(clinicId)) {
      onClinicsChange(selectedClinics.filter((c) => c !== clinicId))
    } else {
      onClinicsChange([...selectedClinics, clinicId])
    }
  }

  const selectAllClinics = () => {
    onClinicsChange(clinics.map((c) => c.id))
  }

  const clearClinicSelection = () => {
    onClinicsChange([])
  }

  const toggleClient = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      onClientsChange(selectedClients.filter((c) => c !== clientId))
    } else {
      onClientsChange([...selectedClients, clientId])
    }
  }

  const selectAllClients = () => {
    onClientsChange(filteredClients.map((c) => c.id))
  }

  const clearClientSelection = () => {
    onClientsChange([])
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
          {/* Week Selector */}
          <Popover open={weekPickerOpen} onOpenChange={setWeekPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 min-w-[160px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span className="truncate max-w-[100px]">{getWeekSelectorDisplay()}</span>
                </div>
                <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
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
                          {new Date(week.value).toLocaleDateString("en-US", {
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

          {/* Clinic Filter */}
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

          {/* Client Filter */}
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

          {/* Export Button */}
          <Button variant="outline" className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedClinics.length > 0 || selectedClients.length > 0 || selectedWeeks.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700">
          <span className="text-xs text-slate-400">Active filters:</span>
          {selectedClinics.length > 0 && (
            <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              {selectedClinics.length} {selectedClinics.length === 1 ? "clinic" : "clinics"}
            </Badge>
          )}
          {selectedClients.length > 0 && (
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              {selectedClients.length} {selectedClients.length === 1 ? "client" : "clients"}
            </Badge>
          )}
          {selectedWeeks.length > 0 && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
              {selectedWeeks.length} {selectedWeeks.length === 1 ? "week" : "weeks"}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearClinicSelection()
              clearClientSelection()
              clearWeekSelection()
            }}
            className="h-6 px-2 text-xs text-slate-400 hover:text-white"
          >
            Clear all
          </Button>
        </div>
      )}
    </header>
  )
}

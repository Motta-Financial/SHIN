"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Download, ChevronDown, X, Building2, Briefcase } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

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
  company_name: string
  clinic?: string
}

interface DashboardHeaderProps {
  selectedWeeks: string[]
  onWeeksChange: (weeks: string[]) => void
  availableWeeks: string[]
  selectedClinic: string
  onClinicChange: (clinic: string) => void
  selectedClient?: string
  onClientChange?: (client: string) => void
}

export function DashboardHeader({
  selectedWeeks,
  onWeeksChange,
  availableWeeks,
  selectedClinic,
  onClinicChange,
  selectedClient = "all",
  onClientChange,
}: DashboardHeaderProps) {
  const [schedule, setSchedule] = useState<WeekSchedule[]>([])
  const [directors, setDirectors] = useState<Director[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [weekPickerOpen, setWeekPickerOpen] = useState(false)

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
        if (clinicsData.success && clinicsData.clinics) {
          setClinics(clinicsData.clinics)
        }

        const clientsData = await clientsRes.json()
        if (clientsData.clients) {
          setClients(clientsData.clients)
          setFilteredClients(clientsData.clients)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedClinic === "all") {
      setFilteredClients(clients)
    } else {
      const clinic = clinics.find((c) => c.id === selectedClinic)
      if (clinic) {
        setFilteredClients(clients.filter((c) => c.clinic === clinic.name))
      } else {
        setFilteredClients(clients)
      }
    }
    if (onClientChange && selectedClient !== "all") {
      onClientChange("all")
    }
  }, [selectedClinic, clients, clinics])

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

  const clearSelection = () => {
    onWeeksChange([])
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

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 py-3 px-6 sticky top-0 z-40">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center">
          <Image
            src="/images/shin-logo-cropped.png"
            alt="SHIN - SEED Hub & Information Nexus"
            width={160}
            height={56}
            className="h-14 w-auto flex-shrink-0 ml-2"
            priority
            unoptimized
          />
          <div className="border-l border-slate-200 pl-4 ml-4">
            <h1 className="text-xl font-bold text-slate-800">Clinic Director Dashboard</h1>
            <p className="text-sm text-slate-500">Real-time overview of SEED program progress</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedClinic} onValueChange={onClinicChange}>
            <SelectTrigger className="w-[180px] border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm h-8">
              <Building2 className="mr-2 h-3 w-3" />
              <SelectValue placeholder="Select clinic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clinics</SelectItem>
              {clinics.map((clinic) => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClient} onValueChange={(value) => onClientChange?.(value)}>
            <SelectTrigger className="w-[200px] border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm h-8">
              <Briefcase className="mr-2 h-3 w-3" />
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {filteredClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={weekPickerOpen} onOpenChange={setWeekPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm h-8 justify-between"
              >
                <div className="flex items-center">
                  <Calendar className="mr-2 h-3 w-3" />
                  <span className="truncate">{getWeekSelectorDisplay()}</span>
                </div>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="end">
              <div className="p-2 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearSelection}>
                    All Periods
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAllWeeks}>
                    Select All Weeks
                  </Button>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {availableWeeks.map((week) => {
                  const isSelected = selectedWeeks.includes(week)
                  const weekInfo = schedule.find((s) => s.value === week)
                  return (
                    <div
                      key={week}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-slate-50 ${
                        isSelected ? "bg-slate-100" : ""
                      }`}
                      onClick={() => toggleWeek(week)}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleWeek(week)} />
                      <div className="flex-1">
                        <span className="text-sm">{weekInfo ? weekInfo.label : `Week of ${week}`}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          {new Date(week).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {weekInfo?.isBreak && (
                        <Badge variant="secondary" className="text-xs">
                          Break
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
              {selectedWeeks.length > 0 && (
                <div className="p-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {selectedWeeks.length} week{selectedWeeks.length !== 1 ? "s" : ""} selected
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-500" onClick={clearSelection}>
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs bg-transparent"
          >
            <Download className="mr-2 h-3 w-3" />
            Export Report
          </Button>
        </div>
      </div>
    </div>
  )
}

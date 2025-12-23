"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, User } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

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

interface DashboardHeaderProps {
  selectedWeeks: string[]
  onWeeksChange: (weeks: string[]) => void
  availableWeeks: string[]
  selectedClinic: string
  onClinicChange: (clinic: string) => void
}

export function DashboardHeader({
  selectedWeeks,
  onWeeksChange,
  availableWeeks,
  selectedClinic,
  onClinicChange,
}: DashboardHeaderProps) {
  const [schedule, setSchedule] = useState<WeekSchedule[]>([])
  const [directors, setDirectors] = useState<Director[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [scheduleRes, directorsRes] = await Promise.all([fetch("/api/supabase/weeks"), fetch("/api/directors")])

        const scheduleData = await scheduleRes.json()
        if (scheduleData.success && scheduleData.schedule) {
          setSchedule(scheduleData.schedule)
        }

        const directorsData = await directorsRes.json()
        if (directorsData.directors) {
          setDirectors(directorsData.directors)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [])

  const formatWeekDisplay = (weekEnding: string) => {
    const week = schedule.find((s) => s.value === weekEnding)
    if (week) {
      const date = new Date(weekEnding)
      return `${week.label} (${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
    }
    const date = new Date(weekEnding)
    return `Week ending ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  }

  const selectedValue = selectedWeeks.length === 0 ? "all" : selectedWeeks[0]

  const handleWeekChange = (value: string) => {
    if (value === "all") {
      onWeeksChange([])
    } else {
      onWeeksChange([value])
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="px-4 py-3 pl-4">
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
              <SelectTrigger className="w-[200px] border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm h-8">
                <User className="mr-2 h-3 w-3" />
                <SelectValue placeholder="Select director" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directors</SelectItem>
                {directors.map((director) => (
                  <SelectItem key={director.id} value={director.full_name}>
                    {director.full_name} ({director.clinic})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedValue} onValueChange={handleWeekChange}>
              <SelectTrigger className="w-[220px] border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm h-8">
                <Calendar className="mr-2 h-3 w-3" />
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data (To Date)</SelectItem>
                {availableWeeks.map((week) => (
                  <SelectItem key={week} value={week}>
                    {formatWeekDisplay(week)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
    </header>
  )
}

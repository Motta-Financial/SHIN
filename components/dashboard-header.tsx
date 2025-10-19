"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, Filter } from "lucide-react"
import { useState } from "react"

interface DashboardHeaderProps {
  selectedWeek: string
  onWeekChange: (week: string) => void
  availableWeeks: string[]
}

export function DashboardHeader({ selectedWeek, onWeekChange, availableWeeks }: DashboardHeaderProps) {
  const [clinic, setClinic] = useState("all")

  const formatWeekDisplay = (weekEnding: string) => {
    const date = new Date(weekEnding)
    return `Week ending ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  }

  return (
    <header className="border-b border-primary/20 bg-primary">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SHIN-GE8q2ogy1UXgZP9l4tLaNzYHzaEWEU.png"
              alt="SHIN Logo"
              width={180}
              height={60}
              className="h-12 w-auto"
            />
            <div className="h-8 w-px bg-primary-foreground/20" />
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">Clinic Director Dashboard</h1>
              <p className="text-sm text-primary-foreground/70">Real-time overview of SEED program progress</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={clinic} onValueChange={setClinic}>
              <SelectTrigger className="w-[180px] border-primary-foreground/20 bg-primary/50 text-primary-foreground hover:bg-primary/70">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select clinic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clinics</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="accounting">Accounting</SelectItem>
                <SelectItem value="funding">Resource Acquisition</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedWeek} onValueChange={onWeekChange}>
              <SelectTrigger className="w-[220px] border-primary-foreground/20 bg-primary/50 text-primary-foreground hover:bg-primary/70">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {availableWeeks.length > 0 &&
                  availableWeeks.map((week) => (
                    <SelectItem key={week} value={week}>
                      {formatWeekDisplay(week)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              size="sm"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface WeekSelectorProps {
  selectedWeek: string
  onWeekChange: (week: string) => void
  availableWeeks: string[]
}

export function WeekSelector({ selectedWeek, onWeekChange, availableWeeks }: WeekSelectorProps) {
  return (
    <Select value={selectedWeek} onValueChange={onWeekChange}>
      <SelectTrigger className="w-[200px] bg-background">
        <SelectValue placeholder="Select week" />
      </SelectTrigger>
      <SelectContent>
        {availableWeeks.map((week) => (
          <SelectItem key={week} value={week}>
            Week ending {new Date(week).toLocaleDateString()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

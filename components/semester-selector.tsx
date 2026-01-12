"use client"

import { useGlobalSemester } from "@/contexts/semester-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

interface SemesterSelectorProps {
  className?: string
  showLabel?: boolean
}

export function SemesterSelector({ className, showLabel = true }: SemesterSelectorProps) {
  const { semesters, selectedSemesterId, setSelectedSemesterId, isLoading } = useGlobalSemester()

  if (isLoading || semesters.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      {showLabel && <Calendar className="h-4 w-4 text-muted-foreground" />}
      <Select value={selectedSemesterId || ""} onValueChange={setSelectedSemesterId}>
        <SelectTrigger className="w-[180px] bg-white border-[#5d6b7a]/30">
          <SelectValue placeholder="Select semester" />
        </SelectTrigger>
        <SelectContent>
          {semesters.map((semester) => (
            <SelectItem key={semester.id} value={semester.id}>
              <div className="flex items-center gap-2">
                {semester.semester}
                {semester.is_active && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Current
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

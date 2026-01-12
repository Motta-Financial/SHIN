"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users } from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
  clinic: string
}

interface PortalStudentSelectorProps {
  selectedStudentId: string
  onStudentChange: (studentId: string) => void
  className?: string
}

export function PortalStudentSelector({ selectedStudentId, onStudentChange, className }: PortalStudentSelectorProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/supabase/students/overview")
        const data = await res.json()
        if (data.students) {
          setStudents(
            data.students.map((s: any) => ({
              id: s.id,
              name: s.full_name || s.name,
              email: s.email,
              clinic: s.clinic_name || s.clinic,
            })),
          )
          // Auto-select first student if none selected
          if (!selectedStudentId && data.students.length > 0) {
            onStudentChange(data.students[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching students:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        Loading students...
      </div>
    )
  }

  return (
    <div className={className}>
      <Select value={selectedStudentId} onValueChange={onStudentChange}>
        <SelectTrigger className="w-[280px] bg-white">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select a student to view" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {students.map((student) => (
            <SelectItem key={student.id} value={student.id}>
              <div className="flex flex-col">
                <span>{student.name}</span>
                <span className="text-xs text-muted-foreground">{student.clinic}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

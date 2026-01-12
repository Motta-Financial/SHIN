"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface DemoStudent {
  id: string
  name: string
  client_name?: string
}

const STORAGE_KEY = "selectedStudentId"

const DEFAULT_STUDENT_ID = "dd081f20-9261-42d7-885a-e0c54a3b6377"

const DEMO_STUDENTS = [
  { id: "dd081f20-9261-42d7-885a-e0c54a3b6377", name: "Anaya Martinez" },
  { id: "302524ef-b2bd-4d7b-9b01-3856cd266326", name: "Ava Hopson" },
  { id: "6f738624-7b4c-4904-aa61-f6f1b0cacbbf", name: "Clive Musiiwa" },
  { id: "dcc89bec-3661-4dc4-bb00-5022fad1e959", name: "Dwayne Smith" },
]

const SPRING_2026_SEMESTER_ID = "a1b2c3d4-e5f6-7890-abcd-202601120000"

function getStoredStudentId(): string {
  if (typeof window === "undefined") return DEFAULT_STUDENT_ID
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return DEFAULT_STUDENT_ID

  // Validate stored ID is in DEMO_STUDENTS (Spring 2026)
  const isValid = DEMO_STUDENTS.some((s) => s.id === stored)
  if (!isValid) {
    // Reset to default Spring 2026 student
    localStorage.setItem(STORAGE_KEY, DEFAULT_STUDENT_ID)
    return DEFAULT_STUDENT_ID
  }
  return stored
}

// Helper to set stored value and notify listeners
function setStoredStudentId(id: string) {
  localStorage.setItem(STORAGE_KEY, id)
  // Dispatch custom event for same-window listeners
  window.dispatchEvent(new CustomEvent("demoStudentChanged", { detail: { studentId: id } }))
  // Force page reload to ensure all components pick up the change
  window.location.reload()
}

interface DemoStudentSelectorProps {
  onStudentChange?: (studentId: string) => void
  className?: string
}

export function DemoStudentSelector({ onStudentChange, className }: DemoStudentSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_STUDENT_ID)
  const [students, setStudents] = useState<DemoStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const validatedId = getStoredStudentId()
    setSelectedId(validatedId)
  }, [])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/supabase/v-complete-mapping")
        if (res.ok) {
          const response = await res.json()
          const data = response.data || response.records || response.mappings || []
          // Get unique students
          const uniqueStudents = new Map<string, DemoStudent>()
          if (Array.isArray(data)) {
            data.forEach((row: any) => {
              if (row.student_id && row.student_name && !uniqueStudents.has(row.student_id)) {
                uniqueStudents.set(row.student_id, {
                  id: row.student_id,
                  name: row.student_name,
                  client_name: row.client_name,
                })
              }
            })
          }
          const studentList = Array.from(uniqueStudents.values()).sort((a, b) => a.name.localeCompare(b.name))
          setStudents(studentList)

          const storedId = localStorage.getItem(STORAGE_KEY)
          if (storedId && studentList.length > 0) {
            const isValidStudent = studentList.some((s) => s.id === storedId)
            if (!isValidStudent) {
              console.log("[v0] Stored student not in Spring 2026 roster, resetting to default")
              localStorage.setItem(STORAGE_KEY, DEFAULT_STUDENT_ID)
              setSelectedId(DEFAULT_STUDENT_ID)
            }
          }
        }
      } catch (err) {
        console.error("[v0] Failed to fetch students:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const handleChange = (newId: string) => {
    setSelectedId(newId)
    onStudentChange?.(newId)
    setStoredStudentId(newId)
  }

  const selectedStudent = students.find((s) => s.id === selectedId)

  if (!mounted) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
          <Users className="h-3 w-3 mr-1" />
          Demo Mode
        </Badge>
        <div className="w-[220px] h-8 bg-slate-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
        <Users className="h-3 w-3 mr-1" />
        Demo Mode
      </Badge>
      <Select value={selectedId} onValueChange={handleChange}>
        <SelectTrigger className="w-[220px] h-8 text-sm">
          <SelectValue placeholder={loading ? "Loading..." : "Select student"}>
            {selectedStudent?.name || "Select student"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {students.map((student) => (
            <SelectItem key={student.id} value={student.id}>
              <div className="flex flex-col">
                <span className="font-medium">{student.name}</span>
                {student.client_name && <span className="text-xs text-muted-foreground">{student.client_name}</span>}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function useDemoStudent(defaultId?: string): string {
  const [studentId, setStudentId] = useState<string>(defaultId || DEFAULT_STUDENT_ID)

  useEffect(() => {
    // Get and validate stored value on mount
    const validatedId = getStoredStudentId()
    setStudentId(validatedId)
  }, [])

  return studentId
}

export { STORAGE_KEY, DEFAULT_STUDENT_ID, DEMO_STUDENTS, getStoredStudentId, setStoredStudentId }

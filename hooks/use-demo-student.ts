"use client"

import { useState, useEffect } from "react"
import { DEMO_STUDENTS, DEFAULT_STUDENT_ID, getStoredStudentId } from "@/components/demo-student-selector"

interface Student {
  id: string
  full_name: string
  email: string
  clinic_name?: string
}

export function useDemoStudent(): { student: Student | null; studentId: string; isReady: boolean } {
  const [studentId, setStudentId] = useState<string>(DEFAULT_STUDENT_ID)
  const [student, setStudent] = useState<Student | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Get and validate stored value on mount
    const validatedId = getStoredStudentId()
    setStudentId(validatedId)

    // Find the student in DEMO_STUDENTS
    const foundStudent = DEMO_STUDENTS.find((s) => s.id === validatedId)
    if (foundStudent) {
      setStudent({
        id: foundStudent.id,
        full_name: foundStudent.name,
        email: foundStudent.email,
        clinic_name: foundStudent.clinic,
      })
    }

    setIsReady(true)
  }, [])

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newId = getStoredStudentId()
      setStudentId(newId)

      const foundStudent = DEMO_STUDENTS.find((s) => s.id === newId)
      if (foundStudent) {
        setStudent({
          id: foundStudent.id,
          full_name: foundStudent.name,
          email: foundStudent.email,
          clinic_name: foundStudent.clinic,
        })
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return { student, studentId, isReady }
}

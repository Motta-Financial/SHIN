"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Lock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Student {
  id: string
  name: string
  email: string
  clinic: string
}

const CLINICS = ["Consulting", "Accounting", "Funding", "Marketing", "Resource Acquisition"]

export default function SubmitAttendancePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [classDate, setClassDate] = useState("")
  const [weekNumber, setWeekNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClinic, setSelectedClinic] = useState<string>("all")
  const [setupRequired, setSetupRequired] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents()
    }
  }, [isAuthenticated])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/seed-data")
      const data = await response.json()

      if (data.setupRequired) {
        console.log("[v0] Supabase tables not found, falling back to Airtable roster")
        setSetupRequired(true)
        await fetchFromAirtable()
      } else {
        const mappedStudents = (data.students || []).map((s: any) => ({
          id: s.id,
          name: s.full_name || `${s.first_name} ${s.last_name}`,
          email: s.email,
          clinic: s.clinic,
        }))
        setStudents(mappedStudents)
        setSetupRequired(false)
      }
    } catch (error) {
      console.error("[v0] Error fetching students:", error)
      await fetchFromAirtable()
    } finally {
      setLoading(false)
    }
  }

  const fetchFromAirtable = async () => {
    try {
      const response = await fetch("/api/airtable/roster")
      const data = await response.json()

      const mappedStudents = (data.records || [])
        .map((record: any) => ({
          id: record.id,
          name: record.fields.NAME || "",
          email: record.fields["Email Address"] || "",
          clinic: record.fields["Related Clinic"] || record.fields.ROLE || "",
        }))
        .filter((s: Student) => s.name && s.email)

      setStudents(mappedStudents)
    } catch (error) {
      console.error("[v0] Error fetching from Airtable:", error)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "SEED2025") {
      setIsAuthenticated(true)
    } else {
      alert("Incorrect password")
    }
  }

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedStudents.size === 0) {
      alert("Please select at least one student")
      return
    }

    if (!classDate || !weekNumber) {
      alert("Please fill in all required fields")
      return
    }

    setSubmitting(true)

    try {
      const weekEnding = new Date(classDate)
      weekEnding.setDate(weekEnding.getDate() + (5 - weekEnding.getDay()))

      const attendanceRecords = Array.from(selectedStudents).map((studentId) => {
        const student = students.find((s) => s.id === studentId)
        return {
          student_id: studentId,
          student_name: student?.name || "",
          student_email: student?.email || "",
          clinic: student?.clinic || "",
          week_number: Number.parseInt(weekNumber),
          class_date: classDate,
          week_ending: weekEnding.toISOString().split("T")[0],
          notes: notes,
          created_by: "Director",
        }
      })

      const promises = attendanceRecords.map((record) =>
        fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        }),
      )

      await Promise.all(promises)

      alert(`Successfully recorded attendance for ${selectedStudents.size} students!`)
      setSelectedStudents(new Set())
      setClassDate("")
      setWeekNumber("")
      setNotes("")
    } catch (error) {
      console.error("[v0] Error submitting attendance:", error)
      alert("Failed to submit attendance. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClinic =
      selectedClinic === "all" || student.clinic.toLowerCase().includes(selectedClinic.toLowerCase())
    return matchesSearch && matchesClinic
  })

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Attendance Submission</CardTitle>
            <CardDescription>Enter password to record student attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full">
                Access Form
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        {setupRequired && (
          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Database Setup Required</AlertTitle>
            <AlertDescription className="text-amber-800">
              The Supabase SEED tables haven't been created yet. Currently using Airtable data as fallback. To use
              Supabase, run the SQL scripts (01-create-seed-tables.sql through 05-seed-client-assignments.sql) in your
              Supabase SQL editor.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Record Student Attendance</CardTitle>
                <CardDescription>Mark students present for today's class session</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                <p className="mt-4 text-sm text-slate-600">Loading students...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Class Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="classDate">Class Date *</Label>
                    <Input
                      id="classDate"
                      type="date"
                      value={classDate}
                      onChange={(e) => setClassDate(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekNumber">Week Number *</Label>
                    <Input
                      id="weekNumber"
                      type="number"
                      min="1"
                      max="16"
                      value={weekNumber}
                      onChange={(e) => setWeekNumber(e.target.value)}
                      placeholder="e.g., 1, 2, 3..."
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Student Selection */}
                <div>
                  <Label>Select Students Present *</Label>
                  <div className="mt-2 space-y-3">
                    {/* Search and Filter */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                      />
                      <select
                        value={selectedClinic}
                        onChange={(e) => setSelectedClinic(e.target.value)}
                        className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="all">All Clinics</option>
                        {CLINICS.map((clinic) => (
                          <option key={clinic} value={clinic}>
                            {clinic}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selected Count */}
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedStudents.size} student{selectedStudents.size !== 1 ? "s" : ""} selected
                      </span>
                      {selectedStudents.size > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStudents(new Set())}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* Student List */}
                    <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                      {filteredStudents.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">No students found</p>
                      ) : (
                        filteredStudents.map((student) => (
                          <label
                            key={student.id}
                            className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                              selectedStudents.has(student.id)
                                ? "border-green-300 bg-green-50"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedStudents.has(student.id)}
                                onChange={() => toggleStudent(student.id)}
                                className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                              />
                              <div>
                                <p className="font-medium text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.email}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {student.clinic}
                            </Badge>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about today's session..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" disabled={submitting || selectedStudents.size === 0} className="w-full" size="lg">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {submitting ? "Recording Attendance..." : `Record Attendance for ${selectedStudents.size} Students`}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

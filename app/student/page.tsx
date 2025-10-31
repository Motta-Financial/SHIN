"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DebriefForm } from "@/components/debrief-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Clock, Calendar } from "lucide-react"

export default function StudentPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [loginEmail, setLoginEmail] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [debriefs, setDebriefs] = useState<any[]>([])

  // Fetch students list for login
  useEffect(() => {
    async function fetchStudents() {
      try {
        const response = await fetch("/api/seed-data?type=students")
        const data = await response.json()
        setStudents(data)
      } catch (error) {
        console.error("[v0] Error fetching students:", error)
      }
    }

    fetchStudents()
  }, [])

  // Fetch student's previous debriefs
  useEffect(() => {
    if (studentInfo) {
      fetchDebriefs()
    }
  }, [studentInfo])

  const fetchDebriefs = async () => {
    try {
      const response = await fetch(`/api/debriefs?student_email=${encodeURIComponent(studentInfo.email)}`)
      const data = await response.json()
      setDebriefs(data)
    } catch (error) {
      console.error("[v0] Error fetching debriefs:", error)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const student = students.find((s) => s.email === loginEmail)
    if (student) {
      setStudentInfo(student)
      setIsLoggedIn(true)
    } else {
      alert("Student not found. Please check your email address.")
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setStudentInfo(null)
    setLoginEmail("")
    setDebriefs([])
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">SEED Student Portal</CardTitle>
            <CardDescription>Log in with your Suffolk email to submit weekly debriefs</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Select Your Name</Label>
                <Select value={loginEmail} onValueChange={setLoginEmail} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your name" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.email}>
                        {student.name} - {student.clinic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Log In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {studentInfo.name}!</h1>
            <p className="text-gray-600">
              {studentInfo.clinic} | {studentInfo.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Log Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debriefs</CardTitle>
              <FileText className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{debriefs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {debriefs.reduce((sum, d) => sum + Number.parseFloat(d.hours_worked || 0), 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Submission</CardTitle>
              <Calendar className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {debriefs.length > 0 ? new Date(debriefs[0].date_submitted).toLocaleDateString() : "None"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debrief Form */}
        <DebriefForm
          studentName={studentInfo.name}
          studentEmail={studentInfo.email}
          studentId={studentInfo.id}
          clinic={studentInfo.clinic}
          onSuccess={fetchDebriefs}
        />

        {/* Previous Debriefs */}
        {debriefs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Previous Debriefs</CardTitle>
              <CardDescription>View your submission history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debriefs.map((debrief) => (
                  <div key={debrief.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{debrief.client_name}</div>
                      <div className="text-sm text-gray-500">{debrief.hours_worked} hours</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Week ending: {new Date(debrief.week_ending).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-700">{debrief.summary_of_work}</div>
                    {debrief.questions && (
                      <div className="text-sm text-gray-600 italic">Questions: {debrief.questions}</div>
                    )}
                    <div className="text-xs text-gray-400">
                      Submitted: {new Date(debrief.date_submitted).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

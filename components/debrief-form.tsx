"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, FileText, MessageSquare, Building2, CheckCircle2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string
  full_name: string
  email: string
  clinic: string
}

interface Client {
  id?: string
  name: string
  clinic?: string
}

export function DebriefForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const [formData, setFormData] = useState({
    student_name: "",
    student_email: "",
    client_name: "",
    clinic: "",
    hours_worked: "",
    work_summary: "",
    questions: "",
    week_ending: "",
  })

  useEffect(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + daysUntilFriday)

    setFormData((prev) => ({
      ...prev,
      week_ending: nextFriday.toISOString().split("T")[0],
    }))
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch students from SEED data
        const seedResponse = await fetch("/api/seed-data")
        const seedData = await seedResponse.json()

        if (seedData.students) {
          setStudents(seedData.students)
          console.log("[v0] Loaded students:", seedData.students.length)
        }

        // Fetch clients from Airtable (existing data)
        const clientsResponse = await fetch("/api/airtable/clients")
        const clientsData = await clientsResponse.json()
        const clientNames = clientsData.records
          .map((record: any) => ({
            name: record.fields["Client Name"],
            clinic: record.fields["Related Clinic"] || record.fields["Primary Clinic Director"],
          }))
          .filter((c: Client) => c.name)
          .sort((a: Client, b: Client) => a.name.localeCompare(b.name))

        setClients(clientNames)
        console.log("[v0] Loaded clients:", clientNames.length)
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        toast({
          title: "Error Loading Data",
          description: "Could not load students and clients. Please refresh the page.",
          variant: "destructive",
        })
      }
    }
    fetchData()
  }, [toast])

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (student) {
      setSelectedStudent(student)
      setFormData((prev) => ({
        ...prev,
        student_name: student.full_name,
        student_email: student.email,
        clinic: student.clinic || "",
      }))
      console.log("[v0] Selected student:", student.full_name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log("[v0] Submitting debrief:", formData)

      const response = await fetch("/api/debriefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit debrief")
      }

      const result = await response.json()
      console.log("[v0] Debrief submitted successfully:", result)

      toast({
        title: "Debrief Submitted!",
        description: "Your weekly debrief has been successfully submitted.",
      })

      // Reset form
      setFormData({
        student_name: "",
        student_email: "",
        client_name: "",
        clinic: "",
        hours_worked: "",
        work_summary: "",
        questions: "",
        week_ending: formData.week_ending,
      })
      setSelectedStudent(null)
    } catch (error) {
      console.error("[v0] Error submitting debrief:", error)
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error ? error.message : "There was an error submitting your debrief. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="text-2xl font-bold">Weekly Debrief Form</CardTitle>
        <CardDescription>Submit your weekly work summary and hours for the SEED program</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="student_select" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Select Your Name *
            </Label>
            <Select value={selectedStudent?.id || ""} onValueChange={handleStudentSelect} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your name from the list" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.full_name} ({student.clinic})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Information (auto-populated) */}
          {selectedStudent && (
            <div className="grid gap-4 md:grid-cols-2 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Email</Label>
                <p className="text-sm font-medium">{selectedStudent.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Clinic</Label>
                <p className="text-sm font-medium">{selectedStudent.clinic}</p>
              </div>
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client_name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Client Name *
            </Label>
            <Select
              value={formData.client_name}
              onValueChange={(value) => setFormData({ ...formData, client_name: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client, idx) => (
                  <SelectItem key={`${client.name}-${idx}`} value={client.name}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hours and Week Ending */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hours_worked" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hours Worked *
              </Label>
              <Input
                id="hours_worked"
                type="number"
                step="0.5"
                min="0"
                max="40"
                value={formData.hours_worked}
                onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
                required
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="week_ending" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Week Ending (Friday) *
              </Label>
              <Input
                id="week_ending"
                type="date"
                value={formData.week_ending}
                onChange={(e) => setFormData({ ...formData, week_ending: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Work Summary */}
          <div className="space-y-2">
            <Label htmlFor="work_summary" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Summary of Work *
            </Label>
            <Textarea
              id="work_summary"
              value={formData.work_summary}
              onChange={(e) => setFormData({ ...formData, work_summary: e.target.value })}
              required
              placeholder="Describe the work you completed this week..."
              rows={5}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Please provide a detailed summary of your work activities, meetings, and accomplishments.
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-2">
            <Label htmlFor="questions" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Questions or Comments (Optional)
            </Label>
            <Textarea
              id="questions"
              value={formData.questions}
              onChange={(e) => setFormData({ ...formData, questions: e.target.value })}
              placeholder="Any questions, concerns, or additional comments..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting || !selectedStudent} className="w-full" size="lg">
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Submit Debrief
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

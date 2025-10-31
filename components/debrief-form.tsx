"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, FileText, MessageSquare, Building2, CheckCircle2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface DebriefFormProps {
  studentName?: string
  studentEmail?: string
  onSuccess?: () => void
}

export function DebriefForm({ studentName = "", studentEmail = "", onSuccess }: DebriefFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    student_name: studentName,
    student_email: studentEmail,
    client_name: "",
    clinic: "",
    hours_worked: "",
    work_summary: "",
    questions: "",
    week_ending: "",
  })

  // Get the most recent Friday for default week ending
  useEffect(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + daysUntilFriday)
    
    setFormData(prev => ({
      ...prev,
      week_ending: nextFriday.toISOString().split('T')[0]
    }))
  }, [])

  // Fetch available clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/airtable/clients")
        const data = await response.json()
        const clientNames = data.records
          .map((record: any) => record.fields["Client Name"])
          .filter(Boolean)
          .sort()
        setClients(clientNames)
      } catch (error) {
        console.error("[v0] Error fetching clients:", error)
      }
    }
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/debriefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit debrief")
      }

      toast({
        title: "Debrief Submitted!",
        description: "Your weekly debrief has been successfully submitted.",
      })

      // Reset form
      setFormData({
        student_name: studentName,
        student_email: studentEmail,
        client_name: "",
        clinic: "",
        hours_worked: "",
        work_summary: "",
        questions: "",
        week_ending: formData.week_ending,
      })

      onSuccess?.()
    } catch (error) {
      console.error("[v0] Error submitting debrief:", error)
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your debrief. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Weekly Debrief Form</CardTitle>
        <CardDescription>
          Submit your weekly work summary and hours for the SEED program
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="student_name">Your Name *</Label>
              <Input
                id="student_name"
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                required
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student_email">Your Email *</Label>
              <Input
                id="student_email"
                type="email"
                value={formData.student_email}
                onChange={(e) => setFormData({ ...formData, student_email: e.target.value })}
                required
                placeholder="your.email@suffolk.edu"
              />
            </div>
          </div>

          {/* Client and Clinic */}
          <div className="grid gap-4 md:grid-cols-2">
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
                  {clients.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic">Clinic *</Label>
              <Select
                value={formData.clinic}
                onValueChange={(value) => setFormData({ ...formData, clinic: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your clinic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accounting">Accounting</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Funding">Funding</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
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

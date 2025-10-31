"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Briefcase, Lock, Plus } from "lucide-react"

const CLINICS = ["Consulting", "Accounting", "Funding", "Marketing"]
const SEMESTERS = ["Fall 2025", "Spring 2026", "Fall 2026", "Spring 2027"]

export default function SubmitClientPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientWebsite: "",
    businessDescription: "",
    industry: "",
    primaryClinic: "",
    secondaryClinics: [] as string[],
    leadConsultant: "",
    semester: "Fall 2025",
    notes: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "SEED2025") {
      setIsAuthenticated(true)
    } else {
      alert("Incorrect password")
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSecondaryClinic = (clinic: string) => {
    setFormData((prev) => ({
      ...prev,
      secondaryClinics: prev.secondaryClinics.includes(clinic)
        ? prev.secondaryClinics.filter((c) => c !== clinic)
        : [...prev.secondaryClinics, clinic],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientName || !formData.primaryClinic) {
      alert("Please fill in all required fields")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/client-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          created_by: "Director",
        }),
      })

      if (response.ok) {
        alert("Client intake submitted successfully!")
        setFormData({
          clientName: "",
          clientEmail: "",
          clientPhone: "",
          clientWebsite: "",
          businessDescription: "",
          industry: "",
          primaryClinic: "",
          secondaryClinics: [],
          leadConsultant: "",
          semester: "Fall 2025",
          notes: "",
        })
      } else {
        alert("Failed to submit client intake. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Error submitting client intake:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Client Intake Form</CardTitle>
            <CardDescription>Enter password to submit a new client</CardDescription>
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
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>New Client Intake</CardTitle>
                <CardDescription>Submit a new client for the SEED program</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Client Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => handleChange("clientName", e.target.value)}
                      placeholder="Business or organization name"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => handleChange("clientEmail", e.target.value)}
                      placeholder="contact@business.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Phone</Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => handleChange("clientPhone", e.target.value)}
                      placeholder="(555) 123-4567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientWebsite">Website</Label>
                    <Input
                      id="clientWebsite"
                      type="url"
                      value={formData.clientWebsite}
                      onChange={(e) => handleChange("clientWebsite", e.target.value)}
                      placeholder="https://business.com"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleChange("industry", e.target.value)}
                    placeholder="e.g., Retail, Technology, Healthcare"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="businessDescription">Business Description</Label>
                  <Textarea
                    id="businessDescription"
                    value={formData.businessDescription}
                    onChange={(e) => handleChange("businessDescription", e.target.value)}
                    placeholder="Brief description of the business and their needs..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
              </div>

              {/* SEED Assignment */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">SEED Assignment</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="primaryClinic">Primary Clinic *</Label>
                    <select
                      id="primaryClinic"
                      value={formData.primaryClinic}
                      onChange={(e) => handleChange("primaryClinic", e.target.value)}
                      required
                      className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">Select primary clinic</option>
                      {CLINICS.map((clinic) => (
                        <option key={clinic} value={clinic}>
                          {clinic}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="semester">Semester *</Label>
                    <select
                      id="semester"
                      value={formData.semester}
                      onChange={(e) => handleChange("semester", e.target.value)}
                      required
                      className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {SEMESTERS.map((semester) => (
                        <option key={semester} value={semester}>
                          {semester}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Secondary Clinics (Optional)</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {CLINICS.filter((c) => c !== formData.primaryClinic).map((clinic) => (
                      <label
                        key={clinic}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                          formData.secondaryClinics.includes(clinic)
                            ? "border-purple-300 bg-purple-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.secondaryClinics.includes(clinic)}
                          onChange={() => toggleSecondaryClinic(clinic)}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-slate-900">{clinic}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="leadConsultant">Lead Consultant</Label>
                  <Input
                    id="leadConsultant"
                    value={formData.leadConsultant}
                    onChange={(e) => handleChange("leadConsultant", e.target.value)}
                    placeholder="Student name (if assigned)"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Any additional information or special requirements..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={submitting} className="w-full" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                {submitting ? "Submitting..." : "Submit Client Intake"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

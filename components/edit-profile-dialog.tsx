"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Linkedin,
  Building2,
  GraduationCap,
  Briefcase,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface ProfileData {
  id: string
  full_name: string
  email: string
  phone?: string
  linkedin_profile?: string
  job_title?: string
  role?: string
  clinic?: string
  education?: string
  business_experience?: string
  academic_level?: string
  contact_name?: string
  website?: string
  project_type?: string
}

interface EditProfileDialogProps {
  userType: "director" | "student" | "client"
  userId?: string
  userEmail?: string
  trigger?: React.ReactNode
}

export function EditProfileDialog({ userType, userId, userEmail, trigger }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [activeTab, setActiveTab] = useState("basic")

  useEffect(() => {
    if (open && (userId || userEmail)) {
      fetchProfile()
    }
  }, [open, userId, userEmail])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("userType", userType)
      if (userId) params.set("userId", userId)
      if (userEmail) params.set("userEmail", userEmail)

      const response = await fetch(`/api/profile?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    setSaveStatus("idle")

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType,
          userId: profile.id,
          updates: profile,
        }),
      })

      if (response.ok) {
        setSaveStatus("success")
        setTimeout(() => {
          setSaveStatus("idle")
          setOpen(false)
        }, 1500)
      } else {
        setSaveStatus("error")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      setSaveStatus("error")
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof ProfileData, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserTypeIcon = () => {
    switch (userType) {
      case "director":
        return <Building2 className="h-4 w-4" />
      case "student":
        return <GraduationCap className="h-4 w-4" />
      case "client":
        return <Briefcase className="h-4 w-4" />
    }
  }

  const getUserTypeLabel = () => {
    switch (userType) {
      case "director":
        return "Clinic Director"
      case "student":
        return "Student Consultant"
      case "client":
        return "Client"
    }
  }

  const getUserTypeColor = () => {
    switch (userType) {
      case "director":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "student":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      case "client":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <User className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>Update your profile information and preferences</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
                  {getInitials(profile.full_name || profile.contact_name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{profile.full_name || profile.contact_name}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge className={`mt-1 ${getUserTypeColor()}`}>
                  {getUserTypeIcon()}
                  <span className="ml-1">{getUserTypeLabel()}</span>
                </Badge>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">
                  {userType === "student" ? "Academic" : userType === "client" ? "Business" : "Professional"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {userType === "client" ? "Contact Name" : "Full Name"}
                    </Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || profile.contact_name || ""}
                      onChange={(e) =>
                        updateField(userType === "client" ? "contact_name" : "full_name", e.target.value)
                      }
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {userType !== "client" && (
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                      <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />
                      LinkedIn Profile
                    </Label>
                    <Input
                      id="linkedin"
                      value={profile.linkedin_profile || ""}
                      onChange={(e) => updateField("linkedin_profile", e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                )}

                {userType === "client" && (
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      value={profile.website || ""}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                )}

                {userType === "director" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={profile.job_title || ""}
                        onChange={(e) => updateField("job_title", e.target.value)}
                        placeholder="e.g., Clinic Director"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={profile.role || ""}
                        onChange={(e) => updateField("role", e.target.value)}
                        placeholder="e.g., Lead Director"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                {userType === "student" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="academic_level">Academic Level</Label>
                        <Input
                          id="academic_level"
                          value={profile.academic_level || ""}
                          onChange={(e) => updateField("academic_level", e.target.value)}
                          placeholder="e.g., Graduate, Undergraduate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="education">Education/Major</Label>
                        <Input
                          id="education"
                          value={profile.education || ""}
                          onChange={(e) => updateField("education", e.target.value)}
                          placeholder="e.g., MBA, Finance"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_experience">Business Experience</Label>
                      <Textarea
                        id="business_experience"
                        value={profile.business_experience || ""}
                        onChange={(e) => updateField("business_experience", e.target.value)}
                        placeholder="Describe your relevant business experience..."
                        rows={4}
                      />
                    </div>
                  </>
                )}

                {userType === "director" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-medium mb-2">Clinic Assignment</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your clinic assignment is managed by the program administrator.
                      </p>
                      {profile.clinic && <Badge variant="secondary">{profile.clinic}</Badge>}
                    </div>
                  </div>
                )}

                {userType === "client" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="project_type">Project Type</Label>
                      <Input
                        id="project_type"
                        value={profile.project_type || ""}
                        onChange={(e) => updateField("project_type", e.target.value)}
                        placeholder="e.g., Marketing Strategy, Financial Analysis"
                      />
                    </div>

                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-medium mb-2">Organization Details</h4>
                      <p className="text-sm text-muted-foreground">
                        Your organization details are managed through the client intake process. Contact your clinic
                        director for any changes.
                      </p>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Save Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {saveStatus === "success" && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Profile saved successfully
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Error saving profile
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>Unable to load profile</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

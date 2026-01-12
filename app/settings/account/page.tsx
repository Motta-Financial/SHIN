"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Settings,
} from "lucide-react"
import { useDemoStudent } from "@/hooks/use-demo-student"
import { useDemoDirector } from "@/hooks/use-demo-director"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { useGlobalSemester } from "@/contexts/semester-context"

interface UserProfile {
  id: string
  full_name: string
  email: string
  phone?: string
  job_title?: string
  bio?: string
  profile_picture_url?: string
  clinic_name?: string
  role: "student" | "director" | "client"
}

export default function AccountManagementPage() {
  const { isDemoMode, setDemoMode, isReady: demoReady } = useDemoMode()
  const { student: demoStudent } = useDemoStudent()
  const { director: demoDirector } = useDemoDirector()
  const {
    semesters,
    selectedSemester,
    selectedSemesterId,
    activeSemester,
    setSelectedSemesterId,
    isLoading: semesterLoading,
    error: semesterError,
  } = useGlobalSemester()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    bio: "",
  })

  // Determine user type and ID based on demo mode
  const userType = demoDirector ? "director" : demoStudent ? "student" : null
  const userId = demoDirector?.id || demoStudent?.id || null

  const isViewingArchived = selectedSemester && activeSemester && selectedSemester.id !== activeSemester.id

  useEffect(() => {
    async function fetchProfile() {
      if (!userId || !userType) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/settings/profile?userId=${userId}&userType=${userType}`)
        if (!response.ok) throw new Error("Failed to fetch profile")

        const data = await response.json()
        setProfile(data.profile)
        setFormData({
          full_name: data.profile.full_name || "",
          phone: data.profile.phone || "",
          bio: data.profile.bio || "",
        })
      } catch (err) {
        console.error("[v0] Error fetching profile:", err)
        setError("Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId, userType])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    if (!userId || !userType) return

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userType,
          ...formData,
        }),
      })

      if (!response.ok) throw new Error("Failed to update profile")

      const data = await response.json()
      setProfile(data.profile)
      setSuccessMessage("Profile updated successfully!")

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("[v0] Error saving profile:", err)
      setError("Failed to save profile changes")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userId || !userType) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", userId)
      formData.append("userType", userType)

      const response = await fetch("/api/settings/profile/upload-photo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload photo")

      const data = await response.json()
      setProfile((prev) => (prev ? { ...prev, profile_picture_url: data.url } : null))
      setSuccessMessage("Profile photo updated!")

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("[v0] Error uploading photo:", err)
      setError("Failed to upload photo")
    } finally {
      setIsUploading(false)
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

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>

      <div className="pl-52 pt-14">
        <main className="p-6 max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Account Management</h1>
            <p className="text-muted-foreground mt-1">Update your profile information and platform settings</p>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">{successMessage}</div>
          )}
          {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>}

          {isLoading ? (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : !profile ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">
                  Please select a user from the demo selector to view account settings.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Profile Photo Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-[#3d4559]" />
                    <CardTitle>Profile Photo</CardTitle>
                  </div>
                  <CardDescription>Upload a profile photo to personalize your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-2 border-border">
                        <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} alt={profile.full_name} />
                        <AvatarFallback className="text-xl bg-[#3d4559] text-white">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                          <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        <Camera className="h-4 w-4 mr-2" />
                        {isUploading ? "Uploading..." : "Change Photo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 5MB.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#3d4559]" />
                    <CardTitle>Personal Information</CardTitle>
                  </div>
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Full Name
                        </span>
                      </Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <span className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email Address
                        </span>
                      </Label>
                      <Input id="email" value={profile.email} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="phone">
                        <span className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          Phone Number
                        </span>
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Tell us a bit about yourself..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Account Details Card (Read-only) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#3d4559]" />
                    <CardTitle>Account Details</CardTitle>
                  </div>
                  <CardDescription>Your account information managed by the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Account Type</p>
                      <p className="font-medium capitalize mt-1">{profile.role}</p>
                    </div>
                    {profile.clinic_name && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Assigned Clinic</p>
                        <p className="font-medium mt-1">{profile.clinic_name}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Save Button for Profile */}
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-[#3d4559] hover:bg-[#2d3545]">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}

          <div className="border-t pt-6 mt-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="h-5 w-5 text-[#3d4559]" />
              <h2 className="text-xl font-semibold text-foreground">Platform Settings</h2>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#3d4559]" />
                <CardTitle>Active Semester View</CardTitle>
              </div>
              <CardDescription>
                Choose which semester's data to view across the platform. Changing this will update all pages to show
                students, clients, and data from the selected semester.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {semesterLoading ? (
                <Skeleton className="h-10 w-full max-w-md" />
              ) : semesterError ? (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Error Loading Semesters</p>
                    <p className="text-sm text-red-700 mt-1">
                      Unable to load semester data from the database. Please refresh the page or contact support.
                    </p>
                  </div>
                </div>
              ) : semesters.length === 0 ? (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">No Semesters Found</p>
                    <p className="text-sm text-amber-700 mt-1">
                      No semesters have been configured in the database. Please add semesters to the semester_config
                      table.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="semester-select">Select Semester</Label>
                    <Select
                      value={selectedSemesterId || ""}
                      onValueChange={(value) => {
                        setSelectedSemesterId(value)
                      }}
                    >
                      <SelectTrigger id="semester-select" className="w-full max-w-md">
                        <SelectValue placeholder="Select a semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((semester) => (
                          <SelectItem key={semester.id} value={semester.id}>
                            <div className="flex items-center gap-2">
                              <span>{semester.semester}</span>
                              {semester.is_active && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 border-green-200"
                                >
                                  Current
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Indicator */}
                  {isViewingArchived ? (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Viewing Archived Data</p>
                        <p className="text-sm text-amber-700 mt-1">
                          You are currently viewing data from <strong>{selectedSemester?.semester}</strong>. This is
                          historical data for reference purposes. The current active semester is{" "}
                          <strong>{activeSemester?.semester}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : selectedSemester ? (
                    <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Viewing Current Semester</p>
                        <p className="text-sm text-green-700 mt-1">
                          You are viewing data from the active semester: <strong>{selectedSemester?.semester}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Semester Info */}
                  {selectedSemester && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-muted-foreground text-xs">Start Date</Label>
                        <p className="font-medium">
                          {selectedSemester.start_date
                            ? new Date(selectedSemester.start_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">End Date</Label>
                        <p className="font-medium">
                          {selectedSemester.end_date
                            ? new Date(selectedSemester.end_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-amber-600" />
                <CardTitle>Demo Mode</CardTitle>
              </div>
              <CardDescription>
                Enable demo mode to test the platform with simulated user selection. When disabled, the platform shows
                live data based on actual user authentication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!demoReady ? (
                <Skeleton className="h-10 w-full max-w-md" />
              ) : (
                <>
                  <div className="flex items-center justify-between max-w-md">
                    <div className="space-y-0.5">
                      <Label htmlFor="demo-mode">Enable Demo Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Shows user selection dropdowns for testing purposes
                      </p>
                    </div>
                    <Switch id="demo-mode" checked={isDemoMode} onCheckedChange={setDemoMode} />
                  </div>

                  {isDemoMode ? (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Demo Mode Active</p>
                        <p className="text-sm text-amber-700 mt-1">
                          You can select different users to view the platform from their perspective. This is useful for
                          testing and demonstrations.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Live Mode Active</p>
                        <p className="text-sm text-green-700 mt-1">
                          The platform is showing live data. User selection is based on actual authentication.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

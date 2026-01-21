"use client"

import type React from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useState, useEffect, useRef } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { getErrorMessage, isAuthError } from "@/lib/error-handler"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Settings,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { useUserRole } from "@/hooks/use-user-role"
import { useGlobalSemester } from "@/contexts/semester-context"
import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  full_name: string
  email: string
  phone?: string
  job_title?: string
  bio?: string
  profile_picture_url?: string
  clinic_name?: string
  role: "student" | "director" | "client" | "admin"
}

export default function AccountManagementPage() {
  const { role, userId, email, fullName, clinicId, clinicName, isLoading: authLoading, isAuthenticated } = useUserRole()
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

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    bio: "",
  })

  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const isViewingArchived = selectedSemester && activeSemester && selectedSemester.id !== activeSemester.id

  useEffect(() => {
    async function fetchProfile() {
      if (authLoading) return

      if (!isAuthenticated || !email) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()

        const { data: directorData, error: directorError } = await supabase
          .from("directors")
          .select("id, full_name, email, clinic_id, phone, bio, profile_picture_url")
          .eq("email", email)
          .limit(1)

        if (directorData && directorData.length > 0) {
          const director = directorData[0]
          let clinicNameValue = clinicName
          if (director.clinic_id && !clinicNameValue) {
            const { data: clinicData } = await supabase
              .from("clinics")
              .select("name")
              .eq("id", director.clinic_id)
              .limit(1)
            clinicNameValue = clinicData?.[0]?.name || null
          }

          setProfile({
            id: director.id,
            full_name: director.full_name || fullName || "",
            email: director.email || email,
            phone: director.phone || "",
            bio: director.bio || "",
            profile_picture_url: director.profile_picture_url || "",
            role: "director",
            clinic_name: clinicNameValue || undefined,
          })
          setFormData({
            full_name: director.full_name || fullName || "",
            phone: director.phone || "",
            bio: director.bio || "",
          })
          setIsLoading(false)
          return
        }

        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, full_name, email, clinic_id, phone, bio, profile_picture_url")
          .eq("email", email)
          .limit(1)

        if (studentData && studentData.length > 0) {
          const student = studentData[0]
          let clinicNameValue = null
          if (student.clinic_id) {
            const { data: clinicData } = await supabase
              .from("clinics")
              .select("name")
              .eq("id", student.clinic_id)
              .limit(1)
            clinicNameValue = clinicData?.[0]?.name || null
          }

          setProfile({
            id: student.id,
            full_name: student.full_name || fullName || "",
            email: student.email || email,
            phone: student.phone || "",
            bio: student.bio || "",
            profile_picture_url: student.profile_picture_url || "",
            role: "student",
            clinic_name: clinicNameValue || undefined,
          })
          setFormData({
            full_name: student.full_name || fullName || "",
            phone: student.phone || "",
            bio: student.bio || "",
          })
          setIsLoading(false)
          return
        }

        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("id, name, email, phone, profile_picture_url")
          .eq("email", email)
          .limit(1)

        if (clientData && clientData.length > 0) {
          const client = clientData[0]
          setProfile({
            id: client.id,
            full_name: client.name || fullName || "",
            email: client.email || email,
            phone: client.phone || "",
            profile_picture_url: client.profile_picture_url || "",
            role: "client",
          })
          setFormData({
            full_name: client.name || fullName || "",
            phone: client.phone || "",
            bio: "",
          })
          setIsLoading(false)
          return
        }

        setProfile({
          id: userId || "",
          full_name: fullName || "",
          email: email,
          role: (role as "student" | "director" | "client" | "admin") || "student",
          clinic_name: clinicName || undefined,
        })
        setFormData({
          full_name: fullName || "",
          phone: "",
          bio: "",
        })
} catch (err) {
  console.error("[v0] Error fetching profile:", err)
  setError(getErrorMessage(err))
  } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [authLoading, isAuthenticated, email, userId, fullName, role, clinicName])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    if (!profile?.id || !profile?.role) {
      setError("Profile not loaded")
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          userType: profile.role,
          ...formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }

      const data = await response.json()
      setProfile(data.profile)
      setSuccessMessage("Profile updated successfully!")

      setTimeout(() => setSuccessMessage(null), 3000)
} catch (err: any) {
  console.error("[v0] Error saving profile:", err)
  setError(getErrorMessage(err))
  } finally {
  setIsSaving(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile?.id || !profile?.role) return

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("userId", profile.id)
      uploadFormData.append("userType", profile.role)

      const response = await fetch("/api/settings/profile/upload-photo", {
        method: "POST",
        body: uploadFormData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload photo")
      }

      const data = await response.json()
      setProfile((prev) => (prev ? { ...prev, profile_picture_url: data.url } : null))
      setSuccessMessage("Profile photo updated!")

      setTimeout(() => setSuccessMessage(null), 3000)
} catch (err: any) {
  console.error("[v0] Error uploading photo:", err)
  setError(getErrorMessage(err))
  } finally {
  setIsUploading(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError(null)
    setPasswordSuccess(null)

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    setIsChangingPassword(true)

    try {
      // Create browser Supabase client for direct auth operations
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log("[v0] Password change - Session check:", {
        hasSession: !!sessionData?.session,
        sessionError: sessionError?.message,
        userEmail: sessionData?.session?.user?.email,
      })

      if (!sessionData?.session) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        console.log("[v0] Password change - Refresh attempt:", {
          hasSession: !!refreshData?.session,
          refreshError: refreshError?.message,
        })

        if (!refreshData?.session) {
          setPasswordError("Your session has expired. Please sign out and sign back in, then try again.")
          return
        }
      }

      // Update password directly using the client-side auth
      console.log("[v0] Password change - Attempting updateUser")
      const { data, error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      console.log("[v0] Password change - Result:", {
        success: !!data?.user,
        error: error?.message,
        errorCode: error?.status,
      })

      if (error) {
        if (error.message.toLowerCase().includes("weak") || error.message.toLowerCase().includes("easy to guess")) {
          setPasswordError(
            "Your password is too weak. Please choose a stronger password with a mix of uppercase, lowercase, numbers, and special characters.",
          )
          return
        }
        if (
          error.message.includes("same") ||
          error.message.includes("should be different") ||
          (error.message.includes("different") && !error.message.includes("choose a different"))
        ) {
          setPasswordError(
            "Please choose a different password. Your new password cannot be the same as your current password.",
          )
          return
        }
        throw new Error(error.message)
      }

      setPasswordSuccess("Password changed successfully! You may need to sign in again with your new password.")
      setPasswordData({ newPassword: "", confirmPassword: "" })
      setShowPasswordSection(false)

      setTimeout(() => setPasswordSuccess(null), 5000)
} catch (err: any) {
  console.error("[v0] Error changing password:", err)
  setPasswordError(getErrorMessage(err))
  } finally {
  setIsChangingPassword(false)
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "director":
        return "bg-blue-100 text-blue-800"
      case "student":
        return "bg-green-100 text-green-800"
      case "client":
        return "bg-purple-100 text-purple-800"
      case "admin":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
          <MainNavigation />
        </aside>
        <main className="pl-52 pt-14">
          <div className="p-6 md:p-8 lg:p-10">
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-52 border-r bg-card z-40">
        <MainNavigation />
      </aside>
      <main className="pl-52 pt-14">
        <div className="p-6 md:p-8 lg:p-10 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Account Management</h1>
              <p className="text-muted-foreground">Update your profile information and platform settings</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {successMessage}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {passwordSuccess}
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Profile Photo</CardTitle>
                </div>
                <CardDescription>Upload a profile photo to personalize your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    {profile?.profile_picture_url && (
                      <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} />
                    )}
                    <AvatarFallback className="text-lg">{getInitials(profile?.full_name || "U")}</AvatarFallback>
                  </Avatar>
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

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Personal Information</CardTitle>
                </div>
                <CardDescription>Update your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input id="email" value={profile?.email || ""} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                {profile?.role !== "client" && (
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Tell us a bit about yourself..."
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Account Details</CardTitle>
                </div>
                <CardDescription>Your account information managed by the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">ACCOUNT TYPE</p>
                  <p className="font-medium capitalize">{profile?.role || "Unknown"}</p>
                </div>
                {profile?.clinic_name && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">CLINIC</p>
                    <p className="font-medium">{profile.clinic_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Security</CardTitle>
                </div>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showPasswordSection ? (
                  <Button variant="outline" onClick={() => setShowPasswordSection(true)}>
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Change Password</h4>

                    {passwordError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {passwordError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                        {isChangingPassword ? "Changing..." : "Update Password"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPasswordSection(false)
                          setPasswordData({ newPassword: "", confirmPassword: "" })
                          setPasswordError(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <hr className="my-6" />

            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Platform Settings</h2>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Active Semester View</CardTitle>
                </div>
                <CardDescription>
                  Choose which semester's data to view across the platform. Changing this will update all pages to show
                  students, clients, and data from the selected semester.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {semesterLoading ? (
                  <Skeleton className="h-10 w-full max-w-xs" />
                ) : semesterError ? (
                  <p className="text-red-500 text-sm">{semesterError}</p>
                ) : (
                  <div className="space-y-4">
                    <Select value={selectedSemesterId || ""} onValueChange={(value) => setSelectedSemesterId(value)}>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Select a semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((sem) => (
                          <SelectItem key={sem.id} value={sem.id}>
                            {sem.semester} {sem.is_active && "(Active)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isViewingArchived && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          You are viewing archived data from <strong>{selectedSemester?.semester}</strong>. Some
                          features may be limited.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

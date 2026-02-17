"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserRole } from "@/hooks/use-user-role"
import { useViewAs } from "@/contexts/view-as-context"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  Eye,
  Shield,
  Loader2,
} from "lucide-react"

interface UserEntry {
  id: string
  authUserId: string
  email: string
  name: string
  role: "director" | "student" | "client"
  subRole?: string
  clinic?: string
  clinicId?: string
  clientId?: string
}

interface UsersData {
  directors: UserEntry[]
  students: UserEntry[]
  clients: UserEntry[]
  counts: { directors: number; students: number; clients: number; total: number }
}

export default function AdminDashboard() {
  const router = useRouter()
  const { role, isLoading: roleLoading, isAuthenticated } = useUserRole()
  const { startViewAs, stopViewAs } = useViewAs()
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<"all" | "director" | "student" | "client">("all")

  // SWR fetcher with proper error handling
  const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Failed to fetch users: ${res.status} ${text}`)
    }
    return res.json()
  }

  // Use SWR so data persists across navigations (cached in memory)
  const { data: usersData, isLoading: loading } = useSWR<UsersData>(
    role === "admin" ? "/api/admin/users" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  // Redirect non-admin users
  if (!roleLoading && isAuthenticated && role !== "admin") {
    router.push("/")
  }
  if (!roleLoading && !isAuthenticated) {
    router.push("/sign-in")
  }

  // Clear view-as state when returning to admin
  useEffect(() => {
    stopViewAs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Combined + filtered user list
  const allUsers = useMemo(() => {
    if (!usersData) return []
    const combined: UserEntry[] = [
      ...usersData.directors,
      ...usersData.students,
      ...usersData.clients,
    ]
    return combined.filter((u) => {
      const matchesSearch =
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      const matchesRole = filterRole === "all" || u.role === filterRole
      return matchesSearch && matchesRole
    })
  }, [usersData, search, filterRole])

  const handleViewAs = (user: UserEntry) => {
    // Store impersonation target via context (also persists to sessionStorage)
    startViewAs({
      userId: user.id,
      authUserId: user.authUserId,
      email: user.email,
      name: user.name,
      role: user.role,
      clinicId: user.clinicId || null,
      clientId: user.clientId || null,
    })

    // Navigate to the appropriate portal
    if (user.role === "director") {
      router.push("/director")
    } else if (user.role === "student") {
      router.push("/students")
    } else if (user.role === "client") {
      router.push("/client-portal")
    }
  }

  const getRoleBadge = (role: string, subRole?: string) => {
    switch (role) {
      case "director":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Building2 className="h-3 w-3 mr-1" />
            {subRole || "Director"}
          </Badge>
        )
      case "student":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <GraduationCap className="h-3 w-3 mr-1" />
            Student
          </Badge>
        )
      case "client":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Briefcase className="h-3 w-3 mr-1" />
            Client
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  if (roleLoading || (isAuthenticated && role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-14">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-14">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#1A2332] text-white">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A2332]">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">
              View and impersonate any user to troubleshoot issues
            </p>
          </div>
        </div>

        {/* Stats */}
        {usersData && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Users className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A2332]">{usersData.counts.total}</p>
                  <p className="text-xs text-slate-500">Total Users</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A2332]">{usersData.counts.directors}</p>
                  <p className="text-xs text-slate-500">Directors</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A2332]">{usersData.counts.students}</p>
                  <p className="text-xs text-slate-500">Students</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Briefcase className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A2332]">{usersData.counts.clients}</p>
                  <p className="text-xs text-slate-500">Clients</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search + Filter */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">View As User</CardTitle>
            <CardDescription>
              Search for any user and click "View As" to see the app from their perspective
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {(["all", "director", "student", "client"] as const).map((r) => (
                  <Button
                    key={r}
                    variant={filterRole === r ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterRole(r)}
                    className={filterRole === r ? "bg-[#1A2332] text-white hover:bg-[#152347]" : ""}
                  >
                    {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1) + "s"}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-slate-500">Loading users...</span>
              </div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No users found matching your search</p>
              </div>
            ) : (
              <div className="divide-y">
                {allUsers.slice(0, 50).map((user) => (
                  <div
                    key={`${user.role}-${user.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[#1A2332] truncate">
                          {user.name || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {user.clinic && (
                        <span className="text-xs text-slate-400 hidden md:inline">{user.clinic}</span>
                      )}
                      {getRoleBadge(user.role, user.subRole)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewAs(user)}
                        className="gap-1.5 text-[#1A2332] border-[#1A2332]/20 hover:bg-[#1A2332] hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View As
                      </Button>
                    </div>
                  </div>
                ))}
                {allUsers.length > 50 && (
                  <div className="px-4 py-3 text-center text-sm text-slate-500">
                    Showing 50 of {allUsers.length} results. Refine your search to see more.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

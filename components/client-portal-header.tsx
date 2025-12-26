"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building2, Users, Clock, FileText, TrendingUp } from "lucide-react"

interface ClientPortalHeaderProps {
  client?: {
    name: string
    contactName?: string
    projectType?: string
    status?: string
    semester?: string
  } | null
  stats?: {
    teamSize: number
    totalHours: number
    deliverables: number
    completionRate: number
  }
  loading?: boolean
}

export function ClientPortalHeader({ client, stats, loading }: ClientPortalHeaderProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  // If no client data, just show the page header area
  if (!client) {
    return null
  }

  const initials = client.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 py-4 px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Client Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800">{client.name}</h2>
              {client.status && (
                <Badge variant={client.status === "Active" ? "default" : "secondary"} className="text-xs">
                  {client.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Building2 className="h-3.5 w-3.5" />
              <span>{client.projectType || "Business Consulting"}</span>
              {client.semester && (
                <>
                  <span className="text-slate-300">|</span>
                  <span>{client.semester}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{stats.teamSize} team members</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">{stats.totalHours} hrs invested</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
              <FileText className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">{stats.deliverables} deliverables</span>
            </div>
            {stats.completionRate > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">{stats.completionRate}% complete</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

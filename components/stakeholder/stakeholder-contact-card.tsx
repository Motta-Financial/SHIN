"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Mail, Linkedin, Crown } from "lucide-react"
import { StakeholderModal, type DirectorData, type StudentData, type ClientData } from "./stakeholder-modal"

interface BaseProps {
  className?: string
  compact?: boolean
}

interface DirectorCardByIdProps extends BaseProps {
  type: "director"
  id: string
  name: string
  subtitle?: string
  variant?: "compact" | "full"
}

interface StudentCardByIdProps extends BaseProps {
  type: "student"
  id: string
  name: string
  subtitle?: string
  variant?: "compact" | "full"
}

interface ClientCardByIdProps extends BaseProps {
  type: "client"
  id: string
  name: string
  subtitle?: string
  variant?: "compact" | "full"
}

interface DirectorCardProps extends BaseProps {
  type: "director"
  data: DirectorData
}

interface StudentCardProps extends BaseProps {
  type: "student"
  data: StudentData
}

interface ClientCardProps extends BaseProps {
  type: "client"
  data: ClientData
}

type StakeholderContactCardProps =
  | DirectorCardProps
  | StudentCardProps
  | ClientCardProps
  | DirectorCardByIdProps
  | StudentCardByIdProps
  | ClientCardByIdProps

function isIdBasedProps(
  props: StakeholderContactCardProps,
): props is DirectorCardByIdProps | StudentCardByIdProps | ClientCardByIdProps {
  return "id" in props && "name" in props && !("data" in props)
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export function StakeholderContactCard(props: StakeholderContactCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [fetchedData, setFetchedData] = useState<DirectorData | StudentData | ClientData | null>(null)
  const [loading, setLoading] = useState(false)

  const { type, className = "" } = props

  const isIdBased = isIdBasedProps(props)
  const compact = isIdBased ? props.variant === "compact" : props.compact

  // Get ID safely for ID-based props
  const stakeholderId = isIdBased ? props.id : null

  const fetchStakeholderData = useCallback(async () => {
    if (!stakeholderId || !isValidUUID(stakeholderId)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/stakeholders/${type}/${stakeholderId}`)
      if (response.ok) {
        const result = await response.json()
        setFetchedData(result.data)
      }
    } catch (error) {
      console.error("Error fetching stakeholder data:", error)
    } finally {
      setLoading(false)
    }
  }, [stakeholderId, type])

  useEffect(() => {
    if (modalOpen && stakeholderId && !fetchedData && !loading) {
      fetchStakeholderData()
    }
  }, [modalOpen, stakeholderId, fetchedData, loading, fetchStakeholderData])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getClinicColor = (clinic: string) => {
    const colors: Record<string, string> = {
      "Consulting Clinic": "bg-blue-100 text-blue-700 border-blue-300",
      Consulting: "bg-blue-100 text-blue-700 border-blue-300",
      "Marketing Clinic": "bg-purple-100 text-purple-700 border-purple-300",
      Marketing: "bg-purple-100 text-purple-700 border-purple-300",
      "Accounting Clinic": "bg-green-100 text-green-700 border-green-300",
      Accounting: "bg-green-100 text-green-700 border-green-300",
      "Resource Acquisition Clinic": "bg-amber-100 text-amber-700 border-amber-300",
      "Resource Acquisition": "bg-amber-100 text-amber-700 border-amber-300",
    }
    return colors[clinic] || "bg-slate-100 text-slate-700 border-slate-300"
  }

  const getBgColor = () => {
    switch (type) {
      case "director":
        return "bg-slate-700"
      case "student":
        return "bg-blue-600"
      case "client":
        return "bg-purple-600"
    }
  }

  const data = isIdBased ? fetchedData : (props as DirectorCardProps | StudentCardProps | ClientCardProps).data

  const getName = () => {
    if (isIdBased) return props.name
    switch (type) {
      case "director":
        return (data as DirectorData)?.full_name || ""
      case "student":
        return (data as StudentData)?.full_name || ""
      case "client":
        return (data as ClientData)?.name || ""
    }
  }

  const getEmail = () => {
    if (!data) return null
    switch (type) {
      case "director":
        return (data as DirectorData).email
      case "student":
        return (data as StudentData).email
      case "client":
        return (data as ClientData).email
    }
  }

  const getClinic = () => {
    if (!data) return null
    switch (type) {
      case "director":
        return (data as DirectorData).clinic
      case "student":
        return (data as StudentData).clinic
      case "client":
        return null
    }
  }

  const getSubtitle = () => {
    if (isIdBased && props.subtitle) return props.subtitle
    if (!data) return type.charAt(0).toUpperCase() + type.slice(1)
    switch (type) {
      case "director":
        return (data as DirectorData).job_title || "Director"
      case "student":
        return (data as StudentData).academic_level || "Student"
      case "client":
        return (data as ClientData).contact_name || (data as ClientData).project_type || "Client"
    }
  }

  const getLinkedIn = () => {
    if (!data) return null
    if (type === "student") {
      return (data as StudentData).linkedin_profile
    }
    return null
  }

  const isTeamLeader = () => {
    if (!data) return false
    if (type === "student") {
      return (data as StudentData).is_team_leader
    }
    return false
  }

  const isPrimary = () => {
    if (!data) return false
    if (type === "director" && "isPrimary" in data) {
      return (data as DirectorData & { isPrimary?: boolean }).isPrimary
    }
    return false
  }

  const name = getName()
  const email = getEmail()
  const clinic = getClinic()
  const subtitle = getSubtitle()
  const linkedIn = getLinkedIn()

  const handleClick = () => {
    // Don't open modal for invalid UUIDs
    if (stakeholderId && !isValidUUID(stakeholderId)) {
      return
    }
    setModalOpen(true)
  }

  if (compact) {
    return (
      <>
        <button
          onClick={handleClick}
          className={`flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors text-left ${className}`}
        >
          <Avatar className={`h-8 w-8 ${getBgColor()}`}>
            <AvatarFallback className={`${getBgColor()} text-white text-xs`}>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
            {(clinic || subtitle) && <p className="text-xs text-slate-500 truncate">{clinic || subtitle}</p>}
          </div>
          {isTeamLeader() && <span className="text-amber-500 text-xs">★</span>}
        </button>
        <StakeholderModal open={modalOpen} onOpenChange={setModalOpen} type={type} data={data} loading={loading} />
      </>
    )
  }

  return (
    <>
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors ${className}`}
      >
        <button onClick={handleClick} className="flex-shrink-0">
          <Avatar
            className={`h-10 w-10 ${getBgColor()} cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 transition-all`}
          >
            <AvatarFallback className={`${getBgColor()} text-white text-sm`}>{getInitials(name)}</AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleClick}
              className="text-sm font-medium text-slate-900 hover:text-blue-600 hover:underline truncate"
            >
              {name}
            </button>
            {isTeamLeader() && (
              <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0">
                <Crown className="h-3 w-3 mr-0.5" />
                Lead
              </Badge>
            )}
            {isPrimary() && (
              <Badge className="bg-amber-100 text-amber-700 text-xs px-1.5">
                <Crown className="h-3 w-3 mr-0.5" />
                Primary
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-600 truncate">{subtitle}</p>
          {clinic && (
            <Badge variant="outline" className={`text-xs mt-1 ${getClinicColor(clinic)}`}>
              {clinic}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {linkedIn && (
            <a
              href={linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-full hover:bg-slate-200 transition-colors"
              title="LinkedIn Profile"
              onClick={(e) => e.stopPropagation()}
            >
              <Linkedin className="h-4 w-4 text-blue-600" />
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="p-1.5 rounded-full hover:bg-slate-200 transition-colors"
              title={`Email ${name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-4 w-4 text-slate-500" />
            </a>
          )}
        </div>
      </div>
      <StakeholderModal open={modalOpen} onOpenChange={setModalOpen} type={type} data={data} loading={loading} />
    </>
  )
}

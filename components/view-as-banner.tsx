"use client"

import { useViewAs } from "@/contexts/view-as-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Eye, X, Shield } from "lucide-react"

export function ViewAsBanner() {
  const { viewAsUser, isViewingAs, stopViewAs } = useViewAs()
  const router = useRouter()

  if (!isViewingAs || !viewAsUser) return null

  const handleExit = () => {
    stopViewAs()
    router.push("/admin")
  }

  const roleLabel =
    viewAsUser.role === "director"
      ? "Director"
      : viewAsUser.role === "student"
        ? "Student"
        : "Client"

  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-[#1A2332] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/10">
            <Eye className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">VIEW AS</span>
          </div>
          <span className="text-sm">
            <span className="font-medium">{viewAsUser.name}</span>
            <span className="text-white/70 ml-1.5">({roleLabel})</span>
            <span className="text-white/50 ml-1.5 hidden sm:inline">{viewAsUser.email}</span>
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExit}
          className="text-white hover:bg-white/20 gap-1.5"
        >
          <Shield className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back to Admin</span>
          <X className="h-3.5 w-3.5 sm:hidden" />
        </Button>
      </div>
    </div>
  )
}

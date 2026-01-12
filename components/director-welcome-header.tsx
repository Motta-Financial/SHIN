"use client"

import { Button } from "@/components/ui/button"
import { Download, ChevronDown, RefreshCw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DirectorWelcomeHeaderProps {
  directorName?: string
  clinicName?: string
  periodLabel: string
  onRefresh: () => void
  isLoading: boolean
}

export function DirectorWelcomeHeader({
  directorName,
  clinicName,
  periodLabel,
  onRefresh,
  isLoading,
}: DirectorWelcomeHeaderProps) {
  const firstName = directorName?.split(" ")[0] || "Director"
  const initial = directorName?.charAt(0) || "D"

  return (
    <div className="bg-[#3d4559] rounded-xl p-5 text-white shadow-lg mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {firstName}!</h1>
            <p className="text-[#9aacba] text-sm mt-0.5">
              {clinicName ? `${clinicName} Clinic Director` : "SEED Program Director Dashboard"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-right">
            <p className="text-[#9aacba] text-xs">Current Period</p>
            <p className="text-lg font-semibold">{periodLabel}</p>
          </div>
          <div className="h-10 w-px bg-white/30" />
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0">
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => alert("Export as PDF coming soon!")}>Export as PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert("Export as CSV coming soon!")}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert("Export as Excel coming soon!")}>
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="secondary"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

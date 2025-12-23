"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Briefcase, FileText, CheckCircle } from "lucide-react"

interface StudentStats {
  totalHours: number
  clientCount: number
  submissionCount: number
  attendanceCount: number
  pendingQuestionsCount: number
}

interface StudentStatsCardsProps {
  stats: StudentStats
  onCardClick?: (card: string) => void
}

export function StudentStatsCards({ stats, onCardClick }: StudentStatsCardsProps) {
  const cards = [
    {
      key: "hours",
      title: "Total Hours",
      value: stats.totalHours.toFixed(1),
      description: "Hours worked this semester",
      icon: Clock,
      color: "text-blue-500",
    },
    {
      key: "clients",
      title: "Clients Served",
      value: stats.clientCount,
      description: "Unique clients this semester",
      icon: Briefcase,
      color: "text-green-500",
    },
    {
      key: "submissions",
      title: "Work Submissions",
      value: stats.submissionCount,
      description: "Total debriefs submitted",
      icon: FileText,
      color: "text-purple-500",
    },
    {
      key: "attendance",
      title: "Attendance",
      value: stats.attendanceCount,
      description: "Sessions attended",
      icon: CheckCircle,
      color: "text-emerald-500",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.key}
          className="bg-card border-border hover:border-muted-foreground/20 cursor-pointer transition-all"
          onClick={() => onCardClick?.(card.key)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

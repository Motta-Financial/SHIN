"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Clock, CheckCircle, ChevronDown, ChevronUp, MessageSquare } from "lucide-react"

interface Debrief {
  id: string
  client_name: string
  clinic: string
  hours_worked: number
  work_summary: string
  questions?: string
  week_ending: string
  week_number: number
  status: string
  date_submitted?: string
  reviewed_at?: string
  reviewed_by?: string
}

interface StudentDebriefsListProps {
  debriefs: Debrief[]
  showAll?: boolean
}

export function StudentDebriefsList({ debriefs, showAll = false }: StudentDebriefsListProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAllDebriefs, setShowAllDebriefs] = useState(showAll)

  const displayDebriefs = showAllDebriefs ? debriefs : debriefs.slice(0, 5)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reviewed":
        return <Badge className="bg-green-500">Reviewed</Badge>
      case "submitted":
        return <Badge className="bg-blue-500">Submitted</Badge>
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Weekly Debriefs
            </CardTitle>
            <CardDescription>Your submitted work summaries</CardDescription>
          </div>
          <Badge variant="outline">{debriefs.length} total</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {debriefs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No debriefs submitted yet</p>
          </div>
        ) : (
          <ScrollArea className={showAllDebriefs ? "h-[500px]" : ""}>
            <div className="space-y-3">
              {displayDebriefs.map((debrief) => (
                <div key={debrief.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">{debrief.client_name}</span>
                        {getStatusBadge(debrief.status)}
                        {debrief.questions && (
                          <Badge variant="outline" className="gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Has Question
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {debrief.hours_worked}h
                        </span>
                        <span>Week {debrief.week_number}</span>
                        <span>{formatDate(debrief.week_ending)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(expanded === debrief.id ? null : debrief.id)}
                    >
                      {expanded === debrief.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {expanded === debrief.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Work Summary</p>
                        <p className="text-sm">{debrief.work_summary}</p>
                      </div>
                      {debrief.questions && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                          <p className="text-xs font-medium text-amber-600 mb-1">Question Submitted</p>
                          <p className="text-sm">{debrief.questions}</p>
                        </div>
                      )}
                      {debrief.reviewed_by && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Reviewed by {debrief.reviewed_by}
                          {debrief.reviewed_at && ` on ${formatDate(debrief.reviewed_at)}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {debriefs.length > 5 && !showAll && (
          <Button
            variant="outline"
            className="w-full mt-4 bg-transparent"
            onClick={() => setShowAllDebriefs(!showAllDebriefs)}
          >
            {showAllDebriefs ? "Show Less" : `View All ${debriefs.length} Debriefs`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

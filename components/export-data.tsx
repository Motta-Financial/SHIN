"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileSpreadsheet } from "lucide-react"

interface ExportDataProps {
  selectedWeek: string
  selectedClinic: string
}

export function ExportData({ selectedWeek, selectedClinic }: ExportDataProps) {
  const exportToCSV = async () => {
    try {
      // Fetch data
      const response = await fetch("/api/airtable")
      const data = await response.json()

      if (!data.records) return

      // Filter data by week and clinic
      const filteredRecords = data.records.filter((record: any) => {
        const fields = record.fields
        const dateSubmitted = fields["Date Submitted"]
        const clinic = fields["Related Clinic"]

        if (!dateSubmitted) return false

        const submittedDate = new Date(dateSubmitted)
        const weekEnd = new Date(selectedWeek)
        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekStart.getDate() - 6)

        const isInWeek = submittedDate >= weekStart && submittedDate <= weekEnd
        const matchesClinic = selectedClinic === "all" || clinic === selectedClinic

        return isInWeek && matchesClinic
      })

      // Convert to CSV
      const headers = ["Student", "Clinic", "Client", "Hours", "Summary", "Date", "Questions"]
      const csvRows = [headers.join(",")]

      filteredRecords.forEach((record: any) => {
        const fields = record.fields
        const row = [
          fields["NAME (from SEED | Students)"]?.[0] || "",
          fields["Related Clinic"] || "",
          fields["Client"] || "",
          fields["Number of Hours Worked"] || 0,
          `"${(fields["Summary of Work"] || "").replace(/"/g, '""')}"`,
          fields["Date Submitted"] || "",
          `"${(fields["Questions"] || "").replace(/"/g, '""')}"`,
        ]
        csvRows.push(row.join(","))
      })

      // Download CSV
      const csvContent = csvRows.join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `debrief-data-${selectedWeek}-${selectedClinic}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Error exporting data:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export & Reporting
        </CardTitle>
        <CardDescription>Download data for external analysis and reporting</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div>
              <h4 className="font-semibold mb-1">Export Debrief Data</h4>
              <p className="text-sm text-muted-foreground">
                Download all debrief submissions for the selected week and clinic as CSV
              </p>
            </div>
            <Button onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="p-4 rounded-lg border bg-muted/50">
            <h4 className="font-semibold mb-2 text-sm">Export Details</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Week: {new Date(selectedWeek).toLocaleDateString()}</p>
              <p>• Clinic: {selectedClinic === "all" ? "All Clinics" : selectedClinic}</p>
              <p>• Format: CSV (Excel compatible)</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

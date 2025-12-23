"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Database, FileText, Users, Calendar } from "lucide-react"

interface ImportResult {
  success: boolean
  results: {
    totalRecords: number
    inserted: number
    duplicates: number
    errors: string[]
    finalCount: number
  }
  message: string
}

interface AuditResult {
  success: boolean
  totalRecords: number
  records: any[]
  audit: {
    uniqueClinics: string[]
    uniqueClients: string[]
    uniqueWeeks: string[]
    clinicCount: number
    clientCount: number
    weekCount: number
  }
}

export default function ImportDebriefsPage() {
  const [importing, setImporting] = useState(false)
  const [auditing, setAuditing] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runImport = async () => {
    setImporting(true)
    setError(null)
    setImportResult(null)

    try {
      const response = await fetch("/api/import-debriefs", { method: "POST" })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Import failed")
      }

      setImportResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setImporting(false)
    }
  }

  const runAudit = async () => {
    setAuditing(true)
    setError(null)
    setAuditResult(null)

    try {
      const response = await fetch("/api/import-debriefs")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Audit failed")
      }

      setAuditResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setAuditing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Import Client Debriefs</h1>
          <p className="text-slate-600 mt-2">Manage and audit the weekly_summaries table in Supabase</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Run Import
              </CardTitle>
              <CardDescription>Import all debrief records into weekly_summaries table</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runImport} disabled={importing} className="w-full">
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Start Import"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Data
              </CardTitle>
              <CardDescription>View current data in weekly_summaries table</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runAudit} disabled={auditing} variant="outline" className="w-full bg-transparent">
                {auditing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Auditing...
                  </>
                ) : (
                  "Run Audit"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Error:</span> {error}
              </div>
            </CardContent>
          </Card>
        )}

        {importResult && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-700">{importResult.message}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{importResult.results.totalRecords}</div>
                  <div className="text-sm text-slate-600">Total Records</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.results.inserted}</div>
                  <div className="text-sm text-slate-600">Inserted</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.results.duplicates}</div>
                  <div className="text-sm text-slate-600">Duplicates</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{importResult.results.finalCount}</div>
                  <div className="text-sm text-slate-600">Final Count</div>
                </div>
              </div>

              {importResult.results.errors.length > 0 && (
                <div className="bg-red-100 rounded-lg p-4">
                  <h4 className="font-medium text-red-700 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {importResult.results.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {auditResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Results
              </CardTitle>
              <CardDescription>Current state of weekly_summaries table</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{auditResult.totalRecords}</div>
                  <div className="text-sm text-slate-600">Total Records</div>
                </div>
                <div className="bg-slate-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{auditResult.audit.clinicCount}</div>
                  <div className="text-sm text-slate-600">Unique Clinics</div>
                </div>
                <div className="bg-slate-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{auditResult.audit.clientCount}</div>
                  <div className="text-sm text-slate-600">Unique Clients</div>
                </div>
                <div className="bg-slate-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{auditResult.audit.weekCount}</div>
                  <div className="text-sm text-slate-600">Unique Weeks</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Clinics
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {auditResult.audit.uniqueClinics.map((clinic) => (
                      <Badge key={clinic} variant="secondary">
                        {clinic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Clients
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {auditResult.audit.uniqueClients.map((client) => (
                      <Badge key={client} variant="outline">
                        {client}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Week Endings
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {auditResult.audit.uniqueWeeks.map((week) => (
                      <Badge key={week} variant="outline">
                        {week}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {auditResult.records && auditResult.records.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Sample Records (First 5)</h4>
                  <div className="bg-slate-100 rounded-lg p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-slate-300">
                          <th className="pb-2">Week Ending</th>
                          <th className="pb-2">Clinic</th>
                          <th className="pb-2">Client</th>
                          <th className="pb-2">Hours</th>
                          <th className="pb-2">Students</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditResult.records.slice(0, 5).map((record, i) => (
                          <tr key={i} className="border-b border-slate-200">
                            <td className="py-2">{record.week_ending}</td>
                            <td className="py-2">{record.clinic}</td>
                            <td className="py-2">{record.client_name}</td>
                            <td className="py-2">{record.total_hours}</td>
                            <td className="py-2">{record.student_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

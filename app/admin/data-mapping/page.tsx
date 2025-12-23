"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertCircle, Loader2, Upload, RefreshCw } from "lucide-react"

interface AuditResult {
  success: boolean
  audit: {
    directors: { inserted: number; skipped: number; errors: number; details: string[] }
    students: { inserted: number; skipped: number; errors: number; details: string[] }
    clients: { inserted: number; skipped: number; errors: number; details: string[] }
    clientAssignments: { inserted: number; skipped: number; errors: number; details: string[] }
    clientDirectors: { inserted: number; skipped: number; errors: number; details: string[] }
  }
  tableCounts: {
    directors: number
    students: number
    clients: number
    clientAssignments: number
    clientDirectors: number
  }
  clinicDirectors: Array<{ full_name: string; clinic: string; role: string }>
  studentsByClinic: Record<string, number>
}

interface ValidationResult {
  directors: Array<{ id: string; full_name: string; clinic: string; role: string; email: string }>
  students: Array<{ id: string; full_name: string; clinic: string; client_team: string; is_team_leader: boolean }>
  clients: Array<{ id: string; name: string; primary_director: { full_name: string; clinic: string } | null }>
  assignments: Array<{
    id: string
    clinic: string
    role: string
    student: { full_name: string; clinic: string }
    client: { name: string }
  }>
  mappingIssues: string[]
  summary: {
    directorCount: number
    studentCount: number
    clientCount: number
    assignmentCount: number
  }
}

export default function DataMappingPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [importResult, setImportResult] = useState<AuditResult | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runImport = async () => {
    setIsImporting(true)
    setError(null)
    try {
      const res = await fetch("/api/import-seed-data", { method: "POST" })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setImportResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }

  const runValidation = async () => {
    setIsValidating(true)
    setError(null)
    try {
      const res = await fetch("/api/import-seed-data")
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setValidationResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed")
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SEED Data Mapping</h1>
          <p className="text-slate-600 mt-1">Import and validate Directors, Students, and Clients data</p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data
              </CardTitle>
              <CardDescription>Import Directors, Students, and Clients from CSV data into Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runImport} disabled={isImporting} className="w-full">
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Run Import"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Validate Mappings
              </CardTitle>
              <CardDescription>Check that all data mappings are correct and complete</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runValidation}
                disabled={isValidating}
                variant="outline"
                className="w-full bg-transparent"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Validate Data"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(importResult.tableCounts).map(([table, count]) => (
                  <div key={table} className="bg-slate-100 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-slate-900">{count}</div>
                    <div className="text-sm text-slate-600 capitalize">{table.replace(/([A-Z])/g, " $1").trim()}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Import Summary</h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(importResult.audit).map(([table, stats]) => (
                    <div key={table} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                      <span className="font-medium capitalize">{table.replace(/([A-Z])/g, " $1").trim()}</span>
                      <div className="flex gap-4">
                        <Badge variant="default" className="bg-green-100 text-green-700">
                          {stats.inserted} inserted
                        </Badge>
                        <Badge variant="secondary">{stats.skipped} skipped</Badge>
                        {stats.errors > 0 && <Badge variant="destructive">{stats.errors} errors</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Clinic Directors</h3>
                <div className="grid grid-cols-2 gap-2">
                  {importResult.clinicDirectors?.map((dir, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                      <span className="font-medium">{dir.clinic}</span>
                      <span className="text-slate-600">{dir.full_name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Students by Clinic</h3>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(importResult.studentsByClinic).map(([clinic, count]) => (
                    <div key={clinic} className="bg-slate-50 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold">{count}</div>
                      <div className="text-sm text-slate-600">{clinic}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {validationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {validationResult.mappingIssues.length === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                Validation Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900">{validationResult.summary.directorCount}</div>
                  <div className="text-sm text-slate-600">Directors</div>
                </div>
                <div className="bg-slate-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900">{validationResult.summary.studentCount}</div>
                  <div className="text-sm text-slate-600">Students</div>
                </div>
                <div className="bg-slate-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900">{validationResult.summary.clientCount}</div>
                  <div className="text-sm text-slate-600">Clients</div>
                </div>
                <div className="bg-slate-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-900">{validationResult.summary.assignmentCount}</div>
                  <div className="text-sm text-slate-600">Assignments</div>
                </div>
              </div>

              {validationResult.mappingIssues.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-700">Mapping Issues Found</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <ul className="list-disc list-inside space-y-1">
                      {validationResult.mappingIssues.map((issue, i) => (
                        <li key={i} className="text-yellow-800">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">All mappings are correct!</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Client-Director Mappings</h3>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {validationResult.clients?.map((client) => (
                    <div key={client.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-slate-600">
                        {client.primary_director?.full_name || "No director assigned"}
                        {client.primary_director?.clinic && ` (${client.primary_director.clinic})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Student Assignments by Client</h3>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="text-left p-2">Client</th>
                        <th className="text-left p-2">Student</th>
                        <th className="text-left p-2">Clinic</th>
                        <th className="text-left p-2">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.assignments?.map((a) => (
                        <tr key={a.id} className="border-b">
                          <td className="p-2">{a.client?.name}</td>
                          <td className="p-2">{a.student?.full_name}</td>
                          <td className="p-2">{a.clinic}</td>
                          <td className="p-2">
                            {a.role === "Team Leader" ? (
                              <Badge className="bg-blue-100 text-blue-700">{a.role}</Badge>
                            ) : (
                              <span className="text-slate-600">{a.role}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Building2, GraduationCap, Link2, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react"

interface AuditResults {
  directors: { total: number; byClinic: Record<string, number> }
  students: { total: number; byClinic: Record<string, number>; withClientTeam: number; teamLeaders: number }
  clients: { total: number; withDirector: number; withStudents: number }
  clientAssignments: { total: number; byClinic: Record<string, number> }
  clientDirectors: { total: number }
  validation: {
    clientsWithAllClinics: string[]
    clientsMissingStudents: { client: string; missingClinics: string[] }[]
    orphanedStudents: string[]
  }
}

interface ClientDetail {
  name: string
  directorLead: string
  studentCount: number
  studentsByClinic: {
    clinic: string
    students: { name: string; role: string }[]
  }[]
}

interface ImportResults {
  directors: { inserted: number; updated: number; errors: string[] }
  students: { inserted: number; updated: number; errors: string[] }
  clients: { inserted: number; updated: number; errors: string[] }
  clientAssignments: { inserted: number; skipped: number; errors: string[] }
  clientDirectors: { inserted: number; skipped: number; errors: string[] }
}

export default function StakeholdersPage() {
  const [loading, setLoading] = useState(false)
  const [auditing, setAuditing] = useState(false)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null)
  const [clientDetails, setClientDetails] = useState<ClientDetail[]>([])
  const [error, setError] = useState<string | null>(null)

  const runImport = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/import-stakeholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import" }),
      })
      const data = await response.json()
      if (data.success) {
        setImportResults(data.results)
        // Auto-run audit after import
        await runAudit()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setLoading(false)
    }
  }

  const runAudit = async () => {
    setAuditing(true)
    setError(null)
    try {
      const response = await fetch("/api/import-stakeholders")
      const data = await response.json()
      if (data.success) {
        setAuditResults(data.audit)
        setClientDetails(data.clientDetails)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed")
    } finally {
      setAuditing(false)
    }
  }

  const clinicColors: Record<string, string> = {
    Accounting: "bg-blue-100 text-blue-800",
    Consulting: "bg-green-100 text-green-800",
    Marketing: "bg-purple-100 text-purple-800",
    "Resource Acquisition": "bg-orange-100 text-orange-800",
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Stakeholder Data Management</h1>
            <p className="text-slate-600 mt-2">Import and link Students, Directors, and Clients in Supabase</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button onClick={runImport} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
            {loading ? "Importing..." : "Import & Link All Stakeholders"}
          </Button>
          <Button onClick={runAudit} disabled={auditing} variant="outline">
            {auditing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {auditing ? "Auditing..." : "Audit Data Relationships"}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* Import Results */}
        {importResults && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div className="p-4 bg-slate-100 rounded-lg">
                  <div className="text-sm text-slate-600">Directors</div>
                  <div className="text-2xl font-bold">
                    {importResults.directors.inserted + importResults.directors.updated}
                  </div>
                  <div className="text-xs text-slate-500">
                    {importResults.directors.inserted} new, {importResults.directors.updated} updated
                  </div>
                </div>
                <div className="p-4 bg-slate-100 rounded-lg">
                  <div className="text-sm text-slate-600">Students</div>
                  <div className="text-2xl font-bold">
                    {importResults.students.inserted + importResults.students.updated}
                  </div>
                  <div className="text-xs text-slate-500">
                    {importResults.students.inserted} new, {importResults.students.updated} updated
                  </div>
                </div>
                <div className="p-4 bg-slate-100 rounded-lg">
                  <div className="text-sm text-slate-600">Clients</div>
                  <div className="text-2xl font-bold">
                    {importResults.clients.inserted + importResults.clients.updated}
                  </div>
                  <div className="text-xs text-slate-500">
                    {importResults.clients.inserted} new, {importResults.clients.updated} updated
                  </div>
                </div>
                <div className="p-4 bg-slate-100 rounded-lg">
                  <div className="text-sm text-slate-600">Student-Client Links</div>
                  <div className="text-2xl font-bold">{importResults.clientAssignments.inserted}</div>
                  <div className="text-xs text-slate-500">
                    {importResults.clientAssignments.skipped} already existed
                  </div>
                </div>
                <div className="p-4 bg-slate-100 rounded-lg">
                  <div className="text-sm text-slate-600">Director-Client Links</div>
                  <div className="text-2xl font-bold">{importResults.clientDirectors.inserted}</div>
                  <div className="text-xs text-slate-500">{importResults.clientDirectors.skipped} already existed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Results */}
        {auditResults && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{auditResults.directors.total}</div>
                      <div className="text-sm text-slate-600">Directors</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{auditResults.students.total}</div>
                      <div className="text-sm text-slate-600">
                        Students ({auditResults.students.teamLeaders} leaders)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{auditResults.clients.total}</div>
                      <div className="text-sm text-slate-600">Clients</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Link2 className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{auditResults.clientAssignments.total}</div>
                      <div className="text-sm text-slate-600">Student-Client Links</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Students by Clinic */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Students by Clinic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(auditResults.students.byClinic).map(([clinic, count]) => (
                    <div key={clinic} className="p-4 border rounded-lg">
                      <Badge className={clinicColors[clinic] || "bg-slate-100"}>{clinic}</Badge>
                      <div className="text-3xl font-bold mt-2">{count}</div>
                      <div className="text-sm text-slate-600">students</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Data Validation</CardTitle>
                <CardDescription>Checking that all clients have students from all 4 clinics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">
                      <CheckCircle2 className="h-4 w-4 inline mr-2" />
                      Clients with all 4 clinics ({auditResults.validation.clientsWithAllClinics.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {auditResults.validation.clientsWithAllClinics.map((client) => (
                        <Badge key={client} variant="outline" className="bg-green-50">
                          {client}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {auditResults.validation.clientsMissingStudents.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-amber-700 mb-2">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        Clients missing students from some clinics
                      </h4>
                      <div className="space-y-2">
                        {auditResults.validation.clientsMissingStudents.map(({ client, missingClinics }) => (
                          <div key={client} className="p-2 bg-amber-50 rounded">
                            <span className="font-medium">{client}</span>
                            <span className="text-slate-600"> - Missing: </span>
                            {missingClinics.map((c) => (
                              <Badge key={c} variant="outline" className="ml-1">
                                {c}
                              </Badge>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {auditResults.validation.orphanedStudents.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-700 mb-2">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        Students not linked to any client ({auditResults.validation.orphanedStudents.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {auditResults.validation.orphanedStudents.map((student) => (
                          <Badge key={student} variant="outline" className="bg-red-50">
                            {student}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Details */}
            <Card>
              <CardHeader>
                <CardTitle>Client-Level View</CardTitle>
                <CardDescription>Each client with their director lead and assigned students by clinic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {clientDetails.map((client) => (
                    <div key={client.name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold">{client.name}</h3>
                          <p className="text-sm text-slate-600">
                            Director Lead: <span className="font-medium">{client.directorLead}</span>
                          </p>
                        </div>
                        <Badge variant="outline">{client.studentCount} students</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        {client.studentsByClinic.map(({ clinic, students }) => (
                          <div key={clinic} className="p-3 bg-slate-50 rounded">
                            <Badge className={`${clinicColors[clinic] || "bg-slate-100"} mb-2`}>{clinic}</Badge>
                            {students.length > 0 ? (
                              <ul className="text-sm space-y-1">
                                {students.map((s, i) => (
                                  <li key={i} className="flex items-center gap-1">
                                    {s.role === "Team Leader" && <span className="text-amber-500">★</span>}
                                    {s.name}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-400 italic">No students</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </SidebarProvider>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2, Database, FileText } from "lucide-react"

export default function DatabaseSetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const setupDatabase = async () => {
    setStatus("loading")
    setMessage("Creating database tables...")

    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage(data.message)
      } else {
        setStatus("error")
        setMessage(data.message || "Failed to set up database")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Network error: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Setup</h1>
          <p className="text-gray-600 mt-2">Set up the Supabase database tables for the SEED program</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Create Database Tables
            </CardTitle>
            <CardDescription>
              This will create the necessary tables in Supabase for students, directors, clients, and assignments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "idle" && (
              <Button onClick={setupDatabase} size="lg" className="w-full">
                <Database className="w-4 h-4 mr-2" />
                Create Tables
              </Button>
            )}

            {status === "loading" && (
              <Alert>
                <Loader2 className="w-4 h-4 animate-spin" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {status === "success" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">{message}</AlertDescription>
              </Alert>
            )}

            {status === "error" && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
              <li>Click "Create Tables" above to set up the database schema</li>
              <li>
                Go to your Supabase project's SQL Editor
                <a
                  href="https://supabase.com/dashboard/project/anpvbykwnqkyqegrvheg/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:underline"
                >
                  Open SQL Editor →
                </a>
              </li>
              <li>
                Run the data import scripts in order:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">02-seed-directors-data.sql</code>
                  </li>
                  <li>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">03-seed-students-data.sql</code>
                  </li>
                  <li>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">04-seed-clients-data.sql</code>
                  </li>
                  <li>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">05-seed-client-assignments.sql</code>
                  </li>
                </ul>
              </li>
              <li>The forms will automatically use Supabase data once tables are populated</li>
              <li>Until then, forms will continue using Airtable data as a fallback</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Current Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800">
            <p>
              The SHIN app is currently using Airtable as the data source. Once you complete the database setup, all
              forms will automatically switch to using Supabase for better performance and scalability.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function TableDiscovery() {
  const [tables, setTables] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/airtable/tables")
      .then((res) => res.json())
      .then((data) => {
        console.log("[v0] Tables data:", data)
        setTables(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("[v0] Error:", err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="text-white">Loading tables...</div>
  if (error) return <div className="text-red-400">Error: {error}</div>

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Available Airtable Tables</CardTitle>
        <CardDescription className="text-slate-400">Discovered tables in your Airtable base</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="text-xs text-white overflow-auto max-h-96 bg-slate-900 p-4 rounded">
          {JSON.stringify(tables, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EvaluationForm } from "@/components/evaluation-form"
import { Lock, CheckCircle2, FileText } from "lucide-react"

const EVALUATION_PASSWORD = "SEED2025"

interface Document {
  id: string
  file_name: string
  client_name: string
  submission_type: string
}

export default function SubmitEvaluationPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [directorName, setDirectorName] = useState("")
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (isAuthenticated && directorName) {
      fetchDocuments()
    }
  }, [isAuthenticated, directorName])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/documents")
      if (response.ok) {
        const data = await response.json()
        const pptxDocs = data.documents.filter(
          (doc: Document) =>
            doc.file_name.toLowerCase().endsWith(".pptx") || doc.file_name.toLowerCase().endsWith(".ppt"),
        )
        setDocuments(pptxDocs)
      }
    } catch (error) {
      console.error("[v0] Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === EVALUATION_PASSWORD) {
      setIsAuthenticated(true)
      setPasswordError("")
    } else {
      setPasswordError("Incorrect password. Please try again.")
    }
  }

  const handleEvaluationSubmit = () => {
    setSubmitted(true)
    setSelectedDocument(null)
  }

  const handleEvaluationCancel = () => {
    setSelectedDocument(null)
  }

  const handleSelectAnother = () => {
    setSubmitted(false)
    setSelectedDocument(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002855] via-[#003d7a] to-[#0077B6] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#0077B6] rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#002855] text-center">Midterm Evaluation Form</h1>
            <p className="text-sm text-gray-600 text-center mt-2">Enter the password to access the evaluation form</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-[#002855]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError("")
                }}
                placeholder="Enter password"
                className="mt-1"
              />
              {passwordError && <p className="text-sm text-red-600 mt-1">{passwordError}</p>}
            </div>

            <Button type="submit" className="w-full bg-[#0077B6] hover:bg-[#005a8c] text-white">
              Access Form
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  if (!directorName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002855] via-[#003d7a] to-[#0077B6] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#0077B6] rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#002855] text-center">Midterm Evaluation Form</h1>
            <p className="text-sm text-gray-600 text-center mt-2">Please enter your name to continue</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="directorName" className="text-sm font-medium text-[#002855]">
                Your Name
              </Label>
              <Input
                id="directorName"
                type="text"
                value={directorName}
                onChange={(e) => setDirectorName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>

            <Button
              onClick={() => directorName.trim() && setDirectorName(directorName.trim())}
              disabled={!directorName.trim()}
              className="w-full bg-[#0077B6] hover:bg-[#005a8c] text-white"
            >
              Continue
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002855] via-[#003d7a] to-[#0077B6] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white shadow-2xl text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#002855]">Evaluation Submitted!</h1>
            <p className="text-sm text-gray-600 mt-2">Thank you for completing the midterm evaluation.</p>
          </div>

          <Button onClick={handleSelectAnother} className="w-full bg-[#0077B6] hover:bg-[#005a8c] text-white">
            Evaluate Another Presentation
          </Button>
        </Card>
      </div>
    )
  }

  if (!selectedDocument) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002855] via-[#003d7a] to-[#0077B6] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 bg-white shadow-2xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#002855] mb-2">Select Presentation to Evaluate</h1>
              <p className="text-sm text-gray-600">
                Evaluator: <span className="font-semibold text-[#0077B6]">{directorName}</span>
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading presentations...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No midterm presentations available for evaluation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="document" className="text-sm font-medium text-[#002855]">
                    Select Presentation
                  </Label>
                  <Select onValueChange={(value) => setSelectedDocument(documents.find((d) => d.id === value) || null)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a presentation to evaluate" />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.client_name} - {doc.file_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDocument && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-[#002855]">
                      <span className="font-semibold">Selected:</span> {selectedDocument.client_name} -{" "}
                      {selectedDocument.file_name}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002855] via-[#003d7a] to-[#0077B6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Card className="p-4 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Evaluating:</p>
                <p className="font-semibold text-[#002855]">
                  {selectedDocument.client_name} - {selectedDocument.file_name}
                </p>
              </div>
              <Button onClick={handleEvaluationCancel} variant="outline" size="sm">
                Change Selection
              </Button>
            </div>
          </Card>
        </div>

        <EvaluationForm
          documentId={selectedDocument.id}
          directorName={directorName}
          onSubmit={handleEvaluationSubmit}
          onCancel={handleEvaluationCancel}
        />
      </div>
    </div>
  )
}

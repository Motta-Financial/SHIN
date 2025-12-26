"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  FileText,
  File,
  ImageIcon,
  FileSpreadsheet,
  X,
  Download,
  ExternalLink,
  FolderOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { upload } from "@vercel/blob/client"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface Document {
  id: string
  file_name: string
  file_url: string
  file_type: string
  description: string
  uploaded_by_name: string
  uploaded_by_email: string
  uploaded_at: string
  is_visible_to_students: boolean
}

interface ClientDocumentUploadProps {
  documents: Document[]
  clientId: string
  clientName: string
  clientEmail: string
  onDocumentUploaded?: () => void
  loading?: boolean
}

export function ClientDocumentUpload({
  documents,
  clientId,
  clientName,
  clientEmail,
  onDocumentUploaded,
  loading,
}: ClientDocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const blob = await upload(selectedFile.name, selectedFile, {
        access: "public",
        handleUploadUrl: "/api/upload-blob",
      })

      setUploadProgress(80)

      const response = await fetch("/api/client-portal/client-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: selectedFile.name,
          file_url: blob.url,
          file_type: selectedFile.type || getFileType(selectedFile.name),
          description: description.trim(),
          uploaded_by_email: clientEmail,
          uploaded_by_name: clientName,
          client_id: clientId,
        }),
      })

      setUploadProgress(100)

      if (response.ok) {
        setSelectedFile(null)
        setDescription("")
        onDocumentUploaded?.()
      }
    } catch (error) {
      console.error("Error uploading document:", error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileType = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    const types: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
    }
    return types[ext || ""] || "application/octet-stream"
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return <ImageIcon className="h-5 w-5 text-purple-500" />
    if (fileType.includes("spreadsheet") || fileType.includes("excel"))
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />
    if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />
    return <File className="h-5 w-5 text-blue-500" />
  }

  if (loading) {
    return (
      <Card className="p-5 border-slate-200 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <Upload className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Document Upload</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-slate-100 rounded-lg" />
          {[1, 2].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="h-4 bg-slate-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const previewCount = 3
  const previewDocs = documents.slice(0, previewCount)
  const remainingDocs = documents.slice(previewCount)

  return (
    <Card className="p-5 border-slate-200 bg-white">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
        <Upload className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Document Upload</h2>
        <Badge variant="outline" className="ml-auto text-xs">
          {documents.length} Documents
        </Badge>
      </div>

      {/* Upload Area */}
      <div
        className={`mb-4 border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : selectedFile
              ? "border-emerald-300 bg-emerald-50"
              : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFile.type)}
                <div>
                  <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Textarea
              placeholder="Add a description for this document (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px] bg-white text-sm"
            />

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-slate-500 text-center">Uploading... {uploadProgress}%</p>
              </div>
            )}

            <Button onClick={handleUpload} disabled={uploading} className="w-full bg-slate-700 hover:bg-slate-800">
              {uploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        ) : (
          <label className="cursor-pointer block text-center">
            <FolderOpen className="h-10 w-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-600 mb-1">Drag and drop files here, or click to browse</p>
            <p className="text-xs text-slate-400">Supports PDF, Word, Excel, PowerPoint, and images</p>
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
            />
          </label>
        )}
      </div>

      {/* Uploaded Documents List - Expandable */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Your Uploads</h3>
        {documents.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No documents uploaded yet</p>
          </div>
        ) : (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <div className="space-y-2">
              {previewDocs.map((doc) => {
                const isOpen = expandedDoc === doc.id

                return (
                  <div key={doc.id} className="rounded-lg bg-slate-50 border border-slate-200 overflow-hidden">
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setExpandedDoc(isOpen ? null : doc.id)}
                    >
                      {getFileIcon(doc.file_type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.file_name}</p>
                        <p className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                        </p>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>

                    {isOpen && (
                      <div className="border-t border-slate-200 p-3 bg-white">
                        {doc.description && <p className="text-sm text-slate-600 mb-3">{doc.description}</p>}
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </a>
                          <a
                            href={doc.file_url}
                            download={doc.file_name}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <CollapsibleContent className="space-y-2">
                {remainingDocs.map((doc) => {
                  const isOpen = expandedDoc === doc.id

                  return (
                    <div key={doc.id} className="rounded-lg bg-slate-50 border border-slate-200 overflow-hidden">
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => setExpandedDoc(isOpen ? null : doc.id)}
                      >
                        {getFileIcon(doc.file_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{doc.file_name}</p>
                          <p className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                          </p>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </div>

                      {isOpen && (
                        <div className="border-t border-slate-200 p-3 bg-white">
                          {doc.description && <p className="text-sm text-slate-600 mb-3">{doc.description}</p>}
                          <div className="flex items-center gap-2">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </a>
                            <a
                              href={doc.file_url}
                              download={doc.file_name}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CollapsibleContent>
            </div>

            {remainingDocs.length > 0 && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-600">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show {remainingDocs.length} More Documents
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            )}
          </Collapsible>
        )}
      </div>
    </Card>
  )
}

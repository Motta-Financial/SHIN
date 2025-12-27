"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DocumentUploadProps {
  clinic?: string
  onUploadComplete?: () => void
  compact?: boolean
  submissionType?: "course_material" | "document" | "deliverable"
}

export default function DocumentUpload({
  clinic,
  onUploadComplete,
  compact = false,
  submissionType = "course_material",
}: DocumentUploadProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("resource")
  const [targetClinic, setTargetClinic] = useState(clinic || "all")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title) {
      setErrorMessage("Please select a file and provide a title")
      setUploadStatus("error")
      return
    }

    setUploading(true)
    setUploadStatus("idle")
    setErrorMessage("")

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${submissionType}s/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile)

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath)

      // Save metadata to database
      if (submissionType === "course_material") {
        const { error: dbError } = await supabase.from("course_materials").insert({
          title,
          description,
          file_name: selectedFile.name,
          file_url: urlData.publicUrl,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          category,
          target_clinic: targetClinic,
          uploaded_by: "current-user", // In production, get from auth context
          uploader_name: "Director", // In production, get from auth context
        })

        if (dbError) {
          throw new Error(`Failed to save metadata: ${dbError.message}`)
        }
      }

      setUploadStatus("success")
      setTitle("")
      setDescription("")
      setSelectedFile(null)
      setCategory("resource")

      if (onUploadComplete) {
        onUploadComplete()
      }

      // Close dialog after short delay
      setTimeout(() => {
        setOpen(false)
        setUploadStatus("idle")
      }, 1500)
    } catch (error) {
      console.error("Upload error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload file")
      setUploadStatus("error")
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setSelectedFile(null)
    setCategory("resource")
    setUploadStatus("idle")
    setErrorMessage("")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {compact ? (
          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        ) : (
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload {submissionType === "course_material" ? "Course Material" : "Document"}</DialogTitle>
          <DialogDescription>
            Upload a file to share with {targetClinic === "all" ? "all students" : `${targetClinic} clinic`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Selection */}
          <div className="space-y-2">
            <Label>File</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                selectedFile ? "border-green-300 bg-green-50" : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">{selectedFile.name}</span>
                </div>
              ) : (
                <div className="text-slate-500">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click to select a file</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the document"
              rows={2}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="syllabus">Syllabus</SelectItem>
                <SelectItem value="lecture">Lecture</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="resource">Resource</SelectItem>
                <SelectItem value="template">Template</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Clinic */}
          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Select value={targetClinic} onValueChange={setTargetClinic}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students (Program-Wide)</SelectItem>
                <SelectItem value="Community Development">Community Development</SelectItem>
                <SelectItem value="Policy & Advocacy">Policy & Advocacy</SelectItem>
                <SelectItem value="Resource Acquisition">Resource Acquisition</SelectItem>
                <SelectItem value="Strategic Communications">Strategic Communications</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Messages */}
          {uploadStatus === "success" && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">File uploaded successfully!</span>
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{errorMessage || "Failed to upload file"}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !selectedFile || !title}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

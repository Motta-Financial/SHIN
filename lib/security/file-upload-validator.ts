const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` }
  }

  // Check file extension matches MIME type
  const extension = file.name.split(".").pop()?.toLowerCase()
  const mimeTypeExtensions: Record<string, string[]> = {
    "application/pdf": ["pdf"],
    "application/msword": ["doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "application/vnd.ms-excel": ["xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
    "application/vnd.ms-powerpoint": ["ppt"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
    "text/plain": ["txt"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/gif": ["gif"],
    "image/webp": ["webp"],
  }

  const validExtensions = mimeTypeExtensions[file.type] || []
  if (extension && !validExtensions.includes(extension)) {
    return { valid: false, error: "File extension does not match file type" }
  }

  // Sanitize filename
  const hasInvalidChars = /[<>:"/\\|?*\x00-\x1F]/.test(file.name)
  if (hasInvalidChars) {
    return { valid: false, error: "Filename contains invalid characters" }
  }

  return { valid: true }
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").substring(0, 255)
}

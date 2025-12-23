// Input validation and sanitization utilities

export function sanitizeString(input: string): string {
  // Remove any HTML tags and script content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return emailRegex.test(email)
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function sanitizeFilename(filename: string): string {
  // Remove any potentially dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 255)
}

export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split(".").pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

export const ALLOWED_DOCUMENT_TYPES = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"]
export const ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp"]
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

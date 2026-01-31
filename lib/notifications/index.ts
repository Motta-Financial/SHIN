/**
 * SHIN Notification System - Utility Template
 * 
 * This file provides a standardized way to create notifications across the application.
 * All notifications MUST follow these patterns to ensure successful delivery.
 * 
 * NOTIFICATION TYPES (as defined by database constraint):
 * - 'document_upload' - When a student uploads a document
 * - 'question' - When a student asks a question (via debrief)
 * - 'meeting_request' - When a student requests a meeting
 * - 'announcement' - General announcements (agenda published, attendance open, etc.)
 * - 'debrief' - Debrief-related notifications
 * - 'attendance' - Attendance-related notifications
 * 
 * TARGET AUDIENCES:
 * - 'students' - Notifications for students
 * - 'directors' - Notifications for directors
 * 
 * REQUIRED FIELDS (based on database schema):
 * - type: One of the valid notification types above
 * - title: Short title for the notification
 * - message: Detailed message content
 * - student_id: UUID of the target student (REQUIRED - NOT NULL constraint)
 * - target_audience: 'students' or 'directors'
 * - is_read: boolean (default false)
 * - created_at: ISO timestamp
 * 
 * OPTIONAL FIELDS:
 * - student_name: Name of the student (for display)
 * - student_email: Email of the student
 * - clinic_id: UUID of the related clinic
 * - director_id: UUID of the target director (for director notifications)
 * - related_id: UUID of related entity (debrief, document, etc.)
 * - created_by_user_id: UUID of the user who created the notification
 * 
 * TRIGGERS (handled automatically by database):
 * - create_question_notification: Fires on debriefs INSERT when questions field is not empty
 * - create_meeting_notification: Fires on meeting_requests INSERT
 * - create_document_notification: Fires on documents INSERT
 */

import { createClient } from "@supabase/supabase-js"

// Valid notification types as defined by database constraint
export type NotificationType = 
  | 'document_upload'
  | 'question'
  | 'meeting_request'
  | 'announcement'
  | 'debrief'
  | 'attendance'

export type TargetAudience = 'students' | 'directors'

export interface NotificationData {
  type: NotificationType
  title: string
  message: string
  student_id: string // Required - UUID
  target_audience: TargetAudience
  student_name?: string
  student_email?: string
  clinic_id?: string // UUID
  director_id?: string // UUID
  related_id?: string // UUID
  created_by_user_id?: string // UUID
}

export interface BulkNotificationResult {
  success: boolean
  count: number
  error?: string
}

/**
 * Get the Supabase service client for bypassing RLS
 */
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }
  
  return createClient(supabaseUrl, serviceRoleKey)
}

/**
 * Create a single notification
 */
export async function createNotification(data: NotificationData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = getServiceClient()
    
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        type: data.type,
        title: data.title,
        message: data.message,
        student_id: data.student_id,
        student_name: data.student_name || null,
        student_email: data.student_email || null,
        clinic_id: data.clinic_id || null,
        director_id: data.director_id || null,
        target_audience: data.target_audience,
        related_id: data.related_id || null,
        created_by_user_id: data.created_by_user_id || null,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()
    
    if (error) {
      console.error("[Notifications] Error creating notification:", error.message)
      return { success: false, error: error.message }
    }
    
    return { success: true, id: notification.id }
  } catch (error) {
    console.error("[Notifications] Exception creating notification:", error)
    return { success: false, error: "Failed to create notification" }
  }
}

/**
 * Create notifications for multiple students
 * Used for announcements, agenda publishing, attendance opening, etc.
 */
export async function createBulkStudentNotifications(
  type: NotificationType,
  title: string,
  message: string,
  semesterId?: string
): Promise<BulkNotificationResult> {
  try {
    const supabase = getServiceClient()
    
    // Get all active students for the semester
    let query = supabase
      .from("students_current")
      .select("id, full_name, email, clinic_id")
    
    if (semesterId) {
      query = query.eq("semester_id", semesterId)
    }
    
    const { data: students, error: studentsError } = await query
    
    if (studentsError) {
      console.error("[Notifications] Error fetching students:", studentsError.message)
      return { success: false, count: 0, error: studentsError.message }
    }
    
    if (!students || students.length === 0) {
      return { success: true, count: 0 }
    }
    
    // Create individual notifications for each student
    const notifications = students.map(student => ({
      type,
      title,
      message,
      student_id: student.id,
      student_name: student.full_name,
      student_email: student.email,
      clinic_id: student.clinic_id,
      target_audience: "students" as TargetAudience,
      is_read: false,
      created_at: new Date().toISOString(),
    }))
    
    const { error: insertError } = await supabase.from("notifications").insert(notifications)
    
    if (insertError) {
      console.error("[Notifications] Error inserting bulk notifications:", insertError.message)
      return { success: false, count: 0, error: insertError.message }
    }
    
    console.log(`[Notifications] Created ${notifications.length} notifications for students`)
    return { success: true, count: notifications.length }
  } catch (error) {
    console.error("[Notifications] Exception in bulk notification:", error)
    return { success: false, count: 0, error: "Failed to create bulk notifications" }
  }
}

/**
 * Create a notification for directors of a specific clinic
 */
export async function notifyClinicDirectors(
  type: NotificationType,
  title: string,
  message: string,
  clinicId: string,
  studentData: {
    student_id: string
    student_name?: string
    student_email?: string
  },
  relatedId?: string
): Promise<BulkNotificationResult> {
  try {
    const supabase = getServiceClient()
    
    // Get directors for this clinic
    const { data: clinicDirectors, error: directorsError } = await supabase
      .from("clinic_directors")
      .select("director_id")
      .eq("clinic_id", clinicId)
    
    if (directorsError) {
      console.error("[Notifications] Error fetching clinic directors:", directorsError.message)
      return { success: false, count: 0, error: directorsError.message }
    }
    
    if (!clinicDirectors || clinicDirectors.length === 0) {
      // Fallback: notify any director
      const { data: anyDirector } = await supabase
        .from("directors")
        .select("id")
        .limit(1)
        .single()
      
      if (anyDirector) {
        clinicDirectors.push({ director_id: anyDirector.id })
      }
    }
    
    if (!clinicDirectors || clinicDirectors.length === 0) {
      return { success: true, count: 0 }
    }
    
    const notifications = clinicDirectors.map(cd => ({
      type,
      title,
      message,
      student_id: studentData.student_id,
      student_name: studentData.student_name || null,
      student_email: studentData.student_email || null,
      clinic_id: clinicId,
      director_id: cd.director_id,
      target_audience: "directors" as TargetAudience,
      related_id: relatedId || null,
      is_read: false,
      created_at: new Date().toISOString(),
    }))
    
    const { error: insertError } = await supabase.from("notifications").insert(notifications)
    
    if (insertError) {
      console.error("[Notifications] Error notifying directors:", insertError.message)
      return { success: false, count: 0, error: insertError.message }
    }
    
    return { success: true, count: notifications.length }
  } catch (error) {
    console.error("[Notifications] Exception notifying directors:", error)
    return { success: false, count: 0, error: "Failed to notify directors" }
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServiceClient()
    
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to mark notification as read" }
  }
}

/**
 * Mark all notifications as read for a student
 */
export async function markAllNotificationsRead(studentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServiceClient()
    
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("student_id", studentId)
      .eq("is_read", false)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to mark notifications as read" }
  }
}

/**
 * Get unread notification count for a student
 */
export async function getUnreadCount(studentId: string): Promise<number> {
  try {
    const supabase = getServiceClient()
    
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("is_read", false)
      .eq("target_audience", "students")
    
    if (error) {
      console.error("[Notifications] Error getting unread count:", error.message)
      return 0
    }
    
    return count || 0
  } catch (error) {
    return 0
  }
}

/**
 * Helper: Get clinic ID from clinic name
 */
export async function getClinicIdFromName(clinicName: string): Promise<string | null> {
  try {
    const supabase = getServiceClient()
    
    const { data } = await supabase
      .from("clinics")
      .select("id")
      .ilike("name", `%${clinicName}%`)
      .limit(1)
      .single()
    
    return data?.id || null
  } catch (error) {
    return null
  }
}

/**
 * Helper: Get student's clinic ID
 */
export async function getStudentClinicId(studentId: string): Promise<string | null> {
  try {
    const supabase = getServiceClient()
    
    const { data } = await supabase
      .from("students")
      .select("clinic_id")
      .eq("id", studentId)
      .limit(1)
      .single()
    
    return data?.clinic_id || null
  } catch (error) {
    return null
  }
}

/*
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 * 
 * 1. AGENDA PUBLISHED (Announcement to all students):
 * 
 *    import { createBulkStudentNotifications } from "@/lib/notifications"
 *    
 *    await createBulkStudentNotifications(
 *      "announcement",
 *      "Class Agenda Published",
 *      "The agenda for Jan 25 has been published. Check the Class Course page for details.",
 *      semesterId
 *    )
 * 
 * 2. ATTENDANCE OPEN (Announcement to all students):
 * 
 *    await createBulkStudentNotifications(
 *      "announcement",
 *      "Attendance Open",
 *      "Attendance for Week 5 is now open. Please submit during class.",
 *      semesterId
 *    )
 * 
 * 3. STUDENT QUESTION (to directors - handled by database trigger):
 *    - When a debrief is inserted with a non-empty `questions` field,
 *      the `create_question_notification` trigger automatically creates
 *      a notification for the appropriate director.
 * 
 * 4. MEETING REQUEST (to directors - handled by database trigger):
 *    - When a meeting_request is inserted, the `create_meeting_notification`
 *      trigger automatically creates a notification for the director.
 * 
 * 5. DOCUMENT UPLOAD (to directors - handled by database trigger):
 *    - When a document is inserted, the `create_document_notification`
 *      trigger automatically creates a notification for the director.
 * 
 * 6. CUSTOM NOTIFICATION TO SPECIFIC STUDENT:
 * 
 *    import { createNotification } from "@/lib/notifications"
 *    
 *    await createNotification({
 *      type: "announcement",
 *      title: "Your Document Was Approved",
 *      message: "Your SOW document has been approved by the director.",
 *      student_id: "uuid-of-student",
 *      student_name: "John Doe",
 *      student_email: "john@example.com",
 *      target_audience: "students",
 *      clinic_id: "uuid-of-clinic",
 *    })
 * 
 * 7. NOTIFICATION TO CLINIC DIRECTORS:
 * 
 *    import { notifyClinicDirectors } from "@/lib/notifications"
 *    
 *    await notifyClinicDirectors(
 *      "debrief",
 *      "New Debrief Submitted",
 *      "John Doe submitted their weekly debrief.",
 *      clinicId,
 *      { student_id: studentId, student_name: "John Doe", student_email: "john@example.com" },
 *      debriefId
 *    )
 * 
 * ============================================================================
 */

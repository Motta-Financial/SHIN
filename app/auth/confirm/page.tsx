import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export default async function ConfirmPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/")
  } else {
    redirect("/auth/login?message=Email confirmation complete. Please sign in.")
  }
}

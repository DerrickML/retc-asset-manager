import { redirect } from "next/navigation"
import { getCurrentStaff } from "../lib/utils/auth.js"
import { permissions } from "../lib/utils/auth.js"

export default async function HomePage() {
  // Check if user is authenticated
  const staff = await getCurrentStaff()

  if (!staff) {
    // Redirect to login if not authenticated
    redirect("/login")
  }

  // Redirect based on user role
  if (permissions.isAdmin(staff)) {
    redirect("/admin/dashboard")
  } else {
    redirect("/dashboard")
  }
}
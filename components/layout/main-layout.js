import { Navbar } from "./navbar"
import { AuthGuard } from "../auth/auth-guard"

export function MainLayout({ children, requiredPermission }) {
  return (
    <AuthGuard requiredPermission={requiredPermission}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </div>
    </AuthGuard>
  )
}
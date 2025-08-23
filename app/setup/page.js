"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Progress } from "../../components/ui/progress"
import { settingsService, departmentsService, staffService } from "../../lib/appwrite/provider.js"
import { register } from "../../lib/utils/auth.js"
import { DEFAULT_SETTINGS, ENUMS } from "../../lib/appwrite/config.js"

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Form data
  const [orgData, setOrgData] = useState({
    orgName: "Renewable Energy Training Center (RETC)",
    brandColor: "#2563eb",
    accentColor: "#16a34a",
    emailFromName: "RETC Asset Management",
  })

  const [adminData, setAdminData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Check if setup is already completed
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const settings = await settingsService.get()
        if (settings) {
          router.push("/login")
        }
      } catch (error) {
        // Setup not completed, continue
      }
    }
    checkSetup()
  }, [router])

  const handleStep1Submit = (e) => {
    e.preventDefault()
    setStep(2)
  }

  const handleStep2Submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate passwords match
    if (adminData.password !== adminData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (adminData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    try {
      console.log("🚀 Starting setup process...")
      console.log("📝 Admin data:", { ...adminData, password: "[HIDDEN]", confirmPassword: "[HIDDEN]" })
      console.log("🏢 Organization data:", orgData)
      
      // Create admin user account
      console.log("👤 Creating admin user account...")
      const user = await register(adminData.email, adminData.password, adminData.name)
      console.log("✅ Admin user created:", user)

      // Create default settings
      const defaultBranding = JSON.parse(DEFAULT_SETTINGS.branding)
      const settings = {
        ...DEFAULT_SETTINGS,
        branding: JSON.stringify({
          ...defaultBranding,
          ...orgData,
        }),
      }
      
      console.log("⚙️ Creating settings with data:")
      console.log("📊 Settings object (before service):", JSON.stringify(settings, null, 2))
      
      const createdSettings = await settingsService.create(settings)
      console.log("✅ Settings created:", createdSettings)

      // Create Administration department
      const adminDept = await departmentsService.create({
        name: "Administration",
        description: "Administrative department for asset management",
      })

      // Create staff record for admin user
      await staffService.create({
        userId: user.$id,
        name: adminData.name,
        email: adminData.email,
        departmentId: adminDept.$id,
        roles: [ENUMS.ROLES.SYSTEM_ADMIN, ENUMS.ROLES.ASSET_ADMIN],
      })

      setStep(3)
    } catch (err) {
      setError(err.message || "Setup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    router.push("/login")
  }

  const progress = (step / 3) * 100

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">RETC</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">System Setup</h1>
          <p className="text-gray-600">Configure your RETC Asset Management System</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span className={step >= 1 ? "font-medium" : ""}>Organization</span>
            <span className={step >= 2 ? "font-medium" : ""}>Administrator</span>
            <span className={step >= 3 ? "font-medium" : ""}>Complete</span>
          </div>
        </div>

        {/* Step 1: Organization Setup */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>Configure your organization's branding and basic settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgData.orgName}
                    onChange={(e) => setOrgData({ ...orgData, orgName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandColor">Brand Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="brandColor"
                        type="color"
                        value={orgData.brandColor}
                        onChange={(e) => setOrgData({ ...orgData, brandColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={orgData.brandColor}
                        onChange={(e) => setOrgData({ ...orgData, brandColor: e.target.value })}
                        placeholder="#2563eb"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={orgData.accentColor}
                        onChange={(e) => setOrgData({ ...orgData, accentColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={orgData.accentColor}
                        onChange={(e) => setOrgData({ ...orgData, accentColor: e.target.value })}
                        placeholder="#16a34a"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailFromName">Email From Name</Label>
                  <Input
                    id="emailFromName"
                    value={orgData.emailFromName}
                    onChange={(e) => setOrgData({ ...orgData, emailFromName: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Administrator Setup */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>System Administrator</CardTitle>
              <CardDescription>Create the first administrator account for your system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep2Submit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="adminName">Full Name</Label>
                  <Input
                    id="adminName"
                    value={adminData.name}
                    onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email Address</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminData.email}
                    onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminData.password}
                    onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={adminData.confirmPassword}
                    onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={loading}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Administrator"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Setup Complete!</CardTitle>
              <CardDescription>Your RETC Asset Management System is ready to use</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">System Configured Successfully</h3>
                <p className="text-gray-600 mt-2">
                  Your administrator account has been created and the system is ready for use.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Sign in with your administrator account</li>
                  <li>• Create additional departments and staff members</li>
                  <li>• Add your first assets to the system</li>
                  <li>• Configure approval thresholds and reminders</li>
                </ul>
              </div>

              <Button onClick={handleComplete} className="w-full">
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
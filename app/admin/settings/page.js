"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Switch } from "../../../components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { 
  Settings, 
  Building, 
  Mail, 
  Shield, 
  Globe, 
  Clock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Database,
  Users
} from "lucide-react"
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js"
import { settingsService } from "../../../lib/appwrite/provider.js"

export default function AdminSettings() {
  const [staff, setStaff] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Settings state
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationLogo: "",
    organizationDescription: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    timezone: "",
    dateFormat: "",
    currencySymbol: "$",
    guestPortal: false,
    publicAssetVisibility: false,
    emailNotifications: true,
    autoApprovalThreshold: 0,
    maxRequestDuration: 30,
    maintenanceMode: false,
    systemNotification: "",
    emailSettings: {
      smtpHost: "",
      smtpPort: 587,
      smtpUsername: "",
      smtpPassword: "",
      fromName: "",
      fromEmail: ""
    }
  })

  useEffect(() => {
    checkPermissionsAndLoadSettings()
  }, [])

  const checkPermissionsAndLoadSettings = async () => {
    try {
      const currentStaff = await getCurrentStaff()
      if (!currentStaff || !permissions.isSystemAdmin(currentStaff)) {
        window.location.href = "/unauthorized"
        return
      }
      setStaff(currentStaff)
      await loadSettings()
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const systemSettings = await settingsService.get()
      if (systemSettings) {
        setSettings(systemSettings)
        setFormData({
          organizationName: systemSettings.organizationName || "",
          organizationLogo: systemSettings.organizationLogo || "",
          organizationDescription: systemSettings.organizationDescription || "",
          contactEmail: systemSettings.contactEmail || "",
          contactPhone: systemSettings.contactPhone || "",
          address: systemSettings.address || "",
          timezone: systemSettings.timezone || "UTC",
          dateFormat: systemSettings.dateFormat || "MM/dd/yyyy",
          currencySymbol: systemSettings.currencySymbol || "$",
          guestPortal: systemSettings.guestPortal || false,
          publicAssetVisibility: systemSettings.publicAssetVisibility || false,
          emailNotifications: systemSettings.emailNotifications || true,
          autoApprovalThreshold: systemSettings.autoApprovalThreshold || 0,
          maxRequestDuration: systemSettings.maxRequestDuration || 30,
          maintenanceMode: systemSettings.maintenanceMode || false,
          systemNotification: systemSettings.systemNotification || "",
          emailSettings: {
            smtpHost: systemSettings.emailSettings?.smtpHost || "",
            smtpPort: systemSettings.emailSettings?.smtpPort || 587,
            smtpUsername: systemSettings.emailSettings?.smtpUsername || "",
            smtpPassword: systemSettings.emailSettings?.smtpPassword || "",
            fromName: systemSettings.emailSettings?.fromName || "",
            fromEmail: systemSettings.emailSettings?.fromEmail || ""
          }
        })
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      await settingsService.update(formData)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      await loadSettings() // Refresh data
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEmailSettingsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emailSettings: {
        ...prev.emailSettings,
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Settings saved!</span>
            </div>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Organization Details</span>
                </CardTitle>
                <CardDescription>Basic information about your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name *</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange("organizationName", e.target.value)}
                    placeholder="Your Organization Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="organizationDescription">Description</Label>
                  <Textarea
                    id="organizationDescription"
                    value={formData.organizationDescription}
                    onChange={(e) => handleInputChange("organizationDescription", e.target.value)}
                    placeholder="Brief description of your organization"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationLogo">Logo URL</Label>
                  <Input
                    id="organizationLogo"
                    value={formData.organizationLogo}
                    onChange={(e) => handleInputChange("organizationLogo", e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Contact Information</span>
                </CardTitle>
                <CardDescription>Contact details for your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    placeholder="contact@organization.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Organization address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Regional Settings</span>
                </CardTitle>
                <CardDescription>Configure timezone, date format, and currency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={formData.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={formData.dateFormat} onValueChange={(value) => handleInputChange("dateFormat", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MMM dd, yyyy">MMM DD, YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    value={formData.currencySymbol}
                    onChange={(e) => handleInputChange("currencySymbol", e.target.value)}
                    placeholder="$"
                    className="max-w-20"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Request Settings</span>
                </CardTitle>
                <CardDescription>Configure asset request parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="autoApprovalThreshold">Auto-Approval Threshold ($)</Label>
                  <Input
                    id="autoApprovalThreshold"
                    type="number"
                    value={formData.autoApprovalThreshold}
                    onChange={(e) => handleInputChange("autoApprovalThreshold", parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500">Requests below this value are auto-approved (0 = manual approval only)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxRequestDuration">Max Request Duration (days)</Label>
                  <Input
                    id="maxRequestDuration"
                    type="number"
                    value={formData.maxRequestDuration}
                    onChange={(e) => handleInputChange("maxRequestDuration", parseInt(e.target.value) || 30)}
                    placeholder="30"
                  />
                  <p className="text-xs text-gray-500">Maximum number of days assets can be requested</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="emailNotifications"
                    checked={formData.emailNotifications}
                    onCheckedChange={(value) => handleInputChange("emailNotifications", value)}
                  />
                  <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>SMTP Configuration</span>
              </CardTitle>
              <CardDescription>Configure email server settings for notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={formData.emailSettings.smtpHost}
                      onChange={(e) => handleEmailSettingsChange("smtpHost", e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={formData.emailSettings.smtpPort}
                      onChange={(e) => handleEmailSettingsChange("smtpPort", parseInt(e.target.value) || 587)}
                      placeholder="587"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">Username</Label>
                    <Input
                      id="smtpUsername"
                      value={formData.emailSettings.smtpUsername}
                      onChange={(e) => handleEmailSettingsChange("smtpUsername", e.target.value)}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={formData.emailSettings.smtpPassword}
                      onChange={(e) => handleEmailSettingsChange("smtpPassword", e.target.value)}
                      placeholder="•••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={formData.emailSettings.fromName}
                      onChange={(e) => handleEmailSettingsChange("fromName", e.target.value)}
                      placeholder="Asset Management System"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={formData.emailSettings.fromEmail}
                      onChange={(e) => handleEmailSettingsChange("fromEmail", e.target.value)}
                      placeholder="noreply@organization.com"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control */}
        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Public Access Settings</span>
              </CardTitle>
              <CardDescription>Configure guest access and public visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="guestPortal">Enable Guest Portal</Label>
                  <p className="text-sm text-gray-500">Allow guests to browse public assets without authentication</p>
                </div>
                <Switch
                  id="guestPortal"
                  checked={formData.guestPortal}
                  onCheckedChange={(value) => handleInputChange("guestPortal", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="publicAssetVisibility">Public Asset Visibility</Label>
                  <p className="text-sm text-gray-500">Show asset details to guests (requires guest portal)</p>
                </div>
                <Switch
                  id="publicAssetVisibility"
                  checked={formData.publicAssetVisibility}
                  onCheckedChange={(value) => handleInputChange("publicAssetVisibility", value)}
                  disabled={!formData.guestPortal}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Maintenance Mode</span>
              </CardTitle>
              <CardDescription>System maintenance and notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Put the system in maintenance mode (staff only access)</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={formData.maintenanceMode}
                  onCheckedChange={(value) => handleInputChange("maintenanceMode", value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemNotification">System Notification</Label>
                <Textarea
                  id="systemNotification"
                  value={formData.systemNotification}
                  onChange={(e) => handleInputChange("systemNotification", e.target.value)}
                  placeholder="Display a system-wide notification to all users"
                  rows={3}
                />
                <p className="text-xs text-gray-500">Leave empty to hide system notifications</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
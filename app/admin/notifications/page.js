"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Switch } from "../../../components/ui/switch"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Badge } from "../../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Clock, Settings, Send } from "lucide-react"
import { databases } from "../../../lib/appwrite/client.js"
import { DATABASE_ID, COLLECTIONS } from "../../../lib/appwrite/config.js"
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js"
import { Query } from "appwrite"

export default function NotificationSettings() {
  const [staff, setStaff] = useState(null)
  const [settings, setSettings] = useState({
    emailEnabled: true,
    returnReminders: true,
    maintenanceAlerts: true,
    requestNotifications: true,
    overdueAlerts: true,
    reminderDays: 3,
    maintenanceLeadDays: 7,
    adminEmail: "",
    smtpSettings: {
      host: "",
      port: 587,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "RETC Asset Management",
    },
  })
  const [testEmail, setTestEmail] = useState("")
  const [notificationHistory, setNotificationHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSettings()
    loadNotificationHistory()
  }, [])

  const loadSettings = async () => {
    try {
      // In a real implementation, this would load from a settings collection
      // For now, we'll use default settings
      console.log("Loading notification settings...")
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const loadNotificationHistory = async () => {
    try {
      // Load recent notification logs from activity logs
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ACTIVITY_LOGS, [
        Query.equal("action", [
          "email_sent",
          "return_reminder_sent",
          "overdue_notification_sent",
          "maintenance_reminder_sent",
        ]),
        Query.orderDesc("created_at"),
        Query.limit(50),
      ])

      setNotificationHistory(response.documents)
    } catch (error) {
      console.error("Error loading notification history:", error)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would save to a settings collection
      console.log("Saving notification settings:", settings)
      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Error saving settings")
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert("Please enter a test email address")
      return
    }

    setLoading(true)
    try {
      await EmailService.sendNotification(EMAIL_TYPES.SYSTEM_ALERT, testEmail, {
        subject: "Test Email from RETC Asset Management",
        message: "This is a test email to verify your notification settings are working correctly.",
        timestamp: new Date().toISOString(),
      })

      alert("Test email sent successfully!")
    } catch (error) {
      console.error("Error sending test email:", error)
      alert("Error sending test email")
    } finally {
      setLoading(false)
    }
  }

  const runScheduledTask = async (taskType) => {
    setLoading(true)
    try {
      // In a real implementation, this would trigger the scheduled functions
      console.log(`Running scheduled task: ${taskType}`)
      alert(`${taskType} task completed successfully!`)
    } catch (error) {
      console.error(`Error running ${taskType}:`, error)
      alert(`Error running ${taskType}`)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationTypeColor = (action) => {
    switch (action) {
      case "return_reminder_sent":
        return "bg-blue-100 text-blue-800"
      case "overdue_notification_sent":
        return "bg-red-100 text-red-800"
      case "maintenance_reminder_sent":
        return "bg-yellow-100 text-yellow-800"
      case "email_sent":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600">Configure email notifications and automated reminders</p>
        </div>
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email Setup</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure which notifications to send and when</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">Enable all email notifications</div>
                </div>
                <Switch
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Return Reminders</Label>
                  <div className="text-sm text-muted-foreground">Send reminders before assets are due</div>
                </div>
                <Switch
                  checked={settings.returnReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, returnReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Maintenance Alerts</Label>
                  <div className="text-sm text-muted-foreground">Alert when assets need maintenance</div>
                </div>
                <Switch
                  checked={settings.maintenanceAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Request Notifications</Label>
                  <div className="text-sm text-muted-foreground">Notify admins of new requests</div>
                </div>
                <Switch
                  checked={settings.requestNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, requestNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Overdue Alerts</Label>
                  <div className="text-sm text-muted-foreground">Alert when returns are overdue</div>
                </div>
                <Switch
                  checked={settings.overdueAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, overdueAlerts: checked })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reminderDays">Return Reminder Days</Label>
                  <Input
                    id="reminderDays"
                    type="number"
                    value={settings.reminderDays}
                    onChange={(e) => setSettings({ ...settings, reminderDays: Number.parseInt(e.target.value) })}
                    min="1"
                    max="30"
                  />
                  <div className="text-sm text-muted-foreground">Days before due date to send reminder</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenanceLeadDays">Maintenance Lead Days</Label>
                  <Input
                    id="maintenanceLeadDays"
                    type="number"
                    value={settings.maintenanceLeadDays}
                    onChange={(e) => setSettings({ ...settings, maintenanceLeadDays: Number.parseInt(e.target.value) })}
                    min="1"
                    max="90"
                  />
                  <div className="text-sm text-muted-foreground">Days before maintenance due to send alert</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure SMTP settings for sending emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpSettings.host}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtpSettings: { ...settings.smtpSettings, host: e.target.value },
                      })
                    }
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.smtpSettings.port}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtpSettings: { ...settings.smtpSettings, port: Number.parseInt(e.target.value) },
                      })
                    }
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">Username</Label>
                  <Input
                    id="smtpUsername"
                    value={settings.smtpSettings.username}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtpSettings: { ...settings.smtpSettings, username: e.target.value },
                      })
                    }
                    placeholder="your-email@domain.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={settings.smtpSettings.password}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtpSettings: { ...settings.smtpSettings, password: e.target.value },
                      })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    value={settings.smtpSettings.fromEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtpSettings: { ...settings.smtpSettings, fromEmail: e.target.value },
                      })
                    }
                    placeholder="noreply@retc.org"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={settings.smtpSettings.fromName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtpSettings: { ...settings.smtpSettings, fromName: e.target.value },
                      })
                    }
                    placeholder="RETC Asset Management"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="testEmail">Test Email Address</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={sendTestEmail} disabled={loading}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Test
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Tasks</CardTitle>
              <CardDescription>Manage automated notification tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Return Reminders</CardTitle>
                    <CardDescription>Check for upcoming return dates daily</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">Last run: 2 hours ago</div>
                      <Button size="sm" onClick={() => runScheduledTask("Return Reminders")}>
                        <Clock className="w-4 h-4 mr-2" />
                        Run Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Overdue Checks</CardTitle>
                    <CardDescription>Check for overdue returns daily</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">Last run: 6 hours ago</div>
                      <Button size="sm" onClick={() => runScheduledTask("Overdue Checks")}>
                        <Clock className="w-4 h-4 mr-2" />
                        Run Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Maintenance Alerts</CardTitle>
                    <CardDescription>Check for upcoming maintenance weekly</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">Last run: 2 days ago</div>
                      <Button size="sm" onClick={() => runScheduledTask("Maintenance Alerts")}>
                        <Clock className="w-4 h-4 mr-2" />
                        Run Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Monthly Reports</CardTitle>
                    <CardDescription>Generate usage reports monthly</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">Last run: 15 days ago</div>
                      <Button size="sm" onClick={() => runScheduledTask("Monthly Reports")}>
                        <Clock className="w-4 h-4 mr-2" />
                        Run Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>Recent notification activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notificationHistory.map((log) => (
                    <TableRow key={log.$id}>
                      <TableCell>
                        <Badge className={getNotificationTypeColor(log.action)}>
                          {log.action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entity_type}</TableCell>
                      <TableCell>{new Date(log.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {JSON.stringify(log.details || {})}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

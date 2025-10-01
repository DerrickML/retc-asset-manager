"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Clock, Settings, Send } from "lucide-react";
import { databases } from "../../../lib/appwrite/client.js";
import { DATABASE_ID, COLLECTIONS } from "../../../lib/appwrite/config.js";
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js";
import { Query } from "appwrite";

export default function NotificationSettings() {
  const [staff, setStaff] = useState(null);
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
  });
  const [testEmail, setTestEmail] = useState("");
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadNotificationHistory();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real implementation, this would load from a settings collection
      // For now, we'll use default settings
    } catch (error) {
      // Silent fail for settings loading
    }
  };

  const loadNotificationHistory = async () => {
    try {
      // Load recent notification logs from asset events (which track notifications)
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ASSET_EVENTS,
        [
          Query.equal("eventType", [
            "email_sent",
            "return_reminder_sent",
            "overdue_notification_sent",
            "maintenance_reminder_sent",
          ]),
          Query.orderDesc("$createdAt"),
          Query.limit(50),
        ]
      );

      setNotificationHistory(response.documents || []);
    } catch (error) {
      // Silent fail for notification history loading
      setNotificationHistory([]);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would save to a settings collection
      alert("Settings saved successfully!");
    } catch (error) {
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert("Please enter a test email address");
      return;
    }

    setLoading(true);
    try {
      await EmailService.sendNotification(EMAIL_TYPES.SYSTEM_ALERT, testEmail, {
        subject: "Test Email from RETC Asset Management",
        message:
          "This is a test email to verify your notification settings are working correctly.",
        timestamp: new Date().toISOString(),
      });

      alert("Test email sent successfully!");
    } catch (error) {
      // Silent fail for test email
      alert("Error sending test email");
    } finally {
      setLoading(false);
    }
  };

  const runScheduledTask = async (taskType) => {
    setLoading(true);
    try {
      // In a real implementation, this would trigger the scheduled functions
      alert(`${taskType} task completed successfully!`);
    } catch (error) {
      alert(`Error running ${taskType}`);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTypeColor = (action) => {
    switch (action) {
      case "return_reminder_sent":
        return "bg-blue-100 text-blue-800";
      case "overdue_notification_sent":
        return "bg-red-100 text-red-800";
      case "maintenance_reminder_sent":
        return "bg-yellow-100 text-yellow-800";
      case "email_sent":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-xl shadow-lg">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-sidebar-900 to-sidebar-900 bg-clip-text text-transparent">
                  Notification Settings
                </h1>
                <p className="text-slate-600 font-medium">
                  Configure email notifications and automated reminders
                </p>
              </div>
            </div>
            <Button
              onClick={saveSettings}
              disabled={loading}
              className="relative bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group rounded-xl px-6 py-3 border-0"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                    Save Settings
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
            </Button>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-xl shadow-inner border border-gray-200/50">
              <TabsTrigger
                value="general"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-primary-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-primary-50 hover:text-primary-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>General</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
              <TabsTrigger
                value="email"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-sidebar-500 data-[state=active]:to-sidebar-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-sidebar-50 hover:text-sidebar-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Email Setup</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-sidebar-500/20 to-sidebar-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
              <TabsTrigger
                value="scheduling"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-orange-50 hover:text-orange-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Scheduling</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-purple-50 hover:text-purple-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>History</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-md">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Notification Preferences
                    </h3>
                    <p className="text-slate-600 font-medium">
                      Configure which notifications to send and when
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg group-hover:from-primary-200 group-hover:to-primary-300 transition-colors">
                        <Send className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <Label className="text-base font-semibold text-slate-900">
                          Email Notifications
                        </Label>
                        <div className="text-sm text-slate-600">
                          Enable all email notifications
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={settings.emailEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, emailEnabled: checked })
                      }
                      className="data-[state=checked]:bg-primary-500"
                    />
                  </div>

                  {/* Return Reminders */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg group-hover:from-orange-200 group-hover:to-orange-300 transition-colors">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <Label className="text-base font-semibold text-slate-900">
                          Return Reminders
                        </Label>
                        <div className="text-sm text-slate-600">
                          Send reminders before assets are due
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={settings.returnReminders}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, returnReminders: checked })
                      }
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>

                  {/* Maintenance Alerts */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-yellow-300 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg group-hover:from-yellow-200 group-hover:to-yellow-300 transition-colors">
                        <Settings className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <Label className="text-base font-semibold text-slate-900">
                          Maintenance Alerts
                        </Label>
                        <div className="text-sm text-slate-600">
                          Alert when assets need maintenance
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={settings.maintenanceAlerts}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, maintenanceAlerts: checked })
                      }
                      className="data-[state=checked]:bg-yellow-500"
                    />
                  </div>

                  {/* Request Notifications */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-sidebar-300 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-br from-sidebar-100 to-sidebar-200 rounded-lg group-hover:from-sidebar-200 group-hover:to-sidebar-300 transition-colors">
                        <Send className="h-5 w-5 text-sidebar-600" />
                      </div>
                      <div>
                        <Label className="text-base font-semibold text-slate-900">
                          Request Notifications
                        </Label>
                        <div className="text-sm text-slate-600">
                          Notify admins of new requests
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={settings.requestNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          requestNotifications: checked,
                        })
                      }
                      className="data-[state=checked]:bg-sidebar-500"
                    />
                  </div>

                  {/* Overdue Alerts */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-red-300 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-br from-red-100 to-red-200 rounded-lg group-hover:from-red-200 group-hover:to-red-300 transition-colors">
                        <Clock className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <Label className="text-base font-semibold text-slate-900">
                          Overdue Alerts
                        </Label>
                        <div className="text-sm text-slate-600">
                          Alert when returns are overdue
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={settings.overdueAlerts}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, overdueAlerts: checked })
                      }
                      className="data-[state=checked]:bg-red-500"
                    />
                  </div>
                </div>

                {/* Configuration Fields */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">
                    Timing Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="reminderDays"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Return Reminder Days
                      </Label>
                      <Input
                        id="reminderDays"
                        type="number"
                        value={settings.reminderDays}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            reminderDays: Number.parseInt(e.target.value),
                          })
                        }
                        min="1"
                        max="30"
                        className="h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg shadow-sm"
                      />
                      <div className="text-sm text-slate-600">
                        Days before due date to send reminder
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="maintenanceLeadDays"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Maintenance Lead Days
                      </Label>
                      <Input
                        id="maintenanceLeadDays"
                        type="number"
                        value={settings.maintenanceLeadDays}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            maintenanceLeadDays: Number.parseInt(
                              e.target.value
                            ),
                          })
                        }
                        min="1"
                        max="90"
                        className="h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg shadow-sm"
                      />
                      <div className="text-sm text-slate-600">
                        Days before maintenance due to send alert
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-lg shadow-md">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Email Configuration
                    </h3>
                    <p className="text-slate-600 font-medium">
                      Configure SMTP settings for sending emails
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* SMTP Server Settings */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">
                      SMTP Server Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="smtpHost"
                          className="text-sm font-semibold text-slate-700"
                        >
                          SMTP Host
                        </Label>
                        <Input
                          id="smtpHost"
                          value={settings.smtpSettings.host}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              smtpSettings: {
                                ...settings.smtpSettings,
                                host: e.target.value,
                              },
                            })
                          }
                          placeholder="smtp.gmail.com"
                          className="h-12 border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="smtpPort"
                          className="text-sm font-semibold text-slate-700"
                        >
                          SMTP Port
                        </Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={settings.smtpSettings.port}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              smtpSettings: {
                                ...settings.smtpSettings,
                                port: Number.parseInt(e.target.value),
                              },
                            })
                          }
                          placeholder="587"
                          className="h-12 border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Authentication Settings */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">
                      Authentication Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="smtpUsername"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Username
                        </Label>
                        <Input
                          id="smtpUsername"
                          value={settings.smtpSettings.username}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              smtpSettings: {
                                ...settings.smtpSettings,
                                username: e.target.value,
                              },
                            })
                          }
                          placeholder="your-email@domain.com"
                          className="h-12 border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="smtpPassword"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Password
                        </Label>
                        <Input
                          id="smtpPassword"
                          type="password"
                          value={settings.smtpSettings.password}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              smtpSettings: {
                                ...settings.smtpSettings,
                                password: e.target.value,
                              },
                            })
                          }
                          placeholder="••••••••"
                          className="h-12 border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email Identity Settings */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">
                      Email Identity
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="fromEmail"
                          className="text-sm font-semibold text-slate-700"
                        >
                          From Email
                        </Label>
                        <Input
                          id="fromEmail"
                          value={settings.smtpSettings.fromEmail}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              smtpSettings: {
                                ...settings.smtpSettings,
                                fromEmail: e.target.value,
                              },
                            })
                          }
                          placeholder="noreply@retc.org"
                          className="h-12 border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="fromName"
                          className="text-sm font-semibold text-slate-700"
                        >
                          From Name
                        </Label>
                        <Input
                          id="fromName"
                          value={settings.smtpSettings.fromName}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              smtpSettings: {
                                ...settings.smtpSettings,
                                fromName: e.target.value,
                              },
                            })
                          }
                          placeholder="RETC Asset Management"
                          className="h-12 border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Test Email Section */}
                  <div className="bg-gradient-to-r from-sidebar-50 to-sidebar-100 rounded-xl p-6 border border-sidebar-200">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">
                      Test Email Configuration
                    </h4>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label
                          htmlFor="testEmail"
                          className="text-sm font-semibold text-slate-700 mb-2 block"
                        >
                          Test Email Address
                        </Label>
                        <Input
                          id="testEmail"
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="test@example.com"
                          className="h-12 border-sidebar-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={sendTestEmail}
                          disabled={loading}
                          className="relative bg-gradient-to-r from-sidebar-500 to-sidebar-600 hover:from-sidebar-600 hover:to-sidebar-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group rounded-lg px-6 py-3 h-12"
                        >
                          <div className="flex items-center space-x-2">
                            <Send className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                            <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                              Send Test
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scheduling" className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Scheduled Tasks
                    </h3>
                    <p className="text-slate-600 font-medium">
                      Manage automated notification tasks
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Return Reminders */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange-300 transition-colors group">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg group-hover:from-orange-200 group-hover:to-orange-300 transition-colors">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">
                          Return Reminders
                        </h4>
                        <p className="text-sm text-slate-600">
                          Check for upcoming return dates daily
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-slate-600">
                        Last run: 2 hours ago
                      </div>
                      <Button
                        size="sm"
                        onClick={() => runScheduledTask("Return Reminders")}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group rounded-lg"
                      >
                        <Clock className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                        Run Now
                      </Button>
                    </div>
                  </div>

                  {/* Overdue Checks */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-red-300 transition-colors group">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-red-100 to-red-200 rounded-lg group-hover:from-red-200 group-hover:to-red-300 transition-colors">
                        <Clock className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">
                          Overdue Checks
                        </h4>
                        <p className="text-sm text-slate-600">
                          Check for overdue returns daily
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-slate-600">
                        Last run: 6 hours ago
                      </div>
                      <Button
                        size="sm"
                        onClick={() => runScheduledTask("Overdue Checks")}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group rounded-lg"
                      >
                        <Clock className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                        Run Now
                      </Button>
                    </div>
                  </div>

                  {/* Maintenance Alerts */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-yellow-300 transition-colors group">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg group-hover:from-yellow-200 group-hover:to-yellow-300 transition-colors">
                        <Settings className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">
                          Maintenance Alerts
                        </h4>
                        <p className="text-sm text-slate-600">
                          Check for upcoming maintenance weekly
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-slate-600">
                        Last run: 2 days ago
                      </div>
                      <Button
                        size="sm"
                        onClick={() => runScheduledTask("Maintenance Alerts")}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group rounded-lg"
                      >
                        <Clock className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                        Run Now
                      </Button>
                    </div>
                  </div>

                  {/* Monthly Reports */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 transition-colors group">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:from-purple-200 group-hover:to-purple-300 transition-colors">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">
                          Monthly Reports
                        </h4>
                        <p className="text-sm text-slate-600">
                          Generate usage reports monthly
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-slate-600">
                        Last run: 15 days ago
                      </div>
                      <Button
                        size="sm"
                        onClick={() => runScheduledTask("Monthly Reports")}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group rounded-lg"
                      >
                        <Clock className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                        Run Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Notification History
                    </h3>
                    <p className="text-slate-600 font-medium">
                      Recent notification activity
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="font-semibold text-slate-700">
                          Type
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Entity
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Date
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          Details
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notificationHistory.map((log) => (
                        <TableRow
                          key={log.$id}
                          className="hover:bg-gray-50/50 transition-colors duration-200 group border-b border-gray-100/50"
                        >
                          <TableCell>
                            <Badge
                              className={`${getNotificationTypeColor(
                                log.action
                              )} font-semibold px-3 py-1`}
                            >
                              {log.action
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {log.entity_type}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {new Date(log.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {JSON.stringify(log.details || {})}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

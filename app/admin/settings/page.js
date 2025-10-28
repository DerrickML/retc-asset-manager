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
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Switch } from "../../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
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
  Users,
} from "lucide-react";
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js";
import { settingsService } from "../../../lib/appwrite/provider.js";
import { useToastContext } from "../../../components/providers/toast-provider";

export default function AdminSettings() {
  const toast = useToastContext();
  const [staff, setStaff] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      fromEmail: "",
    },
  });

  useEffect(() => {
    checkPermissionsAndLoadSettings();
  }, []);

  const checkPermissionsAndLoadSettings = async () => {
    try {
      const currentStaff = await getCurrentStaff();
      if (!currentStaff || !permissions.isSystemAdmin(currentStaff)) {
        window.location.href = "/unauthorized";
        return;
      }
      setStaff(currentStaff);
      await loadSettings();
    } catch (error) {
      // Failed to load data - will show error state
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const systemSettings = await settingsService.get();
      if (systemSettings) {
        setSettings(systemSettings);
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
            fromEmail: systemSettings.emailSettings?.fromEmail || "",
          },
        });
      }
    } catch (error) {
      // Failed to load settings - will use defaults
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await settingsService.update(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadSettings(); // Refresh data
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmailSettingsChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      emailSettings: {
        ...prev.emailSettings,
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <p className="text-slate-700 font-medium">Loading Settings</p>
              <p className="text-slate-500 text-sm">
                Preparing system configuration...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  System Settings
                </h1>
                <p className="text-slate-600 font-medium">
                  Configure system-wide settings and preferences
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {saveSuccess && (
                <div className="flex items-center space-x-2 text-primary-600 bg-primary-50 px-4 py-2 rounded-lg border border-primary-200">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Settings saved!</span>
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="relative bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group rounded-xl px-6 py-3 border-0"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                      Save Changes
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6">
          <Tabs defaultValue="organization" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-xl shadow-inner border border-gray-200/50">
              <TabsTrigger
                value="organization"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-primary-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-primary-50 hover:text-primary-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Organization</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-sidebar-500 data-[state=active]:to-sidebar-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-sidebar-50 hover:text-sidebar-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>System</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-sidebar-500/20 to-sidebar-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
              <TabsTrigger
                value="email"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-orange-50 hover:text-orange-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Email</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
              <TabsTrigger
                value="access"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-purple-50 hover:text-purple-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Access Control</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
              <TabsTrigger
                value="maintenance"
                className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 font-semibold transition-all duration-300 rounded-xl py-3 px-4 group hover:bg-red-50 hover:text-red-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Maintenance</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </TabsTrigger>
            </TabsList>

            {/* Organization Settings */}
            <TabsContent value="organization" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Organization Details Card */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-md">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Organization Details
                      </h3>
                      <p className="text-slate-600 font-medium">
                        Basic information about your organization
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="organizationName"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Organization Name *
                      </Label>
                      <Input
                        id="organizationName"
                        value={formData.organizationName}
                        onChange={(e) =>
                          handleInputChange("organizationName", e.target.value)
                        }
                        placeholder="Your Organization Name"
                        className="h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg shadow-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="organizationDescription"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Description
                      </Label>
                      <Textarea
                        id="organizationDescription"
                        value={formData.organizationDescription}
                        onChange={(e) =>
                          handleInputChange(
                            "organizationDescription",
                            e.target.value
                          )
                        }
                        placeholder="Brief description of your organization"
                        rows={3}
                        className="border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg shadow-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="organizationLogo"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Logo URL
                      </Label>
                      <Input
                        id="organizationLogo"
                        value={formData.organizationLogo}
                        onChange={(e) =>
                          handleInputChange("organizationLogo", e.target.value)
                        }
                        placeholder="https://example.com/logo.png"
                        className="h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Card */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-lg shadow-md">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Contact Information
                      </h3>
                      <p className="text-slate-600 font-medium">
                        Contact details for your organization
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="contactEmail"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Contact Email
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) =>
                          handleInputChange("contactEmail", e.target.value)
                        }
                        placeholder="contact@organization.com"
                        className="h-12 border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="contactPhone"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Contact Phone
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) =>
                          handleInputChange("contactPhone", e.target.value)
                        }
                        placeholder="+1 (555) 123-4567"
                        className="h-12 border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="address"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Address
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        placeholder="Organization address"
                        rows={3}
                        className="border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Regional Settings Card */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-lg shadow-md">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Regional Settings
                      </h3>
                      <p className="text-slate-600 font-medium">
                        Configure timezone, date format, and currency
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="timezone"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Timezone
                      </Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(value) =>
                          handleInputChange("timezone", value)
                        }
                      >
                        <SelectTrigger className="h-12 border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-30">
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">
                            Eastern Time
                          </SelectItem>
                          <SelectItem value="America/Chicago">
                            Central Time
                          </SelectItem>
                          <SelectItem value="America/Denver">
                            Mountain Time
                          </SelectItem>
                          <SelectItem value="America/Los_Angeles">
                            Pacific Time
                          </SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                          <SelectItem value="Australia/Sydney">
                            Sydney
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="dateFormat"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Date Format
                      </Label>
                      <Select
                        value={formData.dateFormat}
                        onValueChange={(value) =>
                          handleInputChange("dateFormat", value)
                        }
                      >
                        <SelectTrigger className="h-12 border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-30">
                          <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                          <SelectItem value="MMM dd, yyyy">
                            MMM DD, YYYY
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="currencySymbol"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Currency Symbol
                      </Label>
                      <Input
                        id="currencySymbol"
                        value={formData.currencySymbol}
                        onChange={(e) =>
                          handleInputChange("currencySymbol", e.target.value)
                        }
                        placeholder="$"
                        className="h-12 border-gray-300 focus:border-sidebar-500 focus:ring-sidebar-500/20 rounded-lg shadow-sm max-w-20"
                      />
                    </div>
                  </div>
                </div>

                {/* Request Settings Card */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
                      <Database className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Request Settings
                      </h3>
                      <p className="text-slate-600 font-medium">
                        Configure asset request parameters
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="autoApprovalThreshold"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Auto-Approval Threshold ($)
                      </Label>
                      <Input
                        id="autoApprovalThreshold"
                        type="number"
                        value={formData.autoApprovalThreshold}
                        onChange={(e) =>
                          handleInputChange(
                            "autoApprovalThreshold",
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg shadow-sm"
                      />
                      <p className="text-xs text-slate-500">
                        Requests below this value are auto-approved (0 = manual
                        approval only)
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="maxRequestDuration"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Max Request Duration (days)
                      </Label>
                      <Input
                        id="maxRequestDuration"
                        type="number"
                        value={formData.maxRequestDuration}
                        onChange={(e) =>
                          handleInputChange(
                            "maxRequestDuration",
                            parseInt(e.target.value) || 30
                          )
                        }
                        placeholder="30"
                        className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg shadow-sm"
                      />
                      <p className="text-xs text-slate-500">
                        Maximum number of days assets can be requested
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
                      <Switch
                        id="emailNotifications"
                        checked={formData.emailNotifications}
                        onCheckedChange={(value) =>
                          handleInputChange("emailNotifications", value)
                        }
                        className="data-[state=checked]:bg-orange-500"
                      />
                      <Label
                        htmlFor="emailNotifications"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Enable Email Notifications
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Email Settings */}
            <TabsContent value="email" className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      SMTP Configuration
                    </h3>
                    <p className="text-slate-600 font-medium">
                      Configure email server settings for notifications
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="smtpHost"
                        className="text-sm font-semibold text-slate-700"
                      >
                        SMTP Host
                      </Label>
                      <Input
                        id="smtpHost"
                        value={formData.emailSettings.smtpHost}
                        onChange={(e) =>
                          handleEmailSettingsChange("smtpHost", e.target.value)
                        }
                        placeholder="smtp.gmail.com"
                        className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg shadow-sm"
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
                        value={formData.emailSettings.smtpPort}
                        onChange={(e) =>
                          handleEmailSettingsChange(
                            "smtpPort",
                            parseInt(e.target.value) || 587
                          )
                        }
                        placeholder="587"
                        className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg shadow-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="smtpUsername"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Username
                      </Label>
                      <Input
                        id="smtpUsername"
                        value={formData.emailSettings.smtpUsername}
                        onChange={(e) =>
                          handleEmailSettingsChange(
                            "smtpUsername",
                            e.target.value
                          )
                        }
                        placeholder="your-email@gmail.com"
                        className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
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
                        value={formData.emailSettings.smtpPassword}
                        onChange={(e) =>
                          handleEmailSettingsChange(
                            "smtpPassword",
                            e.target.value
                          )
                        }
                        placeholder="•••••••••"
                        className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg shadow-sm"
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
                        value={formData.emailSettings.fromName}
                        onChange={(e) =>
                          handleEmailSettingsChange("fromName", e.target.value)
                        }
                        placeholder="Asset Management System"
                        className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg shadow-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="fromEmail"
                        className="text-sm font-semibold text-slate-700"
                      >
                        From Email
                      </Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={formData.emailSettings.fromEmail}
                        onChange={(e) =>
                          handleEmailSettingsChange("fromEmail", e.target.value)
                        }
                        placeholder="noreply@organization.com"
                        className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Access Control */}
            <TabsContent value="access" className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Public Access Settings
                    </h3>
                    <p className="text-slate-600 font-medium">
                      Configure guest access and public visibility
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 transition-colors group">
                    <div className="space-y-1">
                      <Label
                        htmlFor="guestPortal"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Enable Guest Portal
                      </Label>
                      <p className="text-sm text-slate-500">
                        Allow guests to browse public assets without
                        authentication
                      </p>
                    </div>
                    <Switch
                      id="guestPortal"
                      checked={formData.guestPortal}
                      onCheckedChange={(value) =>
                        handleInputChange("guestPortal", value)
                      }
                      className="data-[state=checked]:bg-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 transition-colors group">
                    <div className="space-y-1">
                      <Label
                        htmlFor="publicAssetVisibility"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Public Asset Visibility
                      </Label>
                      <p className="text-sm text-slate-500">
                        Show asset details to guests (requires guest portal)
                      </p>
                    </div>
                    <Switch
                      id="publicAssetVisibility"
                      checked={formData.publicAssetVisibility}
                      onCheckedChange={(value) =>
                        handleInputChange("publicAssetVisibility", value)
                      }
                      disabled={!formData.guestPortal}
                      className="data-[state=checked]:bg-purple-500"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Maintenance */}
            <TabsContent value="maintenance" className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200/30 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Maintenance Mode
                    </h3>
                    <p className="text-slate-600 font-medium">
                      System maintenance and notification settings
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-red-300 transition-colors group">
                    <div className="space-y-1">
                      <Label
                        htmlFor="maintenanceMode"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Maintenance Mode
                      </Label>
                      <p className="text-sm text-slate-500">
                        Put the system in maintenance mode (staff only access)
                      </p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={formData.maintenanceMode}
                      onCheckedChange={(value) =>
                        handleInputChange("maintenanceMode", value)
                      }
                      className="data-[state=checked]:bg-red-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="systemNotification"
                      className="text-sm font-semibold text-slate-700"
                    >
                      System Notification
                    </Label>
                    <Textarea
                      id="systemNotification"
                      value={formData.systemNotification}
                      onChange={(e) =>
                        handleInputChange("systemNotification", e.target.value)
                      }
                      placeholder="Display a system-wide notification to all users"
                      rows={3}
                      className="border-gray-300 focus:border-red-500 focus:ring-red-500/20 rounded-lg shadow-sm"
                    />
                    <p className="text-xs text-slate-500">
                      Leave empty to hide system notifications
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

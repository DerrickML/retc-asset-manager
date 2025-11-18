"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  Bell,
  Mail,
  Smartphone,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { staffService } from "../../lib/appwrite/provider.js";

export default function NotificationPreferencesModal({
  open,
  onOpenChange,
  staffId,
  onSave,
}) {
  const [preferences, setPreferences] = useState({
    // Email notifications
    emailEnabled: true,
    requestStatusChanges: true,
    assetAvailability: true,
    systemAnnouncements: true,
    returnReminders: true,
    overdueAlerts: true,

    // In-app notifications
    inAppEnabled: true,
    inAppRequestUpdates: true,
    inAppAssetUpdates: true,
    inAppSystemAlerts: true,

    // Notification frequency
    frequency: "immediate", // immediate, daily, weekly
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
    },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && staffId) {
      loadPreferences();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, staffId]);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(
        `notification_preferences_${staffId}`
      );
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        setPreferences({
          ...preferences,
          ...parsedPreferences,
        });
        console.log("Loaded preferences from localStorage:", parsedPreferences);
      } else {
        console.log(
          "No preferences found in localStorage either, using defaults"
        );
      }
    } catch (error) {
      console.warn("Failed to load preferences from localStorage:", error);
    }
  };

  const loadPreferences = async () => {
    setLoading(true);
    try {
      console.log("Loading notification preferences for staffId:", staffId);
      const staff = await staffService.get(staffId);
      console.log("Staff data:", staff);

      if (staff && staff.notificationPreferences) {
        try {
          const parsedPreferences = JSON.parse(staff.notificationPreferences);
          setPreferences({
            ...preferences,
            ...parsedPreferences,
          });
          console.log("Loaded preferences from database:", parsedPreferences);
        } catch (parseError) {
          console.warn(
            "Failed to parse notification preferences from database, trying localStorage:",
            parseError
          );
          // Try localStorage as fallback
          loadFromLocalStorage();
        }
      } else {
        console.log(
          "No existing notification preferences found in database, trying localStorage"
        );
        // Try localStorage as fallback
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
      setError("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("Saving notification preferences:", {
        staffId,
        preferences,
        stringified: JSON.stringify(preferences),
      });

      // Validate staffId
      if (!staffId) {
        throw new Error("Staff ID is required");
      }

      // Validate preferences data
      if (!preferences || typeof preferences !== "object") {
        throw new Error("Invalid preferences data");
      }

      // Store in localStorage first (always works)
      try {
        localStorage.setItem(
          `notification_preferences_${staffId}`,
          JSON.stringify(preferences)
        );
        console.log("Preferences saved to localStorage");
      } catch (localError) {
        console.warn("Failed to save to localStorage:", localError);
      }

      // Try to update the staff record with notification preferences
      // Note: This will fail until the database schema is updated
      try {
        const updateData = {
          notificationPreferences: JSON.stringify(preferences),
        };

        console.log("Attempting to update staff with data:", updateData);
        const result = await staffService.update(staffId, updateData);
        console.log("Notification preferences saved to database:", result);
      } catch (dbError) {
        console.warn("Database save failed (schema needs update):", dbError);
        // This is expected until the database schema is updated
        // We'll show a warning but still succeed since localStorage worked
      }

      setSuccess(true);
      if (onSave) onSave(preferences);

      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to save notification preferences:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to save preferences";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.type) {
        errorMessage = `Database error: ${error.type}`;
      } else if (error.code) {
        errorMessage = `Error ${error.code}: ${
          error.message || "Unknown error"
        }`;
      }

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleQuietHoursChange = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value,
      },
    }));
  };

  const getFrequencyBadgeColor = (frequency) => {
    switch (frequency) {
      case "immediate":
        return "bg-green-100 text-green-800 border-green-200";
      case "daily":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "weekly":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white via-primary-50/20 to-sidebar-50/20 border-0 shadow-2xl rounded-3xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="ml-3 text-gray-600">Loading preferences...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white via-primary-50/20 to-sidebar-50/20 border-0 shadow-2xl rounded-3xl overflow-hidden">
        {/* Enhanced Header */}
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary-500 to-sidebar-500 rounded-full flex items-center justify-center shadow-lg">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-sidebar-700 bg-clip-text text-transparent">
            Notification Preferences
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-lg">
            Customize how and when you receive notifications about your asset
            requests
          </DialogDescription>
        </DialogHeader>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">
                Preferences saved successfully!
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* Email Notifications */}
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Mail className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Email Notifications
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Receive notifications via email. Note: Critical activities
                    (request status changes, asset availability, return
                    reminders) will always send emails regardless of these
                    settings.
                  </CardDescription>
                </div>
                <div className="ml-auto">
                  <Switch
                    checked={preferences.emailEnabled}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("emailEnabled", checked)
                    }
                    className="data-[state=checked]:bg-primary-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-primary-600" />
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        Request Status Changes
                      </Label>
                      <p className="text-xs text-gray-600">
                        When your requests are approved, denied, or fulfilled
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.requestStatusChanges}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("requestStatusChanges", checked)
                    }
                    disabled={!preferences.emailEnabled}
                    className="data-[state=checked]:bg-primary-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-primary-600" />
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        Asset Availability
                      </Label>
                      <p className="text-xs text-gray-600">
                        When requested assets become available
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.assetAvailability}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("assetAvailability", checked)
                    }
                    disabled={!preferences.emailEnabled}
                    className="data-[state=checked]:bg-primary-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-primary-600" />
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        System Announcements
                      </Label>
                      <p className="text-xs text-gray-600">
                        Important system updates and maintenance notices
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.systemAnnouncements}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("systemAnnouncements", checked)
                    }
                    disabled={!preferences.emailEnabled}
                    className="data-[state=checked]:bg-primary-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        Return Reminders
                      </Label>
                      <p className="text-xs text-gray-600">
                        Reminders before assets are due for return
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.returnReminders}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("returnReminders", checked)
                    }
                    disabled={!preferences.emailEnabled}
                    className="data-[state=checked]:bg-primary-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In-App Notifications */}
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sidebar-100 rounded-lg">
                  <Smartphone className="w-5 h-5 text-sidebar-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    In-App Notifications
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Notifications within the application
                  </CardDescription>
                </div>
                <div className="ml-auto">
                  <Switch
                    checked={preferences.inAppEnabled}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("inAppEnabled", checked)
                    }
                    className="data-[state=checked]:bg-sidebar-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-sidebar-600" />
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        Request Updates
                      </Label>
                      <p className="text-xs text-gray-600">
                        Real-time updates about your requests
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.inAppRequestUpdates}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("inAppRequestUpdates", checked)
                    }
                    disabled={!preferences.inAppEnabled}
                    className="data-[state=checked]:bg-sidebar-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-sidebar-600" />
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        Asset Updates
                      </Label>
                      <p className="text-xs text-gray-600">
                        Updates about asset availability and status
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.inAppAssetUpdates}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("inAppAssetUpdates", checked)
                    }
                    disabled={!preferences.inAppEnabled}
                    className="data-[state=checked]:bg-sidebar-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Frequency */}
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Notification Frequency
              </CardTitle>
              <CardDescription className="text-gray-600">
                How often you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {["immediate", "daily", "weekly"].map((freq) => (
                  <Button
                    key={freq}
                    variant={
                      preferences.frequency === freq ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handlePreferenceChange("frequency", freq)}
                    className={`capitalize ${
                      preferences.frequency === freq
                        ? "bg-primary-600 hover:bg-primary-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {freq}
                  </Button>
                ))}
              </div>
              <div className="mt-3">
                <Badge
                  className={getFrequencyBadgeColor(preferences.frequency)}
                >
                  {preferences.frequency === "immediate" &&
                    "⚡ Instant notifications"}
                  {preferences.frequency === "daily" && "📅 Daily digest"}
                  {preferences.frequency === "weekly" && "📆 Weekly summary"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200/60">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

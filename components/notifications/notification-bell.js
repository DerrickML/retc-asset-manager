"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuHeader,
} from "../ui/dropdown-menu";
import { notificationService } from "../../lib/services/notification-service.js";
import { useAuth } from "../../lib/appwrite/provider.js";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationService.getByUser(user.$id, 10, 0);
      setNotifications(result.documents || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount(user.$id);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.$id === notificationId
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(user.$id);
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "REQUEST_APPROVED":
        return "✅";
      case "REQUEST_REJECTED":
        return "❌";
      case "ASSET_ISSUED":
        return "📦";
      case "LOW_STOCK":
        return "⚠️";
      case "MAINTENANCE":
        return "🔧";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === "high") return "text-red-600";
    if (priority === "medium") return "text-blue-600";
    if (priority === "low") return "text-gray-600";

    switch (type) {
      case "REQUEST_APPROVED":
        return "text-green-600";
      case "REQUEST_REJECTED":
        return "text-red-600";
      case "ASSET_ISSUED":
        return "text-blue-600";
      case "LOW_STOCK":
        return "text-orange-600";
      case "MAINTENANCE":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-gray-700" />
          ) : (
            <Bell className="h-5 w-5 text-gray-500" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
        sideOffset={5}
      >
        <DropdownMenuHeader className="px-3 py-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuHeader>

        <DropdownMenuSeparator />

        {loading ? (
          <div className="px-3 py-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
            <p className="mt-2 text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.$id}
              className={`px-3 py-3 cursor-pointer hover:bg-gray-50 ${
                !notification.read ? "bg-blue-50/50" : ""
              }`}
              onClick={() => handleMarkAsRead(notification.$id)}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-lg">
                    {getNotificationIcon(notification.type)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm font-medium ${getNotificationColor(
                        notification.type,
                        notification.priority
                      )}`}
                    >
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.$createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="px-3 py-2 text-center text-blue-600 hover:bg-blue-50">
              <span className="text-sm font-medium">
                View all notifications
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { databases, Query } from "../appwrite/client.js";
import { APPWRITE_CONFIG, COLLECTIONS } from "../appwrite/config.js";
import { stringifyJsonField } from "../utils/validation.js";

class NotificationService {
  /**
   * Create a new notification
   * @param {Object} notificationData - The notification data
   * @returns {Promise<Object>} The created notification
   */
  async create(notificationData) {
    try {
      const preparedData = {
        ...notificationData,
        data: stringifyJsonField(notificationData.data),
        metadata: stringifyJsonField(notificationData.metadata),
      };

      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.NOTIFICATIONS,
        "unique()",
        preparedData
      );
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Get notifications for a specific user
   * @param {string} userId - The user ID
   * @param {number} limit - Number of notifications to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} The notifications
   */
  async getByUser(userId, limit = 20, offset = 0) {
    try {
      const queries = [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.offset(offset),
      ];

      return await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.NOTIFICATIONS,
        queries
      );
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      throw error;
    }
  }

  /**
   * Get unread notifications count for a user
   * @param {string} userId - The user ID
   * @returns {Promise<number>} The unread count
   */
  async getUnreadCount(userId) {
    try {
      const queries = [
        Query.equal("userId", userId),
        Query.equal("read", false),
      ];

      const result = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.NOTIFICATIONS,
        queries
      );

      return result.total || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - The notification ID
   * @returns {Promise<Object>} The updated notification
   */
  async markAsRead(notificationId) {
    try {
      return await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.NOTIFICATIONS,
        notificationId,
        {
          read: true,
          readAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} The update result
   */
  async markAllAsRead(userId) {
    try {
      // Get all unread notifications for the user
      const unreadNotifications = await this.getByUser(userId, 1000, 0);

      // Mark each as read
      const updatePromises = unreadNotifications.documents
        .filter((notification) => !notification.read)
        .map((notification) => this.markAsRead(notification.$id));

      await Promise.all(updatePromises);

      return { success: true, updated: updatePromises.length };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - The notification ID
   * @returns {Promise<Object>} The deletion result
   */
  async delete(notificationId) {
    try {
      return await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.NOTIFICATIONS,
        notificationId
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  /**
   * Create notification for asset request approval
   * @param {string} userId - The user ID
   * @param {Object} requestData - The request data
   * @returns {Promise<Object>} The created notification
   */
  async notifyRequestApproved(userId, requestData) {
    try {
      return await this.create({
        userId,
        type: "REQUEST_APPROVED",
        title: "Asset Request Approved",
        message: `Your request for ${requestData.assetName} has been approved.`,
        data: {
          requestId: requestData.requestId,
          assetName: requestData.assetName,
          approvedBy: requestData.approvedBy,
          approvedAt: requestData.approvedAt,
        },
        priority: "medium",
        read: false,
      });
    } catch (error) {
      console.error("Error creating approval notification:", error);
      throw error;
    }
  }

  /**
   * Create notification for asset request rejection
   * @param {string} userId - The user ID
   * @param {Object} requestData - The request data
   * @returns {Promise<Object>} The created notification
   */
  async notifyRequestRejected(userId, requestData) {
    try {
      return await this.create({
        userId,
        type: "REQUEST_REJECTED",
        title: "Asset Request Rejected",
        message: `Your request for ${
          requestData.assetName
        } has been rejected. Reason: ${
          requestData.reason || "No reason provided"
        }`,
        data: {
          requestId: requestData.requestId,
          assetName: requestData.assetName,
          rejectedBy: requestData.rejectedBy,
          rejectedAt: requestData.rejectedAt,
          reason: requestData.reason,
        },
        priority: "high",
        read: false,
      });
    } catch (error) {
      console.error("Error creating rejection notification:", error);
      throw error;
    }
  }

  /**
   * Create notification for asset issuance
   * @param {string} userId - The user ID
   * @param {Object} assetData - The asset data
   * @returns {Promise<Object>} The created notification
   */
  async notifyAssetIssued(userId, assetData) {
    try {
      return await this.create({
        userId,
        type: "ASSET_ISSUED",
        title: "Asset Issued",
        message: `Asset ${assetData.assetName} has been issued to you.`,
        data: {
          assetId: assetData.assetId,
          assetName: assetData.assetName,
          issuedAt: assetData.issuedAt,
          issuedBy: assetData.issuedBy,
        },
        priority: "medium",
        read: false,
      });
    } catch (error) {
      console.error("Error creating asset issued notification:", error);
      throw error;
    }
  }

  /**
   * Create notification for low stock alert
   * @param {string} userId - The user ID (admin)
   * @param {Object} consumableData - The consumable data
   * @returns {Promise<Object>} The created notification
   */
  async notifyLowStock(userId, consumableData) {
    try {
      return await this.create({
        userId,
        type: "LOW_STOCK",
        title: "Low Stock Alert",
        message: `Consumable ${consumableData.name} is running low on stock (${consumableData.currentStock} remaining).`,
        data: {
          consumableId: consumableData.consumableId,
          name: consumableData.name,
          currentStock: consumableData.currentStock,
          minStock: consumableData.minStock,
        },
        priority: "high",
        read: false,
      });
    } catch (error) {
      console.error("Error creating low stock notification:", error);
      throw error;
    }
  }

  /**
   * Create notification for system maintenance
   * @param {string} userId - The user ID
   * @param {Object} maintenanceData - The maintenance data
   * @returns {Promise<Object>} The created notification
   */
  async notifyMaintenance(userId, maintenanceData) {
    try {
      return await this.create({
        userId,
        type: "MAINTENANCE",
        title: "System Maintenance",
        message: maintenanceData.message,
        data: {
          scheduledAt: maintenanceData.scheduledAt,
          duration: maintenanceData.duration,
          affectedServices: maintenanceData.affectedServices,
        },
        priority: maintenanceData.priority || "medium",
        read: false,
      });
    } catch (error) {
      console.error("Error creating maintenance notification:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;

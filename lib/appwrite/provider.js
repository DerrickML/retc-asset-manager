"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { account, databases, storage } from "./client.js";
import { APPWRITE_CONFIG, COLLECTIONS, ENUMS } from "./config.js";
import { Query } from "appwrite";
import { EmailService } from "../services/email.js";

// Helper function to write asset events (immutable audit trail)
export async function writeAssetEvent(
  assetId,
  eventType,
  fromValue = null,
  toValue = null,
  actorStaffId,
  notes = null
) {
  try {
    const eventData = {
      assetId,
      eventType,
      fromValue: fromValue || null, // Store enum string values or null
      toValue: toValue || null, // Store enum string values or null
      actorStaffId,
      at: new Date().toISOString(),
      notes,
    };

    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_EVENTS,
      "unique()",
      eventData
    );
  } catch (error) {
    throw error;
  }
}

// Helper function to parse JSON fields safely
function parseJsonField(field) {
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch (error) {
      return field;
    }
  }
  return field;
}

// Helper function to stringify JSON fields for storage
function stringifyJsonField(field) {
  if (typeof field === "object" && field !== null) {
    try {
      return JSON.stringify(field);
    } catch (error) {
      return field;
    }
  }
  return field;
}

// Settings operations (singleton collection)
export const settingsService = {
  async get() {
    try {
      const result = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.SETTINGS
      );
      const settings = result.documents[0];

      if (!settings) return null;

      // Parse JSON fields that are stored as strings in Appwrite
      return {
        ...settings,
        branding: parseJsonField(settings.branding),
        approval: {
          ...parseJsonField(settings.approval || "{}"),
          thresholds: parseJsonField(
            settings.approval?.thresholds || settings.thresholds
          ),
        },
        reminders: {
          ...parseJsonField(settings.reminders || "{}"),
          overdueDays: parseJsonField(
            settings.reminders?.overdueDays || settings.overdueDays
          ),
        },
        smtpSettings: parseJsonField(settings.smtpSettings),
      };
    } catch (error) {
      return null;
    }
  },

  async create(data) {
    // Stringify JSON fields before storing
    const preparedData = {
      ...data,
      branding: stringifyJsonField(data.branding),
      approval: stringifyJsonField(data.approval),
      reminders: stringifyJsonField(data.reminders),
      smtpSettings: stringifyJsonField(data.smtpSettings),
    };

    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.SETTINGS,
      "unique()",
      preparedData
    );
  },

  async update(documentId, data) {
    // Stringify JSON fields before storing
    const preparedData = {
      ...data,
      branding: data.branding ? stringifyJsonField(data.branding) : undefined,
      approval: data.approval ? stringifyJsonField(data.approval) : undefined,
      reminders: data.reminders
        ? stringifyJsonField(data.reminders)
        : undefined,
      smtpSettings: data.smtpSettings
        ? stringifyJsonField(data.smtpSettings)
        : undefined,
    };

    // Remove undefined fields
    Object.keys(preparedData).forEach((key) => {
      if (preparedData[key] === undefined) {
        delete preparedData[key];
      }
    });

    return await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.SETTINGS,
      documentId,
      preparedData
    );
  },
};

// Departments operations
export const departmentsService = {
  async list() {
    return await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.DEPARTMENTS
    );
  },

  async get(id) {
    return await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.DEPARTMENTS,
      id
    );
  },

  async create(data) {
    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.DEPARTMENTS,
      "unique()",
      data
    );
  },

  async update(id, data) {
    return await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.DEPARTMENTS,
      id,
      data
    );
  },

  async delete(id) {
    return await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.DEPARTMENTS,
      id
    );
  },
};

// Staff operations
export const staffService = {
  async list(queries = []) {
    return await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.STAFF,
      queries
    );
  },

  async listForSelection() {
    const result = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.STAFF,
      [Query.orderAsc("name")]
    );
    return result.documents.map((staff) => ({
      $id: staff.$id,
      name: staff.name,
      email: staff.email,
      department: staff.department,
    }));
  },

  async get(id) {
    return await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.STAFF,
      id
    );
  },

  async getByUserId(userId) {
    const result = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.STAFF,
      [Query.equal("userId", userId)]
    );
    return result.documents[0] || null;
  },

  async create(data) {
    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.STAFF,
      "unique()",
      data
    );
  },

  async update(id, data) {
    return await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.STAFF,
      id,
      data
    );
  },

  async delete(id) {
    return await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.STAFF,
      id
    );
  },
};

// Assets operations
export const assetsService = {
  async list(queries = []) {
    const result = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSETS,
      queries
    );

    // Return assets directly (Appwrite handles arrays natively)
    return result;
  },

  async get(id) {
    const asset = await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSETS,
      id
    );

    // Return asset directly (Appwrite handles arrays natively)
    return asset;
  },

  async getByAssetTag(assetTag) {
    const result = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSETS,
      [Query.equal("assetTag", assetTag)]
    );
    const asset = result.documents[0];

    if (!asset) return null;

    // Return asset directly (Appwrite handles arrays natively)
    return asset;
  },

  async getByStaff(staffId) {
    const result = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSETS,
      [Query.equal("custodianStaffId", staffId), Query.orderDesc("$createdAt")]
    );

    // Return results directly (Appwrite handles arrays natively)
    return result;
  },

  async create(data, actorStaffId) {
    // Prepare data for Appwrite (arrays should be passed as actual arrays, not JSON strings)
    const preparedData = {
      ...data,
      attachmentFileIds: data.attachmentFileIds || [],
    };

    // Remove undefined and null fields
    Object.keys(preparedData).forEach((key) => {
      if (preparedData[key] === undefined || preparedData[key] === null) {
        delete preparedData[key];
      }
    });

    const asset = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSETS,
      "unique()",
      preparedData
    );

    // Write creation event
    if (actorStaffId) {
      await writeAssetEvent(
        asset.$id,
        ENUMS.EVENT_TYPE.CREATED,
        null,
        preparedData.currentCondition,
        actorStaffId,
        "Asset created"
      );
    }

    return asset;
  },

  async update(id, data, actorStaffId, notes = null, options = {}) {
    const oldAsset = await this.get(id);

    // Prepare data for Appwrite (arrays should be passed as actual arrays, not JSON strings)
    const preparedData = {
      ...data,
      attachmentFileIds:
        data.attachmentFileIds !== undefined
          ? data.attachmentFileIds
          : undefined,
    };

    // Remove undefined fields
    Object.keys(preparedData).forEach((key) => {
      if (preparedData[key] === undefined) {
        delete preparedData[key];
      }
    });

    const updatedAsset = await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSETS,
      id,
      preparedData
    );

    // Get actor staff details for notifications
    const actorStaff = actorStaffId
      ? await staffService.get(actorStaffId).catch(() => null)
      : null;

    // Write appropriate events based on what changed
    if (oldAsset.availableStatus !== data.availableStatus) {
      await writeAssetEvent(
        id,
        ENUMS.EVENT_TYPE.STATUS_CHANGED,
        oldAsset.availableStatus,
        data.availableStatus,
        actorStaffId,
        notes
      );
    }

    if (oldAsset.currentCondition !== data.currentCondition) {
      await writeAssetEvent(
        id,
        ENUMS.EVENT_TYPE.CONDITION_CHANGED,
        oldAsset.currentCondition,
        data.currentCondition,
        actorStaffId,
        notes
      );
    }

    // Check for custodian assignment change and send notification
    if (
      oldAsset.custodianStaffId !== data.custodianStaffId &&
      data.custodianStaffId
    ) {
      try {
        const newCustodian = await staffService.get(data.custodianStaffId);
        if (
          newCustodian &&
          newCustodian.email &&
          options.sendNotification !== false
        ) {
          await EmailService.sendAssetAssigned(
            updatedAsset,
            newCustodian,
            actorStaff,
            notes
          );
        }
      } catch (error) {
        // Silent fail for notification
      }
    }

    // Check for maintenance due date and send notification if approaching
    if (data.nextMaintenanceDue && options.checkMaintenanceDue !== false) {
      const maintenanceDueDate = new Date(data.nextMaintenanceDue);
      const now = new Date();
      const daysUntilMaintenance = Math.ceil(
        (maintenanceDueDate - now) / (1000 * 60 * 60 * 24)
      );

      // Send notification if maintenance is due within 7 days
      if (daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0) {
        try {
          const custodian = data.custodianStaffId
            ? await staffService.get(data.custodianStaffId).catch(() => null)
            : null;
          if (options.sendNotification !== false) {
            await EmailService.sendMaintenanceDue(updatedAsset, custodian);
          }
        } catch (error) {
          // Silent fail for notification
        }
      }
    }

    return updatedAsset;
  },

  async delete(id) {
    return await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSETS,
      id
    );
  },

  // Get public projection for guest portal
  async getPublicAssets(queries = []) {
    const publicQueries = [Query.equal("isPublic", true), ...queries];
    const result = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSETS,
      publicQueries
    );

    // Project only public fields and parse JSON arrays
    return {
      ...result,
      documents: result.documents.map((asset) => ({
        $id: asset.$id,
        name: asset.name,
        category: asset.category,
        publicSummary: asset.publicSummary,
        availableStatus: asset.availableStatus,
        publicConditionLabel: asset.publicConditionLabel,
        publicLocationLabel: asset.publicLocationLabel,
        publicImages: asset.publicImages || "",
      })),
    };
  },
};

// Asset Requests operations with email notifications
export const assetRequestsService = {
  async list(queries = []) {
    return await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_REQUESTS,
      queries
    );
  },

  async get(id) {
    return await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_REQUESTS,
      id
    );
  },

  async getByStaff(staffId) {
    return await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_REQUESTS,
      [Query.equal("requesterStaffId", staffId), Query.orderDesc("$createdAt")]
    );
  },

  async create(data, options = {}) {
    const request = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_REQUESTS,
      "unique()",
      data
    );

    // Send notification to admins about new request
    if (options.sendNotification !== false) {
      try {
        await EmailService.sendRequestSubmitted(
          request,
          options.requester,
          options.asset
        );
      } catch (error) {
        // Silent fail for notification
      }
    }

    return request;
  },

  async update(id, data, options = {}) {
    const oldRequest = await this.get(id);
    const updatedRequest = await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_REQUESTS,
      id,
      data
    );

    // Send notifications based on status changes
    if (
      options.sendNotification !== false &&
      oldRequest.status !== data.status
    ) {
      try {
        switch (data.status) {
          case ENUMS.REQUEST_STATUS.APPROVED:
            if (options.requester && options.asset && options.approver) {
              await EmailService.sendRequestApproved(
                updatedRequest,
                options.requester,
                options.asset,
                options.approver
              );
            }
            break;
          case ENUMS.REQUEST_STATUS.DENIED:
            if (options.requester && options.asset && options.approver) {
              await EmailService.sendRequestDenied(
                updatedRequest,
                options.requester,
                options.asset,
                options.approver
              );
            }
            break;
          case ENUMS.REQUEST_STATUS.FULFILLED:
            if (options.requester && options.asset && options.issuer) {
              await EmailService.sendAssetIssued(
                updatedRequest,
                options.requester,
                options.asset,
                options.issuer
              );
            }
            break;
        }
      } catch (error) {
        // Silent fail for notification
      }
    }

    return updatedRequest;
  },

  async delete(id) {
    return await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_REQUESTS,
      id
    );
  },
};

// Asset Issues operations
export const assetIssuesService = {
  async list(queries = []) {
    return await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_ISSUES,
      queries
    );
  },

  async get(id) {
    return await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_ISSUES,
      id
    );
  },

  async create(data) {
    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_ISSUES,
      "unique()",
      data
    );
  },

  async update(id, data) {
    return await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_ISSUES,
      id,
      data
    );
  },
};

// Asset Returns operations
export const assetReturnsService = {
  async list(queries = []) {
    return await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_RETURNS,
      queries
    );
  },

  async get(id) {
    return await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_RETURNS,
      id
    );
  },

  async create(data, options = {}) {
    const returnRecord = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_RETURNS,
      "unique()",
      data
    );

    // Send email notification about asset return if enabled
    if (
      options.sendNotification !== false &&
      options.request &&
      options.requester &&
      options.asset
    ) {
      try {
        await EmailService.sendAssetReturned(
          options.request,
          options.requester,
          options.asset,
          data.returnCondition
        );
      } catch (error) {
        // Silent fail for notification
      }
    }

    return returnRecord;
  },
};

// Asset Events operations (read-only audit trail)
export const assetEventsService = {
  async list(queries = []) {
    const result = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_EVENTS,
      queries
    );

    // Parse JSON fields in the results
    return {
      ...result,
      documents: result.documents.map((event) => ({
        ...event,
        // fromValue: parseJsonField(event.fromValue),
        // toValue: parseJsonField(event.toValue),
      })),
    };
  },

  async getByAssetId(assetId) {
    const result = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_EVENTS,
      [Query.equal("assetId", assetId), Query.orderDesc("at")]
    );

    // Parse JSON fields in the results
    return {
      ...result,
      documents: result.documents.map((event) => ({
        ...event,
        // fromValue: parseJsonField(event.fromValue),
        // toValue: parseJsonField(event.toValue),
      })),
    };
  },
};

// Storage operations
export const storageService = {
  async uploadFile(bucketId, file, fileId = "unique()") {
    return await storage.createFile(bucketId, fileId, file);
  },

  async getFile(bucketId, fileId) {
    return await storage.getFile(bucketId, fileId);
  },

  async getFilePreview(bucketId, fileId, width = 400, height = 400) {
    return storage.getFilePreview(bucketId, fileId, width, height);
  },

  async getFileDownload(bucketId, fileId) {
    return storage.getFileDownload(bucketId, fileId);
  },

  async deleteFile(bucketId, fileId) {
    return await storage.deleteFile(bucketId, fileId);
  },
};

// Authentication context and provider
const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);

      // Get staff record
      const staffRecord = await staffService.getByUserId(currentUser.$id);
      setStaff(staffRecord);
    } catch (error) {
      setUser(null);
      setStaff(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      await checkAuth();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      setStaff(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    staff,
    loading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

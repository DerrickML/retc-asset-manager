"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { account, databases, storage } from "./client.js";
import { APPWRITE_CONFIG, COLLECTIONS, ENUMS } from "./config.js";
import { Query, ID } from "appwrite";
import { EmailService } from "../services/email.js";
import { getCurrentOrgId } from "../utils/org.js";

const buildOrgQueries = (queries = []) => {
  const orgId = getCurrentOrgId();
  if (!orgId) return queries;
  return [Query.equal("orgId", orgId), ...queries];
};

const ensureOrgId = (data = {}) => {
  const orgId = data.orgId || getCurrentOrgId();
  return orgId ? { ...data, orgId } : { ...data };
};

const isMissingOrgAttributeError = (error) =>
  error?.message &&
  typeof error.message === "string" &&
  error.message.includes("Attribute not found in schema: orgId");

const isConflictError = (error) =>
  error?.code === 409 ||
  error?.type === "document_already_exists" ||
  (typeof error?.message === "string" && error.message.includes("already exists"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runWithRetry(operation, { retries = 2, delay = 250 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const isNetworkError =
        error?.message === "Failed to fetch" ||
        error?.code === "network_error" ||
        error?.type === "network_error";

      const shouldRetry = isNetworkError && attempt < retries;

      if (!shouldRetry) {
        throw error;
      }

      const backoff = delay * (attempt + 1);
      await sleep(backoff);
    }
  }

  throw lastError;
}

function sanitizeEventValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value.length > 100 ? value.slice(0, 100) : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    const stringValue = String(value);
    return stringValue.length > 100 ? stringValue.slice(0, 100) : stringValue;
  }

  try {
    const stringValue = JSON.stringify(value);
    return stringValue.length > 100 ? stringValue.slice(0, 100) : stringValue;
  } catch (error) {
    const fallback = String(value);
    return fallback.length > 100 ? fallback.slice(0, 100) : fallback;
  }
}

// Helper function to write asset events (immutable audit trail)
export async function writeAssetEvent(
  assetId,
  eventType,
  fromValue = null,
  toValue = null,
  actorStaffId,
  notes = null
) {
  const eventData = {
    assetId,
    eventType,
    fromValue: sanitizeEventValue(fromValue),
    toValue: sanitizeEventValue(toValue),
    actorStaffId,
    at: new Date().toISOString(),
    notes,
    orgId: getCurrentOrgId() || undefined,
  };

  const maxAttempts = 5;
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.ASSET_EVENTS,
        ID.unique(),
        eventData
      );
    } catch (error) {
      lastError = error;

      if (!isConflictError(error)) {
        throw error;
      }
    }
  }

  if (isConflictError(lastError)) {
    console.warn("Asset event conflict ignored after retries", lastError);
    return null;
  }

  throw lastError;
}

// Helper function to parse JSON fields safely
function parseJsonField(field) {
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch (error) {
      console.warn("Failed to parse JSON field:", field, error);
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
      console.warn("Failed to stringify JSON field:", field, error);
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
  async list(queries = []) {
    try {
      return await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.DEPARTMENTS,
        buildOrgQueries(queries)
      );
    } catch (error) {
      if (isMissingOrgAttributeError(error)) {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTIONS.DEPARTMENTS,
          queries
        );
      }
      throw error;
    }
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
      ID.unique(),
      ensureOrgId(data)
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

export const projectsService = {
  async list(queries = []) {
    try {
      return await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.PROJECTS,
        buildOrgQueries(queries)
      );
    } catch (error) {
      if (
        error?.message &&
        typeof error.message === "string" &&
        error.message.includes("Attribute not found in schema: orgId")
      ) {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTIONS.PROJECTS,
          queries
        );
      }
      throw error;
    }
  },
};

// Staff operations
export const staffService = {
  async list(queries = []) {
    try {
      const result = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.STAFF,
        buildOrgQueries(queries)
      );

      if (result.total > 0 || queries.length === 0) {
        return result;
      }

      // Fallback to legacy behaviour when no documents match org filter
      return await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.STAFF,
        queries
      );
    } catch (error) {
      if (isMissingOrgAttributeError(error)) {
        return await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTIONS.STAFF,
          queries
        );
      }
      throw error;
    }
  },

  async listForSelection() {
    try {
      const result = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.STAFF,
        buildOrgQueries([Query.orderAsc("name")])
      );

      const documents = result.total > 0 ? result.documents : (
        await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTIONS.STAFF,
          [Query.orderAsc("name")]
        )
      ).documents;

      return (documents || []).map((staff) => ({
        $id: staff.$id,
        name: staff.name,
        email: staff.email,
        department: staff.department,
      }));
    } catch (error) {
      if (isMissingOrgAttributeError(error)) {
        const legacyResult = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTIONS.STAFF,
          [Query.orderAsc("name")]
        );
        return (legacyResult.documents || []).map((staff) => ({
          $id: staff.$id,
          name: staff.name,
          email: staff.email,
          department: staff.department,
        }));
      }
      throw error;
    }
  },

  async get(id) {
    return await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.STAFF,
      id
    );
  },

  async getByUserId(userId) {
    try {
      const result = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.STAFF,
        buildOrgQueries([Query.equal("userId", userId)])
      );
      if (result.total > 0) {
        return result.documents[0];
      }

      // Fallback for legacy staff documents without orgId
      const legacyResult = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        COLLECTIONS.STAFF,
        [Query.equal("userId", userId)]
      );
      return legacyResult.documents[0] || null;
    } catch (error) {
      if (isMissingOrgAttributeError(error)) {
        const legacyResult = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTIONS.STAFF,
          [Query.equal("userId", userId)]
        );
        return legacyResult.documents[0] || null;
      }
      throw error;
    }
  },

  async create(data) {
    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.STAFF,
      "unique()",
      ensureOrgId(data)
    );
  },

  async update(id, data) {
    return await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.STAFF,
      id,
      ensureOrgId(data)
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
      buildOrgQueries(queries)
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
      buildOrgQueries([Query.equal("assetTag", assetTag)])
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
      buildOrgQueries([
        Query.equal("custodianStaffId", staffId),
        Query.orderDesc("$createdAt"),
      ])
    );

    // Return results directly (Appwrite handles arrays natively)
    return result;
  },

  async create(data, actorStaffId) {
    const preparedData = ensureOrgId({
      ...data,
      attachmentFileIds: data.attachmentFileIds || [],
    });

    // Remove null and undefined values to avoid schema validation errors
    Object.keys(preparedData).forEach((key) => {
      if (preparedData[key] === undefined || preparedData[key] === null) {
        delete preparedData[key];
      }
    });

    // Handle projectId based on organization
    // RETC uses placeholder "RETC_NO_PROJECT" since Appwrite schema requires projectId
    // NREP requires a valid projectId
    const retcOrgId = process.env.NEXT_PUBLIC_RETC_ORG_ID;
    const isRetcOrg = preparedData.orgId && retcOrgId && preparedData.orgId.toString() === retcOrgId.toString();
    
    if (isRetcOrg) {
      // For RETC, ensure placeholder value is set (form should already set this)
      // If somehow missing, set the placeholder to satisfy schema requirement
      if (!preparedData.projectId || preparedData.projectId === "") {
        preparedData.projectId = "RETC_NO_PROJECT";
      }
    } else {
      // For NREP or other orgs, remove projectId only if it's empty/invalid
      if (
        !preparedData.projectId ||
        preparedData.projectId === "" ||
        (typeof preparedData.projectId === "string" && preparedData.projectId.trim() === "")
      ) {
        delete preparedData.projectId;
      }
    }

    if (preparedData.assetTag) {
      const tagQueries = [Query.equal("assetTag", preparedData.assetTag)];
      if (preparedData.orgId) {
        tagQueries.push(Query.equal("orgId", preparedData.orgId));
      }

      const conflictError = new Error(
        "An asset with this tag already exists for this organisation."
      );
      conflictError.code = "asset_tag_conflict";

      try {
        const existing = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          COLLECTIONS.ASSETS,
          tagQueries
        );

        if (existing.total > 0) {
          throw conflictError;
        }
      } catch (checkError) {
        if (checkError.code === "asset_tag_conflict") {
          throw checkError;
        }

        if (isMissingOrgAttributeError(checkError)) {
          const legacyExisting = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            COLLECTIONS.ASSETS,
            [Query.equal("assetTag", preparedData.assetTag)]
          );

          if (legacyExisting.total > 0) {
            throw conflictError;
          }
        } else {
          throw checkError;
        }
      }
    }

    const item = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSETS,
      ID.unique(),
      preparedData
    );

    // Write creation event - handle both assets and consumables
    if (actorStaffId) {
      const eventType =
        preparedData.itemType === ENUMS.ITEM_TYPE.CONSUMABLE
          ? "Consumable created"
          : "Asset created";

      const conditionValue =
        preparedData.itemType === ENUMS.ITEM_TYPE.CONSUMABLE
          ? preparedData.status // For consumables, use status
          : preparedData.currentCondition; // For assets, use currentCondition

      try {
        await writeAssetEvent(
          item.$id,
          ENUMS.EVENT_TYPE.CREATED,
          null,
          conditionValue,
          actorStaffId,
          eventType
        );
      } catch (eventError) {
        console.warn("Failed to write asset creation event", eventError);
      }
    }

    return item;
  },

  async update(id, data, actorStaffId, notes = null, options = {}) {
    const oldAsset = await this.get(id);

    const preparedData = {
      ...data,
      orgId: oldAsset.orgId,
      attachmentFileIds:
        data.attachmentFileIds !== undefined
          ? data.attachmentFileIds
          : undefined,
    };

    // Remove undefined and null fields
    Object.keys(preparedData).forEach((key) => {
      if (preparedData[key] === undefined || preparedData[key] === null) {
        delete preparedData[key];
      }
    });

    // Handle projectId based on organization
    // RETC uses placeholder "RETC_NO_PROJECT" since Appwrite schema requires projectId
    // NREP requires a valid projectId
    const retcOrgId = process.env.NEXT_PUBLIC_RETC_ORG_ID;
    const isRetcOrg = preparedData.orgId && retcOrgId && preparedData.orgId.toString() === retcOrgId.toString();
    
    if (isRetcOrg) {
      // For RETC, ensure placeholder value is set (form should already set this)
      // If somehow missing, set the placeholder to satisfy schema requirement
      if (!preparedData.projectId || preparedData.projectId === "") {
        preparedData.projectId = "RETC_NO_PROJECT";
      }
    } else {
      // For NREP or other orgs, remove projectId only if it's empty/invalid
      if (
        !preparedData.projectId ||
        preparedData.projectId === "" ||
        (typeof preparedData.projectId === "string" && preparedData.projectId.trim() === "")
      ) {
        delete preparedData.projectId;
      }
    }

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
      try {
        await writeAssetEvent(
          id,
          ENUMS.EVENT_TYPE.STATUS_CHANGED,
          oldAsset.availableStatus,
          data.availableStatus,
          actorStaffId,
          notes
        );
      } catch (eventError) {
        if (!isConflictError(eventError)) {
          console.warn("Failed to write asset status change event", eventError);
        }
      }
    }

    if (oldAsset.currentCondition !== data.currentCondition) {
      try {
        await writeAssetEvent(
          id,
          ENUMS.EVENT_TYPE.CONDITION_CHANGED,
          oldAsset.currentCondition,
          data.currentCondition,
          actorStaffId,
          notes
        );
      } catch (eventError) {
        if (!isConflictError(eventError)) {
          console.warn("Failed to write asset condition change event", eventError);
        }
      }
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
        console.warn("Failed to send asset assignment notification:", error);
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
          console.warn("Failed to send maintenance due notification:", error);
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
    const publicQueries = buildOrgQueries([
      Query.equal("isPublic", true),
      ...queries,
    ]);
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
        assetImage: asset.assetImage, // Include assetImage for image display
        locationName: asset.locationName,
        roomOrArea: asset.roomOrArea,
      })),
    };
  },

  // ================================
  // Unified Item Management (Assets + Consumables)
  // ================================

  // Get items by type (assets or consumables)
  async getByItemType(itemType, queries = []) {
    const typeQueries = [Query.equal("itemType", itemType), ...queries];
    return await this.list(typeQueries);
  },

  // Get all assets
  async getAssets(queries = []) {
    return await this.getByItemType(ENUMS.ITEM_TYPE.ASSET, queries);
  },

  // Get all consumables
  async getConsumables(queries = []) {
    return await this.getByItemType(ENUMS.ITEM_TYPE.CONSUMABLE, queries);
  },

  // Get public consumables (for staff browsing)
  async getPublicConsumables(queries = []) {
    const publicQueries = buildOrgQueries([
      Query.equal("itemType", ENUMS.ITEM_TYPE.CONSUMABLE),
      ...queries,
    ]);
    const result = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSETS,
      publicQueries
    );

    return {
      ...result,
      documents: result.documents.map((consumable) => ({
        $id: consumable.$id,
        name: consumable.name,
        category: consumable.category,
        publicSummary: consumable.publicSummary,
        status: consumable.status,
        currentStock: consumable.currentStock,
        unit: consumable.unit,
        publicImages: consumable.publicImages || "",
        consumableImage: consumable.consumableImage,
        locationName: consumable.locationName,
        roomOrArea: consumable.roomOrArea,
        isPublic: consumable.isPublic,
      })),
    };
  },

  // Calculate consumable status based on stock
  calculateConsumableStatus(currentStock, minStock) {
    if (currentStock <= 0) return ENUMS.CONSUMABLE_STATUS.OUT_OF_STOCK;
    if (currentStock <= minStock) return ENUMS.CONSUMABLE_STATUS.LOW_STOCK;
    return ENUMS.CONSUMABLE_STATUS.IN_STOCK;
  },

  // Adjust consumable stock
  async adjustConsumableStock(id, adjustment, actorStaffId, notes = null) {
    const consumable = await this.get(id);

    if (consumable.itemType !== ENUMS.ITEM_TYPE.CONSUMABLE) {
      throw new Error("Item is not a consumable");
    }

    // Get current stock from proper field (with fallback to old encoded format)
    let currentStock = 0;
    if (consumable.currentStock !== undefined) {
      currentStock = consumable.currentStock;
    } else if (consumable.serialNumber && consumable.serialNumber.startsWith("STOCK:")) {
      currentStock = parseInt(consumable.serialNumber.replace("STOCK:", "")) || 0;
    }

    // Get min stock from proper field (with fallback to old encoded format)
    let minStock = 0;
    if (consumable.minimumStock !== undefined) {
      minStock = consumable.minimumStock;
    } else if (consumable.model && consumable.model.startsWith("MIN:")) {
      minStock = parseInt(consumable.model.replace("MIN:", "")) || 0;
    }

    const newStock = currentStock + adjustment;
    if (newStock < 0) {
      throw new Error("Stock cannot be negative");
    }

    const newStatus = this.calculateConsumableStatus(newStock, minStock);

    // Update using proper database fields
    const updateData = {
      currentStock: newStock,
      status: newStatus,
    };

    const result = await this.update(
      id,
      updateData,
      actorStaffId,
      notes || `Stock adjusted by ${adjustment > 0 ? "+" : ""}${adjustment}`
    );

    if (actorStaffId) {
      const eventType = "Consumable stock adjusted";

      try {
        await writeAssetEvent(
          id,
          ENUMS.EVENT_TYPE.STOCK_ADJUSTED,
          consumable.currentStock,
          newStock,
          actorStaffId,
          eventType
        );
      } catch (eventError) {
        if (!isConflictError(eventError)) {
          console.warn("Failed to write consumable adjustment event", eventError);
        }
      }
    }

    return result;
  },
};

// Asset Requests operations with email notifications
export const assetRequestsService = {
  async list(queries = []) {
    try {
      return await runWithRetry(
        () =>
          databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            COLLECTIONS.ASSET_REQUESTS,
            buildOrgQueries(queries)
          ),
        { retries: 2, delay: 300 }
      );
    } catch (error) {
      console.error("Failed to load asset requests", error);

      if (error?.message === "Failed to fetch") {
        throw new Error(
          "Unable to reach the asset requests service. Please check your network connection and try again."
        );
      }

      throw error;
    }
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
      buildOrgQueries([
        Query.equal("requesterStaffId", staffId),
        Query.orderDesc("$createdAt"),
      ])
    );
  },

  async create(data, options = {}) {
    const payload = ensureOrgId(data);
    const request = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_REQUESTS,
      ID.unique(),
      payload
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
        console.warn("Failed to send request notification:", error);
      }
    }

    return request;
  },

  async update(id, data, options = {}) {
    const oldRequest = await this.get(id);

    const payload = ensureOrgId({
      requesterStaffId: oldRequest.requesterStaffId,
      purpose: data.purpose ?? oldRequest.purpose,
      issueDate: data.issueDate ?? oldRequest.issueDate,
      expectedReturnDate: data.expectedReturnDate ?? oldRequest.expectedReturnDate,
      requestedItems: data.requestedItems ?? oldRequest.requestedItems,
      status: data.status ?? oldRequest.status,
      orgId: oldRequest.orgId,
    });
    const updatedRequest = await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_REQUESTS,
      id,
      payload
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
        console.warn("Failed to send status update notification:", error);
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
      buildOrgQueries(queries)
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
    const payload = ensureOrgId(data);
    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_ISSUES,
      ID.unique(),
      payload
    );
  },

  async update(id, data) {
    const existing = await this.get(id);
    const payload = {
      ...data,
      orgId: existing.orgId,
    };
    return await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_ISSUES,
      id,
      payload
    );
  },
};

// Asset Returns operations
export const assetReturnsService = {
  async list(queries = []) {
    return await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_RETURNS,
      buildOrgQueries(queries)
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
    const payload = ensureOrgId(data);
    const returnRecord = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_RETURNS,
      ID.unique(),
      payload
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
        console.warn("Failed to send asset return notification:", error);
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
      buildOrgQueries(queries)
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
      buildOrgQueries([
        Query.equal("assetId", assetId),
        Query.orderDesc("at"),
      ])
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

  async create(data) {
    return await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSET_EVENTS,
      "unique()",
      data
    );
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

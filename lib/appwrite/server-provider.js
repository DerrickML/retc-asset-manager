// Server-only provider for API routes (no "use client")
import { databases } from "./client.js"
import { APPWRITE_CONFIG, COLLECTIONS, ENUMS } from "./config.js"
import { Query, ID } from "appwrite"
import { getCurrentOrgId } from "../utils/org.js"

const buildOrgQueries = (queries = []) => {
  const orgId = getCurrentOrgId()
  if (!orgId) return queries
  return [Query.equal("orgId", orgId), ...queries]
}

const ensureOrgId = (data = {}) => {
  const orgId = data.orgId || getCurrentOrgId()
  return orgId ? { ...data, orgId } : { ...data }
}

// Helper function to parse JSON fields safely
function parseJsonField(field) {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field)
    } catch (error) {
      console.warn('Failed to parse JSON field:', field, error)
      return field
    }
  }
  return field
}

// Helper function to stringify JSON fields for storage
function stringifyJsonField(field) {
  if (typeof field === 'object' && field !== null) {
    try {
      return JSON.stringify(field)
    } catch (error) {
      console.warn('Failed to stringify JSON field:', field, error)
      return field
    }
  }
  return field
}

// Settings operations (singleton collection)
export const settingsService = {
  async get() {
    try {
      const result = await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.SETTINGS)
      const settings = result.documents[0]
      
      if (!settings) return null
      
      // Parse JSON fields that are stored as strings in Appwrite
      return {
        ...settings,
        branding: parseJsonField(settings.branding),
        approval: {
          ...parseJsonField(settings.approval || '{}'),
          thresholds: parseJsonField(settings.approval?.thresholds || settings.thresholds)
        },
        reminders: {
          ...parseJsonField(settings.reminders || '{}'),
          overdueDays: parseJsonField(settings.reminders?.overdueDays || settings.overdueDays)
        },
        smtpSettings: parseJsonField(settings.smtpSettings),
      }
    } catch (error) {
      console.error("Failed to get settings:", error)
      return null
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
    }
    
    return await databases.createDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.SETTINGS, "unique()", preparedData)
  },

  async update(documentId, data) {
    // Stringify JSON fields before storing
    const preparedData = {
      ...data,
      branding: data.branding ? stringifyJsonField(data.branding) : undefined,
      approval: data.approval ? stringifyJsonField(data.approval) : undefined,
      reminders: data.reminders ? stringifyJsonField(data.reminders) : undefined,
      smtpSettings: data.smtpSettings ? stringifyJsonField(data.smtpSettings) : undefined,
    }
    
    // Remove undefined fields
    Object.keys(preparedData).forEach(key => {
      if (preparedData[key] === undefined) {
        delete preparedData[key]
      }
    })
    
    return await databases.updateDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.SETTINGS, documentId, preparedData)
  },
}

// Assets operations
export const assetsService = {
  async list(queries = []) {
    const result = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      COLLECTIONS.ASSETS,
      buildOrgQueries(queries)
    )
    
    // Parse JSON array fields in the results
    return {
      ...result,
      documents: result.documents.map(asset => ({
        ...asset,
        publicImages: parseJsonField(asset.publicImages) || [],
        attachmentFileIds: parseJsonField(asset.attachmentFileIds) || [],
        specifications: parseJsonField(asset.specifications),
        metadata: parseJsonField(asset.metadata),
      }))
    }
  },

  async get(id) {
    const asset = await databases.getDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSETS, id)
    
    // Parse JSON array fields in the result
    return {
      ...asset,
      publicImages: parseJsonField(asset.publicImages) || [],
      attachmentFileIds: parseJsonField(asset.attachmentFileIds) || [],
      specifications: parseJsonField(asset.specifications),
      metadata: parseJsonField(asset.metadata),
    }
  },

  // Get public projection for guest portal
  async getPublicAssets(queries = []) {
    const publicQueries = buildOrgQueries([Query.equal("isPublic", true), ...queries])
    const result = await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSETS, publicQueries)

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
        publicImages: parseJsonField(asset.publicImages) || [],
      })),
    }
  },
}
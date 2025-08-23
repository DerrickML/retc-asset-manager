"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { account, databases, storage } from "./client.js"
import { APPWRITE_CONFIG, COLLECTIONS, ENUMS } from "./config.js"
import { Query } from "appwrite"

// Helper function to write asset events (immutable audit trail)
export async function writeAssetEvent(
  assetId,
  eventType,
  fromValue = null,
  toValue = null,
  actorStaffId,
  notes = null,
) {
  try {
    const eventData = {
      assetId,
      eventType,
      fromValue: fromValue ? JSON.stringify(fromValue) : null,
      toValue: toValue ? JSON.stringify(toValue) : null,
      actorStaffId,
      at: new Date().toISOString(),
      notes,
    }

    return await databases.createDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_EVENTS, "unique()", eventData)
  } catch (error) {
    console.error("Failed to write asset event:", error)
    throw error
  }
}

// Settings operations (singleton collection)
export const settingsService = {
  async get() {
    try {
      const result = await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.SETTINGS)
      return result.documents[0] || null
    } catch (error) {
      console.error("Failed to get settings:", error)
      return null
    }
  },

  async create(data) {
    return await databases.createDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.SETTINGS, "unique()", data)
  },

  async update(documentId, data) {
    return await databases.updateDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.SETTINGS, documentId, data)
  },
}

// Departments operations
export const departmentsService = {
  async list() {
    return await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.DEPARTMENTS)
  },

  async get(id) {
    return await databases.getDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.DEPARTMENTS, id)
  },

  async create(data) {
    return await databases.createDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.DEPARTMENTS, "unique()", data)
  },

  async update(id, data) {
    return await databases.updateDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.DEPARTMENTS, id, data)
  },

  async delete(id) {
    return await databases.deleteDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.DEPARTMENTS, id)
  },
}

// Staff operations
export const staffService = {
  async list(queries = []) {
    return await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.STAFF, queries)
  },

  async get(id) {
    return await databases.getDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.STAFF, id)
  },

  async getByUserId(userId) {
    const result = await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.STAFF, [
      Query.equal("userId", userId),
    ])
    return result.documents[0] || null
  },

  async create(data) {
    return await databases.createDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.STAFF, "unique()", data)
  },

  async update(id, data) {
    return await databases.updateDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.STAFF, id, data)
  },

  async delete(id) {
    return await databases.deleteDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.STAFF, id)
  },
}

// Assets operations
export const assetsService = {
  async list(queries = []) {
    return await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSETS, queries)
  },

  async get(id) {
    return await databases.getDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSETS, id)
  },

  async getByAssetTag(assetTag) {
    const result = await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSETS, [
      Query.equal("assetTag", assetTag),
    ])
    return result.documents[0] || null
  },

  async create(data, actorStaffId) {
    const asset = await databases.createDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSETS, "unique()", data)

    // Write creation event
    await writeAssetEvent(asset.$id, ENUMS.EVENT_TYPE.CREATED, null, data, actorStaffId, "Asset created")

    return asset
  },

  async update(id, data, actorStaffId, notes = null) {
    const oldAsset = await this.get(id)
    const updatedAsset = await databases.updateDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSETS, id, data)

    // Write appropriate events based on what changed
    if (oldAsset.availableStatus !== data.availableStatus) {
      await writeAssetEvent(
        id,
        ENUMS.EVENT_TYPE.STATUS_CHANGED,
        oldAsset.availableStatus,
        data.availableStatus,
        actorStaffId,
        notes,
      )
    }

    if (oldAsset.currentCondition !== data.currentCondition) {
      await writeAssetEvent(
        id,
        ENUMS.EVENT_TYPE.CONDITION_CHANGED,
        oldAsset.currentCondition,
        data.currentCondition,
        actorStaffId,
        notes,
      )
    }

    return updatedAsset
  },

  async delete(id) {
    return await databases.deleteDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSETS, id)
  },

  // Get public projection for guest portal
  async getPublicAssets(queries = []) {
    const publicQueries = [Query.equal("isPublic", true), ...queries]
    const result = await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSETS, publicQueries)

    // Project only public fields
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
        publicImages: asset.publicImages || [],
      })),
    }
  },
}

// Asset Requests operations
export const assetRequestsService = {
  async list(queries = []) {
    return await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_REQUESTS, queries)
  },

  async get(id) {
    return await databases.getDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_REQUESTS, id)
  },

  async create(data) {
    return await databases.createDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_REQUESTS, "unique()", data)
  },

  async update(id, data) {
    return await databases.updateDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_REQUESTS, id, data)
  },

  async delete(id) {
    return await databases.deleteDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_REQUESTS, id)
  },
}

// Asset Issues operations
export const assetIssuesService = {
  async list(queries = []) {
    return await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_ISSUES, queries)
  },

  async get(id) {
    return await databases.getDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_ISSUES, id)
  },

  async create(data) {
    return await databases.createDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_ISSUES, "unique()", data)
  },

  async update(id, data) {
    return await databases.updateDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_ISSUES, id, data)
  },
}

// Asset Returns operations
export const assetReturnsService = {
  async list(queries = []) {
    return await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_RETURNS, queries)
  },

  async get(id) {
    return await databases.getDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_RETURNS, id)
  },

  async create(data) {
    return await databases.createDocument(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_RETURNS, "unique()", data)
  },
}

// Asset Events operations (read-only audit trail)
export const assetEventsService = {
  async list(queries = []) {
    return await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_EVENTS, queries)
  },

  async getByAssetId(assetId) {
    return await databases.listDocuments(APPWRITE_CONFIG.databaseId, COLLECTIONS.ASSET_EVENTS, [
      Query.equal("assetId", assetId),
      Query.orderDesc("at"),
    ])
  },
}

// Storage operations
export const storageService = {
  async uploadFile(bucketId, file, fileId = "unique()") {
    return await storage.createFile(bucketId, fileId, file)
  },

  async getFile(bucketId, fileId) {
    return await storage.getFile(bucketId, fileId)
  },

  async getFilePreview(bucketId, fileId, width = 400, height = 400) {
    return storage.getFilePreview(bucketId, fileId, width, height)
  },

  async getFileDownload(bucketId, fileId) {
    return storage.getFileDownload(bucketId, fileId)
  },

  async deleteFile(bucketId, fileId) {
    return await storage.deleteFile(bucketId, fileId)
  },
}

// Authentication context and provider
const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await account.get()
      setUser(currentUser)

      // Get staff record
      const staffRecord = await staffService.getByUserId(currentUser.$id)
      setStaff(staffRecord)
    } catch (error) {
      setUser(null)
      setStaff(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password)
      await checkAuth()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await account.deleteSession("current")
      setUser(null)
      setStaff(null)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    staff,
    loading,
    login,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

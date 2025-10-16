// Appwrite configuration and collection definitions
export const APPWRITE_CONFIG = {
  endpoint:
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://appwrite.nrep.ug/v1",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
};

// Collection IDs - these should match your Appwrite database collections
export const COLLECTIONS = {
  SETTINGS: "68a2f317002426fc90f9",
  DEPARTMENTS: "68a2f3a20034254c3285",
  STAFF: "68a2f49900122499000a",
  ASSETS: "68a2f5600012a7780a8a",
  ASSET_REQUESTS: "68a2fafb000dd6864f5e",
  ASSET_ISSUES: "68a2fffe003661c07e78",
  ASSET_RETURNS: "68a30277001bc8a3e741",
  ASSET_EVENTS: "68a3041a001bb5265a23",
};

export const DATABASE_ID = APPWRITE_CONFIG.databaseId;

export const REQUESTS = COLLECTIONS.ASSET_REQUESTS;

// Storage bucket IDs
export const BUCKETS = {
  ATTACHMENTS: "68a2fbbc002e7db3db22", //bucket for internal files
  PUBLIC_IMAGES: "68a2fbbc002e7db3db22", // Public bucket for asset images
};

// Enums as defined in the specification
export const ENUMS = {
  AVAILABLE_STATUS: {
    AVAILABLE: "AVAILABLE",
    RESERVED: "RESERVED",
    IN_USE: "IN_USE",
    AWAITING_DEPLOY: "AWAITING_DEPLOY",
    MAINTENANCE: "MAINTENANCE",
    REPAIR_REQUIRED: "REPAIR_REQUIRED",
    OUT_FOR_SERVICE: "OUT_FOR_SERVICE",
    AWAITING_RETURN: "AWAITING_RETURN",
    RETIRED: "RETIRED",
    DISPOSED: "DISPOSED",
  },

  CURRENT_CONDITION: {
    NEW: "NEW",
    LIKE_NEW: "LIKE_NEW",
    GOOD: "GOOD",
    FAIR: "FAIR",
    POOR: "POOR",
    DAMAGED: "DAMAGED",
    SCRAP: "SCRAP",
  },

  PUBLIC_CONDITION_LABEL: {
    NEW: "NEW",
    GOOD: "GOOD",
    FAIR: "FAIR",
    OUT_OF_SERVICE: "OUT_OF_SERVICE",
  },

  CATEGORY: {
    IT_EQUIPMENT: "IT_EQUIPMENT",
    NETWORK_HARDWARE: "NETWORK_HARDWARE",
    OFFICE_FURNITURE: "OFFICE_FURNITURE",
    VEHICLE: "VEHICLE",
    POWER_ASSET: "POWER_ASSET",
    TOOLS: "TOOLS",
    HEAVY_MACHINERY: "HEAVY_MACHINERY",
    LAB_EQUIPMENT: "LAB_EQUIPMENT",
    SAFETY_EQUIPMENT: "SAFETY_EQUIPMENT",
    AV_EQUIPMENT: "AV_EQUIPMENT",
    SOFTWARE_LICENSE: "SOFTWARE_LICENSE",
    CONSUMABLE: "CONSUMABLE",
    BUILDING_INFRA: "BUILDING_INFRA",
    // consumable categories
    FLIERS: "FLIERS",
    TEARDROPS: "TEARDROPS",
    BACKDROPS: "BACKDROPS",
    APRONS: "APRONS",
    REFLECTORS: "REFLECTORS",
    MARKERS: "MARKERS",
    INDOOR_BANNERS: "INDOOR_BANNERS",
    OUTDOOR_BANNERS: "OUTDOOR_BANNERS",
    STATIONARY: "STATIONARY",
    EPC: "EPC",
    CAMERAS: "CAMERAS",
    PROJECTORS: "PROJECTORS",
    EXTENSION_CABLES: "EXTENSION_CABLES",
  },

  // Item types to distinguish between assets and consumables
  ITEM_TYPE: {
    ASSET: "ASSET",
    CONSUMABLE: "CONSUMABLE",
  },

  // Consumable-specific enums
  CONSUMABLE_STATUS: {
    IN_STOCK: "IN_STOCK",
    LOW_STOCK: "LOW_STOCK",
    OUT_OF_STOCK: "OUT_OF_STOCK",
    DISCONTINUED: "DISCONTINUED",
  },

  CONSUMABLE_UNIT: {
    PIECE: "PIECE",
    PACK: "PACK",
    BOX: "BOX",
    ROLL: "ROLL",
    SHEET: "SHEET",
    BOTTLE: "BOTTLE",
    CAN: "CAN",
    LITER: "LITER",
    KILOGRAM: "KILOGRAM",
    METER: "METER",
    SET: "SET",
    PAIR: "PAIR",
  },

  CONSUMABLE_CATEGORY: {
    FLIERS: "FLIERS",
    TEARDROPS: "TEARDROPS",
    BACKDROPS: "BACKDROPS",
    APRONS: "APRONS",
    REFLECTORS: "REFLECTORS",
    MARKERS: "MARKERS",
    INDOOR_BANNERS: "INDOOR_BANNERS",
    OUTDOOR_BANNERS: "OUTDOOR_BANNERS",
    STATIONARY: "STATIONARY",
    EPC: "EPC",
    CAMERAS: "CAMERAS",
    PROJECTORS: "PROJECTORS",
    EXTENSION_CABLES: "EXTENSION_CABLES",
  },

  DISTRIBUTION_STATUS: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    DENIED: "DENIED",
    DISTRIBUTED: "DISTRIBUTED",
    CANCELLED: "CANCELLED",
  },

  REQUEST_STATUS: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    DENIED: "DENIED",
    CANCELLED: "CANCELLED",
    FULFILLED: "FULFILLED",
  },

  EVENT_TYPE: {
    CREATED: "CREATED",
    STATUS_CHANGED: "STATUS_CHANGED",
    CONDITION_CHANGED: "CONDITION_CHANGED",
    ASSIGNED: "ASSIGNED",
    RETURNED: "RETURNED",
    LOCATION_CHANGED: "LOCATION_CHANGED",
    RETIRED: "RETIRED",
    DISPOSED: "DISPOSED",
  },

  RETURN_DELTA: {
    GOOD: "GOOD",
    OK: "OK",
    DAMAGED: "DAMAGED",
  },

  ROLES: {
    SYSTEM_ADMIN: "SYSTEM_ADMIN",
    ASSET_ADMIN: "ASSET_ADMIN",
    SENIOR_MANAGER: "SENIOR_MANAGER",
    STAFF: "STAFF",
    CONSUMABLE_ADMIN: "CONSUMABLE_ADMIN",
  },
};

// Default settings for new installations
export const DEFAULT_SETTINGS = {
  branding: JSON.stringify({
    orgName: "Renewable Energy Training Center (RETC)",
    logoFileId: null,
    brandColor: "#059669", // Green(Primary color)
    accentColor: "#2563eb", // Blue-600 (Sidebar/Secondary)
    emailFromName: "RETC Asset Management",
  }),
  approval: JSON.stringify({
    thresholds: {
      value: null,
      durationDays: null,
    },
  }),
  reminders: JSON.stringify({
    preReturnDays: 2,
    overdueDays: [1, 3, 7],
  }),
  guestPortal: true, // Boolean field as expected by Appwrite
  smtpSettings: JSON.stringify({
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
  }),
};

/**
 * Consumable Data Migration Utilities
 *
 * This file provides utilities to migrate from the hacky stock storage mechanism
 * to a proper data structure without breaking existing functionality.
 *
 * Current hacky storage:
 * - serialNumber: "STOCK:123" (current stock)
 * - model: "MIN:123" (minimum stock)
 * - subcategory: "UNIT|STATUS|CATEGORY" (multiple data)
 *
 * Target proper storage:
 * - Use proper fields for consumable-specific data
 * - Maintain backward compatibility during migration
 */

// Helper functions to extract data from hacky storage
export function extractCurrentStock(consumable) {
  if (!consumable?.serialNumber) return 0;
  if (consumable.serialNumber.startsWith("STOCK:")) {
    return parseInt(consumable.serialNumber.replace("STOCK:", "")) || 0;
  }
  return 0;
}

export function extractMinStock(consumable) {
  if (!consumable?.model) return 0;
  if (consumable.model.startsWith("MIN:")) {
    return parseInt(consumable.model.replace("MIN:", "")) || 0;
  }
  return 0;
}

export function extractConsumableStatus(consumable) {
  if (!consumable?.subcategory) return "UNKNOWN";
  const parts = consumable.subcategory.split("|");
  return parts[1] || "UNKNOWN";
}

export function extractConsumableUnit(consumable) {
  if (!consumable?.subcategory) return "pieces";
  const parts = consumable.subcategory.split("|");
  return parts[0] || "pieces";
}

export function extractConsumableCategory(consumable) {
  if (!consumable?.subcategory) return "GENERAL";
  const parts = consumable.subcategory.split("|");
  return parts[2] || "GENERAL";
}

// Helper functions to create proper data structure
export function createProperConsumableData(consumable) {
  const currentStock = extractCurrentStock(consumable);
  const minStock = extractMinStock(consumable);
  const status = extractConsumableStatus(consumable);
  const unit = extractConsumableUnit(consumable);
  const category = extractConsumableCategory(consumable);

  return {
    // Basic asset data (unchanged)
    name: consumable.name,
    description: consumable.description,
    category: consumable.category,
    condition: consumable.condition,
    status: consumable.status,
    location: consumable.location,
    department: consumable.department,
    assignedTo: consumable.assignedTo,
    purchaseDate: consumable.purchaseDate,
    warrantyExpiry: consumable.warrantyExpiry,
    purchasePrice: consumable.purchasePrice,
    supplier: consumable.supplier,
    assetTag: consumable.assetTag,
    assetImage: consumable.assetImage,
    itemType: consumable.itemType,

    // Proper consumable-specific data
    currentStock: currentStock,
    minStock: minStock,
    consumableStatus: status,
    consumableUnit: unit,
    consumableCategory: category,

    // Keep original fields for backward compatibility during migration
    serialNumber: consumable.serialNumber,
    model: consumable.model,
    subcategory: consumable.subcategory,
  };
}

// Helper function to create hacky data for backward compatibility
export function createHackyConsumableData(properData) {
  return {
    ...properData,
    // Override with hacky format for backward compatibility
    serialNumber: `STOCK:${properData.currentStock || 0}`,
    model: `MIN:${properData.minStock || 0}`,
    subcategory: `${properData.consumableUnit || "pieces"}|${
      properData.consumableStatus || "UNKNOWN"
    }|${properData.consumableCategory || "GENERAL"}`,
  };
}

// Migration status checker
export function isConsumableMigrated(consumable) {
  // Check if the consumable has proper data structure
  return (
    consumable.currentStock !== undefined &&
    consumable.minStock !== undefined &&
    consumable.consumableStatus !== undefined &&
    consumable.consumableUnit !== undefined &&
    consumable.consumableCategory !== undefined
  );
}

// Safe data access - works with both old and new formats
export function getConsumableData(consumable) {
  if (isConsumableMigrated(consumable)) {
    // Use proper data structure
    return {
      currentStock: consumable.currentStock,
      minStock: consumable.minStock,
      status: consumable.consumableStatus,
      unit: consumable.consumableUnit,
      category: consumable.consumableCategory,
    };
  } else {
    // Extract from hacky storage
    return {
      currentStock: extractCurrentStock(consumable),
      minStock: extractMinStock(consumable),
      status: extractConsumableStatus(consumable),
      unit: extractConsumableUnit(consumable),
      category: extractConsumableCategory(consumable),
    };
  }
}

// Migration helper for updating consumable data
export function updateConsumableData(consumable, updates) {
  const properData = createProperConsumableData(consumable);
  const updatedData = { ...properData, ...updates };

  // Return both formats for backward compatibility
  return {
    proper: updatedData,
    hacky: createHackyConsumableData(updatedData),
  };
}

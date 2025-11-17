/**
 * Consumable Data Migration Runner
 *
 * Provides functions to migrate consumable data from legacy storage format
 * to proper data structure. Use these functions programmatically or via
 * admin interface, not by executing this file directly.
 */

import {
  createProperConsumableData,
  createHackyConsumableData,
  isConsumableMigrated,
  updateConsumableData,
} from "./consumable-data-migration.js";
import { assetsService } from "../appwrite/provider.js";
import { ENUMS } from "../appwrite/config.js";
import { Query } from "appwrite";

/**
 * Migrate a single consumable from hacky storage to proper structure
 * @param {Object} consumable - The consumable to migrate
 * @param {boolean} dryRun - If true, only validate without making changes
 * @returns {Object} Migration result
 */
export async function migrateSingleConsumable(consumable, dryRun = true) {
  try {
    // Check if already migrated
    if (isConsumableMigrated(consumable)) {
      return {
        success: true,
        message: "Already migrated",
        consumable: consumable,
      };
    }

    // Create proper data structure
    const properData = createProperConsumableData(consumable);

    if (dryRun) {
      return {
        success: true,
        message: "Dry run - would migrate successfully",
        properData: properData,
        hackyData: createHackyConsumableData(properData),
      };
    }

    // Perform migration
    const updatedConsumable = await assetsService.update(
      consumable.$id,
      properData
    );

    return {
      success: true,
      message: "Successfully migrated",
      consumable: updatedConsumable,
    };
  } catch (error) {
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
      error: error,
    };
  }
}

/**
 * Migrate all consumables in batches
 * @param {number} batchSize - Number of consumables to process per batch
 * @param {boolean} dryRun - If true, only validate without making changes
 * @returns {Object} Migration results
 */
export async function migrateAllConsumables(batchSize = 10, dryRun = true) {
  try {
    // Get all consumables
    const result = await assetsService.list([
      Query.equal("itemType", ENUMS.ITEM_TYPE.CONSUMABLE),
      Query.limit(1000), // Adjust based data size
    ]);

    const consumables = result.documents;
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let i = 0; i < consumables.length; i += batchSize) {
      const batch = consumables.slice(i, i + batchSize);

      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          consumables.length / batchSize
        )}`
      );

      // Process batch in parallel
      const batchPromises = batch.map((consumable) =>
        migrateSingleConsumable(consumable, dryRun)
      );

      const batchResults = await Promise.all(batchPromises);

      // Count results
      batchResults.forEach((result) => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
        results.push(result);
      });

      // Add delay between batches to avoid overwhelming the server
      if (i + batchSize < consumables.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return {
      success: true,
      totalProcessed: consumables.length,
      successCount: successCount,
      errorCount: errorCount,
      results: results,
    };
  } catch (error) {
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
      error: error,
    };
  }
}

/**
 * Validate consumable data integrity
 * @param {Object} consumable - The consumable to validate
 * @returns {Object} Validation result
 */
export function validateConsumableData(consumable) {
  const issues = [];

  // Check if it's a consumable
  if (consumable.itemType !== ENUMS.ITEM_TYPE.CONSUMABLE) {
    return {
      valid: true,
      message: "Not a consumable, skipping validation",
    };
  }

  // Check for hacky storage patterns
  if (consumable.serialNumber && consumable.serialNumber.startsWith("STOCK:")) {
    issues.push("Uses hacky stock storage in serialNumber");
  }

  if (consumable.model && consumable.model.startsWith("MIN:")) {
    issues.push("Uses hacky min stock storage in model");
  }

  if (consumable.subcategory && consumable.subcategory.includes("|")) {
    issues.push("Uses hacky multi-data storage in subcategory");
  }

  // Check for proper data structure
  const hasProperData =
    consumable.currentStock !== undefined &&
    consumable.minStock !== undefined &&
    consumable.consumableStatus !== undefined &&
    consumable.consumableUnit !== undefined &&
    consumable.consumableCategory !== undefined;

  if (hasProperData) {
    issues.push("Has proper data structure");
  }

  return {
    valid: issues.length === 0 || hasProperData,
    issues: issues,
    needsMigration: !hasProperData && issues.length > 0,
  };
}

/**
 * Get migration statistics
 * @returns {Object} Migration statistics
 */
export async function getMigrationStats() {
  try {
    // Get all consumables
    const result = await assetsService.list([
      Query.equal("itemType", ENUMS.ITEM_TYPE.CONSUMABLE),
      Query.limit(1000),
    ]);

    const consumables = result.documents;
    let migratedCount = 0;
    let needsMigrationCount = 0;
    let issues = [];

    consumables.forEach((consumable) => {
      const validation = validateConsumableData(consumable);
      if (validation.needsMigration) {
        needsMigrationCount++;
        issues.push(...validation.issues);
      } else if (validation.valid) {
        migratedCount++;
      }
    });

    return {
      total: consumables.length,
      migrated: migratedCount,
      needsMigration: needsMigrationCount,
      migrationRate:
        ((migratedCount / consumables.length) * 100).toFixed(2) + "%",
      commonIssues: [...new Set(issues)],
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
}


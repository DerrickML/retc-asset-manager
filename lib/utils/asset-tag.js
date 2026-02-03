/**
 * Build asset tag in format ORG-PROJECT-TYPE-NUMBER (e.g. NREP-MECS-LAPTOP-001).
 * Used only when auto-generating; manual entry is unchanged.
 */

const CATEGORY_TO_CODE = {
  IT_EQUIPMENT: "LAPTOP",
  NETWORK_HARDWARE: "NET",
  OFFICE_FURNITURE: "FURN",
  VEHICLE: "VEH",
  POWER_ASSET: "PWR",
  TOOLS: "TOOL",
  HEAVY_MACHINERY: "MACH",
  LAB_EQUIPMENT: "LAB",
  SAFETY_EQUIPMENT: "SAFE",
  AV_EQUIPMENT: "AV",
  SOFTWARE_LICENSE: "SW",
  CONSUMABLE: "CONS",
  BUILDING_INFRA: "BLD",
};

function slug(str, maxLen = 8) {
  if (!str || typeof str !== "string") return "";
  const s = str.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, maxLen);
  return s || "";
}

/**
 * @param {string} orgCode - e.g. "NREP" or "RETC"
 * @param {{ name?: string, $id?: string } | null} project - selected project (null for RETC)
 * @param {string} category - e.g. ENUMS.CATEGORY.IT_EQUIPMENT
 * @param {string} assetName - asset name (optional, for type segment fallback)
 * @returns {string | null} - e.g. "NREP-MECS-LAPTOP-001" or null to use fallback
 */
export function buildAssetTag(orgCode, project, category, assetName = "") {
  const org = slug(orgCode, 4) || "ORG";
  const typeCode = CATEGORY_TO_CODE[category] || slug(category, 6) || slug(assetName, 6) || "AST";
  const num = String((Date.now() % 10000)).padStart(3, "0");

  if (project && (project.name || project.$id)) {
    const proj = slug(project.name || project.$id || "", 8) || "PRJ";
    return `${org}-${proj}-${typeCode}-${num}`;
  }
  return `${org}-${typeCode}-${num}`;
}

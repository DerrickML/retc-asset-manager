import { ENUMS } from "../appwrite/config.js"

// Map internal condition to public condition label
export function mapToPublicCondition(internalCondition) {
  const mapping = {
    [ENUMS.CURRENT_CONDITION.NEW]: ENUMS.PUBLIC_CONDITION_LABEL.NEW,
    [ENUMS.CURRENT_CONDITION.LIKE_NEW]: ENUMS.PUBLIC_CONDITION_LABEL.GOOD,
    [ENUMS.CURRENT_CONDITION.GOOD]: ENUMS.PUBLIC_CONDITION_LABEL.GOOD,
    [ENUMS.CURRENT_CONDITION.FAIR]: ENUMS.PUBLIC_CONDITION_LABEL.FAIR,
    [ENUMS.CURRENT_CONDITION.POOR]: ENUMS.PUBLIC_CONDITION_LABEL.OUT_OF_SERVICE,
    [ENUMS.CURRENT_CONDITION.DAMAGED]: ENUMS.PUBLIC_CONDITION_LABEL.OUT_OF_SERVICE,
    [ENUMS.CURRENT_CONDITION.SCRAP]: ENUMS.PUBLIC_CONDITION_LABEL.OUT_OF_SERVICE,
  }

  return mapping[internalCondition] || ENUMS.PUBLIC_CONDITION_LABEL.OUT_OF_SERVICE
}

// Map internal status to public status label
export function mapToPublicStatusLabel(internalStatus) {
  const mapping = {
    [ENUMS.AVAILABLE_STATUS.AVAILABLE]: "Available",
    [ENUMS.AVAILABLE_STATUS.IN_USE]: "On Loan",
    [ENUMS.AVAILABLE_STATUS.RESERVED]: "On Loan",
    [ENUMS.AVAILABLE_STATUS.AWAITING_RETURN]: "On Loan",
    [ENUMS.AVAILABLE_STATUS.MAINTENANCE]: "Out of Service",
    [ENUMS.AVAILABLE_STATUS.REPAIR_REQUIRED]: "Out of Service",
    [ENUMS.AVAILABLE_STATUS.OUT_FOR_SERVICE]: "Out of Service",
    [ENUMS.AVAILABLE_STATUS.AWAITING_DEPLOY]: "Available",
    [ENUMS.AVAILABLE_STATUS.RETIRED]: null, // Hidden from public
    [ENUMS.AVAILABLE_STATUS.DISPOSED]: null, // Hidden from public
  }

  return mapping[internalStatus]
}

// Get status badge color for UI
export function getStatusBadgeColor(status) {
  const colors = {
    [ENUMS.AVAILABLE_STATUS.AVAILABLE]: "bg-green-100 text-green-800",
    [ENUMS.AVAILABLE_STATUS.RESERVED]: "bg-yellow-100 text-yellow-800",
    [ENUMS.AVAILABLE_STATUS.IN_USE]: "bg-blue-100 text-blue-800",
    [ENUMS.AVAILABLE_STATUS.AWAITING_RETURN]: "bg-orange-100 text-orange-800",
    [ENUMS.AVAILABLE_STATUS.MAINTENANCE]: "bg-purple-100 text-purple-800",
    [ENUMS.AVAILABLE_STATUS.REPAIR_REQUIRED]: "bg-red-100 text-red-800",
    [ENUMS.AVAILABLE_STATUS.OUT_FOR_SERVICE]: "bg-gray-100 text-gray-800",
    [ENUMS.AVAILABLE_STATUS.RETIRED]: "bg-gray-100 text-gray-800",
    [ENUMS.AVAILABLE_STATUS.DISPOSED]: "bg-black text-white",
  }

  return colors[status] || "bg-gray-100 text-gray-800"
}

// Get condition badge color for UI
export function getConditionBadgeColor(condition) {
  const colors = {
    [ENUMS.CURRENT_CONDITION.NEW]: "bg-green-100 text-green-800",
    [ENUMS.CURRENT_CONDITION.LIKE_NEW]: "bg-green-100 text-green-800",
    [ENUMS.CURRENT_CONDITION.GOOD]: "bg-blue-100 text-blue-800",
    [ENUMS.CURRENT_CONDITION.FAIR]: "bg-yellow-100 text-yellow-800",
    [ENUMS.CURRENT_CONDITION.POOR]: "bg-orange-100 text-orange-800",
    [ENUMS.CURRENT_CONDITION.DAMAGED]: "bg-red-100 text-red-800",
    [ENUMS.CURRENT_CONDITION.SCRAP]: "bg-red-100 text-red-800",
  }

  return colors[condition] || "bg-gray-100 text-gray-800"
}

// Format category for display
export function formatCategory(category) {
  return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

// Format role for display
export function formatRole(role) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

export const USER_ROLES = {
  SYSTEM_ADMIN: "System Administrator",
  ASSET_ADMIN: "Asset Administrator",
  SENIOR_MANAGER: "Senior Manager",
  STAFF: "Staff",
}

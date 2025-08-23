import { ENUMS } from "../appwrite/config.js"

// Validate asset request dates
export function validateRequestDates(issueDate, expectedReturnDate) {
  const issue = new Date(issueDate)
  const expectedReturn = new Date(expectedReturnDate)

  if (issue >= expectedReturn) {
    throw new Error("Issue date must be before expected return date")
  }

  if (issue < new Date()) {
    throw new Error("Issue date cannot be in the past")
  }

  return true
}

// Validate asset tag format (example: RETC-LAP-001)
export function validateAssetTag(assetTag) {
  const pattern = /^[A-Z]+-[A-Z]+-\d{3,}$/
  if (!pattern.test(assetTag)) {
    throw new Error("Asset tag must follow format: PREFIX-TYPE-NUMBER (e.g., RETC-LAP-001)")
  }
  return true
}

// Validate email format
export function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!pattern.test(email)) {
    throw new Error("Invalid email format")
  }
  return true
}

// Validate phone number (basic)
export function validatePhoneNumber(phone) {
  if (!phone) return true // Optional field
  const pattern = /^[+]?[1-9][\d]{0,15}$/
  if (!pattern.test(phone.replace(/[\s\-$$$$]/g, ""))) {
    throw new Error("Invalid phone number format")
  }
  return true
}

// Check if asset can be issued
export function canIssueAsset(asset) {
  const validStatuses = [ENUMS.AVAILABLE_STATUS.AVAILABLE, ENUMS.AVAILABLE_STATUS.RESERVED]

  if (!validStatuses.includes(asset.availableStatus)) {
    throw new Error(`Asset cannot be issued. Current status: ${asset.availableStatus}`)
  }

  if (!asset.custodianStaffId) {
    throw new Error("Asset must have a custodian assigned before issuance")
  }

  return true
}

// Check if asset status transition is valid
export function validateStatusTransition(fromStatus, toStatus) {
  const validTransitions = {
    [ENUMS.AVAILABLE_STATUS.AWAITING_DEPLOY]: [ENUMS.AVAILABLE_STATUS.AVAILABLE],
    [ENUMS.AVAILABLE_STATUS.AVAILABLE]: [
      ENUMS.AVAILABLE_STATUS.RESERVED,
      ENUMS.AVAILABLE_STATUS.IN_USE,
      ENUMS.AVAILABLE_STATUS.MAINTENANCE,
      ENUMS.AVAILABLE_STATUS.RETIRED,
    ],
    [ENUMS.AVAILABLE_STATUS.RESERVED]: [ENUMS.AVAILABLE_STATUS.AVAILABLE, ENUMS.AVAILABLE_STATUS.IN_USE],
    [ENUMS.AVAILABLE_STATUS.IN_USE]: [
      ENUMS.AVAILABLE_STATUS.AVAILABLE,
      ENUMS.AVAILABLE_STATUS.AWAITING_RETURN,
      ENUMS.AVAILABLE_STATUS.REPAIR_REQUIRED,
    ],
    [ENUMS.AVAILABLE_STATUS.AWAITING_RETURN]: [
      ENUMS.AVAILABLE_STATUS.AVAILABLE,
      ENUMS.AVAILABLE_STATUS.REPAIR_REQUIRED,
    ],
    [ENUMS.AVAILABLE_STATUS.MAINTENANCE]: [ENUMS.AVAILABLE_STATUS.AVAILABLE, ENUMS.AVAILABLE_STATUS.OUT_FOR_SERVICE],
    [ENUMS.AVAILABLE_STATUS.REPAIR_REQUIRED]: [ENUMS.AVAILABLE_STATUS.MAINTENANCE, ENUMS.AVAILABLE_STATUS.RETIRED],
    [ENUMS.AVAILABLE_STATUS.OUT_FOR_SERVICE]: [ENUMS.AVAILABLE_STATUS.MAINTENANCE, ENUMS.AVAILABLE_STATUS.AVAILABLE],
    [ENUMS.AVAILABLE_STATUS.RETIRED]: [ENUMS.AVAILABLE_STATUS.DISPOSED],
    [ENUMS.AVAILABLE_STATUS.DISPOSED]: [], // Terminal state
  }

  const allowedTransitions = validTransitions[fromStatus] || []

  if (!allowedTransitions.includes(toStatus)) {
    throw new Error(`Invalid status transition from ${fromStatus} to ${toStatus}`)
  }

  return true
}

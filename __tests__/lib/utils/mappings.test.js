import {
  mapToPublicCondition,
  mapToPublicStatusLabel,
  getStatusBadgeColor,
  getConditionBadgeColor,
  formatCategory,
  formatRole,
  USER_ROLES,
} from '../../../lib/utils/mappings'
import { ENUMS } from '../../../lib/appwrite/config'

describe('mappings utilities', () => {
  describe('mapToPublicCondition', () => {
    it('maps NEW to NEW', () => {
      const result = mapToPublicCondition(ENUMS.CURRENT_CONDITION.NEW)
      expect(result).toBe(ENUMS.PUBLIC_CONDITION_LABEL.NEW)
    })

    it('maps LIKE_NEW to GOOD', () => {
      const result = mapToPublicCondition(ENUMS.CURRENT_CONDITION.LIKE_NEW)
      expect(result).toBe(ENUMS.PUBLIC_CONDITION_LABEL.GOOD)
    })

    it('maps GOOD to GOOD', () => {
      const result = mapToPublicCondition(ENUMS.CURRENT_CONDITION.GOOD)
      expect(result).toBe(ENUMS.PUBLIC_CONDITION_LABEL.GOOD)
    })

    it('maps FAIR to FAIR', () => {
      const result = mapToPublicCondition(ENUMS.CURRENT_CONDITION.FAIR)
      expect(result).toBe(ENUMS.PUBLIC_CONDITION_LABEL.FAIR)
    })

    it('maps POOR to OUT_OF_SERVICE', () => {
      const result = mapToPublicCondition(ENUMS.CURRENT_CONDITION.POOR)
      expect(result).toBe(ENUMS.PUBLIC_CONDITION_LABEL.OUT_OF_SERVICE)
    })

    it('maps DAMAGED to OUT_OF_SERVICE', () => {
      const result = mapToPublicCondition(ENUMS.CURRENT_CONDITION.DAMAGED)
      expect(result).toBe(ENUMS.PUBLIC_CONDITION_LABEL.OUT_OF_SERVICE)
    })

    it('maps SCRAP to OUT_OF_SERVICE', () => {
      const result = mapToPublicCondition(ENUMS.CURRENT_CONDITION.SCRAP)
      expect(result).toBe(ENUMS.PUBLIC_CONDITION_LABEL.OUT_OF_SERVICE)
    })

    it('returns OUT_OF_SERVICE for unknown condition', () => {
      const result = mapToPublicCondition('UNKNOWN_CONDITION')
      expect(result).toBe(ENUMS.PUBLIC_CONDITION_LABEL.OUT_OF_SERVICE)
    })
  })

  describe('mapToPublicStatusLabel', () => {
    it('maps AVAILABLE to "Available"', () => {
      const result = mapToPublicStatusLabel(ENUMS.AVAILABLE_STATUS.AVAILABLE)
      expect(result).toBe('Available')
    })

    it('maps IN_USE to "On Loan"', () => {
      const result = mapToPublicStatusLabel(ENUMS.AVAILABLE_STATUS.IN_USE)
      expect(result).toBe('On Loan')
    })

    it('maps RESERVED to "On Loan"', () => {
      const result = mapToPublicStatusLabel(ENUMS.AVAILABLE_STATUS.RESERVED)
      expect(result).toBe('On Loan')
    })

    it('maps AWAITING_RETURN to "On Loan"', () => {
      const result = mapToPublicStatusLabel(ENUMS.AVAILABLE_STATUS.AWAITING_RETURN)
      expect(result).toBe('On Loan')
    })

    it('maps MAINTENANCE to "Out of Service"', () => {
      const result = mapToPublicStatusLabel(ENUMS.AVAILABLE_STATUS.MAINTENANCE)
      expect(result).toBe('Out of Service')
    })

    it('maps REPAIR_REQUIRED to "Out of Service"', () => {
      const result = mapToPublicStatusLabel(ENUMS.AVAILABLE_STATUS.REPAIR_REQUIRED)
      expect(result).toBe('Out of Service')
    })

    it('maps OUT_FOR_SERVICE to "Out of Service"', () => {
      const result = mapToPublicStatusLabel(ENUMS.AVAILABLE_STATUS.OUT_FOR_SERVICE)
      expect(result).toBe('Out of Service')
    })

    it('maps AWAITING_DEPLOY to "Available"', () => {
      const result = mapToPublicStatusLabel(ENUMS.AVAILABLE_STATUS.AWAITING_DEPLOY)
      expect(result).toBe('Available')
    })

    it('maps RETIRED to null (hidden)', () => {
      const result = mapToPublicStatusLabel(ENUMS.AVAILABLE_STATUS.RETIRED)
      expect(result).toBeNull()
    })

    it('maps DISPOSED to null (hidden)', () => {
      const result = mapToPublicStatusLabel(ENUMS.AVAILABLE_STATUS.DISPOSED)
      expect(result).toBeNull()
    })

    it('returns undefined for unknown status', () => {
      const result = mapToPublicStatusLabel('UNKNOWN_STATUS')
      expect(result).toBeUndefined()
    })
  })

  describe('getStatusBadgeColor', () => {
    const statusColorTests = [
      {
        status: ENUMS.AVAILABLE_STATUS.AVAILABLE,
        expectedColor: 'bg-green-100 text-green-800',
      },
      {
        status: ENUMS.AVAILABLE_STATUS.RESERVED,
        expectedColor: 'bg-yellow-100 text-yellow-800',
      },
      {
        status: ENUMS.AVAILABLE_STATUS.IN_USE,
        expectedColor: 'bg-blue-100 text-blue-800',
      },
      {
        status: ENUMS.AVAILABLE_STATUS.AWAITING_RETURN,
        expectedColor: 'bg-orange-100 text-orange-800',
      },
      {
        status: ENUMS.AVAILABLE_STATUS.MAINTENANCE,
        expectedColor: 'bg-purple-100 text-purple-800',
      },
      {
        status: ENUMS.AVAILABLE_STATUS.REPAIR_REQUIRED,
        expectedColor: 'bg-red-100 text-red-800',
      },
      {
        status: ENUMS.AVAILABLE_STATUS.OUT_FOR_SERVICE,
        expectedColor: 'bg-gray-100 text-gray-800',
      },
      {
        status: ENUMS.AVAILABLE_STATUS.RETIRED,
        expectedColor: 'bg-gray-100 text-gray-800',
      },
      {
        status: ENUMS.AVAILABLE_STATUS.DISPOSED,
        expectedColor: 'bg-black text-white',
      },
    ]

    statusColorTests.forEach(({ status, expectedColor }) => {
      it(`returns correct color for ${status}`, () => {
        const result = getStatusBadgeColor(status)
        expect(result).toBe(expectedColor)
      })
    })

    it('returns default color for unknown status', () => {
      const result = getStatusBadgeColor('UNKNOWN_STATUS')
      expect(result).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('getConditionBadgeColor', () => {
    const conditionColorTests = [
      {
        condition: ENUMS.CURRENT_CONDITION.NEW,
        expectedColor: 'bg-green-100 text-green-800',
      },
      {
        condition: ENUMS.CURRENT_CONDITION.LIKE_NEW,
        expectedColor: 'bg-green-100 text-green-800',
      },
      {
        condition: ENUMS.CURRENT_CONDITION.GOOD,
        expectedColor: 'bg-blue-100 text-blue-800',
      },
      {
        condition: ENUMS.CURRENT_CONDITION.FAIR,
        expectedColor: 'bg-yellow-100 text-yellow-800',
      },
      {
        condition: ENUMS.CURRENT_CONDITION.POOR,
        expectedColor: 'bg-orange-100 text-orange-800',
      },
      {
        condition: ENUMS.CURRENT_CONDITION.DAMAGED,
        expectedColor: 'bg-red-100 text-red-800',
      },
      {
        condition: ENUMS.CURRENT_CONDITION.SCRAP,
        expectedColor: 'bg-red-100 text-red-800',
      },
    ]

    conditionColorTests.forEach(({ condition, expectedColor }) => {
      it(`returns correct color for ${condition}`, () => {
        const result = getConditionBadgeColor(condition)
        expect(result).toBe(expectedColor)
      })
    })

    it('returns default color for unknown condition', () => {
      const result = getConditionBadgeColor('UNKNOWN_CONDITION')
      expect(result).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('formatCategory', () => {
    const categoryTests = [
      { input: 'IT_EQUIPMENT', expected: 'It Equipment' },
      { input: 'NETWORK_HARDWARE', expected: 'Network Hardware' },
      { input: 'OFFICE_FURNITURE', expected: 'Office Furniture' },
      { input: 'HEAVY_MACHINERY', expected: 'Heavy Machinery' },
      { input: 'LAB_EQUIPMENT', expected: 'Lab Equipment' },
      { input: 'SAFETY_EQUIPMENT', expected: 'Safety Equipment' },
      { input: 'AV_EQUIPMENT', expected: 'Av Equipment' },
      { input: 'SOFTWARE_LICENSE', expected: 'Software License' },
      { input: 'BUILDING_INFRA', expected: 'Building Infra' },
      { input: 'single', expected: 'Single' },
    ]

    categoryTests.forEach(({ input, expected }) => {
      it(`formats "${input}" to "${expected}"`, () => {
        const result = formatCategory(input)
        expect(result).toBe(expected)
      })
    })

    it('handles empty string', () => {
      const result = formatCategory('')
      expect(result).toBe('')
    })

    it('handles undefined input', () => {
      const result = formatCategory(undefined)
      expect(result).toBe('Undefined')
    })
  })

  describe('formatRole', () => {
    const roleTests = [
      { input: 'SYSTEM_ADMIN', expected: 'System Admin' },
      { input: 'ASSET_ADMIN', expected: 'Asset Admin' },
      { input: 'SENIOR_MANAGER', expected: 'Senior Manager' },
      { input: 'STAFF', expected: 'Staff' },
      { input: 'single_word', expected: 'Single Word' },
      { input: 'multiple_word_role', expected: 'Multiple Word Role' },
    ]

    roleTests.forEach(({ input, expected }) => {
      it(`formats "${input}" to "${expected}"`, () => {
        const result = formatRole(input)
        expect(result).toBe(expected)
      })
    })

    it('handles empty string', () => {
      const result = formatRole('')
      expect(result).toBe('')
    })
  })

  describe('USER_ROLES constant', () => {
    it('contains all expected role mappings', () => {
      expect(USER_ROLES.SYSTEM_ADMIN).toBe('System Administrator')
      expect(USER_ROLES.ASSET_ADMIN).toBe('Asset Administrator')
      expect(USER_ROLES.SENIOR_MANAGER).toBe('Senior Manager')
      expect(USER_ROLES.STAFF).toBe('Staff')
    })

    it('has consistent keys with ENUMS.ROLES', () => {
      Object.keys(ENUMS.ROLES).forEach((roleKey) => {
        expect(USER_ROLES).toHaveProperty(roleKey)
      })
    })
  })

  describe('Edge cases and error handling', () => {
    it('handles null inputs gracefully', () => {
      expect(mapToPublicCondition(null)).toBe(ENUMS.PUBLIC_CONDITION_LABEL.OUT_OF_SERVICE)
      expect(mapToPublicStatusLabel(null)).toBeUndefined()
      expect(getStatusBadgeColor(null)).toBe('bg-gray-100 text-gray-800')
      expect(getConditionBadgeColor(null)).toBe('bg-gray-100 text-gray-800')
      expect(formatCategory(null)).toBe('Null')
      expect(formatRole(null)).toBe('Null')
    })

    it('handles special characters in formatting functions', () => {
      expect(formatCategory('TEST_WITH_NUMBERS_123')).toBe('Test With Numbers 123')
      expect(formatRole('ROLE_WITH_SPECIAL_CHARS!')).toBe('Role With Special Chars!')
    })

    it('preserves case for single letter words after underscores', () => {
      expect(formatCategory('A_B_C')).toBe('A B C')
      expect(formatRole('X_Y_Z')).toBe('X Y Z')
    })
  })
})
import React from 'react'
import { 
  StatusBadge, 
  AssetStatusBadge, 
  AssetConditionBadge, 
  RequestStatusBadge,
  StatusBadgeGroup 
} from '../../../components/ui/status-badge'
import { renderWithProviders, assertions } from '../../utils/test-utils'
import { ENUMS } from '../../../lib/appwrite/config'

describe('StatusBadge', () => {
  describe('Basic rendering', () => {
    it('renders with default props', () => {
      const { getByText } = renderWithProviders(
        <StatusBadge status={ENUMS.AVAILABLE_STATUS.AVAILABLE} />
      )
      
      assertions.toBeInDocument(getByText('Available'))
    })

    it('formats status text correctly', () => {
      const { getByText } = renderWithProviders(
        <StatusBadge status="IN_USE" />
      )
      
      assertions.toBeInDocument(getByText('In Use'))
    })

    it('applies correct color classes for available status', () => {
      const { container } = renderWithProviders(
        <StatusBadge status={ENUMS.AVAILABLE_STATUS.AVAILABLE} />
      )
      
      const badge = container.querySelector('div')
      assertions.toHaveClass(badge, 'bg-green-100')
      assertions.toHaveClass(badge, 'text-green-800')
    })

    it('applies correct color classes for pending status', () => {
      const { container } = renderWithProviders(
        <StatusBadge status={ENUMS.REQUEST_STATUS.PENDING} />
      )
      
      const badge = container.querySelector('div')
      assertions.toHaveClass(badge, 'bg-yellow-100')
      assertions.toHaveClass(badge, 'text-yellow-800')
    })

    it('applies default color for unknown status', () => {
      const { container } = renderWithProviders(
        <StatusBadge status="UNKNOWN_STATUS" />
      )
      
      const badge = container.querySelector('div')
      assertions.toHaveClass(badge, 'bg-gray-100')
      assertions.toHaveClass(badge, 'text-gray-800')
    })
  })

  describe('Icons', () => {
    it('shows icon when showIcon is true', () => {
      const { getByText } = renderWithProviders(
        <StatusBadge 
          status={ENUMS.AVAILABLE_STATUS.AVAILABLE} 
          type="status"
          showIcon={true} 
        />
      )
      
      const badge = getByText('Available')
      assertions.toBeInDocument(badge)
      // Icon should be present as text content
      expect(badge.textContent).toContain('●')
    })

    it('does not show icon when showIcon is false', () => {
      const { getByText } = renderWithProviders(
        <StatusBadge 
          status={ENUMS.AVAILABLE_STATUS.AVAILABLE} 
          type="status"
          showIcon={false} 
        />
      )
      
      const badge = getByText('Available')
      expect(badge.textContent).not.toContain('●')
    })
  })

  describe('Custom props', () => {
    it('accepts custom className', () => {
      const { container } = renderWithProviders(
        <StatusBadge 
          status={ENUMS.AVAILABLE_STATUS.AVAILABLE} 
          className="custom-class"
        />
      )
      
      const badge = container.querySelector('div')
      assertions.toHaveClass(badge, 'custom-class')
    })

    it('passes through additional props', () => {
      const { container } = renderWithProviders(
        <StatusBadge 
          status={ENUMS.AVAILABLE_STATUS.AVAILABLE} 
          data-testid="custom-badge"
        />
      )
      
      const badge = container.querySelector('[data-testid="custom-badge"]')
      assertions.toBeInDocument(badge)
    })
  })
})

describe('Pre-configured badge variants', () => {
  it('AssetStatusBadge renders with status type', () => {
    const { getByText } = renderWithProviders(
      <AssetStatusBadge status={ENUMS.AVAILABLE_STATUS.IN_USE} />
    )
    
    assertions.toBeInDocument(getByText('In Use'))
  })

  it('AssetConditionBadge renders with condition type', () => {
    const { getByText } = renderWithProviders(
      <AssetConditionBadge status={ENUMS.CURRENT_CONDITION.GOOD} />
    )
    
    assertions.toBeInDocument(getByText('Good'))
  })

  it('RequestStatusBadge renders with request type', () => {
    const { getByText } = renderWithProviders(
      <RequestStatusBadge status={ENUMS.REQUEST_STATUS.APPROVED} />
    )
    
    assertions.toBeInDocument(getByText('Approved'))
  })
})

describe('StatusBadgeGroup', () => {
  const mockStatuses = [
    { status: ENUMS.AVAILABLE_STATUS.AVAILABLE, type: 'status' },
    { status: ENUMS.CURRENT_CONDITION.GOOD, type: 'condition' },
    { status: ENUMS.REQUEST_STATUS.PENDING, type: 'request' },
  ]

  it('renders multiple badges', () => {
    const { getByText } = renderWithProviders(
      <StatusBadgeGroup statuses={mockStatuses} />
    )
    
    assertions.toBeInDocument(getByText('Available'))
    assertions.toBeInDocument(getByText('Good'))
    assertions.toBeInDocument(getByText('Pending'))
  })

  it('applies correct container classes', () => {
    const { container } = renderWithProviders(
      <StatusBadgeGroup statuses={mockStatuses} />
    )
    
    const group = container.querySelector('div')
    assertions.toHaveClass(group, 'flex')
    assertions.toHaveClass(group, 'flex-wrap')
    assertions.toHaveClass(group, 'gap-1')
  })

  it('handles empty statuses array', () => {
    const { container } = renderWithProviders(
      <StatusBadgeGroup statuses={[]} />
    )
    
    const group = container.querySelector('div')
    assertions.toBeInDocument(group)
    expect(group.children).toHaveLength(0)
  })

  it('accepts custom className', () => {
    const { container } = renderWithProviders(
      <StatusBadgeGroup 
        statuses={mockStatuses} 
        className="custom-group-class"
      />
    )
    
    const group = container.querySelector('div')
    assertions.toHaveClass(group, 'custom-group-class')
  })
})

describe('Status color mappings', () => {
  const statusColorTests = [
    { status: ENUMS.AVAILABLE_STATUS.AVAILABLE, expectedClass: 'bg-green-100' },
    { status: ENUMS.AVAILABLE_STATUS.RESERVED, expectedClass: 'bg-yellow-100' },
    { status: ENUMS.AVAILABLE_STATUS.IN_USE, expectedClass: 'bg-blue-100' },
    { status: ENUMS.AVAILABLE_STATUS.MAINTENANCE, expectedClass: 'bg-purple-100' },
    { status: ENUMS.CURRENT_CONDITION.NEW, expectedClass: 'bg-green-100' },
    { status: ENUMS.CURRENT_CONDITION.GOOD, expectedClass: 'bg-blue-100' },
    { status: ENUMS.CURRENT_CONDITION.FAIR, expectedClass: 'bg-yellow-100' },
    { status: ENUMS.CURRENT_CONDITION.DAMAGED, expectedClass: 'bg-red-100' },
    { status: ENUMS.REQUEST_STATUS.PENDING, expectedClass: 'bg-yellow-100' },
    { status: ENUMS.REQUEST_STATUS.APPROVED, expectedClass: 'bg-green-100' },
    { status: ENUMS.REQUEST_STATUS.DENIED, expectedClass: 'bg-red-100' },
  ]

  statusColorTests.forEach(({ status, expectedClass }) => {
    it(`applies correct color for ${status}`, () => {
      const { container } = renderWithProviders(
        <StatusBadge status={status} />
      )
      
      const badge = container.querySelector('div')
      assertions.toHaveClass(badge, expectedClass)
    })
  })
})
import React from 'react'
import { 
  LoadingSpinner, 
  PageLoading, 
  SectionLoading, 
  InlineLoading,
  CardSkeleton,
  TableSkeleton,
  GridSkeleton 
} from '../../../components/ui/loading'
import { renderWithProviders, assertions } from '../../utils/test-utils'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { container } = renderWithProviders(<LoadingSpinner />)
    
    const spinner = container.querySelector('div')
    assertions.toBeInDocument(spinner)
    assertions.toHaveClass(spinner, 'animate-spin')
    assertions.toHaveClass(spinner, 'rounded-full')
    assertions.toHaveClass(spinner, 'h-8')
    assertions.toHaveClass(spinner, 'w-8')
  })

  it('applies correct size classes', () => {
    const sizes = [
      { size: 'sm', expectedClass: 'h-4' },
      { size: 'md', expectedClass: 'h-8' },
      { size: 'lg', expectedClass: 'h-12' },
      { size: 'xl', expectedClass: 'h-16' },
    ]

    sizes.forEach(({ size, expectedClass }) => {
      const { container } = renderWithProviders(<LoadingSpinner size={size} />)
      const spinner = container.querySelector('div')
      assertions.toHaveClass(spinner, expectedClass)
    })
  })

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <LoadingSpinner className="custom-class" />
    )
    
    const spinner = container.querySelector('div')
    assertions.toHaveClass(spinner, 'custom-class')
  })

  it('applies custom color', () => {
    const { container } = renderWithProviders(
      <LoadingSpinner color="red-500" />
    )
    
    const spinner = container.querySelector('div')
    assertions.toHaveClass(spinner, 'border-t-red-500')
  })
})

describe('PageLoading', () => {
  it('renders with default message', () => {
    const { getByText } = renderWithProviders(<PageLoading />)
    
    assertions.toBeInDocument(getByText('Loading...'))
  })

  it('renders with custom message', () => {
    const { getByText } = renderWithProviders(
      <PageLoading message="Loading dashboard..." />
    )
    
    assertions.toBeInDocument(getByText('Loading dashboard...'))
  })

  it('renders without message', () => {
    const { queryByText } = renderWithProviders(
      <PageLoading message="" />
    )
    
    expect(queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('applies correct container classes', () => {
    const { container } = renderWithProviders(<PageLoading />)
    
    const wrapper = container.querySelector('div')
    assertions.toHaveClass(wrapper, 'flex')
    assertions.toHaveClass(wrapper, 'items-center')
    assertions.toHaveClass(wrapper, 'justify-center')
    assertions.toHaveClass(wrapper, 'min-h-screen')
    assertions.toHaveClass(wrapper, 'bg-gray-50')
  })

  it('contains a large spinner', () => {
    const { container } = renderWithProviders(<PageLoading />)
    
    const spinner = container.querySelector('.animate-spin')
    assertions.toHaveClass(spinner, 'h-12')
    assertions.toHaveClass(spinner, 'w-12')
  })
})

describe('SectionLoading', () => {
  it('renders with default message', () => {
    const { getByText } = renderWithProviders(<SectionLoading />)
    
    assertions.toBeInDocument(getByText('Loading...'))
  })

  it('renders with custom message', () => {
    const { getByText } = renderWithProviders(
      <SectionLoading message="Loading assets..." />
    )
    
    assertions.toBeInDocument(getByText('Loading assets...'))
  })

  it('applies correct container classes', () => {
    const { container } = renderWithProviders(<SectionLoading />)
    
    const wrapper = container.querySelector('div')
    assertions.toHaveClass(wrapper, 'flex')
    assertions.toHaveClass(wrapper, 'items-center')
    assertions.toHaveClass(wrapper, 'justify-center')
    assertions.toHaveClass(wrapper, 'py-12')
  })
})

describe('InlineLoading', () => {
  it('renders as inline block', () => {
    const { container } = renderWithProviders(<InlineLoading />)
    
    const spinner = container.querySelector('div')
    assertions.toHaveClass(spinner, 'inline-block')
    assertions.toHaveClass(spinner, 'h-4')
    assertions.toHaveClass(spinner, 'w-4')
  })

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <InlineLoading className="ml-2" />
    )
    
    const spinner = container.querySelector('div')
    assertions.toHaveClass(spinner, 'ml-2')
  })
})

describe('CardSkeleton', () => {
  it('renders skeleton structure', () => {
    const { container } = renderWithProviders(<CardSkeleton />)
    
    const card = container.querySelector('div')
    assertions.toHaveClass(card, 'animate-pulse')
    assertions.toHaveClass(card, 'bg-white')
    assertions.toHaveClass(card, 'rounded-lg')
    assertions.toHaveClass(card, 'border')
    assertions.toHaveClass(card, 'shadow-sm')
  })

  it('contains skeleton elements', () => {
    const { container } = renderWithProviders(<CardSkeleton />)
    
    const skeletonElements = container.querySelectorAll('.bg-gray-200')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <CardSkeleton className="custom-skeleton" />
    )
    
    const card = container.querySelector('div')
    assertions.toHaveClass(card, 'custom-skeleton')
  })
})

describe('TableSkeleton', () => {
  it('renders with default rows and columns', () => {
    const { container } = renderWithProviders(<TableSkeleton />)
    
    const table = container.querySelector('div')
    assertions.toHaveClass(table, 'animate-pulse')
    
    // Should have header + default 5 rows
    const rows = container.querySelectorAll('.px-6.py-4')
    expect(rows.length).toBe(6) // header + 5 data rows
  })

  it('renders with custom rows and columns', () => {
    const { container } = renderWithProviders(
      <TableSkeleton rows={3} columns={2} />
    )
    
    // Should have header + 3 rows
    const rows = container.querySelectorAll('.px-6.py-4')
    expect(rows.length).toBe(4) // header + 3 data rows
  })

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <TableSkeleton className="custom-table" />
    )
    
    const table = container.querySelector('div')
    assertions.toHaveClass(table, 'custom-table')
  })
})

describe('GridSkeleton', () => {
  it('renders with default items and columns', () => {
    const { container } = renderWithProviders(<GridSkeleton />)
    
    const grid = container.querySelector('div')
    assertions.toHaveClass(grid, 'grid')
    assertions.toHaveClass(grid, 'grid-cols-1')
    assertions.toHaveClass(grid, 'md:grid-cols-2')
    assertions.toHaveClass(grid, 'lg:grid-cols-3')
    assertions.toHaveClass(grid, 'xl:grid-cols-4')
    
    // Should have 8 skeleton cards by default
    const cards = container.querySelectorAll('.animate-pulse')
    expect(cards.length).toBe(8)
  })

  it('renders with custom items count', () => {
    const { container } = renderWithProviders(
      <GridSkeleton items={4} />
    )
    
    const cards = container.querySelectorAll('.animate-pulse')
    expect(cards.length).toBe(4)
  })

  it('applies correct grid columns classes', () => {
    const columnTests = [
      { columns: 1, expectedClass: 'grid-cols-1' },
      { columns: 2, expectedClass: 'md:grid-cols-2' },
      { columns: 3, expectedClass: 'lg:grid-cols-3' },
    ]

    columnTests.forEach(({ columns, expectedClass }) => {
      const { container } = renderWithProviders(
        <GridSkeleton columns={columns} />
      )
      
      const grid = container.querySelector('div')
      assertions.toHaveClass(grid, expectedClass)
    })
  })

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <GridSkeleton className="custom-grid" />
    )
    
    const grid = container.querySelector('div')
    assertions.toHaveClass(grid, 'custom-grid')
  })
})
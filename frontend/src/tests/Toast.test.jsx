import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Toast from '../components/Toast'

describe('Toast', () => {
  it('renders message when toast is set', () => {
    render(<Toast toast={{ msg: 'Item added to cart', type: 'success' }} />)
    expect(screen.getByText(/Item added to cart/)).toBeInTheDocument()
  })

  it('renders nothing when toast is null', () => {
    const { container } = render(<Toast toast={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders error style when type is error', () => {
    render(<Toast toast={{ msg: 'Something went wrong', type: 'error' }} />)
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
  })
})

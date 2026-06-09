import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Toast from '../components/Toast'

describe('Toast', () => {
  it('renders message when toast is set', () => {
    render(<Toast toast={{ message: 'Item added to cart', type: 'success' }} />)
    expect(screen.getByText('Item added to cart')).toBeInTheDocument()
  })

  it('renders nothing when toast is null', () => {
    const { container } = render(<Toast toast={null} />)
    expect(container.firstChild).toBeNull()
  })
})

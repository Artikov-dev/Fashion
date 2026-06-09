import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProductCard from '../components/ProductCard'

const mockProduct = {
  id: 1,
  name: 'Test Shirt',
  price: 89.99,
  image_url: 'https://example.com/shirt.jpg',
  description: 'A test shirt',
  stock: 10,
  category: { name: 'Women' },
}

describe('ProductCard', () => {
  it('renders product name', () => {
    render(<ProductCard product={mockProduct} onAddToCart={vi.fn()} />)
    expect(screen.getByText('Test Shirt')).toBeInTheDocument()
  })

  it('renders product price', () => {
    render(<ProductCard product={mockProduct} onAddToCart={vi.fn()} />)
    expect(screen.getByText(/89\.99/)).toBeInTheDocument()
  })

  it('renders product image', () => {
    render(<ProductCard product={mockProduct} onAddToCart={vi.fn()} />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
  })

  it('calls onAddToCart when add button clicked', () => {
    const onAddToCart = vi.fn()
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(onAddToCart).toHaveBeenCalledWith('Test Shirt')
  })

  it('shows out of stock when stock is 0', () => {
    render(<ProductCard product={{ ...mockProduct, stock: 0 }} onAddToCart={vi.fn()} />)
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import ProductCard from '../components/ProductCard'
import cartReducer from '../features/cart/cartSlice'

const mockProduct = {
  id: 1,
  name: 'Test Shirt',
  price: 89.99,
  image_url: 'https://example.com/shirt.jpg',
  description: 'A test shirt',
  stock: 10,
  category: { name: 'Women' },
}

function renderWithProviders(ui) {
  const store = configureStore({
    reducer: { cart: cartReducer },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  )
}

describe('ProductCard', () => {
  it('renders product name', () => {
    renderWithProviders(<ProductCard product={mockProduct} onAddToCart={vi.fn()} />)
    expect(screen.getByText('Test Shirt')).toBeInTheDocument()
  })

  it('renders product price', () => {
    renderWithProviders(<ProductCard product={mockProduct} onAddToCart={vi.fn()} />)
    expect(screen.getByText(/89\.99/)).toBeInTheDocument()
  })

  it('renders product image', () => {
    renderWithProviders(<ProductCard product={mockProduct} onAddToCart={vi.fn()} />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
  })

  it('calls onAddToCart when add button clicked', () => {
    const onAddToCart = vi.fn()
    renderWithProviders(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(onAddToCart).toHaveBeenCalledWith('Test Shirt')
  })

  it('shows sold out when stock is 0', () => {
    renderWithProviders(
      <ProductCard product={{ ...mockProduct, stock: 0 }} onAddToCart={vi.fn()} />
    )
    expect(screen.getAllByText(/sold out/i).length).toBeGreaterThan(0)
  })
})

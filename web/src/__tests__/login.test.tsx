import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../store/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
  })),
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  it('renders login form', async () => {
    const { LoginPage } = await import('../pages/auth/login')
    renderWithProviders(<LoginPage />)

    expect(screen.getByText('Entrar')).toBeDefined()
    expect(screen.getByText('Email')).toBeDefined()
    expect(screen.getByText('Senha')).toBeDefined()
  })
})

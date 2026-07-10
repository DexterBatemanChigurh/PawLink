import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/auth.store'
import { useThemeStore } from './store/theme.store'
import { Layout } from './components/layout/layout'
import { LoginPage } from './pages/auth/login'
import { DashboardPage } from './pages/dashboard/dashboard'
import { UsersPage } from './pages/users/users'
import { EditUserPage } from './pages/users/edit-user'
import { NewUserPage } from './pages/users/new-user'
import { PetsPage } from './pages/pets/pets'
import { PetDetailPage } from './pages/pets/pet-detail'
import { EditPetPage } from './pages/pets/edit-pet'
import { MatchesPage } from './pages/matches/matches'
import { useEffect } from 'react'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center dark:text-gray-300">Carregando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const { checkAuth } = useAuthStore()
  const { isDark } = useThemeStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/new" element={<NewUserPage />} />
            <Route path="users/:id/edit" element={<EditUserPage />} />
            <Route path="pets" element={<PetsPage />} />
            <Route path="pets/:id" element={<PetDetailPage />} />
            <Route path="pets/:id/edit" element={<EditPetPage />} />
            <Route path="matches" element={<MatchesPage />} />
            <Route path="organizations" element={<div>ONGs</div>} />
            <Route path="reports" element={<div>Denúncias</div>} />
            <Route path="settings" element={<div>Configurações</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

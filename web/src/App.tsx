import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/auth.store'
import { LoginPage } from './pages/auth/login'
import { RegisterPage } from './pages/auth/register'
import { HomePage } from './pages/home/home'
import { PetDetailPage } from './pages/pets/pet-detail'
import { MyMatchesPage } from './pages/matches/my-matches'
import { ReceivedMatchesPage } from './pages/matches/received-matches'
import { ProfilePage } from './pages/profile/profile'
import { MyPetsPage } from './pages/pets/my-pets'
import { NewPetPage } from './pages/pets/new-pet'
import { EditPetPage } from './pages/pets/edit-pet'
import { ConversationsPage } from './pages/messages/conversations'
import { ChatPage } from './pages/messages/chat'
import { useEffect } from 'react'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/pets/:id" element={<ProtectedRoute><PetDetailPage /></ProtectedRoute>} />
          <Route path="/matches/my" element={<ProtectedRoute><MyMatchesPage /></ProtectedRoute>} />
          <Route path="/matches/received" element={<ProtectedRoute><ReceivedMatchesPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/my-pets" element={<ProtectedRoute><MyPetsPage /></ProtectedRoute>} />
          <Route path="/pets/new" element={<ProtectedRoute><NewPetPage /></ProtectedRoute>} />
          <Route path="/pets/:id/edit" element={<ProtectedRoute><EditPetPage /></ProtectedRoute>} />
          <Route path="/conversations" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
          <Route path="/messages/:matchId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

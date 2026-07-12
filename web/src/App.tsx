import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/auth.store'
import { Layout } from './components/layout/layout'
import { LoginPage } from './pages/auth/login'
import { RegisterPage } from './pages/auth/register'
import { ForgotPasswordPage } from './pages/auth/forgot-password'
import { ResetPasswordPage } from './pages/auth/reset-password'
import { FeedPage } from './pages/home/feed'
import { PetListingPage } from './pages/home/home'
import { PetDetailPage } from './pages/pets/pet-detail'
import { MyMatchesPage } from './pages/matches/my-matches'
import { ReceivedMatchesPage } from './pages/matches/received-matches'
import { ProfilePage } from './pages/profile/profile'
import { MyPetsPage } from './pages/pets/my-pets'
import { MyFavoritesPage } from './pages/pets/my-favorites'
import { NewPetPage } from './pages/pets/new-pet'
import { EditPetPage } from './pages/pets/edit-pet'
import { MessagesPage } from './pages/messages/messages'
import { SearchPage } from './pages/search/search'
import { SettingsPage } from './pages/settings/settings'
import { SavedPostsPage } from './pages/posts/saved-posts'
import { HashtagPostsPage } from './pages/hashtags/hashtag-posts'

import { ToastContainer } from './components/ui/toast'
import { ConfirmDialog } from './components/ui/confirm-dialog'
import { Onboarding } from './components/ui/onboarding'
import { ErrorBoundary } from './components/ui/error-boundary'
import { setToastHandler } from './services/api'
import { useToastStore } from './store/toast.store'
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
  const { checkAuth, isAuthenticated } = useAuthStore()
  const toast = useToastStore()

  useEffect(() => {
    setToastHandler(toast.add)
  }, [toast.add])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isAuthenticated) return
    const initPush = async () => {
      try {
        const { registerServiceWorker, subscribePush } = await import('./services/push')
        await registerServiceWorker()
        await subscribePush()
      } catch {}
    }
    initPush()
  }, [isAuthenticated])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><ErrorBoundary><LoginPage /></ErrorBoundary></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><ErrorBoundary><RegisterPage /></ErrorBoundary></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ErrorBoundary><ForgotPasswordPage /></ErrorBoundary></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ErrorBoundary><ResetPasswordPage /></ErrorBoundary></PublicRoute>} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<ErrorBoundary><FeedPage /></ErrorBoundary>} />
            <Route path="/explorar" element={<ErrorBoundary><PetListingPage /></ErrorBoundary>} />
            <Route path="/pets/:id" element={<ErrorBoundary><PetDetailPage /></ErrorBoundary>} />
            <Route path="/matches/my" element={<ErrorBoundary><MyMatchesPage /></ErrorBoundary>} />
            <Route path="/matches/received" element={<ErrorBoundary><ReceivedMatchesPage /></ErrorBoundary>} />
            <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
            <Route path="/my-pets" element={<ErrorBoundary><MyPetsPage /></ErrorBoundary>} />
            <Route path="/my-favorites" element={<ErrorBoundary><MyFavoritesPage /></ErrorBoundary>} />
            <Route path="/pets/new" element={<ErrorBoundary><NewPetPage /></ErrorBoundary>} />
            <Route path="/pets/:id/edit" element={<ErrorBoundary><EditPetPage /></ErrorBoundary>} />
            <Route path="/messages" element={<ErrorBoundary><MessagesPage /></ErrorBoundary>} />
            <Route path="/messages/:matchId" element={<ErrorBoundary><MessagesPage /></ErrorBoundary>} />
            <Route path="/search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
            <Route path="/saved" element={<ErrorBoundary><SavedPostsPage /></ErrorBoundary>} />
            <Route path="/hashtags/:name" element={<ErrorBoundary><HashtagPostsPage /></ErrorBoundary>} />
          </Route>
          <Route path="/settings" element={<ProtectedRoute><ErrorBoundary><SettingsPage /></ErrorBoundary></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
        <ConfirmDialog />
        <Onboarding />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

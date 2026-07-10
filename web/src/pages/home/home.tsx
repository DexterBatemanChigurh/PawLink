import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth.store'
import api from '../../services/api'
import type { Pet } from '../../types'
import { PetPost } from '../../components/posts/pet-post'
import { PawPrint, Heart, Inbox, LogOut, Plus, User, List, MessageSquare } from 'lucide-react'

const speciesList = [
  { key: '', label: 'Todos', icon: '🐾' },
  { key: 'dog', label: 'Cachorros', icon: '🐕' },
  { key: 'cat', label: 'Gatos', icon: '🐈' },
  { key: 'bird', label: 'Pássaros', icon: '🐦' },
  { key: 'rabbit', label: 'Coelhos', icon: '🐇' },
]

export function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const [species, setSpecies] = useState('')

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['pets', 'feed', species],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string | number> = { page: pageParam, limit: 10 }
      if (species) params.species = species
      const { data } = await api.get('/pets', { params })
      return data as { pets: Pet[]; total: number }
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.pets.length, 0)
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
  })

  const sentinelRef = useRef<HTMLDivElement>(null)

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(observerCallback, { rootMargin: '400px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [observerCallback])

  const allPets = data?.pages?.flatMap((p) => p.pets) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="w-6 h-6 text-indigo-600" />
            <span className="text-lg font-bold text-gray-900">PawLink</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/pets/new')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
              title="Cadastrar Pet"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/my-pets')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
              title="Meus Pets"
            >
              <List className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/matches/my')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Meus Pedidos"
            >
              <Heart className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/matches/received')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Solicitações Recebidas"
            >
              <Inbox className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/conversations')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Mensagens"
            >
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Perfil"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm text-gray-500 mx-1 hidden sm:block">{user?.name}</span>
            <button
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {speciesList.map((s) => (
            <button
              key={s.key}
              onClick={() => setSpecies(s.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                species === s.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="bg-gray-200" style={{ aspectRatio: '16/9' }} />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-10 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : !allPets.length ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🐶</div>
            <p className="text-gray-500 text-lg">Nenhum pet encontrado</p>
            <p className="text-gray-400 text-sm mt-1">Tente alterar o filtro ou volte mais tarde</p>
          </div>
        ) : (
          <div className="space-y-6">
            {allPets.map((pet) => (
              <PetPost key={pet.id} pet={pet} />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="py-8 text-center">
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Carregando mais pets...</span>
            </div>
          )}
          {!hasNextPage && allPets.length > 0 && (
            <p className="text-sm text-gray-400">Todos os pets foram carregados 🎉</p>
          )}
        </div>
      </main>
    </div>
  )
}

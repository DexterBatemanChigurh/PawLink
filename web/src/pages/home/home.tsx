import { useState, useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { Pet } from '../../types'
import { PetPost } from '../../components/posts/pet-post'

const speciesList = [
  { key: '', label: 'Todos', icon: '🐾' },
  { key: 'dog', label: 'Cachorros', icon: '🐕' },
  { key: 'cat', label: 'Gatos', icon: '🐈' },
  { key: 'bird', label: 'Pássaros', icon: '🐦' },
  { key: 'rabbit', label: 'Coelhos', icon: '🐇' },
]

export function PetListingPage() {
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
    <>
      {/* Species filter bar — Facebook-style stories row */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
        {speciesList.map((s) => (
          <button
            key={s.key}
            onClick={() => setSpecies(s.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              species === s.key
                ? 'bg-[#1877F2] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
              <div className="bg-gray-200" style={{ aspectRatio: '16/9' }} />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-10 bg-gray-200 rounded-lg" />
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
        <div className="space-y-4">
          {allPets.map((pet) => (
            <PetPost key={pet.id} pet={pet} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="py-8 text-center">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="w-5 h-5 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Carregando mais pets...</span>
          </div>
        )}
        {!hasNextPage && allPets.length > 0 && (
          <p className="text-sm text-gray-400">Todos os pets foram carregados 🎉</p>
        )}
      </div>
    </>
  )
}

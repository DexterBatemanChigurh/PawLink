import { useState, useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { Pet } from '../../types'
import { PetPost } from '../../components/posts/pet-post'
import { EmptyState } from '../../components/ui/empty-state'
import { PawPrint, SlidersHorizontal, X } from 'lucide-react'

const speciesOptions = [
  { key: '', label: 'Todas' },
  { key: 'dog', label: 'Cachorro' },
  { key: 'cat', label: 'Gato' },
  { key: 'bird', label: 'Pássaro' },
  { key: 'rabbit', label: 'Coelho' },
  { key: 'hamster', label: 'Hamster' },
  { key: 'other', label: 'Outro' },
]

const sizeOptions = [
  { key: '', label: 'Qualquer' },
  { key: 'small', label: 'Pequeno' },
  { key: 'medium', label: 'Médio' },
  { key: 'large', label: 'Grande' },
  { key: 'giant', label: 'Gigante' },
]

interface Filters {
  species: string
  size: string
  city: string
  state: string
  available: boolean
}

const emptyFilters: Filters = { species: '', size: '', city: '', state: '', available: false }

export function PetListingPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['pets', 'feed', appliedFilters],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string | number | boolean> = { page: pageParam, limit: 10 }
      if (appliedFilters.species) params.species = appliedFilters.species
      if (appliedFilters.size) params.size = appliedFilters.size
      if (appliedFilters.city) params.city = appliedFilters.city
      if (appliedFilters.state) params.state = appliedFilters.state
      if (appliedFilters.available) params.available = true
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

  const activeFilterCount = [
    appliedFilters.species,
    appliedFilters.size,
    appliedFilters.city,
    appliedFilters.state,
    appliedFilters.available ? 'x' : '',
  ].filter(Boolean).length

  const applyFilters = () => {
    setAppliedFilters({ ...filters })
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setShowFilters(false)
  }

  const toggleFilters = () => {
    if (showFilters) {
      setFilters({ ...appliedFilters })
    }
    setShowFilters(!showFilters)
  }

  return (
    <>
      {/* Header + Filter button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Encontrar Pets</h1>
        <button
          onClick={toggleFilters}
          className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeFilterCount > 0
              ? 'bg-primary/10 text-primary'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Filtros</h3>
            <button onClick={() => { setShowFilters(false); setFilters({ ...appliedFilters }) }} aria-label="Fechar filtros" className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Espécie</label>
              <select
                value={filters.species}
                onChange={(e) => setFilters({ ...filters, species: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1877F2] bg-card"
              >
                {speciesOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Porte</label>
              <select
                value={filters.size}
                onChange={(e) => setFilters({ ...filters, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1877F2] bg-card"
              >
                {sizeOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cidade</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="Ex: São Paulo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1877F2] bg-card"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
              <input
                type="text"
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                placeholder="Ex: SP"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1877F2] bg-card"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.available}
                  onChange={(e) => setFilters({ ...filters, available: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Apenas disponíveis para adoção
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={clearFilters}
              className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Limpar filtros
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
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
        <EmptyState icon={PawPrint} title="Nenhum pet encontrado" description="Tente alterar o filtro ou volte mais tarde" />
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

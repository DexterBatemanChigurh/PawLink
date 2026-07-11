import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { Pet } from '../../types'
import { PetCardSkeleton } from '../../components/ui/skeleton'
import { QueryState } from '../../components/ui/query-state'
import { EmptyState } from '../../components/ui/empty-state'
import { Heart } from 'lucide-react'
import { SPECIES_EMOJI, SPECIES_LABEL } from '../../types/constants'

export function MyFavoritesPage() {
  const navigate = useNavigate()

  const { data: pets, isLoading, isError, error } = useQuery<Pet[]>({
    queryKey: ['my-favorites'],
    queryFn: async () => {
      const { data } = await api.get('/favorites')
      return data
    },
  })

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Meus Favoritos</h1>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error}
        loading={<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <PetCardSkeleton key={i} />)}</div>}
        isEmpty={!pets?.length}
        empty={<EmptyState icon={Heart} title="Nenhum favorito" description="Você ainda não favoritou nenhum pet. Explore e favorite os que mais gostar!" action={{ label: 'Explorar pets', onClick: () => navigate('/explorar') }} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => navigate(`/pets/${pet.id}`)}
              className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden text-left hover:shadow-md transition-shadow"
            >
              <div className="bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                {pet.photos?.[0] ? (
                  <img loading="lazy" decoding="async" src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl opacity-40">{SPECIES_EMOJI[pet.species] || '🐾'}</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                <p className="text-sm text-gray-500">{pet.breed || 'SRD'} · {SPECIES_LABEL[pet.species] || pet.species}</p>
                {pet.city && <p className="text-xs text-gray-400 mt-1">{pet.city}{pet.state ? `, ${pet.state}` : ''}</p>}
              </div>
            </button>
          ))}
        </div>
      </QueryState>
    </>
  )
}

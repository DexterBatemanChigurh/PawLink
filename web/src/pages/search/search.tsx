import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { User, Pet, Organization } from '../../types'
import { SPECIES_EMOJI, SPECIES_LABEL } from '../../types/constants'
import { Avatar } from '../../components/ui/avatar'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''

  const { data: userData, isLoading: userLoading } = useQuery<{ users: User[]; total: number }>({
    queryKey: ['user-search', query],
    queryFn: async () => {
      const { data } = await api.get('/users/search', { params: { q: query, limit: 50 } })
      return data
    },
    enabled: !!query,
  })

  const { data: pets, isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: ['pet-search', query],
    queryFn: async () => {
      const { data } = await api.get('/pets/search', { params: { q: query } })
      return data
    },
    enabled: !!query,
  })

  const { data: orgs, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ['org-search', query],
    queryFn: async () => {
      const { data } = await api.get('/organizations/search', { params: { q: query } })
      return data
    },
    enabled: !!query,
  })

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Pesquisar</h1>
      <p className="text-sm text-gray-500 mb-4">
        Resultados para: <strong>"{query}"</strong>
      </p>

      {userLoading || petsLoading || orgsLoading ? (
        <div className="text-center py-20 text-gray-400">Buscando...</div>
      ) : (
        <>
          {/* User results */}
          {userData?.users?.length ? (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Usuários</h2>
              <div className="bg-card rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200 mb-6">
                {userData.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => navigate(`/profile?id=${u.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Avatar src={u.avatar} name={u.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {/* Organization results */}
          {orgs?.length ? (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Organizações</h2>
              <div className="bg-card rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200 mb-6">
                {orgs.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => navigate(`/org/${o.slug}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Avatar src={o.avatar} name={o.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{o.name}</p>
                      <p className="text-xs text-gray-500 truncate">{o.city}{o.state ? `, ${o.state}` : ''}</p>
                    </div>
                    {o.verified && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">Verificada</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {/* Pet results */}
          {pets?.length ? (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Pets</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <span className="text-4xl opacity-40">{SPECIES_EMOJI[pet.species] || '🐾'}</span>
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
            </>
          ) : null}

          {!userData?.users?.length && !orgs?.length && !pets?.length && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500">Nenhum resultado encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Tente um termo diferente</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import type { User, Pet, Organization } from '../../types'
import { useNavigate } from 'react-router-dom'
import { SPECIES_EMOJI, ROLE_LABEL } from '../../types/constants'
import { Flame, Building2 } from 'lucide-react'

const roleColors: Record<string, string> = {
  ong: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
  veterinary: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  petshop: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  independent_rescuer: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
  user: 'text-gray-600 bg-gray-100',
  admin: 'text-red-600 bg-red-100',
  moderator: 'text-indigo-600 bg-indigo-100',
  partner: 'text-teal-600 bg-teal-100',
  default: 'text-gray-400 bg-gray-50',
}

export function RightSidebar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: suggestions } = useQuery<User[]>({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const { data } = await api.get('/feed/suggestions')
      return data
    },
  })

  const { data: petRecommendations } = useQuery<Pet[]>({
    queryKey: ['pet-recommendations'],
    queryFn: async () => {
      const { data } = await api.get('/pets/recommendations')
      return data
    },
  })

  const { data: orgs } = useQuery<Organization[]>({
    queryKey: ['organizations-sidebar'],
    queryFn: async () => {
      const { data } = await api.get('/organizations')
      return data
    },
  })

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/users/${userId}/follow`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    },
  })

  const approvedOrgs = orgs?.filter((o) => o.status === 'approved') ?? []

  return (
    <aside className="w-[280px] shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-4">
        {suggestions && suggestions.length > 0 && (
          <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Sugestões para você
            </h3>
            <div className="space-y-3">
              {suggestions.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/profile?id=${s.id}`)}
                    className="shrink-0 w-10 h-10 rounded-full bg-gray-200 overflow-hidden"
                  >
                    {s.avatar ? (
                      <img loading="lazy" decoding="async" src={s.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-500">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => navigate(`/profile?id=${s.id}`)}
                      className="text-sm font-semibold text-gray-900 truncate block w-full text-left hover:underline"
                    >
                      {s.name}
                    </button>
                    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${roleColors[s.role] || roleColors.default}`}>
                      {ROLE_LABEL[s.role] || s.role}
                    </span>
                  </div>
                  <button
                    onClick={() => followMutation.mutate(s.id)}
                    disabled={followMutation.isPending}
                    className="text-xs font-semibold text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-md transition-colors shrink-0"
                  >
                    Seguir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Em destaque
          </h3>
          <div className="space-y-4">
            {petRecommendations && petRecommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  Pets em alta
                </h4>
                <div className="space-y-2">
                  {petRecommendations.slice(0, 3).map((pet) => (
                    <div key={pet.id} className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/pets/${pet.id}`)}
                        className="shrink-0 w-9 h-9 rounded-lg bg-gray-100 overflow-hidden"
                      >
                        {pet.photos?.[0] ? (
                          <img loading="lazy" decoding="async" src={pet.photos[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base">
                            {SPECIES_EMOJI[pet.species] || '🐾'}
                          </div>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => navigate(`/pets/${pet.id}`)}
                          className="text-sm font-semibold text-gray-900 truncate block w-full text-left hover:underline"
                        >
                          {pet.name}
                        </button>
                        <p className="text-[11px] text-gray-500 truncate">{pet.breed || 'SRD'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {approvedOrgs.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-purple-500" />
                  ONGs recentes
                </h4>
                <div className="space-y-2">
                  {approvedOrgs.slice(0, 3).map((org) => (
                    <div key={org.id} className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/org/${org.slug}`)}
                        className="shrink-0 w-9 h-9 rounded-full bg-gray-200 overflow-hidden"
                      >
                        {org.avatar ? (
                          <img loading="lazy" decoding="async" src={org.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-500">
                            {org.name.charAt(0)}
                          </div>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => navigate(`/org/${org.slug}`)}
                          className="text-sm font-semibold text-gray-900 truncate block w-full text-left hover:underline"
                        >
                          {org.name}
                        </button>
                        <p className="text-[11px] text-gray-500 truncate">
                          {org.city}{org.city && org.state ? ', ' : ''}{org.state}
                          {org.verified && (
                            <span className="ml-1 text-blue-500">✓ Verificada</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </aside>
  )
}

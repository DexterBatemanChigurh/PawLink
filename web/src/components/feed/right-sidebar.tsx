import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import type { User } from '../../types'
import { useNavigate } from 'react-router-dom'

const roleLabels: Record<string, string> = {
  ong: 'ONG',
  veterinary: 'Veterinário',
  petshop: 'Pet Shop',
  independent_rescuer: 'Resgatador',
  adopter: 'Adotante',
}

const roleColors: Record<string, string> = {
  ong: 'text-purple-600 bg-purple-100',
  veterinary: 'text-green-600 bg-green-100',
  petshop: 'text-blue-600 bg-blue-100',
  independent_rescuer: 'text-amber-600 bg-amber-100',
  adopter: 'text-gray-600 bg-gray-100',
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

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/users/${userId}/follow`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    },
  })

  return (
    <aside className="w-[280px] shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-4">
        {/* Sugestões */}
        {suggestions && suggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
                      <img src={s.avatar} alt="" className="w-full h-full object-cover" />
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
                    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ${roleColors[s.role] || roleColors.adopter}`}>
                      {roleLabels[s.role] || s.role}
                    </span>
                  </div>
                  <button
                    onClick={() => followMutation.mutate(s.id)}
                    disabled={followMutation.isPending}
                    className="text-xs font-semibold text-[#1877F2] hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors shrink-0"
                  >
                    Seguir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campanhas em destaque */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Em destaque
          </h3>
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
              <p className="text-sm font-semibold text-orange-800">Adote um amigo</p>
              <p className="text-xs text-orange-600 mt-1">
                Encontre seu novo melhor amigo. Todos os animais vacinados e castrados.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm font-semibold text-blue-800">Castração solidária</p>
              <p className="text-xs text-blue-600 mt-1">
                Campanha de castração com preços acessíveis. Agende já!
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

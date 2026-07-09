import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import type { Match } from '../../types'
import { ArrowLeft, Inbox } from 'lucide-react'

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  rejected: 'Recusado',
  adopted: 'Adotado',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  adopted: 'bg-blue-100 text-blue-700',
}

export function ReceivedMatchesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ['received-matches'],
    queryFn: async () => {
      const { data } = await api.get('/matches/received')
      return data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.post(`/matches/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-matches'] })
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Solicitações Recebidas</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Carregando...</div>
        ) : !matches?.length ? (
          <div className="text-center py-20">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma solicitação recebida</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{match.interestedUser?.name || 'Usuário'}</h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[match.status] || 'bg-gray-100'}`}>
                        {statusLabels[match.status] || match.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Interessado em: {match.pet?.name || 'Pet'} ({match.pet?.species === 'dog' ? '🐕' : match.pet?.species === 'cat' ? '🐈' : '🐾'})
                    </p>
                  </div>
                </div>
                {match.message && (
                  <p className="text-sm text-gray-600 mb-1">{match.message}</p>
                )}
                {match.phone && (
                  <p className="text-sm text-gray-400 mb-2">📞 {match.phone}</p>
                )}
                <p className="text-xs text-gray-400 mb-3">
                  Recebido em {new Date(match.createdAt).toLocaleDateString('pt-BR')}
                </p>
                {match.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMutation.mutate({ id: match.id, status: 'accepted' })}
                      disabled={updateMutation.isPending}
                      className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={() => updateMutation.mutate({ id: match.id, status: 'rejected' })}
                      disabled={updateMutation.isPending}
                      className="px-4 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      Recusar
                    </button>
                  </div>
                )}
                {match.status === 'accepted' && (
                  <button
                    onClick={() => updateMutation.mutate({ id: match.id, status: 'adopted' })}
                    disabled={updateMutation.isPending}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Confirmar Adoção
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

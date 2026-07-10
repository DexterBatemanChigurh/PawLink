import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { Match } from '../../types'
import { Heart, MessageSquare } from 'lucide-react'

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

export function MyMatchesPage() {
  const navigate = useNavigate()

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ['my-matches'],
    queryFn: async () => {
      const { data } = await api.get('/matches/my')
      return data
    },
  })

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Meus Interesses</h1>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Carregando...</div>
      ) : !matches?.length ? (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Você ainda não fez nenhum pedido de adoção</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{match.pet?.name || 'Pet'}</h3>
                  <p className="text-sm text-gray-500">
                    {match.pet?.species === 'dog' ? '🐕' : match.pet?.species === 'cat' ? '🐈' : '🐾'} {match.pet?.breed || 'SRD'}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[match.status] || 'bg-gray-100'}`}>
                  {statusLabels[match.status] || match.status}
                </span>
              </div>
              {match.message && (
                <p className="text-sm text-gray-600 mb-1">{match.message}</p>
              )}
              {match.phone && (
                <p className="text-sm text-gray-400">📞 {match.phone}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  Enviado em {new Date(match.createdAt).toLocaleDateString('pt-BR')}
                </p>
                {(match.status === 'accepted' || match.status === 'adopted') && (
                  <button
                    onClick={() => navigate(`/messages/${match.id}`)}
                    className="flex items-center gap-1 text-xs font-medium text-[#1877F2] hover:text-[#166FE5] transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Conversar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

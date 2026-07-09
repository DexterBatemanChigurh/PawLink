import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { Match } from '../../types'
import { ArrowLeft, Heart } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Meus Pedidos</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
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
              <div key={match.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
                <p className="text-xs text-gray-400 mt-2">
                  Enviado em {new Date(match.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

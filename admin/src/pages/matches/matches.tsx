import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Button } from '../../components/ui/button'
import type { Match } from '../../types'

export function MatchesPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ['matches'],
    queryFn: async () => {
      const { data } = await api.get('/matches/all')
      return data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.post(`/matches/${id}/status`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })

  const filtered = matches?.filter((m) => {
    if (filter === 'all') return true
    return m.status === filter
  }) ?? []

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    adopted: 'bg-blue-100 text-blue-700',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    accepted: 'Aceito',
    rejected: 'Recusado',
    adopted: 'Adotado',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Solicitações de Adoção</h1>
      </div>

      <div className="mb-4 flex gap-2">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'pending', label: 'Pendentes' },
          { key: 'accepted', label: 'Aceitas' },
          { key: 'adopted', label: 'Adotadas' },
          { key: 'rejected', label: 'Recusadas' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhuma solicitação encontrada</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Interessado</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Pet</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Mensagem</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Contato</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Data</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((match) => (
                <tr key={match.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {match.interestedUser?.name || 'Usuário'}
                    </div>
                    <div className="text-xs text-gray-500">{match.interestedUser?.email || ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{match.pet?.name || 'Pet'}</div>
                    <div className="text-xs text-gray-500">{match.pet?.species}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-[200px] truncate">
                      {match.message || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{match.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[match.status] || 'bg-gray-100 text-gray-700'}`}>
                      {statusLabels[match.status] || match.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(match.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {match.status === 'pending' && (
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: match.id, status: 'accepted' })}
                        >
                          Aceitar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: match.id, status: 'rejected' })}
                        >
                          Recusar
                        </Button>
                      </div>
                    )}
                    {match.status === 'accepted' && (
                      <Button
                        size="sm"
                        onClick={() => updateMutation.mutate({ id: match.id, status: 'adopted' })}
                      >
                        Confirmar Adoção
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Total: {matches?.length ?? 0} solicitações
      </div>
    </div>
  )
}

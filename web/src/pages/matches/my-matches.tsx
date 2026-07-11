import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useToastStore } from '../../store/toast.store'
import { useConfirmStore } from '../../store/confirm.store'
import type { Match } from '../../types'
import { Skeleton } from '../../components/ui/skeleton'
import { QueryState } from '../../components/ui/query-state'
import { EmptyState } from '../../components/ui/empty-state'
import { MATCH_STATUS_LABEL, MATCH_STATUS_COLOR, SPECIES_EMOJI } from '../../types/constants'
import { Heart, MessageSquare, XCircle } from 'lucide-react'

export function MyMatchesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToastStore()
  const confirm = useConfirmStore()

  const { data: matches, isLoading, isError, error } = useQuery<Match[]>({
    queryKey: ['my-matches'],
    queryFn: async () => {
      const { data } = await api.get('/matches/my')
      return data
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/matches/${id}/cancel`)
    },
    onSuccess: () => {
      toast.add('Interesse cancelado', 'success')
      queryClient.invalidateQueries({ queryKey: ['my-matches'] })
    },
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.add(e?.response?.data?.message || 'Erro ao cancelar', 'error')
    },
  })

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Meus Interesses</h1>

      <QueryState isLoading={isLoading} isError={isError} error={error}
        loading={<div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>}
        isEmpty={!matches?.length}
        empty={<EmptyState icon={Heart} title="Nenhum interesse" description="Você ainda não fez nenhum pedido de adoção" />}
      >
        <div className="space-y-3">
          {matches.map((match) => (
            <div key={match.id} className="bg-card rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{match.pet?.name || 'Pet'}</h3>
                  <p className="text-sm text-gray-500">
                    {SPECIES_EMOJI[match.pet?.species || 'other'] || '🐾'} {match.pet?.breed || 'SRD'}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${MATCH_STATUS_COLOR[match.status] || 'bg-gray-100'}`}>
                  {MATCH_STATUS_LABEL[match.status] || match.status}
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
                <div className="flex items-center gap-2">
                  {(match.status === 'pending' || match.status === 'reviewing') && (
                    <button
                      onClick={() => confirm.show({
                        title: 'Cancelar interesse',
                        message: 'Tem certeza que deseja cancelar seu interesse neste pet?',
                        variant: 'danger',
                        confirmLabel: 'Cancelar',
                        onConfirm: () => cancelMutation.mutate(match.id),
                      })}
                      disabled={cancelMutation.isPending}
                      className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                  )}
                  {(match.status === 'accepted' || match.status === 'adopted') && (
                    <button
                      onClick={() => navigate(`/messages/${match.id}`)}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:text-[#166FE5] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Conversar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </QueryState>
    </>
  )
}

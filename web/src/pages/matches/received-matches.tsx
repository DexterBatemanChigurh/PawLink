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
import { Inbox, MessageSquare } from 'lucide-react'

export function ReceivedMatchesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToastStore()
  const confirm = useConfirmStore()

  const { data: matches, isLoading, isError, error } = useQuery<Match[]>({
    queryKey: ['received-matches'],
    queryFn: async () => {
      const { data } = await api.get('/matches/received')
      return data
    },
  })

  const petHasActiveMatch = (petId: string, excludeId: string): boolean => {
    return (matches || []).some(
      (m) =>
        m.petId === petId &&
        m.id !== excludeId &&
        (m.status === 'accepted' || m.status === 'adopted'),
    )
  }

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.post(`/matches/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-matches'] })
    },
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Erro ao atualizar status'
      toast.add(msg, 'error')
      queryClient.invalidateQueries({ queryKey: ['received-matches'] })
    },
  })

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Solicitações Recebidas</h1>

      <QueryState isLoading={isLoading} isError={isError} error={error}
        loading={<div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>}
        isEmpty={!matches?.length}
        empty={<EmptyState icon={Inbox} title="Nenhuma solicitação" description="Nenhuma solicitação recebida" />}
      >
        <div className="space-y-3">
          {matches.map((match) => (
            <div key={match.id} className="bg-card rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{match.interestedUser?.name || 'Usuário'}</h3>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${MATCH_STATUS_COLOR[match.status] || 'bg-gray-100'}`}>
                      {MATCH_STATUS_LABEL[match.status] || match.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Interessado em: {match.pet?.name || 'Pet'} ({SPECIES_EMOJI[match.pet?.species || 'other'] || '🐾'})
                  </p>
                </div>
              </div>
              {match.message && (
                <p className="text-sm text-gray-600 mb-1">{match.message}</p>
              )}
              {match.phone && (
                <p className="text-sm text-gray-400 mb-2">📞 {match.phone}</p>
              )}
              {match.experience && (
                <p className="text-xs text-gray-500 mb-1">🐾 Experiência: {match.experience}</p>
              )}
              {match.motivation && (
                <p className="text-xs text-gray-500 mb-1">💭 Motivação: {match.motivation}</p>
              )}
              {match.hasHouse !== undefined && (
                <p className="text-xs text-gray-500 mb-1">🏠 Casa própria: {match.hasHouse ? 'Sim' : 'Não'}</p>
              )}
              {match.hasOtherPets !== undefined && (
                <p className="text-xs text-gray-500 mb-1">🐕 Outros pets: {match.hasOtherPets ? 'Sim' : 'Não'}</p>
              )}
              <p className="text-xs text-gray-400 mb-3">
                Recebido em {new Date(match.createdAt).toLocaleDateString('pt-BR')}
              </p>
              {match.status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateMutation.mutate({ id: match.id, status: 'reviewing' })}
                    disabled={updateMutation.isPending || petHasActiveMatch(match.petId, match.id)}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Analisar
                  </button>
                  <button
                    onClick={() => confirm.show({
                      title: 'Aceitar candidato',
                      message: 'Ao aceitar este candidato, os demais interesses neste pet serão automaticamente recusados. Deseja continuar?',
                      variant: 'default',
                      confirmLabel: 'Aceitar',
                      onConfirm: () => updateMutation.mutate({ id: match.id, status: 'accepted' }),
                    })}
                    disabled={updateMutation.isPending || petHasActiveMatch(match.petId, match.id)}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {petHasActiveMatch(match.petId, match.id) ? 'Pet já comprometido' : 'Aceitar'}
                  </button>
                  <button
                    onClick={() => confirm.show({
                      title: 'Recusar candidato',
                      message: 'Tem certeza que deseja recusar este candidato?',
                      variant: 'danger',
                      confirmLabel: 'Recusar',
                      onConfirm: () => updateMutation.mutate({ id: match.id, status: 'rejected' }),
                    })}
                    disabled={updateMutation.isPending}
                    className="px-4 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                  >
                    Recusar
                  </button>
                </div>
              )}
              {match.status === 'reviewing' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => confirm.show({
                      title: 'Aceitar candidato',
                      message: 'Ao aceitar este candidato, os demais interesses neste pet serão automaticamente recusados. Deseja continuar?',
                      variant: 'primary',
                      confirmLabel: 'Aceitar',
                      onConfirm: () => updateMutation.mutate({ id: match.id, status: 'accepted' }),
                    })}
                    disabled={updateMutation.isPending || petHasActiveMatch(match.petId, match.id)}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {petHasActiveMatch(match.petId, match.id) ? 'Pet já comprometido' : 'Aceitar'}
                  </button>
                  <button
                    onClick={() => navigate(`/messages/${match.id}`)}
                    className="flex items-center gap-1 px-4 py-1.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Conversar
                  </button>
                  <button
                    onClick={() => confirm.show({
                      title: 'Recusar candidato',
                      message: 'Tem certeza que deseja recusar este candidato?',
                      variant: 'danger',
                      confirmLabel: 'Recusar',
                      onConfirm: () => updateMutation.mutate({ id: match.id, status: 'rejected' }),
                    })}
                    disabled={updateMutation.isPending}
                    className="px-4 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                  >
                    Recusar
                  </button>
                </div>
              )}
              {match.status === 'accepted' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => confirm.show({
                      title: 'Confirmar adoção',
                      message: 'Ao confirmar a adoção, o pet será marcado como adotado e removido da lista de busca. Deseja continuar?',
                      variant: 'default',
                      confirmLabel: 'Confirmar',
                      onConfirm: () => updateMutation.mutate({ id: match.id, status: 'adopted' }),
                    })}
                    disabled={updateMutation.isPending || petHasActiveMatch(match.petId, match.id)}
                    className="px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                  >
                    {petHasActiveMatch(match.petId, match.id) ? 'Pet já comprometido' : 'Confirmar Adoção'}
                  </button>
                  <button
                    onClick={() => navigate(`/messages/${match.id}`)}
                    className="flex items-center gap-1 px-4 py-1.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Conversar
                  </button>
                </div>
              )}
              {match.status === 'adopted' && (
                <button
                  onClick={() => navigate(`/messages/${match.id}`)}
                  className="flex items-center gap-1 px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Conversar
                </button>
              )}
            </div>
          ))}
        </div>
      </QueryState>
    </>
  )
}

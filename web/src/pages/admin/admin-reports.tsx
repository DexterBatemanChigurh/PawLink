import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useToastStore } from '../../store/toast.store'
import { Skeleton } from '../../components/ui/skeleton'
import { EmptyState } from '../../components/ui/empty-state'
import { Flag, CheckCircle, XCircle, Eye } from 'lucide-react'

interface Report {
  id: string
  reporterId: string
  reporter: { id: string; name: string; email: string }
  reportedUserId: string
  reportedUser: { id: string; name: string; email: string }
  reason: string
  description: string
  status: string
  createdAt: string
}

const FILTERS = ['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  reviewed: 'Revisado',
  resolved: 'Resolvido',
  dismissed: 'Arquivado',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  reviewed: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-600',
}

export function AdminReports() {
  const [filter, setFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const toast = useToastStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ reports: Report[]; total: number }>({
    queryKey: ['admin-reports', filter, page],
    queryFn: async () => {
      const params: { page: number; limit: number } = { page, limit: 20 }
      if (filter !== 'all') params.status = filter
      const { data } = await api.get('/admin/reports', { params })
      return data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/admin/reports/${id}`, { status })
    },
    onSuccess: () => {
      toast.add('Status atualizado com sucesso!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    },
    onError: () => {
      toast.add('Erro ao atualizar status', 'error')
    },
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Todas' : statusLabels[f] || f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : !data?.reports.length ? (
        <EmptyState icon={Flag} title="Nenhuma denúncia encontrada" description="Nenhuma denúncia corresponde aos filtros selecionados." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Denunciado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Denunciante</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Motivo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Descrição</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Data</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.reports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{report.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{report.reportedUser?.name || '---'}</td>
                    <td className="px-4 py-3 text-gray-700">{report.reporter?.name || '---'}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[150px] truncate">{report.reason}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{report.description || '---'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[report.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[report.status] || report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {report.status !== 'resolved' && (
                          <button
                            onClick={() => updateMutation.mutate({ id: report.id, status: 'resolved' })}
                            disabled={updateMutation.isPending}
                            className="p-1.5 rounded hover:bg-green-100 text-green-600 transition-colors"
                            title="Resolver"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {report.status !== 'reviewed' && (
                          <button
                            onClick={() => updateMutation.mutate({ id: report.id, status: 'reviewed' })}
                            disabled={updateMutation.isPending}
                            className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                            title="Revisar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {report.status !== 'dismissed' && (
                          <button
                            onClick={() => updateMutation.mutate({ id: report.id, status: 'dismissed' })}
                            disabled={updateMutation.isPending}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                            title="Arquivar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">{data.total} denúncias</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= data.total}
                  className="px-3 py-1 text-sm rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flag, CheckCircle, XCircle, Eye, Trash2, Ban, UserX } from 'lucide-react'
import api from '../../services/api'
import { Button } from '../../components/ui/button'

interface Report {
  id: string
  reporterId: string
  reporter: { id: string; name: string; email: string }
  reportedUserId: string
  reportedUser: { id: string; name: string; email: string }
  reportedPostId?: string
  reportedPost?: { id: string; content: string; media: string[] }
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
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400',
  reviewed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
  dismissed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function ReportsPage() {
  const [filter, setFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ reports: Report[]; total: number }>({
    queryKey: ['admin-reports', filter, page],
    queryFn: async () => {
      const params: { page: number; limit: number; status?: string } = { page, limit: 20 }
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
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    },
  })

  const enforceMutation = useMutation({
    mutationFn: async ({ action, reportId }: { action: () => Promise<void>; reportId: string }) => {
      await action()
      await api.patch(`/admin/reports/${reportId}`, { status: 'resolved' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Denúncias</h1>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {f === 'all' ? 'Todas' : statusLabels[f] || f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !data?.reports.length ? (
        <div className="text-center py-16">
          <Flag className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhuma denúncia encontrada</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Denunciado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Denunciante</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Motivo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Descrição</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Data</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.reports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{report.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                      {report.reportedPostId ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-400">Post de {report.reportedUser?.name || '---'}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {report.reportedPost?.content?.slice(0, 80)}{report.reportedPost?.content?.length > 80 ? '...' : ''}
                          </span>
                        </div>
                      ) : (
                        report.reportedUser?.name || '---'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{report.reporter?.name || '---'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{report.reason}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{report.description || '---'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[report.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[report.status] || report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {report.status !== 'resolved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMutation.mutate({ id: report.id, status: 'resolved' })}
                            disabled={updateMutation.isPending}
                            className="!p-1.5 !border-green-300 !text-green-600 hover:!bg-green-50 dark:!border-green-600 dark:!text-green-400 dark:hover:!bg-green-900/30"
                            title="Resolver"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {report.status !== 'reviewed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMutation.mutate({ id: report.id, status: 'reviewed' })}
                            disabled={updateMutation.isPending}
                            className="!p-1.5 !border-blue-300 !text-blue-600 hover:!bg-blue-50 dark:!border-blue-600 dark:!text-blue-400 dark:hover:!bg-blue-900/30"
                            title="Revisar"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {report.status !== 'dismissed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMutation.mutate({ id: report.id, status: 'dismissed' })}
                            disabled={updateMutation.isPending}
                            className="!p-1.5 !border-gray-300 !text-gray-500 hover:!bg-gray-50 dark:!border-gray-600 dark:!text-gray-400 dark:hover:!bg-gray-700"
                            title="Arquivar"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {(report.status === 'pending' || report.status === 'reviewed') && (
                        <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
                          {report.reportedPostId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!window.confirm('Tem certeza que deseja excluir este post?')) return
                                enforceMutation.mutate({
                                  reportId: report.id,
                                  action: async () => { await api.delete(`/posts/${report.reportedPostId}`) },
                                })
                              }}
                              disabled={enforceMutation.isPending}
                              className="!p-1.5 !border-red-300 !text-red-600 hover:!bg-red-50 dark:!border-red-600 dark:!text-red-400 dark:hover:!bg-red-900/30"
                              title="Excluir Post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!window.confirm(`Suspender ${report.reportedUser?.name}?`)) return
                              enforceMutation.mutate({
                                reportId: report.id,
                                action: async () => { await api.patch(`/users/admin/users/${report.reportedUserId}/status`, { status: 'blocked' }) },
                              })
                            }}
                            disabled={enforceMutation.isPending}
                            className="!p-1.5 !border-red-300 !text-red-600 hover:!bg-red-50 dark:!border-red-600 dark:!text-red-400 dark:hover:!bg-red-900/30"
                            title="Suspender Usuário"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!window.confirm(`Excluir conta de ${report.reportedUser?.name}? Esta ação não pode ser desfeita.`)) return
                              enforceMutation.mutate({
                                reportId: report.id,
                                action: async () => { await api.delete(`/users/${report.reportedUserId}`) },
                              })
                            }}
                            disabled={enforceMutation.isPending}
                            className="!p-1.5 !border-red-300 !text-red-600 hover:!bg-red-50 dark:!border-red-600 dark:!text-red-400 dark:hover:!bg-red-900/30"
                            title="Excluir Usuário"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">{data.total} denúncias</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-600 dark:text-gray-400"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= data.total}
                  className="px-3 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-600 dark:text-gray-400"
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
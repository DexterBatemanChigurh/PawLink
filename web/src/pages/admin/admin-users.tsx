import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useToastStore } from '../../store/toast.store'
import { Skeleton } from '../../components/ui/skeleton'
import { EmptyState } from '../../components/ui/empty-state'
import { Users, Search, UserX, UserCheck, Ban } from 'lucide-react'

interface AdminUser {
  id: string
  name: string
  email: string
  status: string
  role: string
  createdAt: string
}

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  blocked: 'Banido',
  suspended: 'Suspenso',
  pending_verification: 'Pendente',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
  suspended: 'bg-yellow-100 text-yellow-700',
  pending_verification: 'bg-blue-100 text-blue-700',
}

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const toast = useToastStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ['admin-users', search, page],
    queryFn: async () => {
      const params: { page: number; limit: number } = { page, limit: 20 }
      if (search.trim()) params.q = search.trim()
      const { data } = await api.get('/users/admin/users', { params })
      return data
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/users/admin/users/${id}/status`, { status })
    },
    onSuccess: () => {
      toast.add('Status do usuário atualizado!', 'success')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => {
      toast.add('Erro ao atualizar status', 'error')
    },
  })

  return (
    <div>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nome ou email..."
            aria-label="Buscar usuários"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : !data?.users.length ? (
        <EmptyState icon={Users} title="Nenhum usuário encontrado" description="Nenhum usuário corresponde à busca." />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[u.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[u.status] || u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.status !== 'suspended' && u.status !== 'blocked' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: u.id, status: 'suspended' })}
                            disabled={statusMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors disabled:opacity-50"
                          >
                            <UserX className="w-3 h-3" />
                            Suspender
                          </button>
                        )}
                        {u.status === 'suspended' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: u.id, status: 'active' })}
                            disabled={statusMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            <UserCheck className="w-3 h-3" />
                            Reativar
                          </button>
                        )}
                        {u.status !== 'blocked' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: u.id, status: 'blocked' })}
                            disabled={statusMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            <Ban className="w-3 h-3" />
                            Banir
                          </button>
                        )}
                        {u.status === 'blocked' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: u.id, status: 'active' })}
                            disabled={statusMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            <UserCheck className="w-3 h-3" />
                            Reativar
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
              <p className="text-sm text-gray-500">{data.total} usuários</p>
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

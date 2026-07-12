import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Check, X } from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string
  cnpj: string
  description: string
  mission: string
  city: string
  state: string
  status: 'pending' | 'approved' | 'rejected'
  verified: boolean
  owner: { id: string; name: string; email: string }
  createdAt: string
}

export function OrganizationsPage() {
  const queryClient = useQueryClient()

  const { data: orgs, isLoading } = useQuery<Organization[]>({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      const { data } = await api.get('/organizations')
      return data
    },
    refetchInterval: 10000,
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/organizations/${id}/approve`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/organizations/${id}/reject`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] })
    },
  })

  const pending = orgs?.filter(o => o.status === 'pending') || []
  const others = orgs?.filter(o => o.status !== 'pending') || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Organizações</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !orgs?.length ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">Nenhuma organização cadastrada</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Pendentes ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map(org => (
                  <OrgCard
                    key={org.id}
                    org={org}
                    onApprove={() => approveMutation.mutate(org.id)}
                    onReject={() => rejectMutation.mutate(org.id)}
                    loading={approveMutation.isPending || rejectMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                {pending.length > 0 ? 'Outras' : 'Todas as organizações'}
              </h2>
              <div className="space-y-3">
                {others.map(org => (
                  <OrgCard
                    key={org.id}
                    org={org}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OrgCard({
  org,
  onApprove,
  onReject,
  loading,
  compact,
}: {
  org: Organization
  onApprove?: () => void
  onReject?: () => void
  loading?: boolean
  compact?: boolean
}) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovada',
    rejected: 'Rejeitada',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{org.name}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[org.status]}`}>
              {statusLabels[org.status]}
            </span>
            {org.verified && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Verificada
              </span>
            )}
          </div>
          {!compact && (
            <>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium">CNPJ:</span> {org.cnpj}
              </p>
              {org.city && org.state && (
                <p className="text-sm text-gray-500">
                  {org.city}, {org.state}
                </p>
              )}
              {org.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{org.description}</p>
              )}
              {org.mission && (
                <p className="text-sm text-gray-500 mt-1 italic line-clamp-2">"{org.mission}"</p>
              )}
            </>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Criada por <span className="font-medium">{org.owner?.name || '—'}</span> ({org.owner?.email || '—'})
            {' · '}{new Date(org.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          {!compact && onApprove && onReject && (
            <>
              <button
                onClick={onApprove}
                disabled={loading}
                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                title="Aprovar"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onReject}
                disabled={loading}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                title="Rejeitar"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

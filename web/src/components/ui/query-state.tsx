import type { ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface QueryStateProps {
  isLoading: boolean
  isError: boolean
  error?: Error | null
  children: ReactNode
  loading?: ReactNode
  empty?: ReactNode
  isEmpty?: boolean
}

export function QueryState({ isLoading, isError, error, children, loading, empty, isEmpty }: QueryStateProps) {
  if (isLoading) {
    return loading ? <>{loading}</> : (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-24" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Erro ao carregar
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          {error?.message || 'Não foi possível carregar os dados. Tente novamente.'}
        </p>
      </div>
    )
  }

  if (isEmpty) {
    return empty ? <>{empty}</> : (
      <div className="text-center py-16 text-gray-400">
        Nenhum item encontrado.
      </div>
    )
  }

  return <>{children}</>
}

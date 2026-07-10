import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { DashboardStats } from '../../types'

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard')
      return data
    },
  })

  if (isLoading) {
    return <div className="text-gray-500">Carregando...</div>
  }

  const cards = [
    { label: 'Usuários', value: stats?.totalUsers ?? 0, growth: stats?.usersGrowth ?? 0 },
    { label: 'Pets', value: stats?.totalPets ?? 0, growth: stats?.petsGrowth ?? 0 },
    { label: 'Matches', value: stats?.totalMatches ?? 0, growth: stats?.matchesGrowth ?? 0 },
    { label: 'Adoções', value: stats?.adoptionsCompleted ?? 0, growth: 0 },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {card.value}
            </p>
            {card.growth > 0 && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                +{card.growth}% este mês
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Atividade Recente
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Gráficos e atividade recente aparecerão aqui.
        </p>
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Skeleton } from '../../components/ui/skeleton'
import { Users, PawPrint, Flag, FileText } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalPets: number
  totalPosts: number
  totalReports: number
  pendingReports: number
}

const cards = [
  { key: 'totalUsers', label: 'Usuários', icon: Users, color: 'bg-blue-500' },
  { key: 'totalPets', label: 'Pets', icon: PawPrint, color: 'bg-green-500' },
  { key: 'totalPosts', label: 'Posts', icon: FileText, color: 'bg-purple-500' },
  { key: 'totalReports', label: 'Denúncias', icon: Flag, color: 'bg-red-500' },
]

export function AdminDashboard() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard')
      return data
    },
  })

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const value = data?.[card.key as keyof DashboardStats]
          return (
            <div key={card.key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '-'}</p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Denúncias Pendentes</h2>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-3xl font-bold text-red-600">{data?.pendingReports ?? 0}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">Aguardando revisão</p>
      </div>
    </div>
  )
}

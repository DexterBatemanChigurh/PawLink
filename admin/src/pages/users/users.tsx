import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { Button } from '../../components/ui/button'
import type { User } from '../../types'

export function UsersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const { data } = await api.get('/users', {
        params: search ? { search } : {},
      })
      return data as { users: User[]; total: number }
    },
  })

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
      moderator: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400',
      user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
      ong: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
    }
    return colors[role] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      blocked: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usuários</h1>
        <Button variant="success" onClick={() => navigate('/users/new')}>Novo Usuário</Button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por email ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Nome</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Cadastro</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  Carregando...
                </td>
              </tr>
            )}
            {data?.users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${user.id}/edit`)}>Editar</Button>
                </td>
              </tr>
            ))}
            {data?.users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  Nenhum usuário encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Total: {data?.total ?? 0} usuários
      </div>
    </div>
  )
}

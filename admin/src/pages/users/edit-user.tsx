import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Button } from '../../components/ui/button'
import type { User } from '../../types'

export function EditUserPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`)
      return data
    },
    enabled: !!id,
  })

  const [form, setForm] = useState({ name: '', email: '', role: 'user', status: 'active' })

  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, role: user.role, status: user.status })
  }, [user])

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/users/${id}`, form)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/users')
    },
  })

  if (isLoading) return <div className="text-gray-500">Carregando...</div>
  if (!user) return <div className="text-gray-500">Usuário não encontrado</div>

  const roleOptions = ['user', 'admin', 'moderator', 'ong', 'veterinary', 'petshop']
  const statusOptions = ['active', 'inactive', 'blocked']

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Usuário</h1>
        <Button variant="outline" onClick={() => navigate('/users')}>Voltar</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {updateMutation.isError && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">Erro ao salvar. Tente novamente.</div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

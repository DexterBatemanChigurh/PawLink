import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useToastStore } from '../../store/toast.store'
import { ArrowLeft, Building2 } from 'lucide-react'

export function CreateOrgPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToastStore()

  const [form, setForm] = useState({
    name: '',
    cnpj: '',
    description: '',
    mission: '',
    email: '',
    phone: '',
    website: '',
    city: '',
    state: '',
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/organizations', form)
      return data
    },
    onSuccess: () => {
      toast.add('Organização criada! Aguardando aprovação do admin.', 'success')
      queryClient.invalidateQueries({ queryKey: ['my-organization'] })
      navigate('/profile')
    },
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.add(e?.response?.data?.message || 'Erro ao criar organização', 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate()
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Criar Organização</h1>
            <p className="text-sm text-gray-500">Cadastre sua ONG para gerenciar adoções</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Organização <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                required
                placeholder="Ex: Associação Amigos dos Animais"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.cnpj}
                onChange={set('cnpj')}
                required
                placeholder="00.000.000/0001-00"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={set('phone')}
                placeholder="(34) 99999-9999"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="contato@ong.org"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
              <input
                type="url"
                value={form.website}
                onChange={set('website')}
                placeholder="https://"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                value={form.city}
                onChange={set('city')}
                placeholder="Uberlândia"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input
                type="text"
                value={form.state}
                onChange={set('state')}
                placeholder="MG"
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                placeholder="Conte um pouco sobre a organização..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Missão</label>
              <textarea
                value={form.mission}
                onChange={set('mission')}
                placeholder="Qual a missão da sua organização?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              />
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Após criar, sua organização passará por aprovação manual do administrador.
              Você receberá uma notificação quando for aprovada.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !form.name || !form.cnpj}
              className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Organização'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

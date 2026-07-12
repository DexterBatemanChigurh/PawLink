import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { uploadFile } from '../../services/upload'
import { useToastStore } from '../../store/toast.store'
import { useConfirmStore } from '../../store/confirm.store'
import type { Organization } from '../../types'
import { Skeleton } from '../../components/ui/skeleton'
import { Avatar } from '../../components/ui/avatar'
import { ArrowLeft, Building2, Camera, Save, Trash2 } from 'lucide-react'

export function EditOrgPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const toast = useToastStore()
  const confirm = useConfirmStore()
  const queryClient = useQueryClient()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [savingCover, setSavingCover] = useState(false)

  const { data: org, isLoading } = useQuery<Organization>({
    queryKey: ['org', slug],
    queryFn: async () => {
      const { data } = await api.get(`/organizations/slug/${slug}`)
      return data
    },
    enabled: !!slug,
  })

  const [form, setForm] = useState({
    name: '', description: '', mission: '',
    email: '', phone: '', website: '', city: '', state: '',
  })

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name || '',
        description: org.description || '',
        mission: org.mission || '',
        email: org.email || '',
        phone: org.phone || '',
        website: org.website || '',
        city: org.city || '',
        state: org.state || '',
      })
    }
  }, [org])

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/organizations/${org!.id}`, form)
    },
    onSuccess: () => {
      toast.add('Organização atualizada com sucesso!', 'success')
      navigate(`/org/${slug}`)
    },
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.add(e?.response?.data?.message || 'Erro ao atualizar', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/organizations/${org!.id}`)
    },
    onSuccess: () => {
      toast.add('Organização excluída com sucesso', 'success')
      queryClient.invalidateQueries({ queryKey: ['my-organization'] })
      navigate('/profile')
    },
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.add(e?.response?.data?.message || 'Erro ao excluir', 'error')
    },
  })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setSavingAvatar(true)
      const url = await uploadFile(file, '/upload')
      await api.patch(`/organizations/${org!.id}`, { avatar: url })
      toast.add('Foto atualizada!', 'success')
    } catch {
      toast.add('Erro ao atualizar foto', 'error')
    } finally {
      setSavingAvatar(false)
    }
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setSavingCover(true)
      const url = await uploadFile(file, '/upload')
      await api.patch(`/organizations/${org!.id}`, { coverPhoto: url })
      toast.add('Capa atualizada!', 'success')
    } catch {
      toast.add('Erro ao atualizar capa', 'error')
    } finally {
      setSavingCover(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-72 w-full rounded-lg mb-4" />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Organização não encontrada</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-primary hover:underline">Voltar</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(`/org/${slug}`)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-6">Editar Organização</h1>

      {/* Photos */}
      <div className="space-y-6 mb-8">
        {/* Cover */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Foto de Capa</label>
          <div className="relative h-48 bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg overflow-hidden group">
            {org.coverPhoto && (
              <img loading="lazy" decoding="async" src={org.coverPhoto} alt="" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={savingCover}
              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                <Camera className="w-4 h-4" />
                {savingCover ? 'Salvando...' : 'Alterar capa'}
              </div>
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          </div>
        </div>

        {/* Avatar */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Foto de Perfil</label>
          <div className="relative w-32 h-32 group">
            <Avatar src={org.avatar} name={org.name} size="lg" className="w-32 h-32 rounded-full border-4 border-gray-200" />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={savingAvatar}
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium">
                <Camera className="w-3 h-3" />
                {savingAvatar ? '...' : 'Alterar'}
              </div>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate() }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              value={form.name}
              onChange={set('name')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              value={form.phone}
              onChange={set('phone')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={form.email}
              onChange={set('email')}
              type="email"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              value={form.website}
              onChange={set('website')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input
              value={form.city}
              onChange={set('city')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input
              value={form.state}
              onChange={set('state')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Missão</label>
          <textarea
            value={form.mission}
            onChange={set('mission')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/org/${slug}`)}
            className="px-6 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>

        <hr className="border-gray-200" />

        <div>
          <h3 className="text-sm font-semibold text-red-600 mb-2">Zona de perigo</h3>
          <p className="text-xs text-gray-500 mb-3">
            Todos os posts e pets vinculados a esta organização serão permanentemente excluídos. Esta ação não pode ser desfeita.
          </p>
          <button
            type="button"
            onClick={() => confirm.show({
              title: 'Excluir organização',
              message: `Tem certeza que deseja excluir "${org.name}"? Todos os posts e pets associados serão perdidos permanentemente.`,
              variant: 'danger',
              confirmLabel: 'Excluir tudo',
              onConfirm: () => deleteMutation.mutate(),
            })}
            disabled={deleteMutation.isPending}
            className="px-6 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir organização'}
          </button>
        </div>
      </form>
    </div>
  )
}

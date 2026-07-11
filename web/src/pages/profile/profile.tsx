import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth.store'
import api from '../../services/api'
import type { User as UserType, Post, Follow } from '../../types'
import { useToastStore } from '../../store/toast.store'
import { ProfileSkeleton } from '../../components/ui/skeleton'
import { Avatar } from '../../components/ui/avatar'
import { ROLE_LABEL, ROLE_BADGE } from '../../types/constants'
import { Save, UserPlus, UserCheck, Camera, Ban, Flag, MoreHorizontal } from 'lucide-react'

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const profileId = searchParams.get('id')
  const { user: currentUser, checkAuth } = useAuthStore()

  const [editing, setEditing] = useState(false)
  const toast = useToastStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', bio: '' })
  const [showActions, setShowActions] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const coverInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const isOwnProfile = !profileId || profileId === currentUser?.id
  const targetId = isOwnProfile ? currentUser?.id : profileId

  const { data: profileUser, isLoading: loadingUser } = useQuery<UserType>({
    queryKey: ['user', targetId],
    queryFn: async () => {
      if (isOwnProfile) return currentUser as UserType
      const { data } = await api.get(`/users/${targetId}`)
      return data
    },
    enabled: !!targetId,
  })

  const { data: userPosts } = useQuery<Post[]>({
    queryKey: ['user-posts', targetId],
    queryFn: async () => {
      const { data } = await api.get(`/posts/user/${targetId}`)
      return data
    },
    enabled: !!targetId,
  })

  const { data: followerCount } = useQuery<Follow[]>({
    queryKey: ['followers', targetId],
    queryFn: async () => {
      const { data } = await api.get(`/users/${targetId}/followers`)
      return data
    },
    enabled: !!targetId,
  })

  const { data: followingCount } = useQuery<Follow[]>({
    queryKey: ['following', targetId],
    queryFn: async () => {
      const { data } = await api.get(`/users/${targetId}/following`)
      return data
    },
    enabled: !!targetId,
  })

  const { data: followCheck } = useQuery<{ following: boolean }>({
    queryKey: ['follow-check', targetId],
    queryFn: async () => {
      const { data } = await api.get(`/users/${targetId}/following/check`)
      return data
    },
    enabled: !!targetId && !isOwnProfile,
  })

  const followMutation = useMutation({
    mutationFn: async () => {
      if (followCheck?.following) {
        await api.delete(`/users/${targetId}/follow`)
      } else {
        await api.post(`/users/${targetId}/follow`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-check', targetId] })
      queryClient.invalidateQueries({ queryKey: ['followers', targetId] })
      queryClient.invalidateQueries({ queryKey: ['following', targetId] })
    },
  })

  const blockMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/users/${targetId}/block`)
    },
    onSuccess: () => {
      toast.add('Usuário bloqueado', 'success')
      navigate('/')
    },
  })

  const reportMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/users/${targetId}/report`, { reason: reportReason })
    },
    onSuccess: () => {
      toast.add('Denúncia enviada com sucesso', 'success')
      setShowReportModal(false)
      setReportReason('')
    },
  })

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/upload/cover', formData)
      await api.patch('/users/me/cover', { url: data.url })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', targetId] })
      checkAuth()
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/upload/avatar', formData)
      await api.patch('/users/me/avatar', { url: data.url })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', targetId] })
      checkAuth()
    },
  })

  useEffect(() => {
    if (currentUser && isOwnProfile) {
      setForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
      })
    }
  }, [currentUser, isOwnProfile])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/users/me', form)
      await checkAuth()
      queryClient.invalidateQueries({ queryKey: ['user', targetId] })
      setEditing(false)
    } catch {
      toast.add('Erro ao salvar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadCoverMutation.mutate(file)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAvatarMutation.mutate(file)
  }

  if (loadingUser || !profileUser) {
    return <ProfileSkeleton />
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover */}
        <div className="relative h-32 bg-gradient-to-r from-primary to-primary-hover group">
          {profileUser.coverPhoto && (
            <img loading="lazy" decoding="async" src={profileUser.coverPhoto} alt="" className="w-full h-full object-cover" />
          )}
          {!isOwnProfile && (
            <button
              onClick={() => navigate(-1)}
              aria-label="Voltar"
              className="absolute top-3 left-3 bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {isOwnProfile && (
            <>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              <button
                onClick={() => coverInputRef.current?.click()}
                className="absolute top-3 right-3 bg-white/80 hover:bg-card dark:bg-gray-800/80 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full p-1.5 transition-colors z-10 opacity-0 group-hover:opacity-100"
                title="Alterar capa"
              >
                <Camera className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + Info */}
          <div className="flex items-end -mt-12 mb-4">
            <div className="relative group">
              <Avatar src={profileUser.avatar} name={profileUser.name} size="lg" className="w-20 h-20 rounded-xl border-2 border-white dark:border-gray-700" />
              {isOwnProfile && (
                <>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-white dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Alterar avatar"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
            <div className="ml-4 mb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 truncate">{profileUser.name}</h2>
                {ROLE_BADGE[profileUser.role] && (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded shrink-0 ${ROLE_BADGE[profileUser.role].color}`}>
                    {ROLE_LABEL[profileUser.role] || profileUser.role}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-0.5">
                <span><strong className="text-gray-900">{followerCount?.length || 0}</strong> seguidores</span>
                <span><strong className="text-gray-900">{followingCount?.length || 0}</strong> seguindo</span>
              </div>
            </div>
            {!isOwnProfile && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  aria-label="Ações"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
                {showActions && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-card rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                    <button
                      onClick={() => { setShowActions(false); blockMutation.mutate() }}
                      className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Ban className="w-4 h-4 text-red-500" />
                      Bloquear
                    </button>
                    <button
                      onClick={() => { setShowActions(false); setShowReportModal(true) }}
                      className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4 text-orange-500" />
                      Denunciar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {isOwnProfile && editing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="(34) 99999-9999" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                    rows={3} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditing(false)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {profileUser.bio && <p className="text-sm text-gray-600">{profileUser.bio}</p>}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm text-gray-900 mt-0.5">{profileUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Telefone</p>
                    <p className="text-sm text-gray-900 mt-0.5">{profileUser.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Membro desde</p>
                    <p className="text-sm text-gray-900 mt-0.5">{new Date(profileUser.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {!isOwnProfile ? (
                  <button
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      followCheck?.following
                        ? 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                        : 'bg-primary text-white hover:bg-primary-hover'
                    }`}
                  >
                    {followCheck?.following ? (
                      <><UserCheck className="w-4 h-4" /> Seguindo</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Seguir</>
                    )}
                  </button>
                ) : (
                  <button onClick={() => setEditing(true)}
                    className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Editar Perfil
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      {userPosts && userPosts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Posts</h3>
          <div className="space-y-3">
            {userPosts.map((post) => (
              <div key={post.id} className="bg-card rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Escape') setShowReportModal(false) }} aria-label="Fechar">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Denunciar {profileUser.name}</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Descreva o motivo da denúncia..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none resize-none focus:border-[#1877F2]"
              rows={4}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowReportModal(false); setReportReason('') }}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => reportMutation.mutate()}
                disabled={!reportReason.trim() || reportMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {reportMutation.isPending ? 'Enviando...' : 'Denunciar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth.store'
import api from '../../services/api'
import type { User, Post, Pet } from '../../types'
import { useToastStore } from '../../store/toast.store'
import { ProfileSkeleton } from '../../components/ui/skeleton'
import { Avatar } from '../../components/ui/avatar'
import { PostCard } from '../../components/posts/post-card'
import { ROLE_LABEL, ROLE_BADGE } from '../../types/constants'
import { Camera, UserPlus, UserCheck, Ban, Flag, MoreHorizontal, Save, X, MessageCircle, ImageIcon, Send, MapPin, Calendar, Phone, Mail, Info, Shield, Heart, PawPrint } from 'lucide-react'

const tabs = [
  { key: 'posts', label: 'Posts' },
  { key: 'about', label: 'Sobre' },
  { key: 'pets', label: 'Pets' },
  { key: 'photos', label: 'Fotos' },
] as const

type TabKey = typeof tabs[number]['key']

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const profileId = searchParams.get('id')
  const { user: currentUser, checkAuth } = useAuthStore()

  const [activeTab, setActiveTab] = useState<TabKey>('posts')
  const [editing, setEditing] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [composerText, setComposerText] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const toast = useToastStore()

  const isOwnProfile = !profileId || profileId === currentUser?.id
  const targetId = isOwnProfile ? currentUser?.id : profileId

  const { data: profileUser, isLoading: loadingUser } = useQuery<User>({
    queryKey: ['user', targetId],
    queryFn: async () => {
      if (isOwnProfile) return currentUser as User
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

  const { data: followerCount } = useQuery<unknown[]>({
    queryKey: ['followers', targetId],
    queryFn: async () => {
      const { data } = await api.get(`/users/${targetId}/followers`)
      return data
    },
    enabled: !!targetId,
  })

  const { data: followingCount } = useQuery<unknown[]>({
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

  const { data: userPets } = useQuery<Pet[]>({
    queryKey: ['user-pets', targetId],
    queryFn: async () => {
      const { data } = await api.get(`/pets/owner/${targetId}`)
      return data
    },
    enabled: !!targetId,
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
      await api.post(`/users/${targetId}/report`, { reason: reportReason, description: reportReason })
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

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post('/posts', { content, type: 'update' })
      return data
    },
    onSuccess: () => {
      setComposerText('')
      queryClient.invalidateQueries({ queryKey: ['user-posts', targetId] })
    },
  })

  function initializeForm() {
    if (currentUser && isOwnProfile) {
      setForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
      })
    }
  }

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

  const allPhotos = userPosts?.flatMap(p => p.media || []).filter(Boolean) || []

  const speciesIcons: Record<string, typeof Heart> = {
    dog: Heart,
    cat: Heart,
    other: PawPrint,
  }

  return (
    <div className="max-w-[940px] mx-auto">
      {/* Cover */}
      <div className="relative h-72 bg-gradient-to-r from-primary to-primary-hover rounded-b-lg overflow-hidden group">
        {profileUser.coverPhoto && (
          <img loading="lazy" decoding="async" src={profileUser.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
        {!isOwnProfile && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors z-10"
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
              className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors z-10 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 shadow"
            >
              <Camera className="w-4 h-4" />
              Editar capa
            </button>
          </>
        )}
      </div>

      {/* Avatar + Name + Actions */}
      <div className="px-8">
        <div className="flex items-end -mt-20 mb-4">
          <div className="relative group shrink-0">
            <Avatar
              src={profileUser.avatar}
              name={profileUser.name}
              size="lg"
              className="w-40 h-40 rounded-full border-4 border-white shadow-md"
            />
            {isOwnProfile && (
              <>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-primary text-white rounded-full p-1.5 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <div className="ml-4 mb-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{profileUser.name}</h1>
              {ROLE_BADGE[profileUser.role] && (
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${ROLE_BADGE[profileUser.role].color}`}>
                  {ROLE_LABEL[profileUser.role] || profileUser.role}
                </span>
              )}
            </div>
            <p className="text-base text-gray-500 mt-0.5">
              <span className="font-semibold text-gray-900">{followerCount?.length || 0}</span> seguidores
              {' · '}
              <span className="font-semibold text-gray-900">{followingCount?.length || 0}</span> seguindo
            </p>
          </div>
          <div className="flex items-center gap-2 mb-2 shrink-0">
            {isOwnProfile ? (
              <button
                onClick={() => { initializeForm(); setEditing(true) }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
              >
                Editar Perfil
              </button>
            ) : (
              <>
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    followCheck?.following
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-primary hover:bg-primary-hover text-white'
                  }`}
                >
                  {followCheck?.following ? (
                    <><UserCheck className="w-4 h-4" /> Seguindo</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Seguir</>
                  )}
                </button>
                <button
                  onClick={() => navigate('/messages')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  Mensagem
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    aria-label="Ações"
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                  </button>
                  {showActions && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-card rounded-lg shadow-xl border border-gray-200 z-50 py-1" onMouseLeave={() => setShowActions(false)}>
                      <button
                        onClick={() => { setShowActions(false); blockMutation.mutate() }}
                        className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Ban className="w-4 h-4 text-red-500" />
                        Bloquear
                      </button>
                      <button
                        onClick={() => { setShowActions(false); setShowReportModal(true) }}
                        className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Flag className="w-4 h-4 text-orange-500" />
                        Denunciar
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Separator */}
      <hr className="border-gray-300" />

      {/* Tabs */}
      <div className="px-1">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-300" />

      {/* Content */}
      <div className="px-8 py-4">
        {activeTab === 'posts' && (
          <div className="max-w-[680px]">
            {isOwnProfile && (
              <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex gap-3">
                  <Avatar src={currentUser?.avatar} name={currentUser?.name} size="sm" className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1">
                    <textarea
                      value={composerText}
                      onChange={e => setComposerText(e.target.value)}
                      placeholder="No que você está pensando?"
                      className="w-full border-none outline-none resize-none text-sm text-gray-900 placeholder-gray-400 bg-transparent"
                      rows={3}
                    />
                  </div>
                </div>
                <hr className="my-3 border-gray-200" />
                <div className="flex justify-between items-center">
                  <button className="flex items-center gap-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg px-3 py-1.5 transition-colors">
                    <ImageIcon className="w-5 h-5 text-green-500" />
                    Foto
                  </button>
                  <button
                    onClick={() => {
                      if (composerText.trim()) {
                        createPostMutation.mutate(composerText.trim())
                      }
                    }}
                    disabled={!composerText.trim() || createPostMutation.isPending}
                    className="px-6 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {createPostMutation.isPending ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </div>
            )}
            {userPosts && userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum post ainda</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="grid grid-cols-2 gap-6 max-w-[680px]">
            {editing && isOwnProfile ? (
              <div className="col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
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
              </div>
            ) : (
              <>
                {profileUser.bio && (
                  <div className="col-span-2">
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <Info className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Bio</p>
                        <p className="text-sm text-gray-900 mt-0.5">{profileUser.bio}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Email</p>
                    <p className="text-sm text-gray-900 mt-0.5">{profileUser.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Telefone</p>
                    <p className="text-sm text-gray-900 mt-0.5">{profileUser.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Membro desde</p>
                    <p className="text-sm text-gray-900 mt-0.5">{new Date(profileUser.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Tipo de conta</p>
                    <p className="text-sm text-gray-900 mt-0.5 capitalize">{ROLE_LABEL[profileUser.role] || profileUser.role}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'pets' && (
          <div>
            {userPets && userPets.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {userPets.map(pet => {
                  const SpeciesIcon = speciesIcons[pet.species] || Heart
                  return (
                    <div
                      key={pet.id}
                      onClick={() => navigate(`/pets/${pet.id}`)}
                      className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                    >
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        {pet.photos?.[0] ? (
                          <img loading="lazy" decoding="async" src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <SpeciesIcon className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{pet.name}</h3>
                        {pet.breed && <p className="text-xs text-gray-500 truncate">{pet.breed}</p>}
                        <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          pet.status === 'available'
                            ? 'bg-green-100 text-green-700'
                            : pet.status === 'adopted'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {pet.status === 'available' ? 'Disponível' : pet.status === 'adopted' ? 'Adotado' : 'Em processo'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum pet cadastrado</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            {allPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {allPhotos.map((photo, idx) => (
                  <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img loading="lazy" decoding="async" src={photo} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma foto ainda</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && isOwnProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(false)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Perfil</h3>
              <button onClick={() => setEditing(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  rows={3} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditing(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Denunciar {profileUser.name}</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Descreva o motivo da denúncia..."
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg p-3 pb-8 text-sm outline-none resize-none focus:border-primary"
              rows={4}
            />
            <div className="text-xs text-gray-400 text-right -mt-6 pr-3 pointer-events-none">
              {reportReason.length}/500
            </div>
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

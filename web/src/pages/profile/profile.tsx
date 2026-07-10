import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth.store'
import api from '../../services/api'
import type { User as UserType, Post, Follow } from '../../types'
import { Save, UserPlus, UserCheck, PawPrint } from 'lucide-react'

const roleLabels: Record<string, string> = {
  user: 'Usuário',
  ong: 'ONG',
  independent_rescuer: 'Resgatista',
  veterinary: 'Veterinário',
  petshop: 'Petshop',
  admin: 'Administrador',
}

const roleBadges: Record<string, string> = {
  veterinary: 'bg-green-100 text-green-700',
  petshop: 'bg-blue-100 text-blue-700',
  ong: 'bg-purple-100 text-purple-700',
  independent_rescuer: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
}

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const profileId = searchParams.get('id')
  const { user: currentUser, checkAuth } = useAuthStore()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', bio: '' })

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
      setEditing(false)
    } catch {
      alert('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loadingUser || !profileUser) {
    return <div className="text-center py-20 text-gray-400">Carregando...</div>
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1877F2] to-[#166FE5] h-24 relative">
          {!isOwnProfile && (
            <button
              onClick={() => navigate(-1)}
              className="absolute top-3 left-3 bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-12 mb-4">
            <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center text-3xl border-2 border-white">
              {profileUser.avatar ? (
                <img src={profileUser.avatar} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <div className="ml-4 mb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 truncate">{profileUser.name}</h2>
                {roleBadges[profileUser.role] && (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded shrink-0 ${roleBadges[profileUser.role]}`}>
                    {roleLabels[profileUser.role] || profileUser.role}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-0.5">
                <span><strong className="text-gray-900">{followerCount?.length || 0}</strong> seguidores</span>
                <span><strong className="text-gray-900">{followingCount?.length || 0}</strong> seguindo</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {isOwnProfile && editing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1877F2] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1877F2] outline-none"
                    placeholder="(34) 99999-9999" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1877F2] outline-none"
                    rows={3} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditing(false)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 bg-[#1877F2] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#166FE5] disabled:opacity-50 flex items-center justify-center gap-2">
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
                        : 'bg-[#1877F2] text-white hover:bg-[#166FE5]'
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
                    className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
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
              <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

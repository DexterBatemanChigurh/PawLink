import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth.store'
import api from '../../services/api'
import type { User, Post, Pet } from '../../types'
import { useToastStore } from '../../store/toast.store'
import { ProfileSkeleton } from '../../components/ui/skeleton'
import { ProfileCover } from '../../components/profile/profile-cover'
import { ProfileHeader } from '../../components/profile/profile-header'
import { ProfileTabs } from '../../components/profile/profile-tabs'
import { ProfileAbout } from '../../components/profile/profile-about'
import { ProfilePosts } from '../../components/profile/profile-posts'
import { ProfilePets } from '../../components/profile/profile-pets'
import { ProfilePhotos } from '../../components/profile/profile-photos'
import { ProfileEditModal } from '../../components/profile/profile-edit-modal'

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
  const [saving, setSaving] = useState(false)
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
      const { data } = await api.get(`/posts/user/${targetId}`, { params: { page: 1, limit: 50 } })
      return data.posts
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
      const { data } = await api.post('/upload/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
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
      const { data } = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await api.patch('/users/me/avatar', { url: data.url })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', targetId] })
      checkAuth()
    },
  })



  if (loadingUser || !profileUser) {
    return <ProfileSkeleton />
  }

  const allPhotos = userPosts?.flatMap(p => p.media || []).filter(Boolean) || []

  return (
    <div className="max-w-[940px] mx-auto">
      {!isOwnProfile && (
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/80 hover:bg-white/90 text-gray-700 rounded-full p-2 transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <ProfileCover
        src={profileUser.coverPhoto}
        isOwnProfile={isOwnProfile}
        onCoverChange={(file) => uploadCoverMutation.mutate(file)}
      />

      <ProfileHeader
        user={profileUser}
        isOwnProfile={isOwnProfile}
        followerCount={followerCount?.length || 0}
        followingCount={followingCount?.length || 0}
        isFollowing={followCheck?.following}
        isFollowPending={followMutation.isPending}
        showActions={showActions}
        onToggleActions={() => setShowActions(!showActions)}
        onFollow={() => followMutation.mutate()}
        onMessage={() => navigate('/messages')}
        onBlock={() => { setShowActions(false); blockMutation.mutate() }}
        onReport={() => { setShowActions(false); setShowReportModal(true) }}
        onEdit={() => { initializeForm(); setEditing(true) }}
        onAvatarChange={(file) => uploadAvatarMutation.mutate(file)}
      />

      <hr className="border-gray-300" />

      <ProfileTabs tabs={tabs} active={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      <div className="px-8 py-4">
        {activeTab === 'posts' && <ProfilePosts posts={userPosts || []} isOwnProfile={isOwnProfile} />}
        {activeTab === 'about' && <ProfileAbout user={profileUser} />}
        {activeTab === 'pets' && <ProfilePets pets={userPets || []} />}
        {activeTab === 'photos' && <ProfilePhotos photos={allPhotos} />}
      </div>

      {editing && isOwnProfile && (
        <ProfileEditModal
          defaultValues={{
            name: currentUser?.name || '',
            phone: currentUser?.phone || '',
            bio: currentUser?.bio || '',
            city: currentUser?.city || '',
            state: currentUser?.state || '',
          }}
          saving={saving}
          onSave={async (data) => {
            setSaving(true)
            try {
              await api.patch('/users/me', data)
              await checkAuth()
              queryClient.invalidateQueries({ queryKey: ['user', targetId] })
              setEditing(false)
            } catch {
              toast.add('Erro ao salvar', 'error')
            } finally {
              setSaving(false)
            }
          }}
          onClose={() => setEditing(false)}
        />
      )}

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

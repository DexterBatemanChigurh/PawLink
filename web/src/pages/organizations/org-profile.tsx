import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { useToastStore } from '../../store/toast.store'
import { uploadFile } from '../../services/upload'
import { FileUpload } from '../../components/ui/file-upload'
import type { Organization, Post, Pet } from '../../types'
import { ORG_STATUS_LABEL, ORG_STATUS_COLOR } from '../../types/constants'
import { Skeleton } from '../../components/ui/skeleton'
import { Avatar } from '../../components/ui/avatar'
import { PostCard } from '../../components/posts/post-card'
import { EmptyState } from '../../components/ui/empty-state'
import { ArrowLeft, Building2, MapPin, Globe, Mail, Phone, CheckCircle, Clock, FileText, PawPrint, FileText as FileTextIcon, Settings, Image, X } from 'lucide-react'

const tabs = [
  { key: 'about', label: 'Sobre' },
  { key: 'posts', label: 'Posts' },
  { key: 'pets', label: 'Pets' },
] as const

type TabKey = typeof tabs[number]['key']

export function OrgProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const toast = useToastStore()
  const [activeTab, setActiveTab] = useState<TabKey>('about')
  const [composerText, setComposerText] = useState('')
  const [composerMedia, setComposerMedia] = useState<File | null>(null)
  const [composerPreview, setComposerPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data: org, isLoading, isError } = useQuery<Organization>({
    queryKey: ['org', slug],
    queryFn: async () => {
      const { data } = await api.get(`/organizations/slug/${slug}`)
      return data
    },
    enabled: !!slug,
  })

  const isOwner = org?.ownerId === user?.id

  const { data: orgPosts, isLoading: postsLoading } = useQuery<{ posts: Post[]; total: number }>({
    queryKey: ['org-posts', org?.id],
    queryFn: async () => {
      const { data } = await api.get(`/posts/organization/${org!.id}`)
      return data
    },
    enabled: !!org?.id && activeTab === 'posts',
  })

  const { data: orgPets, isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: ['org-pets', org?.id],
    queryFn: async () => {
      const { data } = await api.get(`/pets/organization/${org!.id}`)
      return data
    },
    enabled: !!org?.id && activeTab === 'pets',
  })

  const orgPostMutation = useMutation({
    mutationFn: async () => {
      setUploading(true)
      let mediaUrl: string | undefined
      if (composerMedia) {
        mediaUrl = await uploadFile(composerMedia, '/upload')
      }
      await api.post('/posts', {
        content: composerText.trim(),
        media: mediaUrl ? [mediaUrl] : undefined,
        organizationId: org!.id,
      })
    },
    onSuccess: () => {
      toast.add('Post publicado como ONG!', 'success')
      setComposerText('')
      setComposerMedia(null)
      setComposerPreview(null)
      queryClient.invalidateQueries({ queryKey: ['org-posts', org?.id] })
    },
    onError: () => {
      toast.add('Erro ao publicar', 'error')
    },
    onSettled: () => {
      setUploading(false)
    },
  })

  const handleComposerMedia = (files: File[]) => {
    setComposerMedia(files[0] || null)
    if (files[0]) {
      const reader = new FileReader()
      reader.onload = () => setComposerPreview(reader.result as string)
      reader.readAsDataURL(files[0])
    } else {
      setComposerPreview(null)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-[940px] mx-auto">
        <Skeleton className="h-72 w-full rounded-b-lg mb-4" />
        <div className="px-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
      </div>
    )
  }

  if (isError || !org) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Organização não encontrada</h2>
        <p className="text-sm text-gray-500">Esta organização não existe ou foi removida.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-primary hover:underline">Voltar</button>
      </div>
    )
  }

  return (
    <div className="max-w-[940px] mx-auto">
      {/* Cover */}
      <div className="relative h-72 bg-gradient-to-r from-purple-500 to-purple-700 rounded-b-lg overflow-hidden">
        {org.coverPhoto && (
          <img loading="lazy" decoding="async" src={org.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {isOwner && (
          <button
            onClick={() => navigate(`/org/${org.slug}/edit`)}
            aria-label="Editar organização"
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Avatar + Info */}
      <div className="px-8">
        <div className="flex items-end -mt-16 mb-4">
          <Avatar
            src={org.avatar}
            name={org.name}
            size="lg"
            className="w-32 h-32 rounded-full border-4 border-white shadow-md shrink-0"
          />
          <div className="ml-4 mb-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ORG_STATUS_COLOR[org.status]}`}>
                {ORG_STATUS_LABEL[org.status]}
              </span>
              {org.verified && (
                <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  <CheckCircle className="w-3 h-3" />
                  Verificada
                </span>
              )}
            </div>
            {org.city && org.state && (
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {org.city}, {org.state}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-8 border-b border-gray-300">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-[#1877F2] border-[#1877F2]'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100 rounded-t'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-8 py-6">
        {activeTab === 'about' && (
          <div className="max-w-[680px] space-y-6">
            {org.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Sobre</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{org.description}</p>
              </div>
            )}

            {org.mission && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
                <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Missão
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-400 italic">"{org.mission}"</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {org.email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 truncate">{org.email}</p>
                  </div>
                </div>
              )}
              {org.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="text-sm text-gray-900 truncate">{org.phone}</p>
                  </div>
                </div>
              )}
              {org.city && org.state && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Localização</p>
                    <p className="text-sm text-gray-900">{org.city}, {org.state}</p>
                  </div>
                </div>
              )}
              {org.website && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Site</p>
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                      {org.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
              <Clock className="w-3 h-3" />
              Criada em {new Date(org.createdAt).toLocaleDateString('pt-BR')}
              {' · '}
              CNPJ: {org.cnpj}
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="max-w-[680px] space-y-4">
            {isOwner && (
              <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={org.avatar} name={org.name} size="md" />
                  <textarea
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder={`O que ${org.name} quer compartilhar?`}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                    rows={2}
                    maxLength={2000}
                  />
                </div>
                {composerPreview && (
                  <div className="relative mt-3 rounded-lg overflow-hidden">
                    <img loading="lazy" decoding="async" src={composerPreview} alt="" className="w-full max-h-48 object-contain bg-gray-100" />
                    <button
                      onClick={() => { setComposerMedia(null); setComposerPreview(null) }}
                      aria-label="Remover imagem"
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <FileUpload onFilesSelected={handleComposerMedia} maxFiles={1} />
                  <button
                    onClick={() => orgPostMutation.mutate()}
                    disabled={!composerText.trim() || uploading}
                    className="px-4 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                  >
                    {uploading ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </div>
            )}
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
              </div>
            ) : !orgPosts?.posts?.length ? (
              <EmptyState
                icon={FileTextIcon}
                title="Nenhum post ainda"
                description="Esta organização ainda não publicou nada."
              />
            ) : (
              <div className="space-y-4">
                {orgPosts.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pets' && (
          <div>
            {petsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
              </div>
            ) : !orgPets?.length ? (
              <EmptyState
                icon={PawPrint}
                title="Nenhum pet cadastrado"
                description="Esta organização ainda não cadastrou pets."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orgPets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => navigate(`/pets/${pet.id}`)}
                    className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden text-left hover:shadow-md transition-shadow"
                  >
                    <div className="bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                      {pet.photos?.[0] ? (
                        <img loading="lazy" decoding="async" src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <PawPrint className="w-10 h-10 text-gray-300" />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                      <p className="text-sm text-gray-500">{pet.breed || 'SRD'} · {pet.species}</p>
                      {pet.city && <p className="text-xs text-gray-400 mt-1">{pet.city}{pet.state ? `, ${pet.state}` : ''}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

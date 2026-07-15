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
import {
  ArrowLeft, Building2, MapPin, Globe, Mail, Phone, CheckCircle,
  Clock, FileText, PawPrint, Settings, Image, X, Share2,
} from 'lucide-react'

const tabs = [
  { key: 'posts', label: 'Posts' },
  { key: 'about', label: 'Sobre' },
  { key: 'pets', label: 'Pets' },
] as const

type TabKey = typeof tabs[number]['key']

export function OrgProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const toast = useToastStore()
  const [activeTab, setActiveTab] = useState<TabKey>('posts')
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
    enabled: !!org?.id,
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

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/org/${slug}`)
    toast.add('Link copiado!', 'success')
  }

  if (isLoading) {
    return (
      <div className="max-w-[1000px] mx-auto">
        <Skeleton className="h-56 sm:h-72 w-full rounded-b-lg mb-4" />
        <div className="px-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white -mt-16 shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
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
    <div className="max-w-[1000px] mx-auto">
      {/* Cover — Facebook Group style */}
      <div className="relative h-56 sm:h-72 bg-gradient-to-r from-purple-600 to-purple-800 rounded-b-lg overflow-hidden">
        {org.coverPhoto && (
          <img loading="lazy" decoding="async" src={org.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="absolute bottom-4 sm:bottom-6 left-6 sm:left-8 text-2xl sm:text-3xl font-bold text-white drop-shadow-lg z-10">
          {org.name}
        </h1>
      </div>

      {/* Compact info row — Facebook Group style */}
      <div className="px-4 sm:px-8">
        <div className="flex items-end -mt-14 sm:-mt-16 mb-3">
          <Avatar
            src={org.avatar}
            name={org.name}
            size="lg"
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md shrink-0"
          />
        </div>

        {/* Name + badges + actions in one line */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{org.name}</h2>
              {org.verified && (
                <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500 shrink-0" />
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ORG_STATUS_COLOR[org.status]}`}>
                {ORG_STATUS_LABEL[org.status]}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              {org.city && org.state && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {org.city}, {org.state}
                </span>
              )}
              <span className="text-gray-300 mx-1">·</span>
              <span>Organização</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 mt-1 sm:mt-0">
            <button
              onClick={handleShare}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
            {isOwner && (
              <button
                onClick={() => navigate(`/org/${org.slug}/edit`)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-4 sm:px-8 border-b border-gray-300">
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

      {/* Two-column layout with gray background */}
      <div className="bg-gray-100 min-h-screen">
        <div className="flex gap-6 px-4 sm:px-8 py-6">
          {/* Main column */}
          <div className="flex-1 min-w-0 max-w-[680px] space-y-4">
            {activeTab === 'posts' && (
              <>
                {/* Composer — Facebook style */}
                {isOwner && (
                  <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={org.avatar} name={org.name} size="md" />
                      <input
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        placeholder="Escreva algo..."
                        className="flex-1 h-10 px-4 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary"
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
                    <hr className="my-3 border-gray-200" />
                    <div className="flex items-center justify-between">
                      <FileUpload onFilesSelected={handleComposerMedia} maxFiles={1} />
                      <button
                        onClick={() => orgPostMutation.mutate()}
                        disabled={!composerText.trim() || uploading}
                        className="px-6 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                      >
                        {uploading ? 'Publicando...' : 'Publicar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Feed */}
                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
                  </div>
                ) : !orgPosts?.posts?.length ? (
                  <EmptyState
                    icon={FileText}
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
              </>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4">
                <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre</h2>
                  {org.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{org.description}</p>
                  )}
                  {org.mission && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <h3 className="text-sm font-semibold text-purple-800 mb-1 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        Missão
                      </h3>
                      <p className="text-sm text-purple-700 italic">"{org.mission}"</p>
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Contato</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {org.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm text-gray-900 truncate">{org.email}</p>
                        </div>
                      </div>
                    )}
                    {org.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Telefone</p>
                          <p className="text-sm text-gray-900">{org.phone}</p>
                        </div>
                      </div>
                    )}
                    {org.city && org.state && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Localização</p>
                          <p className="text-sm text-gray-900">{org.city}, {org.state}</p>
                        </div>
                      </div>
                    )}
                    {org.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Site</p>
                          <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                            {org.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pets' && (
              <div>
                {petsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
                  </div>
                ) : !orgPets?.length ? (
                  <EmptyState
                    icon={PawPrint}
                    title="Nenhum pet cadastrado"
                    description="Esta organização ainda não cadastrou pets."
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Sidebar — Facebook Group style */}
          <div className="hidden lg:block w-[320px] shrink-0 space-y-4">
            {/* Sobre widget */}
            {org.description && (
              <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Sobre</h3>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{org.description}</p>
                <button onClick={() => setActiveTab('about')} className="text-xs text-primary hover:underline mt-1">
                  Ver mais
                </button>
              </div>
            )}

            {/* Contato widget */}
            <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Contato</h3>
              {org.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{org.email}</span>
                </div>
              )}
              {org.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{org.phone}</span>
                </div>
              )}
              {org.city && org.state && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{org.city}, {org.state}</span>
                </div>
              )}
              {org.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                    {org.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            {/* Info widget */}
            <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Informações</h3>
              <div className="text-xs text-gray-500 space-y-1.5">
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Criada em {new Date(org.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <p className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  CNPJ: {org.cnpj}
                </p>
              </div>
            </div>

            {/* Pets widget */}
            {orgPets && orgPets.length > 0 && (
              <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Pets</h3>
                  <button onClick={() => setActiveTab('pets')} className="text-xs text-primary hover:underline">
                    Ver todos
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {orgPets.slice(0, 6).map((pet) => (
                    <button key={pet.id} onClick={() => navigate(`/pets/${pet.id}`)} className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity">
                      {pet.photos?.[0] ? (
                        <img loading="lazy" decoding="async" src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PawPrint className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

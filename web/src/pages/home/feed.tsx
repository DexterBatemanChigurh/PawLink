import { useState, useRef, useEffect, useCallback } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { useToastStore } from '../../store/toast.store'
import type { Post, PostFeed, Organization } from '../../types'
import { PostCard } from '../../components/posts/post-card'
import { PostSkeleton } from '../../components/ui/skeleton'
import { EmptyState } from '../../components/ui/empty-state'
import { FileUpload } from '../../components/ui/file-upload'
import { Avatar } from '../../components/ui/avatar'
import { uploadFile } from '../../services/upload'
import { Image, X, Building2 } from 'lucide-react'

export function FeedPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const toast = useToastStore()
  const [showCreate, setShowCreate] = useState(false)
  const [content, setContent] = useState('')
  const [postMedia, setPostMedia] = useState<File | null>(null)
  const [postPreview, setPostPreview] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [postAsOrg, setPostAsOrg] = useState(false)

  const { data: myOrg } = useQuery<Organization>({
    queryKey: ['my-organization'],
    queryFn: async () => {
      const { data } = await api.get('/organizations/my')
      return data
    },
  })

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get('/feed', { params: { page: pageParam, limit: 10 } })
      return data as PostFeed
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.posts.length, 0)
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
  })

  const sentinelRef = useRef<HTMLDivElement>(null)

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(observerCallback, { rootMargin: '400px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [observerCallback])

  const allPosts = data?.pages?.flatMap((p) => p.posts) ?? []

  const handleFilesSelected = (files: File[]) => {
    setPostMedia(files[0] || null)
    if (files[0]) {
      const reader = new FileReader()
      reader.onload = () => setPostPreview(reader.result as string)
      reader.readAsDataURL(files[0])
    } else {
      setPostPreview(null)
    }
  }

  const handleCreatePost = async () => {
    if (!content.trim()) return
    try {
      setUploading(true)
      let mediaUrl: string | undefined
      if (postMedia) {
        mediaUrl = await uploadFile(postMedia, '/upload', setUploadProgress)
      }
      const payload: Record<string, any> = { content: content.trim(), media: mediaUrl ? [mediaUrl] : undefined }
      if (postAsOrg && myOrg?.status === 'approved') {
        payload.organizationId = myOrg.id
      }
      await api.post('/posts', payload)
      setContent('')
      setShowCreate(false)
      setPostMedia(null)
      setPostPreview(null)
      setPostAsOrg(false)
      setUploadProgress(0)
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.add('Post publicado com sucesso!', 'success')
    } catch {
      toast.add('Erro ao criar post', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Create Post Box */}
      <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar} name={user?.name || ''} size="md" />
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 h-10 bg-gray-100 rounded-full text-left px-4 text-sm text-gray-500 hover:bg-gray-200 transition-colors"
          >
            No que você está pensando, {user?.name?.split(' ')[0]}?
          </button>
        </div>
        {showCreate && (
          <div className="mt-3 space-y-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Compartilhe algo com a comunidade..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              rows={4}
              maxLength={2000}
              autoFocus
            />
            {postPreview && (
              <div className="relative rounded-lg overflow-hidden">
                <img loading="lazy" decoding="async" src={postPreview} alt="" className="w-full max-h-48 object-contain bg-gray-100" />
                <button
                  onClick={() => { setPostMedia(null); setPostPreview(null) }}
                  aria-label="Remover imagem"
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <FileUpload onFilesSelected={handleFilesSelected} maxFiles={1} />
            {myOrg?.status === 'approved' && (
              <button
                type="button"
                onClick={() => setPostAsOrg(!postAsOrg)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  postAsOrg
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'text-gray-500 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <Building2 className="w-4 h-4" />
                {postAsOrg ? `Publicando como ${myOrg.name}` : 'Publicar como ONG'}
              </button>
            )}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCreate(false); setContent(''); setPostMedia(null); setPostPreview(null); setPostAsOrg(false) }}
                  className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!content.trim() || uploading}
                  className="px-4 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {uploading ? `Enviando... ${uploadProgress}%` : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : !allPosts.length ? (
        <EmptyState
          icon={Image}
          title="Nenhum post no feed ainda"
          description="Siga perfis de ONGs e clínicas para ver conteúdo aqui"
          action={{ label: 'Explorar pets', onClick: () => window.location.href = '/explorar' }}
        />
      ) : (
        <div className="space-y-4">
          {allPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="py-8 text-center">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="w-5 h-5 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Carregando mais posts...</span>
          </div>
        )}
        {!hasNextPage && allPosts.length > 0 && (
          <p className="text-sm text-gray-400">Você já viu tudo por aqui 🐾</p>
        )}
      </div>
    </>
  )
}

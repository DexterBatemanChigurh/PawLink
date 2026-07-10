import { useState, useRef, useEffect, useCallback } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import type { Post, PostFeed } from '../../types'
import { PostCard } from '../../components/posts/post-card'
import { Image } from 'lucide-react'

export function FeedPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const handleCreatePost = async () => {
    if (!content.trim()) return
    try {
      await api.post('/posts', { content: content.trim() })
      setContent('')
      setShowCreate(false)
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    } catch {
      alert('Erro ao criar post')
    }
  }

  return (
    <>
      {/* Create Post Box */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center overflow-hidden shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-semibold">{user?.name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1877F2] outline-none resize-none"
              rows={4}
              maxLength={2000}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors">
                <Image className="w-4 h-4" />
                Foto
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCreate(false); setContent('') }}
                  className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!content.trim()}
                  className="px-4 py-1.5 bg-[#1877F2] text-white text-sm font-semibold rounded-lg hover:bg-[#166FE5] disabled:opacity-50 transition-colors"
                >
                  Publicar
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
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : !allPosts.length ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🐾</div>
          <p className="text-gray-500 text-lg">Nenhum post no feed ainda</p>
          <p className="text-gray-400 text-sm mt-1">
            Siga perfis de ONGs e clínicas para ver conteúdo aqui
          </p>
        </div>
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

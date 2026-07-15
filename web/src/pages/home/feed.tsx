import { useState, useRef, useEffect, useCallback } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import type { Post, PostFeed } from '../../types'
import { PostCard } from '../../components/posts/post-card'
import { PostComposer } from '../../components/composer/post-composer'
import { PostSkeleton } from '../../components/ui/skeleton'
import { EmptyState } from '../../components/ui/empty-state'
import { RightSidebar } from '../../components/feed/right-sidebar'
import { Image } from 'lucide-react'

export function FeedPage() {
  const queryClient = useQueryClient()

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

  const [newPostsCount, setNewPostsCount] = useState(0)
  const newestCreatedAtRef = useRef<string | null>(null)

  useEffect(() => {
    if (allPosts.length > 0 && !newestCreatedAtRef.current) {
      newestCreatedAtRef.current = allPosts[0].createdAt
    }
  }, [allPosts])

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!newestCreatedAtRef.current) return
      try {
        const { data: fresh } = await api.get('/feed', { params: { page: 1, limit: 1 } })
        const freshPost = (fresh as PostFeed).posts?.[0]
        if (freshPost && new Date(freshPost.createdAt) > new Date(newestCreatedAtRef.current)) {
          const count = (fresh as PostFeed).total - allPosts.length
          if (count > 0) {
            setNewPostsCount(count)
          }
        }
      } catch {}
    }, 30000)
    return () => clearInterval(interval)
  }, [allPosts.length])

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 max-w-[540px]">
        <PostComposer />

      {/* New posts pill */}
      {newPostsCount > 0 && (
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['feed'] })
            setNewPostsCount(0)
            newestCreatedAtRef.current = null
          }}
          className="w-full py-2 mb-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          {newPostsCount} novo{newPostsCount !== 1 ? 's' : ''} post{newPostsCount !== 1 ? 's' : ''}
        </button>
      )}

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
      </div>

      <RightSidebar />
    </div>
  )
}

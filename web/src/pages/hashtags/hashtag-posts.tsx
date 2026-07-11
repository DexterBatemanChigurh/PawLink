import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { Post, PostFeed } from '../../types'
import { PostCard } from '../../components/posts/post-card'
import { PostSkeleton } from '../../components/ui/skeleton'
import { EmptyState } from '../../components/ui/empty-state'
import { Hash } from 'lucide-react'

export function HashtagPostsPage() {
  const { name } = useParams<{ name: string }>()

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['hashtag-posts', name],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get(`/hashtags/${name}/posts`, { params: { page: pageParam, limit: 10 } })
      return data as PostFeed
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.posts.length, 0)
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    enabled: !!name,
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

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-gray-900">{name}</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : !allPosts.length ? (
        <EmptyState
          icon={Hash}
          title="Nenhum post encontrado"
          description={`Nenhum post com a hashtag #${name} foi encontrado`}
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
          <p className="text-sm text-gray-400">Todos os posts carregados</p>
        )}
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { Post } from '../../types'
import { PostCard } from '../../components/posts/post-card'
import { PostSkeleton } from '../../components/ui/skeleton'
import { EmptyState } from '../../components/ui/empty-state'
import { Bookmark } from 'lucide-react'

export function SavedPostsPage() {
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['saved-posts'],
    queryFn: async () => {
      const { data } = await api.get('/bookmarks')
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Posts Salvos</h1>
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!posts?.length) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Posts Salvos</h1>
        <EmptyState
          icon={Bookmark}
          title="Nenhum post salvo"
          description="Salve posts interessantes para ler depois"
        />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Posts Salvos</h1>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

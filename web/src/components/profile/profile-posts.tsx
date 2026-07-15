import { PostCard } from '../posts/post-card'
import { Send } from 'lucide-react'
import type { Post, Pet } from '../../types'
import { PostComposer } from '../composer/post-composer'

interface ProfilePostsProps {
  posts: Post[]
  isOwnProfile: boolean
}

export function ProfilePosts({ posts, isOwnProfile }: ProfilePostsProps) {
  return (
    <div className="max-w-[680px]">
      {isOwnProfile && <PostComposer inline />}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map(post => (
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
  )
}

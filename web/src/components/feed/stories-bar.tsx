import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth.store'
import api from '../../services/api'
import { Plus } from 'lucide-react'

interface StoryUser {
  id: string
  name: string
  avatar: string | null
  role: string
}

const roleColors: Record<string, string> = {
  veterinary: 'border-green-400',
  petshop: 'border-blue-400',
  ong: 'border-purple-400',
  independent_rescuer: 'border-amber-400',
  admin: 'border-red-400',
}

export function StoriesBar({ onCreatePost }: { onCreatePost?: () => void }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: stories } = useQuery<StoryUser[]>({
    queryKey: ['stories'],
    queryFn: async () => {
      const { data } = await api.get('/feed/stories')
      return data
    },
    refetchInterval: 60000,
  })

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
      {/* Seu Story */}
      <button
        onClick={onCreatePost}
        className="flex flex-col items-center gap-1 shrink-0"
      >
        <div className="relative w-[60px] h-[60px]">
          <div className="w-full h-full rounded-full bg-white p-[2px] shadow-sm border border-gray-300">
            <div className="w-full h-full rounded-full bg-[#1877F2] flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-base font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#1877F2] rounded-full border-2 border-white flex items-center justify-center">
            <Plus className="w-3 h-3 text-white" />
          </div>
        </div>
        <span className="text-[11px] text-gray-500 truncate max-w-[64px] text-center">
          Seu Story
        </span>
      </button>

      {/* Stories de outros usuários */}
      {stories?.map((s) => (
        <button
          key={s.id}
          onClick={() => navigate(`/profile?id=${s.id}`)}
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <div
            className={`w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] p-[2px] shadow-sm`}
          >
            <div className="w-full h-full rounded-full bg-white overflow-hidden">
              {s.avatar ? (
                <img src={s.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm font-semibold">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <span className="text-[11px] text-gray-500 truncate max-w-[64px] text-center">
            {s.name.split(' ')[0]}
          </span>
        </button>
      ))}
    </div>
  )
}

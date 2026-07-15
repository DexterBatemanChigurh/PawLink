import { useRef } from 'react'
import { Avatar } from '../ui/avatar'
import { ROLE_BADGE, ROLE_LABEL } from '../../types/constants'
import { Camera, UserPlus, UserCheck, Ban, Flag, MoreHorizontal, MessageCircle } from 'lucide-react'
import type { User } from '../../types'

interface ProfileHeaderProps {
  user: User
  isOwnProfile: boolean
  followerCount: number
  followingCount: number
  isFollowing?: boolean
  isFollowPending: boolean
  showActions: boolean
  onToggleActions: () => void
  onFollow: () => void
  onMessage: () => void
  onBlock: () => void
  onReport: () => void
  onEdit: () => void
  onAvatarChange: (file: File) => void
}

export function ProfileHeader({
  user,
  isOwnProfile,
  followerCount,
  followingCount,
  isFollowing,
  isFollowPending,
  showActions,
  onToggleActions,
  onFollow,
  onMessage,
  onBlock,
  onReport,
  onEdit,
  onAvatarChange,
}: ProfileHeaderProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onAvatarChange(file)
  }

  return (
    <div className="px-8">
      <div className="flex items-end -mt-20 mb-4">
        <div className="relative group shrink-0">
          <Avatar
            src={user.avatar}
            name={user.name}
            size="lg"
            className="w-40 h-40 rounded-full border-4 border-white shadow-md"
          />
          {isOwnProfile && (
            <>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-primary text-white rounded-full p-1.5 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <Camera className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <div className="ml-4 mb-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{user.name}</h1>
            {ROLE_BADGE[user.role] && (
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${ROLE_BADGE[user.role].color}`}>
                {ROLE_LABEL[user.role] || user.role}
              </span>
            )}
          </div>
          <p className="text-base text-gray-500 mt-0.5">
            <span className="font-semibold text-gray-900">{followerCount}</span> seguidores
            {' · '}
            <span className="font-semibold text-gray-900">{followingCount}</span> seguindo
          </p>
        </div>
        <div className="flex items-center gap-2 mb-2 shrink-0">
          {isOwnProfile ? (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
            >
              Editar Perfil
            </button>
          ) : (
            <>
              <button
                onClick={onFollow}
                disabled={isFollowPending}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isFollowing
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-primary hover:bg-primary-hover text-white'
                }`}
              >
                {isFollowing ? (
                  <><UserCheck className="w-4 h-4" /> Seguindo</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Seguir</>
                )}
              </button>
              <button
                onClick={onMessage}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                Mensagem
              </button>
              <div className="relative">
                <button
                  onClick={onToggleActions}
                  aria-label="Ações"
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-500" />
                </button>
                {showActions && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-card rounded-lg shadow-xl border border-gray-200 z-50 py-1" onMouseLeave={onToggleActions}>
                    <button
                      onClick={onBlock}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Ban className="w-4 h-4 text-red-500" />
                      Bloquear
                    </button>
                    <button
                      onClick={onReport}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4 text-orange-500" />
                      Denunciar
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

import { ThumbsUp, Heart, Laugh, Frown, Angry, Sparkles } from 'lucide-react'
import type { ReactionType } from '../../types'

interface ReactionsPopupProps {
  onReact: (type: ReactionType) => void
  onClose: () => void
}

const reactions: { type: ReactionType; icon: typeof ThumbsUp; label: string; color: string }[] = [
  { type: 'like', icon: ThumbsUp, label: 'Curtir', color: '#1877F2' },
  { type: 'love', icon: Heart, label: 'Amei', color: '#E0245E' },
  { type: 'laugh', icon: Laugh, label: 'Haha', color: '#F7B125' },
  { type: 'wow', icon: Sparkles, label: 'Uau', color: '#F7B125' },
  { type: 'sad', icon: Frown, label: 'Triste', color: '#F7B125' },
  { type: 'angry', icon: Angry, label: 'Grr', color: '#E9711A' },
]

export function ReactionsPopup({ onReact, onClose }: ReactionsPopupProps) {
  return (
    <div
      className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1.5 flex items-center gap-1 z-50"
      onMouseLeave={onClose}
    >
      {reactions.map((r) => (
        <button
          key={r.type}
          onClick={() => { onReact(r.type); onClose() }}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-125 transition-transform hover:bg-gray-100"
          title={r.label}
        >
          <r.icon className="w-5 h-5" style={{ color: r.color, fill: r.color }} />
        </button>
      ))}
    </div>
  )
}

const iconMap: Record<string, typeof ThumbsUp> = {
  like: ThumbsUp,
  love: Heart,
  laugh: Laugh,
  wow: Sparkles,
  sad: Frown,
  angry: Angry,
}

const colorMap: Record<string, string> = {
  like: '#1877F2',
  love: '#E0245E',
  laugh: '#F7B125',
  wow: '#F7B125',
  sad: '#F7B125',
  angry: '#E9711A',
}

export function ReactionIcon({ type, size = 16 }: { type: string; size?: number }) {
  const Icon = iconMap[type] || ThumbsUp
  return <Icon className="inline-block" style={{ color: colorMap[type] || '#1877F2', fill: colorMap[type] || '#1877F2' }} size={size} />
}

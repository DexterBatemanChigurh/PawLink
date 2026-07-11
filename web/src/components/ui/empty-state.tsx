import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useConfirmStore } from '../../store/confirm.store'

export function ConfirmDialog() {
  const { open, title, message, confirmLabel, variant, onConfirm, hide } = useConfirmStore()
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => confirmRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, hide])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={hide} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') hide() }} aria-label="Fechar" />
      <div className="relative bg-card rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full mx-4">
        <button onClick={hide} aria-label="Fechar" className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-600' : 'text-gray-600'}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={hide}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm || undefined}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

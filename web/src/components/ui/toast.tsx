import { useToastStore } from '../../store/toast.store'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const styles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-800 text-white dark:bg-gray-700',
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  if (!toasts.length) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg ${styles[t.type]}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} aria-label="Fechar notificação" className="shrink-0 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

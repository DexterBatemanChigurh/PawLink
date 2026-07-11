import { create } from 'zustand'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  variant: 'danger' | 'default'
  onConfirm: (() => void) | null
  show: (opts: {
    title: string
    message: string
    confirmLabel?: string
    variant?: 'danger' | 'default'
    onConfirm: () => void
  }) => void
  hide: () => void
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirmar',
  variant: 'default',
  onConfirm: null,
  show: (opts) =>
    set({
      open: true,
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel || 'Confirmar',
      variant: opts.variant || 'default',
      onConfirm: () => {
        opts.onConfirm()
        set({ open: false, onConfirm: null })
      },
    }),
  hide: () => set({ open: false, onConfirm: null }),
}))

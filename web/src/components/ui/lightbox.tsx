import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface LightboxProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1)
    if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1)
  }, [onClose, onNavigate, currentIndex, images.length])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      aria-label="Fechar lightbox"
    >
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1) }}
          aria-label="Imagem anterior"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1) }}
          aria-label="Próxima imagem"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      )}

      <img
        src={images[currentIndex]}
        alt={`Foto ${currentIndex + 1} de ${images.length}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

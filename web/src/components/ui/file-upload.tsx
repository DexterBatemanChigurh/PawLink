import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, FileImage } from 'lucide-react'
import { useToastStore } from '../../store/toast.store'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
}

interface FilePreview {
  file: File
  preview: string
}

export function FileUpload({ onFilesSelected, maxFiles = 1, maxSizeMB = 10, accept = 'image/*' }: FileUploadProps) {
  const toast = useToastStore()
  const [items, setItems] = useState<FilePreview[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const addFiles = useCallback((incoming: File[]) => {
    setItems((prev) => {
      if (prev.length + incoming.length > maxFiles) {
        toast.add(`Máximo de ${maxFiles} arquivo(s)`, 'error')
        return prev
      }

      const valid: File[] = []
      for (const f of incoming) {
        if (f.size > maxSizeBytes) {
          toast.add(`"${f.name}" excede ${maxSizeMB}MB`, 'error')
          continue
        }
        if (!f.type.startsWith('image/')) {
          toast.add(`"${f.name}" não é uma imagem`, 'error')
          continue
        }
        valid.push(f)
      }

      if (!valid.length) return prev

      const previews: FilePreview[] = valid.map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
      }))

      const next = [...prev, ...previews]
      onFilesSelected(next.map((p) => p.file))
      return next
    })
  }, [maxFiles, maxSizeBytes, maxSizeMB, toast, onFilesSelected])

  useEffect(() => {
    return () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview))
  }, [])

  const removeFile = useCallback((idx: number) => {
    setItems((prev) => {
      const removed = prev[idx]
      if (removed) URL.revokeObjectURL(removed.preview)
      const next = prev.filter((_, i) => i !== idx)
      onFilesSelected(next.map((p) => p.file))
      return next
    })
  }, [onFilesSelected])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }, [addFiles])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    addFiles(files)
    if (inputRef.current) inputRef.current.value = ''
  }, [addFiles])

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary dark:border-gray-600'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          className="hidden"
          onChange={handleInputChange}
        />
        <Upload className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          Arraste arquivos ou clique para selecionar
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {accept} — até {maxSizeMB}MB ({maxFiles > 1 ? `máx. ${maxFiles}` : '1 arquivo'})
        </p>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200">
              {item.file.type.startsWith('image/') ? (
                <img
                  src={item.preview}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-28 object-cover"
                />
              ) : (
                <div className="w-full h-28 flex items-center justify-center bg-gray-100">
                  <FileImage className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(idx) }}
                aria-label="Remover arquivo"
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-1.5 py-1">
                <span className="text-[10px] text-white font-medium">
                  {(item.file.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

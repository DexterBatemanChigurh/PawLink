import { useRef } from 'react'
import { Camera } from 'lucide-react'

interface ProfileCoverProps {
  src?: string
  isOwnProfile: boolean
  onCoverChange: (file: File) => void
}

export function ProfileCover({ src, isOwnProfile, onCoverChange }: ProfileCoverProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onCoverChange(file)
  }

  return (
    <div className="relative h-72 bg-gradient-to-r from-primary to-primary-hover rounded-b-lg overflow-hidden group">
      {src && (
        <img loading="lazy" decoding="async" src={src} alt="" className="w-full h-full object-cover" />
      )}
      {isOwnProfile && (
        <>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors z-10 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 shadow"
          >
            <Camera className="w-4 h-4" />
            Editar capa
          </button>
        </>
      )}
    </div>
  )
}

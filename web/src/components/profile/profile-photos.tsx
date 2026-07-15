import { useState } from 'react'
import { Lightbox } from '../ui/lightbox'
import { ImageIcon } from 'lucide-react'

interface ProfilePhotosProps {
  photos: string[]
}

export function ProfilePhotos({ photos }: ProfilePhotosProps) {
  const [photoIndex, setPhotoIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Nenhuma foto ainda</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((photo, idx) => (
          <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={() => setPhotoIndex(idx)}>
            <img loading="lazy" decoding="async" src={photo} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
          </div>
        ))}
      </div>
      {photoIndex !== null && (
        <Lightbox
          images={photos}
          currentIndex={photoIndex}
          onClose={() => setPhotoIndex(null)}
          onNavigate={setPhotoIndex}
        />
      )}
    </>
  )
}

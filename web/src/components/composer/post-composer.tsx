import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuthStore } from '../../store/auth.store'
import { useToastStore } from '../../store/toast.store'
import { uploadFile } from '../../services/upload'
import { FileUpload } from '../ui/file-upload'
import { Avatar } from '../ui/avatar'
import type { Organization, Pet } from '../../types'
import { SPECIES_EMOJI } from '../../types/constants'
import { Image, X, Building2, ChevronDown } from 'lucide-react'

const POST_TYPES = [
  { value: 'update', label: 'Atualização', icon: '📝' },
  { value: 'tip', label: 'Dica', icon: '💡' },
  { value: 'promotion', label: 'Promoção', icon: '🏷️' },
  { value: 'event', label: 'Evento', icon: '📅' },
  { value: 'adoption_drive', label: 'Campanha', icon: '📢' },
] as const

interface PostComposerProps {
  onSuccess?: () => void
  inline?: boolean
}

export function PostComposer({ onSuccess, inline }: PostComposerProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const toast = useToastStore()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [postAsOrg, setPostAsOrg] = useState(false)
  const [postType, setPostType] = useState<string>('update')
  const [selectedPetId, setSelectedPetId] = useState<string>('')
  const [showTypePicker, setShowTypePicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: myOrg } = useQuery<Organization>({
    queryKey: ['my-organization'],
    queryFn: async () => {
      const { data } = await api.get('/organizations/my')
      return data
    },
  })

  const { data: myPets } = useQuery<Pet[]>({
    queryKey: ['my-pets-list'],
    queryFn: async () => {
      const { data } = await api.get('/pets/my/me')
      return data?.owned || []
    },
  })

  const createPost = useMutation({
    mutationFn: async () => {
      if (!content.trim()) return
      let mediaUrl: string | undefined
      if (media) {
        mediaUrl = await uploadFile(media, '/upload', setUploadProgress)
      }
      const payload: Record<string, any> = {
        content: content.trim(),
        type: postType,
        media: mediaUrl ? [mediaUrl] : undefined,
      }
      if (selectedPetId) payload.petId = selectedPetId
      if (postAsOrg && myOrg?.status === 'approved') {
        payload.organizationId = myOrg.id
      }
      await api.post('/posts', payload)
    },
    onSuccess: () => {
      setContent('')
      setOpen(false)
      setMedia(null)
      setPreview(null)
      setPostAsOrg(false)
      setPostType('update')
      setSelectedPetId('')
      setUploadProgress(0)
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast.add('Post publicado!', 'success')
      onSuccess?.()
    },
    onError: () => {
      toast.add('Erro ao criar post', 'error')
    },
    onSettled: () => {
      setUploading(false)
    },
  })

  const handleFilesSelected = (files: File[]) => {
    setMedia(files[0] || null)
    if (files[0]) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(files[0])
    } else {
      setPreview(null)
    }
  }

  const selectedType = POST_TYPES.find(t => t.value === postType)
  const selectedPet = myPets?.find(p => p.id === selectedPetId)

  if (!open && !inline) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar} name={user?.name || ''} size="md" />
          <button
            onClick={() => { setOpen(true); setTimeout(() => textareaRef.current?.focus(), 100) }}
            className="flex-1 h-10 bg-gray-100 rounded-full text-left px-4 text-sm text-gray-500 hover:bg-gray-200 transition-colors"
          >
            No que você está pensando, {user?.name?.split(' ')[0]}?
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar src={user?.avatar} name={user?.name || ''} size="md" />
        <div className="flex-1" />
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Compartilhe algo com a comunidade..."
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
        rows={4}
        maxLength={2000}
      />

      {preview && (
        <div className="relative rounded-lg overflow-hidden mt-3">
          <img loading="lazy" decoding="async" src={preview} alt="" className="w-full max-h-48 object-contain bg-gray-100" />
          <button
            onClick={() => { setMedia(null); setPreview(null) }}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <FileUpload onFilesSelected={handleFilesSelected} maxFiles={1} />

        <div className="relative">
          <button
            onClick={() => setShowTypePicker(!showTypePicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {selectedType?.icon} {selectedType?.label}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showTypePicker && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-card rounded-lg shadow-xl border border-gray-200 z-50 py-1">
              {POST_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setPostType(t.value); setShowTypePicker(false) }}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 transition-colors ${postType === t.value ? 'text-primary font-semibold' : 'text-gray-700'}`}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {myPets && myPets.length > 0 && (
          <select
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 bg-transparent outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sem pet</option>
            {myPets.map((p) => (
              <option key={p.id} value={p.id}>{SPECIES_EMOJI[p.species] || '🐾'} {p.name}</option>
            ))}
          </select>
        )}

        {myOrg?.status === 'approved' && (
          <button
            onClick={() => setPostAsOrg(!postAsOrg)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              postAsOrg
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'text-gray-500 hover:bg-gray-100 border border-transparent'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {postAsOrg ? myOrg.name : 'Como ONG'}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <button
          onClick={() => { setOpen(false); setContent(''); setMedia(null); setPreview(null); setPostAsOrg(false) }}
          className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => createPost.mutate()}
          disabled={!content.trim() || uploading || createPost.isPending}
          className="px-6 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {uploading ? `Enviando... ${uploadProgress}%` : createPost.isPending ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </div>
  )
}

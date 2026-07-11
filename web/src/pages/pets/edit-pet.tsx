import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import type { Pet } from '../../types'
import { PetCardSkeleton } from '../../components/ui/skeleton'
import { FileUpload } from '../../components/ui/file-upload'
import { uploadMultiple } from '../../services/upload'
import { Save, X } from 'lucide-react'

export function EditPetPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: pet, isLoading } = useQuery<Pet>({
    queryKey: ['pet', id],
    queryFn: async () => {
      const { data } = await api.get(`/pets/${id}`)
      return data
    },
    enabled: !!id,
  })

  const [form, setForm] = useState({
    name: '',
    species: 'dog',
    breed: '',
    color: '',
    size: 'medium',
    age: '',
    ageUnit: 'anos',
    castrated: false,
    vaccinated: false,
    temperament: '',
    story: '',
    city: '',
    state: '',
  })
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (pet) {
      setForm({
        name: pet.name || '',
        species: pet.species || 'dog',
        breed: pet.breed || '',
        color: pet.color || '',
        size: pet.size || 'medium',
        age: pet.age ? String(pet.age) : '',
        ageUnit: pet.ageUnit || 'anos',
        castrated: pet.castrated,
        vaccinated: pet.vaccinated,
        temperament: pet.temperament || '',
        story: pet.story || '',
        city: pet.city || '',
        state: pet.state || '',
      })
      setExistingPhotos(pet.photos || [])
    }
  }, [pet])

  const mutation = useMutation({
    mutationFn: async () => {
      setUploading(true)
      let photoUrls = [...existingPhotos]
      if (newPhotos.length > 0) {
        const uploaded = await uploadMultiple(newPhotos, '/upload')
        photoUrls = [...photoUrls, ...uploaded]
      }
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        photos: photoUrls,
      }
      await api.patch(`/pets/${id}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', id] })
      queryClient.invalidateQueries({ queryKey: ['my-pets'] })
      navigate(`/pets/${id}`)
    },
    onSettled: () => {
      setUploading(false)
    },
  })

  const speciesList = [
    { value: 'dog', label: 'Cachorro' },
    { value: 'cat', label: 'Gato' },
    { value: 'bird', label: 'Pássaro' },
    { value: 'rabbit', label: 'Coelho' },
    { value: 'hamster', label: 'Hamster' },
    { value: 'other', label: 'Outro' },
  ]

  const sizeList = [
    { value: 'small', label: 'Pequeno' },
    { value: 'medium', label: 'Médio' },
    { value: 'large', label: 'Grande' },
    { value: 'giant', label: 'Gigante' },
  ]

  if (isLoading) {
    return <PetCardSkeleton />
  }

  if (!pet) {
    return <div className="text-gray-400 text-center py-20">Pet não encontrado</div>
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Editar {pet.name}</h1>

      <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fotos</label>
          {existingPhotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {existingPhotos.map((url, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200">
                  <img loading="lazy" decoding="async" src={url} alt="" className="w-full h-28 object-cover" />
                  <button
                    type="button"
                    onClick={() => setExistingPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remover foto"
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <FileUpload onFilesSelected={setNewPhotos} maxFiles={10} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Espécie</label>
            <select
              value={form.species}
              onChange={(e) => setForm({ ...form, species: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-card"
            >
              {speciesList.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
            <input
              type="text"
              value={form.breed}
              onChange={(e) => setForm({ ...form, breed: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Porte</label>
            <select
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-card"
            >
              {sizeList.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
            <select
              value={form.ageUnit}
              onChange={(e) => setForm({ ...form, ageUnit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-card"
            >
              <option value="anos">Anos</option>
              <option value="months">Meses</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              maxLength={2}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperamento</label>
          <input
            type="text"
            value={form.temperament}
            onChange={(e) => setForm({ ...form, temperament: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">História</label>
          <textarea
            value={form.story}
            onChange={(e) => setForm({ ...form, story: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            rows={3}
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.castrated}
              onChange={(e) => setForm({ ...form, castrated: e.target.checked })}
              className="w-4 h-4 text-primary rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Castrado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.vaccinated}
              onChange={(e) => setForm({ ...form, vaccinated: e.target.checked })}
              className="w-4 h-4 text-primary rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Vacinado</span>
          </label>
        </div>

        {mutation.isError && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
            Erro ao salvar. Verifique os dados e tente novamente.
          </div>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!form.name || mutation.isPending}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {uploading || mutation.isPending ? 'Enviando fotos...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  )
}

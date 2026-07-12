import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { FileUpload } from '../../components/ui/file-upload'
import { uploadMultiple } from '../../services/upload'
import { useToastStore } from '../../store/toast.store'
import type { Organization } from '../../types'
import { Save, Building2 } from 'lucide-react'

export function NewPetPage() {
  const navigate = useNavigate()
  const toast = useToastStore()
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [asOrg, setAsOrg] = useState(false)
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

  const { data: myOrg } = useQuery<Organization>({
    queryKey: ['my-organization'],
    queryFn: async () => {
      const { data } = await api.get('/organizations/my')
      return data
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      setUploading(true)
      let photoUrls: string[] = []
      if (photos.length > 0) {
        photoUrls = await uploadMultiple(photos, '/upload')
      }
      const payload: Record<string, any> = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        photos: photoUrls,
      }
      if (asOrg && myOrg?.status === 'approved') {
        payload.organizationId = myOrg.id
      }
      await api.post('/pets', payload)
    },
    onSuccess: () => {
      navigate('/my-pets')
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

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Cadastrar Pet</h1>

      <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fotos</label>
          <FileUpload onFilesSelected={setPhotos} maxFiles={10} />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Espécie *</label>
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
              placeholder="SRD"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="Caramelo"
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
              placeholder="MG"
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
            placeholder="Brincalhão, carinhoso, dócil..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">História</label>
          <textarea
            value={form.story}
            onChange={(e) => setForm({ ...form, story: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            rows={3}
            placeholder="Conte a história do pet..."
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
            Erro ao cadastrar. Verifique os dados e tente novamente.
          </div>
        )}

        {myOrg?.status === 'approved' && (
          <button
            type="button"
            onClick={() => setAsOrg(!asOrg)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              asOrg
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {asOrg ? `Cadastrando como ${myOrg.name}` : 'Cadastrar como ONG'}
          </button>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!form.name || mutation.isPending}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {uploading || mutation.isPending ? 'Enviando fotos...' : 'Cadastrar Pet'}
        </button>
      </div>
    </div>
  )
}

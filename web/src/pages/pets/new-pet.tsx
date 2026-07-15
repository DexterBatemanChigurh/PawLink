import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '../../services/api'
import { FileUpload } from '../../components/ui/file-upload'
import { uploadMultiple } from '../../services/upload'
import { useToastStore } from '../../store/toast.store'
import { useAuthStore } from '../../store/auth.store'
import type { Organization } from '../../types'
import { Save, Building2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'other']),
  breed: z.string().optional(),
  color: z.string().optional(),
  size: z.enum(['small', 'medium', 'large', 'giant']),
  age: z.coerce.number().min(0).max(50).optional(),
  ageUnit: z.enum(['anos', 'months']),
  castrated: z.boolean(),
  vaccinated: z.boolean(),
  temperament: z.string().max(200).optional(),
  story: z.string().max(2000).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
})

type FormData = z.infer<typeof schema>

export function NewPetPage() {
  const navigate = useNavigate()
  const toast = useToastStore()
  const user = useAuthStore((s) => s.user)
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [asOrg, setAsOrg] = useState(false)

  const { data: myOrg } = useQuery<Organization>({
    queryKey: ['my-organization'],
    queryFn: async () => {
      const { data } = await api.get('/organizations/my')
      return data
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      species: 'dog',
      size: 'medium',
      ageUnit: 'anos',
      castrated: false,
      vaccinated: false,
      city: user?.city || '',
      state: user?.state || '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      setUploading(true)
      let photoUrls: string[] = []
      if (photos.length > 0) {
        photoUrls = await uploadMultiple(photos, '/upload')
      }
      const payload: Record<string, any> = {
        ...data,
        age: data.age || undefined,
        photos: photoUrls,
      }
      if (asOrg && myOrg?.status === 'approved') {
        payload.organizationId = myOrg.id
      }
      await api.post('/pets', payload)
    },
    onSuccess: () => {
      navigate('/my-pets')
      toast.add('Pet cadastrado com sucesso!', 'success')
    },
    onError: () => {
      toast.add('Erro ao cadastrar pet', 'error')
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

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="bg-card rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fotos</label>
          <FileUpload onFilesSelected={setPhotos} maxFiles={10} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input {...register('name')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Espécie *</label>
            <select {...register('species')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-card">
              {speciesList.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
            <input {...register('breed')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="SRD" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <input {...register('color')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="Caramelo" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Porte</label>
            <select {...register('size')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-card">
              {sizeList.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
            <input type="number" {...register('age')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              min={0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
            <select {...register('ageUnit')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-card">
              <option value="anos">Anos</option>
              <option value="months">Meses</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input {...register('city')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input {...register('state')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              maxLength={2}
              placeholder="MG" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperamento</label>
          <input {...register('temperament')}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder="Brincalhão, carinhoso, dócil..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">História</label>
          <textarea {...register('story')}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            rows={3}
            placeholder="Conte a história do pet..." />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('castrated')}
              className="w-4 h-4 text-primary rounded border-gray-300" />
            <span className="text-sm text-gray-700">Castrado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('vaccinated')}
              className="w-4 h-4 text-primary rounded border-gray-300" />
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
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {uploading || mutation.isPending ? 'Enviando fotos...' : 'Cadastrar Pet'}
        </button>
      </form>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Button } from '../../components/ui/button'
import type { Pet } from '../../types'

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
    name: '', species: 'dog', breed: '', color: '', size: 'medium',
    age: '', ageUnit: 'anos', castrated: false, vaccinated: false,
    temperament: '', story: '', city: '', state: '',
  })

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
    }
  }, [pet])

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/pets/${id}`, { ...form, age: form.age ? Number(form.age) : undefined })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      navigate('/pets')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/pets/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      navigate('/pets')
    },
  })

  if (isLoading) return <div className="text-gray-500">Carregando...</div>
  if (!pet) return <div className="text-gray-500">Pet não encontrado</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar {pet.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/pets')}>Voltar</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm(`Excluir ${pet.name}? Todos os matches e timeline serão removidos.`))
                deleteMutation.mutate()
            }}
          >
            Excluir Pet
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Espécie</label>
            <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="dog">Cachorro</option>
              <option value="cat">Gato</option>
              <option value="bird">Pássaro</option>
              <option value="rabbit">Coelho</option>
              <option value="hamster">Hamster</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
            <input type="text" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Porte</label>
            <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="small">Pequeno</option>
              <option value="medium">Médio</option>
              <option value="large">Grande</option>
              <option value="giant">Gigante</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" min={0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
            <select value={form.ageUnit} onChange={(e) => setForm({ ...form, ageUnit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="anos">Anos</option>
              <option value="months">Meses</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" maxLength={2} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperamento</label>
          <input type="text" value={form.temperament} onChange={(e) => setForm({ ...form, temperament: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">História</label>
          <textarea value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.castrated} onChange={(e) => setForm({ ...form, castrated: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
            <span className="text-sm text-gray-700">Castrado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.vaccinated} onChange={(e) => setForm({ ...form, vaccinated: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
            <span className="text-sm text-gray-700">Vacinado</span>
          </label>
        </div>

        {updateMutation.isError && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">Erro ao salvar. Tente novamente.</div>
        )}

        <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import api from '../../services/api'
import { ArrowLeft, Save } from 'lucide-react'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, checkAuth } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    bio: '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/users/me', form)
      await checkAuth()
      setEditing(false)
    } catch {
      alert('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const roleLabels: Record<string, string> = {
    user: 'Usuário',
    ong: 'ONG',
    independent_rescuer: 'Resgatista',
    veterinary: 'Veterinário',
    petshop: 'Petshop',
    admin: 'Administrador',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Meu Perfil</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-24" />
          <div className="px-6 pb-6">
            <div className="flex items-end -mt-12 mb-4">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl border-2 border-white">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-2xl" /> : '👤'}
              </div>
              <div className="ml-4 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <span className="text-sm text-gray-500">{roleLabels[user.role] || user.role}</span>
              </div>
            </div>

            <div className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="(34) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                      <p className="text-sm text-gray-900 mt-0.5">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Telefone</p>
                      <p className="text-sm text-gray-900 mt-0.5">{user.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Membro desde</p>
                      <p className="text-sm text-gray-900 mt-0.5">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  {user.bio && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Bio</p>
                      <p className="text-sm text-gray-600 mt-0.5">{user.bio}</p>
                    </div>
                  )}
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Editar Perfil
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

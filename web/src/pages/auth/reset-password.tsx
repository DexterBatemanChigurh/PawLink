import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import { useToastStore } from '../../store/toast.store'
import { Lock, PawPrint, ArrowLeft } from 'lucide-react'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToastStore()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Senhas não conferem')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      toast.add('Senha redefinida com sucesso!', 'success')
      navigate('/login')
    } catch {
      setError('Token inválido ou expirado')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 text-sm mb-3">Link inválido. Nenhum token de recuperação encontrado.</p>
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm">
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl mb-4">
            <PawPrint className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">PawLink</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Redefinir senha</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nova senha</h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Mail, PawPrint, ArrowLeft } from 'lucide-react'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Erro ao solicitar recuperação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl mb-4">
            <PawPrint className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">PawLink</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Recuperar senha</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg">
                Se o email existir, você receberá um link de recuperação
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Esqueceu sua senha?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                  Voltar para o login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

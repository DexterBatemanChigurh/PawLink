import axios from 'axios'

let toastFn: ((message: string, type?: 'success' | 'error' | 'info') => void) | null = null

export function setToastHandler(fn: typeof toastFn) {
  toastFn = fn
}

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const messages: Record<number, string> = {
      400: 'Dados inválidos. Verifique os campos e tente novamente.',
      403: 'Você não tem permissão para realizar esta ação.',
      404: 'Recurso não encontrado.',
      409: 'Este recurso já existe.',
      429: 'Muitas requisições. Aguarde um momento.',
      500: 'Erro interno do servidor. Tente novamente mais tarde.',
    }

    if (status && status !== 401) {
      const serverMsg = error.response?.data?.message
      const msg = Array.isArray(serverMsg) ? serverMsg[0] : serverMsg || messages[status] || 'Ocorreu um erro inesperado.'
      toastFn?.(msg, 'error')
    }

    if (status === 401) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken })
          localStorage.setItem('accessToken', data.accessToken)
          error.config.headers.Authorization = `Bearer ${data.accessToken}`
          return api(error.config)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      } else {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api

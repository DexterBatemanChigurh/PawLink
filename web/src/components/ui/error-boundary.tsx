import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Algo deu errado
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
            {this.state.error?.message || 'Ocorreu um erro inesperado. Tente novamente.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

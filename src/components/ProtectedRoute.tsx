import { Navigate } from 'react-router-dom'
import { useAuthContext } from './providers/auth-provider'
import { LoadingSpinner } from './loading-spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Verificando autenticação...
            </h2>
            <p className="text-slate-400 text-sm">Aguarde um momento</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Verificar se é primeiro acesso e precisa trocar senha
  if (user.user_metadata?.primeiro_acesso === true) {
    return <Navigate to="/trocar-senha" replace />
  }

  return <>{children}</>
}

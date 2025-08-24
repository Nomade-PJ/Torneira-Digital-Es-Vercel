// Hook para verificar se o usuário é super admin
import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../components/providers/auth-provider'

export interface SuperAdminStatus {
  isSuperAdmin: boolean
  hasUnlimitedAccess: boolean
  isLoading: boolean
}

const SUPER_ADMIN_EMAILS = [
  'jonplaycomercial@gmail.com'
  // Adicione outros emails de super admin aqui se necessário
]

export function useSuperAdmin(): SuperAdminStatus {
  const { user } = useAuthContext()
  const [status, setStatus] = useState<SuperAdminStatus>({
    isSuperAdmin: false,
    hasUnlimitedAccess: false,
    isLoading: true
  })

  useEffect(() => {
    if (!user) {
      setStatus({
        isSuperAdmin: false,
        hasUnlimitedAccess: false,
        isLoading: false
      })
      return
    }

    const checkSuperAdmin = () => {
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email || '') || 
                          user.user_metadata?.role === 'super_admin'

      setStatus({
        isSuperAdmin,
        hasUnlimitedAccess: isSuperAdmin,
        isLoading: false
      })
    }

    checkSuperAdmin()
  }, [user])

  return status
}

// Função utilitária para verificar se um email é super admin
export function isSuperAdminEmail(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email)
}

// HOC para componentes que precisam de acesso super admin
export function withSuperAdminAccess<T extends object>(
  Component: React.ComponentType<T>,
  fallbackComponent?: React.ComponentType<T>
) {
  return function SuperAdminWrapper(props: T) {
    const { isSuperAdmin, isLoading } = useSuperAdmin()

    if (isLoading) {
      return <div>Verificando permissões...</div>
    }

    if (!isSuperAdmin && fallbackComponent) {
      const FallbackComponent = fallbackComponent
      return <FallbackComponent {...props} />
    }

    if (!isSuperAdmin) {
      return (
        <div className="p-4 text-center">
          <p className="text-red-600">Acesso negado. Apenas super administradores podem acessar esta funcionalidade.</p>
        </div>
      )
    }

    return <Component {...props} />
  }
}

export default useSuperAdmin

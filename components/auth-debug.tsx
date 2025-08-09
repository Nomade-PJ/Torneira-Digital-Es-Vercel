"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/providers/auth-provider"

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const { user, session, loading } = useAuthContext()

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Verificar localStorage
        const keys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('sb-')
        )
        
        // Verificar sessão do Supabase
        const { data: { session }, error } = await supabase.auth.getSession()
        
        setDebugInfo({
          localStorageKeys: keys,
          localStorageValues: keys.reduce((acc, key) => {
            acc[key] = localStorage.getItem(key)?.substring(0, 100) + '...'
            return acc
          }, {} as any),
          supabaseSession: session ? {
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: new Date(session.expires_at! * 1000).toISOString()
          } : null,
          supabaseError: error?.message,
          contextUser: user ? {
            id: user.id,
            email: user.email
          } : null,
          contextSession: session ? 'exists' : null,
          contextLoading: loading,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        setDebugInfo({
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        })
      }
    }

    checkAuthState()
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(checkAuthState, 5000)
    return () => clearInterval(interval)
  }, [user, session, loading])

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto text-xs z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}

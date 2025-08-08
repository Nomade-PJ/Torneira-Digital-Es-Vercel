"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/providers/auth-provider"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuthContext()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Se usuário está logado, redireciona para o dashboard
        router.push("/dashboard")
      } else {
        // Se usuário não está logado, redireciona para login
        router.push("/login")
      }
    }
  }, [user, loading, router])

  // Mostra loading enquanto verifica autenticação
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <LoadingSpinner />
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/providers/auth-provider"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuthContext()

  useEffect(() => {
    // Redirecionamento imediato sem mostrar loading
    if (user) {
      router.replace("/dashboard")
    } else {
      router.replace("/login")
    }
  }, [user, router])

  // Retorna null para não mostrar nada durante o redirecionamento
  return null
}

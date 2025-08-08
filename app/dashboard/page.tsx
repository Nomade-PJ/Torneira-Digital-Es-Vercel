"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar automaticamente para a página de PDV-Vendas
    router.replace("/dashboard/vendas")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner />
      <span className="ml-2 text-slate-400">Redirecionando...</span>
    </div>
  )
}
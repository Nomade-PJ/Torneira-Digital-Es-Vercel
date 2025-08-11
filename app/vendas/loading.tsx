import { LoadingSpinner } from "@/components/loading-spinner"

export default function VendasLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner />
      <span className="ml-2 text-slate-400">Carregando sistema de vendas...</span>
    </div>
  )
}

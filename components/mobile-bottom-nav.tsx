"use client"

import { cn } from "@/lib/utils"
import { Package, Activity, Settings, ShoppingCart, LogOut, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
// Removed useSidebar - not needed for mobile nav
import { useAuthContext } from "@/components/providers/auth-provider"
import { toast } from "@/components/ui/use-toast"

const navItems = [
  {
    title: "Vendas",
    href: "/vendas",
    icon: ShoppingCart,
  },
  {
    title: "Estoque",
    href: "/estoque",
    icon: Package,
  },
  {
    title: "Fluxo",
    href: "/fluxo",
    icon: Activity,
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
  },
  {
    title: "Config",
    href: "/configuracoes",
    icon: Settings,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, user } = useAuthContext()

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      })
      router.push("/login")
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível realizar o logout",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent p-1">
        <nav className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl mx-2 mb-2 px-1 py-2 shadow-xl">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center space-y-1 rounded-xl px-3 py-2 transition-all duration-300 min-w-[60px]",
                    isActive 
                      ? "text-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/25 scale-105" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 active:scale-95"
                  )}
                >
                  <item.icon className={cn("transition-all duration-300", isActive ? "w-6 h-6" : "w-5 h-5")} />
                  <span className={cn("text-xs font-medium transition-all duration-300", isActive ? "text-amber-400" : "text-slate-400")}>{item.title}</span>
                </Link>
              )
            })}
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center space-y-1 rounded-xl px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 active:scale-95 transition-all duration-300 min-w-[60px]"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs font-medium">Sair</span>
            </Button>
          </div>
        </nav>
      </div>
    </div>
  )
}

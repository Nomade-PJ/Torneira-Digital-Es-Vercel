

import { cn } from "../lib/utils"
import { Package, Activity, ShoppingCart, BarChart3 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useAuthContext } from "./providers/auth-provider"

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
]

export function MobileBottomNav() {
  const location = useLocation()
  const { user } = useAuthContext()

  if (!user) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent p-1">
        <nav className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl mx-2 mb-2 px-1 py-2 shadow-xl">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
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
          </div>
        </nav>
      </div>
    </div>
  )
}

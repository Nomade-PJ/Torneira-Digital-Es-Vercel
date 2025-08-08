"use client"

import { cn } from "@/lib/utils"
import { Package, Activity, Settings, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Vendas",
    href: "/dashboard/vendas",
    icon: ShoppingCart,
  },
  {
    title: "Estoque",
    href: "/dashboard/estoque",
    icon: Package,
  },
  {
    title: "Fluxo",
    href: "/dashboard/fluxo",
    icon: Activity,
  },
  {
    title: "Config",
    href: "/dashboard/configuracoes",
    icon: Settings,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden ios-safe-area">
      <nav className="bottom-nav flex items-center justify-around px-2 py-1 h-16 touch-target ios-scroll">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mobile-nav-item flex flex-col items-center justify-center space-y-1 rounded-lg transition-all duration-200",
                isActive ? "text-amber-400 bg-amber-500/20 scale-105" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/30",
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="mobile-text">{item.title}</span>
            </Link>
          )
        })}


      </nav>
    </div>
  )
}

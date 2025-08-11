"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Beer, BarChart3, Package, Activity, Settings, LogOut, ChevronUp, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/providers/auth-provider"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"

const menuItems = [
  {
    title: "PDV - Vendas",
    url: "/vendas",
    icon: ShoppingCart,
  },
  {
    title: "Estoque",
    url: "/estoque", 
    icon: Package,
  },
  {
    title: "Fluxo de Produtos",
    url: "/fluxo",
    icon: Activity,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
]

interface Configuracao {
  nome_estabelecimento?: string
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, user, loading } = useAuthContext()
  const [configuracoes, setConfiguracoes] = useState<Configuracao | null>(null)

  // Carregar configurações diretamente
  useEffect(() => {
    const carregarConfiguracoes = async () => {
      if (!user?.id) return

      try {
        const { data } = await supabase
          .from("configuracoes")
          .select("nome_estabelecimento")
          .eq("usuario_id", user.id)
          .single()

        if (data) {
          setConfiguracoes(data)
        }
      } catch (error) {
        console.warn("Erro ao carregar configurações:", error)
      }
    }

    carregarConfiguracoes()
  }, [user?.id])

  const handleLogout = async () => {
    try {
      console.log("🚪 Fazendo logout...")
      await signOut()
      console.log("✅ Logout realizado com sucesso")
      router.push("/login")
    } catch (error) {
      console.error("❌ Erro ao fazer logout:", error)
      // Mesmo com erro, redirecionar para login
      router.push("/login")
    }
  }

  const handleSettings = () => {
    router.push("/configuracoes")
  }

  return (
    <Sidebar className="border-r border-amber-500/20">
      <SidebarHeader className="border-b border-amber-500/20">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="relative">
            <Beer className="w-8 h-8 text-amber-400 foam-animation" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
              <span className="text-slate-900 text-xs font-bold">T</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Torneira Digital
            </h2>
            <p className="text-xs text-muted-foreground">Sistema de Estoque</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-amber-400/80">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-400 data-[active=true]:border-r-2 data-[active=true]:border-amber-400"
                  >
                    <Link href={item.url} className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-amber-500/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="data-[state=open]:bg-amber-500/20">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-amber-500 text-slate-900">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      {loading ? (
                        <span className="animate-pulse bg-slate-700 h-4 w-20 rounded"></span>
                      ) : (
                        configuracoes?.nome_estabelecimento || 
                        user?.user_metadata?.nome_estabelecimento || 
                        (user ? "Estabelecimento" : "Não logado")
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {loading ? (
                        <span className="animate-pulse bg-slate-700 h-3 w-16 rounded"></span>
                      ) : (
                        user ? "Administrador" : "Faça login"
                      )}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto w-4 h-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-(--radix-popper-anchor-width)">
                <DropdownMenuItem onClick={handleSettings}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-400" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

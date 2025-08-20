

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
} from "./ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Beer, BarChart3, Package, Activity, Settings, LogOut, ChevronUp, ShoppingCart } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthContext } from "./providers/auth-provider"
import { supabase } from "../lib/supabase"
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
  const location = useLocation()
  const navigate = useNavigate()
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
      await signOut()
      // Forçar navegação imediata
      navigate("/login", { replace: true })
    } catch (error) {
      console.warn("Erro no logout (redirecionando mesmo assim):", error)
      // Mesmo com erro, redirecionar para login
      navigate("/login", { replace: true })
    }
  }

  const handleSettings = () => {
    navigate("/configuracoes")
  }

  return (
    <Sidebar className="border-r border-slate-800 bg-slate-950">
      <SidebarHeader className="border-b border-slate-800">
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
          <SidebarGroupLabel className="text-slate-400">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                    className="data-[active=true]:bg-slate-800 data-[active=true]:text-slate-200 data-[active=true]:border-r-2 data-[active=true]:border-slate-600"
                  >
                    <Link to={item.url} className="flex items-center space-x-3">
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

      <SidebarFooter className="border-t border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="data-[state=open]:bg-slate-800">
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

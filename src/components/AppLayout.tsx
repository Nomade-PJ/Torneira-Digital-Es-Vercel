import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuthContext } from "./providers/auth-provider"
import { usePermissions } from "../hooks/usePermissions"
import { Button } from "./ui/button"
import { 
  Beer, 
  Package, 
  ArrowUpDown, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Lock
} from "lucide-react"
import { cn } from "../lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { PlanoStatus } from "./PlanoStatus"

const navigation = [
  { name: "Vendas", href: "/vendas", icon: ShoppingCart, permissao: "vendas_basicas" },
  { name: "Estoque", href: "/estoque", icon: Package, permissao: "estoque_basico" },
  { name: "Fluxo", href: "/fluxo", icon: ArrowUpDown, permissao: "vendas_basicas" },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3, permissao: "relatorios_basicos" },
  { name: "Configurações", href: "/configuracoes", icon: Settings, permissao: null },
]

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthContext()
  const { temPermissao } = usePermissions()

  const handleSignOut = async () => {
    try {
      await signOut()
      // Forçar navegação imediata
      navigate("/login", { replace: true })
    } catch (error) {
      console.warn('Erro no logout (redirecionando mesmo assim):', error)
      // Mesmo com erro, redirecionar para login
      navigate("/login", { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar para desktop */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300",
        sidebarCollapsed ? "lg:w-20" : "lg:w-72"
      )}>
        <div className={cn(
          "flex grow flex-col gap-y-5 overflow-y-auto bg-slate-950 pb-4 border-r border-slate-800 transition-all duration-300",
          sidebarCollapsed ? "px-2" : "px-6"
        )}>
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div className={cn(
              "flex items-center transition-all duration-300",
              sidebarCollapsed ? "justify-center w-full" : "space-x-3"
            )}>
              <Beer className="h-8 w-8 text-amber-400" />
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                    Torneira Digital
                  </h1>
                  <p className="text-xs text-slate-400">Sistema de Estoque</p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-slate-400 hover:text-amber-400 h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          {/* Botão toggle quando minimizado */}
          {sidebarCollapsed && (
            <div className="flex justify-center pb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-slate-400 hover:text-amber-400 h-8 w-8"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          <nav className="flex flex-1 flex-col">
                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className={cn(sidebarCollapsed ? "space-y-3 px-1" : "-mx-2 space-y-1")}>
                      {navigation.map((item) => {
                        const isActive = location.pathname === item.href
                        const temAcesso = !item.permissao || temPermissao(item.permissao)
                        
                        return (
                          <li key={item.name}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "rounded-lg text-sm leading-6 font-semibold transition-all duration-200 relative",
                                sidebarCollapsed 
                                  ? "w-12 h-12 p-0 flex items-center justify-center mx-auto" 
                                  : "w-full justify-start gap-x-3 p-3",
                                isActive
                                  ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-400 border border-amber-500/30 shadow-lg"
                                  : temAcesso 
                                    ? "text-slate-300 hover:text-amber-400 hover:bg-slate-800/70 hover:border hover:border-amber-500/20"
                                    : "text-slate-500 hover:text-slate-400 cursor-not-allowed opacity-60"
                              )}
                              onClick={() => {
                                if (temAcesso) {
                                  navigate(item.href)
                                } else {
                                  navigate('/planos')
                                }
                              }}
                              title={sidebarCollapsed ? item.name : undefined}
                            >
                              <item.icon className={cn("shrink-0", sidebarCollapsed ? "h-6 w-6" : "h-5 w-5")} />
                              {!sidebarCollapsed && (
                                <span className="flex items-center space-x-2">
                                  <span>{item.name}</span>
                                  {!temAcesso && <Lock className="w-4 h-4" />}
                                </span>
                              )}
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
              
              <li className="mt-auto">
                <div className={cn("border-t border-slate-700", sidebarCollapsed ? "p-2" : "p-4")}>
                  {sidebarCollapsed ? (
                    // Layout minimizado com dropdown
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-12 h-12 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-all duration-200 flex items-center justify-center"
                          >
                            <span className="text-amber-400 font-semibold text-sm">
                              {user?.email?.charAt(0).toUpperCase()}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="end" className="w-56 bg-slate-800 border-slate-700">
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-medium text-slate-200">
                            {user?.user_metadata?.nome_estabelecimento || 'Usuário'}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {user?.email}
                          </p>
                        </div>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem 
                          onClick={() => navigate('/configuracoes')}
                          className="text-slate-200 focus:bg-blue-500/20 focus:text-blue-400 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          ⚙️ Configurações
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={handleSignOut}
                          className="text-red-400 focus:bg-red-500/20 focus:text-red-300 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          🚪 Sair
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  ) : (
                    // Layout expandido normal
                    <>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <span className="text-amber-400 font-semibold text-sm">
                            {user?.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {user?.user_metadata?.nome_estabelecimento || 'Usuário'}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </Button>
                    </>
                  )}
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>



      {/* Header mobile */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm px-4 shadow-sm sm:px-6 lg:hidden">
        <div className="flex items-center space-x-3">
          <Beer className="h-6 w-6 text-amber-400" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Torneira Digital
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Dropdown do usuário no header mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 transition-all duration-200"
              >
                <span className="text-amber-400 font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56 bg-slate-800 border-slate-700 mt-2">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {user?.user_metadata?.nome_estabelecimento || 'Usuário'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem 
                onClick={() => navigate('/configuracoes')}
                className="text-slate-200 focus:bg-blue-500/20 focus:text-blue-400 cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                ⚙️ Configurações
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-400 focus:bg-red-500/20 focus:text-red-300 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                🚪 Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
      )}>
        <main className="py-6 lg:py-10 pb-20 md:pb-6">
          <div className="px-4 sm:px-6 lg:px-8 space-y-6">
            <PlanoStatus />
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

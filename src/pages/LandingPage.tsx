import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "../components/providers/auth-provider"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { 
  Beer, 
  BarChart3, 
  Package, 
  Users, 
  TrendingUp, 
  Shield, 
  Smartphone,
  Check,
  Star,
  PlayCircle,
  Zap,
  Target,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Coffee,
  Printer,
  Cloud,
  CreditCard,
  Settings,
  FileText
} from "lucide-react"

export default function LandingPage() {
  const navigate = useNavigate()
  const { signIn, user, loading: authLoading } = useAuthContext()
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  })

  const handleComecarAgora = () => {
    navigate('/planos')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await signIn({
        email: loginData.email,
        password: loginData.password
      })
      navigate("/app/vendas")
    } catch (error: any) {
      console.error("Erro de login:", error)
      
      let errorMessage = "Erro ao fazer login"
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "E-mail ou senha incorretos."
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "E-mail não confirmado. Verifique sua caixa de entrada."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Redirecionar se já estiver logado (usando useEffect para evitar setState during render)
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/app/vendas")
    }
  }, [authLoading, user, navigate])

  // Se estiver logado, não renderizar a landing page
  if (!authLoading && user) {
    return null
  }

  const features = [
    {
      icon: <Package className="w-8 h-8" />,
      title: "Controle de Estoque",
      description: "Gerencie seu estoque em tempo real com alertas automáticos e relatórios detalhados."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Vendas Inteligentes",
      description: "Sistema completo de vendas com múltiplas formas de pagamento e controle de comandas."
    },
    {
      icon: <Coffee className="w-8 h-8" />,
      title: "Gestão de Mesas",
      description: "Controle completo de mesas e comandas com status em tempo real e histórico de ocupação."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Gestão de Clientes",
      description: "Cadastro completo de clientes com histórico de compras e preferências."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Relatórios Avançados",
      description: "Dashboards intuitivos com métricas importantes para seu negócio."
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Pagamentos Múltiplos",
      description: "Aceite dinheiro, cartão, PIX e outras formas de pagamento de forma integrada."
    },
    {
      icon: <Printer className="w-8 h-8" />,
      title: "Impressão Térmica",
      description: "Integração com impressoras térmicas para comandas e cupons fiscais automáticos."
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Backup Automático",
      description: "Seus dados sempre seguros com backup automático na nuvem e sincronização em tempo real."
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "Configurações Avançadas",
      description: "Personalize o sistema conforme suas necessidades com configurações flexíveis."
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Exportação de Dados",
      description: "Exporte relatórios e dados em diversos formatos (PDF, Excel, CSV) para análises externas."
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "100% Responsivo",
      description: "Acesse de qualquer dispositivo - computador, tablet ou smartphone."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Seguro e Confiável",
      description: "Seus dados protegidos com criptografia e backup automático na nuvem."
    }
  ]

  const testimonials = [
    {
      name: "Carlos Silva",
      business: "Cervejaria Artesanal SP",
      avatar: "🍺",
      text: "Revolucionou a gestão do meu bar! Agora tenho controle total do estoque e vendas em tempo real."
    },
    {
      name: "Ana Costa",
      business: "Choperia Família",
      avatar: "🍻",
      text: "Interface muito intuitiva. Meus funcionários aprenderam a usar em poucos minutos."
    },
    {
      name: "Roberto Lima",
      business: "Bar do Roberto",
      avatar: "🥃",
      text: "Os relatórios me ajudaram a aumentar o faturamento em 30% no primeiro mês!"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 blur-3xl opacity-50 animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"></div>
      </div>

      <div className="relative z-10">
        {/* Header/Navbar */}
        <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-lg opacity-30"></div>
              <div className="relative bg-gradient-to-r from-amber-500 to-yellow-500 p-3 rounded-full">
                <Beer className="w-8 h-8 text-slate-900" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Torneira Digital
            </span>
          </div>
          
          <Button
            onClick={handleComecarAgora}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Começar Agora
          </Button>
        </nav>

        {/* Hero Section */}
        <section className="text-center py-20 px-6 max-w-6xl mx-auto">
          <div className="mb-8">
            <Badge className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30 px-4 py-2 text-sm font-semibold mb-6">
              🎉 Teste Grátis por 7 Dias
            </Badge>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">
              Gerencie seu bar
            </span>
            <br />
            <span className="text-slate-100">
              como um profissional
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Sistema completo para gestão de bares, cervejarias e restaurantes. 
            Controle estoque, vendas, comandas e relatórios em uma única plataforma moderna e intuitiva.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={handleComecarAgora}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <PlayCircle className="w-6 h-6 mr-3" />
              Começar Teste Grátis
            </Button>
            
            <Button
              variant="outline"
              className="border-2 border-slate-600/50 hover:border-amber-500/50 bg-slate-900/50 hover:bg-slate-800/60 text-slate-100 hover:text-amber-400 font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
              onClick={() => setIsLoginModalOpen(true)}
            >
              Já tenho conta
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-400 mb-2">500+</div>
              <div className="text-slate-400">Estabelecimentos ativos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">99.9%</div>
              <div className="text-slate-400">Uptime garantido</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">24/7</div>
              <div className="text-slate-400">Suporte disponível</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Funcionalidades completas para modernizar a gestão do seu estabelecimento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:border-amber-500/30 transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl text-slate-100">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-300 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-slate-400">
              Depoimentos reais de quem já transformou seu negócio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 hover:border-amber-500/30 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-100">{testimonial.name}</CardTitle>
                      <CardDescription className="text-amber-400 font-medium">{testimonial.business}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-300 italic leading-relaxed">
                    "{testimonial.text}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 max-w-4xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-amber-500/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 rounded-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-xl opacity-40"></div>
                  <div className="relative bg-gradient-to-r from-amber-500 to-yellow-500 p-4 rounded-full">
                    <Target className="w-12 h-12 text-slate-900" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-4xl font-bold text-slate-100 mb-4">
                Pronto para revolucionar seu negócio?
              </h2>
              
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Junte-se a centenas de estabelecimentos que já modernizaram sua gestão. 
                Comece seu teste gratuito hoje mesmo!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button
                  onClick={handleComecarAgora}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Zap className="w-6 h-6 mr-3" />
                  Começar Teste de 7 Dias Grátis
                </Button>
              </div>

              <div className="flex items-center justify-center space-x-6 text-slate-400 text-sm">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Cancele quando quiser</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Suporte incluído</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 max-w-7xl mx-auto border-t border-slate-800/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-lg opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-amber-500 to-yellow-500 p-2 rounded-full">
                    <Beer className="w-6 h-6 text-slate-900" />
                  </div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Torneira Digital
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md">
                A solução completa para modernizar a gestão do seu bar, cervejaria ou restaurante. 
                Tecnologia brasileira, suporte local.
              </p>
            </div>

            <div>
              <h3 className="text-slate-100 font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-amber-400 transition-colors">Funcionalidades</a></li>
                <li><button onClick={handleComecarAgora} className="hover:text-amber-400 transition-colors">Planos</button></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Demo</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-slate-100 font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-amber-400 transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">WhatsApp</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800/50 pt-8 text-center">
            <p className="text-slate-400 text-center">
              © 2024 Torneira Digital. Feito no Brasil.
            </p>
          </div>
        </footer>
      </div>

      {/* Modal de Login */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto bg-slate-900/98 backdrop-blur-xl border-amber-500/30 rounded-2xl shadow-2xl">
          <DialogHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-r from-amber-500 to-yellow-500 p-4 rounded-full">
                  <Beer className="w-8 h-8 text-slate-900" />
                </div>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Entrar na sua conta
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base mt-3">
              Acesse seu painel de controle
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="modal-email" className="text-slate-300 font-semibold">
                  E-mail
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-400 transition-colors" />
                  <Input
                    id="modal-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-12 h-12 bg-slate-800/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="modal-password" className="text-slate-300 font-semibold">
                  Senha
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-400 transition-colors" />
                  <Input
                    id="modal-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-12 pr-14 h-12 bg-slate-800/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col space-y-3 pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    "Entrar"
                  )}
                </Button>
                
                <div className="text-center space-y-2">
                  <p className="text-slate-400 text-sm">
                    Não tem uma conta?
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="text-amber-400 hover:text-amber-300 p-0 h-auto font-semibold"
                    onClick={() => {
                      setIsLoginModalOpen(false)
                      navigate('/planos')
                    }}
                  >
                    Criar conta
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

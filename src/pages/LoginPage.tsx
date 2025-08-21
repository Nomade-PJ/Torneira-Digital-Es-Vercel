

import type React from "react"

import { useState, useEffect } from "react"
import { useAuthContext } from "../components/providers/auth-provider"
import { registroSchema, loginSchema, forgotPasswordSchema, formatCpfCnpj } from "../lib/validations"

import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { Eye, EyeOff, Beer, Mail, Lock, User, KeyRound, ArrowLeft, Crown } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import type { Plano } from "../types/database"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null)
  const [planoInfo, setPlanoInfo] = useState<Plano | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nomeEstabelecimento: "",
    cnpjCpf: ""
  })
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, signUp, resetPassword, user, loading: authLoading } = useAuthContext()

  // Verificar plano selecionado e redirecionar se usuário já estiver logado
  useEffect(() => {
    // Verificar se há uma modalidade selecionada na URL (vindo do WhatsApp)
    const modalidade = searchParams.get('modalidade')
    const whatsappNumber = searchParams.get('whatsapp')
    
    if (modalidade) {
      // Definir plano baseado na modalidade (sistema único com modalidades)
      setPlanoSelecionado('unico')
      // Mostrar formulário de registro por padrão se há modalidade selecionada
      setIsLogin(false)
      
      // Se tiver número do WhatsApp, salvar para usar no cadastro
      if (whatsappNumber) {
        // Armazenar temporariamente para uso no cadastro
        sessionStorage.setItem('whatsapp_number', whatsappNumber)
        sessionStorage.setItem('selected_modalidade', modalidade)
      }
    }
    
    // Verificar se há um plano selecionado na URL (método antigo)
    const planoId = searchParams.get('plano')
    if (planoId) {
      setPlanoSelecionado(planoId)
      // Mostrar formulário de registro por padrão se há plano selecionado
      setIsLogin(false)
      // Buscar informações do plano
      carregarPlanoInfo(planoId)
    }

    if (!authLoading && user) {
      navigate("/app/vendas")
    }
  }, [searchParams, user, authLoading, navigate])

  const carregarPlanoInfo = async (planoId: string) => {
    try {
      const { data } = await supabase
        .from('planos')
        .select('*')
        .eq('id', planoId)
        .single()
      
      if (data) {
        setPlanoInfo(data)
      }
    } catch (error) {
      console.error('Erro ao carregar informações do plano:', error)
    }
  }

  const voltarParaPlanos = () => {
    navigate('/planos')
  }

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setValidationErrors({})

    try {
      if (isLogin) {
        // Validar dados de login
        const validation = loginSchema.safeParse({
          email: formData.email,
          password: formData.password
        })

        if (!validation.success) {
          const errors: Record<string, string> = {}
          validation.error.errors.forEach((err) => {
            if (err.path[0]) {
              errors[err.path[0].toString()] = err.message
            }
          })
          setValidationErrors(errors)
          return
        }

        // Login
        await signIn({
          email: formData.email,
          password: formData.password
        })
      } else {
        // Validar dados de registro
        const validation = registroSchema.safeParse({
          email: formData.email,
          password: formData.password,
          nomeEstabelecimento: formData.nomeEstabelecimento,
          cnpjCpf: formData.cnpjCpf.replace(/[^\d]/g, "") // Remove formatação
        })

        if (!validation.success) {
          const errors: Record<string, string> = {}
          validation.error.errors.forEach((err) => {
            if (err.path[0]) {
              errors[err.path[0].toString()] = err.message
            }
          })
          setValidationErrors(errors)
          return
        }

        // Verificar se há plano selecionado para registro
        if (!planoSelecionado) {
          setError("Por favor, selecione um plano antes de criar sua conta.")
          return
        }

        // Registro
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          nomeEstabelecimento: formData.nomeEstabelecimento,
          cnpjCpf: formData.cnpjCpf.replace(/[^\d]/g, ""), // Remove formatação
          planoId: planoSelecionado
        })

        // Se o registro foi bem-sucedido, tentar fazer login automaticamente
        if (result && result.user) {
          try {
            // Aguardar um pouco para o Supabase processar o registro
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            await signIn({
              email: formData.email,
              password: formData.password
            })
            
            // Login automático realizado com sucesso
          } catch (loginError) {
            console.warn("⚠️ Registro realizado, mas login automático falhou:", loginError)
            // Continuar com o fluxo normal mesmo se o login automático falhar
            // O usuário será redirecionado e poderá fazer login manualmente depois
          }
        }
      }
      
      navigate("/app/vendas")
    } catch (error: any) {
      console.error("Erro de autenticação:", error)
      
      // Melhor tratamento de erros
      let errorMessage = "Erro ao fazer login/registro"
      
      if (error.message?.includes("User already registered")) {
        errorMessage = "Este e-mail já está cadastrado. Tente fazer login."
      } else if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "E-mail ou senha incorretos."
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "⚠️ Email não confirmado. SOLUÇÃO: Execute o SQL no Supabase para confirmar emails automaticamente."
        setError(errorMessage)
        
        // Mostrar instruções detalhadas
        setTimeout(() => {
          setError(`
            📋 PASSOS PARA CORRIGIR:
            1. Vá para Supabase Dashboard > SQL Editor
            2. Execute: UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
            3. OU vá em Authentication > Settings e desmarque "Enable email confirmations"
            4. Depois tente fazer login novamente
          `)
        }, 2000)
        return
      } else if (error.message?.includes("Password should be at least")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres."
      } else if (error.message?.includes("row-level security") || error.message?.includes("PGRST") || error.message?.includes("foreign key constraint")) {
        errorMessage = "🔄 Processando cadastro... Aguarde um momento."
        setError(errorMessage)
        
        // Aguardar um pouco e tentar fazer login
        setTimeout(async () => {
          try {
            console.log("🔄 Tentando login após criação de conta...")
            await signIn({
              email: formData.email,
              password: formData.password
            })
            navigate("/app/vendas")
          } catch (loginError) {
            console.error("❌ Erro no login automático:", loginError)
            setError("✅ Conta criada com sucesso! Faça login manualmente.")
          }
        }, 3000)
        return
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResetLoading(true)
    setError("")

    try {
      // Validar email
      const validation = forgotPasswordSchema.safeParse({
        email: forgotPasswordEmail
      })

      if (!validation.success) {
        setError("Email inválido")
        return
      }

      await resetPassword(forgotPasswordEmail)
      setResetEmailSent(true)
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error)
      setError(error.message || "Erro ao enviar email de redefinição")
    } finally {
      setIsResetLoading(false)
    }
  }

  // Função para tratar formatação do CPF/CNPJ
  const handleCpfCnpjChange = (value: string) => {
    const formatted = formatCpfCnpj(value)
    setFormData(prev => ({ ...prev, cnpjCpf: formatted }))
  }

  const closeForgotPasswordModal = () => {
    setIsForgotPasswordOpen(false)
    setForgotPasswordEmail("")
    setResetEmailSent(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden p-4">
      
      {/* Botão voltar para planos */}
      {planoSelecionado && (
        <div className="absolute top-6 left-6 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={voltarParaPlanos}
            className="bg-slate-800/50 backdrop-blur-xl border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Planos
          </Button>
        </div>
      )}
      {/* Background decorativo melhorado */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 blur-3xl opacity-30 animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"></div>
      </div>

      <Card className="w-full max-w-lg mx-auto bg-slate-900/95 backdrop-blur-xl border-amber-500/30 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="text-center space-y-6 pb-8 pt-10">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-r from-amber-500 to-yellow-500 p-4 rounded-full">
                <Beer className="w-12 h-12 text-slate-900" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-slate-900 text-sm font-bold">T</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">
              Torneira Digital
            </CardTitle>
            <CardDescription className="text-slate-300 text-lg font-medium">
              {isLogin ? "Entre na sua conta" : "Crie sua conta"}
            </CardDescription>
            
            {/* Mostrar plano selecionado */}
            {planoInfo && !isLogin && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 font-semibold">Plano Selecionado</span>
                </div>
                <div className="text-slate-200 font-bold text-lg">{planoInfo.nome}</div>
                <div className="text-slate-300 text-sm">
                  {formatarPreco(planoInfo.preco_mensal)}/mês
                  {planoInfo.desconto_percentual && planoInfo.desconto_percentual > 0 && (
                    <span className="ml-2 text-amber-400">({planoInfo.desconto_percentual}% off)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-10 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm leading-relaxed backdrop-blur-sm">
                {error}
              </div>
            )}
            
            {!isLogin && (
              <>
                <div className="space-y-3">
                  <Label htmlFor="establishment" className="text-slate-300 font-semibold text-base">
                    Nome do Estabelecimento
                  </Label>
                  <div className="relative group">
                    <Beer className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-400 transition-colors" />
                    <Input
                      id="establishment"
                      type="text"
                      placeholder="Nome da sua cervejaria"
                      value={formData.nomeEstabelecimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomeEstabelecimento: e.target.value }))}
                      className={`pl-12 h-14 bg-slate-800/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl text-base font-medium transition-all duration-200 ${
                        validationErrors.nomeEstabelecimento ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {validationErrors.nomeEstabelecimento && (
                    <p className="text-red-400 text-sm mt-2">{validationErrors.nomeEstabelecimento}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="document" className="text-slate-300 font-semibold text-base">
                    CNPJ ou CPF
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-400 transition-colors" />
                    <Input
                      id="document"
                      type="text"
                      placeholder="00.000.000/0000-00 ou 000.000.000-00"
                      value={formData.cnpjCpf}
                      onChange={(e) => handleCpfCnpjChange(e.target.value)}
                      className={`pl-12 h-14 bg-slate-800/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl text-base font-medium transition-all duration-200 ${
                        validationErrors.cnpjCpf ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {validationErrors.cnpjCpf && (
                    <p className="text-red-400 text-sm mt-2">{validationErrors.cnpjCpf}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-3">
              <Label htmlFor="email" className="text-slate-300 font-semibold text-base">
                E-mail
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-400 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`pl-12 h-14 bg-slate-800/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl text-base font-medium transition-all duration-200 ${
                    validationErrors.email ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  required
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-400 text-sm mt-2">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-slate-300 font-semibold text-base">
                Senha
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-400 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className={`pl-12 pr-14 h-14 bg-slate-800/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl text-base font-medium transition-all duration-200 ${
                    validationErrors.password ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {validationErrors.password && (
                <p className="text-red-400 text-sm mt-2">{validationErrors.password}</p>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center space-x-3 text-slate-300 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800/60 text-amber-500 focus:ring-amber-500/20 focus:ring-2 transition-all" 
                  />
                  <span className="text-sm font-medium group-hover:text-slate-200 transition-colors">Lembrar-me</span>
                </label>
                <Button
                  type="button"
                  variant="link"
                  className="text-amber-400 hover:text-amber-300 p-0 h-auto font-semibold text-sm transition-colors"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Esqueci minha senha
                </Button>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>{isLogin ? "Entrando..." : "Criando conta..."}</span>
                  </div>
                ) : isLogin ? (
                  "Entrar"
                ) : (
                  "Criar Conta"
                )}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-6 px-10 pb-10">
          <Separator className="bg-slate-600/50" />
          <div className="text-center space-y-4">
            <div>
              <p className="text-slate-400 text-base mb-2">
                {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
              </p>
              <Button
                variant="link"
                className="text-amber-400 hover:text-amber-300 p-0 h-auto font-bold text-base transition-colors"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Criar conta" : "Fazer login"}
              </Button>
            </div>
            
            {/* Link para planos se não há plano selecionado */}
            {!planoSelecionado && !isLogin && (
              <div>
                <p className="text-slate-400 text-sm mb-2">
                  Ainda não escolheu um plano?
                </p>
                <Button
                  variant="link"
                  className="text-purple-400 hover:text-purple-300 p-0 h-auto font-semibold text-sm transition-colors"
                  onClick={() => navigate('/planos')}
                >
                  Ver Planos Disponíveis
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Modal de Esqueci Minha Senha */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto bg-slate-900/98 backdrop-blur-xl border-amber-500/30 rounded-2xl shadow-2xl">
          <DialogHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-r from-amber-500 to-yellow-500 p-4 rounded-full">
                  <KeyRound className="w-8 h-8 text-slate-900" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-slate-900 text-xs font-bold">?</span>
                </div>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Redefinir Senha
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-base mt-3">
              {resetEmailSent
                ? "Instruções enviadas para seu e-mail"
                : "Digite seu e-mail para receber as instruções de redefinição"}
            </DialogDescription>
          </DialogHeader>

          {!resetEmailSent ? (
            <div className="px-6 pb-6">
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="reset-email" className="text-slate-300 font-semibold text-base">
                    E-mail
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-400 transition-colors" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="pl-12 h-14 bg-slate-800/60 border-slate-600/50 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl text-base font-medium transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForgotPasswordModal}
                    className="flex-1 h-12 border-slate-600/50 hover:bg-slate-800/60 bg-transparent text-slate-300 font-semibold rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isResetLoading}
                  >
                    {isResetLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      "Enviar Instruções"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          ) : (
            <div className="px-6 pb-6">
              <div className="text-center p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-30"></div>
                    <div className="relative bg-green-500/20 p-3 rounded-full">
                      <Mail className="w-10 h-10 text-green-400" />
                    </div>
                  </div>
                </div>
                <p className="text-green-400 font-bold text-lg mb-3">E-mail enviado com sucesso!</p>
                <p className="text-slate-300 text-base mb-4">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
                <p className="text-slate-400 text-sm">Não esquece de verificar a pasta de spam! 📧</p>
              </div>

              <DialogFooter className="pt-6">
                <Button
                  onClick={closeForgotPasswordModal}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Entendi
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      

    </div>
  )
}

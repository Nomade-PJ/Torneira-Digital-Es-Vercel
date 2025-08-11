"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuthContext } from "@/components/providers/auth-provider"
import { registroSchema, loginSchema, forgotPasswordSchema, formatCpfCnpj } from "@/lib/validations"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, EyeOff, Beer, Mail, Lock, User, KeyRound } from "lucide-react"
import { useRouter } from "next/navigation"

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
  
  // Form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nomeEstabelecimento: "",
    cnpjCpf: "",
    telefone: ""
  })
  
  const router = useRouter()
  const { signIn, signUp, resetPassword, user, loading: authLoading } = useAuthContext()

  // Redirecionar se usuário já estiver logado
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/vendas")
    }
  }, [user, authLoading, router])

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
          cnpjCpf: formData.cnpjCpf.replace(/[^\d]/g, ""), // Remove formatação
          telefone: formData.telefone
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

        // Registro
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          nomeEstabelecimento: formData.nomeEstabelecimento,
          cnpjCpf: formData.cnpjCpf.replace(/[^\d]/g, ""), // Remove formatação
          telefone: formData.telefone
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
      
      router.push("/vendas")
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
            router.push("/vendas")
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 blur-3xl opacity-20"></div>
      </div>

      <Card className="w-full max-w-md mx-4 bg-slate-900/80 backdrop-blur-sm border-amber-500/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Beer className="w-16 h-16 text-amber-400 foam-animation" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                <span className="text-slate-900 text-xs font-bold">T</span>
              </div>
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Torneira Digital
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              {isLogin ? "Entre na sua conta" : "Crie sua conta"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="establishment" className="text-slate-300">
                    Nome do Estabelecimento
                  </Label>
                  <div className="relative">
                    <Beer className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="establishment"
                      type="text"
                      placeholder="Nome da sua cervejaria"
                      value={formData.nomeEstabelecimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomeEstabelecimento: e.target.value }))}
                      className={`pl-10 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 ${
                        validationErrors.nomeEstabelecimento ? 'border-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {validationErrors.nomeEstabelecimento && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.nomeEstabelecimento}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document" className="text-slate-300">
                    CNPJ ou CPF
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="document"
                      type="text"
                      placeholder="00.000.000/0000-00 ou 000.000.000-00"
                      value={formData.cnpjCpf}
                      onChange={(e) => handleCpfCnpjChange(e.target.value)}
                      className={`pl-10 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 ${
                        validationErrors.cnpjCpf ? 'border-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {validationErrors.cnpjCpf && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.cnpjCpf}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300">
                    Telefone (opcional)
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`pl-10 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 ${
                    validationErrors.email ? 'border-red-500' : ''
                  }`}
                  required
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className={`pl-10 pr-10 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 ${
                    validationErrors.password ? 'border-red-500' : ''
                  }`}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-100"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {validationErrors.password && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.password}</p>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 text-slate-400">
                  <input type="checkbox" className="rounded border-slate-700 bg-slate-800" />
                  <span>Lembrar-me</span>
                </label>
                <Button
                  type="button"
                  variant="link"
                  className="text-amber-400 hover:text-amber-300 p-0 h-auto"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Esqueci minha senha
                </Button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>{isLogin ? "Entrando..." : "Criando conta..."}</span>
                </div>
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Separator className="bg-slate-700" />
          <div className="text-center text-sm text-slate-400">
            {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
            <Button
              variant="link"
              className="text-amber-400 hover:text-amber-300 p-1 ml-1"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Criar conta" : "Fazer login"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Modal de Esqueci Minha Senha */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto bg-slate-900/95 backdrop-blur-sm border-amber-500/20">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <KeyRound className="w-12 h-12 text-amber-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                  <span className="text-slate-900 text-xs font-bold">?</span>
                </div>
              </div>
            </div>
            <DialogTitle className="text-xl bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Redefinir Senha
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {resetEmailSent
                ? "Instruções enviadas para seu e-mail"
                : "Digite seu e-mail para receber as instruções de redefinição"}
            </DialogDescription>
          </DialogHeader>

          {!resetEmailSent ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-slate-300">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col-reverse md:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForgotPasswordModal}
                  className="w-full md:w-auto border-slate-700 hover:bg-slate-800 bg-transparent"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold"
                  disabled={isResetLoading}
                >
                  {isResetLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    "Enviar Instruções"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex justify-center mb-2">
                  <Mail className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-green-400 font-medium mb-1">E-mail enviado com sucesso!</p>
                <p className="text-slate-300 text-sm">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
                <p className="text-slate-400 text-xs mt-2">Não esquece de verificar a pasta de spam! 📧</p>
              </div>

              <DialogFooter>
                <Button
                  onClick={closeForgotPasswordModal}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold"
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

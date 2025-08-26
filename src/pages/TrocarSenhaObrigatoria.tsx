// 🔐 Página de Troca de Senha Obrigatória
// Para usuários criados via webhook que precisam definir senha pessoal

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Eye, EyeOff, Lock, AlertTriangle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/ui/use-toast'

export default function TrocarSenhaObrigatoria() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    novaSenha: '',
    confirmarSenha: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Limpar erro específico do campo
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validatePassword = (password: string) => {
    const errors = []
    
    if (password.length < 8) {
      errors.push('Deve ter pelo menos 8 caracteres')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Deve conter pelo menos uma letra maiúscula')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Deve conter pelo menos uma letra minúscula')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Deve conter pelo menos um número')
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Deve conter pelo menos um caractere especial')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setValidationErrors({})

    try {
      // Validações
      const errors: Record<string, string> = {}

      if (!formData.novaSenha) {
        errors.novaSenha = 'Nova senha é obrigatória'
      } else {
        const passwordErrors = validatePassword(formData.novaSenha)
        if (passwordErrors.length > 0) {
          errors.novaSenha = passwordErrors[0]
        }
      }

      if (!formData.confirmarSenha) {
        errors.confirmarSenha = 'Confirmação de senha é obrigatória'
      } else if (formData.novaSenha !== formData.confirmarSenha) {
        errors.confirmarSenha = 'As senhas não conferem'
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        return
      }

      // Atualizar senha no Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.novaSenha
      })

      if (updateError) {
        throw updateError
      }

      // Remover flag de primeiro acesso
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          primeiro_acesso: false,
          senha_alterada_em: new Date().toISOString()
        }
      })

      if (metadataError) {
        console.warn('⚠️ Erro ao atualizar metadata:', metadataError)
      }

      // Sucesso
      toast({
        title: "🎉 Senha alterada com sucesso!",
        description: "Agora você pode usar sua nova senha para acessar o sistema.",
      })

      // Redirecionar para o sistema
      navigate('/app/vendas')

    } catch (error: any) {
      console.error('❌ Erro ao alterar senha:', error)
      setError(error.message || 'Erro ao alterar senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = () => {
    const errors = validatePassword(formData.novaSenha)
    const strength = 5 - errors.length
    
    if (strength <= 1) return { label: 'Muito Fraca', color: 'bg-red-500', width: '20%' }
    if (strength <= 2) return { label: 'Fraca', color: 'bg-orange-500', width: '40%' }
    if (strength <= 3) return { label: 'Média', color: 'bg-yellow-500', width: '60%' }
    if (strength <= 4) return { label: 'Forte', color: 'bg-blue-500', width: '80%' }
    return { label: 'Muito Forte', color: 'bg-green-500', width: '100%' }
  }

  const strength = passwordStrength()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-slate-900" />
          </div>
          <CardTitle className="text-2xl text-slate-100">
            Defina sua Senha Pessoal
          </CardTitle>
          <p className="text-slate-400 text-sm mt-2">
            Por segurança, você deve criar uma senha pessoal para acessar o sistema
          </p>
        </CardHeader>

        <CardContent>
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-200">
              <strong>Primeiro Acesso:</strong> Sua conta foi criada automaticamente após o pagamento. 
              Para sua segurança, defina uma senha pessoal e segura.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert className="mb-4 border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nova Senha */}
            <div>
              <Label htmlFor="novaSenha" className="text-slate-200">
                Nova Senha *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="novaSenha"
                  name="novaSenha"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.novaSenha}
                  onChange={handleInputChange}
                  className="pr-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400"
                  placeholder="Crie uma senha segura"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {validationErrors.novaSenha && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.novaSenha}</p>
              )}
              
              {/* Indicador de Força da Senha */}
              {formData.novaSenha && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Força da senha:</span>
                    <span className={`font-medium ${
                      strength.label === 'Muito Forte' ? 'text-green-400' :
                      strength.label === 'Forte' ? 'text-blue-400' :
                      strength.label === 'Média' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <Label htmlFor="confirmarSenha" className="text-slate-200">
                Confirmar Nova Senha *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  className="pr-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400"
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {validationErrors.confirmarSenha && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.confirmarSenha}</p>
              )}
              
              {/* Indicador de Confirmação */}
              {formData.confirmarSenha && (
                <div className="mt-2 flex items-center space-x-2">
                  {formData.novaSenha === formData.confirmarSenha ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">Senhas conferem</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">Senhas não conferem</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Requisitos da Senha */}
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="text-slate-200 font-medium mb-2">Requisitos da senha:</h4>
              <ul className="text-sm text-slate-400 space-y-1">
                <li className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${formData.novaSenha.length >= 8 ? 'bg-green-400' : 'bg-slate-600'}`} />
                  <span>Pelo menos 8 caracteres</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(formData.novaSenha) ? 'bg-green-400' : 'bg-slate-600'}`} />
                  <span>Uma letra maiúscula</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(formData.novaSenha) ? 'bg-green-400' : 'bg-slate-600'}`} />
                  <span>Uma letra minúscula</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(formData.novaSenha) ? 'bg-green-400' : 'bg-slate-600'}`} />
                  <span>Um número</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.novaSenha) ? 'bg-green-400' : 'bg-slate-600'}`} />
                  <span>Um caractere especial</span>
                </li>
              </ul>
            </div>

            {/* Botão */}
            <Button
              type="submit"
              disabled={isLoading || Object.keys(validationErrors).length > 0 || !formData.novaSenha || !formData.confirmarSenha}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                  <span>Definindo Senha...</span>
                </div>
              ) : (
                <span>Definir Senha e Acessar Sistema</span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-xs">
              Precisa de ajuda? 
              <a href="mailto:contato@torneira.digital" className="text-amber-400 ml-1 hover:underline">
                contato@torneira.digital
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

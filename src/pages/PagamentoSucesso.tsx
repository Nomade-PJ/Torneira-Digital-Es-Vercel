// 🎉 Página de Sucesso do Pagamento
// Exibida quando o cliente volta do Asaas com pagamento confirmado

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Mail, LogIn, Home, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'

interface CheckoutContext {
  planoId: string
  userEmail?: string
  valor: number
  valor_mensal: number
  periodo: string
  duracao_meses: number
  timestamp: string
  source: string
}

export default function PagamentoSucesso() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [checkoutContext, setCheckoutContext] = useState<CheckoutContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Recuperar contexto do checkout
    const context = localStorage.getItem('checkout-context')
    
    if (context) {
      try {
        const parsedContext = JSON.parse(context)
        setCheckoutContext(parsedContext)
        
        // Limpar após uso para não interferir em futuros checkouts
        localStorage.removeItem('checkout-context')
        
        console.log('✅ Contexto do pagamento recuperado:', parsedContext)
      } catch (error) {
        console.error('❌ Erro ao parsear contexto:', error)
      }
    }
    
    setIsLoading(false)
  }, [])

  // Obter parâmetros da URL (caso o Asaas passe informações)
  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-0">
        
        {/* Header de Sucesso */}
        <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
          <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">
            Pagamento Confirmado!
          </CardTitle>
          <p className="text-green-100 mt-2">
            Sua assinatura foi processada com sucesso
          </p>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          
          {/* Status */}
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              <CheckCircle className="w-4 h-4 mr-2" />
              Pagamento Processado
            </div>
          </div>

          {/* Informações do Plano */}
          {checkoutContext && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📋 Detalhes da Assinatura:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plano:</span>
                    <span className="font-medium">{checkoutContext.planoId.replace('-', ' ').replace('torneira', '').replace('digital', '').trim()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Mensal:</span>
                    <span className="font-medium">R$ {checkoutContext.valor_mensal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium">{checkoutContext.duracao_meses} mês(es)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Pago:</span>
                    <span className="font-bold text-green-600">R$ {checkoutContext.valor.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Próximos Passos */}
          <Alert className="border-blue-200 bg-blue-50">
            <Mail className="h-5 w-5 text-blue-600" />
            <AlertDescription>
              <div className="text-blue-800">
                <strong>📧 Próximos Passos:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Sua conta está sendo ativada automaticamente</li>
                  <li>• Você receberá um email em {checkoutContext?.userEmail || 'seu email'}</li>
                  <li>• O email conterá suas credenciais de acesso</li>
                  <li>• Processo pode levar até 5 minutos</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Informações Técnicas (se disponíveis) */}
          {(paymentId || status) && (
            <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
              <div className="font-semibold mb-1">🔧 Informações Técnicas:</div>
              {paymentId && <div>ID do Pagamento: {paymentId}</div>}
              {status && <div>Status: {status}</div>}
              <div>Processado em: {new Date().toLocaleString('pt-BR')}</div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/login')}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Fazer Login na Plataforma
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Informações de Suporte */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              💬 Não recebeu o email ou tem alguma dúvida?
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                📧 Email: 
                <a 
                  href="mailto:contato@torneira.digital" 
                  className="text-green-600 ml-1 hover:underline font-medium"
                >
                  contato@torneira.digital
                </a>
              </p>
              <p className="text-xs text-gray-500">
                ⚡ Suporte técnico disponível 24/7
              </p>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Carregando informações...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

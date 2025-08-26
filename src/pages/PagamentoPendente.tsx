// ⏳ Página de Pagamento Pendente
// Exibida quando o pagamento está aguardando confirmação (ex: boleto)

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, RefreshCw, Mail, FileText, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'

export default function PagamentoPendente() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [checkoutContext, setCheckoutContext] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    // Recuperar contexto do checkout
    const context = localStorage.getItem('checkout-context')
    if (context) {
      try {
        const parsedContext = JSON.parse(context)
        setCheckoutContext(parsedContext)
        // Não limpar ainda pois pagamento ainda não foi confirmado
      } catch (error) {
        console.error('❌ Erro ao parsear contexto:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Contador regressivo para boleto (3 dias)
    const updateTimer = () => {
      const now = new Date()
      const deadline = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)) // 3 dias
      const diff = deadline.getTime() - now.getTime()
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else {
        setTimeLeft('Expirado')
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Atualizar a cada minuto

    return () => clearInterval(interval)
  }, [])

  // Obter parâmetros da URL
  const paymentId = searchParams.get('payment_id')
  const paymentMethod = searchParams.get('method')
  const status = searchParams.get('status')

  const handleVerificarStatus = () => {
    // Recarregar página para verificar status
    window.location.reload()
  }

  const handleNovoTentativa = () => {
    // Limpar contexto e voltar para planos
    localStorage.removeItem('checkout-context')
    navigate('/planos')
  }

  const getPaymentMethodInfo = () => {
    switch (paymentMethod?.toLowerCase()) {
      case 'boleto':
      case 'bank_slip':
        return {
          icon: <FileText className="w-6 h-6 text-orange-600" />,
          title: 'Boleto Bancário',
          subtitle: 'Aguardando pagamento',
          color: 'orange',
          instructions: [
            'O boleto foi gerado com sucesso',
            'Você pode pagar em qualquer banco, lotérica ou pelo internet banking',
            'O prazo de vencimento é de 3 dias úteis',
            'Após o pagamento, pode levar até 2 dias úteis para compensar'
          ]
        }
      case 'pix':
        return {
          icon: <RefreshCw className="w-6 h-6 text-blue-600" />,
          title: 'PIX',
          subtitle: 'Processando pagamento',
          color: 'blue',
          instructions: [
            'Seu PIX está sendo processado',
            'Normalmente a confirmação é instantânea',
            'Se demorar mais que 10 minutos, verifique com seu banco',
            'Você receberá confirmação por email assim que for aprovado'
          ]
        }
      default:
        return {
          icon: <Clock className="w-6 h-6 text-yellow-600" />,
          title: 'Pagamento Pendente',
          subtitle: 'Aguardando confirmação',
          color: 'yellow',
          instructions: [
            'Seu pagamento está sendo processado',
            'Você receberá uma confirmação em breve',
            'Verifique seu email regularmente',
            'Em caso de dúvidas, entre em contato conosco'
          ]
        }
    }
  }

  const methodInfo = getPaymentMethodInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-0">
        
        {/* Header */}
        <CardHeader className={`text-center bg-gradient-to-r from-${methodInfo.color}-500 to-${methodInfo.color}-600 text-white rounded-t-lg`}>
          <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
            {methodInfo.icon}
          </div>
          <CardTitle className="text-3xl font-bold">
            {methodInfo.title}
          </CardTitle>
          <p className={`text-${methodInfo.color}-100 mt-2`}>
            {methodInfo.subtitle}
          </p>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          
          {/* Status */}
          <div className="text-center">
            <Badge variant="secondary" className={`bg-${methodInfo.color}-100 text-${methodInfo.color}-800 px-4 py-2`}>
              <Clock className="w-4 h-4 mr-2" />
              Pagamento Pendente
            </Badge>
          </div>

          {/* Timer para Boleto */}
          {paymentMethod === 'boleto' && timeLeft && (
            <Alert className="border-orange-200 bg-orange-50">
              <Clock className="h-5 w-5 text-orange-600" />
              <AlertDescription>
                <div className="text-orange-800">
                  <strong>⏰ Tempo restante para pagamento:</strong>
                  <div className="text-lg font-bold mt-1">{timeLeft}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Informações do Plano */}
          {checkoutContext && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📋 Detalhes do Pedido:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plano:</span>
                    <span className="font-medium">{checkoutContext.planoId?.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-bold text-green-600">R$ {checkoutContext.valor?.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{checkoutContext.userEmail || 'Não informado'}</span>
                  </div>
                  {paymentId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID Pagamento:</span>
                      <span className="font-mono text-xs">{paymentId}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <Alert className={`border-${methodInfo.color}-200 bg-${methodInfo.color}-50`}>
            <CheckCircle className={`h-5 w-5 text-${methodInfo.color}-600`} />
            <AlertDescription>
              <div className={`text-${methodInfo.color}-800`}>
                <strong>📝 Próximos passos:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  {methodInfo.instructions.map((instruction, index) => (
                    <li key={index}>• {instruction}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Status Técnico */}
          {status && (
            <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
              <div className="font-semibold mb-1">🔧 Status Técnico:</div>
              <div>Status: {status}</div>
              <div>Método: {paymentMethod || 'Não especificado'}</div>
              <div>Verificado em: {new Date().toLocaleString('pt-BR')}</div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="space-y-3">
            <Button 
              onClick={handleVerificarStatus}
              className={`w-full h-12 bg-gradient-to-r from-${methodInfo.color}-500 to-${methodInfo.color}-600 hover:from-${methodInfo.color}-600 hover:to-${methodInfo.color}-700 text-white font-bold`}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Verificar Status do Pagamento
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Início
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleNovoTentativa}
                className="flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Novo Pagamento
              </Button>
            </div>
          </div>

          {/* Informações Importantes */}
          <Alert className="border-blue-200 bg-blue-50">
            <Mail className="h-5 w-5 text-blue-600" />
            <AlertDescription>
              <div className="text-blue-800">
                <strong>📧 Importante:</strong>
                <div className="mt-1 text-sm">
                  Assim que seu pagamento for confirmado, você receberá automaticamente:
                  <ul className="mt-1 space-y-1">
                    <li>• Email de confirmação</li>
                    <li>• Dados de acesso à plataforma</li>
                    <li>• Instruções de primeiro uso</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Suporte */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              💬 Tem dúvidas sobre seu pagamento?
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                📧 Email: 
                <a 
                  href="mailto:contato@torneira.digital" 
                  className="text-blue-600 ml-1 hover:underline font-medium"
                >
                  contato@torneira.digital
                </a>
              </p>
              <p className="text-xs text-gray-500">
                🕐 Suporte disponível 24/7
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

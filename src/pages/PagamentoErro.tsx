// ❌ Página de Erro do Pagamento
// Exibida quando há problemas no pagamento ou cancelamento

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { XCircle, RefreshCw, ArrowLeft, HelpCircle, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'

export default function PagamentoErro() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorDetails, setErrorDetails] = useState<any>(null)

  useEffect(() => {
    // Recuperar contexto de erro se existir
    const context = localStorage.getItem('checkout-context')
    if (context) {
      try {
        const parsedContext = JSON.parse(context)
        setErrorDetails(parsedContext)
        // Não limpar aqui pois o usuário pode tentar novamente
      } catch (error) {
        console.error('❌ Erro ao parsear contexto:', error)
      }
    }
  }, [])

  // Obter informações de erro da URL
  const errorCode = searchParams.get('error')
  const errorMessage = searchParams.get('message')
  const paymentId = searchParams.get('payment_id')

  const handleTentarNovamente = () => {
    // Voltar para seleção de planos
    navigate('/planos')
  }

  const handleSuporteContato = () => {
    const subject = encodeURIComponent('Problema com Pagamento - Torneira Digital')
    const body = encodeURIComponent(`
Olá! Tive um problema ao tentar realizar o pagamento.

Detalhes:
- Erro: ${errorCode || 'Não especificado'}
- Mensagem: ${errorMessage || 'Não especificada'}
- Payment ID: ${paymentId || 'N/A'}
- Timestamp: ${new Date().toISOString()}

Por favor, me ajudem a resolver esta questão.

Obrigado!
    `)
    
    window.open(`mailto:contato@torneira.digital?subject=${subject}&body=${body}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-0">
        
        {/* Header de Erro */}
        <CardHeader className="text-center bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg">
          <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">
            Pagamento Não Realizado
          </CardTitle>
          <p className="text-red-100 mt-2">
            Houve um problema durante o processo de pagamento
          </p>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          
          {/* Status */}
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Pagamento Cancelado ou Falhou
            </div>
          </div>

          {/* Mensagem de Erro */}
          {(errorCode || errorMessage) && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-5 w-5 text-red-600" />
              <AlertDescription>
                <div className="text-red-800">
                  <strong>❌ Detalhes do Erro:</strong>
                  <div className="mt-2 text-sm">
                    {errorMessage && <div>• {errorMessage}</div>}
                    {errorCode && <div>• Código: {errorCode}</div>}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Possíveis Causas */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                Possíveis causas:
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Dados do cartão incorretos ou inválidos</li>
                <li>• Cartão sem limite disponível ou bloqueado</li>
                <li>• Problema temporário de conexão</li>
                <li>• Cancelamento durante o processo</li>
                <li>• Problemas técnicos no processador de pagamento</li>
                <li>• Restrições do banco emissor</li>
              </ul>
            </CardContent>
          </Card>

          {/* Informações do Plano (se disponível) */}
          {errorDetails && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📋 Plano Selecionado:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plano:</span>
                    <span className="font-medium">{errorDetails.planoId?.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-medium">R$ {errorDetails.valor?.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{errorDetails.userEmail || 'Não informado'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Técnicas */}
          {paymentId && (
            <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
              <div className="font-semibold mb-1">🔧 Informações Técnicas:</div>
              <div>Payment ID: {paymentId}</div>
              <div>Timestamp: {new Date().toLocaleString('pt-BR')}</div>
            </div>
          )}

          {/* Sugestões de Ação */}
          <Alert className="border-blue-200 bg-blue-50">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <AlertDescription>
              <div className="text-blue-800">
                <strong>💡 Sugestões:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Verifique os dados do cartão e tente novamente</li>
                  <li>• Use um método de pagamento diferente (PIX é mais rápido)</li>
                  <li>• Entre em contato com seu banco se o problema persistir</li>
                  <li>• Aguarde alguns minutos e tente novamente</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Botões de Ação */}
          <div className="space-y-3">
            <Button 
              onClick={handleTentarNovamente}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Tentar Novamente
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
                onClick={handleSuporteContato}
                className="flex items-center justify-center"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Suporte
              </Button>
            </div>
          </div>

          {/* Informações de Suporte */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              💬 Precisa de ajuda imediata?
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
                🕐 Resposta em até 24 horas
              </p>
              <p className="text-xs text-gray-500 mt-3">
                💡 <strong>Dica:</strong> PIX é aprovado instantaneamente e raramente falha
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

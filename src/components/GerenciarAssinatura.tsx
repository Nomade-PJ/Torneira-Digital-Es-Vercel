import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
  X
} from 'lucide-react'
import { useAuthContext } from './providers/auth-provider'
import { subscriptionService, useSubscriptionStatus } from '../lib/subscription-service'
import { AsaasUtils } from '../lib/asaas-service'
import CheckoutAsaas from './CheckoutAsaas'
import { useToast } from './ui/use-toast'

export default function GerenciarAssinatura() {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const { status, loading, refresh } = useSubscriptionStatus(user?.id)
  const [showPlans, setShowPlans] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  // Planos disponíveis
  const planos = {
    mensal: {
      id: 'plano-mensal-torneira-digital',
      nome: 'Plano Mensal',
      preco_mensal: 89.90,
      preco_total: 89.90,
      duracao_meses: 1,
      desconto_percentual: 0
    },
    semestral: {
      id: 'plano-semestral-torneira-digital',
      nome: 'Plano Semestral',
      preco_mensal: 79.90,
      preco_total: 479.40,
      duracao_meses: 6,
      desconto_percentual: 11
    },
    anual: {
      id: 'plano-anual-torneira-digital',
      nome: 'Plano Anual',
      preco_mensal: 69.90,
      preco_total: 838.80,
      duracao_meses: 12,
      desconto_percentual: 22
    }
  }

  // Carregar histórico de transações
  useEffect(() => {
    if (user?.id) {
      loadTransactionHistory()
    }
  }, [user])

  const loadTransactionHistory = async () => {
    try {
      const history = await subscriptionService.getUserTransactionHistory(user?.id!)
      setTransactions(history)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const handleUpgradePlan = (plano: any) => {
    setSelectedPlan(plano)
    setIsCheckoutOpen(true)
  }

  const handlePaymentSuccess = () => {
    toast({
      title: '🎉 Plano Atualizado!',
      description: 'Seu plano foi alterado com sucesso.'
    })
    setIsCheckoutOpen(false)
    setShowPlans(false)
    refresh()
  }

  const formatStatus = (status: string) => {
    return subscriptionService.formatStatusForDisplay(status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Carregando assinatura...</span>
      </div>
    )
  }

  if (!status?.subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Nenhuma Assinatura</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Você não possui nenhuma assinatura ativa. Escolha um plano para começar.
          </p>
          <Button 
            onClick={() => {
              console.log('🔍 Abrindo planos disponíveis')
              setShowPlans(true)
            }}
          >
            Ver Planos Disponíveis
          </Button>
        </CardContent>
      </Card>
    )
  }

  const subscription = status.subscription
  const statusInfo = formatStatus(subscription.status)

  return (
    <div className="space-y-6">
      {/* Status da Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Assinatura Atual</span>
            </div>
            <Badge 
              className={`
                ${statusInfo.color === 'green' ? 'bg-green-500' : ''}
                ${statusInfo.color === 'orange' ? 'bg-orange-500' : ''}
                ${statusInfo.color === 'red' ? 'bg-red-500' : ''}
                ${statusInfo.color === 'gray' ? 'bg-gray-500' : ''}
              `}
            >
              {statusInfo.icon} {statusInfo.text}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Plano</p>
              <p className="font-semibold">Plano Personalizado</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor Mensal</p>
              <p className="font-semibold">{AsaasUtils.formatCurrency(subscription.valor_mensal)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vencimento</p>
              <p className="font-semibold flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {subscription.data_vencimento 
                    ? subscriptionService.formatDateForDisplay(subscription.data_vencimento)
                    : 'Não definido'
                  }
                </span>
              </p>
            </div>
          </div>

          {status.daysUntilExpiry && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-800">
                {status.daysUntilExpiry > 0 
                  ? `${status.daysUntilExpiry} dias restantes`
                  : 'Vencido'
                }
              </span>
            </div>
          )}

          {status.limitationMessage && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{status.limitationMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={() => setShowPlans(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Alterar Plano
            </Button>
            <Button 
              variant="outline"
              onClick={refresh}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Planos Disponíveis */}
      {showPlans && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Planos Disponíveis</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPlans(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(planos).map((plano) => (
                <Card key={plano.id} className="border-2 hover:border-blue-300 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{plano.nome}</CardTitle>
                    {plano.desconto_percentual > 0 && (
                      <Badge className="w-fit bg-green-500">
                        {plano.desconto_percentual}% OFF
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {AsaasUtils.formatCurrency(plano.preco_mensal)}/mês
                      </div>
                      {plano.duracao_meses > 1 && (
                        <div className="text-sm text-gray-500">
                          Total: {AsaasUtils.formatCurrency(plano.preco_total)}
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        {plano.duracao_meses} {plano.duracao_meses === 1 ? 'mês' : 'meses'}
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4"
                      onClick={() => handleUpgradePlan(plano)}
                      disabled={subscription.valor_mensal === plano.preco_mensal}
                    >
                      {subscription.valor_mensal === plano.preco_mensal 
                        ? 'Plano Atual' 
                        : 'Escolher Este'
                      }
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Transações */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full 
                      ${transaction.status === 'confirmed' ? 'bg-green-500' : ''}
                      ${transaction.status === 'pending' ? 'bg-yellow-500' : ''}
                      ${transaction.status === 'overdue' ? 'bg-red-500' : ''}
                    `} />
                    <div>
                      <p className="font-medium">{AsaasUtils.formatCurrency(transaction.valor)}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.metodo_pagamento.toUpperCase()} • {' '}
                        {subscriptionService.formatDateForDisplay(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {transaction.status === 'confirmed' ? '✅ Pago' : 
                     transaction.status === 'pending' ? '⏳ Pendente' : 
                     '❌ Vencido'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutAsaas 
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          plano={selectedPlan}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

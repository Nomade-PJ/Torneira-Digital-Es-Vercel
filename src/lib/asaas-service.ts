// Serviço Asaas - Sistema de Pagamentos e Assinaturas
// Documentação: https://docs.asaas.com/

import { supabase } from './supabase'

// Interfaces TypeScript
export interface AsaasCustomer {
  id?: string
  name: string
  email: string
  phone?: string
  mobilePhone?: string
  cpfCnpj: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
  country?: string
  observations?: string
}

export interface AsaasPayment {
  id?: string
  customer: string // ID do customer
  billingType: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO'
  value: number
  dueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string
  installmentCount?: number
  totalValue?: number
  discount?: {
    value?: number
    dueDateLimitDays?: number
    type?: 'FIXED' | 'PERCENTAGE'
  }
  fine?: {
    value?: number
    type?: 'FIXED' | 'PERCENTAGE'
  }
  interest?: {
    value?: number
    type?: 'PERCENTAGE'
  }
  postalService?: boolean
  split?: Array<{
    walletId: string
    fixedValue?: number
    percentualValue?: number
  }>
  callback?: {
    successUrl?: string
    autoRedirect?: boolean
  }
  creditCard?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    addressComplement?: string
    phone: string
    mobilePhone?: string
  }
}

export interface AsaasWebhookPayload {
  id: string
  dateCreated: string
  customer: string
  paymentLink?: string
  value: number
  netValue: number
  originalValue?: number
  interestValue?: number
  description: string
  billingType: string
  pixTransaction?: {
    qrCode: {
      encodedImage: string
      payload: string
      expirationDate: string
    }
  }
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'REFUND_IN_PROGRESS' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS'
  dueDate: string
  originalDueDate: string
  paymentDate?: string
  clientPaymentDate?: string
  installmentNumber?: number
  transactionReceiptUrl?: string
  nossoNumero?: string
  invoiceUrl: string
  bankSlipUrl?: string
  invoiceNumber: string
  externalReference?: string
  creditCard?: {
    creditCardNumber: string
    creditCardBrand: string
    creditCardToken: string
  }
  pixQrCodeImage?: string
  pixCopyAndPaste?: string
}

class AsaasService {
  private baseURL: string
  private apiKey: string
  private environment: 'sandbox' | 'production'

  constructor() {
    // Configuração baseada nas variáveis de ambiente do Vite
    this.environment = (import.meta.env.VITE_ASAAS_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'
    this.baseURL = this.environment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3'
    
    // API Key do ambiente configurado
    this.apiKey = import.meta.env.VITE_ASAAS_API_KEY || 'SUA_API_KEY_AQUI'
    
    // Debug das configurações apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('🔧 Asaas Config:', {
        environment: this.environment,
        baseURL: this.baseURL,
        hasApiKey: !!this.apiKey && this.apiKey !== 'SUA_API_KEY_AQUI',
        apiKeyLength: this.apiKey?.length,
        apiKeyPrefix: this.apiKey?.substring(0, 20) + '...'
      })
    }
  }

  // Headers padrão para as requisições
  private getHeaders(): HeadersInit {
    return {
      'access_token': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'TorneiraDigital/1.0'
    }
  }

  // Fazer requisições para a API do Asaas
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        ...options
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Erro na API Asaas:', data)
        throw new Error(data.errors?.[0]?.description || 'Erro na API do Asaas')
      }

      return data
    } catch (error) {
      console.error('Erro na requisição Asaas:', error)
      throw error
    }
  }

  // 1. CRIAR OU BUSCAR CUSTOMER - USANDO PROXY API
  async createOrGetCustomer(userData: AsaasCustomer): Promise<string> {
    try {
      console.log('🔧 Criando customer via proxy API...')
      
      // Usar nossa API proxy para evitar CORS
      const response = await fetch('/api/asaas/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Falha ao criar customer')
      }

      const customer = await response.json()
      console.log('✅ Customer criado via proxy:', customer.id)
      return customer.id

    } catch (error) {
      console.error('❌ Erro ao criar customer via proxy:', error)
      throw error
    }
  }

  // 2. CRIAR COBRANÇA (PIX, Cartão, Boleto) - USANDO PROXY API
  async createPayment(paymentData: AsaasPayment): Promise<AsaasWebhookPayload> {
    try {
      console.log('🔧 Criando pagamento via proxy API...')
      
      // Usar nossa API proxy para evitar CORS
      const response = await fetch('/api/asaas/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Falha ao criar pagamento')
      }

      const payment = await response.json()
      console.log('✅ Pagamento criado via proxy:', payment.id)

      // Se for PIX, buscar QR Code
      if (paymentData.billingType === 'PIX') {
        const pixData = await this.getPixQrCode(payment.id)
        return {
          ...payment,
          pixQrCodeImage: pixData.encodedImage,
          pixCopyAndPaste: pixData.payload,
          pixTransaction: {
            qrCode: {
              encodedImage: pixData.encodedImage,
              payload: pixData.payload,
              expirationDate: pixData.expirationDate
            }
          }
        }
      }

      return payment
    } catch (error) {
      console.error('Erro ao criar pagamento:', error)
      throw error
    }
  }

  // 3. BUSCAR QR CODE PIX
  async getPixQrCode(paymentId: string): Promise<any> {
    try {
      return await this.makeRequest(`/payments/${paymentId}/pixQrCode`)
    } catch (error) {
      console.error('Erro ao buscar QR Code PIX:', error)
      throw error
    }
  }

  // 4. BUSCAR STATUS DO PAGAMENTO
  async getPaymentStatus(paymentId: string): Promise<AsaasWebhookPayload> {
    try {
      console.log('🔧 Verificando status via proxy API...')
      
      // Usar nossa API proxy para evitar CORS
      const response = await fetch(`/api/asaas/payment-status?paymentId=${paymentId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Falha ao verificar status')
      }

      const payment = await response.json()
      console.log('✅ Status obtido via proxy:', payment.status)
      return payment

    } catch (error) {
      console.error('❌ Erro ao buscar status via proxy:', error)
      throw error
    }
  }

  // 5. CANCELAR PAGAMENTO
  async cancelPayment(paymentId: string): Promise<void> {
    try {
      await this.makeRequest(`/payments/${paymentId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error)
      throw error
    }
  }

  // 6. CRIAR ASSINATURA RECORRENTE (OPCIONAL - Não usado no checkout atual)
  async createSubscription(customerData: AsaasCustomer, planData: {
    value: number
    cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
    description: string
    billingType: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO'
    nextDueDate: string
    discount?: { value: number; dueDateLimitDays: number }
    maxPayments?: number
    externalReference?: string
  }): Promise<any> {
    try {
      // Criar customer primeiro
      const customerId = await this.createOrGetCustomer(customerData)

      // Criar assinatura
      const subscription = await this.makeRequest('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          customer: customerId,
          ...planData
        })
      })

      return subscription
    } catch (error) {
      console.error('Erro ao criar assinatura:', error)
      throw error
    }
  }

  // 7. GERENCIAR ASSINATURAS
  async updateSubscription(subscriptionId: string, updates: any): Promise<any> {
    try {
      return await this.makeRequest(`/subscriptions/${subscriptionId}`, {
        method: 'POST',
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error)
      throw error
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.makeRequest(`/subscriptions/${subscriptionId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      throw error
    }
  }

  // 8. WEBHOOK - PROCESSAR PAGAMENTO
  async processWebhook(payload: AsaasWebhookPayload): Promise<void> {
    try {
      // Log do webhook
      await supabase
        .from('asaas_webhook_logs')
        .insert({
          asaas_payment_id: payload.id,
          evento: `payment.${payload.status.toLowerCase()}`,
          payload: payload,
          processado: false
        })

      // Buscar transação no banco
      const { data: transacao } = await supabase
        .from('transacoes_asaas')
        .select('*, assinatura_id')
        .eq('asaas_payment_id', payload.id)
        .single()

      if (!transacao) {
        console.error('Transação não encontrada:', payload.id)
        return
      }

      // Atualizar status da transação
      await supabase
        .from('transacoes_asaas')
        .update({
          status: this.mapAsaasStatusToLocal(payload.status),
          data_pagamento: payload.paymentDate || null,
          data_confirmacao: payload.status === 'CONFIRMED' ? new Date().toISOString() : null,
          valor_liquido: payload.netValue,
          webhook_data: payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', transacao.id)

      // Se pagamento confirmado/recebido, ativar assinatura
      if (['CONFIRMED', 'RECEIVED'].includes(payload.status)) {
        await this.ativarAssinatura(transacao.assinatura_id)
      }

      // Se vencido, suspender assinatura
      if (payload.status === 'OVERDUE') {
        await this.suspenderAssinatura(transacao.assinatura_id)
      }

      // Marcar webhook como processado
      await supabase
        .from('asaas_webhook_logs')
        .update({ processado: true })
        .eq('asaas_payment_id', payload.id)

    } catch (error) {
      console.error('Erro ao processar webhook:', error)
      
      // Log do erro
      await supabase
        .from('asaas_webhook_logs')
        .update({ 
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          tentativas: 1
        })
        .eq('asaas_payment_id', payload.id)
        
      throw error
    }
  }

  // Mapear status Asaas para status local
  private mapAsaasStatusToLocal(asaasStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'pending',
      'CONFIRMED': 'confirmed',
      'RECEIVED': 'received',
      'OVERDUE': 'overdue',
      'REFUNDED': 'refunded',
      'RECEIVED_IN_CASH': 'received',
      'REFUND_REQUESTED': 'refunded',
      'REFUND_IN_PROGRESS': 'refunded'
    }
    
    return statusMap[asaasStatus] || 'pending'
  }

  // Ativar assinatura
  private async ativarAssinatura(assinaturaId: string): Promise<void> {
    try {
      const proximoVencimento = new Date()
      proximoVencimento.setMonth(proximoVencimento.getMonth() + 1)

      await supabase
        .from('assinaturas')
        .update({
          status: 'ativa',
          data_vencimento: proximoVencimento.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', assinaturaId)

      console.log('✅ Assinatura ativada:', assinaturaId)
    } catch (error) {
      console.error('Erro ao ativar assinatura:', error)
      throw error
    }
  }

  // Suspender assinatura
  private async suspenderAssinatura(assinaturaId: string): Promise<void> {
    try {
      await supabase
        .from('assinaturas')
        .update({
          status: 'suspensa',
          updated_at: new Date().toISOString()
        })
        .eq('id', assinaturaId)

      console.log('⚠️ Assinatura suspensa:', assinaturaId)
    } catch (error) {
      console.error('Erro ao suspender assinatura:', error)
      throw error
    }
  }

  // Configurar ambiente (sandbox/production)
  setEnvironment(env: 'sandbox' | 'production', apiKey: string): void {
    this.environment = env
    this.apiKey = apiKey
    this.baseURL = env === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3'
  }

  // Validar se está configurado
  isConfigured(): boolean {
    return this.apiKey !== 'SUA_API_KEY_AQUI' && this.apiKey.length > 0
  }

  // Testar conexão
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/customers?limit=1')
      return true
    } catch (error) {
      console.error('Erro ao testar conexão:', error)
      return false
    }
  }

  // 9. VALIDAÇÕES ESPECÍFICAS ASAAS
  
  // Validar dados de cartão de crédito
  validateCreditCard(cardData: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Nome do portador
    if (!cardData.holderName || cardData.holderName.length < 2) {
      errors.push('Nome do portador é obrigatório')
    }

    // Número do cartão (básico)
    const cardNumber = cardData.number.replace(/\D/g, '')
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      errors.push('Número do cartão inválido')
    }

    // Mês
    const month = parseInt(cardData.expiryMonth)
    if (month < 1 || month > 12) {
      errors.push('Mês de vencimento inválido')
    }

    // Ano
    const year = parseInt(`20${cardData.expiryYear}`)
    const currentYear = new Date().getFullYear()
    if (year < currentYear || year > currentYear + 20) {
      errors.push('Ano de vencimento inválido')
    }

    // CVV
    if (!cardData.ccv || cardData.ccv.length < 3 || cardData.ccv.length > 4) {
      errors.push('CVV inválido')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validar valor do pagamento
  validatePaymentValue(value: number, billingType: string): { isValid: boolean; error?: string } {
    // Valor mínimo R$ 1,00
    if (value < 1) {
      return { isValid: false, error: 'Valor mínimo é R$ 1,00' }
    }

    // Valor máximo PIX R$ 50.000,00
    if (billingType === 'PIX' && value > 50000) {
      return { isValid: false, error: 'Valor máximo para PIX é R$ 50.000,00' }
    }

    // Valor máximo cartão R$ 100.000,00
    if (['CREDIT_CARD', 'DEBIT_CARD'].includes(billingType) && value > 100000) {
      return { isValid: false, error: 'Valor máximo para cartão é R$ 100.000,00' }
    }

    return { isValid: true }
  }

  // Gerar referência externa única
  generateExternalReference(prefix: string = 'TORNEIRA'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}_${timestamp}_${random}`
  }
}

// Instância singleton
export const asaasService = new AsaasService()

// Utilitários
export const AsaasUtils = {
  // Formatar valor para centavos
  formatCurrency: (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  },

  // Validar CPF/CNPJ
  validateCpfCnpj: (cpfCnpj: string): boolean => {
    const numbers = cpfCnpj.replace(/\D/g, '')
    return numbers.length === 11 || numbers.length === 14
  },

  // Formatar CPF/CNPJ
  formatCpfCnpj: (cpfCnpj: string): string => {
    const numbers = cpfCnpj.replace(/\D/g, '')
    
    if (numbers.length === 11) {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (numbers.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    
    return cpfCnpj
  },

  // Calcular próximo vencimento
  calculateNextDueDate: (cycle: string): string => {
    const now = new Date()
    
    switch (cycle) {
      case 'MONTHLY':
        now.setMonth(now.getMonth() + 1)
        break
      case 'QUARTERLY':
        now.setMonth(now.getMonth() + 3)
        break
      case 'SEMIANNUALLY':
        now.setMonth(now.getMonth() + 6)
        break
      case 'YEARLY':
        now.setFullYear(now.getFullYear() + 1)
        break
      default:
        now.setMonth(now.getMonth() + 1)
    }
    
    return now.toISOString().split('T')[0] // YYYY-MM-DD
  }
}

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
    // Por padrão sandbox - será alterado quando você configurar
    this.environment = 'sandbox'
    this.baseURL = this.environment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3'
    
    // API Key será configurada depois que você criar a conta
    this.apiKey = process.env.NEXT_PUBLIC_ASAAS_API_KEY || 'SUA_API_KEY_AQUI'
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

  // 1. CRIAR OU BUSCAR CUSTOMER
  async createOrGetCustomer(userData: AsaasCustomer): Promise<string> {
    try {
      // Primeiro tenta buscar por CPF/CNPJ
      const existingCustomers = await this.makeRequest(
        `/customers?cpfCnpj=${userData.cpfCnpj}&limit=1`
      )

      if (existingCustomers.data && existingCustomers.data.length > 0) {
        return existingCustomers.data[0].id
      }

      // Se não existir, criar novo
      const newCustomer = await this.makeRequest('/customers', {
        method: 'POST',
        body: JSON.stringify(userData)
      })

      return newCustomer.id
    } catch (error) {
      console.error('Erro ao criar/buscar customer:', error)
      throw error
    }
  }

  // 2. CRIAR COBRANÇA (PIX, Cartão, Boleto)
  async createPayment(paymentData: AsaasPayment): Promise<AsaasWebhookPayload> {
    try {
      const payment = await this.makeRequest('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      })

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
      return await this.makeRequest(`/payments/${paymentId}`)
    } catch (error) {
      console.error('Erro ao buscar status do pagamento:', error)
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

  // 6. CRIAR ASSINATURA RECORRENTE
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

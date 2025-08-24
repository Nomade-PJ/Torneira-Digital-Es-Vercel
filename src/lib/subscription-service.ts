// Serviço de Gestão de Assinaturas
// Controla acesso, vencimentos e bloqueios do sistema

import React from 'react'
import { supabase } from './supabase'
import { isSuperAdminEmail } from '../hooks/useSuperAdmin'

export interface Assinatura {
  id: string
  usuario_id: string
  plano_id: string
  asaas_customer_id?: string
  asaas_subscription_id?: string
  status: 'ativa' | 'suspensa' | 'cancelada' | 'pendente'
  data_inicio: string
  data_vencimento?: string
  data_cancelamento?: string
  valor_mensal: number
  valor_total: number
  desconto_percentual: number
  metodo_pagamento_preferido?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean
  subscription?: Assinatura
  daysUntilExpiry?: number
  isExpired: boolean
  isTrialPeriod: boolean
  canAccessSystem: boolean
  limitationMessage?: string
}

class SubscriptionService {
  
  // Verificar status da assinatura do usuário
  async getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      // Primeiro, verificar se é super admin por email
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('email, role')
        .eq('id', userId)
        .single()

      if (!userError && user) {
        // Verificar se é super admin
        if (isSuperAdminEmail(user.email) || user.role === 'super_admin') {
          return {
            hasActiveSubscription: true,
            isExpired: false,
            isTrialPeriod: false,
            canAccessSystem: true,
            limitationMessage: undefined,
            subscription: {
              id: 'super-admin',
              usuario_id: userId,
              plano_id: 'super-admin',
              status: 'ativa',
              data_inicio: new Date().toISOString(),
              data_vencimento: '2030-12-31T23:59:59.000Z',
              valor_mensal: 0,
              valor_total: 0,
              desconto_percentual: 100,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as Assinatura
          }
        }
      }

      // Buscar assinatura ativa mais recente
      const { data: subscription, error } = await supabase
        .from('assinaturas')
        .select('*')
        .eq('usuario_id', userId)
        .in('status', ['ativa', 'pendente'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      // Se não tem assinatura
      if (!subscription) {
        return {
          hasActiveSubscription: false,
          isExpired: true,
          isTrialPeriod: false,
          canAccessSystem: false,
          limitationMessage: 'Nenhuma assinatura ativa. Assine um plano para continuar usando o sistema.'
        }
      }

      const now = new Date()
      const vencimento = subscription.data_vencimento ? new Date(subscription.data_vencimento) : null
      const isExpired = vencimento ? now > vencimento : false
      const daysUntilExpiry = vencimento ? Math.ceil((vencimento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined

      // Verificar se ainda está no período de teste (primeiros 7 dias)
      const inicioAssinatura = new Date(subscription.data_inicio)
      const diasDesdeInicio = Math.ceil((now.getTime() - inicioAssinatura.getTime()) / (1000 * 60 * 60 * 24))
      const isTrialPeriod = diasDesdeInicio <= 7

      // Determinar se pode acessar o sistema
      let canAccessSystem = false
      let limitationMessage: string | undefined

      switch (subscription.status) {
        case 'ativa':
          if (isExpired) {
            canAccessSystem = false
            limitationMessage = 'Assinatura vencida. Renove para continuar usando o sistema.'
          } else {
            canAccessSystem = true
          }
          break
        
        case 'pendente':
          if (isTrialPeriod) {
            canAccessSystem = true
            limitationMessage = `Período de teste - ${7 - diasDesdeInicio} dias restantes. Complete o pagamento para continuar.`
          } else {
            canAccessSystem = false
            limitationMessage = 'Pagamento pendente. Complete o pagamento para reativar o sistema.'
          }
          break
        
        case 'suspensa':
          canAccessSystem = false
          limitationMessage = 'Assinatura suspensa. Entre em contato com o suporte.'
          break
        
        case 'cancelada':
          canAccessSystem = false
          limitationMessage = 'Assinatura cancelada. Assine um novo plano para continuar.'
          break
      }

      return {
        hasActiveSubscription: subscription.status === 'ativa',
        subscription,
        daysUntilExpiry,
        isExpired,
        isTrialPeriod,
        canAccessSystem,
        limitationMessage
      }

    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error)
      
      // Em caso de erro, permitir acesso (fail-safe)
      return {
        hasActiveSubscription: true,
        isExpired: false,
        isTrialPeriod: false,
        canAccessSystem: true,
        limitationMessage: 'Erro ao verificar assinatura. Sistema em modo de emergência.'
      }
    }
  }

  // Ativar assinatura após pagamento
  async activateSubscription(subscriptionId: string): Promise<void> {
    try {
      const nextDueDate = new Date()
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)

      await supabase
        .from('assinaturas')
        .update({
          status: 'ativa',
          data_vencimento: nextDueDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      console.log('✅ Assinatura ativada:', subscriptionId)
    } catch (error) {
      console.error('Erro ao ativar assinatura:', error)
      throw error
    }
  }

  // Suspender assinatura (pagamento vencido)
  async suspendSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      await supabase
        .from('assinaturas')
        .update({
          status: 'suspensa',
          observacoes: reason || 'Suspensa automaticamente por vencimento',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      console.log('⚠️ Assinatura suspensa:', subscriptionId)
    } catch (error) {
      console.error('Erro ao suspender assinatura:', error)
      throw error
    }
  }

  // Cancelar assinatura
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      await supabase
        .from('assinaturas')
        .update({
          status: 'cancelada',
          data_cancelamento: new Date().toISOString(),
          observacoes: reason || 'Cancelada pelo usuário',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      console.log('❌ Assinatura cancelada:', subscriptionId)
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      throw error
    }
  }

  // Renovar assinatura
  async renewSubscription(subscriptionId: string, months: number = 1): Promise<void> {
    try {
      const { data: subscription } = await supabase
        .from('assinaturas')
        .select('data_vencimento')
        .eq('id', subscriptionId)
        .single()

      const baseDate = subscription?.data_vencimento 
        ? new Date(subscription.data_vencimento)
        : new Date()

      const newDueDate = new Date(baseDate)
      newDueDate.setMonth(newDueDate.getMonth() + months)

      await supabase
        .from('assinaturas')
        .update({
          status: 'ativa',
          data_vencimento: newDueDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      console.log('🔄 Assinatura renovada:', subscriptionId, 'até', newDueDate)
    } catch (error) {
      console.error('Erro ao renovar assinatura:', error)
      throw error
    }
  }

  // Verificar assinaturas vencidas (para executar via cron)
  async checkExpiredSubscriptions(): Promise<void> {
    try {
      const now = new Date().toISOString()

      // Buscar assinaturas ativas vencidas
      const { data: expiredSubscriptions } = await supabase
        .from('assinaturas')
        .select('id, usuario_id, data_vencimento')
        .eq('status', 'ativa')
        .lt('data_vencimento', now)

      if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
        console.log('✅ Nenhuma assinatura vencida encontrada')
        return
      }

      // Suspender assinaturas vencidas
      for (const subscription of expiredSubscriptions) {
        await this.suspendSubscription(
          subscription.id, 
          `Vencida em ${subscription.data_vencimento}`
        )
      }

      console.log(`⚠️ ${expiredSubscriptions.length} assinaturas vencidas foram suspensas`)
    } catch (error) {
      console.error('Erro ao verificar assinaturas vencidas:', error)
    }
  }

  // Obter relatório de assinaturas
  async getSubscriptionReport(userId?: string): Promise<{
    total: number
    ativas: number
    pendentes: number
    suspensas: number
    canceladas: number
    receita_mensal: number
    receita_total: number
  }> {
    try {
      let query = supabase
        .from('assinaturas')
        .select('status, valor_mensal, valor_total')

      if (userId) {
        query = query.eq('usuario_id', userId)
      }

      const { data: subscriptions, error } = await query

      if (error) throw error

      const report = {
        total: subscriptions?.length || 0,
        ativas: 0,
        pendentes: 0,
        suspensas: 0,
        canceladas: 0,
        receita_mensal: 0,
        receita_total: 0
      }

      subscriptions?.forEach(sub => {
        switch (sub.status) {
          case 'ativa':
            report.ativas++
            report.receita_mensal += sub.valor_mensal
            break
          case 'pendente':
            report.pendentes++
            break
          case 'suspensa':
            report.suspensas++
            break
          case 'cancelada':
            report.canceladas++
            break
        }
        report.receita_total += sub.valor_total
      })

      return report
    } catch (error) {
      console.error('Erro ao gerar relatório de assinaturas:', error)
      throw error
    }
  }

  // Histórico de transações do usuário
  async getUserTransactionHistory(userId: string): Promise<any[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('transacoes_asaas')
        .select(`
          *,
          assinatura_id,
          assinaturas!inner(
            usuario_id,
            plano_id,
            planos(nome)
          )
        `)
        .eq('assinaturas.usuario_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return transactions || []
    } catch (error) {
      console.error('Erro ao buscar histórico de transações:', error)
      return []
    }
  }

  // Formatar status para exibição
  formatStatusForDisplay(status: string): { text: string; color: string; icon: string } {
    const statusMap = {
      'ativa': { text: 'Ativa', color: 'green', icon: '✅' },
      'pendente': { text: 'Pendente', color: 'orange', icon: '⏳' },
      'suspensa': { text: 'Suspensa', color: 'red', icon: '⚠️' },
      'cancelada': { text: 'Cancelada', color: 'gray', icon: '❌' }
    }

    return statusMap[status as keyof typeof statusMap] || { text: status, color: 'gray', icon: '❓' }
  }

  // Formatar data para exibição
  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Calcular dias restantes
  calculateDaysRemaining(dateString: string): number {
    const targetDate = new Date(dateString)
    const now = new Date()
    const diffTime = targetDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

// Instância singleton
export const subscriptionService = new SubscriptionService()

// Hook React para usar o status da assinatura
export function useSubscriptionStatus(userId?: string) {
  const [status, setStatus] = React.useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const checkStatus = async () => {
      try {
        const subscriptionStatus = await subscriptionService.getUserSubscriptionStatus(userId)
        setStatus(subscriptionStatus)
      } catch (error) {
        console.error('Erro ao verificar status da assinatura:', error)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()

    // Verificar status a cada 5 minutos
    const interval = setInterval(checkStatus, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [userId])

  return { status, loading, refresh: () => {
    if (userId) {
      setLoading(true)
      subscriptionService.getUserSubscriptionStatus(userId).then(setStatus).finally(() => setLoading(false))
    }
  }}
}



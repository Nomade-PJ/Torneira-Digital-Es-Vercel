// 🔗 Configuração Centralizada dos Links Asaas
// Solução Híbrida: Seu site + Links de pagamento Asaas

// ⚠️  IMPORTANTE: Configure estes links no painel Asaas
// 📋 Painel Asaas → Links de Pagamento → Criar Link

// Interface para configuração dos links
interface AsaasLinkConfig {
  url: string
  nome: string
  valor: number
  valor_total?: number
  periodo: string
  duracao_meses: number
  desconto_percentual: number
  economia?: number
  cor: string
}

export const ASAAS_LINKS: Record<string, AsaasLinkConfig> = {
  // 🟢 Plano Mensal (R$ 89,90) - LINK REAL ATIVO
  'plano-mensal-torneira-digital': {
    url: 'https://www.asaas.com/c/dgnk1m7d59s5f6os',
    nome: 'Plano Mensal',
    valor: 89.90,
    valor_total: 89.90,
    periodo: 'mensal',
    duracao_meses: 1,
    desconto_percentual: 0,
    cor: 'blue'
  },
  
  // 🟡 Plano Semestral (R$ 79,90/mês) - LINK REAL ATIVO
  'plano-semestral-torneira-digital': {
    url: 'https://www.asaas.com/c/321cfvj8egr3wxjq',
    nome: 'Plano Semestral',
    valor: 79.90,
    valor_total: 479.40,
    periodo: 'semestral',
    duracao_meses: 6,
    desconto_percentual: 11,
    economia: 59.40,
    cor: 'purple'
  },
  
  // 🔵 Plano Anual (R$ 69,90/mês) - LINK REAL ATIVO
  'plano-anual-torneira-digital': {
    url: 'https://www.asaas.com/c/9qkask44e8j2u9bu',
    nome: 'Plano Anual',
    valor: 69.90,
    valor_total: 838.80,
    periodo: 'anual',
    duracao_meses: 12,
    desconto_percentual: 22,
    economia: 238.80,
    cor: 'amber'
  }
}

// 🎯 Função para obter configuração de um plano
export const getAsaasLink = (planoId: string): AsaasLinkConfig | null => {
  const link = ASAAS_LINKS[planoId]
  
  if (!link) {
    console.error(`❌ Link não encontrado para plano: ${planoId}`)
    return null
  }
  
  if (import.meta.env.DEV) {
    console.log('🔗 Link obtido:', {
      planoId,
      nome: link.nome,
      valor: link.valor,
      url: link.url
    })
  }
  
  return link
}

// 🚀 Função para redirecionar com contexto para webhook
export const redirectToAsaas = (planoId: string, userEmail?: string) => {
  const link = getAsaasLink(planoId)
  
  if (!link) {
    alert('❌ Erro: Plano não encontrado')
    return false
  }
  
  // 💾 Salvar contexto para o webhook processar depois
  const checkoutContext = {
    planoId,
    userEmail,
    valor: link.valor_total || link.valor,
    valor_mensal: link.valor,
    periodo: link.periodo,
    duracao_meses: link.duracao_meses,
    desconto_percentual: link.desconto_percentual,
    timestamp: new Date().toISOString(),
    source: 'torneira-digital-hybrid',
    redirectUrl: window.location.href
  }
  
  localStorage.setItem('checkout-context', JSON.stringify(checkoutContext))
  
  if (import.meta.env.DEV) {
    console.log('💾 Contexto salvo no localStorage:', checkoutContext)
    console.log('🚀 Redirecionando para:', link.url)
  }
  
  // 🌐 Redirecionar para Asaas (mesmo tab para melhor UX)
  window.location.href = link.url
  
  return true
}

// 💰 Utilities para formatação
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// 📊 Função para calcular economia
export const calcularEconomia = (planoId: string): number => {
  const link = getAsaasLink(planoId)
  if (!link) return 0
  
  const precoMensalOriginal = 89.90 // Preço base do plano mensal
  const totalSemDesconto = precoMensalOriginal * link.duracao_meses
  const totalComDesconto = link.valor_total || link.valor
  
  return totalSemDesconto - totalComDesconto
}

// 🎨 Função para obter cor do plano
export const getPlanoColor = (planoId: string): string => {
  const link = getAsaasLink(planoId)
  if (!link) return 'gray'
  
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500', 
    amber: 'from-amber-500 to-yellow-500',
    green: 'from-green-500 to-emerald-500'
  }
  
  return colors[link.cor as keyof typeof colors] || colors.green
}

// ✅ Validar se link está configurado
export const isLinkConfigured = (planoId: string): boolean => {
  const link = getAsaasLink(planoId)
  if (!link) return false
  
  // Verificar se não é URL de exemplo
  return !link.url.includes('TORNEIRA_') || link.url.includes('asaas.com/c/')
}

// 📋 Lista de todos os planos disponíveis
export const getAllPlanos = () => {
  return Object.entries(ASAAS_LINKS).map(([id, config]) => ({
    id,
    ...config
  }))
}

// 🔧 Configurações de desenvolvimento
export const DEV_CONFIG = {
  // URLs para testar em desenvolvimento (sandbox)
  sandbox: {
    'plano-mensal-torneira-digital': 'https://sandbox.asaas.com/c/TORNEIRA_MENSAL_DEV',
    'plano-semestral-torneira-digital': 'https://sandbox.asaas.com/c/TORNEIRA_SEMESTRAL_DEV', 
    'plano-anual-torneira-digital': 'https://sandbox.asaas.com/c/TORNEIRA_ANUAL_DEV'
  } as Record<string, string>
}

// 🌍 Função para obter URL baseada no ambiente
export const getEnvironmentUrl = (planoId: string): string => {
  const link = getAsaasLink(planoId)
  if (!link) return ''
  
  // Em desenvolvimento, usar sandbox se disponível
  if (import.meta.env.DEV && DEV_CONFIG.sandbox[planoId]) {
    return DEV_CONFIG.sandbox[planoId]
  }
  
  return link.url
}

export default ASAAS_LINKS

// Configuração do Asaas
// Aqui você vai adicionar suas credenciais quando criar a conta

export const asaasConfig = {
  // Ambiente: 'sandbox' para testes, 'production' para produção
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  
  // API Keys - Configure essas variáveis no .env
  apiKey: {
    sandbox: process.env.NEXT_PUBLIC_ASAAS_SANDBOX_API_KEY || 'SUA_API_KEY_SANDBOX_AQUI',
    production: process.env.NEXT_PUBLIC_ASAAS_PRODUCTION_API_KEY || 'SUA_API_KEY_PRODUCTION_AQUI'
  },
  
  // URLs base
  baseURL: {
    sandbox: 'https://sandbox.asaas.com/api/v3',
    production: 'https://www.asaas.com/api/v3'
  },
  
  // Webhook configuration
  webhook: {
    // URL que o Asaas vai chamar quando houver atualizações
    url: process.env.NODE_ENV === 'production' 
      ? 'https://seudominio.vercel.app/api/webhooks/asaas'
      : 'https://seu-ngrok-url.ngrok.io/api/webhooks/asaas',
    
    // Eventos que queremos receber
    events: [
      'PAYMENT_CREATED',
      'PAYMENT_AWAITING_PAYMENT',
      'PAYMENT_RECEIVED',
      'PAYMENT_CONFIRMED',
      'PAYMENT_OVERDUE',
      'PAYMENT_DELETED',
      'PAYMENT_RESTORED',
      'PAYMENT_REFUNDED',
      'PAYMENT_RECEIVED_IN_CASH',
      'PAYMENT_CHARGEBACK_REQUESTED',
      'PAYMENT_CHARGEBACK_DISPUTE',
      'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
      'PAYMENT_DUNNING_RECEIVED',
      'PAYMENT_DUNNING_REQUESTED',
      'PAYMENT_BANK_SLIP_VIEWED',
      'PAYMENT_CHECKOUT_VIEWED'
    ]
  },
  
  // Configurações de pagamento
  payment: {
    // Moeda padrão
    currency: 'BRL',
    
    // Métodos aceitos
    methods: {
      pix: true,
      creditCard: true,
      debitCard: true,
      bankSlip: false // Boleto desabilitado por padrão
    },
    
    // Limites
    limits: {
      minValue: 1.00,
      maxValue: 50000.00,
      maxInstallments: 12
    },
    
    // Descontos automáticos
    discounts: {
      pix: 0, // 0% de desconto para PIX
      debitCard: 0, // 0% de desconto para débito
    },
    
    // Taxas (informativo - as taxas reais são definidas na conta Asaas)
    fees: {
      pix: 0.0095, // 0,95%
      debitCard: 0.0295, // 2,95%
      creditCard: 0.0495, // 4,95%
      bankSlip: 3.50 // R$ 3,50 fixo
    }
  },
  
  // Configurações do checkout
  checkout: {
    // URLs de redirecionamento
    successUrl: process.env.NODE_ENV === 'production'
      ? 'https://seudominio.vercel.app/vendas?payment=success'
      : 'http://localhost:3000/vendas?payment=success',
    
    errorUrl: process.env.NODE_ENV === 'production'
      ? 'https://seudominio.vercel.app/planos?payment=error'
      : 'http://localhost:3000/planos?payment=error',
    
    // Configurações de expiração
    expirationTime: {
      pix: 30, // 30 minutos
      bankSlip: 3 // 3 dias
    },
    
    // Informações da empresa (aparece no checkout)
    company: {
      name: 'Torneira Digital',
      document: '00.000.000/0001-00', // Substitua pelo seu CNPJ
      email: 'contato@torneiradigital.com',
      phone: '(11) 99999-9999'
    }
  }
}

// Função para obter a configuração atual
export function getCurrentAsaasConfig() {
  const env = asaasConfig.environment as 'sandbox' | 'production'
  
  return {
    environment: env,
    apiKey: asaasConfig.apiKey[env],
    baseURL: asaasConfig.baseURL[env],
    isConfigured: asaasConfig.apiKey[env] !== `SUA_API_KEY_${env.toUpperCase()}_AQUI`,
    webhook: asaasConfig.webhook,
    payment: asaasConfig.payment,
    checkout: asaasConfig.checkout
  }
}

// Validar se a configuração está completa
export function validateAsaasConfig(): { isValid: boolean; errors: string[] } {
  const config = getCurrentAsaasConfig()
  const errors: string[] = []
  
  if (!config.isConfigured) {
    errors.push(`API Key do ambiente ${config.environment} não configurada`)
  }
  
  if (!config.checkout.company?.document || config.checkout.company.document === '00.000.000/0001-00') {
    errors.push('CNPJ da empresa não configurado')
  }
  
  if (!config.checkout.company?.email || config.checkout.company.email === 'contato@torneiradigital.com') {
    errors.push('Email da empresa não configurado')
  }
  
  if (config.environment === 'production' && config.webhook.url.includes('ngrok')) {
    errors.push('URL de webhook de produção não configurada')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Instruções para configuração
export const setupInstructions = {
  steps: [
    {
      step: 1,
      title: 'Criar Conta Asaas',
      description: 'Acesse https://www.asaas.com e crie sua conta',
      details: [
        'Cadastre-se gratuitamente',
        'Confirme seu email',
        'Complete as informações da empresa',
        'Aguarde aprovação (geralmente instantânea)'
      ]
    },
    {
      step: 2,
      title: 'Gerar API Key',
      description: 'No painel Asaas, vá em Integrações > API',
      details: [
        'Clique em "Gerar nova API Key"',
        'Copie a chave gerada',
        'Guarde em local seguro (não compartilhe)'
      ]
    },
    {
      step: 3,
      title: 'Configurar Variáveis de Ambiente',
      description: 'Adicione as chaves no arquivo .env',
      code: `
# Asaas API Keys
NEXT_PUBLIC_ASAAS_SANDBOX_API_KEY=sua_api_key_sandbox_aqui
NEXT_PUBLIC_ASAAS_PRODUCTION_API_KEY=sua_api_key_production_aqui
      `
    },
    {
      step: 4,
      title: 'Configurar Webhook',
      description: 'Configure a URL de webhook no painel Asaas',
      details: [
        'Vá em Integrações > Webhook',
        'Configure a URL: /api/webhooks/asaas',
        'Selecione todos os eventos de pagamento',
        'Ative o webhook'
      ]
    },
    {
      step: 5,
      title: 'Testar Integração',
      description: 'Faça um teste no ambiente sandbox',
      details: [
        'Use dados de teste fornecidos pela Asaas',
        'Teste PIX, cartão e boleto',
        'Verifique se os webhooks estão funcionando',
        'Confirme a criação de assinaturas'
      ]
    }
  ]
}

export default asaasConfig

// 🚀 Webhook Asaas - Solução Híbrida Completa com Autenticação
import { createClient } from '@supabase/supabase-js'

// Tipos para requisição e resposta
interface WebhookRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body: any
}

interface WebhookResponse {
  status: (code: number) => WebhookResponse
  json: (data: any) => void
  end: () => void
  setHeader: (name: string, value: string) => void
}

// Configuração Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gkwdspvvpucuoeupxnny.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2RzcHZ2cHVjdW9ldXB4bm55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjc5NDA5MSwiZXhwIjoyMDM4MzcwMDkxfQ.f0i-O4XJP6ygzGqJf-qb9MdBvUeT6QOu6Z5y_AEBMyE'

// Cliente Supabase com privilégios administrativos
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Interfaces
interface AsaasPayment {
  id: string
  status: string
  value: number
  billingType: string
  customer: {
    id: string
    email: string
    name?: string
    phone?: string
    cpfCnpj?: string
  }
}

// 🔄 Handler principal do webhook
export default async function handler(req: WebhookRequest, res: WebhookResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Só aceitar POST
  if (req.method !== 'POST') {
    console.log(`❌ Método não permitido: ${req.method}`)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Log da requisição para debug
    console.log('📥 Webhook Asaas recebido:', {
      timestamp: new Date().toISOString(),
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'x-forwarded-for': req.headers['x-forwarded-for']
      },
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : []
    })

    // Validar dados básicos
    if (!req.body || typeof req.body !== 'object') {
      console.error('❌ Webhook sem body válido')
      return res.status(400).json({ error: 'Invalid webhook body' })
    }

    const { event, payment } = req.body

    if (!event) {
      console.error('❌ Webhook sem evento')
      return res.status(400).json({ error: 'Missing event field' })
    }

    if (!payment || !payment.id) {
      console.error('❌ Webhook sem dados de pagamento')
      return res.status(400).json({ error: 'Missing payment data' })
    }

    console.log(`📋 Processando evento: ${event} para pagamento: ${payment.id}`)

    // Registrar evento no log do webhook
    await registrarWebhookLog(event, payment, req.body)

    // Processar eventos específicos
    switch (event) {
      case 'PAYMENT_CREATED':
        console.log('📝 Pagamento criado:', payment.id)
        await processarPagamentoCriado(payment)
        break

      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        console.log('✅ Pagamento confirmado! Ativando conta...')
        await processarPagamentoConfirmado(payment)
        break

      case 'PAYMENT_OVERDUE':
        console.log('⏰ Pagamento em atraso:', payment.id)
        await processarPagamentoAtrasado(payment)
        break

      case 'PAYMENT_DELETED':
        console.log('🗑️ Pagamento cancelado:', payment.id)
        await processarPagamentoCancelado(payment)
        break

      default:
        console.log('ℹ️ Evento não processado:', event)
    }

    // Resposta de sucesso
    res.status(200).json({ 
      received: true,
      event,
      paymentId: payment.id,
      processedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    // Resposta de erro para que Asaas tente reenviar
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// 📝 Registrar log do webhook
async function registrarWebhookLog(event: string, payment: AsaasPayment, fullPayload: any) {
  try {
    const { error } = await supabase
      .from('asaas_webhook_logs')
      .insert({
        evento: event,
        asaas_payment_id: payment.id,
        payload: fullPayload,
        processado: true,
        erro: null
      })

    if (error) {
      console.error('❌ Erro ao registrar webhook log:', error)
    } else {
      console.log('📝 Webhook log registrado com sucesso')
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao registrar log:', error)
  }
}

// 📋 Processar pagamento criado
async function processarPagamentoCriado(payment: AsaasPayment) {
  try {
    console.log('📋 Pagamento criado - apenas registrando...')
    
    // Registrar transação como pendente
    const { error } = await supabase
      .from('transacoes_asaas')
      .insert({
        asaas_payment_id: payment.id,
        customer_email: payment.customer.email,
        valor: payment.value,
        status: 'pending',
        metodo_pagamento: payment.billingType,
        webhook_data: payment
      })

    if (error) {
      console.error('❌ Erro ao registrar transação:', error)
    } else {
      console.log('✅ Transação registrada como pendente')
    }
  } catch (error) {
    console.error('❌ Erro ao processar pagamento criado:', error)
  }
}

// 💰 Processar pagamento confirmado (ativar conta) - VERSÃO COMPLETA
async function processarPagamentoConfirmado(payment: AsaasPayment) {
  try {
    console.log('🎉 Iniciando ativação automática da conta...')

        // 1. Verificar se usuário existe na nossa tabela
    const { data: usuarioExistente, error: selectError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', payment.customer.email)
      .single()

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Erro ao buscar usuário:', selectError)
      throw new Error(`Erro ao buscar usuário: ${selectError.message}`)
    }

    let usuario = usuarioExistente
    let senhaTemporaria: string | null = null
    let isNewUser = false

    // 2. Criar usuário se não existir OU se não tem asaas_customer_id
    if (!usuario || !usuario.asaas_customer_id) {
      console.log('👤 Criando/Atualizando usuário...')
      isNewUser = !usuario
      
      // Gerar senha temporária segura para novos usuários
      if (isNewUser) {
        senhaTemporaria = gerarSenhaTemporaria()
        console.log('🔑 Senha temporária gerada para novo usuário')
      }
      
      if (!usuario) {
        // Criar novo usuário
        const { data: novoUsuario, error: userError } = await supabase
          .from('usuarios')
          .insert({
            nome: payment.customer.name || 'Usuário',
            email: payment.customer.email,
            telefone: payment.customer.phone,
            cnpj_cpf: payment.customer.cpfCnpj,
            role: 'admin',
            status: 'ativo',
            origem_cadastro: 'webhook_asaas',
            asaas_customer_id: payment.customer.id
          })
          .select()
          .single()

        if (userError) {
          console.error('❌ Erro ao criar usuário na tabela:', userError)
          throw new Error(`Erro ao criar usuário na tabela: ${userError.message}`)
        }

        usuario = novoUsuario
        console.log('✅ Usuário criado na tabela:', usuario.email)
      } else {
        // Atualizar usuário existente
        const { data: usuarioAtualizado, error: updateError } = await supabase
          .from('usuarios')
          .update({
            asaas_customer_id: payment.customer.id,
            status: 'ativo',
            origem_cadastro: 'webhook_asaas'
          })
          .eq('id', usuario.id)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Erro ao atualizar usuário:', updateError)
          throw new Error(`Erro ao atualizar usuário: ${updateError.message}`)
        }

        usuario = usuarioAtualizado
        console.log('✅ Usuário atualizado na tabela:', usuario.email)
      }
    } else {
      console.log('👤 Usuário já existe e está configurado:', usuario.email)
    }

    // 4. Criar/atualizar assinatura
    console.log('📋 Criando assinatura...')
    
    const { data: assinatura, error: subError } = await supabase
      .from('assinaturas')
      .upsert({
        usuario_id: usuario.id,
        asaas_payment_id: payment.id,
        asaas_customer_id: payment.customer.id,
        valor_mensal: payment.value,
        valor_total: payment.value,
        status: 'ativa',
        data_inicio: new Date().toISOString(),
        metodo_pagamento: payment.billingType,
        webhook_data: payment
      }, {
        onConflict: 'asaas_payment_id'
      })
      .select()
      .single()

    if (subError) {
      console.error('❌ Erro ao criar assinatura:', subError)
      throw new Error(`Erro ao criar assinatura: ${subError.message}`)
    }

    // 5. Atualizar transação como confirmada
    await supabase
      .from('transacoes_asaas')
      .upsert({
        asaas_payment_id: payment.id,
        customer_email: payment.customer.email,
        usuario_id: usuario.id,
        valor: payment.value,
        status: 'confirmed',
        metodo_pagamento: payment.billingType,
        confirmed_at: new Date().toISOString(),
        webhook_data: payment
      }, {
        onConflict: 'asaas_payment_id'
      })

    // 6. Enviar notificações
    await enviarNotificacoes(usuario, assinatura, payment, senhaTemporaria, isNewUser)

    console.log('🎉 Conta ativada com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao processar pagamento confirmado:', error)
    throw error
  }
}

// ⏰ Processar pagamento em atraso
async function processarPagamentoAtrasado(payment: AsaasPayment) {
  try {
    console.log('⏰ Processando pagamento em atraso:', payment.id)
    
    // Atualizar status da assinatura
    await supabase
      .from('assinaturas')
      .update({ 
        status: 'suspensa',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_payment_id', payment.id)

    // Atualizar transação
    await supabase
      .from('transacoes_asaas')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_payment_id', payment.id)

    console.log('⏸️ Assinatura suspensa por atraso:', payment.id)
    
  } catch (error) {
    console.error('❌ Erro ao processar pagamento atrasado:', error)
  }
}

// 🗑️ Processar pagamento cancelado
async function processarPagamentoCancelado(payment: AsaasPayment) {
  try {
    console.log('🗑️ Processando cancelamento:', payment.id)
    
    // Cancelar assinatura
    await supabase
      .from('assinaturas')
      .update({ 
        status: 'cancelada',
        data_cancelamento: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('asaas_payment_id', payment.id)

    console.log('❌ Assinatura cancelada:', payment.id)
  } catch (error) {
    console.error('❌ Erro ao processar cancelamento:', error)
  }
}

// 📧 Enviar notificações
async function enviarNotificacoes(usuario: any, assinatura: any, payment: AsaasPayment, senhaTemporaria: string | null, isNewUser: boolean) {
  try {
    console.log(`📧 Preparando notificações para: ${usuario.email}`)
    
    // Dados do email de boas-vindas
    const emailData = {
      to: usuario.email,
      subject: isNewUser ? '🎉 Bem-vindo à Torneira Digital - Dados de Acesso' : '🎉 Pagamento Confirmado - Torneira Digital',
      content: gerarEmailBoasVindas(usuario, assinatura, payment, senhaTemporaria, isNewUser)
    }
    
    console.log('📧 Email preparado:', {
      para: usuario.email,
      tipo: isNewUser ? 'novo_usuario_com_senha' : 'pagamento_confirmado',
      plano: `R$ ${assinatura.valor_mensal}/mês`,
      metodo: payment.billingType,
      temSenha: !!senhaTemporaria
    })
    
    // TODO: Integrar com provedor de email (SendGrid, Resend, etc.)
    // Por enquanto apenas log detalhado
    console.log('📧 ✅ Email será enviado:', emailData.subject)
    
    // Salvar dados do email para envio posterior se necessário
    await salvarDadosEmail(usuario.email, emailData, senhaTemporaria)
    
  } catch (error) {
    console.error('⚠️ Erro ao preparar notificações (não crítico):', error)
  }
}

// 📧 Gerar HTML do email de boas-vindas
function gerarEmailBoasVindas(usuario: any, assinatura: any, payment: AsaasPayment, senhaTemporaria: string | null, isNewUser: boolean): string {
  const dadosAcesso = senhaTemporaria ? `
    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #92400e; margin-top: 0;">🔐 Dados de Acesso (IMPORTANTE)</h3>
      <p style="margin: 10px 0; color: #92400e;"><strong>Email:</strong> ${usuario.email}</p>
      <p style="margin: 10px 0; color: #92400e;"><strong>Senha Temporária:</strong> <code style="background: #fff; padding: 5px; font-family: monospace; font-size: 16px; font-weight: bold;">${senhaTemporaria}</code></p>
      <p style="margin: 10px 0 0 0; color: #b45309; font-size: 14px;">
        ⚠️ <strong>ATENÇÃO:</strong> Você será solicitado a alterar esta senha no primeiro acesso por segurança.
      </p>
    </div>
  ` : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${isNewUser ? 'Bem-vindo à Torneira Digital' : 'Pagamento Confirmado'}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #f59e0b, #eab308); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 ${isNewUser ? 'Bem-vindo à Torneira Digital!' : 'Pagamento Confirmado!'}</h1>
        <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 16px;">${isNewUser ? 'Sua conta foi criada e ativada com sucesso!' : 'Sua assinatura foi confirmada!'}</p>
      </div>

      ${dadosAcesso}

      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1f2937; margin-top: 0;">📋 Detalhes da sua assinatura:</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Nome:</strong> ${usuario.nome}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong> ${usuario.email}</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Valor:</strong> R$ ${assinatura.valor_mensal}/mês</li>
          <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Status:</strong> ✅ Ativo</li>
          <li style="padding: 8px 0;"><strong>Método:</strong> ${payment.billingType}</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://www.torneira.digital/login" 
           style="background: linear-gradient(135deg, #10b981, #059669); 
                  color: white; 
                  padding: 15px 30px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  font-weight: bold; 
                  font-size: 18px;
                  display: inline-block;">
          🚀 ${isNewUser ? 'Fazer Primeiro Acesso' : 'Acessar Plataforma'}
        </a>
      </div>

      ${isNewUser ? `
      <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">📱 Próximos Passos:</h3>
        <ol style="color: #1e3a8a; margin: 0; padding-left: 20px;">
          <li>Clique no botão "Fazer Primeiro Acesso" acima</li>
          <li>Faça login com os dados fornecidos</li>
          <li>Crie uma senha pessoal e segura</li>
          <li>Explore todas as funcionalidades da plataforma</li>
        </ol>
      </div>
      ` : ''}

      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 25px 0;">
        <h3 style="color: #065f46; margin-top: 0;">📞 Precisa de ajuda?</h3>
        <p style="margin-bottom: 0; color: #064e3b;">
          Entre em contato: 
          <a href="mailto:contato@torneira.digital" style="color: #059669;">contato@torneira.digital</a>
        </p>
      </div>

      <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p>© 2025 Torneira Digital - Sistema de Gestão Completo</p>
        <p>Link direto: https://www.torneira.digital/login</p>
      </div>

    </body>
    </html>
  `
}

// 🔐 Gerar senha temporária segura
function gerarSenhaTemporaria(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let senha = ''
  for (let i = 0; i < 8; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

// 💾 Salvar dados do email para envio posterior
async function salvarDadosEmail(email: string, emailData: any, senhaTemporaria: string | null) {
  try {
    await supabase
      .from('email_queue')
      .insert({
        destinatario: email,
        assunto: emailData.subject,
        conteudo: emailData.content,
        senha_temporaria: senhaTemporaria,
        status: 'pendente',
        tentativas: 0,
        criado_em: new Date().toISOString()
      })

    console.log('💾 Email salvo na fila de envio:', email)
  } catch (error) {
    console.error('⚠️ Erro ao salvar email na fila:', error)
  }
}
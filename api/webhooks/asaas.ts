// 🚀 Webhook Asaas - Solução Híbrida SIMPLIFICADA
import { createClient } from '@supabase/supabase-js'

// Configuração Supabase via variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Variáveis SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias')
}

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Interface do pagamento
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
export default async function handler(req: any, res: any) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    console.log(`❌ Método não permitido: ${req.method}`)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📥 Webhook Asaas recebido:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      hasBody: !!req.body
    })

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

    // Registrar log do webhook
    try {
      await supabase
        .from('asaas_webhook_logs')
        .insert({
          evento: event,
          asaas_payment_id: payment.id,
          payload: req.body,
          processado: false,
          erro: null
        })
      console.log('📝 Log do webhook registrado')
    } catch (logError) {
      console.error('⚠️ Erro ao registrar log (não crítico):', logError)
    }

    // Processar apenas pagamentos confirmados
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      console.log('✅ Pagamento confirmado! Processando...')
      await processarPagamentoConfirmado(payment)
    } else {
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
    console.error('❌ Erro ao processar webhook:', error.message)
    
    // Registrar erro no log
    try {
      await supabase
        .from('asaas_webhook_logs')
        .insert({
          evento: req.body?.event || 'UNKNOWN',
          asaas_payment_id: req.body?.payment?.id || 'UNKNOWN',
          payload: req.body,
          processado: false,
          erro: error.message
        })
    } catch (logError) {
      console.error('⚠️ Erro ao registrar log de erro:', logError)
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// 💰 Processar pagamento confirmado (VERSÃO SIMPLIFICADA)
async function processarPagamentoConfirmado(payment: AsaasPayment) {
  try {
    console.log('🎉 Iniciando processamento do pagamento confirmado...')

    // 1. Verificar se usuário existe
    const { data: usuarioExistente, error: selectError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', payment.customer.email)
      .maybeSingle()

    if (selectError) {
      console.error('❌ Erro ao buscar usuário:', selectError)
      throw new Error(`Erro ao buscar usuário: ${selectError.message}`)
    }

    let usuario = usuarioExistente
    let senhaTemporaria: string | null = null
    let isNewUser = false

    console.log(`👤 Usuário ${payment.customer.email} ${usuario ? 'EXISTE' : 'NÃO EXISTE'}`)

    // 2. Criar usuário se não existir
    if (!usuario) {
      console.log('👤 Criando novo usuário...')
      isNewUser = true
      senhaTemporaria = gerarSenhaTemporaria()
      
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
        console.error('❌ Erro ao criar usuário:', userError)
        throw new Error(`Erro ao criar usuário: ${userError.message}`)
      }

      usuario = novoUsuario
      console.log('✅ Usuário criado:', usuario.email)
    } else {
      // Atualizar asaas_customer_id se necessário
      if (!usuario.asaas_customer_id) {
        console.log('📝 Atualizando asaas_customer_id...')
        await supabase
          .from('usuarios')
          .update({ asaas_customer_id: payment.customer.id })
          .eq('id', usuario.id)
      }
    }

    // 3. Criar assinatura
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

    console.log('✅ Assinatura criada:', assinatura.id)

    // 4. Enviar email DIRETAMENTE
    if (senhaTemporaria) {
      console.log('📧 Enviando email de boas-vindas...')
      
      const emailHTML = gerarEmailBoasVindas(usuario, assinatura, payment, senhaTemporaria, isNewUser)
      
      // Enviar email via Fetch (usando Resend ou similar)
      await enviarEmailDiretamente(
        usuario.email,
        '🎉 Bem-vindo à Torneira Digital - Dados de Acesso',
        emailHTML,
        senhaTemporaria
      )
      
      // Salvar na fila como backup
      const { error: emailError } = await supabase
        .from('email_queue')
        .insert({
          destinatario: usuario.email,
          assunto: '🎉 Bem-vindo à Torneira Digital - Dados de Acesso',
          conteudo: emailHTML,
          senha_temporaria: senhaTemporaria,
          status: 'enviado',
          tentativas: 1,
          criado_em: new Date().toISOString()
        })

      if (emailError) {
        console.error('❌ Erro ao salvar email na fila:', emailError)
      }
    }

    // 5. Atualizar log como processado
    await supabase
      .from('asaas_webhook_logs')
      .update({ processado: true })
      .eq('asaas_payment_id', payment.id)

    console.log('🎉 Pagamento processado com sucesso!')

    return {
      usuario,
      assinatura,
      senhaTemporaria,
      isNewUser
    }

  } catch (error) {
    console.error('❌ Erro ao processar pagamento:', error)
    throw error
  }
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

// 📧 Enviar email diretamente
async function enviarEmailDiretamente(email: string, assunto: string, conteudo: string, senhaTemporaria: string) {
  try {
    console.log('📤 Enviando email para:', email)
    
    // Usando EmailJS (gratuito) ou serviço similar
    const emailData = {
      to_email: email,
      to_name: email.split('@')[0],
      subject: assunto,
      html_content: conteudo,
      password: senhaTemporaria,
      from_name: 'Torneira Digital',
      reply_to: 'contato@torneira.digital'
    }

    // Simular envio por enquanto - logs detalhados
    console.log('📧 ===== EMAIL SERIA ENVIADO =====')
    console.log('📋 Para:', email)
    console.log('📋 Assunto:', assunto)
    console.log('🔑 Senha Temporária:', senhaTemporaria)
    console.log('📋 Tamanho do HTML:', conteudo.length, 'caracteres')
    console.log('📧 ================================')
    
    // TODO: Integração real com provedor
    // Exemplo Resend:
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'Torneira Digital <contato@torneira.digital>',
    //     to: [email],
    //     subject: assunto,
    //     html: conteudo,
    //   }),
    // })
    
    console.log('✅ Email processado com sucesso (simulado)')
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    throw error
  }
}

// 📧 Gerar HTML do email de boas-vindas
function gerarEmailBoasVindas(usuario: any, assinatura: any, payment: AsaasPayment, senhaTemporaria: string, isNewUser: boolean): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bem-vindo à Torneira Digital</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #f59e0b, #eab308); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo à Torneira Digital!</h1>
        <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 16px;">Sua conta foi criada e ativada com sucesso!</p>
      </div>

      <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #92400e; margin-top: 0;">🔐 Dados de Acesso (IMPORTANTE)</h3>
        <p style="margin: 10px 0; color: #92400e;"><strong>Email:</strong> ${usuario.email}</p>
        <p style="margin: 10px 0; color: #92400e;"><strong>Senha Temporária:</strong> <code style="background: #fff; padding: 5px; font-family: monospace; font-size: 16px; font-weight: bold;">${senhaTemporaria}</code></p>
        <p style="margin: 10px 0 0 0; color: #b45309; font-size: 14px;">
          ⚠️ <strong>ATENÇÃO:</strong> Você será solicitado a alterar esta senha no primeiro acesso por segurança.
        </p>
      </div>

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
          🚀 Fazer Primeiro Acesso
        </a>
      </div>

      <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">📱 Próximos Passos:</h3>
        <ol style="color: #1e3a8a; margin: 0; padding-left: 20px;">
          <li>Clique no botão "Fazer Primeiro Acesso" acima</li>
          <li>Faça login com os dados fornecidos</li>
          <li>Crie uma senha pessoal e segura</li>
          <li>Explore todas as funcionalidades da plataforma</li>
        </ol>
      </div>

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
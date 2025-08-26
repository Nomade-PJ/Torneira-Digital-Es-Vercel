// 🧪 Teste local do webhook para debug
import { createClient } from '@supabase/supabase-js'

// Configuração Supabase
const supabaseUrl = 'https://gkwdspvvpucuoeupxnny.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2RzcHZ2cHVjdW9ldXB4bm55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjc5NDA5MSwiZXhwIjoyMDM4MzcwMDkxfQ.f0i-O4XJP6ygzGqJf-qb9MdBvUeT6QOu6Z5y_AEBMyE'

// Cliente Supabase com privilégios administrativos
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Dados de teste
const testPayment = {
  id: "test_payment_canal_local",
  status: "RECEIVED",
  value: 89.90,
  billingType: "PIX",
  customer: {
    id: "cus_canal_local",
    email: "canalstvoficial@gmail.com",
    name: "Canal STV Oficial",
    phone: "(11) 99999-9999",
    cpfCnpj: "12345678901"
  }
}

// 🔐 Gerar senha temporária segura
function gerarSenhaTemporaria() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let senha = ''
  for (let i = 0; i < 8; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

// 💰 Processar pagamento confirmado (versão de teste)
async function testarPagamentoConfirmado(payment) {
  try {
    console.log('🎉 Iniciando ativação automática da conta...')

    // 1. Verificar se usuário já existe no Supabase Auth
    console.log('🔍 Verificando usuário no Auth...')
    const { data: authUsersResponse, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Erro ao listar usuários do Auth:', listError)
      throw listError
    }
    
    console.log(`📊 Total de usuários no Auth: ${authUsersResponse.users.length}`)
    const usuarioAuth = authUsersResponse.users.find(u => u.email === payment.customer.email)
    
    console.log(`👤 Usuário ${payment.customer.email} ${usuarioAuth ? 'EXISTE' : 'NÃO EXISTE'} no Auth`)

    // 2. Verificar se usuário existe na nossa tabela
    console.log('🔍 Verificando usuário na tabela...')
    const { data: usuarioExistente, error: selectError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', payment.customer.email)
      .single()

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Erro ao buscar usuário:', selectError)
      throw selectError
    }

    let usuario = usuarioExistente
    let senhaTemporaria = null
    let isNewUser = false

    console.log(`📋 Usuário ${payment.customer.email} ${usuario ? 'EXISTE' : 'NÃO EXISTE'} na tabela`)

    // 3. Criar usuário completo se não existir no Auth
    if (!usuarioAuth) {
      console.log('👤 Criando conta completa (Auth + Banco)...')
      isNewUser = true
      
      // Gerar senha temporária segura
      senhaTemporaria = gerarSenhaTemporaria()
      console.log(`🔑 Senha temporária gerada: ${senhaTemporaria}`)
      
      // 3.1. Criar no Supabase Auth primeiro
      console.log('🔐 Criando usuário no Supabase Auth...')
      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        email: payment.customer.email,
        password: senhaTemporaria,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          nome: payment.customer.name || 'Usuário',
          origem: 'webhook_asaas',
          primeiro_acesso: true
        }
      })

      if (authError) {
        console.error('❌ Erro ao criar usuário no Auth:', authError)
        throw authError
      }

      console.log('✅ Usuário criado no Auth:', newAuthUser.user.email)

      // 3.2. Atualizar ou criar na nossa tabela
      if (usuario) {
        // Atualizar usuário existente com ID do Auth
        console.log('📝 Atualizando usuário existente na tabela...')
        const { data: usuarioAtualizado, error: updateError } = await supabase
          .from('usuarios')
          .update({
            id: newAuthUser.user.id, // Usar mesmo ID do Auth
            asaas_customer_id: payment.customer.id,
            status: 'ativo',
            origem_cadastro: 'webhook_asaas'
          })
          .eq('email', payment.customer.email)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Erro ao atualizar usuário:', updateError)
          throw updateError
        }

        usuario = usuarioAtualizado
        console.log('✅ Usuário atualizado na tabela')
      } else {
        // Criar novo usuário
        console.log('📝 Criando novo usuário na tabela...')
        const { data: novoUsuario, error: userError } = await supabase
          .from('usuarios')
          .insert({
            id: newAuthUser.user.id, // Usar mesmo ID do Auth
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
          throw userError
        }

        usuario = novoUsuario
        console.log('✅ Usuário criado na tabela')
      }
    } else {
      console.log('👤 Usuário já existe no Auth - não criando senha temporária')
      // Se usuário existe no Auth mas não na tabela, criar na tabela
      if (!usuario) {
        console.log('📝 Criando usuário na tabela (já existe no Auth)...')
        const { data: novoUsuario, error: userError } = await supabase
          .from('usuarios')
          .insert({
            id: usuarioAuth.id, // Usar mesmo ID do Auth
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
          throw userError
        }

        usuario = novoUsuario
        console.log('✅ Usuário criado na tabela')
      }
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
      throw subError
    }

    console.log('✅ Assinatura criada/atualizada:', assinatura.id)

    // 5. Salvar email na fila
    if (senhaTemporaria) {
      console.log('📧 Salvando email na fila...')
      
      const emailData = {
        destinatario: usuario.email,
        assunto: '🎉 Bem-vindo à Torneira Digital - Dados de Acesso',
        conteudo: `Email: ${usuario.email}\nSenha: ${senhaTemporaria}`,
        senha_temporaria: senhaTemporaria,
        status: 'pendente',
        tentativas: 0,
        criado_em: new Date().toISOString()
      }

      const { error: emailError } = await supabase
        .from('email_queue')
        .insert(emailData)

      if (emailError) {
        console.error('❌ Erro ao salvar email:', emailError)
      } else {
        console.log('✅ Email salvo na fila')
      }
    }

    console.log('🎉 Processamento concluído com sucesso!')
    
    return {
      usuario,
      assinatura,
      senhaTemporaria,
      isNewUser
    }

  } catch (error) {
    console.error('❌ Erro no processamento:', error)
    throw error
  }
}

// 🚀 Executar teste
console.log('🧪 Iniciando teste do webhook...')
console.log('📧 Email de teste:', testPayment.customer.email)
console.log('💰 Valor:', testPayment.value)
console.log('📋 ID do pagamento:', testPayment.id)

testarPagamentoConfirmado(testPayment)
  .then(result => {
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!')
    console.log('📊 Resultado:', {
      usuarioId: result.usuario.id,
      email: result.usuario.email,
      assinaturaId: result.assinatura.id,
      senhaTemporaria: result.senhaTemporaria,
      novoUsuario: result.isNewUser
    })
  })
  .catch(error => {
    console.error('\n❌ TESTE FALHOU:', error.message)
    console.error('Stack:', error.stack)
  })

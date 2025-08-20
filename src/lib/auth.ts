import { supabase } from "./supabase"

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  nomeEstabelecimento: string
  cnpjCpf: string
  telefone?: string
  planoId?: string
}

export const authService = {
  // Login
  async signIn({ email, password }: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Se for erro de email não confirmado, tentar confirmar automaticamente
        if (error.message.includes('Email not confirmed')) {
          console.log("📧 Email não confirmado, tentando confirmar automaticamente...")
          
          // Em desenvolvimento, vamos permitir login mesmo sem confirmação
          // Isso é temporário até configurarmos corretamente o Supabase
          throw new Error("Email não confirmado. Execute o SQL de confirmação no Supabase primeiro.")
        }
        throw error
      }

      // Login realizado com sucesso
      return data
    } catch (error) {
      console.error("❌ Erro no signIn:", error)
      throw error
    }
  },

  // Registro
  async signUp({ email, password, nomeEstabelecimento, cnpjCpf, telefone, planoId }: RegisterCredentials) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app/vendas`,
          data: {
            nome_estabelecimento: nomeEstabelecimento,
            cnpj_cpf: cnpjCpf,
            telefone: telefone,
            plano_id: planoId
          }
        }
      })

      if (error) {
        // Se o usuário já existe, mostrar mensagem mais específica
        if (error.message.includes('already exists') || 
            error.message.includes('already registered') || 
            error.message.includes('User already registered') ||
            error.message.includes('already been registered') ||
            error.code === 'user_already_exists') {
          throw new Error(`Este email (${email}) já está registrado. Faça login em vez de criar uma nova conta.`)
        }
        throw error
      }

      if (!data.user) {
        throw new Error("Falha na criação do usuário - dados inválidos retornados")
      }

      // Aguardar um pouco para o trigger automático processar
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Verificar se o perfil foi criado pelo trigger, se não, criar manualmente
      try {
        const { error: checkError } = await supabase
          .from("usuarios")
          .select("id")
          .eq("id", data.user.id)
          .single()

        // Se não existe, criar manualmente (fallback se o trigger falhar)
        if (checkError && checkError.code === 'PGRST116') {
          console.log("🔄 Perfil não criado pelo trigger, criando manualmente...")
          
          // Buscar informações do plano para configurar teste e assinatura
          let temTesteGratis = false
          let duracaoMeses = 1
          
          if (planoId) {
            const { data: planoData } = await supabase
              .from('planos')
              .select('duracao_meses, tem_teste_gratis, nome')
              .eq('id', planoId)
              .single()
            
            if (planoData) {
              duracaoMeses = planoData.duracao_meses
              temTesteGratis = planoData.tem_teste_gratis
            }
          }

          // Calcular datas baseado se tem teste grátis ou não
          const agora = new Date()
          let dataAssinatura = new Date(agora)
          let dataVencimento = new Date(agora)
          let dadosUsuario: any = {
            id: data.user.id,
            nome: nomeEstabelecimento,
            email: email,
            nome_estabelecimento: nomeEstabelecimento,
            cnpj_cpf: cnpjCpf,
            telefone: telefone,
            plano_id: planoId
          }

          if (temTesteGratis) {
            // Plano com teste grátis (apenas mensal)
            const dataFimTeste = new Date(agora)
            dataFimTeste.setDate(dataFimTeste.getDate() + 7) // 7 dias de teste
            
            dataAssinatura = new Date(dataFimTeste) // Assinatura começa após o teste
            dataVencimento = new Date(dataAssinatura)
            dataVencimento.setMonth(dataVencimento.getMonth() + duracaoMeses)

            dadosUsuario = {
              ...dadosUsuario,
              data_inicio_teste: agora.toISOString(),
              data_fim_teste: dataFimTeste.toISOString(),
              em_periodo_teste: true,
              data_assinatura: dataAssinatura.toISOString(),
              data_vencimento: dataVencimento.toISOString(),
              status_assinatura: 'teste'
            }
          } else {
            // Plano sem teste grátis (semestral e anual)
            dataVencimento.setMonth(dataVencimento.getMonth() + duracaoMeses)

            dadosUsuario = {
              ...dadosUsuario,
              data_inicio_teste: null,
              data_fim_teste: null,
              em_periodo_teste: false,
              data_assinatura: dataAssinatura.toISOString(),
              data_vencimento: dataVencimento.toISOString(),
              status_assinatura: 'ativa'
            }
          }
          
          const { error: profileError } = await supabase
            .from("usuarios")
            .insert(dadosUsuario)

          if (profileError) {
            console.error("❌ Erro ao criar perfil manual:", profileError)
            throw new Error("Erro ao criar perfil do usuário. Tente novamente.")
          } else {
            console.log("✅ Perfil criado manualmente com sucesso")
          }
        } else if (!checkError) {
          // Perfil existe, mas precisa atualizar com o plano
          if (planoId) {
            // Buscar informações do plano
            const { data: planoData } = await supabase
              .from('planos')
              .select('duracao_meses, tem_teste_gratis')
              .eq('id', planoId)
              .single()

            if (planoData) {
              const agora = new Date()
              let dataAssinatura = new Date(agora)
              let dataVencimento = new Date(agora)
              let dadosUpdate: any = { plano_id: planoId }

              if (planoData.tem_teste_gratis) {
                // Plano com teste grátis
                const dataFimTeste = new Date(agora)
                dataFimTeste.setDate(dataFimTeste.getDate() + 7)
                
                dataAssinatura = new Date(dataFimTeste)
                dataVencimento = new Date(dataAssinatura)
                dataVencimento.setMonth(dataVencimento.getMonth() + planoData.duracao_meses)

                dadosUpdate = {
                  ...dadosUpdate,
                  data_inicio_teste: agora.toISOString(),
                  data_fim_teste: dataFimTeste.toISOString(),
                  em_periodo_teste: true,
                  data_assinatura: dataAssinatura.toISOString(),
                  data_vencimento: dataVencimento.toISOString(),
                  status_assinatura: 'teste'
                }
              } else {
                // Plano sem teste grátis
                dataVencimento.setMonth(dataVencimento.getMonth() + planoData.duracao_meses)

                dadosUpdate = {
                  ...dadosUpdate,
                  data_inicio_teste: null,
                  data_fim_teste: null,
                  em_periodo_teste: false,
                  data_assinatura: dataAssinatura.toISOString(),
                  data_vencimento: dataVencimento.toISOString(),
                  status_assinatura: 'ativa'
                }
              }

              await supabase
                .from("usuarios")
                .update(dadosUpdate)
                .eq('id', data.user.id)
            }
          }
          console.log("✅ Perfil já existe (criado pelo trigger)")
        }
      } catch (profileError) {
        console.warn("⚠️ Aviso: erro ao verificar/criar perfil, mas usuário foi criado:", profileError)
      }

      return data
    } catch (error: any) {
      throw error
    }
  },

  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Recuperar senha
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
  },

  // Obter usuário atual
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Obter sessão atual
  async getCurrentSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  // Criar perfil do usuário se não existir
  async ensureUserProfile(user: any, additionalData?: Partial<RegisterCredentials>) {
    if (!user?.id) return

    // Verificar se o perfil já existe
    const { data: existingProfile } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!existingProfile && additionalData) {
      // Criar perfil se não existir e temos dados adicionais
      const { error } = await supabase.from("usuarios").insert({
        id: user.id,
        email: user.email,
        nome_estabelecimento: additionalData.nomeEstabelecimento || "Estabelecimento",
        cnpj_cpf: additionalData.cnpjCpf || "00000000000",
        telefone: additionalData.telefone
      })

      if (error) {
        console.error("Erro ao criar perfil do usuário:", error)
      }
    }
  },

  // Confirmar email automaticamente (apenas para desenvolvimento)
  async confirmEmail(token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    })
    
    if (error) throw error
    return data
  },

  // Login sem verificação de email (para desenvolvimento)
  async signInWithoutEmailVerification({ email, password }: LoginCredentials) {
    try {
      // Tentar login normal primeiro
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Se o erro for de email não confirmado, podemos lidar de forma especial
        if (error.message.includes('Email not confirmed')) {
          console.warn('Email não confirmado, mas permitindo login para desenvolvimento')
          // Em produção, você removeria este workaround
        }
        throw error
      }

      return data
    } catch (error) {
      throw error
    }
  },
}

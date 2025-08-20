import { supabase } from './supabase'

export interface NotificationConfig {
  notificacao_estoque_baixo: boolean
  notificacao_email: boolean
  backup_automatico: boolean
  estoque_minimo_padrao: number
  alerta_estoque_critico: number
  email_contato: string
}

export interface ProdutoEstoque {
  id: string
  nome: string
  marca?: string
  estoque_atual: number
  estoque_minimo: number
  categoria: string
}

export const notificationService = {
  // Verificar produtos com estoque baixo
  async verificarEstoqueBaixo(userId: string): Promise<ProdutoEstoque[]> {
    try {
      const { data: produtos, error } = await supabase
        .from('produtos')
        .select('id, nome, marca, estoque_atual, estoque_minimo, categoria')
        .eq('usuario_id', userId)
        .eq('ativo', true)

      if (error) throw error

      // Filtrar produtos com estoque baixo
      const produtosBaixo = produtos?.filter(produto => 
        produto.estoque_atual <= produto.estoque_minimo
      ) || []

      return produtosBaixo
    } catch (error) {
      console.error('Erro ao verificar estoque baixo:', error)
      return []
    }
  },

  // Verificar produtos com estoque crítico
  async verificarEstoqueCritico(userId: string, alertaCritico: number = 5): Promise<ProdutoEstoque[]> {
    try {
      const { data: produtos, error } = await supabase
        .from('produtos')
        .select('id, nome, marca, estoque_atual, estoque_minimo, categoria')
        .eq('usuario_id', userId)
        .eq('ativo', true)

      if (error) throw error

      // Filtrar produtos com estoque crítico
      const produtosCriticos = produtos?.filter(produto => 
        produto.estoque_atual <= alertaCritico
      ) || []

      return produtosCriticos
    } catch (error) {
      console.error('Erro ao verificar estoque crítico:', error)
      return []
    }
  },

  // Enviar notificação por email (simulação)
  async enviarNotificacaoEmail(
    emailDestino: string, 
    assunto: string, 
    conteudo: string
  ): Promise<boolean> {
    try {
      console.log('📧 Enviando email de notificação...')
      console.log('Para:', emailDestino)
      console.log('Assunto:', assunto)
      console.log('Conteúdo:', conteudo)

      // Aqui seria implementada a integração com um serviço de email real
      // Por exemplo: SendGrid, AWS SES, Nodemailer, etc.
      
      // Simulação de envio
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ Email enviado com sucesso')
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error)
      return false
    }
  },

  // Gerar relatório de estoque baixo
  gerarRelatorioEstoqueBaixo(produtos: ProdutoEstoque[]): string {
    if (produtos.length === 0) {
      return 'Nenhum produto com estoque baixo encontrado.'
    }

    let relatorio = `ALERTA: ${produtos.length} produto(s) com estoque baixo:\n\n`
    
    produtos.forEach(produto => {
      relatorio += `• ${produto.nome} (${produto.marca || 'Sem marca'})\n`
      relatorio += `  Categoria: ${produto.categoria}\n`
      relatorio += `  Estoque atual: ${produto.estoque_atual}\n`
      relatorio += `  Estoque mínimo: ${produto.estoque_minimo}\n\n`
    })

    relatorio += `\nVerifique o estoque e faça a reposição necessária.\n`
    relatorio += `Data/Hora: ${new Date().toLocaleString('pt-BR')}`

    return relatorio
  },

  // Executar backup automático (simulação)
  async executarBackupAutomatico(userId: string): Promise<boolean> {
    try {
      console.log('💾 Iniciando backup automático...')
      
      // Buscar dados para backup
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('*')
        .eq('usuario_id', userId)

      if (produtosError) throw produtosError

      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('*')
        .eq('usuario_id', userId)
        .gte('data_venda', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 30 dias

      if (vendasError) throw vendasError

      const { data: configuracoes, error: configError } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('usuario_id', userId)

      if (configError) throw configError

      // Criar dados de backup
      const backupData = {
        data_backup: new Date().toISOString(),
        versao: '1.0',
        produtos: produtos || [],
        vendas: vendas || [],
        configuracoes: configuracoes?.[0] || null,
        total_produtos: produtos?.length || 0,
        total_vendas: vendas?.length || 0
      }

      // Simular salvamento do backup
      console.log('📦 Backup gerado:', {
        produtos: backupData.total_produtos,
        vendas: backupData.total_vendas,
        tamanho: JSON.stringify(backupData).length + ' bytes'
      })

      // Em uma implementação real, aqui seria salvo em cloud storage
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('✅ Backup automático concluído')
      return true
    } catch (error) {
      console.error('❌ Erro no backup automático:', error)
      return false
    }
  },

  // Verificar e executar notificações
  async executarVerificacoes(userId: string, config: NotificationConfig): Promise<void> {
    try {
      console.log('🔔 Executando verificações de notificação...')

      // Verificar estoque baixo se habilitado
      if (config.notificacao_estoque_baixo) {
        const produtosBaixo = await this.verificarEstoqueBaixo(userId)
        const produtosCriticos = await this.verificarEstoqueCritico(userId, config.alerta_estoque_critico)

        if (produtosBaixo.length > 0 || produtosCriticos.length > 0) {
          console.log(`⚠️ Encontrados ${produtosBaixo.length} produtos com estoque baixo e ${produtosCriticos.length} críticos`)

          // Enviar email se habilitado
          if (config.notificacao_email && config.email_contato) {
            const todosProdutos = [...produtosCriticos, ...produtosBaixo.filter(p => !produtosCriticos.find(c => c.id === p.id))]
            const relatorio = this.gerarRelatorioEstoqueBaixo(todosProdutos)
            
            await this.enviarNotificacaoEmail(
              config.email_contato,
              'ALERTA: Produtos com Estoque Baixo - Torneira Digital',
              relatorio
            )
          }
        }
      }

      // Executar backup automático se habilitado
      if (config.backup_automatico) {
        await this.executarBackupAutomatico(userId)
      }

      console.log('✅ Verificações de notificação concluídas')
    } catch (error) {
      console.error('❌ Erro nas verificações de notificação:', error)
    }
  }
}

// Função para inicializar verificações periódicas
export function iniciarVerificacoesPeriodicas(userId: string, config: NotificationConfig) {
  // Verificar a cada 30 minutos
  const intervalo = setInterval(async () => {
    await notificationService.executarVerificacoes(userId, config)
  }, 30 * 60 * 1000) // 30 minutos

  // Executar uma verificação inicial após 5 segundos
  setTimeout(() => {
    notificationService.executarVerificacoes(userId, config)
  }, 5000)

  return intervalo
}

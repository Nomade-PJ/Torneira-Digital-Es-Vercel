// Serviço para gerenciar WhatsApp e notificações do teste gratuito
import { supabase } from './supabase'
import { WhatsAppAPI } from './whatsapp-api'

export interface PlanoInfo {
  modalidade: 'mensal' | 'semestral' | 'anual'
  preco: number
  precoTotal?: number
  economia?: string
  temTeste: boolean
}

export interface WhatsAppSolicitacao {
  id: string
  whatsapp: string
  modalidade: 'mensal' | 'semestral' | 'anual'
  preco_mensal: number
  preco_total?: number
  desconto_percentual?: number
  economia?: string
  tem_teste_gratis: boolean
  data_inicio_teste?: string
  data_fim_teste?: string
  notificacao_enviada: boolean
  pix_gerado: boolean
  codigo_pix?: string
  status: 'pendente' | 'confirmada' | 'expirada' | 'cancelada'
  mensagem_enviada: boolean
  data_mensagem?: string
  dados_plano?: any
  created_at: string
  updated_at: string
}

export class WhatsAppService {
  
  // Gerar mensagem de confirmação do plano
  static gerarMensagemConfirmacao(plano: PlanoInfo, _whatsapp: string): string {
    const agora = new Date()
    const inicioTeste = agora.toLocaleDateString('pt-BR')
    const fimTeste = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    
    const formatarPreco = (valor: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

    let mensagem = `🚀 *Torneira Digital - Confirmação de Plano*\n\n`
    mensagem += `Olá! Você selecionou o plano *${plano.modalidade.charAt(0).toUpperCase() + plano.modalidade.slice(1)}*\n\n`
    
    mensagem += `💰 *Valor:* ${formatarPreco(plano.preco)}/mês\n`
    
    if (plano.precoTotal) {
      mensagem += `💳 *Total do período:* ${formatarPreco(plano.precoTotal)}\n`
    }
    
    if (plano.economia) {
      mensagem += `🎯 *Economia:* ${plano.economia}\n`
    }
    
    if (plano.temTeste) {
      mensagem += `\n🎁 *TESTE GRÁTIS DE 7 DIAS*\n`
      mensagem += `📅 *Início:* ${inicioTeste}\n`
      mensagem += `📅 *Fim:* ${fimTeste}\n\n`
      mensagem += `⚠️ *Importante:* 1 dia antes do fim do teste gratuito, enviaremos o código PIX e QR Code para pagamento.\n\n`
    }
    
    mensagem += `✅ *Todas as funcionalidades incluídas:*\n`
    mensagem += `• Sistema completo de vendas\n`
    mensagem += `• Controle total de estoque\n`
    mensagem += `• Gestão de comandas e mesas\n`
    mensagem += `• Relatórios avançados (365 dias)\n`
    mensagem += `• Dashboard executivo completo\n`
    mensagem += `• Usuários ilimitados\n`
    mensagem += `• Backup automático diário\n`
    mensagem += `• Suporte premium 24/7\n`
    mensagem += `• API para integrações\n`
    mensagem += `• E muito mais!\n\n`
    
    mensagem += `Para continuar, clique no link que será enviado em seguida para finalizar seu cadastro.\n\n`
    mensagem += `Qualquer dúvida, é só responder esta mensagem! 😊`
    
    return mensagem
  }

  // Salvar solicitação no banco de dados
  static async salvarSolicitacao(whatsapp: string, plano: PlanoInfo): Promise<WhatsAppSolicitacao> {
    const agora = new Date()
    const fimTeste = plano.temTeste ? new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000) : null
    
    const dados = {
      whatsapp: whatsapp.replace(/\D/g, ''), // Apenas números
      modalidade: plano.modalidade,
      preco_mensal: plano.preco,
      preco_total: plano.precoTotal || null,
      desconto_percentual: plano.modalidade === 'semestral' ? 11 : plano.modalidade === 'anual' ? 22 : null,
      economia: plano.economia || null,
      tem_teste_gratis: plano.temTeste,
      data_inicio_teste: plano.temTeste ? agora.toISOString() : null,
      data_fim_teste: fimTeste ? fimTeste.toISOString() : null,
      notificacao_enviada: false,
      pix_gerado: false,
      status: 'pendente' as const,
      mensagem_enviada: false,
      dados_plano: {
        plano_original: plano,
        timestamp: agora.toISOString()
      }
    }
    
    const { data: solicitacao, error } = await supabase
      .from('whatsapp_solicitacoes')
      .insert(dados)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao salvar solicitação:', error)
      throw new Error('Falha ao salvar solicitação no banco de dados')
    }
    
    // Se tem teste gratuito, agendar notificação
    if (plano.temTeste && fimTeste) {
      this.agendarNotificacaoTeste(solicitacao)
    }
    
    return solicitacao
  }

  // Agendar notificação do teste
  private static agendarNotificacaoTeste(solicitacao: WhatsAppSolicitacao) {
    if (!solicitacao.data_fim_teste) return
    
    const agora = new Date()
    const fimTeste = new Date(solicitacao.data_fim_teste)
    const dataNotificacao = new Date(fimTeste.getTime() - 24 * 60 * 60 * 1000) // 1 dia antes
    const tempoParaNotificacao = dataNotificacao.getTime() - agora.getTime()
    
    // Se já passou da data de notificação, enviar imediatamente
    if (tempoParaNotificacao <= 0) {
      this.enviarNotificacaoFimTeste(solicitacao.id)
      return
    }
    
    // Agendar para o tempo correto
    setTimeout(() => {
      this.enviarNotificacaoFimTeste(solicitacao.id)
    }, tempoParaNotificacao)
  }

  // Enviar notificação do fim do teste
  private static async enviarNotificacaoFimTeste(solicitacaoId: string) {
    try {
      // Buscar solicitação no banco
      const { data: solicitacao, error } = await supabase
        .from('whatsapp_solicitacoes')
        .select('*')
        .eq('id', solicitacaoId)
        .single()
      
      if (error || !solicitacao || solicitacao.notificacao_enviada) {
        console.log('Notificação já enviada ou solicitação não encontrada')
        return
      }
      
      // Gerar código PIX
      const codigoPix = this.gerarCodigoPix(solicitacao)
      
      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('whatsapp_solicitacoes')
        .update({
          codigo_pix: codigoPix,
          pix_gerado: true,
          notificacao_enviada: true,
          status: 'confirmada'
        })
        .eq('id', solicitacaoId)
      
      if (updateError) {
        console.error('Erro ao atualizar solicitação:', updateError)
        return
      }
      
      // Gerar e enviar mensagem
      const mensagem = this.gerarMensagemFimTeste(solicitacao, codigoPix)
      
      // Simular envio da mensagem (em produção seria integração real com WhatsApp)
      console.log(`📱 Enviando notificação PIX para ${solicitacao.whatsapp}:`)
      console.log(mensagem)
      
      // Notificar sistema
      this.notificarSistema(solicitacao)
      
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
    }
  }

  // Gerar mensagem do fim do teste
  private static gerarMensagemFimTeste(solicitacao: WhatsAppSolicitacao, codigoPix: string): string {
    const formatarPreco = (valor: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    
    let mensagem = `⏰ *Teste Gratuito Finalizando*\n\n`
    mensagem += `Olá! Seu teste gratuito do *Torneira Digital* termina amanhã (${amanha}).\n\n`
    
    mensagem += `🎯 *Seu Plano Escolhido:*\n`
    mensagem += `• *Modalidade:* ${solicitacao.modalidade.charAt(0).toUpperCase() + solicitacao.modalidade.slice(1)}\n`
    mensagem += `• *Valor:* ${formatarPreco(solicitacao.preco_mensal)}/mês\n`
    
    if (solicitacao.preco_total) {
      mensagem += `• *Total do período:* ${formatarPreco(solicitacao.preco_total)}\n`
    }
    
    if (solicitacao.economia) {
      mensagem += `• *Economia:* ${solicitacao.economia}\n`
    }
    
    mensagem += `\n💳 *Código PIX para Pagamento:*\n`
    mensagem += `\`${codigoPix}\`\n\n`
    
    mensagem += `📱 *QR Code:* (seria gerado aqui)\n\n`
    
    mensagem += `⚠️ *Para continuar usando:*\n`
    mensagem += `1. Faça o pagamento via PIX até amanhã\n`
    mensagem += `2. Envie o comprovante neste chat\n`
    mensagem += `3. Seu acesso será liberado automaticamente\n\n`
    
    mensagem += `❓ *Dúvidas?* Responda esta mensagem!\n`
    mensagem += `🔄 *Cancelar?* Digite "CANCELAR" para encerrar.\n\n`
    
    mensagem += `Obrigado por testar o *Torneira Digital*! 🚀`
    
    return mensagem
  }

  // Gerar código PIX
  private static gerarCodigoPix(solicitacao: WhatsAppSolicitacao): string {
    // Em produção seria integração real com gateway de pagamento
    const valor = solicitacao.preco_total || solicitacao.preco_mensal
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substr(2, 8)
    
    return `PIX${timestamp}${random}VAL${valor.toString().replace('.', '')}`.toUpperCase()
  }

  // Notificar sistema interno
  private static notificarSistema(solicitacao: WhatsAppSolicitacao) {
    // Aqui você pode integrar com o sistema de notificações do app
    // Por exemplo, mostrar um toast para admins, enviar email, etc.
    
    const evento = {
      tipo: 'teste_finalizando',
      solicitacao,
      timestamp: new Date()
    }
    
    // Simular evento do sistema
    console.log('🔔 Evento do sistema:', evento)
  }

  // Verificar testes que estão finalizando (para executar manualmente)
  static async verificarTestesFinalizando(): Promise<WhatsAppSolicitacao[]> {
    const agora = new Date()
    const umDiaDepois = new Date(agora.getTime() + 24 * 60 * 60 * 1000)
    
    const { data: solicitacoes, error } = await supabase
      .from('whatsapp_solicitacoes')
      .select('*')
      .eq('tem_teste_gratis', true)
      .eq('notificacao_enviada', false)
      .gte('data_fim_teste', agora.toISOString())
      .lte('data_fim_teste', umDiaDepois.toISOString())
    
    if (error) {
      console.error('Erro ao verificar testes finalizando:', error)
      return []
    }
    
    return solicitacoes || []
  }

  // Listar todos os testes ativos
  static async listarTestesAtivos(): Promise<WhatsAppSolicitacao[]> {
    const agora = new Date()
    
    const { data: solicitacoes, error } = await supabase
      .from('whatsapp_solicitacoes')
      .select('*')
      .eq('tem_teste_gratis', true)
      .gte('data_fim_teste', agora.toISOString())
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao listar testes ativos:', error)
      return []
    }
    
    return solicitacoes || []
  }

  // Validar número de WhatsApp
  static validarWhatsApp(numero: string): boolean {
    const numeroLimpo = numero.replace(/\D/g, '')
    
    // Deve ter 11 dígitos (DDD + 9 + 8 dígitos)
    if (numeroLimpo.length !== 11) return false
    
    // Deve começar com DDD válido (11-99)
    const ddd = parseInt(numeroLimpo.slice(0, 2))
    if (ddd < 11 || ddd > 99) return false
    
    // O terceiro dígito deve ser 9 (celular)
    if (numeroLimpo[2] !== '9') return false
    
    return true
  }

  // Formatar número de WhatsApp
  static formatarWhatsApp(numero: string): string {
    const numeroLimpo = numero.replace(/\D/g, '')
    
    if (numeroLimpo.length <= 11) {
      return numeroLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    
    return numeroLimpo.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  // Marcar mensagem como enviada no banco
  static async marcarMensagemEnviada(whatsapp: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_solicitacoes')
        .update({
          mensagem_enviada: true,
          data_mensagem: new Date().toISOString(),
          status: 'confirmada'
        })
        .eq('whatsapp', whatsapp.replace(/\D/g, ''))
        .eq('status', 'pendente')
      
      if (error) {
        console.error('Erro ao marcar mensagem como enviada:', error)
      }
    } catch (error) {
      console.error('Erro ao atualizar status da mensagem:', error)
    }
  }

  // Enviar mensagem real via API do WhatsApp
  static async enviarMensagem(whatsapp: string, mensagem: string): Promise<boolean> {
    try {
      console.log(`🚀 INICIANDO ENVIO PARA WHATSAPP: ${whatsapp}`)
      
      // Para seu número específico, tentar envio real
      if (whatsapp === '98992022352' || whatsapp === '5598992022352') {
        console.log('🎯 DETECTADO SEU NÚMERO - TENTANDO ENVIO REAL!')
        
        // Tentar envio via API real
        const resultado = await WhatsAppAPI.enviarMensagem(mensagem)
        
        if (resultado.success) {
          console.log('✅ SUCESSO:', resultado.message)
        } else {
          console.log('⚠️ FALHA NO ENVIO REAL:', resultado.error)
          console.log('📋 INSTRUÇÕES PARA ATIVAR:')
          console.log(WhatsAppAPI.obterInstrucoes())
        }
      } else {
        // Para outros números, apenas simular
        console.log('🔄 Simulando envio para número:', whatsapp)
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      // Log da mensagem
      console.log('📝 CONTEÚDO DA MENSAGEM:')
      console.log('─'.repeat(50))
      console.log(mensagem)
      console.log('─'.repeat(50))
      
      // Marcar como enviada no banco
      await this.marcarMensagemEnviada(whatsapp)
      
      console.log(`✅ Processo concluído para ${whatsapp}`)
      return true
      
    } catch (error) {
      console.error(`❌ Erro no processo de envio:`, error)
      throw new Error('Falha ao processar mensagem. Tente novamente.')
    }
  }



  // Verificar se número existe (simular API de verificação)
  static async verificarNumero(_whatsapp: string): Promise<boolean> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simular verificação (90% dos números são válidos)
    const existe = Math.random() > 0.1
    
    if (!existe) {
      throw new Error('Número de WhatsApp não encontrado ou inválido.')
    }
    
    return existe
  }
}

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/providers/auth-provider'
import { isSuperAdminEmail } from './useSuperAdmin'

// Definição dos níveis hierárquicos dos planos
export const NIVEIS_PLANO = {
  'mensal': 1,
  'semestral': 2,
  'anual': 3
} as const

// Definição das funcionalidades e seus níveis mínimos requeridos
export const FUNCIONALIDADES = {
  // Nível 1 - Plano Mensal
  'vendas': { nivel: 1, nome: 'Sistema de Vendas', categoria: 'vendas' },
  'estoque_basico': { nivel: 1, nome: 'Controle Básico de Estoque', categoria: 'estoque' },
  'relatorios_basicos': { nivel: 1, nome: 'Relatórios Básicos', categoria: 'relatorios' },
  'backup_manual': { nivel: 1, nome: 'Backup Manual', categoria: 'backup' },
  'suporte_email': { nivel: 1, nome: 'Suporte por Email', categoria: 'suporte' },
  
  // Nível 2 - Plano Semestral (inclui nível 1)
  'comandas': { nivel: 2, nome: 'Gestão de Comandas e Mesas', categoria: 'comandas' },
  'estoque_completo': { nivel: 2, nome: 'Controle Completo de Estoque', categoria: 'estoque' },
  'relatorios_avancados': { nivel: 2, nome: 'Relatórios Avançados', categoria: 'relatorios' },
  'backup_automatico': { nivel: 2, nome: 'Backup Automático', categoria: 'backup' },
  'integracao_impressora': { nivel: 2, nome: 'Integração com Impressora', categoria: 'integracoes' },
  'suporte_prioritario': { nivel: 2, nome: 'Suporte Prioritário', categoria: 'suporte' },
  
  // Nível 3 - Plano Anual (inclui níveis 1 e 2)
  'dashboard_executivo': { nivel: 3, nome: 'Dashboard Executivo', categoria: 'dashboard' },
  'api_integracoes': { nivel: 3, nome: 'API para Integrações', categoria: 'integracoes' },
  'relatorios_premium': { nivel: 3, nome: 'Relatórios Premium', categoria: 'relatorios' },
  'backup_avancado': { nivel: 3, nome: 'Backup Avançado', categoria: 'backup' },
  'usuarios_ilimitados': { nivel: 3, nome: 'Usuários Ilimitados', categoria: 'usuarios' },
  'suporte_premium': { nivel: 3, nome: 'Suporte Premium 24/7', categoria: 'suporte' },
  'exportacao_dados': { nivel: 3, nome: 'Exportação de Dados', categoria: 'dados' },
  'analises_preditivas': { nivel: 3, nome: 'Análises Preditivas', categoria: 'analytics' }
} as const

export interface StatusPlano {
  nomeUsuario: string
  nomePlano: string
  nivelPlano: number
  statusAssinatura: string
  emPeriodoTeste: boolean
  dataFimTeste: string | null
  dataVencimento: string | null
  diasRestantesTeste: number | null
}

export interface PermissaoFuncionalidade {
  nome: string
  descricao: string
  categoria: string
  permitida: boolean
  nivel: number
}

export function usePermissionsHierarchical() {
  const { user } = useAuthContext()
  const [statusPlano, setStatusPlano] = useState<StatusPlano | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      carregarPermissoes()
    }
  }, [user])

  const carregarPermissoes = async () => {
    if (!user) return

    try {
      // Buscar apenas dados do usuário e plano - estrutura simplificada
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select(`
          nome,
          email,
          role,
          status_assinatura,
          em_periodo_teste,
          data_fim_teste,
          data_vencimento,
          planos!inner (
            nome
          )
        `)
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      // Verificar se é super admin
      const isSuperAdmin = isSuperAdminEmail(userData.email) || userData.role === 'super_admin'
      
      if (isSuperAdmin) {
        setStatusPlano({
          nomeUsuario: userData.nome || 'Super Admin',
          nomePlano: 'Super Admin',
          nivelPlano: 999, // Nível máximo
          statusAssinatura: 'ativa',
          emPeriodoTeste: false,
          dataFimTeste: null,
          dataVencimento: '2030-12-31T23:59:59.000Z',
          diasRestantesTeste: null
        })
        setLoading(false)
        return
      }

      const plano = Array.isArray(userData.planos) ? userData.planos[0] : userData.planos
      const nomePlano = plano?.nome?.toLowerCase() || 'mensal'
      const nivelPlano = NIVEIS_PLANO[nomePlano as keyof typeof NIVEIS_PLANO] || 1

      // Calcular dias restantes do teste
      let diasRestantesTeste = null
      if (userData.em_periodo_teste && userData.data_fim_teste) {
        const dataFim = new Date(userData.data_fim_teste)
        const agora = new Date()
        const diffTime = dataFim.getTime() - agora.getTime()
        diasRestantesTeste = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      // Status do plano simplificado
      setStatusPlano({
        nomeUsuario: userData.nome || '',
        nomePlano: plano?.nome || 'Mensal',
        nivelPlano,
        statusAssinatura: userData.status_assinatura || '',
        emPeriodoTeste: userData.em_periodo_teste || false,
        dataFimTeste: userData.data_fim_teste || null,
        dataVencimento: userData.data_vencimento || null,
        diasRestantesTeste
      })

    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
    } finally {
      setLoading(false)
    }
  }

  // NOVA LÓGICA: TODAS as funcionalidades estão SEMPRE liberadas
  // Mudança: único produto com 3 modalidades de pagamento (mensal/semestral/anual)
  const temPermissao = (_funcionalidade: string | string[]): boolean => {
    // Sempre retorna true - todas as funcionalidades estão liberadas
    // A diferença é apenas na modalidade de pagamento
    return true
  }

  // Função para obter todas as permissões do usuário
  const getPermissoes = (): PermissaoFuncionalidade[] => {
    // TODAS as funcionalidades estão sempre permitidas
    return Object.entries(FUNCIONALIDADES).map(([key, func]) => ({
      nome: key,
      descricao: func.nome,
      categoria: func.categoria,
      nivel: func.nivel,
      permitida: true // Sempre true - todas liberadas
    }))
  }

  // Função para obter permissões por categoria
  const getPermissoesPorCategoria = (categoria: string): PermissaoFuncionalidade[] => {
    return getPermissoes().filter(p => p.categoria === categoria)
  }

  // NOVA LÓGICA: Função para verificar modalidades disponíveis
  const podeUpgrade = (): boolean => {
    // Sempre pode "trocar modalidade" de pagamento
    return true
  }

  // Função para obter modalidades disponíveis (não é mais "upgrade", é troca de modalidade)
  const getModalidadesDisponiveis = (): Array<{ nome: string; nivel: number; economia?: string }> => {
    const modalidades = [
      { nome: 'Mensal', nivel: 1, economia: undefined },
      { nome: 'Semestral', nivel: 2, economia: '11% de desconto' },
      { nome: 'Anual', nivel: 3, economia: '22% de desconto' }
    ]
    
    return modalidades.filter(m => statusPlano ? m.nivel !== statusPlano.nivelPlano : true)
  }

  // Manter compatibilidade com código existente
  const getProximoNivel = (): { nome: string; nivel: number } | null => {
    const modalidades = getModalidadesDisponiveis()
    return modalidades.length > 0 ? modalidades[0] : null
  }

  return {
    statusPlano,
    loading,
    temPermissao,
    getPermissoes,
    getPermissoesPorCategoria,
    podeUpgrade,
    getProximoNivel,
    getModalidadesDisponiveis,
    recarregarPermissoes: carregarPermissoes,
    FUNCIONALIDADES_DISPONIVEIS: FUNCIONALIDADES
  }
}

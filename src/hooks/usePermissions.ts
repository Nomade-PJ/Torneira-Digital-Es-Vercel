import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/providers/auth-provider'

export interface PermissaoFuncionalidade {
  nome: string
  descricao: string
  categoria: string
  permitida: boolean
}

export interface StatusPlano {
  nomeUsuario: string
  nomePlano: string
  statusAssinatura: string
  emPeriodoTeste: boolean
  dataFimTeste: string | null
  dataVencimento: string | null
  diasRestantesTeste: number | null
}

export function usePermissions() {
  const { user } = useAuthContext()
  const [permissoes, setPermissoes] = useState<PermissaoFuncionalidade[]>([])
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
      // Buscar dados do usuário e plano
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select(`
          nome,
          status_assinatura,
          em_periodo_teste,
          data_fim_teste,
          data_vencimento,
          planos (
            nome,
            plano_funcionalidades (
              funcionalidades (
                nome,
                descricao,
                categoria
              )
            )
          )
        `)
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      // Buscar todas as funcionalidades do sistema
      const { data: todasFuncionalidades, error: funcError } = await supabase
        .from('funcionalidades')
        .select('nome, descricao, categoria')
        .eq('ativo', true)
        .order('categoria, ordem_exibicao')

      if (funcError) throw funcError

      // Funcionalidades permitidas para o plano do usuário
      const plano = Array.isArray(userData.planos) ? userData.planos[0] : userData.planos
      const funcionalidadesPermitidas = plano?.plano_funcionalidades?.flatMap(
        (pf: any) => pf.funcionalidades?.map((f: any) => f.nome) || []
      ) || []

      // Criar lista de permissões
      const permissoesMapeadas: PermissaoFuncionalidade[] = todasFuncionalidades.map(func => ({
        nome: func.nome,
        descricao: func.descricao || '',
        categoria: func.categoria,
        permitida: funcionalidadesPermitidas.includes(func.nome)
      }))

      setPermissoes(permissoesMapeadas)

      // Calcular dias restantes do teste
      let diasRestantesTeste = null
      if (userData.em_periodo_teste && userData.data_fim_teste) {
        const dataFim = new Date(userData.data_fim_teste)
        const agora = new Date()
        const diffTime = dataFim.getTime() - agora.getTime()
        diasRestantesTeste = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      // Status do plano
      setStatusPlano({
        nomeUsuario: userData.nome || '',
        nomePlano: plano?.nome || 'Nenhum',
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

  const temPermissao = (funcionalidade: string): boolean => {
    return permissoes.find(p => p.nome === funcionalidade)?.permitida || false
  }

  const getPermissoesPorCategoria = (categoria: string): PermissaoFuncionalidade[] => {
    return permissoes.filter(p => p.categoria === categoria)
  }

  return {
    permissoes,
    statusPlano,
    loading,
    temPermissao,
    getPermissoesPorCategoria,
    recarregarPermissoes: carregarPermissoes
  }
}

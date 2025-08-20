import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import type { Plano } from "../types/database"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Beer, Check, Crown, Star, Zap, Gift, Clock } from "lucide-react"

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    carregarPlanos()
  }, [])

  const carregarPlanos = async () => {
    try {
      const { data, error } = await supabase
        .from('planos')
        .select(`
          *,
          plano_funcionalidades (
            funcionalidades (
              nome,
              descricao,
              categoria
            )
          )
        `)
        .eq('ativo', true)
        .order('ordem_exibicao', { ascending: true })

      if (error) throw error
      setPlanos(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error)
      setError('Erro ao carregar planos disponíveis')
    } finally {
      setLoading(false)
    }
  }

  const handleSelecionarPlano = (planoId: string) => {
    // Navegar para a página de login com o plano como parâmetro na URL
    navigate(`/login?plano=${planoId}`)
  }

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const getIconePlano = (nome: string) => {
    switch (nome.toLowerCase()) {
      case 'mensal':
        return <Zap className="w-8 h-8" />
      case 'semestral':
        return <Star className="w-8 h-8" />
      case 'anual':
        return <Crown className="w-8 h-8" />
      default:
        return <Beer className="w-8 h-8" />
    }
  }

  const getCorPlano = (nome: string) => {
    switch (nome.toLowerCase()) {
      case 'mensal':
        return {
          gradient: 'from-blue-500 to-cyan-500',
          border: 'border-blue-500/30',
          bg: 'bg-blue-500/10',
          text: 'text-blue-400'
        }
      case 'semestral':
        return {
          gradient: 'from-purple-500 to-pink-500',
          border: 'border-purple-500/30',
          bg: 'bg-purple-500/10',
          text: 'text-purple-400'
        }
      case 'anual':
        return {
          gradient: 'from-amber-500 to-orange-500',
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400'
        }
      default:
        return {
          gradient: 'from-gray-500 to-slate-500',
          border: 'border-gray-500/30',
          bg: 'bg-gray-500/10',
          text: 'text-gray-400'
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-300 text-lg font-medium">Carregando planos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden p-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 blur-3xl opacity-30 animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-r from-amber-500 to-yellow-500 p-6 rounded-full">
                <Beer className="w-16 h-16 text-slate-900" />
              </div>
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-slate-900 text-lg font-bold">T</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30 px-6 py-2 text-lg font-bold mb-6">
              🎉 7 Dias Grátis no Plano Mensal
            </Badge>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent mb-4">
            Torneira Digital
          </h1>
          <p className="text-xl text-slate-300 mb-2">Escolha o plano ideal para seu estabelecimento</p>
          <p className="text-slate-400">Plano Mensal inclui 7 dias grátis • Demais planos iniciam imediatamente</p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Cards de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {planos.map((plano: any) => {
            const cores = getCorPlano(plano.nome)
            const recursos = Array.isArray(plano.recursos) ? plano.recursos : []
            const isPopular = plano.nome.toLowerCase() === 'semestral'
            const isMelhorOferta = plano.nome.toLowerCase() === 'anual'
            const temTesteGratis = plano.tem_teste_gratis

            return (
              <Card 
                key={plano.id} 
                className={`relative bg-slate-900/95 backdrop-blur-xl ${cores.border} shadow-2xl rounded-2xl overflow-visible hover:scale-105 transition-all duration-300 mt-8 ${
                  isMelhorOferta ? 'ring-2 ring-amber-500/50' : ''
                }`}
              >
                {/* Badge de destaque */}
                {isPopular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 text-xs font-bold shadow-lg rounded-full border-2 border-slate-900 whitespace-nowrap">
                      MAIS POPULAR
                    </Badge>
                  </div>
                )}
                
                {isMelhorOferta && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 px-4 py-1.5 text-xs font-bold shadow-lg rounded-full border-2 border-slate-900 whitespace-nowrap">
                      MELHOR OFERTA
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6 pt-8">
                  <div className="flex justify-center mb-4">
                    <div className={`relative p-4 rounded-full bg-gradient-to-r ${cores.gradient}`}>
                      {getIconePlano(plano.nome)}
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-slate-100 mb-2">
                    {plano.nome}
                  </CardTitle>
                  
                  <CardDescription className="text-slate-400 mb-4">
                    {plano.descricao}
                  </CardDescription>

                  {/* Preço */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      {temTesteGratis && (
                        <div className="text-sm text-green-400 font-semibold">
                          7 dias grátis, depois:
                        </div>
                      )}
                      <div className="text-4xl font-bold text-slate-100">
                        {formatarPreco(plano.preco_mensal)}
                        <span className="text-lg text-slate-400 font-normal">/mês</span>
                      </div>
                    </div>
                    
                    {plano.duracao_meses > 1 && (
                      <div className="space-y-2">
                        <div className="text-slate-300 text-sm">
                          {temTesteGratis ? 'Total após teste:' : 'Total do período:'} <span className="font-semibold">{formatarPreco(plano.preco_total)}</span>
                        </div>
                        {plano.desconto_percentual && plano.desconto_percentual > 0 && (
                          <Badge className={`${cores.bg} ${cores.text} border-none`}>
                            {plano.desconto_percentual}% de desconto
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-8">
                  {/* Destaque do teste grátis - apenas para plano mensal */}
                  {temTesteGratis && (
                    <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                      <div className="flex items-center justify-center space-x-2 text-green-400">
                        <Gift className="w-5 h-5" />
                        <span className="font-semibold text-sm">7 dias grátis para testar</span>
                      </div>
                    </div>
                  )}

                  {/* Lista de recursos */}
                  <div className="space-y-3 mb-8">
                    {recursos.map((recurso: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`p-1 rounded-full bg-gradient-to-r ${cores.gradient}`}>
                          <Check className="w-4 h-4 text-slate-900" />
                        </div>
                        <span className="text-slate-300">{String(recurso)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Botão de seleção */}
                  <Button
                    onClick={() => handleSelecionarPlano(plano.id)}
                    className={`w-full h-12 bg-gradient-to-r ${cores.gradient} hover:opacity-90 text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5`}
                  >
                    {temTesteGratis ? 'Começar Teste Grátis' : `Escolher ${plano.nome}`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Informações adicionais */}
        <div className="text-center space-y-6">
          <div className="max-w-3xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 backdrop-blur-xl">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
                <Clock className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="text-2xl font-bold text-green-400">
                7 Dias Grátis no Plano Mensal
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 mb-6">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Acesso a todas as funcionalidades básicas</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Sem cartão de crédito necessário</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Suporte por email incluído</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Cancele quando quiser</span>
              </div>
            </div>

            <p className="text-slate-400 text-sm">
              <strong>Apenas o Plano Mensal</strong> inclui teste grátis. Planos Semestral e Anual iniciam imediatamente após o cadastro.
            </p>
          </div>

          <div className="max-w-2xl mx-auto p-6 rounded-xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50">
            <h3 className="text-xl font-bold text-slate-100 mb-3">
              ✨ Todos os planos incluem:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Controle de estoque</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Sistema de vendas</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Gestão básica de comandas</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Relatórios em tempo real</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Múltiplas formas de pagamento</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Backup seguro na nuvem</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Acesso responsivo (mobile/desktop)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Suporte técnico incluído</span>
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-sm">
            Ao escolher um plano, você será direcionado para criar sua conta. Plano Mensal inicia com teste grátis, demais planos iniciam imediatamente.
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Beer, Check, Crown, Gift, Sparkles, Star, Zap, ArrowRight, TrendingUp } from "lucide-react"

export default function PlanosPage() {
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<'mensal' | 'semestral' | 'anual'>('mensal')
  const navigate = useNavigate()

  // NOVA LÓGICA: Produto único com 3 modalidades de pagamento
  const modalidades = {
    mensal: {
      nome: 'Mensal',
      preco: 89.90,
      precoTotal: undefined,
      economia: null,
      descricao: 'Pague mensalmente',
      temTeste: true
    },
    semestral: {
      nome: 'Semestral',
      preco: 79.90,
      precoTotal: 479.40,
      economia: '11% de desconto',
      descricao: 'Pague semestralmente e economize',
      temTeste: false
    },
    anual: {
      nome: 'Anual',
      preco: 69.90,
      precoTotal: 839.40,
      economia: '22% de desconto',
      descricao: 'Pague anualmente e economize ainda mais',
      temTeste: false
    }
  }

  // Todas as funcionalidades estão sempre incluídas
  const funcionalidades = [
    "✅ Sistema completo de vendas",
    "✅ Controle total de estoque (produtos ilimitados)",
    "✅ Gestão completa de comandas e mesas",
    "✅ Relatórios avançados (365 dias)",
    "✅ Dashboard executivo completo",
    "✅ Usuários ilimitados",
    "✅ Backup automático diário",
    "✅ Suporte premium 24/7",
    "✅ API para integrações",
    "✅ Exportação de dados",
    "✅ Integração com impressora térmica",
    "✅ Análises preditivas",
    "✅ Controle avançado de categorias",
    "✅ Alertas e automação de estoque"
  ]

  const handleSelecionarModalidade = () => {
    // Navegar para o login com a modalidade selecionada
    navigate(`/login?modalidade=${modalidadeSelecionada}`)
  }

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const modalidadeAtual = modalidades[modalidadeSelecionada]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background decorativo melhorado */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header redesenhado */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-500 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-400 p-8 rounded-full shadow-2xl transform group-hover:scale-105 transition-all duration-300">
                <Beer className="w-20 h-20 text-slate-900" />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-xl border-4 border-slate-900">
                <span className="text-slate-900 text-xl font-black">T</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-7xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent mb-6 tracking-tight">
            Torneira Digital
          </h1>
          <p className="text-2xl text-slate-200 mb-4 font-medium">Sistema Completo de Gestão</p>
          <div className="flex items-center justify-center space-x-2 text-lg text-amber-400 font-semibold">
            <Sparkles className="w-6 h-6" />
            <span>Todas as funcionalidades • Escolha como pagar</span>
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Cards de modalidades em grid horizontal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
          {/* Card Mensal */}
          <Card 
            className={`relative cursor-pointer transition-all duration-500 transform hover:scale-105 ${
              modalidadeSelecionada === 'mensal' 
                ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500 ring-2 ring-blue-400/50 shadow-2xl shadow-blue-500/25' 
                : 'bg-slate-900/60 border-slate-700/50 hover:border-blue-500/50'
            }`}
            onClick={() => setModalidadeSelecionada('mensal')}
          >
            {modalidadeSelecionada === 'mensal' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1 text-sm font-bold shadow-lg">
                  SELECIONADO
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-full ${modalidadeSelecionada === 'mensal' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-slate-700'}`}>
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-blue-400">💳 Mensal</CardTitle>
              <div className="text-green-400 font-semibold text-sm">7 dias grátis para testar</div>
            </CardHeader>
            
            <CardContent className="text-center">
              <div className="text-4xl font-black text-slate-100 mb-2">R$ 89,90</div>
              <div className="text-slate-400 text-sm">por mês</div>
            </CardContent>
          </Card>

          {/* Card Semestral */}
          <Card 
            className={`relative cursor-pointer transition-all duration-500 transform hover:scale-105 ${
              modalidadeSelecionada === 'semestral' 
                ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500 ring-2 ring-purple-400/50 shadow-2xl shadow-purple-500/25' 
                : 'bg-slate-900/60 border-slate-700/50 hover:border-purple-500/50'
            }`}
            onClick={() => setModalidadeSelecionada('semestral')}
          >
            {modalidadeSelecionada === 'semestral' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-500 text-white px-4 py-1 text-sm font-bold shadow-lg">
                  SELECIONADO
                </Badge>
              </div>
            )}
            
            <div className="absolute -top-3 -right-3">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 text-xs font-bold rounded-full">
                11% OFF
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-full ${modalidadeSelecionada === 'semestral' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-700'}`}>
                  <Star className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-purple-400">⭐ Semestral</CardTitle>
              <div className="text-green-400 font-semibold text-sm">Economize R$ 59,40</div>
            </CardHeader>
            
            <CardContent className="text-center">
              <div className="text-4xl font-black text-slate-100 mb-2">R$ 79,90</div>
              <div className="text-slate-400 text-sm">por mês</div>
              <div className="text-purple-400 text-xs font-semibold mt-1">Total: R$ 479,40</div>
            </CardContent>
          </Card>

          {/* Card Anual */}
          <Card 
            className={`relative cursor-pointer transition-all duration-500 transform hover:scale-105 ${
              modalidadeSelecionada === 'anual' 
                ? 'bg-gradient-to-br from-amber-600/20 to-yellow-600/20 border-amber-500 ring-2 ring-amber-400/50 shadow-2xl shadow-amber-500/25' 
                : 'bg-slate-900/60 border-slate-700/50 hover:border-amber-500/50'
            }`}
            onClick={() => setModalidadeSelecionada('anual')}
          >
            {modalidadeSelecionada === 'anual' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-amber-500 text-slate-900 px-4 py-1 text-sm font-bold shadow-lg">
                  SELECIONADO
                </Badge>
              </div>
            )}
            
            <div className="absolute -top-3 -right-3">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 text-xs font-bold rounded-full">
                22% OFF
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-full ${modalidadeSelecionada === 'anual' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-slate-700'}`}>
                  <Crown className="w-8 h-8 text-slate-900" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-amber-400">👑 Anual</CardTitle>
              <div className="text-green-400 font-semibold text-sm">Economize R$ 238,80</div>
            </CardHeader>
            
            <CardContent className="text-center">
              <div className="text-4xl font-black text-slate-100 mb-2">R$ 69,90</div>
              <div className="text-slate-400 text-sm">por mês</div>
              <div className="text-amber-400 text-xs font-semibold mt-1">Total: R$ 838,80</div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de funcionalidades redesenhada */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">
              🚀 Sistema Completo Incluído
            </h2>
            <p className="text-xl text-slate-300">Todas essas funcionalidades em qualquer modalidade de pagamento</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funcionalidades.map((funcionalidade, index) => {
              const cores = [
                'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
                'from-purple-500/20 to-pink-500/20 border-purple-500/30',
                'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
                'from-green-500/20 to-emerald-500/20 border-green-500/30',
                'from-red-500/20 to-rose-500/20 border-red-500/30',
                'from-indigo-500/20 to-purple-500/20 border-indigo-500/30'
              ]
              const corIndex = index % cores.length
              
              return (
                <div key={index} className={`bg-gradient-to-br ${cores[corIndex]} p-4 rounded-xl border backdrop-blur-sm hover:scale-105 transition-all duration-300`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-slate-900" />
                    </div>
                    <span className="text-slate-200 font-medium">{funcionalidade.replace('✅ ', '')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA principal melhorado */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-8 shadow-2xl">
            <div className="mb-6">
              {modalidadeAtual.temTeste && (
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                  <div className="flex items-center justify-center space-x-3 text-green-400">
                    <Gift className="w-8 h-8" />
                    <div>
                      <div className="text-lg font-bold">7 dias grátis para testar</div>
                      <div className="text-sm opacity-80">Sem cartão de crédito • Cancele quando quiser</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-6xl font-black text-slate-100 mb-2">
                {formatarPreco(modalidadeAtual.preco)}
                <span className="text-2xl text-slate-400 font-normal">/mês</span>
              </div>
              
              {modalidadeAtual.precoTotal && (
                <div className="space-y-2">
                  <div className="text-lg text-slate-300">
                    Valor total: <span className="font-bold text-amber-400">{formatarPreco(modalidadeAtual.precoTotal)}</span>
                  </div>
                  {modalidadeAtual.economia && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 text-lg font-bold">
                      💰 {modalidadeAtual.economia}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={handleSelecionarModalidade}
              className="w-full h-16 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-slate-900 font-black text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
            >
              {modalidadeAtual.temTeste ? (
                <div className="flex items-center space-x-3">
                  <Gift className="w-8 h-8" />
                  <div>
                    <div>Começar Teste Grátis</div>
                    <div className="text-sm opacity-80">Modalidade {modalidadeAtual.nome}</div>
                  </div>
                  <ArrowRight className="w-8 h-8" />
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8" />
                  <div>
                    <div>Escolher Modalidade {modalidadeAtual.nome}</div>
                    <div className="text-sm opacity-80">Acesso imediato</div>
                  </div>
                  <ArrowRight className="w-8 h-8" />
                </div>
              )}
            </Button>
            
            <p className="text-slate-400 text-sm mt-4">
              🔒 Pagamento seguro • ⚡ Ativação instantânea • 🛡️ Garantia de 7 dias
            </p>
          </div>
        </div>

        {/* Rodapé simples */}
        <div className="text-center mt-16 mb-8">
          <p className="text-slate-400 text-lg">
            🚀 Pronto para revolucionar seu estabelecimento?
          </p>
        </div>
      </div>
    </div>
  )
}

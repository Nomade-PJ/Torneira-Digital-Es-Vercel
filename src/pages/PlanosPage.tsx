import { useState } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Beer, Crown, Sparkles, Star, Zap, ArrowRight, CreditCard } from "lucide-react"
import { getAsaasLink } from "../lib/asaas-links"
import { useToast } from "../components/ui/use-toast"

export default function PlanosPage() {
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<'mensal' | 'semestral' | 'anual'>('mensal')
  const { toast } = useToast()

  // NOVA LÓGICA: Produto único com 3 modalidades de pagamento
  const modalidades = {
    mensal: {
      id: 'plano-mensal-torneira-digital',
      nome: 'Plano Mensal',
      preco_mensal: 89.90,
      preco_total: 89.90,
      duracao_meses: 1,
      desconto_percentual: 0,
      economia: null,
      descricao: 'Pague mensalmente',
      temTeste: true
    },
    semestral: {
      id: 'plano-semestral-torneira-digital',
      nome: 'Plano Semestral',
      preco_mensal: 79.90,
      preco_total: 479.40,
      duracao_meses: 6,
      desconto_percentual: 11,
      economia: `Economize R$ ${((89.90 * 6) - 479.40).toFixed(2)}`,
      descricao: 'Pague semestralmente e economize',
      temTeste: false
    },
    anual: {
      id: 'plano-anual-torneira-digital',
      nome: 'Plano Anual',
      preco_mensal: 69.90,
      preco_total: 838.80,
      duracao_meses: 12,
      desconto_percentual: 22,
      economia: `Economize R$ ${((89.90 * 12) - 838.80).toFixed(2)}`,
      descricao: 'Pague anualmente e economize ainda mais',
      temTeste: false
    }
  }

  const handleSelecionarModalidade = () => {
    // NOVA LÓGICA: Redirecionar diretamente para Asaas (sem modal intermediário)
    console.log('🚀 Redirecionando diretamente para Asaas:', modalidadeAtual.nome)
    
    // Salvar contexto do plano para o webhook
    const checkoutContext = {
      planoId: modalidadeAtual.id,
      planoNome: modalidadeAtual.nome,
      valor: modalidadeAtual.preco_total,
      timestamp: new Date().toISOString(),
      source: 'torneira-digital-direct'
    }
    
    localStorage.setItem('checkout-context', JSON.stringify(checkoutContext))
    
    // Redirecionar diretamente para o link do Asaas
    const asaasLink = getAsaasLink(modalidadeAtual.id)
    if (asaasLink?.url) {
      window.location.href = asaasLink.url
    } else {
      toast({
        title: "❌ Erro",
        description: "Link de pagamento não encontrado para este plano.",
        variant: "destructive"
      })
    }
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
        {/* Header compacto */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-400 p-4 rounded-full shadow-xl">
                <Beer className="w-12 h-12 text-slate-900" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
                <span className="text-slate-900 text-sm font-black">T</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent mb-3 tracking-tight">
            Torneira Digital
          </h1>
          <p className="text-lg text-slate-200 mb-2 font-medium">Sistema Completo de Gestão</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-amber-400 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Todas as funcionalidades • Escolha como pagar</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Cards de modalidades redesenhados igual ao WhatsApp */}
        <div className="max-w-md mx-auto mb-12">
          {/* Card Mensal */}
          <Card 
            className={`mb-4 cursor-pointer transition-all duration-300 ${
              modalidadeSelecionada === 'mensal' 
                ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500 ring-2 ring-blue-400/50 shadow-xl' 
                : 'bg-slate-900/60 border-slate-700/50 hover:border-blue-500/50'
            }`}
            onClick={() => setModalidadeSelecionada('mensal')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${modalidadeSelecionada === 'mensal' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-slate-700'}`}>
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-400">💳 Plano Mensal</div>
                    <div className="text-xs text-green-400 font-semibold">7 dias grátis para testar</div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-4xl font-black text-slate-100">R$ 89,90</div>
                <div className="text-slate-400 text-sm">/mês</div>
              </div>
            </CardContent>
          </Card>

          {/* Card Semestral */}
          <Card 
            className={`mb-4 cursor-pointer transition-all duration-300 relative ${
              modalidadeSelecionada === 'semestral' 
                ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500 ring-2 ring-purple-400/50 shadow-xl' 
                : 'bg-slate-900/60 border-slate-700/50 hover:border-purple-500/50'
            }`}
            onClick={() => setModalidadeSelecionada('semestral')}
          >
            <div className="absolute -top-2 -right-2">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 text-xs font-bold rounded-full">
                11% OFF
              </Badge>
            </div>
            
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${modalidadeSelecionada === 'semestral' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-700'}`}>
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-400">⭐ Plano Semestral</div>
                    <div className="text-xs text-green-400 font-semibold">Economize R$ 59,40</div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-4xl font-black text-slate-100">R$ 79,90</div>
                <div className="text-slate-400 text-sm">/mês</div>
                <div className="text-purple-400 text-xs font-semibold">Total: R$ 479,40</div>
              </div>
            </CardContent>
          </Card>

          {/* Card Anual */}
          <Card 
            className={`mb-4 cursor-pointer transition-all duration-300 relative ${
              modalidadeSelecionada === 'anual' 
                ? 'bg-gradient-to-br from-amber-600/20 to-yellow-600/20 border-amber-500 ring-2 ring-amber-400/50 shadow-xl' 
                : 'bg-slate-900/60 border-slate-700/50 hover:border-amber-500/50'
            }`}
            onClick={() => setModalidadeSelecionada('anual')}
          >
            <div className="absolute -top-2 -right-2">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 text-xs font-bold rounded-full">
                22% OFF
              </Badge>
            </div>
            
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${modalidadeSelecionada === 'anual' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-slate-700'}`}>
                    <Crown className="w-5 h-5 text-slate-900" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-400">👑 Plano Anual</div>
                    <div className="text-xs text-green-400 font-semibold">Economize R$ 238,80</div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-4xl font-black text-slate-100">R$ 69,90</div>
                <div className="text-slate-400 text-sm">/mês</div>
                <div className="text-amber-400 text-xs font-semibold">Total: R$ 838,80</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão Começar simples */}
        <div className="max-w-md mx-auto text-center">
          <Button
            onClick={handleSelecionarModalidade}
            className="w-full h-14 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-slate-900 font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
          >
            {modalidadeAtual.temTeste ? (
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Começar com {modalidadeAtual.nome}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Assinar {modalidadeAtual.nome}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
          
          <p className="text-slate-400 text-xs mt-3">
            🔒 Seguro • ⚡ Ativação imediata
          </p>
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

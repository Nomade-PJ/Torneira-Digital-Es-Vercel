import { useState, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { WhatsAppService, PlanoInfo } from "../lib/whatsapp-service"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Badge } from "../components/ui/badge"
import { Alert, AlertDescription } from "../components/ui/alert"
import WhatsAppDemo from "../components/WhatsAppDemo"
import { Beer, Phone, ArrowRight, CheckCircle, AlertCircle, MessageCircle, Clock, Gift } from "lucide-react"

export default function WhatsAppPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const modalidade = searchParams.get('modalidade') || 'mensal'
  
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [mensagemEnviada, setMensagemEnviada] = useState(false)
  const [mostrarDemo, setMostrarDemo] = useState(false)
  const [mensagemGerada, setMensagemGerada] = useState('')
  
  const inputRef = useRef<HTMLInputElement>(null)

  const modalidades = {
    mensal: {
      nome: 'Mensal',
      preco: 89.90,
      precoTotal: undefined,
      economia: null,
      descricao: 'Pague mensalmente',
      temTeste: true,
      icon: '💳',
      cor: 'blue'
    },
    semestral: {
      nome: 'Semestral',
      preco: 79.90,
      precoTotal: 479.40,
      economia: '11% de desconto',
      descricao: 'Pague semestralmente e economize',
      temTeste: false,
      icon: '⭐',
      cor: 'purple'
    },
    anual: {
      nome: 'Anual',
      preco: 69.90,
      precoTotal: 839.40,
      economia: '22% de desconto',
      descricao: 'Pague anualmente e economize ainda mais',
      temTeste: false,
      icon: '👑',
      cor: 'amber'
    }
  }

  const modalidadeAtual = modalidades[modalidade as keyof typeof modalidades]

  const formatarPreco = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const numeroLimpo = whatsapp.replace(/\D/g, '')
      
      if (!WhatsAppService.validarWhatsApp(whatsapp)) {
        throw new Error('Por favor, insira um número de WhatsApp válido com DDD.')
      }

      // Verificar se o número existe
      await WhatsAppService.verificarNumero(numeroLimpo)
      
      // Preparar dados do plano
      const planoInfo: PlanoInfo = {
        modalidade: modalidade as 'mensal' | 'semestral' | 'anual',
        preco: modalidadeAtual.preco,
        precoTotal: modalidadeAtual.precoTotal,
        economia: modalidadeAtual.economia || undefined,
        temTeste: modalidadeAtual.temTeste
      }
      
      // Salvar solicitação no banco de dados
      await WhatsAppService.salvarSolicitacao(numeroLimpo, planoInfo)
      
      // Gerar mensagem e tentar enviar
      const mensagem = WhatsAppService.gerarMensagemConfirmacao(planoInfo, numeroLimpo)
      setMensagemGerada(mensagem)
      
      try {
        await WhatsAppService.enviarMensagem(numeroLimpo, mensagem)
        setSucesso(true)
        setMensagemEnviada(true)
      } catch (envioError) {
        console.log('⚠️ Erro no envio real, mas demonstração disponível:', envioError)
        setSucesso(true) // Continuar com demonstração
      }
      
      setMostrarDemo(true)
      
      // Após 5 segundos, redirecionar para cadastro
      setTimeout(() => {
        navigate(`/login?modalidade=${modalidade}&whatsapp=${numeroLimpo}`)
      }, 5000)
      
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao processar solicitação')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    const numeroFormatado = WhatsAppService.formatarWhatsApp(valor)
    setWhatsapp(numeroFormatado)
    setErro('')
  }

  if (mensagemEnviada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <Card className="bg-slate-900/95 backdrop-blur-xl border-green-500/30 shadow-2xl">
            <CardContent className="text-center p-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Mensagem Enviada! ✅
              </h2>
              
              <p className="text-slate-300 mb-6">
                Enviamos todas as informações do seu plano para o WhatsApp informado.
              </p>
              
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                <p className="text-green-400 text-sm">
                  Redirecionando para o cadastro em 3 segundos...
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-slate-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>Aguarde um momento</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 min-h-screen flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Informações do Plano */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-xl opacity-40"></div>
                  <div className="relative bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-400 p-4 rounded-full shadow-xl">
                    <Beer className="w-12 h-12 text-slate-900" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent mb-2">
                Quase lá!
              </h1>
              <p className="text-lg text-slate-200 mb-4">Confirme seu WhatsApp para receber as informações</p>
            </div>

            {/* Card do Plano Selecionado */}
            <Card className={`bg-gradient-to-br ${
              modalidadeAtual.cor === 'blue' ? 'from-blue-600/20 to-cyan-600/20 border-blue-500/40' :
              modalidadeAtual.cor === 'purple' ? 'from-purple-600/20 to-pink-600/20 border-purple-500/40' :
              'from-amber-600/20 to-yellow-600/20 border-amber-500/40'
            } backdrop-blur-xl shadow-2xl`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                    <span>{modalidadeAtual.icon}</span>
                    <span>Plano {modalidadeAtual.nome}</span>
                  </CardTitle>
                  {modalidadeAtual.economia && (
                    <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                      {modalidadeAtual.economia}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-black text-slate-100">
                    {formatarPreco(modalidadeAtual.preco)}
                    <span className="text-lg text-slate-400 font-normal">/mês</span>
                  </div>
                  
                  {modalidadeAtual.precoTotal && (
                    <div className="text-slate-300 text-sm">
                      Total: <span className="font-semibold text-amber-400">{formatarPreco(modalidadeAtual.precoTotal)}</span>
                    </div>
                  )}
                </div>
                
                {modalidadeAtual.temTeste && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-green-400">
                      <Gift className="w-5 h-5" />
                      <span className="font-semibold text-sm">7 dias grátis para testar</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formulário WhatsApp */}
          <div>
            <Card className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold text-slate-100">
                  Informe seu WhatsApp
                </CardTitle>
                <p className="text-slate-400 text-sm">
                  Enviaremos todas as informações do seu plano escolhido
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="whatsapp" className="text-slate-200 font-medium">
                      Número do WhatsApp *
                    </Label>
                    <div className="relative mt-2">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Phone className="w-5 h-5 text-slate-400" />
                      </div>
                      <Input
                        ref={inputRef}
                        id="whatsapp"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={whatsapp}
                        onChange={handleWhatsAppChange}
                        className="pl-10 bg-slate-800/50 border-slate-600 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                        maxLength={15}
                        autoFocus
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Formato: (DDD) 9XXXX-XXXX
                    </p>
                  </div>

                  {erro && (
                    <Alert className="border-red-500/30 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-400">
                        {erro}
                      </AlertDescription>
                    </Alert>
                  )}

                  {sucesso && (
                    <Alert className="border-green-500/30 bg-green-500/10">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-400">
                        {mensagemEnviada 
                          ? "✅ Mensagem enviada! Verifique seu WhatsApp e aguarde redirecionamento..."
                          : "✅ Solicitação processada! Veja a demonstração abaixo e aguarde redirecionamento..."
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {mostrarDemo && mensagemGerada && (
                    <WhatsAppDemo 
                      whatsapp={whatsapp}
                      mensagem={mensagemGerada}
                      onClose={() => navigate(`/login?modalidade=${modalidade}&whatsapp=${whatsapp.replace(/\D/g, '')}`)}
                    />
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !whatsapp || whatsapp.length < 14}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-slate-900 font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent"></div>
                        <span>Verificando número...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5" />
                        <span>Enviar Informações</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    🔒 Seu número será usado apenas para envio das informações do plano
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

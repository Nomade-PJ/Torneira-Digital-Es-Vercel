import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { WhatsAppService, WhatsAppSolicitacao } from "../lib/whatsapp-service"
import { Clock, MessageCircle, AlertTriangle, CheckCircle } from "lucide-react"

export default function TestesAtivos() {
  const [testes, setTestes] = useState<WhatsAppSolicitacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarTestes()
    const interval = setInterval(carregarTestes, 30000) // Atualizar a cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const carregarTestes = async () => {
    setLoading(true)
    try {
      const testesAtivos = await WhatsAppService.listarTestesAtivos()
      setTestes(testesAtivos)
    } catch (error) {
      console.error('Erro ao carregar testes:', error)
      setTestes([])
    } finally {
      setLoading(false)
    }
  }

  const formatarTempo = (dataString: string): string => {
    const agora = new Date()
    const data = new Date(dataString)
    const diferenca = data.getTime() - agora.getTime()
    
    if (diferenca <= 0) return "Expirado"
    
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24))
    const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (dias > 0) return `${dias}d ${horas}h restantes`
    return `${horas}h restantes`
  }

  const verificarTestesFinalizando = async () => {
    try {
      const finalizando = await WhatsAppService.verificarTestesFinalizando()
      if (finalizando.length > 0) {
        alert(`${finalizando.length} teste(s) finalizando em menos de 24h!`)
      } else {
        alert("Nenhum teste finalizando nas próximas 24h.")
      }
    } catch (error) {
      alert("Erro ao verificar testes finalizando.")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center space-x-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <span>Testes Gratuitos Ativos</span>
          <Badge variant="secondary">{testes.length}</Badge>
        </CardTitle>
        <Button 
          onClick={verificarTestesFinalizando}
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          Verificar Finalizando
        </Button>
      </CardHeader>
      
      <CardContent>
        {testes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum teste gratuito ativo no momento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testes.map((teste) => (
              <div 
                key={teste.id} 
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-slate-200">
                      {teste.whatsapp}
                    </span>
                  </div>
                  <Badge 
                    variant={
                      teste.data_fim_teste && new Date(teste.data_fim_teste).getTime() - Date.now() <= 24 * 60 * 60 * 1000 
                        ? "destructive" 
                        : "default"
                    }
                  >
                    {teste.data_fim_teste ? formatarTempo(teste.data_fim_teste) : 'Sem prazo'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Plano:</span>
                    <div className="font-medium text-slate-200 capitalize">
                      {teste.modalidade} - R$ {teste.preco_mensal.toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <div className="flex items-center space-x-1">
                      {teste.notificacao_enviada ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-green-400">Notificado</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span className="text-blue-400">Ativo</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-slate-500">
                  Início: {teste.data_inicio_teste ? new Date(teste.data_inicio_teste).toLocaleDateString('pt-BR') : 'N/A'} • 
                  Fim: {teste.data_fim_teste ? new Date(teste.data_fim_teste).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Alert, AlertDescription } from "./ui/alert"
import { 
  MessageCircle, 
  Check, 
  CheckCheck, 
  Phone, 
  ArrowRight,
  Copy,
  Eye
} from "lucide-react"

interface WhatsAppDemoProps {
  whatsapp: string
  mensagem: string
  onClose?: () => void
}

export default function WhatsAppDemo({ whatsapp, mensagem, onClose }: WhatsAppDemoProps) {
  const [mostrarDemo, setMostrarDemo] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const copiarMensagem = async () => {
    try {
      await navigator.clipboard.writeText(mensagem)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  const formatarWhatsApp = (numero: string) => {
    // Formatar como (99) 99999-9999
    const clean = numero.replace(/\D/g, '')
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
    }
    return numero
  }

  const horaAtual = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <div className="space-y-4">
      {/* Botão para mostrar demo */}
      <Button
        onClick={() => setMostrarDemo(!mostrarDemo)}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <Eye className="w-4 h-4 mr-2" />
        {mostrarDemo ? 'Ocultar' : 'Ver'} Demonstração da Mensagem
      </Button>

      {mostrarDemo && (
        <Card className="bg-slate-900/95 border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-400">
              <MessageCircle className="w-5 h-5" />
              <span>Demonstração: Como chegaria no WhatsApp</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* Simulação da interface do WhatsApp */}
              <div className="bg-green-100 rounded-lg p-4 border-l-4 border-green-500">
                {/* Cabeçalho do chat */}
                <div className="flex items-center space-x-3 mb-4 pb-2 border-b border-green-200">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-800">Torneira Digital</h3>
                    <p className="text-xs text-green-600">Sistema Automatizado</p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      {formatarWhatsApp(whatsapp)}
                    </Badge>
                  </div>
                </div>

                {/* Mensagem */}
                <div className="bg-white rounded-lg p-3 shadow-sm border">
                  <div className="text-gray-800 whitespace-pre-line text-sm">
                    {mensagem}
                  </div>
                  
                  {/* Footer da mensagem */}
                  <div className="flex items-center justify-end space-x-1 mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">{horaAtual}</span>
                    <CheckCheck className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Status */}
              <Alert className="border-green-500/30 bg-green-500/10">
                <AlertDescription className="text-green-300">
                  ✅ <strong>Mensagem preparada!</strong> Esta seria a exata aparência no WhatsApp do usuário.
                </AlertDescription>
              </Alert>

              {/* Ações */}
              <div className="flex space-x-2">
                <Button
                  onClick={copiarMensagem}
                  variant="outline"
                  className="flex-1 border-green-500/50 text-green-400"
                >
                  {copiado ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copiado ? 'Copiado!' : 'Copiar Mensagem'}
                </Button>
                
                {onClose && (
                  <Button
                    onClick={onClose}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Continuar
                  </Button>
                )}
              </div>

              {/* Informação técnica */}
              <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded">
                <strong>📊 Informações Técnicas:</strong><br/>
                <strong>Destinatário:</strong> +55 {whatsapp}<br/>
                <strong>Tamanho:</strong> {mensagem.length} caracteres<br/>
                <strong>Encoding:</strong> UTF-8 com emojis<br/>
                <strong>Status:</strong> Pronto para envio via API<br/>
                <strong>Fallback:</strong> Sistema de simulação ativo
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

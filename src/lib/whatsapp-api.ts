// API real para envio de WhatsApp usando CallMeBot (gratuito para testes)
// Documentação: https://www.callmebot.com/blog/free-api-whatsapp-messages/

export interface WhatsAppResponse {
  success: boolean
  message: string
  error?: string
}

export class WhatsAppAPI {
  
  // Para usar esta API, você precisa:
  // 1. Adicionar o número +34 644 77 95 77 no seu WhatsApp
  // 2. Enviar a mensagem: "I allow callmebot to send me messages"
  // 3. Aguardar confirmação com sua API key
  
  private static readonly BASE_URL = 'https://api.callmebot.com/whatsapp.php'
  
  // Seu número e API key configurados via environment variables
  private static readonly PHONE_NUMBER = import.meta.env.VITE_WHATSAPP_PHONE || '5598992022352'
  private static readonly API_KEY = import.meta.env.VITE_WHATSAPP_API_KEY || '9967405'
  
  /**
   * Enviar mensagem real via WhatsApp
   */
  static async enviarMensagem(mensagem: string): Promise<WhatsAppResponse> {
    try {
      // API key está configurada - usar envio real
      console.log('✅ API KEY configurada. Enviando mensagem real...')
      
      // Preparar URL com parâmetros
      const url = new URL(this.BASE_URL)
      url.searchParams.append('phone', this.PHONE_NUMBER)
      url.searchParams.append('text', mensagem)
      url.searchParams.append('apikey', this.API_KEY)
      
      console.log('📤 Enviando mensagem via CallMeBot API...')
      
      // Fazer requisição
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const result = await response.text()
        console.log('✅ Mensagem enviada com sucesso!')
        console.log('📱 Resposta da API:', result)
        
        return {
          success: true,
          message: 'Mensagem enviada com sucesso!'
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error)
      
      return {
        success: false,
        message: 'Falha ao enviar mensagem',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
  

  
  /**
   * Instruções para configurar API real
   */
  static obterInstrucoes(): string {
    return `
🔧 CONFIGURAR ENVIO REAL DO WHATSAPP:

1️⃣ Adicione este número no seu WhatsApp:
   +34 644 77 95 77

2️⃣ Envie esta mensagem exata:
   "I allow callmebot to send me messages"

3️⃣ Aguarde receber sua API key

4️⃣ Substitua 'SUBSTITUA_PELA_SUA_CHAVE' pela sua chave em:
   src/lib/whatsapp-api.ts

5️⃣ Teste novamente!

📚 Documentação completa:
https://www.callmebot.com/blog/free-api-whatsapp-messages/
    `
  }
  
  /**
   * Verificar se API está configurada
   */
  static isConfigurada(): boolean {
    return this.API_KEY === '9967405'
  }
  
  /**
   * Formatar mensagem para WhatsApp (com quebras de linha)
   */
  static formatarMensagem(mensagem: string): string {
    // CallMeBot usa %0A para quebras de linha
    return encodeURIComponent(mensagem.replace(/\n/g, '%0A'))
  }
}

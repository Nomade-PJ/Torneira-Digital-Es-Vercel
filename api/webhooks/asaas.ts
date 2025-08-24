// Vercel Function para webhook do Asaas
// Processa notificações de pagamento em tempo real

// Tipos básicos para Request/Response
interface VercelRequest {
  method?: string
  body: any
  query: { [key: string]: string | string[] | undefined }
  headers: { [key: string]: string | string[] | undefined }
}

interface VercelResponse {
  status: (code: number) => VercelResponse
  json: (data: any) => void
  end: () => void
  setHeader: (name: string, value: string) => void
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Só aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Log da requisição para debug
    console.log('📥 Webhook Asaas recebido:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    })

    // Validar se tem dados
    if (!req.body || !req.body.event) {
      console.error('❌ Webhook sem dados válidos')
      return res.status(400).json({ error: 'Invalid webhook data' })
    }

    const { event, payment } = req.body

    // Validar evento
    if (!payment || !payment.id) {
      console.error('❌ Webhook sem dados de pagamento')
      return res.status(400).json({ error: 'Missing payment data' })
    }

    // Por enquanto só loggar - implementaremos processamento depois
    console.log('📝 Webhook processado (log only):', {
      event,
      paymentId: payment.id,
      status: payment.status
    })

    // Resposta de sucesso (importante para o Asaas saber que recebemos)
    res.status(200).json({ 
      received: true,
      event,
      paymentId: payment.id,
      processedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error)
    
    // Retornar erro 500 para que o Asaas tente reenviar
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}

// Webhook Handler para Asaas
// Processa notificações de pagamento em tempo real

import { NextApiRequest, NextApiResponse } from 'next'
import { asaasService } from '../../../src/lib/asaas-service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Processar webhook
    await asaasService.processWebhook(payment)

    console.log('✅ Webhook processado com sucesso:', {
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

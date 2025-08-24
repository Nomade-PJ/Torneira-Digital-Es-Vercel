// Vercel Function para verificar status de pagamento no Asaas
// Evita problemas de CORS

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { paymentId } = req.query
    
    if (!paymentId || typeof paymentId !== 'string') {
      return res.status(400).json({ error: 'Payment ID is required' })
    }

    const asaasApiKey = process.env.VITE_ASAAS_API_KEY
    const asaasEnvironment = process.env.VITE_ASAAS_ENVIRONMENT || 'sandbox'
    
    if (!asaasApiKey) {
      console.error('❌ API Key do Asaas não configurada')
      return res.status(500).json({ error: 'API Key not configured' })
    }
    
    const baseURL = asaasEnvironment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3'

    console.log('🔧 Verificando status do pagamento via Vercel Function:', paymentId)

    const response = await fetch(`${baseURL}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro na API Asaas:', data)
      return res.status(response.status).json(data)
    }

    console.log('✅ Status obtido:', data.status)
    res.status(200).json(data)

  } catch (error: any) {
    console.error('❌ Erro ao verificar status:', error)
    res.status(500).json({ error: 'Failed to get payment status', details: error.message })
  }
}

// Vercel Function para criar pagamentos no Asaas
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Tentar diferentes formatos de variáveis de ambiente
    const asaasApiKey = process.env.VITE_ASAAS_API_KEY || process.env.ASAAS_API_KEY
    const asaasEnvironment = process.env.VITE_ASAAS_ENVIRONMENT || process.env.ASAAS_ENVIRONMENT || 'sandbox'
    
    if (!asaasApiKey) {
      console.error('❌ API Key do Asaas não configurada')
      return res.status(500).json({ error: 'API Key not configured' })
    }
    
    const baseURL = asaasEnvironment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3'

    console.log('🔧 Criando pagamento no Asaas via Vercel Function')

    const response = await fetch(`${baseURL}/payments`, {
      method: 'POST',
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro na API Asaas:', data)
      return res.status(response.status).json(data)
    }

    console.log('✅ Pagamento criado:', data.id)
    res.status(200).json(data)

  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento:', error)
    res.status(500).json({ error: 'Failed to create payment', details: error.message })
  }
}

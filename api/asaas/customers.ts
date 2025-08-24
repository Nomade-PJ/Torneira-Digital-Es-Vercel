// Vercel Function para criar customers no Asaas
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
    
    // Debug detalhado
    console.log('🔧 Debug Vercel Function:', {
      hasApiKey: !!asaasApiKey,
      apiKeyLength: asaasApiKey?.length || 0,
      environment: asaasEnvironment,
      bodyReceived: req.body
    })
    
    if (!asaasApiKey) {
      console.error('❌ API Key do Asaas não configurada')
      return res.status(500).json({ 
        error: 'API Key not configured',
        debug: {
          hasApiKey: false,
          envVars: Object.keys(process.env).filter(k => k.includes('ASAAS'))
        }
      })
    }
    
    const baseURL = asaasEnvironment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3'

    console.log('🔧 Criando customer no Asaas via Vercel Function:', {
      baseURL,
      hasData: !!req.body
    })

    const response = await fetch(`${baseURL}/customers`, {
      method: 'POST',
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro na API Asaas:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        url: `${baseURL}/customers`,
        headers: {
          'access_token': asaasApiKey ? `${asaasApiKey.substring(0, 20)}...` : 'missing'
        }
      })
      return res.status(response.status).json({
        error: 'Asaas API Error',
        details: data,
        debug: {
          status: response.status,
          url: `${baseURL}/customers`
        }
      })
    }

    console.log('✅ Customer criado:', data.id)
    res.status(200).json(data)

  } catch (error: any) {
    console.error('❌ Erro ao criar customer:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    res.status(500).json({ 
      error: 'Failed to create customer', 
      details: error.message,
      type: error.name
    })
  }
}

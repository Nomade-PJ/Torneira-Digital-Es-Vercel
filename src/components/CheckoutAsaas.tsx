import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  CreditCard, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Copy,
  Clock,
  Shield
} from 'lucide-react'
import { useToast } from './ui/use-toast'
import { asaasService, AsaasUtils } from '../lib/asaas-service'

interface CheckoutAsaasProps {
  isOpen: boolean
  onClose: () => void
  plano: {
    id: string
    nome: string
    preco_mensal: number
    preco_total: number
    duracao_meses: number
    desconto_percentual: number
  }
  onPaymentSuccess: (assinaturaId: string, userData?: any) => void
}

interface FormData {
  // Dados pessoais
  nomeCompleto: string
  email: string
  telefone: string
  cpfCnpj: string
  
  // Endereço
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string

  // Dados do cartão
  nomeCartao: string
  numeroCartao: string
  validadeMM: string
  validadeAA: string
  cvv: string
  parcelas?: number
}

interface PixData {
  qrCodeImage: string
  copyPasteCode: string
  expirationDate: string
}

export default function CheckoutAsaas({ isOpen, onClose, plano, onPaymentSuccess }: CheckoutAsaasProps) {
  const { toast } = useToast()
  
  // Estados principais com linha do tempo
  const [step, setStep] = useState<'method' | 'form' | 'card_data' | 'processing' | 'pix' | 'success' | 'error'>('method')
  const [processingMessage, setProcessingMessage] = useState('Processando...')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao_credito'>('pix')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  
  // Dados do formulário (NOVA LÓGICA: Sempre vazio para novos usuários)
  const [formData, setFormData] = useState<FormData>({
    nomeCompleto: '',
    email: '',
    telefone: '',
    cpfCnpj: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    nomeCartao: '',
    numeroCartao: '',
    validadeMM: '',
    validadeAA: '',
    cvv: ''
  })
  
  // Dados do PIX
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'checking' | 'confirmed'>('waiting')

  // Definição dos passos da timeline - dinâmica baseada no método de pagamento
  const getTimelineSteps = () => {
    const baseSteps = [
      { 
        id: 'method',
        title: 'Método', 
        description: 'Escolher pagamento',
        icon: '💳',
        number: 1
      },
      { 
        id: 'form',
        title: 'Dados', 
        description: 'Suas informações',
        icon: '👤',
        number: 2
      }
    ]
    
    // Terceira etapa muda baseada no método
    if (paymentMethod === 'pix') {
      baseSteps.push({
        id: 'processing',
        title: 'Gerando PIX',
        description: 'QR Code e código',
        icon: '📱',
        number: 3
      })
    } else {
      baseSteps.push({
        id: 'card_data',
        title: 'Cartão',
        description: 'Dados do pagamento',
        icon: '💳',
        number: 3
      })
      baseSteps.push({
        id: 'processing',
        title: 'Processando',
        description: 'Validando cartão',
        icon: '⚡',
        number: 4
      })
    }
    
    // Última etapa sempre é sucesso
    baseSteps.push({
      id: 'success',
      title: 'Finalizado',
      description: 'Pronto!',
      icon: '✅',
      number: paymentMethod === 'pix' ? 4 : 5
    })
    
    return baseSteps
  }
  
  const timelineSteps = getTimelineSteps()

  // Timer para PIX
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (pixData && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setError('PIX expirado. Gere um novo código.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [pixData, timeLeft])

  // Formatadores
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
    }
    return value.slice(0, 15)
  }

  const formatCpfCnpj = (value: string) => {
    return AsaasUtils.formatCpfCnpj(value)
  }

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{4})/g, '$1 ').trim().slice(0, 19)
  }

  const formatCardExpiry = (value: string, field: 'MM' | 'AA') => {
    const numbers = value.replace(/\D/g, '')
    if (field === 'MM') {
      const month = parseInt(numbers)
      if (month > 12) return '12'
      return numbers.slice(0, 2)
    }
    return numbers.slice(0, 2)
  }

  // Handlers de input
  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value

    switch (field) {
      case 'telefone':
        formattedValue = formatPhone(value)
        break
      case 'cpfCnpj':
        formattedValue = formatCpfCnpj(value)
        break
      case 'numeroCartao':
        formattedValue = formatCardNumber(value)
        break
      case 'validadeMM':
        formattedValue = formatCardExpiry(value, 'MM')
        break
      case 'validadeAA':
        formattedValue = formatCardExpiry(value, 'AA')
        break
      case 'cvv':
        formattedValue = value.replace(/\D/g, '').slice(0, 4)
        break
      case 'cep':
        formattedValue = value.replace(/\D/g, '').slice(0, 8)
        if (formattedValue.length === 8) {
          buscarCep(formattedValue)
        }
        break
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }))
  }

  // Buscar CEP
  const buscarCep = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }))
      }
    } catch (error) {
      console.warn('Erro ao buscar CEP:', error)
    }
  }

  // Validações inline no processamento

  // Processar pagamento - PLANO B: SEM CRIAÇÃO DE USUÁRIO
  const processPayment = async () => {
    setLoading(true)
    setError(null)
    setStep('processing')
    
    try {
      // 🎯 PLANO B: PULAR criação de usuário no Supabase
      // O usuário será criado pelo WEBHOOK quando o pagamento for confirmado
      
      setProcessingMessage('Preparando pagamento...')
      console.log('🚀 Iniciando checkout SIMPLIFICADO (Plano B)')
      
      // Salvar dados temporariamente no localStorage para o webhook usar
      const checkoutData = {
        nome: formData.nomeCompleto,
        email: formData.email,
        telefone: formData.telefone.replace(/\D/g, ''),
        cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''),
        planoId: plano.id,
        timestamp: new Date().toISOString()
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('checkoutData', JSON.stringify(checkoutData))
        console.log('💾 Dados salvos no localStorage para webhook processar')
      }

      // 2. Criar customer no Asaas
      setProcessingMessage('Configurando pagamento...')
      const customerData = {
        name: formData.nomeCompleto,
        email: formData.email,
        phone: formData.telefone.replace(/\D/g, ''),
        mobilePhone: formData.telefone.replace(/\D/g, ''),
        cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''),
        postalCode: formData.cep.replace(/\D/g, ''),
        address: formData.endereco,
        addressNumber: formData.numero,
        complement: formData.complemento,
        province: formData.bairro,
        city: formData.cidade,
        state: formData.estado,
        country: 'Brasil'
      }

      const customerId = await asaasService.createOrGetCustomer(customerData)

      // 2. PLANO B: PULAR criação de assinatura no banco
      // Será criada pelo webhook quando pagamento for confirmado
      console.log('⏭️ Pulando criação de assinatura (será feita pelo webhook)')

      // 3. Criar pagamento no Asaas
      setProcessingMessage('Processando pagamento...')
      const paymentData = {
        customer: customerId,
        billingType: paymentMethod === 'cartao_credito' ? 'CREDIT_CARD' as const : 'PIX' as const,
        value: plano.preco_total,
        dueDate: new Date().toISOString().split('T')[0],
        description: `Assinatura ${plano.nome} - Torneira Digital`,
        externalReference: `temp_${Date.now()}`, // ID temporário para o webhook
        ...(paymentMethod === 'cartao_credito' && {
          creditCard: {
            holderName: formData.nomeCartao,
            number: formData.numeroCartao.replace(/\D/g, ''),
            expiryMonth: formData.validadeMM,
            expiryYear: `20${formData.validadeAA}`,
            ccv: formData.cvv
          },
          creditCardHolderInfo: {
            name: formData.nomeCompleto,
            email: formData.email,
            cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''),
            postalCode: formData.cep.replace(/\D/g, ''),
            addressNumber: formData.numero,
            addressComplement: formData.complemento,
            phone: formData.telefone.replace(/\D/g, ''),
            mobilePhone: formData.telefone.replace(/\D/g, '')
          }
        })
      }

      const payment = await asaasService.createPayment(paymentData)

      // 4. PLANO B: PULAR criação de transação no banco
      // Será criada pelo webhook quando pagamento for confirmado
      console.log('⏭️ Pulando criação de transação (será feita pelo webhook)')
      
      // Salvar dados do pagamento no localStorage para o webhook
      const paymentData_temp = {
        asaas_payment_id: payment.id,
        valor: plano.preco_total,
        metodo_pagamento: paymentMethod,
        data_vencimento: payment.dueDate,
        pix_qr_code: payment.pixQrCodeImage || null,
        pix_chave_copia_cola: payment.pixCopyAndPaste || null,
        webhook_data: payment
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('paymentData', JSON.stringify(paymentData_temp))
      }

      // 5. Processar resultado
      if (paymentMethod === 'pix') {
        setPixData({
          qrCodeImage: payment.pixQrCodeImage!,
          copyPasteCode: payment.pixCopyAndPaste!,
          expirationDate: payment.pixTransaction?.qrCode?.expirationDate || ''
        })
        
        // Calcular tempo restante
        const expiry = new Date(payment.pixTransaction?.qrCode?.expirationDate || '')
        const now = new Date()
        setTimeLeft(Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000)))
        
        setStep('pix')
        startPaymentCheck(payment.id, `temp_${Date.now()}`)
      } else if (paymentMethod === 'cartao_credito') {
        if (payment.status === 'CONFIRMED') {
          setStep('success')
          onPaymentSuccess(`temp_${Date.now()}`)
        } else {
          setError('Cartão recusado. Tente novamente.')
        }
      }

    } catch (error: any) {
      console.error('Erro no pagamento:', error)
      setError(error.message || 'Erro ao processar pagamento')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  // Verificar status do pagamento PIX
  const startPaymentCheck = (paymentId: string, assinaturaId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await asaasService.getPaymentStatus(paymentId)
        
        if (status.status === 'RECEIVED' || status.status === 'CONFIRMED') {
          clearInterval(interval)
          setPaymentStatus('confirmed')
          setStep('success')
          
          // Chamar callback de sucesso
          onPaymentSuccess(assinaturaId, {
            email: formData.email,
            nome: formData.nomeCompleto
          })
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error)
      }
    }, 3000) // Verificar a cada 3 segundos

    // Parar verificação após 10 minutos
    setTimeout(() => clearInterval(interval), 600000)
  }

  // Copiar código PIX
  const copyPixCode = () => {
    if (pixData?.copyPasteCode) {
      navigator.clipboard.writeText(pixData.copyPasteCode)
      toast({
        title: '✅ Código Copiado',
        description: 'Cole no seu app de banco para pagar'
      })
    }
  }

  // Formatar tempo restante
  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Reset estado
  const resetState = () => {
    setStep('method')
    setPaymentMethod('pix')
    setError(null)
    setPixData(null)
    setPaymentStatus('waiting')
    setTimeLeft(0)
  }

  // Fechar modal
  const handleClose = () => {
    resetState()
    onClose()
  }

  // Função para atualizar o índice da timeline baseado no step atual
  const updateTimelineStep = (currentStep: string) => {
    const stepIndex = timelineSteps.findIndex(s => s.id === currentStep)
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex)
    }
  }

  // Atualizar timeline quando step mudar
  useEffect(() => {
    updateTimelineStep(step)
  }, [step])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span>Checkout Seguro - {plano.nome}</span>
          </DialogTitle>
        </DialogHeader>

        {/* 📋 TIMELINE SIMPLES E PROFISSIONAL */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Progresso do Checkout
            </h3>
            <span className="text-sm text-gray-500">
              {currentStepIndex + 1} de {timelineSteps.length}
            </span>
          </div>
          
          {/* Timeline Horizontal Simples */}
          <div className="flex items-center justify-between">
            {timelineSteps.map((timelineStep, index) => {
              const isCompleted = index < currentStepIndex
              const isActive = index === currentStepIndex
              const isLast = index === timelineSteps.length - 1
              
              return (
                <div key={timelineStep.id} className="flex items-center flex-1">
                  {/* Círculo do Step */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                        ${isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : isActive
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                        }
                      `}
                    >
                      {isCompleted ? '✓' : timelineStep.number}
                    </div>
                    
                    {/* Título e descrição */}
                    <div className="text-center mt-2">
                      <p className={`text-xs font-medium ${
                        isCompleted 
                          ? 'text-green-700' 
                          : isActive 
                          ? 'text-blue-700'
                          : 'text-gray-500'
                      }`}>
                        {timelineStep.title}
                      </p>
                      <p className={`text-xs ${
                        isCompleted 
                          ? 'text-green-600' 
                          : isActive 
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}>
                        {timelineStep.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Linha conectora */}
                  {!isLast && (
                    <div className="flex-1 h-0.5 mx-4 bg-gray-200">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStepIndex / (timelineSteps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Resumo do Plano */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{plano.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {AsaasUtils.formatCurrency(plano.preco_mensal)}/mês
                </div>
                {plano.desconto_percentual > 0 && (
                  <div className="text-sm text-gray-500">
                    Total: {AsaasUtils.formatCurrency(plano.preco_total)} 
                    <Badge className="ml-2 bg-green-500">{plano.desconto_percentual}% OFF</Badge>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">{plano.duracao_meses} meses</div>
                <div className="font-semibold">
                  Economia: {AsaasUtils.formatCurrency((plano.preco_mensal * plano.duracao_meses) - plano.preco_total)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert className="mb-4 border-red-500 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Seleção do Método */}
        {step === 'method' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Escolha como pagar:</h3>
            
            {/* PIX */}
            <Card 
              className={`cursor-pointer transition-all ${paymentMethod === 'pix' ? 'ring-4 ring-green-500 bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 shadow-xl' : 'hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 hover:shadow-lg border-gray-200'} rounded-xl`}
              onClick={() => setPaymentMethod('pix')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <QrCode className={`w-6 h-6 ${paymentMethod === 'pix' ? 'text-green-700' : 'text-green-600'}`} />
                    <div>
                      <div className={`font-semibold ${paymentMethod === 'pix' ? 'text-green-900 font-bold' : 'text-slate-900'}`}>PIX</div>
                      <div className={`text-sm ${paymentMethod === 'pix' ? 'text-green-800 font-medium' : 'text-gray-500'}`}>Pagamento instantâneo</div>
                    </div>
                  </div>
                  <Badge className={`${paymentMethod === 'pix' ? 'bg-green-600 text-white font-bold' : 'bg-green-500'}`}>Mais barato</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Cartão de Crédito */}
            <Card 
              className={`cursor-pointer transition-all ${paymentMethod === 'cartao_credito' ? 'ring-4 ring-blue-500 bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-400 shadow-xl' : 'hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 hover:shadow-lg border-gray-200'} rounded-xl`}
              onClick={() => setPaymentMethod('cartao_credito')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className={`w-6 h-6 ${paymentMethod === 'cartao_credito' ? 'text-blue-700' : 'text-blue-600'}`} />
                    <div>
                      <div className={`font-semibold ${paymentMethod === 'cartao_credito' ? 'text-blue-900 font-bold' : 'text-slate-900'}`}>Cartão de Crédito</div>
                      <div className={`text-sm ${paymentMethod === 'cartao_credito' ? 'text-blue-800 font-medium' : 'text-gray-500'}`}>Aprovação instantânea</div>
                    </div>
                  </div>
                  <Badge className={`${paymentMethod === 'cartao_credito' ? 'bg-blue-600 text-white font-bold' : 'border-blue-300 text-blue-600'}`} variant={paymentMethod === 'cartao_credito' ? 'default' : 'outline'}>Parcelável</Badge>
                </div>
              </CardContent>
            </Card>



            <Button 
              onClick={() => setStep('form')} 
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-xl border-2 border-green-400/40 hover:border-green-300/60 transition-all duration-200 hover:shadow-2xl hover:scale-105"
            >
              Continuar com {paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
            </Button>
          </div>
        )}

        {/* Step 2: Formulário */}
        {step === 'form' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Dados para pagamento</h3>
              <Button variant="outline" onClick={() => setStep('method')}>
                ← Voltar
              </Button>
            </div>

            {/* Dados Pessoais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
                <Input
                  id="cpfCnpj"
                  value={formData.cpfCnpj}
                  onChange={(e) => handleInputChange('cpfCnpj', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua, Avenida..."
                />
              </div>
              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  placeholder="123"
                />
              </div>
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                  placeholder="Apto, Sala..."
                />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  placeholder="Centro"
                />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>



            <Button 
              onClick={() => {
                // Se for PIX, vai direto para processamento
                if (paymentMethod === 'pix') {
                  processPayment()
                } else {
                  // Se for cartão, vai para a etapa de dados do cartão
                  setStep('card_data')
                }
              }}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-xl border-2 border-green-400/40 hover:border-green-300/60 transition-all duration-200 hover:shadow-2xl disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : paymentMethod === 'pix' ? (
                <>
                  Gerar PIX - {AsaasUtils.formatCurrency(plano.preco_total)} 📱
                </>
              ) : (
                <>
                  Próximo: Dados do Cartão 🔒
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 3: Dados do Cartão */}
        {step === 'card_data' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                🔒 Dados do Cartão de Crédito
              </h3>
              <Button variant="outline" onClick={() => setStep('form')}>
                ← Voltar
              </Button>
            </div>

            {/* Campos específicos do cartão */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="numero_cartao" className="text-gray-700 font-medium">Número do Cartão</Label>
                <Input
                  id="numero_cartao"
                  placeholder="1234 5678 9012 3456"
                  value={formData.numeroCartao}
                  onChange={(e) => {
                    // Formatar número do cartão (adicionar espaços)
                    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
                    value = value.replace(/(.{4})/g, '$1 ').trim()
                    if (value.length <= 19) { // 16 dígitos + 3 espaços
                      setFormData({...formData, numeroCartao: value})
                    }
                  }}
                  className="h-12 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500"
                  maxLength={19}
                />
              </div>

              <div>
                <Label htmlFor="nome_cartao" className="text-gray-700 font-medium">Nome no Cartão</Label>
                <Input
                  id="nome_cartao"
                  placeholder="NOME CONFORME IMPRESSO NO CARTÃO"
                  value={formData.nomeCartao}
                  onChange={(e) => setFormData({...formData, nomeCartao: e.target.value.toUpperCase()})}
                  className="h-12 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validade" className="text-gray-700 font-medium">Validade</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="validadeMM"
                      placeholder="MM"
                      value={formData.validadeMM}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        if (value.length <= 2 && parseInt(value) <= 12) {
                          setFormData({...formData, validadeMM: value})
                        }
                      }}
                      className="h-12 text-center bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500"
                      maxLength={2}
                    />
                    <Input
                      id="validadeAA"
                      placeholder="AA"
                      value={formData.validadeAA}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        if (value.length <= 2) {
                          setFormData({...formData, validadeAA: value})
                        }
                      }}
                      className="h-12 text-center bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cvv" className="text-gray-700 font-medium">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={formData.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 3) {
                        setFormData({...formData, cvv: value})
                      }
                    }}
                    className="h-12 text-center bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500"
                    maxLength={3}
                  />
                </div>
              </div>

              {/* Parcelamento */}
              <div>
                <Label htmlFor="parcelas" className="text-gray-700 font-medium">Parcelamento</Label>
                <select
                  id="parcelas"
                  value={formData.parcelas || 1}
                  onChange={(e) => setFormData({...formData, parcelas: parseInt(e.target.value)})}
                  className="w-full h-12 px-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value={1} className="text-gray-900 bg-white">1x de {AsaasUtils.formatCurrency(plano.preco_total)} (sem juros)</option>
                  <option value={2} className="text-gray-900 bg-white">2x de {AsaasUtils.formatCurrency(plano.preco_total / 2)} (sem juros)</option>
                  <option value={3} className="text-gray-900 bg-white">3x de {AsaasUtils.formatCurrency(plano.preco_total / 3)} (sem juros)</option>
                  <option value={4} className="text-gray-900 bg-white">4x de {AsaasUtils.formatCurrency(plano.preco_total / 4)} (sem juros)</option>
                  <option value={5} className="text-gray-900 bg-white">5x de {AsaasUtils.formatCurrency(plano.preco_total / 5)} (sem juros)</option>
                  <option value={6} className="text-gray-900 bg-white">6x de {AsaasUtils.formatCurrency(plano.preco_total / 6)} (sem juros)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💳 Sem juros nas primeiras 6 parcelas
                </p>
              </div>
            </div>

            {/* Botão para processar pagamento */}
            <Button 
              onClick={processPayment}
              disabled={loading || !formData.numeroCartao || !formData.nomeCartao || !formData.validadeMM || !formData.validadeAA || !formData.cvv}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-xl border-2 border-green-400/40 hover:border-green-300/60 transition-all duration-200 hover:shadow-2xl disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Finalizar Pagamento - {AsaasUtils.formatCurrency(plano.preco_total)} 💳
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 4: Processamento */}
        {step === 'processing' && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">
                Criando sua conta...
              </h3>
              <p className="text-gray-600">
                {processingMessage}
              </p>
            </div>

            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Criando conta no sistema</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Configurando pagamento</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Finalizando assinatura</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: PIX */}
        {step === 'pix' && pixData && (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-semibold">
                Tempo restante: {formatTimeLeft(timeLeft)}
              </span>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <img 
                src={pixData.qrCodeImage} 
                alt="QR Code PIX" 
                className="mx-auto mb-4 max-w-[200px]"
              />
              
              <div className="space-y-3">
                <Label>Código PIX (Copiar e Colar):</Label>
                <div className="flex">
                  <Input 
                    value={pixData.copyPasteCode}
                    readOnly
                    className="text-xs"
                  />
                  <Button 
                    onClick={copyPixCode}
                    variant="outline"
                    className="ml-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Escaneie o QR Code ou copie e cole o código no seu app de banco.
                Aguardando confirmação do pagamento...
              </AlertDescription>
            </Alert>

            {paymentStatus === 'checking' && (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando pagamento...</span>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Sucesso */}
        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">
                Conta Criada com Sucesso!
              </h3>
              <p className="text-gray-600">
                Sua conta foi criada e o plano {plano.nome} foi ativado.
                Faça login para acessar o sistema completo.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg text-sm">
              <p className="text-green-800 font-medium">📧 Próximos passos:</p>
              <ul className="text-green-700 mt-2 space-y-1">
                <li>1. Faça login com o email: <strong>{formData.email}</strong></li>
                <li>2. Crie uma senha segura</li>
                <li>3. Comece a usar o sistema</li>
              </ul>
            </div>

            <Button 
              onClick={handleClose}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-xl border-2 border-green-400/40 hover:border-green-300/60 transition-all duration-200 hover:shadow-2xl hover:scale-105"
            >
              Ir para Login
            </Button>
          </div>
        )}

        {/* Step 5: Erro */}
        {step === 'error' && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">
                Erro no Pagamento
              </h3>
              <p className="text-gray-600">
                {error}
              </p>
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => setStep('method')}
                className="flex-1"
              >
                Tentar Novamente
              </Button>
              <Button 
                onClick={handleClose}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

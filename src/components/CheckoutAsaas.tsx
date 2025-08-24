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
import { useAuthContext } from './providers/auth-provider'
import { useToast } from './ui/use-toast'
import { asaasService, AsaasUtils } from '../lib/asaas-service'
import { supabase } from '../lib/supabase'

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
}

interface PixData {
  qrCodeImage: string
  copyPasteCode: string
  expirationDate: string
}

export default function CheckoutAsaas({ isOpen, onClose, plano, onPaymentSuccess }: CheckoutAsaasProps) {
  const { user } = useAuthContext()
  const { toast } = useToast()
  
  // Estados principais
  const [step, setStep] = useState<'method' | 'form' | 'processing' | 'pix' | 'success' | 'error'>('method')
  const [processingMessage, setProcessingMessage] = useState('Processando...')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao_credito'>('pix')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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

  // Processar pagamento
  const processPayment = async () => {
    setLoading(true)
    setError(null)
    setStep('processing')
    
    try {
      // 1. NOVA LÓGICA: Criar conta de usuário primeiro (se não existir)
      let userId = user?.id
      
      if (!user) {
        setProcessingMessage('Criando sua conta...')
        console.log('👤 Criando nova conta de usuário...')
        
        // Verificar se email já existe
        const { data: existingUser } = await supabase
          .from('usuarios')
          .select('id')
          .eq('email', formData.email)
          .single()

        if (existingUser) {
          setError('Este email já possui uma conta. Faça login primeiro.')
          setStep('error')
          return
        }

        // Criar usuário temporário no Supabase (sem auth ainda)
        const { data: newUser, error: userError } = await supabase
          .from('usuarios')
          .insert({
            nome: formData.nomeCompleto,
            email: formData.email,
            telefone: formData.telefone.replace(/\D/g, ''),
            cnpj_cpf: formData.cpfCnpj.replace(/\D/g, ''),
            nome_completo: formData.nomeCompleto,
            role: 'admin' // Todos são admin da própria conta
          })
          .select()
          .single()

        if (userError) {
          console.error('Erro ao criar usuário:', userError)
          setError('Erro ao criar conta. Tente novamente.')
          setStep('error')
          return
        }

        userId = newUser.id
        console.log('✅ Usuário criado:', newUser.id)
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

      // 3. Criar assinatura no banco
      const { data: assinatura, error: assinaturaError } = await supabase
        .from('assinaturas')
        .insert({
          usuario_id: userId,
          plano_id: plano.id,
          asaas_customer_id: customerId,
          status: 'pendente',
          valor_mensal: plano.preco_mensal,
          valor_total: plano.preco_total,
          desconto_percentual: plano.desconto_percentual,
          metodo_pagamento_preferido: paymentMethod
        })
        .select()
        .single()

      if (assinaturaError) throw assinaturaError

      // 3. Criar pagamento no Asaas
      setProcessingMessage('Processando pagamento...')
      const paymentData = {
        customer: customerId,
        billingType: paymentMethod === 'cartao_credito' ? 'CREDIT_CARD' as const : 'PIX' as const,
        value: plano.preco_total,
        dueDate: new Date().toISOString().split('T')[0],
        description: `Assinatura ${plano.nome} - Torneira Digital`,
        externalReference: assinatura.id,
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

      // 4. Salvar transação no banco
      await supabase
        .from('transacoes_asaas')
        .insert({
          assinatura_id: assinatura.id,
          asaas_payment_id: payment.id,
          valor: plano.preco_total,
          status: 'pending',
          metodo_pagamento: paymentMethod,
          data_vencimento: payment.dueDate,
          pix_qr_code: payment.pixQrCodeImage || null,
          pix_chave_copia_cola: payment.pixCopyAndPaste || null,
          pix_expires_at: payment.pixTransaction?.qrCode?.expirationDate || null,
          cartao_bandeira: payment.creditCard?.creditCardBrand || null,
          cartao_ultimos_digitos: payment.creditCard?.creditCardNumber?.slice(-4) || null,

          webhook_data: payment
        })

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
        startPaymentCheck(payment.id, assinatura.id)
      } else if (paymentMethod === 'cartao_credito') {
        if (payment.status === 'CONFIRMED') {
          setStep('success')
          onPaymentSuccess(assinatura.id)
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span>Checkout Seguro - {plano.nome}</span>
          </DialogTitle>
        </DialogHeader>

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

            {/* Dados do Cartão (apenas se cartão selecionado) */}
            {paymentMethod === 'cartao_credito' && (
              <div className="border-t pt-6">
                <h4 className="text-md font-semibold mb-4">Dados do Cartão</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="nomeCartao">Nome no Cartão *</Label>
                    <Input
                      id="nomeCartao"
                      value={formData.nomeCartao}
                      onChange={(e) => handleInputChange('nomeCartao', e.target.value.toUpperCase())}
                      placeholder="NOME COMO NO CARTÃO"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="numeroCartao">Número do Cartão *</Label>
                    <Input
                      id="numeroCartao"
                      value={formData.numeroCartao}
                      onChange={(e) => handleInputChange('numeroCartao', e.target.value)}
                      placeholder="0000 0000 0000 0000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="validadeMM">Mês *</Label>
                    <Input
                      id="validadeMM"
                      value={formData.validadeMM}
                      onChange={(e) => handleInputChange('validadeMM', e.target.value)}
                      placeholder="MM"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validadeAA">Ano *</Label>
                    <Input
                      id="validadeAA"
                      value={formData.validadeAA}
                      onChange={(e) => handleInputChange('validadeAA', e.target.value)}
                      placeholder="AA"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      placeholder="000"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={processPayment}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-xl border-2 border-green-400/40 hover:border-green-300/60 transition-all duration-200 hover:shadow-2xl disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Finalizar Pagamento - {AsaasUtils.formatCurrency(plano.preco_total)}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 3: Processamento */}
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

        {/* Step 4: PIX */}
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

        {/* Step 5: Sucesso */}
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

import { z } from "zod"

// Função para validar CPF
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/[^\d]/g, "")
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let digit1 = 11 - (sum % 11)
  if (digit1 > 9) digit1 = 0
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  let digit2 = 11 - (sum % 11)
  if (digit2 > 9) digit2 = 0
  
  return (
    parseInt(cleanCPF.charAt(9)) === digit1 &&
    parseInt(cleanCPF.charAt(10)) === digit2
  )
}

// Função para validar CNPJ
function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, "")
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i]
  }
  let digit1 = sum % 11
  digit1 = digit1 < 2 ? 0 : 11 - digit1
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i]
  }
  let digit2 = sum % 11
  digit2 = digit2 < 2 ? 0 : 11 - digit2
  
  return (
    parseInt(cleanCNPJ.charAt(12)) === digit1 &&
    parseInt(cleanCNPJ.charAt(13)) === digit2
  )
}

// Função para validar CPF ou CNPJ
function validateCpfCnpj(value: string): boolean {
  const cleanValue = value.replace(/[^\d]/g, "")
  
  if (cleanValue.length === 11) {
    return validateCPF(cleanValue)
  } else if (cleanValue.length === 14) {
    return validateCNPJ(cleanValue)
  }
  
  return false
}




// Função helper para formatar CPF/CNPJ
export function formatCpfCnpj(value: string) {
  const cleanValue = value.replace(/[^\d]/g, "")
  
  if (cleanValue.length <= 11) {
    // Formato CPF: 000.000.000-00
    return cleanValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  } else {
    // Formato CNPJ: 00.000.000/0000-00
    return cleanValue
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }
}

// Schema para produto removido - usando o mais completo abaixo

// Schema para movimentação
export const movimentacaoSchema = z.object({
  produto_id: z.string().uuid("ID do produto inválido"),
  tipo: z.enum(["entrada", "saida"]),
  motivo: z.string().min(1, "Motivo é obrigatório"),
  quantidade: z.number().min(1, "Quantidade deve ser maior que zero"),
  preco_unitario: z.number().min(0, "Preço unitário deve ser positivo"),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  fornecedor: z.string().optional(),
  observacao: z.string().optional(),
})

// Schema para configurações
export const configuracoesSchema = z.object({
  nome_estabelecimento: z.string().min(1, "Nome do estabelecimento é obrigatório"),
  email_contato: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  estoque_minimo_padrao: z.number().min(0, "Estoque mínimo deve ser positivo"),
  alerta_estoque_critico: z.number().min(0, "Alerta crítico deve ser positivo"),
  notificacao_estoque_baixo: z.boolean(),
  notificacao_email: z.boolean(),
  backup_automatico: z.boolean(),
})

// Schema para registro com validação robusta de CPF/CNPJ
export const registroSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .regex(/[A-Za-z]/, "Senha deve conter pelo menos uma letra")
    .regex(/\d/, "Senha deve conter pelo menos um número"),
  nomeEstabelecimento: z.string()
    .min(2, "Nome do estabelecimento deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  cnpjCpf: z.string()
    .min(11, "CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos")
    .refine(validateCpfCnpj, "CPF ou CNPJ inválido")
})

// Schema para login
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
})

// Schema para recuperação de senha
export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
})

// Schema para produtos - COMPLETO com campos obrigatórios do banco
export const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  marca: z.string().min(1, "Marca é obrigatória").max(255, "Marca muito longa"),
  volume: z.string().min(1, "Volume é obrigatório").max(50, "Volume muito longo"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  estoque_atual: z.number().min(0, "Estoque não pode ser negativo").default(0),
  estoque_minimo: z.number().min(0, "Estoque mínimo não pode ser negativo").default(10),
  preco_compra: z.number().min(0, "Preço de compra não pode ser negativo").default(0),
  preco_venda: z.number().min(0, "Preço de venda não pode ser negativo").default(0),
  // Campos opcionais
  fornecedor: z.string().optional(),
  descricao: z.string().optional(),
  codigo_barras: z.string().optional(),
  data_validade: z.string().optional().nullable(),
  imagem_url: z.string().optional(),
})

// Categorias disponíveis
export const categoriasProdutos = [
  "Cerveja",
  "Refrigerante", 
  "Água",
  "Energético",
  "Suco",
  "Vinho",
  "Destilado",
  "Petisco",
  "Outros"
] as const

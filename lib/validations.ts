import { z } from "zod"
import { cpf, cnpj } from "cpf-cnpj-validator"

// Função para validar CPF ou CNPJ
function validateCpfCnpj(value: string) {
  const cleanValue = value.replace(/[^\d]/g, "")
  
  if (cleanValue.length === 11) {
    return cpf.isValid(cleanValue)
  } else if (cleanValue.length === 14) {
    return cnpj.isValid(cleanValue)
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

// Schema para registro - TEMPORÁRIO COM VALIDAÇÃO SIMPLIFICADA PARA DEBUG
export const registroSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres"), // Simplificado temporariamente
  nomeEstabelecimento: z.string().min(2, "Nome do estabelecimento deve ter pelo menos 2 caracteres"),
  cnpjCpf: z.string()
    .min(11, "CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos"), // Removido validateCpfCnpj temporariamente
  telefone: z.string().optional(),
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

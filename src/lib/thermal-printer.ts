export interface DadosImpressao {
  tipo: 'venda_direta' | 'comanda'
  numeroVenda?: string
  numeroComanda?: string
  numeroMesa?: number
  nomeCliente?: string
  telefoneCliente?: string
  itens: any[]
  subtotal: number
  desconto: number
  total: number
  formaPagamento: string
  dataHora: Date
  nomeEstabelecimento: string
}

export const thermalPrinter = {
  async imprimirNota(dados: DadosImpressao): Promise<void> {
    // Implementação básica de impressão
    console.log('🖨️ Imprimindo nota:', dados)
    
    // Aqui seria implementada a lógica real de impressão
    // Por enquanto, apenas simula a impressão
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('✅ Nota impressa com sucesso')
        resolve()
      }, 1000)
    })
  }
}

// Arquivo essencial do projeto restaurado

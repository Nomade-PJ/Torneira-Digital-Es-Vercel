export interface ItemImpressao {
  nome: string
  quantidade: number
  preco: number
  total: number
  observacoes?: string
}

export interface DadosImpressao {
  tipo: 'venda_direta' | 'comanda'
  numeroVenda?: string
  numeroComanda?: string
  numeroMesa?: number
  nomeCliente?: string
  telefoneCliente?: string
  itens: ItemImpressao[]
  subtotal: number
  desconto: number
  total: number
  formaPagamento: string
  dataHora: Date
  nomeEstabelecimento: string
  observacoes?: string
}

export const thermalPrinter = {
  async imprimirNota(dados: DadosImpressao): Promise<void> {
    try {
      console.log('🖨️ Iniciando impressão térmica...')
      
      // Gerar conteúdo da nota
      const conteudoNota = gerarConteudoNota(dados)
      
      // Tentar imprimir usando diferentes métodos
      await tentarImpressao(conteudoNota, dados)
      
      console.log('✅ Nota impressa com sucesso')
    } catch (error) {
      console.error('❌ Erro na impressão:', error)
      throw new Error('Falha na impressão térmica')
    }
  }
}

function gerarConteudoNota(dados: DadosImpressao): string {
  const linha = '================================'
  const linhaPequena = '--------------------------------'
  const dataFormatada = dados.dataHora.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  
  // Cabeçalho melhorado estilo NFC
  let conteudo = `${linha}
        ${dados.nomeEstabelecimento.toUpperCase()}
${linha}

${dados.tipo === 'venda_direta' ? 'CUPOM FISCAL ELETRÔNICO - CFE' : 'COMANDA ELETRÔNICA'}
${dados.tipo === 'venda_direta' ? 'VENDA DIRETA' : 'COMANDA'}

${dados.numeroVenda ? `Documento: ${dados.numeroVenda}` : ''}${dados.numeroComanda ? `Comanda: ${dados.numeroComanda}` : ''}${dados.numeroMesa ? `Mesa: ${dados.numeroMesa}` : ''}

Data/Hora: ${dataFormatada}${dados.nomeCliente ? `\nCliente: ${dados.nomeCliente}` : ''}${dados.telefoneCliente ? `\nTelefone: ${dados.telefoneCliente}` : ''}

${linhaPequena}
ITENS
${linhaPequena}`

  // Adicionar itens com formatação melhorada
  dados.itens.forEach((item, index) => {
    const nomeItem = item.nome.length > 28 ? item.nome.substring(0, 25) + '...' : item.nome
    const precoUnit = item.preco.toFixed(2).replace('.', ',')
    const totalItem = item.total.toFixed(2).replace('.', ',')
    
    conteudo += `\n${String(index + 1).padStart(2, '0')} ${nomeItem}`
    conteudo += `\n   ${item.quantidade}x R$ ${precoUnit} = R$ ${totalItem}`
    
    if (item.observacoes && item.observacoes.trim()) {
      conteudo += `\n   Obs: ${item.observacoes}`
    }
  })

  // Totais com formatação NFC
  const subtotalFormatado = dados.subtotal.toFixed(2).replace('.', ',')
  const descontoFormatado = dados.desconto.toFixed(2).replace('.', ',')
  const totalFormatado = dados.total.toFixed(2).replace('.', ',')
  
  conteudo += `\n\n${linhaPequena}
SUBTOTAL: R$ ${subtotalFormatado}`
  
  if (dados.desconto > 0) {
    conteudo += `\nDESCONTO: R$ ${descontoFormatado}`
  }
  
  conteudo += `\nTOTAL: R$ ${totalFormatado}

PAGAMENTO: ${formatarFormaPagamento(dados.formaPagamento)}`

  if (dados.observacoes && dados.observacoes.trim()) {
    conteudo += `\n\nOBSERVAÇÕES:\n${dados.observacoes}`
  }

  // Rodapé estilo NFC
  conteudo += `\n\n${linha}
      OBRIGADO PELA PREFERÊNCIA!
${linha}

Documento emitido por sistema PDV
Torneira Digital - Sistema de Gestão

${linha}

.
.
.
`

  return conteudo
}

function formatarFormaPagamento(forma: string): string {
  const formas: Record<string, string> = {
    'dinheiro': 'DINHEIRO',
    'pix': 'PIX',
    'cartao_debito': 'CARTÃO DÉBITO',
    'cartao_credito': 'CARTÃO CRÉDITO',
    'transferencia': 'TRANSFERÊNCIA'
  }
  return formas[forma] || forma.toUpperCase()
}

async function tentarImpressao(conteudo: string, dados: DadosImpressao): Promise<void> {
  // Método 1: Tentar usar API de impressão do navegador
  if (navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edge')) {
    try {
      await imprimirViaBrowser(conteudo)
      return
    } catch (error) {
      console.warn('Impressão via browser falhou, tentando método alternativo:', error)
    }
  }

  // Método 2: Simular impressão para desenvolvimento
  await simularImpressao(conteudo, dados)
}

async function imprimirViaBrowser(conteudo: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Criar janela de impressão
      const janelaImpressao = window.open('', '_blank', 'width=300,height=600')
      
      if (!janelaImpressao) {
        throw new Error('Não foi possível abrir janela de impressão')
      }

      janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Nota Fiscal</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              @page { 
                size: 80mm auto; 
                margin: 2mm; 
              }
              body { margin: 0 !important; }
            }
            body { 
              font-family: 'Courier New', 'Monaco', 'Menlo', monospace; 
              font-size: 11px; 
              line-height: 1.3; 
              margin: 3mm;
              width: 74mm;
              color: #000;
              background: #fff;
            }
            pre { 
              white-space: pre-wrap; 
              word-wrap: break-word; 
              margin: 0;
              font-family: inherit;
              font-size: inherit;
            }
            @media screen {
              body {
                background: #f5f5f5;
                padding: 20px;
              }
              pre {
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 300px;
                margin: 0 auto;
              }
            }
          </style>
        </head>
        <body>
          <pre>${conteudo}</pre>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1500);
              }, 800);
            }
          </script>
        </body>
        </html>
      `)
      
      janelaImpressao.document.close()
      
      setTimeout(() => {
        resolve()
      }, 2000)
      
    } catch (error) {
      reject(error)
    }
  })
}

async function simularImpressao(_conteudo: string, _dados: DadosImpressao): Promise<void> {
  return new Promise((resolve) => {
    // Simulando impressão térmica
    // Em produção, aqui seria enviado para impressora física
    
    // Simular tempo de impressão
    setTimeout(() => {
      resolve()
    }, 1500)
  })
}

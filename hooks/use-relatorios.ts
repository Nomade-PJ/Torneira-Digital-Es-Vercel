"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/database"

type Produto = Database["public"]["Tables"]["produtos"]["Row"]
type MovimentacaoComProduto = Database["public"]["Tables"]["movimentacoes"]["Row"] & {
  produtos?: any
}

interface VendaPorMes {
  mes: string
  vendas: number
  lucro: number
  receita: number
}

interface ProdutoMaisVendido {
  produto: string
  vendas: number
  receita: number
  categoria: string
}

interface CategoriaDistribuicao {
  name: string
  value: number
  color: string
  count: number
}

interface MovimentacaoEstoque {
  data: string
  entradas: number
  saidas: number
}

interface EstatisticasGerais {
  receitaTotal: number
  produtosVendidos: number
  ticketMedio: number
  margemLucro: number
  crescimentoReceita: number
  crescimentoProdutos: number
  crescimentoTicket: number
  crescimentoMargem: number
}

const coresCategoria = {
  cerveja: "#d4af37",
  chope: "#ffd700", 
  refrigerante: "#b8860b",
  agua: "#4a90e2",
  energetico: "#e74c3c",
  outros: "#8b7355",
}

export function useRelatorios() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState("30dias")
  
  // Estados dos dados
  const [vendasPorMes, setVendasPorMes] = useState<VendaPorMes[]>([])
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<ProdutoMaisVendido[]>([])
  const [categoriaDistribuicao, setCategoriaDistribuicao] = useState<CategoriaDistribuicao[]>([])
  const [movimentacaoEstoque, setMovimentacaoEstoque] = useState<MovimentacaoEstoque[]>([])
  const [estatisticasGerais, setEstatisticasGerais] = useState<EstatisticasGerais>({
    receitaTotal: 0,
    produtosVendidos: 0,
    ticketMedio: 0,
    margemLucro: 0,
    crescimentoReceita: 0,
    crescimentoProdutos: 0,
    crescimentoTicket: 0,
    crescimentoMargem: 0,
  })

  const { user } = useAuthContext()
  const { toast } = useToast()

  // Calcular período em dias
  const obterDiasPeriodo = (periodo: string): number => {
    switch (periodo) {
      case "7dias": return 7
      case "30dias": return 30
      case "90dias": return 90
      case "1ano": return 365
      default: return 30
    }
  }

  // Buscar dados de vendas por mês
  const fetchVendasPorMes = async () => {
    if (!user) return

    try {
      const diasAtras = obterDiasPeriodo(periodo)
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - diasAtras)

      const { data, error } = await supabase
        .from("movimentacoes")
        .select(`
          data_movimentacao,
          quantidade,
          preco_unitario,
          valor_total,
          produtos!inner (
            preco_compra,
            preco_venda
          )
        `)
        .eq("usuario_id", user.id)
        .eq("tipo", "saida")
        .eq("status", "concluida")
        .gte("data_movimentacao", dataInicio.toISOString())
        .order("data_movimentacao", { ascending: true })

      if (error) throw error

      // Agrupar por mês
      const vendasAgrupadas: { [key: string]: VendaPorMes } = {}
      
      data?.forEach((movimentacao) => {
        const data = new Date(movimentacao.data_movimentacao)
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`
        
        const receita = movimentacao.valor_total || 0
        const produto = Array.isArray(movimentacao.produtos) ? movimentacao.produtos[0] : movimentacao.produtos
        const custo = (produto?.preco_compra || 0) * movimentacao.quantidade
        const lucro = receita - custo

        if (!vendasAgrupadas[mesAno]) {
          vendasAgrupadas[mesAno] = {
            mes: mesAno,
            vendas: 0,
            lucro: 0,
            receita: 0,
          }
        }

        vendasAgrupadas[mesAno].vendas += movimentacao.quantidade
        vendasAgrupadas[mesAno].receita += receita
        vendasAgrupadas[mesAno].lucro += lucro
      })

      setVendasPorMes(Object.values(vendasAgrupadas))
    } catch (error: any) {
      console.error("Erro ao buscar vendas por mês:", error)
    }
  }

  // Buscar produtos mais vendidos
  const fetchProdutosMaisVendidos = async () => {
    if (!user) return

    try {
      const diasAtras = obterDiasPeriodo(periodo)
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - diasAtras)

      const { data, error } = await supabase
        .from("movimentacoes")
        .select(`
          quantidade,
          valor_total,
          produtos!inner (
            nome,
            marca,
            categoria
          )
        `)
        .eq("usuario_id", user.id)
        .eq("tipo", "saida")
        .eq("status", "concluida")
        .gte("data_movimentacao", dataInicio.toISOString())

      if (error) throw error

      // Agrupar por produto
      const produtosAgrupados: { [key: string]: ProdutoMaisVendido } = {}

      data?.forEach((movimentacao) => {
        const produto = Array.isArray(movimentacao.produtos) ? movimentacao.produtos[0] : movimentacao.produtos
        const nomeProduto = `${produto?.nome || "Produto"} ${produto?.marca || ""}`.trim()
        
        if (!produtosAgrupados[nomeProduto]) {
          produtosAgrupados[nomeProduto] = {
            produto: nomeProduto,
            vendas: 0,
            receita: 0,
            categoria: produto?.categoria || "outros",
          }
        }

        produtosAgrupados[nomeProduto].vendas += movimentacao.quantidade
        produtosAgrupados[nomeProduto].receita += movimentacao.valor_total || 0
      })

      // Ordenar e pegar top 5
      const top5 = Object.values(produtosAgrupados)
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 5)

      setProdutosMaisVendidos(top5)
    } catch (error: any) {
      console.error("Erro ao buscar produtos mais vendidos:", error)
    }
  }

  // Buscar distribuição por categoria
  const fetchCategoriaDistribuicao = async () => {
    if (!user) return

    try {
      const diasAtras = obterDiasPeriodo(periodo)
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - diasAtras)

      const { data, error } = await supabase
        .from("movimentacoes")
        .select(`
          quantidade,
          produtos!inner (
            categoria
          )
        `)
        .eq("usuario_id", user.id)
        .eq("tipo", "saida")
        .eq("status", "concluida")
        .gte("data_movimentacao", dataInicio.toISOString())

      if (error) throw error

      // Agrupar por categoria
      const categoriasAgrupadas: { [key: string]: number } = {}
      let totalVendas = 0

      data?.forEach((movimentacao) => {
        const produto = Array.isArray(movimentacao.produtos) ? movimentacao.produtos[0] : movimentacao.produtos
        const categoria = produto?.categoria || "outros"
        categoriasAgrupadas[categoria] = (categoriasAgrupadas[categoria] || 0) + movimentacao.quantidade
        totalVendas += movimentacao.quantidade
      })

      // Converter para porcentagem
      const distribuicao = Object.entries(categoriasAgrupadas).map(([categoria, count]) => ({
        name: categoria.charAt(0).toUpperCase() + categoria.slice(1),
        value: Math.round((count / totalVendas) * 100),
        color: coresCategoria[categoria as keyof typeof coresCategoria] || coresCategoria.outros,
        count,
      }))

      setCategoriaDistribuicao(distribuicao)
    } catch (error: any) {
      console.error("Erro ao buscar distribuição por categoria:", error)
    }
  }

  // Buscar movimentação de estoque
  const fetchMovimentacaoEstoque = async () => {
    if (!user) return

    try {
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - 7) // Últimos 7 dias

      const { data, error } = await supabase
        .from("movimentacoes")
        .select("data_movimentacao, tipo, quantidade")
        .eq("usuario_id", user.id)
        .eq("status", "concluida")
        .gte("data_movimentacao", dataInicio.toISOString())
        .order("data_movimentacao", { ascending: true })

      if (error) throw error

      // Agrupar por data
      const movimentacaoAgrupada: { [key: string]: MovimentacaoEstoque } = {}

      data?.forEach((movimentacao) => {
        const data = new Date(movimentacao.data_movimentacao).toLocaleDateString("pt-BR")
        
        if (!movimentacaoAgrupada[data]) {
          movimentacaoAgrupada[data] = {
            data,
            entradas: 0,
            saidas: 0,
          }
        }

        if (movimentacao.tipo === "entrada") {
          movimentacaoAgrupada[data].entradas += movimentacao.quantidade
        } else {
          movimentacaoAgrupada[data].saidas += movimentacao.quantidade
        }
      })

      setMovimentacaoEstoque(Object.values(movimentacaoAgrupada))
    } catch (error: any) {
      console.error("Erro ao buscar movimentação de estoque:", error)
    }
  }

  // Calcular estatísticas gerais
  const calcularEstatisticasGerais = async () => {
    if (!user) return

    try {
      const diasAtras = obterDiasPeriodo(periodo)
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - diasAtras)
      
      const dataComparacao = new Date()
      dataComparacao.setDate(dataComparacao.getDate() - (diasAtras * 2))

      // Período atual
      const { data: periodoAtual, error: error1 } = await supabase
        .from("movimentacoes")
        .select(`
          quantidade,
          preco_unitario,
          valor_total,
          produtos!inner (
            preco_compra
          )
        `)
        .eq("usuario_id", user.id)
        .eq("tipo", "saida")
        .eq("status", "concluida")
        .gte("data_movimentacao", dataInicio.toISOString())

      // Período anterior (para comparação)
      const { data: periodoAnterior, error: error2 } = await supabase
        .from("movimentacoes")
        .select(`
          quantidade,
          preco_unitario,
          valor_total,
          produtos!inner (
            preco_compra
          )
        `)
        .eq("usuario_id", user.id)
        .eq("tipo", "saida")
        .eq("status", "concluida")
        .gte("data_movimentacao", dataComparacao.toISOString())
        .lt("data_movimentacao", dataInicio.toISOString())

      if (error1 || error2) throw error1 || error2

      // Calcular métricas do período atual
      const receitaAtual = periodoAtual?.reduce((sum, mov) => sum + (mov.valor_total || 0), 0) || 0
      const produtosVendidosAtual = periodoAtual?.reduce((sum, mov) => sum + mov.quantidade, 0) || 0
      const custoAtual = periodoAtual?.reduce((sum, mov) => {
        const produto = Array.isArray(mov.produtos) ? mov.produtos[0] : mov.produtos
        return sum + ((produto?.preco_compra || 0) * mov.quantidade)
      }, 0) || 0
      
      const ticketMedioAtual = produtosVendidosAtual > 0 ? receitaAtual / produtosVendidosAtual : 0
      const margemLucroAtual = receitaAtual > 0 ? ((receitaAtual - custoAtual) / receitaAtual) * 100 : 0

      // Calcular métricas do período anterior
      const receitaAnterior = periodoAnterior?.reduce((sum, mov) => sum + (mov.valor_total || 0), 0) || 0
      const produtosVendidosAnterior = periodoAnterior?.reduce((sum, mov) => sum + mov.quantidade, 0) || 0
      const custoAnterior = periodoAnterior?.reduce((sum, mov) => {
        const produto = Array.isArray(mov.produtos) ? mov.produtos[0] : mov.produtos
        return sum + ((produto?.preco_compra || 0) * mov.quantidade)
      }, 0) || 0
      
      const ticketMedioAnterior = produtosVendidosAnterior > 0 ? receitaAnterior / produtosVendidosAnterior : 0
      const margemLucroAnterior = receitaAnterior > 0 ? ((receitaAnterior - custoAnterior) / receitaAnterior) * 100 : 0

      // Calcular crescimentos
      const crescimentoReceita = receitaAnterior > 0 ? ((receitaAtual - receitaAnterior) / receitaAnterior) * 100 : 0
      const crescimentoProdutos = produtosVendidosAnterior > 0 ? ((produtosVendidosAtual - produtosVendidosAnterior) / produtosVendidosAnterior) * 100 : 0
      const crescimentoTicket = ticketMedioAnterior > 0 ? ((ticketMedioAtual - ticketMedioAnterior) / ticketMedioAnterior) * 100 : 0
      const crescimentoMargem = margemLucroAnterior > 0 ? ((margemLucroAtual - margemLucroAnterior) / margemLucroAnterior) * 100 : 0

      setEstatisticasGerais({
        receitaTotal: receitaAtual,
        produtosVendidos: produtosVendidosAtual,
        ticketMedio: ticketMedioAtual,
        margemLucro: margemLucroAtual,
        crescimentoReceita,
        crescimentoProdutos,
        crescimentoTicket,
        crescimentoMargem,
      })

    } catch (error: any) {
      console.error("Erro ao calcular estatísticas gerais:", error)
    }
  }

  // Buscar todos os dados
  const fetchDados = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      await Promise.all([
        fetchVendasPorMes(),
        fetchProdutosMaisVendidos(),
        fetchCategoriaDistribuicao(),
        fetchMovimentacaoEstoque(),
        calcularEstatisticasGerais(),
      ])

    } catch (error: any) {
      console.error("Erro ao buscar dados dos relatórios:", error)
      setError(error.message)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Exportar relatório PDF
  const exportarRelatorioPDF = async () => {
    try {
      // Importação dinâmica para evitar problemas de SSR
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      
      // Configurações do documento
      doc.setFontSize(20)
      doc.text('Relatório de Vendas - Torneira Digital', pageWidth / 2, 20, { align: 'center' })
      
      doc.setFontSize(12)
      doc.text(`Período: ${periodo} dias`, pageWidth / 2, 30, { align: 'center' })
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 38, { align: 'center' })
      
      // Linha divisória
      doc.setLineWidth(0.5)
      doc.line(20, 45, pageWidth - 20, 45)
      
      let yPosition = 55
      
      // KPIs principais
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Estatísticas Gerais', 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Receita Total: R$ ${estatisticasGerais.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition)
      yPosition += 8
      doc.text(`Produtos Vendidos: ${estatisticasGerais.produtosVendidos}`, 20, yPosition)
      yPosition += 8
      doc.text(`Ticket Médio: R$ ${estatisticasGerais.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, yPosition)
      yPosition += 8
      doc.text(`Margem de Lucro: ${estatisticasGerais.margemLucro.toFixed(1)}%`, 20, yPosition)
      yPosition += 15
      
      // Produtos mais vendidos
      if (produtosMaisVendidos.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Produtos Mais Vendidos', 20, yPosition)
        yPosition += 10
        
        const produtosData = produtosMaisVendidos.slice(0, 10).map((produto) => [
          produto.produto,
          produto.vendas.toString(),
          `R$ ${produto.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ])
        
        autoTable(doc, {
          head: [['Produto', 'Qtd Vendida', 'Receita']],
          body: produtosData,
          startY: yPosition,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 50, halign: 'right' }
          }
        })
        
        yPosition = (doc as any).lastAutoTable.finalY + 15
      }
      
      // Vendas por mês (se houver espaço)
      if (vendasPorMes.length > 0 && yPosition < 200) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Vendas por Período', 20, yPosition)
        yPosition += 10
        
        const vendasData = vendasPorMes.slice(0, 8).map((venda) => [
          venda.mes,
          venda.vendas.toString(),
          `R$ ${venda.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${venda.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ])
        
        autoTable(doc, {
          head: [['Período', 'Vendas', 'Receita', 'Lucro']],
          body: vendasData,
          startY: yPosition,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 50, halign: 'right' },
            3: { cellWidth: 50, halign: 'right' }
          }
        })
      }
      
      // Rodapé
      const pageHeight = doc.internal.pageSize.height
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text('Torneira Digital - Sistema de Gestão', pageWidth / 2, pageHeight - 20, { align: 'center' })
      doc.text('Relatório gerado automaticamente', pageWidth / 2, pageHeight - 12, { align: 'center' })
      
      // Salvar o arquivo
      const fileName = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      toast({
        title: "Sucesso",
        description: `Relatório exportado como ${fileName}`,
      })
    } catch (error: any) {
      console.error("Erro ao exportar relatório:", error)
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório: " + error.message,
        variant: "destructive",
      })
    }
  }

  // Atualizar período e refetch
  const atualizarPeriodo = (novoPeriodo: string) => {
    setPeriodo(novoPeriodo)
  }

  useEffect(() => {
    fetchDados()
  }, [user, periodo])

  return {
    // Estados
    loading,
    error,
    periodo,
    
    // Dados
    vendasPorMes,
    produtosMaisVendidos,
    categoriaDistribuicao,
    movimentacaoEstoque,
    estatisticasGerais,
    
    // Funções
    atualizarPeriodo,
    exportarRelatorioPDF,
    refetch: fetchDados,
  }
}

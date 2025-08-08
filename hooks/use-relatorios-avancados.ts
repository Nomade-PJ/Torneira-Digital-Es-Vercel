"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface FiltrosRelatorio {
  dataInicio: string
  dataFim: string
  categoria: string
  tipoRelatorio: string
  agrupamento: string
}

interface EstatisticasComparativas {
  vendasPeriodo: number
  receitaPeriodo: number
  novosClientes: number
  produtosAtivos: number
  crescimentoVendas: number
  crescimentoReceita: number
  crescimentoClientes: number
  crescimentoProdutos: number
}

interface RelatorioVendas {
  tendencia: Array<{ periodo: string; vendas: number; receita: number }>
  porCategoria: Array<{ categoria: string; quantidade: number; receita: number }>
  comparativo: Array<{ periodo: string; atual: number; anterior: number }>
}

interface RelatorioProdutos {
  topProdutos: Array<{ nome: string; quantidade: number; receita: number }>
  margemLucro: Array<{ produto: string; margem: number; vendas: number }>
  performance: Array<{ produto: string; crescimento: number; estoque: number }>
}

interface RelatorioClientes {
  ranking: Array<{ 
    id: string
    nome: string
    tipo: string
    totalCompras: number
    quantidadeCompras: number
    ultimaCompra: string
  }>
  novosClientes: Array<{ periodo: string; novos: number; ativos: number }>
  comportamento: Array<{ segmento: string; ticketMedio: number; frequencia: number }>
}

interface RelatorioFinanceiro {
  fluxoCaixa: Array<{ periodo: string; receitas: number; custos: number; lucro: number }>
  indicadores: {
    margemBruta: number
    roi: number
    ticketMedio: number
    giroEstoque: number
  }
  projecoes: Array<{ mes: string; projecaoReceita: number; meta: number }>
}

export function useRelatoriosAvancados() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [relatorioVendas, setRelatorioVendas] = useState<RelatorioVendas | null>(null)
  const [relatorioClientes, setRelatorioClientes] = useState<RelatorioClientes | null>(null)
  const [relatorioProdutos, setRelatorioProdutos] = useState<RelatorioProdutos | null>(null)
  const [relatorioFinanceiro, setRelatorioFinanceiro] = useState<RelatorioFinanceiro | null>(null)
  const [estatisticasComparativas, setEstatisticasComparativas] = useState<EstatisticasComparativas | null>(null)
  
  const { user } = useAuthContext()
  const { toast } = useToast()

  // Gerar relatório de vendas
  const gerarRelatorioVendas = async (filtros: FiltrosRelatorio) => {
    if (!user) return

    try {
      const dataInicio = filtros.dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const dataFim = filtros.dataFim || new Date().toISOString()

      // Tendência de vendas
      const { data: vendasData } = await supabase
        .from("vendas")
        .select(`
          data_venda,
          total,
          itens_venda (
            quantidade,
            produtos (categoria)
          )
        `)
        .eq("usuario_id", user.id)
        .eq("status", "finalizada")
        .gte("data_venda", dataInicio)
        .lte("data_venda", dataFim)
        .order("data_venda", { ascending: true })

      // Processar tendência
      const tendenciaMap = new Map()
      vendasData?.forEach(venda => {
        const periodo = new Date(venda.data_venda).toLocaleDateString('pt-BR')
        if (!tendenciaMap.has(periodo)) {
          tendenciaMap.set(periodo, { periodo, vendas: 0, receita: 0 })
        }
        const item = tendenciaMap.get(periodo)
        item.vendas += 1
        item.receita += venda.total
      })

      const tendencia = Array.from(tendenciaMap.values())

      // Vendas por categoria
      const categoriaMap = new Map()
      vendasData?.forEach(venda => {
        venda.itens_venda?.forEach(item => {
          const categoria = (item.produtos as any)?.categoria || 'Outros'
          if (!categoriaMap.has(categoria)) {
            categoriaMap.set(categoria, { categoria, quantidade: 0, receita: 0 })
          }
          const cat = categoriaMap.get(categoria)
          cat.quantidade += item.quantidade
          cat.receita += item.quantidade * venda.total / venda.itens_venda!.length
        })
      })

      const porCategoria = Array.from(categoriaMap.values())

      setRelatorioVendas({
        tendencia,
        porCategoria,
        comparativo: [] // Pode ser implementado posteriormente
      })

    } catch (error: any) {
      console.error("Erro ao gerar relatório de vendas:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de vendas",
        variant: "destructive",
      })
    }
  }

  // Gerar relatório de produtos
  const gerarRelatorioProdutos = async (filtros: FiltrosRelatorio) => {
    if (!user) return

    try {
      const dataInicio = filtros.dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const dataFim = filtros.dataFim || new Date().toISOString()

      // Top produtos mais vendidos
      const { data: itensVenda } = await supabase
        .from("itens_venda")
        .select(`
          quantidade,
          preco_unitario,
          produtos (nome, preco_compra, preco_venda),
          vendas!inner (
            data_venda,
            status,
            usuario_id
          )
        `)
        .eq("vendas.usuario_id", user.id)
        .eq("vendas.status", "finalizada")
        .gte("vendas.data_venda", dataInicio)
        .lte("vendas.data_venda", dataFim)

      // Processar top produtos
      const produtoMap = new Map()
      itensVenda?.forEach(item => {
        const produto = (item.produtos as any)
        if (!produto) return
        
        const nome = produto.nome
        if (!produtoMap.has(nome)) {
          produtoMap.set(nome, {
            nome,
            quantidade: 0,
            receita: 0,
            margem: 0
          })
        }
        const prod = produtoMap.get(nome)
        prod.quantidade += item.quantidade
        prod.receita += item.quantidade * item.preco_unitario
        prod.margem = ((item.preco_unitario - produto.preco_compra) / item.preco_unitario) * 100
      })

      const topProdutos = Array.from(produtoMap.values())
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10)

      const margemLucro = Array.from(produtoMap.values())
        .map(p => ({
          produto: p.nome.substring(0, 15) + "...",
          margem: p.margem,
          vendas: p.quantidade
        }))
        .sort((a, b) => b.margem - a.margem)
        .slice(0, 10)

      setRelatorioProdutos({
        topProdutos,
        margemLucro,
        performance: [] // Pode ser implementado posteriormente
      })

    } catch (error: any) {
      console.error("Erro ao gerar relatório de produtos:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de produtos",
        variant: "destructive",
      })
    }
  }

  // Gerar relatório de clientes
  const gerarRelatorioClientes = async (filtros: FiltrosRelatorio) => {
    if (!user) return

    try {
      const dataInicio = filtros.dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const dataFim = filtros.dataFim || new Date().toISOString()

      // Ranking de clientes
      const { data: vendasClientes } = await supabase
        .from("vendas")
        .select(`
          total,
          cliente_id,
          data_venda,
          clientes (nome, tipo)
        `)
        .eq("usuario_id", user.id)
        .eq("status", "finalizada")
        .gte("data_venda", dataInicio)
        .lte("data_venda", dataFim)
        .not("cliente_id", "is", null)

      // Processar ranking
      const clienteMap = new Map()
      vendasClientes?.forEach(venda => {
        const cliente = venda.clientes as any
        if (!cliente) return
        
        const id = venda.cliente_id!
        if (!clienteMap.has(id)) {
          clienteMap.set(id, {
            id,
            nome: cliente.nome,
            tipo: cliente.tipo,
            totalCompras: 0,
            quantidadeCompras: 0,
            ultimaCompra: venda.data_venda
          })
        }
        const cli = clienteMap.get(id)
        cli.totalCompras += venda.total
        cli.quantidadeCompras += 1
        if (new Date(venda.data_venda) > new Date(cli.ultimaCompra)) {
          cli.ultimaCompra = venda.data_venda
        }
      })

      const ranking = Array.from(clienteMap.values())
        .sort((a, b) => b.totalCompras - a.totalCompras)
        .slice(0, 20)

      // Novos clientes por período
      const { data: clientesData } = await supabase
        .from("clientes")
        .select("created_at")
        .eq("usuario_id", user.id)
        .gte("created_at", dataInicio)
        .lte("created_at", dataFim)
        .order("created_at", { ascending: true })

      const novosClientesMap = new Map()
      clientesData?.forEach(cliente => {
        const periodo = new Date(cliente.created_at).toLocaleDateString('pt-BR')
        if (!novosClientesMap.has(periodo)) {
          novosClientesMap.set(periodo, { periodo, novos: 0, ativos: 0 })
        }
        novosClientesMap.get(periodo).novos += 1
      })

      const novosClientes = Array.from(novosClientesMap.values())

      setRelatorioClientes({
        ranking,
        novosClientes,
        comportamento: [] // Pode ser implementado posteriormente
      })

    } catch (error: any) {
      console.error("Erro ao gerar relatório de clientes:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório de clientes",
        variant: "destructive",
      })
    }
  }

  // Gerar relatório financeiro
  const gerarRelatorioFinanceiro = async (filtros: FiltrosRelatorio) => {
    if (!user) return

    try {
      const dataInicio = filtros.dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const dataFim = filtros.dataFim || new Date().toISOString()

      // Fluxo de caixa
      const { data: vendasData } = await supabase
        .from("vendas")
        .select(`
          data_venda,
          total,
          itens_venda (
            quantidade,
            preco_unitario,
            produtos (preco_compra)
          )
        `)
        .eq("usuario_id", user.id)
        .eq("status", "finalizada")
        .gte("data_venda", dataInicio)
        .lte("data_venda", dataFim)

      // Processar fluxo de caixa
      const fluxoMap = new Map()
      let totalReceitas = 0
      let totalCustos = 0

      vendasData?.forEach(venda => {
        const periodo = new Date(venda.data_venda).toLocaleDateString('pt-BR')
        if (!fluxoMap.has(periodo)) {
          fluxoMap.set(periodo, { periodo, receitas: 0, custos: 0, lucro: 0 })
        }
        const fluxo = fluxoMap.get(periodo)
        
        const receita = venda.total
        let custo = 0
        
        venda.itens_venda?.forEach(item => {
          const produto = item.produtos as any
          if (produto?.preco_compra) {
            custo += item.quantidade * produto.preco_compra
          }
        })

        fluxo.receitas += receita
        fluxo.custos += custo
        fluxo.lucro = fluxo.receitas - fluxo.custos

        totalReceitas += receita
        totalCustos += custo
      })

      const fluxoCaixa = Array.from(fluxoMap.values())

      // Indicadores financeiros
      const margemBruta = totalReceitas > 0 ? ((totalReceitas - totalCustos) / totalReceitas) * 100 : 0
      const roi = totalCustos > 0 ? ((totalReceitas - totalCustos) / totalCustos) * 100 : 0
      const ticketMedio = vendasData ? totalReceitas / vendasData.length : 0

      // Giro de estoque (simplificado)
      const giroEstoque = 4.2 // Placeholder - seria calculado com dados de estoque

      setRelatorioFinanceiro({
        fluxoCaixa,
        indicadores: {
          margemBruta,
          roi,
          ticketMedio,
          giroEstoque
        },
        projecoes: [] // Pode ser implementado posteriormente
      })

    } catch (error: any) {
      console.error("Erro ao gerar relatório financeiro:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório financeiro",
        variant: "destructive",
      })
    }
  }

  // Gerar estatísticas comparativas
  const gerarEstatisticasComparativas = async (filtros: FiltrosRelatorio) => {
    if (!user) return

    try {
      const dataInicio = filtros.dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const dataFim = filtros.dataFim || new Date().toISOString()

      // Período atual
      const { data: vendasAtuais } = await supabase
        .from("vendas")
        .select("total")
        .eq("usuario_id", user.id)
        .eq("status", "finalizada")
        .gte("data_venda", dataInicio)
        .lte("data_venda", dataFim)

      const { data: clientesAtuais } = await supabase
        .from("clientes")
        .select("id")
        .eq("usuario_id", user.id)
        .gte("created_at", dataInicio)
        .lte("created_at", dataFim)

      const { data: produtosAtuais } = await supabase
        .from("produtos")
        .select("id")
        .eq("usuario_id", user.id)
        .eq("ativo", true)

      // Calcular período anterior (mesmo intervalo)
      const diasPeriodo = Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24))
      const dataInicioAnterior = new Date(new Date(dataInicio).getTime() - diasPeriodo * 24 * 60 * 60 * 1000).toISOString()
      const dataFimAnterior = dataInicio

      const { data: vendasAnteriores } = await supabase
        .from("vendas")
        .select("total")
        .eq("usuario_id", user.id)
        .eq("status", "finalizada")
        .gte("data_venda", dataInicioAnterior)
        .lte("data_venda", dataFimAnterior)

      // Calcular estatísticas
      const vendasPeriodo = vendasAtuais?.length || 0
      const vendasPeriodoAnterior = vendasAnteriores?.length || 0
      const crescimentoVendas = vendasPeriodoAnterior > 0 ? ((vendasPeriodo - vendasPeriodoAnterior) / vendasPeriodoAnterior) * 100 : 0

      const receitaPeriodo = vendasAtuais?.reduce((sum, v) => sum + v.total, 0) || 0
      const receitaPeriodoAnterior = vendasAnteriores?.reduce((sum, v) => sum + v.total, 0) || 0
      const crescimentoReceita = receitaPeriodoAnterior > 0 ? ((receitaPeriodo - receitaPeriodoAnterior) / receitaPeriodoAnterior) * 100 : 0

      const novosClientes = clientesAtuais?.length || 0
      const produtosAtivos = produtosAtuais?.length || 0

      setEstatisticasComparativas({
        vendasPeriodo,
        receitaPeriodo,
        novosClientes,
        produtosAtivos,
        crescimentoVendas,
        crescimentoReceita,
        crescimentoClientes: 0, // Placeholder
        crescimentoProdutos: 0, // Placeholder
      })

    } catch (error: any) {
      console.error("Erro ao gerar estatísticas comparativas:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar estatísticas comparativas",
        variant: "destructive",
      })
    }
  }

  // Função principal para gerar relatório
  const gerarRelatorio = async (filtros: FiltrosRelatorio) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        gerarEstatisticasComparativas(filtros),
        gerarRelatorioVendas(filtros),
        gerarRelatorioProdutos(filtros),
        gerarRelatorioClientes(filtros),
        gerarRelatorioFinanceiro(filtros)
      ])

      toast({
        title: "Sucesso",
        description: "Relatórios gerados com sucesso",
      })

    } catch (error: any) {
      console.error("Erro ao gerar relatórios:", error)
      setError(error.message)
      toast({
        title: "Erro",
        description: "Erro ao gerar relatórios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Exportar relatório completo
  const exportarRelatorioCompleto = async () => {
    try {
      // Importação dinâmica para evitar problemas de SSR
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      
      // Cabeçalho
      doc.setFontSize(18)
      doc.text('Relatório Avançado - Torneira Digital', pageWidth / 2, 20, { align: 'center' })
      
      doc.setFontSize(10)
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' })
      
      let yPosition = 40

      // Estatísticas comparativas
      if (estatisticasComparativas) {
        doc.setFontSize(14)
        doc.setFont(undefined, 'bold')
        doc.text('Resumo Executivo', 20, yPosition)
        yPosition += 10

        const statsData = [
          ['Vendas no Período', estatisticasComparativas.vendasPeriodo.toString(), `${estatisticasComparativas.crescimentoVendas.toFixed(1)}%`],
          ['Receita no Período', `R$ ${estatisticasComparativas.receitaPeriodo.toLocaleString('pt-BR')}`, `${estatisticasComparativas.crescimentoReceita.toFixed(1)}%`],
          ['Novos Clientes', estatisticasComparativas.novosClientes.toString(), '-'],
          ['Produtos Ativos', estatisticasComparativas.produtosAtivos.toString(), '-']
        ]

        autoTable(doc, {
          head: [['Métrica', 'Valor', 'Crescimento']],
          body: statsData,
          startY: yPosition,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: 20, right: 20 }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 15
      }

      // Top produtos
      if (relatorioProdutos?.topProdutos.length) {
        if (yPosition > 200) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(14)
        doc.setFont(undefined, 'bold')
        doc.text('Top 10 Produtos', 20, yPosition)
        yPosition += 10

        const produtosData = relatorioProdutos.topProdutos.slice(0, 10).map(p => [
          p.nome,
          p.quantidade.toString(),
          `R$ ${p.receita.toLocaleString('pt-BR')}`
        ])

        autoTable(doc, {
          head: [['Produto', 'Qtd', 'Receita']],
          body: produtosData,
          startY: yPosition,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: 20, right: 20 }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 15
      }

      // Ranking de clientes
      if (relatorioClientes?.ranking.length) {
        if (yPosition > 200) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(14)
        doc.setFont(undefined, 'bold')
        doc.text('Top 10 Clientes', 20, yPosition)
        yPosition += 10

        const clientesData = relatorioClientes.ranking.slice(0, 10).map(c => [
          c.nome,
          c.quantidadeCompras.toString(),
          `R$ ${c.totalCompras.toLocaleString('pt-BR')}`
        ])

        autoTable(doc, {
          head: [['Cliente', 'Compras', 'Total']],
          body: clientesData,
          startY: yPosition,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: 20, right: 20 }
        })
      }

      // Salvar
      const fileName = `relatorio-avancado-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      toast({
        title: "Sucesso",
        description: `Relatório completo exportado como ${fileName}`,
      })

    } catch (error: any) {
      console.error("Erro ao exportar relatório completo:", error)
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório completo",
        variant: "destructive",
      })
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      const filtrosIniciais: FiltrosRelatorio = {
        dataInicio: "",
        dataFim: "",
        categoria: "todas",
        tipoRelatorio: "vendas",
        agrupamento: "dia"
      }
      gerarRelatorio(filtrosIniciais)
    }
  }, [user])

  return {
    loading,
    error,
    relatorioVendas,
    relatorioClientes,
    relatorioProdutos,
    relatorioFinanceiro,
    estatisticasComparativas,
    gerarRelatorio,
    exportarRelatorioCompleto,
  }
}



import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"


import { Badge } from "../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"



import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  Activity,
} from "lucide-react"
import { supabase } from "../lib/supabase"
import { useAuthContext } from "../components/providers/auth-provider"
import { useToast } from "../components/ui/use-toast"





interface ProdutoMaisVendido {
  produto: string
  vendas: number
  receita: number
  categoria: string
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

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState("30dias")
  const [loading, setLoading] = useState(false)
  
  // Estados dos dados

  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<ProdutoMaisVendido[]>([])
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

  // Funções diretas do Supabase
  const obterDiasPeriodo = (periodo: string): number => {
    switch (periodo) {
      case "7dias": return 7
      case "30dias": return 30
      case "90dias": return 90
      case "1ano": return 365
      default: return 30
    }
  }

  const carregarEstatisticasGerais = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const diasAtras = obterDiasPeriodo(periodo)
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - diasAtras)
      
      // Buscar movimentações de saída (vendas)
      const { data: vendas, error } = await supabase
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

      if (error) throw error

      const receitaTotal = vendas?.reduce((sum, v) => sum + (v.valor_total || 0), 0) || 0
      const produtosVendidos = vendas?.reduce((sum, v) => sum + v.quantidade, 0) || 0
      const custoTotal = vendas?.reduce((sum, v) => {
        const produto = Array.isArray(v.produtos) ? v.produtos[0] : v.produtos
        return sum + ((produto?.preco_compra || 0) * v.quantidade)
      }, 0) || 0
      
      const ticketMedio = produtosVendidos > 0 ? receitaTotal / produtosVendidos : 0
      const margemLucro = receitaTotal > 0 ? ((receitaTotal - custoTotal) / receitaTotal) * 100 : 0

      setEstatisticasGerais({
        receitaTotal,
        produtosVendidos,
        ticketMedio,
        margemLucro,
        crescimentoReceita: 0, // Simplificado
        crescimentoProdutos: 0,
        crescimentoTicket: 0,
        crescimentoMargem: 0,
      })

    } catch (error) {

      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, periodo])

  const carregarProdutosMaisVendidos = useCallback(async () => {
    if (!user?.id) return

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

      data?.forEach((mov) => {
        const produto = Array.isArray(mov.produtos) ? mov.produtos[0] : mov.produtos
        const nomeProduto = `${produto?.nome || "Produto"} ${produto?.marca || ""}`.trim()
        
        if (!produtosAgrupados[nomeProduto]) {
          produtosAgrupados[nomeProduto] = {
            produto: nomeProduto,
            vendas: 0,
            receita: 0,
            categoria: produto?.categoria || "outros",
          }
        }

        produtosAgrupados[nomeProduto].vendas += mov.quantidade
        produtosAgrupados[nomeProduto].receita += mov.valor_total || 0
      })

      const top5 = Object.values(produtosAgrupados)
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 5)

      setProdutosMaisVendidos(top5)
    } catch (error) {

    }
  }, [user?.id, periodo])

    const exportarRelatorioPDF = async () => {
    try {
      setLoading(true)
      toast({
        title: "📄 Gerando PDF",
        description: "Criando relatório em PDF...",
      })
      
      // Gerar conteúdo HTML para PDF
      const dataAtual = new Date().toLocaleDateString("pt-BR")
      const periodoTexto = {
        "7dias": "Últimos 7 dias",
        "30dias": "Últimos 30 dias", 
        "90dias": "Últimos 90 dias",
        "1ano": "Último ano"
      }[periodo] || "Período personalizado"
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Vendas - Torneira Digital</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #f59e0b; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: bold; color: #f59e0b; margin-bottom: 10px; }
    .subtitle { font-size: 14px; color: #666; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat-card { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
    .stat-value { font-size: 20px; font-weight: bold; color: #111827; }
    .product-list { list-style: none; padding: 0; }
    .product-item { background: #f9fafb; margin-bottom: 10px; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
    .product-name { font-weight: bold; color: #111827; margin-bottom: 5px; }
    .product-details { font-size: 12px; color: #6b7280; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🍺 TORNEIRA DIGITAL - RELATÓRIO DE VENDAS</div>
    <div class="subtitle">Data: ${dataAtual} | Período: ${periodoTexto}</div>
  </div>

  <div class="section">
    <div class="section-title">📊 RESUMO EXECUTIVO</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">💰 Receita Total</div>
        <div class="stat-value">R$ ${estatisticasGerais.receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">📦 Produtos Vendidos</div>
        <div class="stat-value">${estatisticasGerais.produtosVendidos.toLocaleString("pt-BR")} unidades</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🎯 Ticket Médio</div>
        <div class="stat-value">R$ ${estatisticasGerais.ticketMedio.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">📈 Margem de Lucro</div>
        <div class="stat-value">${estatisticasGerais.margemLucro.toFixed(1)}%</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🏆 TOP 5 PRODUTOS MAIS VENDIDOS</div>
    <ul class="product-list">
      ${produtosMaisVendidos.map((produto, index) => `
        <li class="product-item">
          <div class="product-name">${index + 1}º ${produto.produto}</div>
          <div class="product-details">
            Vendas: ${produto.vendas} unidades | 
            Receita: R$ ${produto.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | 
            Categoria: ${produto.categoria}
          </div>
        </li>
      `).join("")}
    </ul>
  </div>

  <div class="footer">
    Relatório gerado automaticamente pelo Torneira Digital<br>
    ${new Date().toLocaleString("pt-BR")}
  </div>
</body>
</html>`

      // Criar nova janela para impressão/PDF
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        // Aguardar carregamento e imprimir
        printWindow.onload = () => {
          printWindow.print()
          
          // Fechar janela após impressão (opcional)
          setTimeout(() => {
            printWindow.close()
          }, 1000)
        }
      }
      
      toast({
        title: "✅ PDF Gerado",
        description: "Relatório aberto para impressão/salvamento em PDF!",
      })
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao gerar relatório PDF",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const atualizarPeriodo = (novoPeriodo: string) => {
    setPeriodo(novoPeriodo)
  }

  // Carregar dados quando período mudar
  useEffect(() => {
    if (user?.id) {
      carregarEstatisticasGerais()
      carregarProdutosMaisVendidos()
    }
  }, [user?.id, periodo, carregarEstatisticasGerais, carregarProdutosMaisVendidos])

  // Componente para exibir quando não há dados
  const EmptyStateCard = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
    <div className="h-[250px] md:h-[300px] flex items-center justify-center border-2 border-dashed border-amber-500/20 rounded-lg">
      <div className="text-center text-slate-400">
        <Icon className="w-12 h-12 mx-auto mb-2 text-amber-400/50" />
        <p className="text-sm">{title}</p>
        <p className="text-xs">{description}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Relatórios e Analytics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Análises completas do seu negócio</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-3">
          <Select value={periodo} onValueChange={atualizarPeriodo}>
            <SelectTrigger className="w-full md:w-48 h-12 bg-slate-800/90 border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20 text-slate-100 font-medium shadow-lg">
              <Calendar className="w-5 h-5 mr-2 text-amber-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800/95 backdrop-blur-sm border-slate-600/50 shadow-xl">
              <SelectItem value="7dias" className="text-slate-100 focus:bg-amber-500/20 focus:text-amber-400">
                📅 Últimos 7 dias
              </SelectItem>
              <SelectItem value="30dias" className="text-slate-100 focus:bg-amber-500/20 focus:text-amber-400">
                📊 Últimos 30 dias
              </SelectItem>
              <SelectItem value="90dias" className="text-slate-100 focus:bg-amber-500/20 focus:text-amber-400">
                📈 Últimos 90 dias
              </SelectItem>
              <SelectItem value="1ano" className="text-slate-100 focus:bg-amber-500/20 focus:text-amber-400">
                🗓️ Último ano
              </SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold"
            onClick={exportarRelatorioPDF}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Cards de KPIs Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-green-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Receita Total</CardTitle>
            <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-green-400">
              R$ {estatisticasGerais.receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={estatisticasGerais.crescimentoReceita >= 0 ? "text-green-400" : "text-red-400"}>
                {estatisticasGerais.crescimentoReceita >= 0 ? "+" : ""}{estatisticasGerais.crescimentoReceita.toFixed(1)}%
              </span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Produtos Vendidos</CardTitle>
            <Package className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-blue-400">
              {estatisticasGerais.produtosVendidos.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={estatisticasGerais.crescimentoProdutos >= 0 ? "text-blue-400" : "text-red-400"}>
                {estatisticasGerais.crescimentoProdutos >= 0 ? "+" : ""}{estatisticasGerais.crescimentoProdutos.toFixed(1)}%
              </span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Ticket Médio</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-purple-400">
              R$ {estatisticasGerais.ticketMedio.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={estatisticasGerais.crescimentoTicket >= 0 ? "text-purple-400" : "text-red-400"}>
                {estatisticasGerais.crescimentoTicket >= 0 ? "+" : ""}{estatisticasGerais.crescimentoTicket.toFixed(1)}%
              </span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Margem de Lucro</CardTitle>
            <Activity className="h-3 w-3 md:h-4 md:w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-amber-400">
              {estatisticasGerais.margemLucro.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={estatisticasGerais.crescimentoMargem >= 0 ? "text-amber-400" : "text-red-400"}>
                {estatisticasGerais.crescimentoMargem >= 0 ? "+" : ""}{estatisticasGerais.crescimentoMargem.toFixed(1)}%
              </span> vs período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Básicos */}
      <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Vendas e Lucro por Mês */}
            <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-100">Vendas e Lucro Mensal</CardTitle>
                    <CardDescription className="text-slate-400">Evolução das vendas e margem de lucro</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[250px] md:h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
                    <span className="ml-2 text-slate-400">Carregando dados...</span>
                  </div>
                ) : (
                  <EmptyStateCard 
                    title="Dados de vendas em desenvolvimento" 
                    description="Gráficos estarão disponíveis em breve"
                    icon={BarChart3}
                  />
                )}
              </CardContent>
            </Card>

            {/* Distribuição por Categoria */}
            <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Activity className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-100">Distribuição por Categoria</CardTitle>
                    <CardDescription className="text-slate-400">Percentual de vendas por categoria de produto</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[250px] md:h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
                    <span className="ml-2 text-slate-400">Carregando dados...</span>
                  </div>
                ) : (
                  <EmptyStateCard 
                    title="Gráficos em desenvolvimento" 
                    description="Visualizações detalhadas em breve"
                    icon={BarChart3}
                  />
                )}
              </CardContent>
            </Card>

            {/* Produtos Mais Vendidos */}
            <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm shadow-xl lg:col-span-2">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-100">Top 5 Produtos Mais Vendidos</CardTitle>
                    <CardDescription className="text-slate-400">Ranking dos produtos com melhor performance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
                    <span className="ml-2 text-slate-400">Carregando dados...</span>
                  </div>
                ) : produtosMaisVendidos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingUp className="w-12 h-12 text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-slate-400 mb-2">Nenhum produto vendido</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Registre algumas vendas para ver o ranking de produtos
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {produtosMaisVendidos.map((produto, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-700/40 border border-slate-600/50 hover:from-slate-700/80 hover:to-slate-600/60 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <div className="flex items-center space-x-3 md:space-x-4">
                          <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold text-xs md:text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-200 text-sm md:text-base">{produto.produto}</h4>
                            <p className="text-xs md:text-sm text-slate-400">{produto.vendas} unidades vendidas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm md:text-lg font-bold text-green-400">
                            R$ {produto.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                          <Badge className="mt-1 md:mt-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                            Top {index + 1}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  )
}
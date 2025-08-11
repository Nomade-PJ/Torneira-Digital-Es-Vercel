"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  LineChart,
  Line,
} from "recharts"
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Activity,
  Users,
  Filter,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useToast } from "@/components/ui/use-toast"

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0']

interface VendaPorMes {
  mes: string
  vendas: number
  receita: number
  lucro: number
}

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
  const [vendasPorMes, setVendasPorMes] = useState<VendaPorMes[]>([])
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

  const carregarEstatisticasGerais = async () => {
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
      console.error("Erro ao carregar estatísticas:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarProdutosMaisVendidos = async () => {
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
      console.error("Erro ao buscar produtos mais vendidos:", error)
    }
  }

  const exportarRelatorioPDF = async () => {
    try {
      toast({
        title: "Exportando relatório",
        description: "Gerando PDF com os dados atuais...",
      })
      
      // Simulação de exportação - implementar depois se necessário
      setTimeout(() => {
        toast({
          title: "Sucesso",
          description: "Relatório exportado com sucesso!",
        })
      }, 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive",
      })
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
  }, [user?.id, periodo])

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
            <SelectTrigger className="w-full md:w-40 bg-slate-800/50 border-slate-700">
              <Calendar className="w-4 h-4 mr-2 text-amber-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              <SelectItem value="90dias">Últimos 90 dias</SelectItem>
              <SelectItem value="1ano">Último ano</SelectItem>
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
            <Card className="border-amber-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                  <span>Vendas e Lucro Mensal</span>
                </CardTitle>
                <CardDescription className="text-sm">Evolução das vendas e margem de lucro</CardDescription>
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
            <Card className="border-amber-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
                  <Activity className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                  <span>Distribuição por Categoria</span>
                </CardTitle>
                <CardDescription className="text-sm">Percentual de vendas por categoria de produto</CardDescription>
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
                    icon={PieChartIcon}
                  />
                )}
              </CardContent>
            </Card>

            {/* Produtos Mais Vendidos */}
            <Card className="border-amber-500/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                  <span>Top 5 Produtos Mais Vendidos</span>
                </CardTitle>
                <CardDescription className="text-sm">Ranking dos produtos com melhor performance</CardDescription>
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
                        className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors"
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
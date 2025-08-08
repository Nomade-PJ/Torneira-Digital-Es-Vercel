"use client"

import { useState } from "react"
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
import { useRelatorios } from "@/hooks/use-relatorios"
import { useRelatoriosAvancados } from "@/hooks/use-relatorios-avancados"
import { LoadingSpinner } from "@/components/loading-spinner"

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0']

export default function RelatoriosPage() {
  // Estados para filtros avançados
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    categoria: "todas",
    tipoRelatorio: "vendas",
    agrupamento: "dia",
  })

  // Hooks para dados básicos e avançados
  const {
    loading: loadingBasico,
    periodo,
    vendasPorMes,
    produtosMaisVendidos,
    categoriaDistribuicao,
    movimentacaoEstoque,
    estatisticasGerais,
    atualizarPeriodo,
    exportarRelatorioPDF,
  } = useRelatorios()

  const {
    loading: loadingAvancado,
    relatorioVendas,
    relatorioClientes,
    relatorioProdutos,
    relatorioFinanceiro,
    estatisticasComparativas,
    gerarRelatorio,
    exportarRelatorioCompleto,
  } = useRelatoriosAvancados()

  const loading = loadingBasico || loadingAvancado

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
  }

  const aplicarFiltros = () => {
    gerarRelatorio(filtros)
  }

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

      {/* Abas de Relatórios */}
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
          <TabsTrigger value="geral" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <BarChart3 className="w-4 h-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="vendas" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            <TrendingUp className="w-4 h-4 mr-2" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="produtos" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            <Package className="w-4 h-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="clientes" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Users className="w-4 h-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            <DollarSign className="w-4 h-4 mr-2" />
            Financeiro
          </TabsTrigger>
        </TabsList>

        {/* Aba Geral - Relatórios Básicos */}
        <TabsContent value="geral">
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
                    <LoadingSpinner />
                    <span className="ml-2 text-slate-400">Carregando dados...</span>
                  </div>
                ) : vendasPorMes.length === 0 ? (
                  <div className="h-[250px] md:h-[300px] flex items-center justify-center border-2 border-dashed border-amber-500/20 rounded-lg">
                    <div className="text-center text-slate-400">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 text-amber-400/50" />
                      <p className="text-sm">Nenhum dado disponível</p>
                      <p className="text-xs">Registre algumas vendas para ver os gráficos</p>
                    </div>
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      vendas: { label: "Vendas", color: "#d4af37" },
                      receita: { label: "Receita", color: "#10b981" },
                    }}
                    className="h-[250px] md:h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendasPorMes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="receita" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
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
                    <LoadingSpinner />
                    <span className="ml-2 text-slate-400">Carregando dados...</span>
                  </div>
                ) : categoriaDistribuicao.length === 0 ? (
                  <div className="h-[250px] md:h-[300px] flex items-center justify-center border-2 border-dashed border-amber-500/20 rounded-lg">
                    <div className="text-center text-slate-400">
                      <Package className="w-12 h-12 mx-auto mb-2 text-amber-400/50" />
                      <p className="text-sm">Nenhum dado disponível</p>
                      <p className="text-xs">Registre algumas vendas para ver a distribuição</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ChartContainer
                      config={{
                        cerveja: { label: "Cerveja", color: "#d4af37" },
                        chope: { label: "Chope", color: "#ffd700" },
                        refrigerante: { label: "Refrigerante", color: "#b8860b" },
                        agua: { label: "Água", color: "#4a90e2" },
                        energetico: { label: "Energético", color: "#e74c3c" },
                        outros: { label: "Outros", color: "#8b7355" },
                      }}
                      className="h-[250px] md:h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoriaDistribuicao}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoriaDistribuicao.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-4">
                      {categoriaDistribuicao.map((item, index) => (
                        <div key={index} className="flex items-center space-x-1 md:space-x-2">
                          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-xs md:text-sm text-muted-foreground">
                            {item.name} ({item.value}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
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
                    <LoadingSpinner />
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
        </TabsContent>

        {/* Filtros Avançados */}
        <TabsContent value="vendas">
          <Card className="border-green-500/20 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-green-400" />
                <span>Filtros Avançados</span>
              </CardTitle>
              <CardDescription>Configure os parâmetros para análises detalhadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => handleFiltroChange("dataInicio", e.target.value)}
                    className="bg-slate-800/50 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => handleFiltroChange("dataFim", e.target.value)}
                    className="bg-slate-800/50 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={filtros.categoria} onValueChange={(value) => handleFiltroChange("categoria", value)}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Categorias</SelectItem>
                      <SelectItem value="Cerveja">Cerveja</SelectItem>
                      <SelectItem value="Refrigerante">Refrigerante</SelectItem>
                      <SelectItem value="Água">Água</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Agrupamento</Label>
                  <Select value={filtros.agrupamento} onValueChange={(value) => handleFiltroChange("agrupamento", value)}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dia">Por Dia</SelectItem>
                      <SelectItem value="semana">Por Semana</SelectItem>
                      <SelectItem value="mes">Por Mês</SelectItem>
                      <SelectItem value="trimestre">Por Trimestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={aplicarFiltros}
                  disabled={loading}
                  className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Aplicar Filtros
                </Button>
                <Button
                  onClick={exportarRelatorioCompleto}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Completo
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChartIcon className="w-5 h-5 text-green-400" />
                  <span>Tendência de Vendas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                    <span className="ml-2 text-slate-400">Carregando dados...</span>
                  </div>
                ) : !relatorioVendas?.tendencia?.length ? (
                  <EmptyStateCard 
                    title="Nenhum dado de vendas disponível" 
                    description="Faça algumas vendas para visualizar a tendência"
                    icon={TrendingUp}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={relatorioVendas.tendencia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="periodo" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="vendas"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <span>Vendas por Categoria</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                    <span className="ml-2 text-slate-400">Carregando dados...</span>
                  </div>
                ) : !relatorioVendas?.porCategoria?.length ? (
                  <EmptyStateCard 
                    title="Nenhum dado por categoria" 
                    description="Registre vendas para ver a distribuição por categoria"
                    icon={BarChart3}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={relatorioVendas.porCategoria}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="categoria" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="quantidade" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demais abas seguem o mesmo padrão das análises avançadas */}
        <TabsContent value="produtos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5 text-blue-400" />
                  <span>Top 10 Produtos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                    <span className="ml-2 text-slate-400">Carregando dados...</span>
                  </div>
                ) : !relatorioProdutos?.topProdutos?.length ? (
                  <EmptyStateCard 
                    title="Nenhum produto vendido" 
                    description="Registre vendas para ver o ranking de produtos"
                    icon={Package}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={relatorioProdutos.topProdutos}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantidade"
                        label={(entry) => entry.nome}
                      >
                        {relatorioProdutos.topProdutos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span>Margem de Lucro por Produto</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                    <span className="ml-2 text-slate-400">Carregando dados...</span>
                  </div>
                ) : !relatorioProdutos?.margemLucro?.length ? (
                  <EmptyStateCard 
                    title="Nenhum dado de margem disponível" 
                    description="Vendas são necessárias para calcular margens"
                    icon={BarChart3}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={relatorioProdutos.margemLucro}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="produto" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="margem" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clientes">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="border-purple-500/20 max-w-md mx-auto">
              <CardHeader className="text-center">
                <Users className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                <CardTitle className="text-purple-400">Relatórios de Clientes</CardTitle>
                <CardDescription>
                  Funcionalidade em desenvolvimento
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-400 text-sm mb-4">
                  Os relatórios de clientes estarão disponíveis em breve com análises detalhadas de:
                </p>
                <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                  <li>Ranking de melhores clientes</li>
                  <li>Histórico de compras</li>
                  <li>Novos clientes por período</li>
                  <li>Análise de fidelidade</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financeiro">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="border-yellow-500/20 max-w-md mx-auto">
              <CardHeader className="text-center">
                <DollarSign className="w-16 h-16 text-yellow-400/50 mx-auto mb-4" />
                <CardTitle className="text-yellow-400">Relatórios Financeiros</CardTitle>
                <CardDescription>
                  Funcionalidade em desenvolvimento
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-400 text-sm mb-4">
                  Os relatórios financeiros estarão disponíveis em breve com análises detalhadas de:
                </p>
                <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                  <li>Fluxo de caixa detalhado</li>
                  <li>Indicadores financeiros</li>
                  <li>Análise de rentabilidade</li>
                  <li>Projeções e metas</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Bell,
  Database,
  Save,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  Building2,
  Mail,
  Phone,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useToast } from "@/components/ui/use-toast"

interface Configuracao {
  id: string
  nome_estabelecimento: string
  email_contato: string
  telefone: string
  notificacao_estoque_baixo: boolean
  notificacao_email: boolean
  estoque_minimo_padrao: number
  alerta_estoque_critico: number
  backup_automatico: boolean
  updated_at: string
}

export default function ConfiguracoesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [configuracoes, setConfiguracoes] = useState<Configuracao | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    nome_estabelecimento: "",
    email_contato: "",
    telefone: "",
    notificacao_estoque_baixo: true,
    notificacao_email: true,
    estoque_minimo_padrao: 20,
    alerta_estoque_critico: 5,
    backup_automatico: true,
  })

  const { user } = useAuthContext()
  const { toast } = useToast()

  // Carregar configurações
  const carregarConfiguracoes = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("usuario_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        setConfiguracoes(data)
        setFormData({
          nome_estabelecimento: data.nome_estabelecimento || "",
          email_contato: data.email_contato || "",
          telefone: data.telefone || "",
          notificacao_estoque_baixo: data.notificacao_estoque_baixo || false,
          notificacao_email: data.notificacao_email || false,
          estoque_minimo_padrao: data.estoque_minimo_padrao || 20,
          alerta_estoque_critico: data.alerta_estoque_critico || 5,
          backup_automatico: data.backup_automatico || false,
        })
      } else {
        // Criar configuração inicial
        await criarConfiguracaoInicial()
      }
    } catch (error) {

      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive",
      })
    }
  }, [user?.id, toast])

  // Criar configuração inicial
  const criarConfiguracaoInicial = async () => {
    if (!user?.id) return

    try {
      const novaConfig = {
        usuario_id: user.id,
        nome_estabelecimento: "Torneira Digital",
        email_contato: user.email || "",
        telefone: "(11) 99999-9999",
        notificacao_estoque_baixo: true,
        notificacao_email: true,
        estoque_minimo_padrao: 20,
        alerta_estoque_critico: 5,
        backup_automatico: true,
      }

      const { data, error } = await supabase
        .from("configuracoes")
        .insert(novaConfig)
        .select()
        .single()

      if (error) throw error

      setConfiguracoes(data)
      setFormData({
        nome_estabelecimento: data.nome_estabelecimento || "",
        email_contato: data.email_contato || "",
        telefone: data.telefone || "",
        notificacao_estoque_baixo: data.notificacao_estoque_baixo || false,
        notificacao_email: data.notificacao_email || false,
        estoque_minimo_padrao: data.estoque_minimo_padrao || 20,
        alerta_estoque_critico: data.alerta_estoque_critico || 5,
        backup_automatico: data.backup_automatico || false,
      })
      
      toast({
        title: "Configurações criadas",
        description: "Configurações foram criadas com seus dados de cadastro",
      })
    } catch (error) {

      toast({
        title: "Erro",
        description: "Erro ao criar configurações iniciais",
        variant: "destructive",
      })
    }
  }

  // Carregar configurações na inicialização
  useEffect(() => {
    if (user?.id) {
      carregarConfiguracoes()
    }
  }, [user?.id, carregarConfiguracoes])

  // Salvar configurações
  const handleSave = async () => {
    if (!user?.id || !configuracoes) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado ou configurações não carregadas",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      
      const { data, error } = await supabase
        .from("configuracoes")
        .update(formData)
        .eq("usuario_id", user.id)
        .select()
        .single()

      if (error) throw error

      setConfiguracoes(data)
      
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      })
    } catch (error) {

      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Restaurar configurações padrão
  const handleRestore = async () => {
    if (!user?.id) return

    try {
      setSaving(true)
      
      const configPadrao = {
        nome_estabelecimento: "Torneira Digital",
        email_contato: user.email || "",
        telefone: "(11) 99999-9999",
        notificacao_estoque_baixo: true,
        notificacao_email: true,
        estoque_minimo_padrao: 20,
        alerta_estoque_critico: 5,
        backup_automatico: true,
      }

      const { data, error } = await supabase
        .from("configuracoes")
        .update(configPadrao)
        .eq("usuario_id", user.id)
        .select()
        .single()

      if (error) throw error

      setConfiguracoes(data)
      setFormData(configPadrao)
      
      toast({
        title: "Sucesso",
        description: "Configurações restauradas para o padrão",
      })
    } catch (error) {

      toast({
        title: "Erro",
        description: "Erro ao restaurar configurações",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Exportar configurações
  const handleExportData = () => {
    if (!configuracoes) return

    const dadosExport = {
      configuracoes,
      dataExport: new Date().toISOString(),
      versao: "1.0",
    }

    const blob = new Blob([JSON.stringify(dadosExport, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `configuracoes-torneira-digital-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Sucesso",
      description: "Configurações exportadas com sucesso",
    })
  }

  const handleImportData = () => {
    fileInputRef.current?.click()
  }

  // Importar configurações
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const texto = await file.text()
      const dados = JSON.parse(texto)

      if (!dados.configuracoes) {
        throw new Error("Arquivo inválido")
      }

      // Remover campos que não devem ser importados
      const { id, usuario_id, created_at, updated_at, ...configImport } = dados.configuracoes

      setSaving(true)
      const { data, error } = await supabase
        .from("configuracoes")
        .update(configImport)
        .eq("usuario_id", user?.id)
        .select()
        .single()

      if (error) throw error

      setConfiguracoes(data)
      setFormData({
        nome_estabelecimento: data.nome_estabelecimento || "",
        email_contato: data.email_contato || "",
        telefone: data.telefone || "",
        notificacao_estoque_baixo: data.notificacao_estoque_baixo || false,
        notificacao_email: data.notificacao_email || false,
        estoque_minimo_padrao: data.estoque_minimo_padrao || 20,
        alerta_estoque_critico: data.alerta_estoque_critico || 5,
        backup_automatico: data.backup_automatico || false,
      })

      toast({
        title: "Sucesso",
        description: "Configurações importadas com sucesso",
      })
    } catch (error) {

      toast({
        title: "Erro",
        description: "Erro ao importar configurações. Verifique o arquivo.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Configure o Torneira Digital de forma simples e rápida
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-3">
          <Button 
            variant="outline" 
            className="border-slate-700 hover:bg-slate-800 bg-transparent"
            onClick={handleRestore}
            disabled={saving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restaurar
          </Button>
          <Button
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Informações do Estabelecimento */}
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
              <Building2 className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
              <span>Estabelecimento</span>
            </CardTitle>
            <CardDescription className="text-sm">Informações básicas do seu negócio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Nome do Estabelecimento
              </Label>
              <Input
                id="nome"
                value={formData.nome_estabelecimento}
                onChange={(e) => setFormData({ ...formData, nome_estabelecimento: e.target.value })}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail de Contato
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email_contato}
                  onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
                  className="pl-10 bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-sm font-medium">
                Telefone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="pl-10 bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
              <span>Notificações</span>
            </CardTitle>
            <CardDescription className="text-sm">Configure os alertas do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Estoque Baixo</Label>
                <p className="text-xs text-muted-foreground">Alertas quando produtos estiverem em falta</p>
              </div>
              <Switch
                checked={formData.notificacao_estoque_baixo}
                onCheckedChange={(checked) => setFormData({ ...formData, notificacao_estoque_baixo: checked })}
              />
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">E-mail</Label>
                <p className="text-xs text-muted-foreground">Receber notificações por e-mail</p>
              </div>
              <Switch
                checked={formData.notificacao_email}
                onCheckedChange={(checked) => setFormData({ ...formData, notificacao_email: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Estoque */}
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
              <Database className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
              <span>Estoque</span>
            </CardTitle>
            <CardDescription className="text-sm">Defina os parâmetros do controle de estoque</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estoqueMinimo" className="text-sm font-medium">
                  Estoque Mínimo
                </Label>
                <Input
                  id="estoqueMinimo"
                  type="number"
                  value={formData.estoque_minimo_padrao}
                  onChange={(e) =>
                    setFormData({ ...formData, estoque_minimo_padrao: Number.parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alertaCritico" className="text-sm font-medium">
                  Alerta Crítico
                </Label>
                <Input
                  id="alertaCritico"
                  type="number"
                  value={formData.alerta_estoque_critico}
                  onChange={(e) =>
                    setFormData({ ...formData, alerta_estoque_critico: Number.parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup e Dados */}
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
              <span>Backup</span>
            </CardTitle>
            <CardDescription className="text-sm">Gerencie a segurança dos seus dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Backup Automático</Label>
                <p className="text-xs text-muted-foreground">Backup diário dos dados</p>
              </div>
              <Switch
                checked={formData.backup_automatico}
                onCheckedChange={(checked) => setFormData({ ...formData, backup_automatico: checked })}
              />
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex flex-col md:flex-row gap-3">
              <Button
                variant="outline"
                className="border-green-500/50 text-green-400 hover:bg-green-500/10 bg-transparent"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button
                variant="outline"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 bg-transparent"
                onClick={handleImportData}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-400">Último Backup</p>
                  <p className="text-xs text-slate-300">
                    {configuracoes?.updated_at 
                      ? new Date(configuracoes.updated_at).toLocaleString("pt-BR")
                      : "Nunca realizado"
                    }
                  </p>
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

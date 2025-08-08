"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/database"

type Configuracao = Database["public"]["Tables"]["configuracoes"]["Row"]
type NovaConfiguracao = Database["public"]["Tables"]["configuracoes"]["Insert"]
type AtualizarConfiguracao = Database["public"]["Tables"]["configuracoes"]["Update"]

// Configurações padrão
const configuracoesDefault: Partial<NovaConfiguracao> = {
  nome_estabelecimento: "Torneira Digital",
  email_contato: "",
  telefone: "(11) 99999-9999",
  endereco: "",
  notificacao_estoque_baixo: true,
  notificacao_email: true,
  notificacao_push: false,
  estoque_minimo_padrao: 20,
  alerta_estoque_critico: 5,
  backup_automatico: true,
  frequencia_backup: "diario",
  moeda: "BRL",
  formato_data: "DD/MM/YYYY",
  dias_relatorio_padrao: 30,
}

export function useConfiguracoes() {
  const [configuracoes, setConfiguracoes] = useState<Configuracao | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { user } = useAuthContext()
  const { toast } = useToast()

  // Buscar configurações do usuário
  const fetchConfiguracoes = async (forceReload = false) => {
    if (!user) return

    try {
      // Loading removido - carregamento instantâneo
      const { data, error } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("usuario_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        // Auto-preenchimento de campos vazios com dados do usuário
        const updateData: any = {}
        let needsUpdate = false

        if (!data.email_contato && user.email) {
          updateData.email_contato = user.email
          data.email_contato = user.email
          needsUpdate = true
        }

        // Se nome_estabelecimento estiver vazio ou for o padrão, buscar do perfil
        if ((!data.nome_estabelecimento || data.nome_estabelecimento === "Torneira Digital") && user.user_metadata?.nome_estabelecimento) {
          updateData.nome_estabelecimento = user.user_metadata.nome_estabelecimento
          data.nome_estabelecimento = user.user_metadata.nome_estabelecimento
          needsUpdate = true
        }

        // Se telefone estiver vazio ou for o padrão, buscar do perfil
        if ((!data.telefone || data.telefone === "(11) 99999-9999") && user.user_metadata?.telefone) {
          updateData.telefone = user.user_metadata.telefone
          data.telefone = user.user_metadata.telefone
          needsUpdate = true
        }

        // Atualizar no banco se necessário
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from("configuracoes")
            .update(updateData)
            .eq("usuario_id", user.id)
          
          if (!updateError) {
            console.log("✅ Configurações auto-preenchidas com dados do usuário")
          }
        }

        setConfiguracoes(data)
      } else {
        // Se não existir configuração, criar uma padrão
        await criarConfiguracaoInicial()
      }
    } catch (error: any) {
      console.error("Erro ao buscar configurações:", error)
      setError(error.message)
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive",
      })
    } finally {
      // Loading removido completamente
    }
  }

  // Criar configuração inicial
  const criarConfiguracaoInicial = async () => {
    if (!user) return

    try {
      // Buscar dados do perfil do usuário para usar nas configurações
      const { data: userProfile } = await supabase
        .from("usuarios")
        .select("nome_estabelecimento, telefone, cnpj_cpf")
        .eq("id", user.id)
        .single()

      const novaConfig = {
        ...configuracoesDefault,
        usuario_id: user.id,
        email_contato: user.email || "",
        nome_estabelecimento: userProfile?.nome_estabelecimento || "Torneira Digital",
        telefone: userProfile?.telefone || "(11) 99999-9999",
      }

      const { data, error } = await supabase
        .from("configuracoes")
        .insert(novaConfig)
        .select()
        .single()

      if (error) throw error

      setConfiguracoes(data)
      
      toast({
        title: "Configurações criadas",
        description: "Configurações foram criadas com seus dados de cadastro",
      })

    } catch (error: any) {
      console.error("Erro ao criar configuração inicial:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar configurações iniciais",
        variant: "destructive",
      })
    }
  }

  // Salvar configurações
  const salvarConfiguracoes = async (novasConfiguracoes: Partial<AtualizarConfiguracao>) => {
    if (!user || !configuracoes) throw new Error("Usuário não autenticado ou configurações não carregadas")

    try {
      setSaving(true)
      
      const { data, error } = await supabase
        .from("configuracoes")
        .update(novasConfiguracoes)
        .eq("usuario_id", user.id)
        .select()
        .single()

      if (error) throw error

      setConfiguracoes(data)
      
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      })

      return data
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      })
      throw error
    } finally {
      setSaving(false)
    }
  }

  // Restaurar configurações padrão
  const restaurarPadrao = async () => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      setSaving(true)
      
      const configPadrao = {
        ...configuracoesDefault,
        email_contato: user.email || "",
      }

      const { data, error } = await supabase
        .from("configuracoes")
        .update(configPadrao)
        .eq("usuario_id", user.id)
        .select()
        .single()

      if (error) throw error

      setConfiguracoes(data)
      
      toast({
        title: "Sucesso",
        description: "Configurações restauradas para o padrão",
      })

      return data
    } catch (error: any) {
      console.error("Erro ao restaurar configurações:", error)
      toast({
        title: "Erro",
        description: "Erro ao restaurar configurações",
        variant: "destructive",
      })
      throw error
    } finally {
      setSaving(false)
    }
  }

  // Exportar configurações
  const exportarConfiguracoes = () => {
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

  // Importar configurações
  const importarConfiguracoes = async (arquivo: File) => {
    try {
      const texto = await arquivo.text()
      const dados = JSON.parse(texto)

      if (!dados.configuracoes) {
        throw new Error("Arquivo inválido")
      }

      // Remover campos que não devem ser importados
      const { id, usuario_id, created_at, updated_at, ...configImport } = dados.configuracoes

      await salvarConfiguracoes(configImport)

      toast({
        title: "Sucesso",
        description: "Configurações importadas com sucesso",
      })

    } catch (error: any) {
      console.error("Erro ao importar configurações:", error)
      toast({
        title: "Erro",
        description: "Erro ao importar configurações. Verifique o arquivo.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Backup automático
  const realizarBackup = async () => {
    if (!configuracoes?.backup_automatico) return

    try {
      // Buscar todos os dados do usuário
      const [produtosData, movimentacoesData, configData] = await Promise.all([
        supabase.from("produtos").select("*").eq("usuario_id", user?.id),
        supabase.from("movimentacoes").select("*").eq("usuario_id", user?.id),
        supabase.from("configuracoes").select("*").eq("usuario_id", user?.id),
      ])

      const backup = {
        produtos: produtosData.data,
        movimentacoes: movimentacoesData.data,
        configuracoes: configData.data,
        dataBackup: new Date().toISOString(),
        versao: "1.0",
      }

      // Você pode implementar aqui o envio para um serviço de backup
      console.log("Backup realizado:", backup)

      toast({
        title: "Backup realizado",
        description: "Backup automático realizado com sucesso",
      })

    } catch (error: any) {
      console.error("Erro no backup:", error)
    }
  }

  useEffect(() => {
    fetchConfiguracoes()
  }, [user])

  // Realizar backup automático periodicamente
  useEffect(() => {
    if (configuracoes?.backup_automatico) {
      const interval = setInterval(() => {
        realizarBackup()
      }, 24 * 60 * 60 * 1000) // 24 horas

      return () => clearInterval(interval)
    }
  }, [configuracoes?.backup_automatico])

  return {
    configuracoes,
    loading,
    error,
    saving,
    salvarConfiguracoes,
    restaurarPadrao,
    exportarConfiguracoes,
    importarConfiguracoes,
    realizarBackup,
    refetch: fetchConfiguracoes,
  }
}
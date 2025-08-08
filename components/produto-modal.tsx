"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { produtoSchema, categoriasProdutos } from "@/lib/validations"
import type { z } from "zod"

type ProdutoData = z.infer<typeof produtoSchema>

interface ProdutoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (produto: ProdutoData) => Promise<any>
  produto?: any // Para edição
}

export function ProdutoModal({ open, onOpenChange, onSave, produto }: ProdutoModalProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<ProdutoData>({
    nome: produto?.nome || "",
    categoria: produto?.categoria || "",
    estoque_atual: produto?.estoque_atual || 0,
    estoque_minimo: produto?.estoque_minimo || 10,
    preco_compra: produto?.preco_compra || 0,
    preco_venda: produto?.preco_venda || 0,
    // Campos opcionais
    marca: produto?.marca || "",
    volume: produto?.volume || "",
    fornecedor: produto?.fornecedor || "",
    descricao: produto?.descricao || "",
    codigo_barras: produto?.codigo_barras || "",
    data_validade: produto?.data_validade || "",
    imagem_url: produto?.imagem_url || "",
  })

  const resetForm = () => {
    setFormData({
      nome: "",
      categoria: "",
      estoque_atual: 0,
      estoque_minimo: 10,
      preco_compra: 0,
      preco_venda: 0,
      // Campos opcionais
      marca: "",
      volume: "",
      fornecedor: "",
      descricao: "",
      codigo_barras: "",
      data_validade: "",
      imagem_url: "",
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Preparar dados para validação - remover campos vazios que podem causar erros
      const dataToValidate = {
        ...formData,
        estoque_atual: Number(formData.estoque_atual),
        estoque_minimo: Number(formData.estoque_minimo),
        preco_compra: Number(formData.preco_compra),
        preco_venda: Number(formData.preco_venda),
      }

      // Remover data_validade se estiver vazia para evitar erro de tipo date
      if (!dataToValidate.data_validade || dataToValidate.data_validade.trim() === "") {
        delete dataToValidate.data_validade
      }

      // Remover outros campos opcionais se estiverem vazios
      Object.keys(dataToValidate).forEach(key => {
        if (dataToValidate[key as keyof typeof dataToValidate] === "" || dataToValidate[key as keyof typeof dataToValidate] === null) {
          delete dataToValidate[key as keyof typeof dataToValidate]
        }
      })

      // Validar dados
      const validatedData = produtoSchema.parse(dataToValidate)

      await onSave(validatedData)
      
      toast.success(produto ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!")
      resetForm()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error)
      
      if (error.errors) {
        // Erros de validação do Zod
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        toast.error("Erro ao salvar produto: " + (error.message || "Erro desconhecido"))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProdutoData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando usuário digita
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-amber-500/20 mobile-dialog">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            {produto ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
          <DialogDescription>
            {produto ? "Edite as informações do produto" : "Preencha as informações do novo produto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome - OBRIGATÓRIO */}
            <div className="md:col-span-2">
              <Label htmlFor="nome" className="text-slate-200">Nome do Produto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Ex: Cerveja Heineken 600ml"
                className="bg-slate-800/50 border-slate-600 text-white"
              />
              {errors.nome && <p className="text-sm text-red-400 mt-1">{errors.nome}</p>}
            </div>

            {/* Marca */}
            <div>
              <Label htmlFor="marca" className="text-slate-200">Marca *</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => handleInputChange("marca", e.target.value)}
                placeholder="Ex: Heineken"
                className="bg-slate-800/50 border-slate-600 text-white"
              />
              {errors.marca && <p className="text-sm text-red-400 mt-1">{errors.marca}</p>}
            </div>

            {/* Volume */}
            <div>
              <Label htmlFor="volume" className="text-slate-200">Volume *</Label>
              <Input
                id="volume"
                value={formData.volume}
                onChange={(e) => handleInputChange("volume", e.target.value)}
                placeholder="Ex: 600ml, 1L"
                className="bg-slate-800/50 border-slate-600 text-white"
              />
              {errors.volume && <p className="text-sm text-red-400 mt-1">{errors.volume}</p>}
            </div>

            {/* Categoria - OBRIGATÓRIO */}
            <div>
              <Label htmlFor="categoria" className="text-slate-200">Categoria *</Label>
              <Select value={formData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {categoriasProdutos.map((categoria) => (
                    <SelectItem key={categoria} value={categoria} className="text-white hover:bg-slate-700">
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria && <p className="text-sm text-red-400 mt-1">{errors.categoria}</p>}
            </div>

            {/* Estoque Atual */}
            <div>
              <Label htmlFor="estoque_atual" className="text-slate-200">Estoque Atual</Label>
              <Input
                id="estoque_atual"
                type="number"
                min="0"
                value={formData.estoque_atual || ""}
                onChange={(e) => handleInputChange("estoque_atual", e.target.value === "" ? 0 : Number(e.target.value))}
                placeholder="0"
                className="bg-slate-800/50 border-slate-600 text-white"
              />
              {errors.estoque_atual && <p className="text-sm text-red-400 mt-1">{errors.estoque_atual}</p>}
            </div>

            {/* Estoque Mínimo */}
            <div>
              <Label htmlFor="estoque_minimo" className="text-slate-200">Estoque Mínimo</Label>
              <Input
                id="estoque_minimo"
                type="number"
                min="0"
                value={formData.estoque_minimo || ""}
                onChange={(e) => handleInputChange("estoque_minimo", e.target.value === "" ? 0 : Number(e.target.value))}
                placeholder="10"
                className="bg-slate-800/50 border-slate-600 text-white"
              />
              {errors.estoque_minimo && <p className="text-sm text-red-400 mt-1">{errors.estoque_minimo}</p>}
            </div>

            {/* Preço de Compra */}
            <div>
              <Label htmlFor="preco_compra" className="text-slate-200">Preço de Compra (R$)</Label>
              <Input
                id="preco_compra"
                type="number"
                min="0"
                step="0.01"
                value={formData.preco_compra || ""}
                onChange={(e) => handleInputChange("preco_compra", e.target.value === "" ? 0 : Number(e.target.value))}
                placeholder="0.00"
                className="bg-slate-800/50 border-slate-600 text-white"
              />
              {errors.preco_compra && <p className="text-sm text-red-400 mt-1">{errors.preco_compra}</p>}
            </div>

            {/* Preço de Venda */}
            <div>
              <Label htmlFor="preco_venda" className="text-slate-200">Preço de Venda (R$)</Label>
              <Input
                id="preco_venda"
                type="number"
                min="0"
                step="0.01"
                value={formData.preco_venda || ""}
                onChange={(e) => handleInputChange("preco_venda", e.target.value === "" ? 0 : Number(e.target.value))}
                placeholder="0.00"
                className="bg-slate-800/50 border-slate-600 text-white"
              />
              {errors.preco_venda && <p className="text-sm text-red-400 mt-1">{errors.preco_venda}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold"
            >
              {loading ? "Salvando..." : produto ? "Atualizar" : "Criar Produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
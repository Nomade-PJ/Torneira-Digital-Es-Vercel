import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { X, Save } from "lucide-react"
import { toast } from "sonner"
import { produtoSchema, categoriasProdutos } from "../lib/validations"
import { z } from "zod"
import { BarcodeScanner } from "./barcode-scanner"

type ProdutoFormData = z.infer<typeof produtoSchema>

interface ProdutoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto?: ProdutoFormData | null
  onSave: (produto: ProdutoFormData) => Promise<void>
}

export function ProdutoModal({ open, onOpenChange, produto, onSave }: ProdutoModalProps) {
  const [formData, setFormData] = useState<ProdutoFormData>({
    nome: "",
    marca: "",
    volume: "",
    categoria: "",
    preco_compra: 0,
    preco_venda: 0,
    estoque_atual: 0,
    estoque_minimo: 10,
    codigo_barras: "",
    fornecedor: "",
    data_validade: null,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (produto) {
      setFormData({
        ...produto,
        data_validade: produto.data_validade || null,
      })
    } else {
      setFormData({
        nome: "",
        marca: "",
        volume: "",
        categoria: "",
        preco_compra: 0,
        preco_venda: 0,
        estoque_atual: 0,
        estoque_minimo: 10,
        codigo_barras: "",
        fornecedor: "",
        data_validade: null,
      })
    }
    setErrors({})
  }, [produto, open])

  const handleInputChange = (field: keyof ProdutoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const validatedData = produtoSchema.parse(formData)
      await onSave(validatedData)
      onOpenChange(false)
      toast.success(produto ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!")
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        toast.error("Erro ao salvar produto. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-slate-900/98 backdrop-blur-md border-amber-500/30 shadow-2xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            {produto ? "✏️ Editar Produto" : "➕ Novo Produto"}
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-base">
            {produto ? "Atualize as informações do produto selecionado" : "Preencha as informações do novo produto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="p-6 bg-gradient-to-r from-slate-800/60 to-slate-700/40 rounded-xl border border-slate-600/50">
            <h3 className="text-xl font-bold text-amber-400 mb-6">📦 Informações do Produto</h3>
            <div className="space-y-6">
              {/* Nome - OBRIGATÓRIO */}
              <div>
                <Label htmlFor="nome" className="text-slate-300 font-semibold text-base">🏷️ Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  placeholder="Ex: Cerveja Heineken 600ml"
                  className="mt-3 h-14 bg-slate-800/80 border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20 text-slate-100 font-medium text-base"
                />
                {errors.nome && <p className="text-sm text-red-400 mt-2">{errors.nome}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Marca */}
                <div>
                  <Label htmlFor="marca" className="text-slate-300 font-semibold text-base">🏭 Marca *</Label>
                  <Input
                    id="marca"
                    value={formData.marca}
                    onChange={(e) => handleInputChange("marca", e.target.value)}
                    placeholder="Ex: Heineken"
                    className="mt-3 h-14 bg-slate-800/80 border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20 text-slate-100 font-medium text-base"
                  />
                  {errors.marca && <p className="text-sm text-red-400 mt-2">{errors.marca}</p>}
                </div>

                {/* Volume */}
                <div>
                  <Label htmlFor="volume" className="text-slate-300 font-semibold text-base">📏 Volume *</Label>
                  <Input
                    id="volume"
                    value={formData.volume}
                    onChange={(e) => handleInputChange("volume", e.target.value)}
                    placeholder="Ex: 600ml, 1L"
                    className="mt-3 h-14 bg-slate-800/80 border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20 text-slate-100 font-medium text-base"
                  />
                  {errors.volume && <p className="text-sm text-red-400 mt-2">{errors.volume}</p>}
                </div>
              </div>

              {/* Categoria - OBRIGATÓRIO */}
              <div>
                <Label htmlFor="categoria" className="text-slate-300 font-semibold text-base">🗂️ Categoria *</Label>
                <Select value={formData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
                  <SelectTrigger className="mt-3 h-14 bg-slate-800/80 border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20 text-slate-100 font-medium text-base">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800/95 backdrop-blur-sm border-slate-600/50 z-[99999]">
                    {categoriasProdutos.map((categoria) => (
                      <SelectItem key={categoria} value={categoria} className="text-slate-100 focus:bg-amber-500/20 focus:text-amber-400">
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoria && <p className="text-sm text-red-400 mt-2">{errors.categoria}</p>}
              </div>
            </div>
          </div>

          {/* Preços e Estoque */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Preços */}
            <div className="p-6 bg-gradient-to-r from-green-800/60 to-green-700/40 rounded-xl border border-green-600/50">
              <h3 className="text-xl font-bold text-green-400 mb-6">💰 Preços</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="preco_compra" className="text-slate-300 font-semibold text-base">🛒 Preço de Compra (R$)</Label>
                  <Input
                    id="preco_compra"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco_compra || ""}
                    onChange={(e) => handleInputChange("preco_compra", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="mt-3 h-14 bg-slate-800/80 border-slate-600/50 focus:border-green-500/50 focus:ring-green-500/20 text-slate-100 font-medium text-base"
                  />
                  {errors.preco_compra && <p className="text-sm text-red-400 mt-2">{errors.preco_compra}</p>}
                </div>

                <div>
                  <Label htmlFor="preco_venda" className="text-slate-300 font-semibold text-base">💵 Preço de Venda (R$) *</Label>
                  <Input
                    id="preco_venda"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco_venda || ""}
                    onChange={(e) => handleInputChange("preco_venda", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="mt-3 h-14 bg-slate-800/80 border-slate-600/50 focus:border-green-500/50 focus:ring-green-500/20 text-slate-100 font-medium text-base"
                  />
                  {errors.preco_venda && <p className="text-sm text-red-400 mt-2">{errors.preco_venda}</p>}
                </div>
              </div>
            </div>

            {/* Estoque */}
            <div className="p-6 bg-gradient-to-r from-blue-800/60 to-blue-700/40 rounded-xl border border-blue-600/50">
              <h3 className="text-xl font-bold text-blue-400 mb-6">📦 Estoque</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="estoque_atual" className="text-slate-300 font-semibold text-base">📊 Estoque Atual</Label>
                  <Input
                    id="estoque_atual"
                    type="number"
                    min="0"
                    value={formData.estoque_atual || ""}
                    onChange={(e) => handleInputChange("estoque_atual", e.target.value === "" ? 0 : Number(e.target.value))}
                    placeholder="0"
                    className="mt-3 h-14 bg-slate-800/80 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/20 text-slate-100 font-medium text-base"
                  />
                  {errors.estoque_atual && <p className="text-sm text-red-400 mt-2">{errors.estoque_atual}</p>}
                </div>

                <div>
                  <Label htmlFor="estoque_minimo" className="text-slate-300 font-semibold text-base">⚠️ Estoque Mínimo</Label>
                  <Input
                    id="estoque_minimo"
                    type="number"
                    min="0"
                    value={formData.estoque_minimo || ""}
                    onChange={(e) => handleInputChange("estoque_minimo", e.target.value === "" ? 0 : Number(e.target.value))}
                    placeholder="10"
                    className="mt-3 h-14 bg-slate-800/80 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/20 text-slate-100 font-medium text-base"
                  />
                  {errors.estoque_minimo && <p className="text-sm text-red-400 mt-2">{errors.estoque_minimo}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Informações Opcionais */}
          <div className="p-6 bg-gradient-to-r from-slate-800/60 to-slate-700/40 rounded-xl border border-slate-600/50">
            <h3 className="text-xl font-bold text-purple-400 mb-6">📋 Informações Opcionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Código de Barras */}
              <div>
                <Label htmlFor="codigo_barras" className="text-slate-300 font-semibold text-base">🔢 Código de Barras</Label>
                <div className="mt-3 space-y-3">
                  <Input
                    id="codigo_barras"
                    value={formData.codigo_barras}
                    onChange={(e) => handleInputChange("codigo_barras", e.target.value)}
                    placeholder="Ex: 7891991010924"
                    className="h-14 bg-slate-800/80 border-slate-600/50 focus:border-purple-500/50 focus:ring-purple-500/20 text-slate-100 font-medium text-base"
                  />
                  <div className="flex gap-2">
                    <BarcodeScanner
                      onScan={(codigo) => handleInputChange("codigo_barras", codigo)}
                      placeholder="Código de barras"
                    />
                  </div>
                </div>
                {errors.codigo_barras && <p className="text-sm text-red-400 mt-2">{errors.codigo_barras}</p>}
              </div>

              {/* Fornecedor */}
              <div>
                <Label htmlFor="fornecedor" className="text-slate-300 font-semibold text-base">🏢 Fornecedor</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) => handleInputChange("fornecedor", e.target.value)}
                  placeholder="Ex: Distribuidora ABC"
                  className="mt-3 h-14 bg-slate-800/80 border-slate-600/50 focus:border-purple-500/50 focus:ring-purple-500/20 text-slate-100 font-medium text-base"
                />
                {errors.fornecedor && <p className="text-sm text-red-400 mt-2">{errors.fornecedor}</p>}
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="gap-4 pt-6 sticky bottom-0 bg-slate-900/98 backdrop-blur-md border-t border-slate-700/50">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-14 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 font-semibold text-base rounded-xl"
          >
            <X className="w-5 h-5 mr-2" />
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="flex-1 h-14 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold text-base shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 rounded-xl"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? "Salvando..." : produto ? "Atualizar Produto" : "Criar Produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
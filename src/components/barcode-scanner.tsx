

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Badge } from "./ui/badge"
import { Scan, X, Search } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  placeholder?: string
  className?: string
}

export function BarcodeScanner({ onScan, placeholder = "Digite ou escaneie o código de barras", className }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)

  // Listener para capturar entrada do leitor de código de barras
  useEffect(() => {
    let barcode = ""
    let timeout: NodeJS.Timeout

    const handleKeyPress = (e: KeyboardEvent) => {
      // Se está no modo de escaneamento
      if (isScanning) {
        // Enter indica fim do código de barras
        if (e.key === "Enter") {
          if (barcode.length > 3) { // Códigos de barras têm pelo menos 4 caracteres
            onScan(barcode)
            setIsScanning(false)
          }
          barcode = ""
          return
        }
        
        // Escape para cancelar
        if (e.key === "Escape") {
          setIsScanning(false)
          barcode = ""
          return
        }

        // Acumular caracteres do código de barras
        if (e.key.length === 1) {
          barcode += e.key
          
          // Reset timeout para detectar fim da entrada
          clearTimeout(timeout)
          timeout = setTimeout(() => {
            if (barcode.length > 3) {
              onScan(barcode)
              setIsScanning(false)
            }
            barcode = ""
          }, 100) // 100ms de timeout
        }
      }
    }

    if (isScanning) {
      document.addEventListener("keydown", handleKeyPress)
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress)
      clearTimeout(timeout)
    }
  }, [isScanning, onScan])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScan(manualCode.trim())
      setManualCode("")
      setShowManualInput(false)
    }
  }

  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        <Button
          type="button"
          variant={isScanning ? "destructive" : "outline"}
          size="sm"
          onClick={() => {
            if (isScanning) {
              setIsScanning(false)
            } else {
              setIsScanning(true)
              setShowManualInput(false)
            }
          }}
          className="flex items-center gap-2"
        >
          {isScanning ? (
            <>
              <X className="h-4 w-4" />
              Cancelar Scan
            </>
          ) : (
            <>
              <Scan className="h-4 w-4" />
              Escanear
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowManualInput(true)}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          Manual
        </Button>
      </div>

      {isScanning && (
        <div className="mt-2">
          <Badge variant="outline" className="bg-amber-500/10 border-amber-500 text-amber-400">
            <Scan className="h-3 w-3 mr-1 animate-pulse" />
            Aguardando código de barras...
          </Badge>
          <p className="text-xs text-slate-400 mt-1">
            Use o leitor ou digite o código e pressione Enter
          </p>
        </div>
      )}

      <Dialog open={showManualInput} onOpenChange={setShowManualInput}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>Inserir Código de Barras</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={placeholder}
              className="bg-slate-800 border-slate-700"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowManualInput(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!manualCode.trim()}>
                Buscar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

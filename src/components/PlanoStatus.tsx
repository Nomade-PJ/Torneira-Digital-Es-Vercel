import { usePermissionsHierarchical } from '../hooks/usePermissionsHierarchical'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Clock, Crown, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function PlanoStatus() {
  const { statusPlano, loading, podeUpgrade, getProximoNivel } = usePermissionsHierarchical()
  const navigate = useNavigate()
  const proximoNivel = getProximoNivel()

  if (loading || !statusPlano) return null

  const handleUpgrade = () => {
    navigate('/planos')
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20">
              {statusPlano.emPeriodoTeste ? (
                <Clock className="w-5 h-5 text-amber-400" />
              ) : (
                <Crown className="w-5 h-5 text-amber-400" />
              )}
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-100 font-semibold">Plano {statusPlano.nomePlano}</span>
                {statusPlano.emPeriodoTeste && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    Teste Grátis
                  </Badge>
                )}
              </div>
              
              {statusPlano.emPeriodoTeste && statusPlano.diasRestantesTeste !== null && (
                <div className="text-sm text-slate-400">
                  {statusPlano.diasRestantesTeste > 0 ? (
                    <span className="text-green-400">
                      {statusPlano.diasRestantesTeste} dias restantes no teste
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Período de teste expirado</span>
                    </span>
                  )}
                </div>
              )}
              
              {!statusPlano.emPeriodoTeste && statusPlano.dataVencimento && (
                <div className="text-sm text-slate-400">
                  Vence em: {new Date(statusPlano.dataVencimento).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          </div>

          {podeUpgrade() && (
            <Button
              size="sm"
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold"
              title={proximoNivel ? `Upgrade para ${proximoNivel.nome}` : 'Ver planos disponíveis'}
            >
              <Crown className="w-4 h-4 mr-1" />
              {proximoNivel ? `→ ${proximoNivel.nome}` : 'Upgrade'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissionsHierarchical } from '../hooks/usePermissionsHierarchical'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Lock, Crown } from 'lucide-react'

interface PermissionGateProps {
  funcionalidade: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ funcionalidade, children, fallback }: PermissionGateProps) {
  const { temPermissao, FUNCIONALIDADES_DISPONIVEIS } = usePermissionsHierarchical()

  // Sistema hierárquico simples - verifica diretamente a funcionalidade
  // Se a funcionalidade não existe no novo sistema, permite acesso (retrocompatibilidade)
  const temAcesso = FUNCIONALIDADES_DISPONIVEIS[funcionalidade as keyof typeof FUNCIONALIDADES_DISPONIVEIS] 
    ? temPermissao(funcionalidade)
    : true

  if (temAcesso) {
    return <>{children}</>
  }

  return fallback || <FuncionalidadeBloqueada funcionalidade={funcionalidade} />
}

interface FuncionalidadeBloqueadaProps {
  funcionalidade: string
}

function FuncionalidadeBloqueada({ funcionalidade }: FuncionalidadeBloqueadaProps) {
  const navigate = useNavigate()
  const { statusPlano, FUNCIONALIDADES_DISPONIVEIS, getProximoNivel } = usePermissionsHierarchical()
  
  const funcInfo = FUNCIONALIDADES_DISPONIVEIS[funcionalidade as keyof typeof FUNCIONALIDADES_DISPONIVEIS]
  const proximoNivel = getProximoNivel()
  
  const handleUpgrade = () => {
    navigate('/planos')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <Card className="max-w-md w-full bg-slate-900/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-lg opacity-30"></div>
              <div className="relative bg-gradient-to-r from-slate-700 to-slate-600 p-4 rounded-full">
                <Lock className="w-12 h-12 text-slate-300" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-slate-100 mb-2">
            Funcionalidade Bloqueada
          </CardTitle>
          
          <CardDescription className="text-slate-400">
            {funcInfo?.nome || 'Esta funcionalidade não está disponível no seu plano atual.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          {statusPlano && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-1">Plano Atual:</div>
              <div className="text-lg font-bold text-slate-100">{statusPlano.nomePlano}</div>
              
              {statusPlano.emPeriodoTeste && statusPlano.diasRestantesTeste && statusPlano.diasRestantesTeste > 0 && (
                <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                  {statusPlano.diasRestantesTeste} dias restantes no teste
                </Badge>
              )}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-slate-300">
              {proximoNivel 
                ? `Para acessar esta funcionalidade, faça upgrade para o plano ${proximoNivel.nome}.`
                : 'Para acessar esta funcionalidade, faça upgrade do seu plano.'
              }
            </p>
            
            {funcInfo && (
              <div className="text-xs text-slate-500 bg-slate-800/30 p-2 rounded">
                Disponível a partir do nível {funcInfo.nivel} ({Object.entries(FUNCIONALIDADES_DISPONIVEIS).find(([_, f]) => f.nivel === funcInfo.nivel)?.[0] || 'Superior'})
              </div>
            )}
            
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Crown className="w-5 h-5 mr-2" />
              Ver Planos Disponíveis
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full border-slate-600/50 hover:bg-slate-800/60 text-slate-300"
            >
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PermissionGate

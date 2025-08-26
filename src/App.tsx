import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { AuthProvider } from './components/providers/auth-provider'
import { Toaster } from './components/ui/toaster'

// 🔧 Importação das páginas
import LandingPage from './pages/LandingPage'
import PlanosPage from './pages/PlanosPage'

import LoginPage from './pages/LoginPage'
import VendasPage from './pages/VendasPage'
import EstoquePage from './pages/EstoquePage'
import FluxoPage from './pages/FluxoPage'
import RelatoriosPage from './pages/RelatoriosPage'
import ConfiguracoesPage from './pages/ConfiguracoesPage'
import PagamentoSucesso from './pages/PagamentoSucesso'
import PagamentoErro from './pages/PagamentoErro'
import PagamentoPendente from './pages/PagamentoPendente'
import TrocarSenhaObrigatoria from './pages/TrocarSenhaObrigatoria'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'

function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* 🔧 Rotas públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/planos" element={<PlanosPage />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/trocar-senha" element={<TrocarSenhaObrigatoria />} />
            
            {/* 🔧 Rotas de retorno do pagamento */}
            <Route path="/pagamento/sucesso" element={<PagamentoSucesso />} />
            <Route path="/pagamento/erro" element={<PagamentoErro />} />
            <Route path="/pagamento/pendente" element={<PagamentoPendente />} />
            
            {/* 🔧 Rotas protegidas com layout */}
            <Route path="/app" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="vendas" element={<VendasPage />} />
              <Route path="estoque" element={<EstoquePage />} />
              <Route path="fluxo" element={<FluxoPage />} />
              <Route path="relatorios" element={<RelatoriosPage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
              <Route index element={<Navigate to="/app/vendas" replace />} />
            </Route>
            
            {/* 🔧 Rota 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

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

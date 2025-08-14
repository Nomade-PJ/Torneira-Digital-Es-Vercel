// Utilitário para limpar cache em produção

/**
 * Limpa todo o cache do aplicativo
 */
export function clearAllCache(): void {
  try {
    // Limpar sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const keysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key?.startsWith('torneira_')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key))
      console.log('✅ SessionStorage limpo')
    }

    // Limpar localStorage (se necessário)
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('torneira_') || key?.includes('supabase.auth.token')) {
          // Manter apenas auth token do Supabase
          if (!key.includes('supabase.auth.token')) {
            keysToRemove.push(key)
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      console.log('✅ LocalStorage limpo (mantendo auth)')
    }

  } catch (error) {
    console.warn('⚠️ Erro ao limpar cache:', error)
  }
}

/**
 * Força recarregamento sem cache
 */
export function forceReload(): void {
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

/**
 * Verifica se está em produção
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Log de debug para produção
 */
export function debugLog(message: string, data?: any): void {
  if (isProduction()) {
    console.log(`🔧 [Torneira Digital] ${message}`, data || '')
  }
}

/**
 * Hook para limpar cache em produção
 */
export function useProductionOptimizations() {
  if (typeof window !== 'undefined' && isProduction()) {
    // Limpar cache antigo na inicialização
    const lastClear = localStorage.getItem('last_cache_clear')
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    if (!lastClear || (now - parseInt(lastClear)) > oneHour) {
      clearAllCache()
      localStorage.setItem('last_cache_clear', now.toString())
      debugLog('Cache limpo automaticamente')
    }
  }
}

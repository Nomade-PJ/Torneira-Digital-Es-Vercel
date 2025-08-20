// Cache ultra-rápido para sessão - evita latência do Supabase
interface SessionCache {
  user: any
  session: any
  timestamp: number
  expiryTime: number
}

class SessionManager {
  private cache: SessionCache | null = null
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos - mais longo para produção

  setSession(user: any, session: any) {
    this.cache = {
      user,
      session,
      timestamp: Date.now(),
      expiryTime: Date.now() + this.CACHE_DURATION
    }
  }

  getSession(): { user: any; session: any } | null {
    if (!this.cache || Date.now() > this.cache.expiryTime) {
      this.cache = null // Limpar cache expirado
      return null
    }
    return {
      user: this.cache.user,
      session: this.cache.session
    }
  }

  clearSession() {
    this.cache = null
  }

  isValid(): boolean {
    return this.cache !== null && Date.now() <= this.cache.expiryTime
  }
}

export const sessionManager = new SessionManager()

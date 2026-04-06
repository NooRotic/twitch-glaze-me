import { useState, useEffect, useCallback } from 'react'
import {
  loginWithTwitch,
  handleTwitchRedirect,
  getStoredToken,
  clearToken,
} from '../lib/twitchAuth'
import { SessionExpiredError } from '../lib/twitchApi'

export function useTwitchAuth() {
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [isAuthenticated, setIsAuthenticated] = useState(!!getStoredToken())

  useEffect(() => {
    // Check for OAuth redirect on mount
    const redirectToken = handleTwitchRedirect()
    if (redirectToken) {
      setToken(redirectToken)
      setIsAuthenticated(true)
    }
  }, [])

  const login = useCallback(() => {
    loginWithTwitch()
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setToken(null)
    setIsAuthenticated(false)
  }, [])

  const handleAuthError = useCallback(
    (error: unknown) => {
      if (error instanceof SessionExpiredError) {
        logout()
        return true
      }
      return false
    },
    [logout],
  )

  return {
    token,
    isAuthenticated,
    login,
    logout,
    handleAuthError,
  }
}

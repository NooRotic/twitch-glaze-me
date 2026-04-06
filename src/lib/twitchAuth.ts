const CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID
const SCOPES = ['user:read:follows']

function getRedirectUri(): string {
  return window.location.origin + window.location.pathname
}

export function loginWithTwitch() {
  const state = Math.random().toString(36).substring(2)
  sessionStorage.setItem('twitch_oauth_state', state)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'token',
    scope: SCOPES.join(' '),
    state,
  })
  window.location.href = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`
}

export function handleTwitchRedirect(): string | null {
  const hash = window.location.hash.substring(1)
  if (!hash) return null

  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')
  const state = params.get('state')

  // Validate state to prevent CSRF
  const savedState = sessionStorage.getItem('twitch_oauth_state')
  if (state && savedState && state !== savedState) {
    console.warn('OAuth state mismatch')
    return null
  }

  if (accessToken) {
    localStorage.setItem('twitch_access_token', accessToken)
    sessionStorage.removeItem('twitch_oauth_state')
    // Clean the URL hash
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    return accessToken
  }

  return null
}

export function getStoredToken(): string | null {
  return localStorage.getItem('twitch_access_token')
}

export function clearToken() {
  localStorage.removeItem('twitch_access_token')
}

export function isAuthenticated(): boolean {
  return !!getStoredToken()
}

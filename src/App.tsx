import { useEffect, useState, useCallback, useRef } from 'react'
import { AppProvider, useApp } from './contexts/AppContext'
import { Header } from './components/layout/Header'
import AppShell from './components/layout/AppShell'
import { useChannelData } from './hooks/useChannelData'
import { useTwitchAuth } from './hooks/useTwitchAuth'
import { detectURLType } from './lib/urlDetection'

function AppInner() {
  const { state, dispatch } = useApp()
  const { handleAuthError } = useTwitchAuth()
  const [channelToLoad, setChannelToLoad] = useState<string | null>(null)
  const lastProcessedUrl = useRef<string>('')

  const authErrorHandler = useCallback(
    () => handleAuthError(null),
    [handleAuthError],
  )

  // When a Twitch channel URL is played, extract channel name and load data
  useEffect(() => {
    const { detection, currentUrl } = state.player
    if (!detection || !currentUrl || currentUrl === lastProcessedUrl.current) return

    lastProcessedUrl.current = currentUrl

    if (detection.type === 'twitch' && detection.metadata?.channelName) {
      setChannelToLoad(detection.metadata.channelName)
    } else if (
      detection.type === 'unknown' &&
      !currentUrl.includes('.') &&
      !currentUrl.includes('/') &&
      !currentUrl.includes(':')
    ) {
      // Plain channel name entered
      setChannelToLoad(currentUrl)
      const twitchDetection = detectURLType(`https://twitch.tv/${currentUrl}`)
      dispatch({ type: 'PLAY_URL', url: `https://twitch.tv/${currentUrl}`, detection: twitchDetection })
    }
  }, [state.player.detection, state.player.currentUrl, dispatch])

  useChannelData(channelToLoad, { handleAuthError: authErrorHandler })

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <Header />
      <AppShell />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}

export default App

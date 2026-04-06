import type { URLDetectionResult, PlayerEngine } from '../lib/urlDetection'

export interface PlayerProps {
  url: string
  detection: URLDetectionResult
  onReady?: () => void
  onError?: (error: string) => void
  onPlay?: () => void
  onPause?: () => void
}

export interface PlayerHostState {
  currentUrl: string
  detection: URLDetectionResult | null
  activeEngine: PlayerEngine
  fallbackStep: number
  debugMode: boolean
  error: string | null
}

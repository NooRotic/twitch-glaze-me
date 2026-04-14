import { useEffect, useRef, useCallback } from 'react'
import type { PlayerProps } from '../../types/player'

declare global {
  interface Window {
    Twitch?: {
      Embed: TwitchEmbedConstructor
    }
  }
}

interface TwitchEmbedConstructor {
  new (
    elementId: string,
    options: Record<string, unknown>,
  ): TwitchEmbedInstance
  VIDEO_READY: string
  VIDEO_PLAY: string
}

interface TwitchEmbedInstance {
  addEventListener: (event: string, callback: () => void) => void
  getPlayer: () => TwitchPlayerInstance
  destroy: () => void
}

interface TwitchPlayerInstance {
  pause: () => void
  play: () => void
  addEventListener: (event: string, callback: () => void) => void
}

const TWITCH_EMBED_SCRIPT = 'https://embed.twitch.tv/embed/v1.js'
const EMBED_TIMEOUT_MS = 5000

// Player-level event names (fired on Twitch.Player from embed.getPlayer()).
// Per https://dev.twitch.tv/docs/embed/video-and-clips/ these are string
// constants on Twitch.Player; we hardcode the string values since the
// constructor surfaces them under the `Twitch.Player` global we do not
// import here (and the mock uses the same strings).
const PLAYER_EVT = {
  PAUSE: 'pause',
  PLAY: 'play',
  OFFLINE: 'offline',
  ONLINE: 'online',
  ENDED: 'ended',
  PLAYBACK_BLOCKED: 'playbackBlocked',
} as const

let scriptLoadPromise: Promise<void> | null = null

function loadTwitchScript(): Promise<void> {
  if (window.Twitch?.Embed) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${TWITCH_EMBED_SCRIPT}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Twitch Embed SDK')),
      )
      return
    }

    const script = document.createElement('script')
    script.src = TWITCH_EMBED_SCRIPT
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptLoadPromise = null
      reject(new Error('Failed to load Twitch Embed SDK'))
    }
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

export default function TwitchEmbedPlayer({
  url: _url, // eslint-disable-line @typescript-eslint/no-unused-vars
  detection,
  onReady,
  onError,
  onPlay,
  onPause,
  onOffline,
  onOnline,
  onEnded,
  onPlaybackBlocked,
}: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const embedRef = useRef<TwitchEmbedInstance | null>(null)
  const playerRef = useRef<TwitchPlayerInstance | null>(null)
  const mountedRef = useRef(true)
  const embedIdRef = useRef('')

  const handleError = useCallback(
    (msg: string) => {
      if (mountedRef.current) onError?.(msg)
    },
    [onError],
  )

  useEffect(() => {
    mountedRef.current = true

    // Defensive guard: the Twitch JS SDK does not support clips.
    // If we're ever handed one, short-circuit so PlayerHost advances.
    if (detection.platform === 'twitch-clip') {
      handleError('Twitch SDK does not support clips — use iframe engine')
      return
    }

    const container = containerRef.current
    if (!container) return

    if (!embedIdRef.current) {
      embedIdRef.current = `twitch-embed-${Date.now()}-${Math.floor(
        Math.random() * 10000,
      )}`
    }
    const embedId = embedIdRef.current
    container.id = embedId

    // Start the timeout BEFORE async work so the 5s budget covers the full
    // init path (script load + Embed construction + VIDEO_READY).
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => {
        if (mountedRef.current) {
          handleError('Twitch Embed timed out after 5s')
        }
      },
      EMBED_TIMEOUT_MS,
    )

    const clearTimeoutSafe = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
        timeoutId = undefined
      }
    }

    const init = async () => {
      try {
        await loadTwitchScript()
      } catch {
        clearTimeoutSafe()
        handleError('Failed to load Twitch Embed SDK')
        return
      }

      if (!mountedRef.current || !window.Twitch?.Embed) return

      const Embed = window.Twitch.Embed

      // Build options. `muted: true` is required for reliable autoplay under
      // browser policies. The real Twitch player still shows an unmute button.
      const options: Record<string, unknown> = {
        width: '100%',
        height: '100%',
        parent: [window.location.hostname],
        layout: 'video',
        autoplay: true,
        muted: true,
        allowfullscreen: true,
      }

      if (
        detection.platform === 'twitch-video' &&
        detection.metadata?.videoId
      ) {
        options.video = `v${detection.metadata.videoId}`
      } else if (
        detection.platform === 'twitch-stream' &&
        detection.metadata?.channelName
      ) {
        options.channel = detection.metadata.channelName
      } else {
        clearTimeoutSafe()
        handleError('Unable to determine Twitch content type')
        return
      }

      try {
        const embed = new Embed(embedId, options)
        embedRef.current = embed

        embed.addEventListener(Embed.VIDEO_READY, () => {
          if (!mountedRef.current) return
          clearTimeoutSafe()

          // Now that VIDEO_READY has fired, the underlying Player exists.
          // Attach the real event listeners to it.
          try {
            const player = embed.getPlayer()
            playerRef.current = player

            player.addEventListener(PLAYER_EVT.PAUSE, () => {
              if (mountedRef.current) onPause?.()
            })
            player.addEventListener(PLAYER_EVT.PLAY, () => {
              if (mountedRef.current) onPlay?.()
            })
            player.addEventListener(PLAYER_EVT.ENDED, () => {
              if (mountedRef.current) onEnded?.()
            })
            player.addEventListener(PLAYER_EVT.PLAYBACK_BLOCKED, () => {
              if (mountedRef.current) {
                onPlaybackBlocked?.()
                // Autoplay was blocked by the browser. Treat this as an error
                // so the host advances to the iframe engine (which also
                // requires a click, but at least the user knows).
                handleError('Autoplay blocked by browser')
              }
            })
            // OFFLINE / ONLINE are only meaningful for live streams.
            if (detection.platform === 'twitch-stream') {
              player.addEventListener(PLAYER_EVT.OFFLINE, () => {
                if (mountedRef.current) onOffline?.()
              })
              player.addEventListener(PLAYER_EVT.ONLINE, () => {
                if (mountedRef.current) onOnline?.()
              })
            }
          } catch {
            // Non-fatal: player-level events simply won't fire.
          }

          onReady?.()
        })

        // Embed-level VIDEO_PLAY also fires once on the first playthrough.
        // (The Player-level PLAY handles subsequent play-after-pause.)
        embed.addEventListener(Embed.VIDEO_PLAY, () => {
          if (mountedRef.current) onPlay?.()
        })
      } catch (err) {
        clearTimeoutSafe()
        handleError(
          `Twitch Embed initialization failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        )
      }
    }

    init()

    return () => {
      mountedRef.current = false
      clearTimeoutSafe()
      try {
        embedRef.current?.destroy()
      } catch {
        // Swallow destroy errors
      }
      embedRef.current = null
      playerRef.current = null
      if (container) container.innerHTML = ''
    }
  }, [
    detection.platform,
    detection.metadata?.clipId,
    detection.metadata?.videoId,
    detection.metadata?.channelName,
    onReady,
    onPlay,
    onPause,
    onOffline,
    onOnline,
    onEnded,
    onPlaybackBlocked,
    handleError,
  ])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: 300 }}
    />
  )
}

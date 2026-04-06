import { useState, type FormEvent } from 'react'
import { LogIn, LogOut, Search } from 'lucide-react'
import { useTwitchAuth } from '../../hooks/useTwitchAuth'
import { useApp } from '../../contexts/AppContext'
import { detectURLType, getSourceColor, getURLTypeDisplayName } from '../../lib/urlDetection'

export function Header() {
  const { isAuthenticated, login, logout } = useTwitchAuth()
  const { dispatch } = useApp()
  const [inputValue, setInputValue] = useState('')
  const [badge, setBadge] = useState<{ label: string; color: string } | null>(null)

  function handleInputChange(value: string) {
    setInputValue(value)
    if (value.length > 3) {
      const detection = detectURLType(value)
      if (detection.type !== 'unknown') {
        setBadge({ label: getURLTypeDisplayName(detection), color: getSourceColor(detection) })
      } else {
        setBadge(null)
      }
    } else {
      setBadge(null)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!inputValue.trim()) return

    const detection = detectURLType(inputValue.trim())

    if (detection.type !== 'unknown') {
      dispatch({ type: 'PLAY_URL', url: inputValue.trim(), detection })
    }

    // If it looks like a plain channel name (no URL), treat as Twitch stream
    if (detection.type === 'unknown' && !inputValue.includes('.') && !inputValue.includes('/')) {
      const channelDetection = detectURLType(`https://twitch.tv/${inputValue.trim()}`)
      dispatch({ type: 'PLAY_URL', url: inputValue.trim(), detection: channelDetection })
    }

    dispatch({
      type: 'ADD_HISTORY',
      entry: { query: inputValue.trim(), type: detection.type, timestamp: Date.now() },
    })
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-sidebar)]">
      <h1
        className="text-xl font-bold tracking-wider select-none"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-green)' }}
      >
        GLAZE ME
      </h1>

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search channel or paste URL..."
            className="bg-[var(--bg-card)] border border-[var(--accent-twitch)] rounded pl-8 pr-3 py-1.5 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] w-72 focus:outline-none focus:border-[var(--accent-green)] transition-colors"
          />
          {badge && (
            <span
              className="absolute right-2 text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: badge.color + '22', color: badge.color, border: `1px solid ${badge.color}44` }}
            >
              {badge.label}
            </span>
          )}
        </div>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] text-sm px-3 py-1.5 rounded hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        ) : (
          <button
            type="button"
            onClick={login}
            className="flex items-center gap-1.5 bg-[var(--accent-twitch)] text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition-opacity"
          >
            <LogIn size={14} />
            Login with Twitch
          </button>
        )}
      </form>
    </header>
  )
}

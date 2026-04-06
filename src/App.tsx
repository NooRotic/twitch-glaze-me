import { AppProvider } from './contexts/AppContext'
import { Header } from './components/layout/Header'

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
        <Header />

        <main
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 64px)' }}
        >
          <div className="text-center">
            <h2
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-green)' }}
            >
              GLAZE ME
            </h2>
            <p className="text-[var(--text-secondary)] text-lg mb-6">
              Twitch Channel Streamer Highlighter
            </p>
            <p className="text-[var(--text-muted)] text-sm">
              Enter a Twitch channel name above to get started
            </p>
          </div>
        </main>
      </div>
    </AppProvider>
  )
}

export default App

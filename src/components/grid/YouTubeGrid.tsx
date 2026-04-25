import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getPopularVideos, isYouTubeApiAvailable, type YouTubeVideo } from '../../lib/youtubeApi'
import { YouTubeVideoCard } from './YouTubeVideoCard'

export function YouTubeGrid() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = useCallback(async () => {
    if (!isYouTubeApiAvailable()) {
      setError('YouTube API key not configured')
      setLoading(false)
      return
    }
    try {
      const data = await getPopularVideos(12)
      setVideos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos() // eslint-disable-line react-hooks/set-state-in-effect -- data fetch on mount
  }, [fetchVideos])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent-youtube)' }} />
        <span className="ml-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          Loading popular videos...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-md"
        style={{
          backgroundColor: 'rgba(255, 0, 0, 0.08)',
          border: '1px solid rgba(255, 0, 0, 0.3)',
          color: 'var(--text-primary)',
        }}
      >
        <span className="text-sm">{error}</span>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="py-16 text-center">
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>No videos found</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <YouTubeVideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}

interface SparklineProps {
  /** Array of values to plot — nulls are gaps in the line. */
  data: (number | null)[]
  /** SVG width in pixels. */
  width?: number
  /** SVG height in pixels. */
  height?: number
  /** Stroke color. */
  color?: string
  /** Minimum number of non-null points before rendering. */
  minPoints?: number
}

export default function Sparkline({
  data,
  width = 120,
  height = 24,
  color = 'var(--accent-green)',
  minPoints = 2,
}: SparklineProps) {
  const values = data.filter((v): v is number => v !== null)
  if (values.length < minPoints) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1 // avoid division by zero for flat lines
  const padding = 1 // px inset so the stroke isn't clipped

  const points = data
    .map((v, i) => {
      if (v === null) return null
      const x = (i / Math.max(1, data.length - 1)) * (width - padding * 2) + padding
      const y = height - padding - ((v - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .filter(Boolean)
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

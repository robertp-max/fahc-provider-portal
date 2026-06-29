import { cn } from '@/lib/utils'

// Lightweight, dependency-free SVG/CSS charts tuned to the brand palette.

// ---- Sparkline / area trend ----------------------------------------------

export function Sparkline({
  values,
  className,
  stroke = '#1B4F72',
  fill = 'rgba(27,79,114,0.10)',
  height = 56,
}: {
  values: number[]
  className?: string
  stroke?: string
  fill?: string
  height?: number
}) {
  const w = 200
  const h = height
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const step = values.length > 1 ? w / (values.length - 1) : w
  const pts = values.map((v, i) => {
    const x = i * step
    const y = h - ((v - min) / range) * (h - 8) - 4
    return [x, y] as const
  })
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `0,${h} ${line} ${w},${h}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
      role="img"
      aria-label="Trend chart"
    >
      <polygon points={area} fill={fill} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={stroke} />
      ))}
    </svg>
  )
}

// ---- Vertical bar chart ---------------------------------------------------

export function BarChart({
  data,
  className,
  height = 160,
  barClassName = 'bg-brand-primary',
}: {
  data: { label: string; value: number }[]
  className?: string
  height?: number
  barClassName?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className={cn('flex items-end gap-3', className)} style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-2">
          <span className="text-xs font-semibold text-brand-charcoal/70">{d.value}</span>
          <div
            className={cn('w-full rounded-t-lg transition-all', barClassName)}
            style={{ height: `${Math.max((d.value / max) * (height - 44), 4)}px` }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[11px] text-brand-charcoal/60">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ---- Donut chart ----------------------------------------------------------

export function DonutChart({
  segments,
  size = 160,
  thickness = 22,
  centerLabel,
  centerSub,
}: {
  segments: { label: string; value: number; color: string }[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerSub?: string
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} role="img" aria-label="Distribution chart">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F2F2F2"
            strokeWidth={thickness}
          />
          {segments.map((seg) => {
            const len = (seg.value / total) * circumference
            const dash = `${len} ${circumference - len}`
            const el = (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += len
            return el
          })}
        </g>
        {centerLabel && (
          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            className="fill-brand-primary font-heading"
            style={{ fontSize: 22, fontWeight: 600 }}
          >
            {centerLabel}
          </text>
        )}
        {centerSub && (
          <text x="50%" y="60%" textAnchor="middle" className="fill-brand-charcoal" style={{ fontSize: 11 }}>
            {centerSub}
          </text>
        )}
      </svg>
      <ul className="space-y-2 text-sm">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-brand-charcoal">{seg.label}</span>
            <span className="ml-auto font-semibold text-brand-primary">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---- Progress bar ---------------------------------------------------------

export function ProgressBar({
  value,
  className,
  barClassName = 'bg-brand-gold',
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-brand-lightGray', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn('h-full rounded-full transition-all', barClassName)} style={{ width: `${pct}%` }} />
    </div>
  )
}

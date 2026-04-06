'use client'

import { TimeLog, Category } from '@/types'

interface HourSlotProps {
  hour: number
  log?: TimeLog & { category?: Category }
  isSelected: boolean
  onClick: () => void
}

const PERIOD_BORDER: Record<number, string> = {
  0: '#8B5CF620',  // night
  6: '#F59E0B20',  // morning
  12: '#3B82F620', // afternoon
  18: '#EC489920', // evening
}

export default function HourSlot({ hour, log, isSelected, onClick }: HourSlotProps) {
  const category = log?.category
  const hasLog = !!category

  const hourLabel = `${String(hour).padStart(2, '0')}:00`
  const periodBorder = PERIOD_BORDER[hour] ?? null

  return (
    <button
      onClick={onClick}
      className={`
        w-full group flex items-center gap-3 px-4 py-3 rounded-lg
        border transition-all duration-150 text-left
        ${isSelected
          ? 'border-violet-500/50 bg-violet-500/10 scale-[1.005]'
          : hasLog
            ? 'border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.02]'
            : 'border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02]'
        }
        ${periodBorder ? 'border-l-2' : ''}
      `}
      style={{
        borderLeftColor: periodBorder ?? (hasLog ? `${category!.color}40` : undefined),
      }}
    >
      {/* Time label */}
      <span className="font-mono text-xs text-zinc-600 w-10 shrink-0">{hourLabel}</span>

      {/* Color swatch / fill */}
      <div className="flex-1 flex items-center gap-2.5 min-w-0">
        {hasLog ? (
          <>
            <div
              className="w-3 h-3 rounded-sm shrink-0 transition-transform group-hover:scale-110"
              style={{ backgroundColor: category!.color }}
            />
            <span className="text-sm text-zinc-200 truncate">{category!.name}</span>
            {log?.note && (
              <span className="text-xs text-zinc-500 truncate hidden sm:block">
                — {log.note}
              </span>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-3 h-3 rounded-sm border border-dashed border-zinc-700" />
            <span className="text-xs text-zinc-600">Click to log</span>
          </div>
        )}
      </div>

      {/* Category icon */}
      {hasLog ? (
        <span className="text-base shrink-0 opacity-70">{category!.icon}</span>
      ) : (
        <svg
          className="w-3.5 h-3.5 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )}
    </button>
  )
}

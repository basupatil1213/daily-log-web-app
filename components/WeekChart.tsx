'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TimeLog, Category } from '@/types'

interface WeekDay {
  date: string
  label: string
  logs: (TimeLog & { category?: Category })[]
}

interface Props {
  days: WeekDay[]
  categories: Category[]
}

export default function WeekChart({ days, categories }: Props) {
  const today = new Date().toISOString().split('T')[0]

  // Build chart data: each day shows total hours logged
  const chartData = days.map(({ date, label, logs }) => ({
    label,
    date,
    total: logs.length,
    isToday: date === today,
  }))

  const maxVal = Math.max(...chartData.map((d) => d.total), 8)

  return (
    <div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 0, bottom: 0, left: -24 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525B', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            />
            <YAxis
              domain={[0, 24]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525B', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              ticks={[0, 8, 16, 24]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const val = payload[0].value as number
                return (
                  <div className="bg-[#1E1E24] border border-white/[0.1] rounded-lg px-3 py-2 text-sm shadow-xl">
                    <div className="text-zinc-400 text-xs font-mono mb-1">{label}</div>
                    <div className="font-display font-bold text-zinc-100">
                      {val}h logged
                    </div>
                    <div className="font-mono text-xs text-zinc-600 mt-0.5">
                      {24 - val}h untracked
                    </div>
                  </div>
                )
              }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isToday ? '#8B5CF6' : entry.total > 0 ? '#3F3F46' : '#27272A'}
                  opacity={entry.total === 0 ? 0.4 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category color dots per day */}
      <div className="grid grid-cols-7 gap-1 mt-3">
        {days.map(({ date, label, logs }) => {
          const topCategories = getTopCategories(logs, 4)
          const isToday = date === today
          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <div className="flex flex-wrap gap-0.5 justify-center" style={{ maxWidth: 24 }}>
                {topCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                    title={cat.name}
                  />
                ))}
                {topCategories.length === 0 && (
                  <div className="w-2 h-2 rounded-full bg-zinc-800" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getTopCategories(
  logs: (TimeLog & { category?: Category })[],
  limit: number
): Category[] {
  const map = new Map<string, Category>()
  for (const log of logs) {
    if (log.category && !map.has(log.category.id)) {
      map.set(log.category.id, log.category)
    }
  }
  return Array.from(map.values()).slice(0, limit)
}

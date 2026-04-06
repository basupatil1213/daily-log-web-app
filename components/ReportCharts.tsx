'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { Category } from '@/types'

interface Props {
  byCategory: { category: Category; hours: number }[]
  dayData: Record<string, string | number>[]
  totalHours: number
}

export default function ReportCharts({ byCategory, dayData, totalHours }: Props) {
  const pieData = byCategory.map(({ category, hours }) => ({
    name: `${category.icon} ${category.name}`,
    value: hours,
    color: category.color,
    rawName: category.name,
  }))

  const showTrend = dayData.length > 1

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Donut chart */}
      <div className="bg-[#111115] border border-white/[0.07] rounded-xl p-6">
        <h2 className="font-display font-semibold text-zinc-100 mb-5">Distribution</h2>
        <div className="relative" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0].payload as typeof pieData[0]
                  const pct = Math.round((item.value / totalHours) * 100)
                  return (
                    <div className="bg-[#1E1E24] border border-white/10 rounded-lg px-3 py-2 text-sm shadow-xl">
                      <div className="text-zinc-200 font-medium">{item.name}</div>
                      <div className="font-mono text-zinc-400 text-xs mt-0.5">
                        {item.value}h · {pct}% of total
                      </div>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-display font-bold text-2xl text-zinc-100">{totalHours}h</span>
            <span className="font-mono text-xs text-zinc-500">total</span>
          </div>
        </div>

        {/* Mini legend — top 6 */}
        <div className="grid grid-cols-2 gap-1.5 mt-4">
          {byCategory.slice(0, 6).map(({ category, hours }) => (
            <div key={category.id} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs text-zinc-400 truncate">{category.name}</span>
              <span className="font-mono text-xs text-zinc-600 ml-auto">{hours}h</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trend / daily bar chart */}
      {showTrend ? (
        <div className="bg-[#111115] border border-white/[0.07] rounded-xl p-6">
          <h2 className="font-display font-semibold text-zinc-100 mb-5">Daily Trend</h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dayData}
                barSize={dayData.length > 14 ? 6 : dayData.length > 7 ? 10 : 20}
                margin={{ top: 4, right: 0, bottom: 0, left: -24 }}
              >
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#52525B', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  interval={dayData.length > 14 ? Math.floor(dayData.length / 7) : 0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#52525B', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 4 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const filtered = payload.filter((p) => (p.value as number) > 0)
                    return (
                      <div className="bg-[#1E1E24] border border-white/10 rounded-lg px-3 py-2 text-sm shadow-xl max-w-[180px]">
                        <div className="font-mono text-xs text-zinc-500 mb-2">{label}</div>
                        {filtered.map((p) => (
                          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: p.color }}
                            />
                            <span className="text-zinc-400 truncate">{p.dataKey}</span>
                            <span className="font-mono text-zinc-300 ml-auto">{p.value}h</span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                {byCategory.slice(0, 8).map(({ category }) => (
                  <Bar
                    key={category.id}
                    dataKey={category.name}
                    stackId="a"
                    fill={category.color}
                    radius={
                      category.id === byCategory[byCategory.length > 8 ? 7 : byCategory.length - 1].category.id
                        ? [2, 2, 0, 0]
                        : [0, 0, 0, 0]
                    }
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Color legend for chart */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {byCategory.slice(0, 8).map(({ category }) => (
              <div key={category.id} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-[11px] text-zinc-500">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#111115] border border-white/[0.07] rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-3xl mb-3">📈</span>
          <p className="text-sm text-zinc-500">
            Log more days to see your daily trend chart.
          </p>
        </div>
      )}
    </div>
  )
}

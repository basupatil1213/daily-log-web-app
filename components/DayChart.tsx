'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Category } from '@/types'

interface Props {
  data: { category: Category; hours: number }[]
}

interface TooltipPayload {
  payload: { name: string; value: number; fill: string }
}

export default function DayChart({ data }: Props) {
  const chartData = data.map(({ category, hours }) => ({
    name: `${category.icon} ${category.name}`,
    value: hours,
    fill: category.color,
  }))

  const total = data.reduce((sum, d) => sum + d.hours, 0)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const item = payload[0] as unknown as TooltipPayload['payload']
                return (
                  <div className="bg-[#1E1E24] border border-white/[0.1] rounded-lg px-3 py-2 text-sm shadow-xl">
                    <div className="text-zinc-200 font-medium">{item.name}</div>
                    <div className="font-mono text-zinc-400 text-xs mt-0.5">
                      {item.value}h · {Math.round((item.value / 24) * 100)}% of day
                    </div>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display font-bold text-2xl text-zinc-100">{total}h</span>
          <span className="font-mono text-xs text-zinc-500">logged</span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full grid grid-cols-2 gap-1.5 mt-2">
        {data.map(({ category, hours }) => (
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
  )
}

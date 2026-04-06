import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, subDays, subMonths } from 'date-fns'
import Link from 'next/link'
import { TimeLog, Category } from '@/types'
import ReportCharts from '@/components/ReportCharts'

type Period = 'week' | 'month' | '3months' | 'all'

const PERIODS = [
  { label: 'This Week',  value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: '3 Months',   value: '3months' },
  { label: 'All Time',   value: 'all' },
] as const

interface Props {
  searchParams: { period?: string }
}

export default async function ReportsPage({ searchParams }: Props) {
  const period = (searchParams.period as Period) ?? 'week'
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const today = format(new Date(), 'yyyy-MM-dd')

  let startDate: string
  switch (period) {
    case 'month':   startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd'); break
    case '3months': startDate = format(subMonths(new Date(), 3), 'yyyy-MM-dd'); break
    case 'all':     startDate = '2000-01-01'; break
    default:        startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd')
  }

  // Fetch all logs for period
  let query = supabase
    .from('time_logs')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .lte('date', today)
    .order('date')

  if (period !== 'all') {
    query = query.gte('date', startDate)
  }

  const { data: logsData } = await query
  const logs = (logsData as (TimeLog & { category: Category })[]) ?? []

  // ── Compute category breakdown ──────────────────────────────
  const catMap = new Map<string, { category: Category; hours: number }>()
  for (const log of logs) {
    if (!log.category) continue
    const key = log.category_id!
    const existing = catMap.get(key)
    if (existing) {
      existing.hours += 1
    } else {
      catMap.set(key, { category: log.category, hours: 1 })
    }
  }
  const byCategory = Array.from(catMap.values()).sort((a, b) => b.hours - a.hours)

  // ── Summary stats ───────────────────────────────────────────
  const totalHours = logs.length
  const uniqueDays = new Set(logs.map((l) => l.date)).size
  const avgPerDay = uniqueDays > 0 ? (totalHours / uniqueDays).toFixed(1) : '0'
  const topCategory = byCategory[0] ?? null

  // ── Day-by-day data for trend chart ─────────────────────────
  // Build a list of all dates in the period
  const dateSet = new Set(logs.map((l) => l.date))
  const allDates = Array.from(dateSet).sort()

  // For each date, compute hours per category
  const dayData = allDates.map((date) => {
    const dayLogs = logs.filter((l) => l.date === date)
    const entry: Record<string, string | number> = {
      date,
      label: format(new Date(date + 'T12:00:00'), period === 'week' ? 'EEE d' : 'MMM d'),
    }
    for (const { category } of byCategory) {
      entry[category.name] = dayLogs.filter((l) => l.category_id === category.id).length
    }
    return entry
  })

  // ── Insights text ────────────────────────────────────────────
  const insights = generateInsights(byCategory, totalHours, uniqueDays)

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="font-mono text-xs text-zinc-500 tracking-widest uppercase mb-1">
          Analytics
        </p>
        <h1 className="font-display text-3xl font-bold text-zinc-100">Time Report</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Understand where your time actually goes
        </p>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 mb-8 bg-[#111115] border border-white/[0.07] rounded-xl p-1 w-fit">
        {PERIODS.map(({ label, value }) => (
          <Link
            key={value}
            href={`/reports?period=${value}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              period === value
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {totalHours === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-4xl mb-4">📊</span>
          <p className="text-zinc-400 font-medium mb-1">No data for this period</p>
          <p className="text-zinc-600 text-sm mb-6">Start logging your hours to see reports here.</p>
          <Link
            href={`/log/${today}`}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all"
          >
            Log Today
          </Link>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Hours" value={`${totalHours}h`} sub="tracked" color="#8B5CF6" />
            <StatCard label="Days Tracked" value={`${uniqueDays}`} sub="days with logs" color="#3B82F6" />
            <StatCard label="Avg per Day" value={`${avgPerDay}h`} sub="daily average" color="#10B981" />
            {topCategory && (
              <StatCard
                label="Top Category"
                value={topCategory.category.name}
                sub={`${topCategory.hours}h · ${pct(topCategory.hours, totalHours)}%`}
                color={topCategory.category.color}
              />
            )}
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="bg-[#111115] border border-white/[0.07] rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">💡</span>
                <h2 className="font-display font-semibold text-zinc-100">Insights</h2>
              </div>
              <ul className="space-y-2">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-400">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: insight.color }}
                    />
                    {insight.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Charts — client component */}
          <ReportCharts
            byCategory={byCategory}
            dayData={dayData}
            totalHours={totalHours}
          />

          {/* Category detail table */}
          <div className="bg-[#111115] border border-white/[0.07] rounded-xl p-6 mt-6">
            <h2 className="font-display font-semibold text-zinc-100 mb-5">Category Breakdown</h2>
            <div className="space-y-3">
              {byCategory.map(({ category, hours }, index) => {
                const percentage = pct(hours, totalHours)
                const avgHours = uniqueDays > 0 ? (hours / uniqueDays).toFixed(1) : '0'
                return (
                  <div key={category.id} className="group">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-zinc-600 font-mono text-xs w-5 text-right">
                        {index + 1}
                      </span>
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-zinc-200 flex-1">{category.name}</span>
                      <span className="font-mono text-xs text-zinc-500">{avgHours}h/day</span>
                      <span
                        className="font-mono text-xs font-semibold w-10 text-right"
                        style={{ color: category.color }}
                      >
                        {percentage}%
                      </span>
                      <span className="font-mono text-sm text-zinc-300 w-10 text-right">
                        {hours}h
                      </span>
                    </div>
                    <div className="ml-8 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total row */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.07]">
              <span className="w-5" />
              <span className="text-sm text-zinc-500 flex-1">Total tracked</span>
              <span className="font-mono text-sm font-semibold text-zinc-200">{totalHours}h</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className="bg-[#111115] border border-white/[0.07] rounded-xl p-4">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div
        className="font-display font-bold text-xl truncate"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>
    </div>
  )
}

function pct(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

function generateInsights(
  byCategory: { category: Category; hours: number }[],
  totalHours: number,
  uniqueDays: number
): { text: string; color: string }[] {
  const insights: { text: string; color: string }[] = []
  if (totalHours === 0) return insights

  for (const { category, hours } of byCategory.slice(0, 5)) {
    const p = pct(hours, totalHours)
    const avg = uniqueDays > 0 ? (hours / uniqueDays).toFixed(1) : '0'

    if (category.name === 'Sleep' && hours > 0) {
      const avgSleep = uniqueDays > 0 ? hours / uniqueDays : 0
      if (avgSleep < 7) {
        insights.push({ text: `You're averaging ${avg}h of sleep per day — below the recommended 7–9h.`, color: category.color })
      } else {
        insights.push({ text: `Good sleep habits — averaging ${avg}h per night.`, color: category.color })
      }
    } else if (category.name === 'Social Media' && p >= 10) {
      insights.push({ text: `Social Media takes up ${p}% of your tracked time (${hours}h total). Consider setting limits.`, color: category.color })
    } else if (category.name === 'Entertainment' && p >= 15) {
      insights.push({ text: `${p}% of your time goes to Entertainment (${hours}h). Balance with productive activities.`, color: category.color })
    } else if (category.name === 'Work' && p >= 40) {
      insights.push({ text: `Work dominates at ${p}% of your time. Make sure to schedule recovery time.`, color: category.color })
    } else if (category.name === 'Exercise' && hours > 0) {
      insights.push({ text: `You exercised ${hours}h total — averaging ${avg}h per day. ${hours / uniqueDays >= 0.5 ? 'Keep it up!' : 'Try to be more consistent.'}`, color: category.color })
    } else if (category.name === 'Learning' && hours > 0) {
      insights.push({ text: `${hours}h invested in Learning — that's ${avg}h per day of skill building.`, color: category.color })
    }
  }

  // Top category insight
  if (byCategory.length > 0 && insights.length < 3) {
    const top = byCategory[0]
    const p = pct(top.hours, totalHours)
    insights.push({
      text: `${top.category.name} is your most time-consuming activity at ${p}% (${top.hours}h).`,
      color: top.category.color,
    })
  }

  return insights.slice(0, 5)
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { TimeLog, Category } from '@/types'
import DayChart from '@/components/DayChart'
import WeekChart from '@/components/WeekChart'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const today = format(new Date(), 'yyyy-MM-dd')

  // Fetch today's logs
  const { data: todayLogs } = await supabase
    .from('time_logs')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .eq('date', today)
    .order('hour')

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // Fetch last 7 days logs for week chart
  const weekStart = format(subDays(new Date(), 6), 'yyyy-MM-dd')
  const { data: weekLogs } = await supabase
    .from('time_logs')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .gte('date', weekStart)
    .lte('date', today)
    .order('date')

  const logs = (todayLogs as (TimeLog & { category: Category })[]) ?? []
  const allCategories = (categories as Category[]) ?? []
  const week = (weekLogs as (TimeLog & { category: Category })[]) ?? []

  // Compute stats
  const totalLogged = logs.length
  const loggedPercent = Math.round((totalLogged / 24) * 100)

  // Group by category for donut chart
  const categoryMap = new Map<string, { category: Category; hours: number }>()
  for (const log of logs) {
    if (!log.category) continue
    const existing = categoryMap.get(log.category_id!)
    if (existing) {
      existing.hours += 1
    } else {
      categoryMap.set(log.category_id!, { category: log.category, hours: 1 })
    }
  }
  const byCategory = Array.from(categoryMap.values()).sort((a, b) => b.hours - a.hours)

  // Build week data
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    const dayLogs = week.filter((l) => l.date === date)
    return { date, label: format(new Date(date + 'T12:00:00'), 'EEE'), logs: dayLogs }
  })

  // Quick insight stats
  const sleepHours = byCategory.find((b) => b.category.name === 'Sleep')?.hours ?? 0
  const workHours = byCategory.find((b) => b.category.name === 'Work')?.hours ?? 0
  const exerciseHours = byCategory.find((b) => b.category.name === 'Exercise')?.hours ?? 0

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-mono text-xs text-zinc-500 tracking-widest uppercase mb-1">
            {format(new Date(), 'EEEE')}
          </p>
          <h1 className="font-display text-3xl font-bold text-zinc-100">
            {format(new Date(), 'MMMM d, yyyy')}
          </h1>
        </div>
        <Link
          href={`/log/${today}`}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log Today
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Hours Logged"
          value={`${totalLogged}/24`}
          sub={`${loggedPercent}% of day`}
          color="#8B5CF6"
        />
        <StatCard
          label="Sleep"
          value={`${sleepHours}h`}
          sub={sleepHours >= 7 ? 'Good rest' : sleepHours === 0 ? 'Not logged' : 'Below target'}
          color="#8B5CF6"
        />
        <StatCard
          label="Work"
          value={`${workHours}h`}
          sub="Today"
          color="#F59E0B"
        />
        <StatCard
          label="Exercise"
          value={`${exerciseHours}h`}
          sub={exerciseHours > 0 ? 'Active day' : 'Not logged'}
          color="#10B981"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Today's donut chart */}
        <div className="bg-[#111115] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-zinc-100">Today's Breakdown</h2>
            <span className="font-mono text-xs text-zinc-500">{totalLogged} hrs</span>
          </div>
          {totalLogged > 0 ? (
            <DayChart data={byCategory} />
          ) : (
            <EmptyState
              icon="⏱"
              message="No hours logged yet today."
              action={{ label: 'Start logging', href: `/log/${today}` }}
            />
          )}
        </div>

        {/* Week chart */}
        <div className="bg-[#111115] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-zinc-100">Last 7 Days</h2>
            <span className="font-mono text-xs text-zinc-500">activity</span>
          </div>
          <WeekChart days={weekDays} categories={allCategories} />
        </div>
      </div>

      {/* Category legend */}
      {byCategory.length > 0 && (
        <div className="bg-[#111115] border border-white/[0.07] rounded-xl p-6">
          <h2 className="font-display font-semibold text-zinc-100 mb-4">Category Breakdown</h2>
          <div className="space-y-2">
            {byCategory.map(({ category, hours }) => (
              <div key={category.id} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-300">{category.name}</span>
                    <span className="font-mono text-xs text-zinc-500">{hours}h</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(hours / 24) * 100}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent days */}
      <div className="mt-6">
        <h2 className="font-display font-semibold text-zinc-100 mb-3">Recent Days</h2>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(({ date, label, logs: dayLogs }) => {
            const isToday = date === today
            const count = dayLogs.length
            return (
              <Link
                key={date}
                href={`/log/${date}`}
                className={`group rounded-xl p-3 border transition-all duration-150 text-center ${
                  isToday
                    ? 'border-violet-500/40 bg-violet-500/10'
                    : 'border-white/[0.07] bg-[#111115] hover:border-white/[0.12] hover:bg-[#18181C]'
                }`}
              >
                <div className="font-mono text-[10px] text-zinc-500 uppercase mb-1">{label}</div>
                <div className={`font-display font-bold text-lg ${isToday ? 'text-violet-400' : 'text-zinc-300'}`}>
                  {format(new Date(date + 'T12:00:00'), 'd')}
                </div>
                <div className="font-mono text-[10px] text-zinc-600 mt-1">{count}/24</div>
                {/* Mini color bars */}
                <div className="flex gap-px mt-2 justify-center">
                  {dayLogs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="w-1.5 h-1.5 rounded-px"
                      style={{ backgroundColor: log.category?.color ?? '#3F3F46' }}
                    />
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
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
        className="font-display font-bold text-2xl"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>
    </div>
  )
}

function EmptyState({
  icon,
  message,
  action,
}: {
  icon: string
  message: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="text-3xl mb-3">{icon}</span>
      <p className="text-sm text-zinc-500 mb-4">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          {action.label} →
        </Link>
      )}
    </div>
  )
}

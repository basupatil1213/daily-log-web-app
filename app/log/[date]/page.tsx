import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, addDays, subDays, isValid } from 'date-fns'
import Link from 'next/link'
import { TimeLog, Category } from '@/types'
import HourGrid from '@/components/HourGrid'

interface Props {
  params: { date: string }
}

export default async function LogPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Validate date
  const dateObj = new Date(params.date + 'T12:00:00')
  if (!isValid(dateObj)) redirect('/dashboard')
  const date = params.date

  // Fetch logs for this date
  const { data: logsData } = await supabase
    .from('time_logs')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('hour')

  // Fetch categories
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  const logs = (logsData as (TimeLog & { category: Category })[]) ?? []
  const categories = (categoriesData as Category[]) ?? []

  const prevDate = format(subDays(dateObj, 1), 'yyyy-MM-dd')
  const nextDate = format(addDays(dateObj, 1), 'yyyy-MM-dd')
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const isCurrentDay = date === todayStr
  const isFuture = date > todayStr

  // Stats
  const logged = logs.length
  const categoryMap = new Map<string, { category: Category; hours: number }>()
  for (const log of logs) {
    if (!log.category) continue
    const existing = categoryMap.get(log.category_id!)
    if (existing) existing.hours += 1
    else categoryMap.set(log.category_id!, { category: log.category, hours: 1 })
  }
  const topCategory = Array.from(categoryMap.values()).sort((a, b) => b.hours - a.hours)[0]

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/dashboard"
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <p className="font-mono text-xs text-zinc-500 tracking-widest uppercase">
            Daily Log
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-100">
              {isCurrentDay ? 'Today — ' : ''}{format(dateObj, 'MMMM d, yyyy')}
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {format(dateObj, 'EEEE')}
              {logged > 0 && (
                <> · <span className="text-zinc-400">{logged}/24 hours logged</span></>
              )}
            </p>
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-1">
            <Link
              href={`/log/${prevDate}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.07] hover:border-white/[0.12] hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            {!isCurrentDay && (
              <Link
                href={`/log/${todayStr}`}
                className="px-3 h-8 flex items-center text-xs font-mono text-zinc-500 hover:text-zinc-300 border border-white/[0.07] hover:border-white/[0.12] rounded-lg transition-all"
              >
                Today
              </Link>
            )}
            <Link
              href={`/log/${nextDate}`}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.07] hover:border-white/[0.12] hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-all ${isFuture ? 'opacity-30 pointer-events-none' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Quick stats bar */}
        {logged > 0 && (
          <div className="flex gap-4 mb-6 p-4 bg-[#111115] border border-white/[0.07] rounded-xl">
            <div>
              <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Logged</div>
              <div className="font-display font-bold text-violet-400">{logged}h</div>
            </div>
            <div className="w-px bg-white/[0.07]" />
            <div>
              <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Remaining</div>
              <div className="font-display font-bold text-zinc-400">{24 - logged}h</div>
            </div>
            {topCategory && (
              <>
                <div className="w-px bg-white/[0.07]" />
                <div>
                  <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Top category</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{topCategory.category.icon}</span>
                    <span className="font-display font-bold text-zinc-300 text-sm">{topCategory.category.name}</span>
                    <span className="font-mono text-xs text-zinc-500">({topCategory.hours}h)</span>
                  </div>
                </div>
              </>
            )}
            {/* Progress bar */}
            <div className="flex-1 flex flex-col justify-center ml-2">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${(logged / 24) * 100}%` }}
                />
              </div>
              <div className="font-mono text-[10px] text-zinc-600 mt-1">
                {Math.round((logged / 24) * 100)}% complete
              </div>
            </div>
          </div>
        )}

        {/* The main 24-hour grid */}
        <HourGrid
          date={date}
          initialLogs={logs}
          categories={categories}
        />
      </div>
    </div>
  )
}

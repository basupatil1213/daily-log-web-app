'use client'

import { useState, useCallback } from 'react'
import { TimeLog, Category } from '@/types'
import { createClient } from '@/lib/supabase/client'
import HourSlot from './HourSlot'
import CategoryPicker from './CategoryPicker'

interface HourGridProps {
  date: string
  initialLogs: (TimeLog & { category?: Category })[]
  categories: Category[]
}

export default function HourGrid({ date, initialLogs, categories }: HourGridProps) {
  const [logs, setLogs] = useState<(TimeLog & { category?: Category })[]>(initialLogs)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const getLogForHour = useCallback(
    (hour: number) => logs.find((l) => l.hour === hour),
    [logs]
  )

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour)
  }

  const handleSave = async (categoryId: string | null, note: string) => {
    if (selectedHour === null) return
    setSaving(true)

    const existingLog = getLogForHour(selectedHour)

    try {
      if (categoryId === null) {
        // Clear this slot
        if (existingLog) {
          await supabase.from('time_logs').delete().eq('id', existingLog.id)
          setLogs((prev) => prev.filter((l) => l.hour !== selectedHour))
        }
      } else if (existingLog) {
        // Update existing
        const { data, error } = await supabase
          .from('time_logs')
          .update({ category_id: categoryId, note: note || null })
          .eq('id', existingLog.id)
          .select('*, category:categories(*)')
          .single()

        if (!error && data) {
          setLogs((prev) =>
            prev.map((l) => (l.hour === selectedHour ? (data as TimeLog & { category: Category }) : l))
          )
        }
      } else {
        // Insert new
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('time_logs')
          .insert({
            user_id: user.id,
            date,
            hour: selectedHour,
            category_id: categoryId,
            note: note || null,
            duration_minutes: 60,
          })
          .select('*, category:categories(*)')
          .single()

        if (!error && data) {
          setLogs((prev) => [...prev, data as TimeLog & { category: Category }])
        }
      }
    } finally {
      setSaving(false)
      setSelectedHour(null)
    }
  }

  const handleClose = () => {
    setSelectedHour(null)
  }

  const loggedCount = logs.length

  return (
    <div className="relative">
      {/* Grid header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
          24-hour timeline
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/10" />
          <span className="font-mono text-xs text-zinc-600">{loggedCount} logged</span>
          <span className="font-mono text-xs text-zinc-700">·</span>
          <div className="w-2 h-2 rounded-full bg-violet-500/60" />
          <span className="font-mono text-xs text-zinc-600">{24 - loggedCount} empty</span>
        </div>
      </div>

      {/* Period labels */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        {[
          { label: 'Night', hours: '00–05', color: '#8B5CF6' },
          { label: 'Morning', hours: '06–11', color: '#F59E0B' },
          { label: 'Afternoon', hours: '12–17', color: '#3B82F6' },
          { label: 'Evening', hours: '18–23', color: '#EC4899' },
        ].map((p) => (
          <div
            key={p.label}
            className="text-center py-1 rounded-md"
            style={{ borderTop: `2px solid ${p.color}20` }}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
              {p.label}
            </span>
          </div>
        ))}
      </div>

      {/* Hour slots */}
      <div className="space-y-1">
        {Array.from({ length: 24 }, (_, hour) => {
          const log = getLogForHour(hour)
          return (
            <HourSlot
              key={hour}
              hour={hour}
              log={log}
              isSelected={selectedHour === hour}
              onClick={() => handleHourClick(hour)}
            />
          )
        })}
      </div>

      {/* Category picker modal */}
      {selectedHour !== null && (
        <CategoryPicker
          hour={selectedHour}
          categories={categories}
          currentLog={getLogForHour(selectedHour)}
          saving={saving}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

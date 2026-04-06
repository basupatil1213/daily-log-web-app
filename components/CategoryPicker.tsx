'use client'

import { useState, useEffect, useRef } from 'react'
import { TimeLog, Category } from '@/types'

interface CategoryPickerProps {
  hour: number
  categories: Category[]
  currentLog?: TimeLog & { category?: Category }
  saving: boolean
  onSave: (categoryId: string | null, note: string) => void
  onClose: () => void
}

function sortCategories(cats: Category[]): Category[] {
  return [...cats].sort((a, b) => {
    if (a.name === 'Other') return 1
    if (b.name === 'Other') return -1
    return a.name.localeCompare(b.name)
  })
}

export default function CategoryPicker({
  hour,
  categories,
  currentLog,
  saving,
  onSave,
  onClose,
}: CategoryPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    currentLog?.category_id ?? null
  )
  const [note, setNote] = useState(currentLog?.note ?? '')
  const sortedCategories = sortCategories(categories)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const hourLabel = `${String(hour).padStart(2, '0')}:00 – ${String(hour + 1).padStart(2, '0')}:00`

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = () => {
    onSave(selectedId, note)
  }

  const handleClear = () => {
    onSave(null, '')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[#18181C] border border-white/[0.1] rounded-2xl shadow-2xl animate-slide-up overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.07]">
          <div>
            <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">
              Log hour
            </div>
            <h3 className="font-display font-semibold text-zinc-100 text-lg">
              {hourLabel}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Categories grid */}
        <div className="p-4">
          <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest mb-3">
            Select category
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {sortedCategories.map((cat) => {
              const isActive = selectedId === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedId(isActive ? null : cat.id)}
                  className={`
                    flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left
                    transition-all duration-100
                    ${isActive
                      ? 'border-current text-current'
                      : 'border-white/[0.06] text-zinc-400 hover:border-white/[0.1] hover:text-zinc-200 hover:bg-white/[0.03]'
                    }
                  `}
                  style={
                    isActive
                      ? {
                          borderColor: `${cat.color}50`,
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                        }
                      : undefined
                  }
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium truncate">{cat.name}</span>
                  {isActive && (
                    <svg
                      className="w-3.5 h-3.5 ml-auto shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Note input */}
        <div className="px-4 pb-4">
          <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest mb-2">
            Note (optional)
          </div>
          <textarea
            ref={noteRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you do this hour?"
            rows={2}
            className="w-full bg-[#111115] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-violet-500/40 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 pb-4">
          {currentLog && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedId || saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all duration-150"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

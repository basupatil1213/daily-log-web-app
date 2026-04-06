export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  created_at: string
}

export interface TimeLog {
  id: string
  user_id: string
  date: string // YYYY-MM-DD
  hour: number // 0–23
  category_id: string | null
  note: string | null
  duration_minutes: number
  created_at: string
  category?: Category
}

export interface DaySummary {
  date: string
  total_logged: number
  by_category: { category: Category; hours: number }[]
}

export interface WeekDay {
  date: string
  label: string
  logs: TimeLog[]
}

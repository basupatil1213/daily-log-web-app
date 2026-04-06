import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options?: Parameters<typeof cookieStore.set>[2]
          }>
        ) {
          try {
            cookiesToSet.forEach(
              ({
          name,
          value,
          options,
              }: {
          name: string
          value: string
          options?: Parameters<typeof cookieStore.set>[2]
              }) => cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — cookie writes are handled by middleware
          }
        },
      },
    }
  )
}

import type { Metadata } from 'next'
import { Syne, DM_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500'],
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: 'Chronicle — Daily Time Tracker',
  description: 'Understand where your time goes. A daily hourly log for building better habits.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans bg-bg text-zinc-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}

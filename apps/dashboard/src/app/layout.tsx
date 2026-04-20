import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NORA AI — Command Center',
  description: 'NORA AI Phase 1 — Pilot Mode, No-Stop Queue, HumanLoop, Multi-User',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

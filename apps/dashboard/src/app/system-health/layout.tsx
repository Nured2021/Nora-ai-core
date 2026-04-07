import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'System Health — NORA' }
export default function SystemHealthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

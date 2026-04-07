import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Approvals — NORA' }
export default function ApprovalsCenterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
